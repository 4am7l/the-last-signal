import {useElevation} from './useElevation';
import {elevationAt} from './elevation';
import {useSimulation,useEphemeris,PRESETS} from './simulation';
import {solarIrradiance} from './science';
import {bodyOrientation} from './orientation';
import {SurfaceNavigation} from './SurfaceNavigation';
import {Suspense,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as T from 'three';
import {Atmosphere,point} from './Planet';
import {usePlanetTexture} from './usePlanetTexture';
import {useTrekPatch,type TrekPatch} from './useTrekPatch';
import {SUN_DIRECTION,SCENE_SUN_DIRECTION} from './solar';
import {surfaceDetail,noise3,cameraTuning} from './sceneMath';
import type {Destination} from './navigation';
import {createMarsRelief} from './marsGeology';
import {MarsRocks} from './MarsSurfaceDetails';
import {EagleModel} from './EagleModel';
import {eagle} from './eagle';
import {LunarRocks} from './LunarSurfaceDetails';
import {MOON_RENDER_RADIUS as R,MOON_RADIUS_METRES,MARS_RADIUS_METRES,localRelief,ringAngle} from './lunarTerrain';
// Resolve the terrain around a neutral descent point on each body.
export function SurfaceWorld({mode,body,reset}: {mode:'planet'|'surface';body:Destination;reset:number}){
 const lat=body==='moon'?eagle.latitude:0,lon=body==='moon'?eagle.longitude:0;
 const landingRadius=9;
 const surfaceDistance=body==='moon'?eagle.footpadSpan*3:24;
 const focusHeight=body==='moon'?eagle.footpadSpan*.22:1.7;
 const settings=useSimulation(),preset=PRESETS[settings.quality],ephemeris=useEphemeris(settings.date);
 const bodyToSystem=useMemo(()=>bodyOrientation(body,ephemeris.epoch),[body,ephemeris.epoch]);
 const moon=body==='moon',radiusMetres=moon?MOON_RADIUS_METRES:MARS_RADIUS_METRES,UNIT=R/radiusMetres;
 const [close,setClose]=useState(moon&&mode==='surface');
 const incomingDem=useElevation(body),heldDem=useRef({body:body,grid:incomingDem});
 if((mode==='planet'&&!close)||heldDem.current.body!==body)heldDem.current={body:body,grid:incomingDem};
 const dem=heldDem.current.grid;
 const controls=useRef<Controls>(null);
 const {camera,scene,size}=useThree();
 const orbitFraming=Math.max(1,.9*size.height/Math.max(size.width,1));
 const coarsePointer=typeof window!=='undefined'&&window.matchMedia('(pointer: coarse)').matches;
 // Resolve the best available orbital imagery while still in overview, not
 // in the middle of a guided landing animation.
 const map=usePlanetTexture(body,true);
 const nasaPatch=useTrekPatch(body,lat,lon,true);
 const nasaPatchFade=useMemo(()=>({value:0}),[body]);
 const height=useLoader(T.TextureLoader,'/moon-height.jpg');
 // Image readback allocates a full RGBA buffer. Reuse it when the site,
 // quality or DEM changes; only the lunar fallback samples these pixels.
 const heightPixels=useMemo(()=>{
  const image=height.image as HTMLImageElement,c=document.createElement('canvas');
  c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);
  return {width:c.width,height:c.height,pixels:ctx.getImageData(0,0,c.width,c.height).data};
 },[height]);
 const marsReliefAt=useMemo(()=>createMarsRelief(lat,lon,landingRadius),[lat,lon,landingRadius]);
 // This is one continuous spherical heightfield at every altitude. Only
 // small decorative rocks are gated by proximity; the globe never swaps meshes.
 const globeOnly=!close;
 const surface=useMemo(()=>{
  const {width,height:pixelHeight,pixels}=heightPixels;
  const q=new T.Quaternion().setFromUnitVectors(point(lat,lon,1),new T.Vector3(0,1,0)),inv=q.clone().invert();
  function sample(n:T.Vector3){const local=n.clone().applyQuaternion(inv);const u=((Math.atan2(-local.z,local.x)/(2*Math.PI)+.5)%1+1)%1,v=Math.acos(T.MathUtils.clamp(local.y,-1,1))/Math.PI;
   const x=u*width-.5,y=T.MathUtils.clamp(v*pixelHeight-.5,0,pixelHeight-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
   const at=(a:number,b:number)=>pixels[(Math.min(pixelHeight-1,b)*width+(a%width+width)%width)*4]/255;
   return {u,v:1-v,h:dem?elevationAt(dem,Math.asin(local.y)*180/Math.PI,Math.atan2(-local.z,local.x)*180/Math.PI)*UNIT:moon?(T.MathUtils.lerp(T.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),T.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy)-.5)*2.1:0};
  }
  const base=sample(new T.Vector3(0,1,0)).h;
  const detailAt=(x:number,z:number)=>{
   const distance=Math.hypot(x,z);
   // No visual displacement exists beyond these radii. Avoid thousands of
   // noise evaluations on the far hemisphere during the initial render.
   if(distance>(moon?4000:13500))return 0;
   const pad=2;
   const fade=T.MathUtils.smoothstep(distance,pad,pad+4)*(1-T.MathUtils.smoothstep(distance,800,1600));
   const soil=(noise3(x*1.8,3,z*1.8)*.055+noise3(x*.35,9,z*.35)*.16+noise3(x*.07,5,z*.07)*.32)*fade;
   if(moon){
    // Geometry displacement at short range, rather than just magnified pixels.
    // Blend the fine detail around the camera target.
    const closeMicro=(noise3(x*1.7,27,z*1.7)*.075+
     noise3(x*4.8,41,z*4.8)*.022+
     noise3(x*10.5,59,z*10.5)*.006)*
     T.MathUtils.smoothstep(distance,pad+2,pad+10)*
     (1-T.MathUtils.smoothstep(distance,170,480));
    return localRelief(x,z)+surfaceDetail(x,z,'moon')*.36+soil*.45+closeMicro;
   }
   const nearBlend=T.MathUtils.smoothstep(distance,landingRadius,landingRadius+28);
   // Resolve metre- and decimetre-scale rock chips geometrically near the
   // camera.
   const closeDetail=T.MathUtils.smoothstep(distance,pad+2,pad+10)*
    (1-T.MathUtils.smoothstep(distance,180,430));
   const stoneGrain=(noise3(x*.83,31,z*.83)*.105+
    noise3(x*2.7,37,z*2.7)*.022)*closeDetail;
   const closeMicro=(noise3(x*1.4,43,z*1.4)*.085+
    noise3(x*4.1,51,z*4.1)*.025+
    noise3(x*9.8,63,z*9.8)*.007)*
    T.MathUtils.smoothstep(distance,pad+2,pad+10)*
    (1-T.MathUtils.smoothstep(distance,180,530));
   return marsReliefAt(x,z)+
    (surfaceDetail(x,z,'mars')*.33+soil*.31)*nearBlend+stoneGrain+closeMicro;
  };
  // Quality-aware, bounded tessellation. This raises angular detail around both
  // landings without the large draw overhead of doubling mesh dimensions.
  const tessellationBoost=coarsePointer?1.06:settings.quality==='ultra'?1.19:settings.quality==='high'?1.20:1.13;
  const rings=Math.round(preset.rings*tessellationBoost);
  const sectors=Math.round(preset.sectors*tessellationBoost);
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  // Concentrate radial detail near the surface and preserve far hemisphere.
  const nearRings=moon?Math.round(rings*.72):Math.round(rings*.76);
  for(let j=0;j<=rings;j++){const a=ringAngle(j,nearRings,rings-nearRings,radiusMetres);
   for(let i=0;i<=sectors;i++){const b=i/sectors*Math.PI*2,n=new T.Vector3(Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b));const s=sample(n);
    // Local crater bowls and rims are illustrative and fade into the mapped globe.
    const x=n.x*radiusMetres,z=n.z*radiusMetres,detail=n.y>0?detailAt(x,z):0;
    const h=s.h;const p=n.multiplyScalar(R+h+detail*UNIT);p.y-=R+base;positions.push(p.x,p.y,p.z);uv.push(s.u,s.v);
    if(j<rings&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+1,k+sectors+1,k+1,k+sectors+2,k+sectors+1)}
   }
  }
  // Keep the indexed globe mesh: converting every triangle to three unique
  // vertices used roughly 3x the vertex memory and upload bandwidth.
  // Compute normals on shared vertices for smooth shading, then duplicate only
  // seam-crossing triangles so the moon's equirectangular UV cannot wrap.
  const working=new T.BufferGeometry();
  working.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  working.setIndex(indices);
  working.computeVertexNormals();
  const sourceNormals=working.getAttribute('normal') as T.BufferAttribute;
  const normals=Array.from(sourceNormals.array as Float32Array);
  working.dispose();
  const originalTriangles=indices.length;
  for(let k=0;k<originalTriangles;k+=3){
   const v0=indices[k],v1=indices[k+1],v2=indices[k+2];
   const u0=uv[v0*2],u1=uv[v1*2],u2=uv[v2*2];
   if(Math.max(u0,u1,u2)-Math.min(u0,u1,u2)<=.5)continue;
   for(let corner=0;corner<3;corner++){
    const vertex=indices[k+corner];
    positions.push(positions[vertex*3],positions[vertex*3+1],positions[vertex*3+2]);
    uv.push(uv[vertex*2]+(uv[vertex*2]<.5?1:0),uv[vertex*2+1]);
    normals.push(normals[vertex*3],normals[vertex*3+1],normals[vertex*3+2]);
    indices[k+corner]=positions.length/3-1;
   }
  }
  const out=new T.BufferGeometry();
  out.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  out.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  out.setIndex(indices);
  return {ground:(x:number,z:number)=>{const n=new T.Vector3(x*UNIT,R,z*UNIT).normalize();const h=sample(n).h;return (R+h+detailAt(x,z)*UNIT)*n.y-R-base},rotation:q,geometry:out,center:new T.Vector3(0,-R-base,0),base};
 },[heightPixels,lat,lon,moon,radiusMetres,UNIT,body,preset,dem,marsReliefAt,landingRadius,coarsePointer,settings.quality]);
 useEffect(()=>()=>surface.geometry.dispose(),[surface]);
 const localRotation=useMemo(()=>surface.rotation.clone().multiply(bodyToSystem.clone().invert()),[surface,bodyToSystem]);
 const localSun=useMemo(()=>new T.Vector3(...ephemeris[body]).negate().normalize().applyQuaternion(localRotation),[ephemeris,body,localRotation]);
 // Local horizon determines whether direct sunlight or a faint cinematic night fill is active.
 const daylight=T.MathUtils.smoothstep(localSun.y,-.035,.055);
 const night=1-daylight;
 const nightDirection=useMemo(()=>new T.Vector3(-.35,.82,.45).normalize(),[]);
 const flight=useRef<{from:T.Vector3;target:T.Vector3;to:T.Vector3;look:T.Vector3;t:number;stage:'orbit'|'align'|'descent'}|null>(null),guided=useRef(false);
 const descentArmed=useRef(true);
 const previousDistance=useRef(Infinity),sky=useMemo(()=>new T.Color('#05070d'),[]),marsDaySky=useMemo(()=>new T.Color('#a17c69'),[]),marsTwilight=useMemo(()=>new T.Color('#74616b'),[]),marsNightSky=useMemo(()=>new T.Color('#111522'),[]),marsFog=useMemo(()=>new T.Color(),[]);
 useLayoutEffect(()=>{
  const ctl=controls.current;if(!ctl)return;
  camera.up.set(0,1,0); // Each body now owns an independent local scene.
  camera.far=10000;camera.near=.000005;camera.updateProjectionMatrix();
  guided.current=mode==='surface';
  setClose(false);
  const near=guided.current,reframe=near&&camera.position.length()<5;
  const focusPosition=new T.Vector3(22,9,32).normalize().multiplyScalar(surfaceDistance*UNIT),focusTarget=new T.Vector3(0,focusHeight*UNIT,0);
  const orbitOffset=new T.Vector3(160,170,680).sub(surface.center);
  const globeDistance=orbitOffset.length()*orbitFraming;
  const globePosition=orbitOffset.multiplyScalar(orbitFraming).add(surface.center);
  flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:reframe?focusPosition:near?new T.Vector3(0,150,250):globePosition,look:reframe?focusTarget:surface.center.clone(),t:0,stage:reframe?'descent':near?'align':'orbit'};
  previousDistance.current=Infinity;descentArmed.current=true;
  ctl.enabled=false;ctl.minDistance=.000001;ctl.maxDistance=Math.max(1800,globeDistance);
  if(mode==='planet')ctl.maxPolarAngle=Math.PI-.02;
 },[mode,reset,camera,surface,orbitFraming,UNIT,surfaceDistance,focusHeight]);
 useEffect(()=>{
  SCENE_SUN_DIRECTION.copy(localSun);
  scene.userData.skyRotation=localRotation.clone();
 },[scene,localSun,localRotation]);
 useEffect(()=>()=>{camera.up.set(0,1,0);SCENE_SUN_DIRECTION.copy(SUN_DIRECTION);delete scene.userData.skyRotation;scene.userData.skyVisibility=1},[scene]);
 useEffect(()=>{scene.userData.skyVisibility=1;scene.fog=null;if(scene.background instanceof T.Color)scene.background.copy(sky);return()=>{scene.fog=null;if(scene.background instanceof T.Color)scene.background.set('#eef3fc')}},[scene,sky]);
 useFrame((_,dt)=>{const ctl=controls.current;if(!ctl)return;
  scene.userData.terrainSource=dem?dem.source:'تعذّر تحميل DEM — سطح تقريبي';
  scene.userData.altitude=Math.max(0,(camera.position.y-surface.ground(camera.position.x/UNIT,camera.position.z/UNIT))/UNIT);
  // Tile downloads may finish at any time: reveal new NASA detail gently
  // so an asynchronous image never produces another visual pop.
  nasaPatchFade.value=T.MathUtils.damp(nasaPatchFade.value,nasaPatch?1:0,2.1,Math.min(dt,.05));
  if(mode==='surface'&&settings.navigation!=='orbit'&&close&&!flight.current)return;
  camera.up.lerp(T.Object3D.DEFAULT_UP,1-Math.exp(-Math.min(dt,.05)*6)).normalize();
  ctl.enabled=!flight.current&&(mode==='planet'||settings.navigation==='orbit'||!close);
  if(flight.current){ctl.minDistance=.000001;const f=flight.current;f.t=Math.min(1,f.t+Math.min(dt,.05)/(f.stage==='descent'?5:2));if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)f.t=1;const s=f.t*f.t*(3-2*f.t);
   if(f.stage==='descent'){const ratio=Math.pow(f.to.length()/Math.max(f.from.length(),.00001),s);camera.position.copy(f.from).multiplyScalar(ratio).lerp(f.to,s);ctl.target.copy(f.target).multiplyScalar(ratio*(1-s)).addScaledVector(f.look,s)}
   else{const a=f.from.clone().sub(surface.center),b=f.to.clone().sub(surface.center);const q=new T.Quaternion().setFromUnitVectors(a.clone().normalize(),b.clone().normalize());const turn=new T.Quaternion().slerp(q,s);const distance=T.MathUtils.lerp(a.length(),b.length(),s);camera.position.copy(a.normalize().applyQuaternion(turn)).multiplyScalar(f.stage==='align'?Math.max(430,distance):distance).add(surface.center);ctl.target.lerpVectors(f.target,f.look,s)}
   ctl.update();if(f.t===1){flight.current=f.stage==='align'?{from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(22,9,32).normalize().multiplyScalar(surfaceDistance*UNIT),look:new T.Vector3(0,focusHeight*UNIT,0),t:0,stage:'descent'}:null}
  }else{let distance=camera.position.distanceTo(surface.center);if(!guided.current&&distance<R+5){camera.position.sub(surface.center).normalize().multiplyScalar(R+5).add(surface.center);distance=R+5;ctl.update()}if(distance>500)descentArmed.current=true;if(!guided.current&&descentArmed.current&&distance<430&&distance<previousDistance.current-.00001){guided.current=true;flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(0,150,250),look:surface.center.clone(),t:0,stage:'align'}}previousDistance.current=distance}
  // Return to globe-centred orbit before surface orbit can swing through the planet.
  if(guided.current&&!flight.current&&camera.position.length()>R*.35){
   guided.current=false;descentArmed.current=false;ctl.target.copy(surface.center);
   ctl.minDistance=R+5;ctl.maxPolarAngle=Math.PI-.02;ctl.update();
  }
  if(guided.current&&Math.hypot(camera.position.x,camera.position.z)<24000*UNIT){const floor=surface.ground(camera.position.x/UNIT,camera.position.z/UNIT)+.6*UNIT;if(camera.position.y<floor){camera.position.y=floor;ctl.update()}}
  const altitude=Math.max(0,camera.position.distanceTo(surface.center)-surface.center.length());const nearSite=camera.position.length()<5000*UNIT;
  if(nearSite!==close)setClose(nearSite);
  const daylight=T.MathUtils.smoothstep(localSun.y,-.15,.25);
  scene.userData.skyVisibility=1;
  if(moon){
   scene.fog=null;
   if(scene.background instanceof T.Color)scene.background.copy(sky);
  }else{
   const haze=1-T.MathUtils.smoothstep(altitude,3000*UNIT,18000*UNIT);
   const dusk=T.MathUtils.smoothstep(localSun.y,-.12,.22);
   const darkness=T.MathUtils.smoothstep(localSun.y,-.26,-.06);
   marsFog.copy(marsDaySky).lerp(marsTwilight,dusk).lerp(marsNightSky,darkness);
   const skyHaze=haze*daylight;
   scene.userData.skyVisibility=1-skyHaze*.46;
   if(scene.background instanceof T.Color)scene.background.copy(sky).lerp(marsFog,skyHaze*.24);
   if(haze>.01){
    if(!(scene.fog instanceof T.FogExp2))scene.fog=new T.FogExp2(marsFog,0);
    const fog=scene.fog as T.FogExp2;
    fog.color.copy(marsFog);
    fog.density=haze*(.45+.55*daylight)/(14000*UNIT);
   }else scene.fog=null;
  }
  if(close&&!flight.current){const limit=250*UNIT;ctl.target.x=T.MathUtils.clamp(ctl.target.x,-limit,limit);ctl.target.z=T.MathUtils.clamp(ctl.target.z,-limit,limit);ctl.target.y=Math.max(ctl.target.y,surface.ground(ctl.target.x/UNIT,ctl.target.z/UNIT)+.25*UNIT);}
  const tuning=cameraTuning(altitude,R,guided.current);
  ctl.rotateSpeed=tuning.rotate*(coarsePointer?1.35:1);ctl.zoomSpeed=tuning.zoom*(coarsePointer?1.5:1);ctl.panSpeed=tuning.pan;
  ctl.enablePan=nearSite&&!flight.current;
  if(!flight.current)ctl.minDistance=guided.current?1.2*UNIT:R+5;
  ctl.maxPolarAngle=nearSite&&flight.current?.stage!=='orbit'?Math.PI/2-.035:Math.PI-.02;
  const distance=camera.position.distanceTo(ctl.target),near=Math.max(.000005,Math.min(.1,distance/10000));if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
 });
 return <>
  <SurfaceNavigation active={mode==='surface'&&close&&!flight.current} body={body} unit={UNIT} ground={surface.ground} center={surface.center} clearance={moon?eagle.footpadSpan/2:0}/><OrbitControls ref={controls} makeDefault enabled={mode==='planet'||settings.navigation==='orbit'||!close||!!flight.current} enableDamping dampingFactor={.085} rotateSpeed={coarsePointer?.65:.4} enablePan={close} screenSpacePanning={false} panSpeed={.4} minPolarAngle={.04} maxPolarAngle={close?Math.PI/2-.035:Math.PI-.02} minDistance={1.2*UNIT} maxDistance={Math.max(1800,950*orbitFraming)} zoomSpeed={.6} onStart={()=>{if(flight.current){descentArmed.current=false;guided.current=flight.current.stage==='descent';}flight.current=null;}}/>{/* Uniform bounced light lifts the unlit terrain without introducing a second shadow direction. */}<ambientLight intensity={daylight*(moon?.26:.34)+night*(moon?.028:.045)} color={moon?'#c3d0e5':'#e6c6ae'}/><hemisphereLight args={[moon?'#c8d6ee':'#e9c6aa',moon?'#798295':'#9b7360',daylight*(moon?.14:.19)+night*.018]}/>{night>.001&&<directionalLight castShadow position={nightDirection.clone().multiplyScalar(350*UNIT)} color={moon?'#a8c5ee':'#b4c5dc'} intensity={night*(moon?.13:.095)} shadow-mapSize={[preset.shadows,preset.shadows]} shadow-camera-left={-90*UNIT} shadow-camera-right={90*UNIT} shadow-camera-top={90*UNIT} shadow-camera-bottom={-90*UNIT} shadow-camera-near={10*UNIT} shadow-camera-far={900*UNIT} shadow-normalBias={.004*UNIT} shadow-bias={-.000015} shadow-radius={0}/>}<directionalLight castShadow position={localSun.clone().multiplyScalar(350*UNIT)} color={moon?'#fff8ee':'#fff0dc'} intensity={4.0*solarIrradiance(ephemeris[body])/1361} shadow-mapSize={[preset.shadows,preset.shadows]} shadow-camera-left={-90*UNIT} shadow-camera-right={90*UNIT} shadow-camera-top={90*UNIT} shadow-camera-bottom={-90*UNIT} shadow-camera-near={10*UNIT} shadow-camera-far={900*UNIT} shadow-bias={-.000015} shadow-normalBias={.004*UNIT} shadow-radius={0}/><mesh geometry={surface.geometry} receiveShadow><RegolithMaterial map={map} nasaPatch={nasaPatch} nasaPatchFade={nasaPatchFade} unit={UNIT} moon={moon} centerY={surface.center.y} rotation={surface.rotation} landingRadius={landingRadius}/></mesh>{globeOnly ? null : moon
    ? <LunarRocks ground={surface.ground} unit={UNIT} clearance={6} count={preset.rocks}/>
    : <MarsRocks ground={surface.ground} unit={UNIT} clearance={3} count={preset.rocks} lat={lat} lon={lon} landingRadius={landingRadius}/>}
   {moon&&(mode==='surface'||close)&&<Suspense fallback={null}><EagleModel unit={UNIT} ground={surface.ground} night={night}/></Suspense>}
   {!moon && <group position={surface.center}><Atmosphere r={R}/></group>}
 </>;
}

function RegolithMaterial({map,nasaPatch,nasaPatchFade,unit,moon,centerY,rotation,landingRadius}:{map:T.Texture;nasaPatch:TrekPatch|null;nasaPatchFade:{value:number};unit:number;moon:boolean;centerY:number;rotation:T.Quaternion;landingRadius:number}){
 const material=useMemo(()=>{
  const mat=new T.MeshStandardMaterial({map,roughness:1,metalness:0});
  mat.customProgramCacheKey=()=>moon?('moon-continuous-v7-'+Boolean(nasaPatch)):('mars-continuous-v7-'+landingRadius.toFixed(2)+'-'+Boolean(nasaPatch));
  mat.onBeforeCompile=shader=>{
   if(!moon){
    shader.uniforms.marsCenterY={value:centerY};
    shader.uniforms.marsToPlanet={value:new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(rotation.clone().invert()))};
   }
   shader.vertexShader='varying vec3 lunarPosition;\n'+(moon?'':'uniform float marsCenterY;\nvarying vec3 marsFaceView;\nvarying vec3 marsRadialView;\n')+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlunarPosition=position;'+(moon?'':`\nmarsFaceView=normalize(normalMatrix*normal);\nmarsRadialView=normalize(normalMatrix*normalize(position-vec3(0.,marsCenterY,0.)));`));
   shader.fragmentShader='varying vec3 lunarPosition;\n'+(moon?'':'uniform float marsCenterY;\nuniform mat3 marsToPlanet;\nvarying vec3 marsFaceView;\nvarying vec3 marsRadialView;\n')+'float lunarHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }\nfloat soilNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lunarHash(i),lunarHash(i+vec2(1.,0.)),f.x),mix(lunarHash(i+vec2(0.,1.)),lunarHash(i+vec2(1.)),f.x),f.y);}\n'+shader.fragmentShader.replace('#include <map_fragment>',moon?'#include <map_fragment>':`#ifdef USE_MAP
 // Per-fragment global equirectangular UV. The landing-site ring vertices
 // cross longitude seams and cannot safely interpolate their baked UV values.
 vec3 nativeMars=normalize(marsToPlanet*(lunarPosition-vec3(0.,marsCenterY,0.)));
 vec2 marsUv=vec2(.5+atan(-nativeMars.z,nativeMars.x)/6.28318530718,
                  .5+asin(clamp(nativeMars.y,-1.,1.))/3.14159265359);
 diffuseColor*=texture2D(map,marsUv);
#endif`).replace('#include <color_fragment>',`#include <color_fragment>
vec2 metres=lunarPosition.xz / ${unit.toFixed(12)};
float footprint=max(length(dFdx(metres)),length(dFdy(metres)));
// One geographical photo map is used from orbit to landing. Real mapped
// albedo remains the base colour at every altitude; procedural sediment only
// supplies spatial frequencies beyond the orbiting camera's source resolution.
// Each scale is individually screen-space filtered to prevent shimmer.
float macroFade=1.-smoothstep(1200.,12000.,footprint);
float localFade=1.-smoothstep(25.,1400.,footprint);
float macroTone=macroFade>0.?soilNoise(metres*.00045+vec2(29.,13.))-.5:0.;
diffuseColor.rgb*=1.+macroTone*.12*macroFade;
// Distant fragments have zero local detail weight: skip its noise work.
if(localFade>0.){
float grain=soilNoise(metres*48.)-.5;
float strata=(soilNoise(metres*.7)-.5)*2.;
float dust=soilNoise(metres*5.)-.5;
// Never replace planetary imagery with an unrelated flat grey/red surface.
// Preserve large-scale lunar mare / Martian albedo across the full approach.
diffuseColor.rgb*=1.+localFade*(grain*${moon?'.42':'.23'}*(1.-smoothstep(.01,.1,footprint))+dust*${moon?'.28':'.17'}*(1.-smoothstep(.2,2.,footprint))+strata*${moon?'.15':'.09'}*(1.-smoothstep(1.,8.,footprint)));
 ${moon?`// Lunar terrain: grey, powdery lunar regolith and sparse dark mare basalt.
 // All the new detail is derived from metres near the landing site and
 // antialiased by the screen-space footprint; the orbital map stays intact.
 float mareBasalt=smoothstep(.62,.9,soilNoise(metres*.26+vec2(9.,7.)));
 float lunarDust=soilNoise(metres*.82+vec2(-3.,17.));
 vec3 ashDust=mix(vec3(.285,.281,.27),vec3(.41,.399,.379),lunarDust);
 diffuseColor.rgb*=1.+localFade*(lunarDust-.5)*.22;
 diffuseColor.rgb*=1.-localFade*mareBasalt*.18;
 float basaltFlecks=smoothstep(.75,.94,soilNoise(metres*11.2+vec2(7.,-11.)));
 float lightGrit=smoothstep(.79,.95,soilNoise(metres*28.5+vec2(12.,3.)));
 float grainFade=(1.-smoothstep(.035,.3,footprint))*localFade;
 diffuseColor.rgb*=1.+grainFade*(lightGrit*.13-basaltFlecks*.15);
 `:''}
 ${moon?'':`// Mars: red oxidised dust over darker exposed basalt, plus wind-carved sand bands.
 float marsDust=soilNoise(metres*.24+vec2(10.,-4.));
 float basaltPatch=smoothstep(.57,.87,soilNoise(metres*.13+vec2(6.,17.)));
 float windBands=sin(metres.x*8.5+metres.y*2.5+soilNoise(metres*.32)*2.2);
 float finerSoil=soilNoise(metres*2.1+vec2(4.,8.))-.5;
 diffuseColor.rgb*=1.+localFade*(marsDust-.5)*.16;
 diffuseColor.rgb*=1.-localFade*basaltPatch*.18;
 diffuseColor.rgb*=1.+localFade*(windBands*.032*(1.-smoothstep(.1,.6,footprint))+finerSoil*.065*(1.-smoothstep(.05,.4,footprint)));
 // Cliff and ridge surfaces expose darker fractured rock rather than dusty sand.
 // Compare the actual geometry normal to the globe's outward radial normal.
 float marsSlope=1.-abs(dot(normalize(marsFaceView),normalize(marsRadialView)));
 float slopeRock=smoothstep(.055,.28,marsSlope);
 float marsElevation=(length(lunarPosition-vec3(0.,marsCenterY,0.))-${R.toFixed(3)})/${unit.toFixed(12)};
 float highRock=smoothstep(65.,260.,marsElevation);
 float rockStrata=sin(marsElevation*.14+soilNoise(metres*.045+vec2(7.,-3.))*2.6);
 float rockGrain=soilNoise(metres*.22+vec2(19.,4.))-.5;
 vec3 rockColor=mix(vec3(.18,.15,.14),vec3(.39,.29,.23),clamp(.51+rockStrata*.19+rockGrain*.26,0.,1.));
 float outcrop=clamp(max(slopeRock*.94,highRock*.68)+(soilNoise(metres*.024)-.5)*.18,0.,.95);
 diffuseColor.rgb*=1.-outcrop*localFade*.27;
 // Dusty oxide regolith, wind-graded sand and exposed rock are distinct
 // materials at walking distance; keep the NASA global colour when far away.
 float broadOxide=soilNoise(metres*.083+vec2(7.,-12.));
 float sandyPatch=soilNoise(metres*.44+vec2(-5.,9.));
 float brokenBasalt=soilNoise(metres*1.15+vec2(21.,2.));
 vec3 soilTone=mix(vec3(.30,.195,.144),vec3(.57,.365,.245),smoothstep(.22,.76,broadOxide));
 soilTone=mix(soilTone,vec3(.255,.215,.195),smoothstep(.63,.87,brokenBasalt)*.30);
 float groundDust=localFade*(.20+.26*sandyPatch)*(1.-outcrop*.7);
 diffuseColor.rgb*=1.+(sandyPatch-.5)*groundDust*.26;
 float sandGrains=soilNoise(metres*32.2+vec2(6.,18.))-.5;
 float gritGrains=soilNoise(metres*107.7+vec2(14.,-9.))-.5;
 diffuseColor.rgb*=1.+localFade*(sandGrains*.18*(1.-smoothstep(.025,.12,footprint))
   +gritGrains*.13*(1.-smoothstep(.006,.038,footprint)));
 // Close-up pebble grit and darker eroded basalt, fading at a distance.
 float speckles=smoothstep(.65,.91,soilNoise(metres*9.7+vec2(18.,-7.)));
 float scatteredRubble=smoothstep(.48,.83,soilNoise(metres*.75+vec2(-8.,3.)));
 vec3 pebbleColor=mix(vec3(.24,.19,.17),vec3(.54,.35,.25),soilNoise(metres*2.6));
 diffuseColor.rgb*=1.-speckles*(.08+.14*scatteredRubble)*localFade*(1.-smoothstep(.06,.6,footprint));
 `}
 }
 `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
vec2 detailMetres=lunarPosition.xz / ${unit.toFixed(12)};
float detailFootprint=max(length(dFdx(detailMetres)),length(dFdy(detailMetres)));
float relief=0.;
if(detailFootprint<12.){
relief=(soilNoise(detailMetres*48.)-.5)*${moon?'.006':'.0045'}*(1.-smoothstep(.008,.045,detailFootprint));
relief+=(soilNoise(detailMetres*9.)-.5)*${moon?'.025':'.017'}*(1.-smoothstep(.04,.22,detailFootprint));
 ${moon?`relief+=(soilNoise(detailMetres*27.+vec2(4.,-9.))-.5)*.007*(1.-smoothstep(.015,.09,detailFootprint));
relief+=(soilNoise(detailMetres*3.3+vec2(8.,11.))-.5)*.025*(1.-smoothstep(.12,.55,detailFootprint));`:''}
 ${moon?'':`relief+=(soilNoise(detailMetres*24.+vec2(7.,9.))-.5)*.008*(1.-smoothstep(.018,.11,detailFootprint));
relief+=(soilNoise(detailMetres*3.2+vec2(-5.,13.))-.5)*.037*(1.-smoothstep(.11,.65,detailFootprint));`}
relief+=(soilNoise(detailMetres*1.4)-.5)*${moon?'.082':'.056'}*(1.-smoothstep(.3,1.5,detailFootprint));
 ${moon?`relief+=(soilNoise(detailMetres*6.4+vec2(2.,-7.))-.5)*.012*(1.-smoothstep(.045,.22,detailFootprint));
relief+=(soilNoise(detailMetres*18.0+vec2(11.,5.))-.5)*.004*(1.-smoothstep(.01,.08,detailFootprint));`:`relief+=(soilNoise(detailMetres*5.6+vec2(3.,-8.))-.5)*.010*(1.-smoothstep(.05,.24,detailFootprint));
relief+=(soilNoise(detailMetres*16.5+vec2(9.,6.))-.5)*.0035*(1.-smoothstep(.012,.085,detailFootprint));`}
 ${moon?'':`// Additional fractured normal relief on steep Martian rock faces.
 float rockFace=1.-abs(dot(normalize(marsFaceView),normalize(marsRadialView)));
 float fractureRelief=(soilNoise(detailMetres*.2+vec2(5.,7.))-.5)*.18+
  (soilNoise(detailMetres*.9+vec2(11.,1.))-.5)*.06;
 relief+=fractureRelief*smoothstep(.05,.28,rockFace)*(1.-smoothstep(1.5,12.,detailFootprint));`}
 
 ${moon?'':`relief+=sin(detailMetres.x*8.+detailMetres.y*2.2+soilNoise(detailMetres*.35)*1.7)*.0024*(1.-smoothstep(.06,.4,detailFootprint));`}
}
// Derivatives stay outside the branch for continuous filtered normals.
vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition);
vec3 rx=cross(sy,normal),ry=cross(normal,sx);
float detailDet=dot(sx,rx);
vec3 gradient=sign(detailDet)*(dFdx(relief)*rx+dFdy(relief)*ry)*${unit.toFixed(12)};
normal=normalize(abs(detailDet)*normal-gradient+normal*1.e-20);
`);
   // NASA Trek WAC/Viking WMTS tiles add real crater and albedo detail at
   // intermediate scales. The same geodetic UV as the orbital map guarantees
   // the imagery cannot jump to an unrelated piece of ground. No patch is
   // required to render: the bundled globe image is always the fallback.
   if(nasaPatch){
    shader.uniforms.trekAtlas={value:nasaPatch.texture};
    shader.uniforms.trekRegion={value:nasaPatch.extent};
    shader.uniforms.trekFade=nasaPatchFade;
    const geodeticUv=moon?'vMapUv':'marsUv'; 
    const patchFragment=[
     'vec2 siteMapUv='+geodeticUv+';',
     'vec2 nasaUv=(siteMapUv-trekRegion.xy)/trekRegion.zw;',
     'float blendX=smoothstep(.02,.11,nasaUv.x)*(1.-smoothstep(.89,.98,nasaUv.x));',
     'float blendY=smoothstep(.02,.11,nasaUv.y)*(1.-smoothstep(.89,.98,nasaUv.y));',
     'float siteBlend=clamp(blendX*blendY,0.,1.)*trekFade;',
     'if(siteBlend>0.){',
     ' vec3 registeredSample=texture2D(trekAtlas,clamp(nasaUv,.001,.999)).rgb;',
     ' float photoLuma=dot(registeredSample,vec3(.2126,.7152,.0722));',
     ' // Use real local luminance and preserve the global NASA color palette.',
     ' diffuseColor.rgb*=mix(1.,clamp(.68+photoLuma*.65,.73,1.27),siteBlend*.83);',
     '}'
    ].join('\n');
    shader.fragmentShader='uniform sampler2D trekAtlas;\nuniform vec4 trekRegion;\nuniform float trekFade;\n'+
     shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n'+patchFragment);
   }
  };return mat;
 },[map,nasaPatch,nasaPatchFade,unit,moon,centerY,rotation,landingRadius]);
 useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
}
