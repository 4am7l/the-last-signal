import {useElevation} from './useElevation';
import {elevationAt} from './elevation';
import {useSimulation,useEphemeris,PRESETS} from './simulation';
import {renderLayout,solarIrradiance} from './science';
import {bodyOrientation} from './orientation';
import {SurfaceNavigation} from './SurfaceNavigation';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls,Html} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as T from 'three';
import {Planet,Atmosphere,SitePin,point} from './Planet';
import {usePlanetTexture} from './usePlanetTexture';
import {useTrekPatch,type TrekPatch} from './useTrekPatch';
import {missions} from './data';
import {dimensions} from './journey';
import {SUN_DIRECTION,SCENE_SUN_DIRECTION} from './solar';
import {marsRelief,mountains,surfaceDetail,noise3,cameraTuning,systemLayout,RADII_KM} from './sceneMath';
import {Model,type Space} from './Space';
import {createMarsRelief,marsApproachMask,marsLandingRadius,marsLandingTransition} from './marsGeology';
import {MarsRocks,MarsGroundMarks} from './MarsSurfaceDetails';
import {ApolloRocks} from './ApolloSurfaceDetails';
import {MOON_RENDER_RADIUS as R,MOON_RADIUS_METRES,EARTH_RADIUS_METRES,MARS_RADIUS_METRES,localRelief,ringAngle} from './lunarTerrain';
// Visual orbit preview: keeps the ephemeris position as the starting point.
// The orbital animation is accelerated for visibility; it is not a live JPL trajectory.
function OrbitingMoon({position,earthPosition,radius,rotation,onClick}:{position:T.Vector3;earthPosition:T.Vector3;radius:number;rotation:T.Quaternion;onClick:()=>void}){
 const ref=useRef<T.Group>(null);
 const base=useMemo(()=>position.clone().sub(earthPosition),[position,earthPosition]);
 const axis=useMemo(()=>new T.Vector3(0,1,0),[]);
 useFrame(({clock})=>{if(ref.current)ref.current.position.copy(earthPosition).add(base.clone().applyAxisAngle(axis,clock.elapsedTime*(Math.PI*2/180)));});
 return <group ref={ref} position={position}><Planet body="moon" r={radius} pos={[0,0,0]} rotation={rotation} click={onClick}/></group>;
}
// One continuous sphere, with logarithmically spaced rings resolving the landing site.
export function SurfaceWorld({mode,m,reset,onMission,onWorld,physicalDistances=false,focusPair=true}:Parameters<typeof Space>[0]){
 const settings=useSimulation(),preset=PRESETS[settings.quality],ephemeris=useEphemeris(settings.date);
 const bodyToSystem=useMemo(()=>bodyOrientation(m.body,ephemeris.epoch),[m.body,ephemeris.epoch]);
 const moon=m.body==='moon',radiusMetres=moon?MOON_RADIUS_METRES:MARS_RADIUS_METRES,UNIT=R/radiusMetres;
 const [close,setClose]=useState(false),[earthFocus,setEarthFocus]=useState(false);
 const incomingDem=useElevation(m.body),heldDem=useRef({body:m.body,grid:incomingDem});
 if(!close||heldDem.current.body!==m.body)heldDem.current={body:m.body,grid:incomingDem};
 const dem=heldDem.current.grid;
 const controls=useRef<Controls>(null),pin=useRef<HTMLDivElement>(null);
 const {camera,scene,gl}=useThree();
 const coarsePointer=typeof window!=='undefined'&&window.matchMedia('(pointer: coarse)').matches;
 // Resolve the best available orbital imagery while still in overview, not
 // in the middle of a guided landing animation.
 const map=usePlanetTexture(m.body,true);
 const nasaPatch=useTrekPatch(m.body,m.lat,m.lon);
 const nasaPatchFade=useMemo(()=>({value:0}),[m.id,m.body]);
 const height=useLoader(T.TextureLoader,'/moon-height.jpg');
 const landingRadius=useMemo(()=>marsLandingRadius(m.id,dimensions[m.model].span),[m.id,m.model]);
 const marsReliefAt=useMemo(()=>createMarsRelief(m.lat,m.lon,landingRadius,m.id),[m.lat,m.lon,landingRadius,m.id]);
 // This is one continuous spherical heightfield at every altitude. Only
 // small decorative rocks are gated by proximity; the globe never swaps meshes.
 const globeOnly=!close;
 const surface=useMemo(()=>{
  const image=height.image as HTMLImageElement,c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  const q=new T.Quaternion().setFromUnitVectors(point(m.lat,m.lon,1),new T.Vector3(0,1,0)),inv=q.clone().invert();
  function sample(n:T.Vector3){const local=n.clone().applyQuaternion(inv);const u=((Math.atan2(-local.z,local.x)/(2*Math.PI)+.5)%1+1)%1,v=Math.acos(T.MathUtils.clamp(local.y,-1,1))/Math.PI;
   const x=u*c.width-.5,y=T.MathUtils.clamp(v*c.height-.5,0,c.height-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
   const at=(a:number,b:number)=>pixels[(Math.min(c.height-1,b)*c.width+(a%c.width+c.width)%c.width)*4]/255;
   return {u,v:1-v,h:dem?elevationAt(dem,Math.asin(local.y)*180/Math.PI,Math.atan2(-local.z,local.x)*180/Math.PI)*UNIT:moon?(T.MathUtils.lerp(T.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),T.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy)-.5)*2.1:0};
  }
  const base=sample(new T.Vector3(0,1,0)).h;
  // Keep all Martian landers on the local ground rather than on a DEM
  // interpolation bump. Blend the measured elevation back smoothly away
  // from the equipment without changing the global planetary terrain.
  const siteHeight=(rawHeight:number,distance:number)=>moon?rawHeight:
   T.MathUtils.lerp(base,rawHeight,T.MathUtils.smoothstep(distance,landingRadius,landingRadius+marsLandingTransition(m.id)));
  const detailAt=(x:number,z:number)=>{
   const distance=Math.hypot(x,z),pad=Math.max(2,dimensions[m.model].span*.65);
   const fade=T.MathUtils.smoothstep(distance,pad,pad+4)*(1-T.MathUtils.smoothstep(distance,800,1600));
   const soil=(noise3(x*1.8,3,z*1.8)*.055+noise3(x*.35,9,z*.35)*.16+noise3(x*.07,5,z*.07)*.32)*fade;
   if(moon){
    // Geometry displacement at short range, rather than just magnified pixels.
    // Fade it out below the landing gear to avoid floating equipment.
    const closeMicro=(noise3(x*1.7,27,z*1.7)*.075+
     noise3(x*4.8,41,z*4.8)*.022+
     noise3(x*10.5,59,z*10.5)*.006)*
     T.MathUtils.smoothstep(distance,pad+2,pad+10)*
     (1-T.MathUtils.smoothstep(distance,170,480));
    return localRelief(x,z)+surfaceDetail(x,z,'moon')*.36+soil*.45+closeMicro;
   }
   const nearBlend=T.MathUtils.smoothstep(distance,landingRadius,landingRadius+marsLandingTransition(m.id));
   // Resolve metre- and decimetre-scale rock chips geometrically near the
   // camera. Keep the lander footing and the walking approach smooth.
   const closeDetail=T.MathUtils.smoothstep(distance,pad+2,pad+10)*
    (1-T.MathUtils.smoothstep(distance,180,430));
   const stoneGrain=(noise3(x*.83,31,z*.83)*.105+
    noise3(x*2.7,37,z*2.7)*.022)*closeDetail*
    (1-.65*marsApproachMask(x,z,landingRadius));
   const closeMicro=(noise3(x*1.4,43,z*1.4)*.085+
    noise3(x*4.1,51,z*4.1)*.025+
    noise3(x*9.8,63,z*9.8)*.007)*
    T.MathUtils.smoothstep(distance,pad+2,pad+10)*
    (1-T.MathUtils.smoothstep(distance,180,530))*
    (1-.55*marsApproachMask(x,z,landingRadius));
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
    const x=n.x*radiusMetres,z=n.z*radiusMetres,detail=detailAt(x,z)*(n.y>0?1:0);
    const h=siteHeight(s.h,Math.hypot(x,z));const p=n.multiplyScalar(R+h+detail*UNIT);p.y-=R+base;positions.push(p.x,p.y,p.z);uv.push(s.u,s.v);
    if(j<rings&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+1,k+sectors+1,k+1,k+sectors+2,k+sectors+1)}
   }
  }
  // Duplicate UV seam vertices per triangle so interpolation never crosses the map.
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const out=g.toNonIndexed();g.dispose();const uvs=out.attributes.uv;
  for(let i=0;i<uvs.count;i+=3){const us=[uvs.getX(i),uvs.getX(i+1),uvs.getX(i+2)];if(Math.max(...us)-Math.min(...us)>.5)for(let k=0;k<3;k++)if(us[k]<.5)uvs.setX(i+k,us[k]+1)}
  return {ground:(x:number,z:number)=>{const n=new T.Vector3(x*UNIT,R,z*UNIT).normalize();const h=siteHeight(sample(n).h,Math.hypot(x,z));return (R+h+detailAt(x,z)*UNIT)*n.y-R-base},rotation:q,geometry:out,center:new T.Vector3(0,-R-base,0),base};
 },[height,m.lat,m.lon,moon,radiusMetres,UNIT,m.body,m.model,preset,dem,marsReliefAt,landingRadius,m.id,coarsePointer,settings.quality]);
 useEffect(()=>()=>surface.geometry.dispose(),[surface]);
 // A floating local origin preserves centimetre detail while every body stays
 // in one shared solar-system layout. Rebase the camera, not the universe.
 const layout=useMemo(()=>renderLayout(ephemeris,physicalDistances),[physicalDistances,ephemeris]);
 const localRotation=useMemo(()=>surface.rotation.clone().multiply(bodyToSystem.clone().invert()),[surface,bodyToSystem]);
 const frame=useMemo(()=>{
  const scale=R/(RADII_KM[m.body]*layout.scale);
  const localToSystem=new T.Matrix4().compose(new T.Vector3(...layout[m.body]),localRotation.clone().invert(),new T.Vector3(1/scale,1/scale,1/scale)).multiply(new T.Matrix4().makeTranslation(-surface.center.x,-surface.center.y,-surface.center.z));
  const systemToLocal=localToSystem.clone().invert();
  return {localToSystem,systemToLocal,scale};
 },[layout,m.body,surface,localRotation]);
 const previousFrame=useRef(new T.Matrix4());
 const systemUp=useMemo(()=>new T.Vector3(0,1,0).transformDirection(frame.systemToLocal),[frame]);
 const surfaceUp=useMemo(()=>new T.Vector3(0,1,0),[]);
 const inspectionSpan=Math.max(4,dimensions[m.model].span);
 const others=useMemo(()=>(['earth','moon','mars'] as const).filter(b=>b!==m.body).map(body=>({body,position:new T.Vector3(...layout[body]).applyMatrix4(frame.systemToLocal),radius:RADII_KM[body]*layout.scale*frame.scale})),[layout,frame,m.body]);
 const localSun=useMemo(()=>new T.Vector3(...ephemeris[m.body]).negate().normalize().applyQuaternion(localRotation),[ephemeris,m.body,localRotation]);
 // Local horizon determines whether direct sunlight or a faint cinematic night fill is active.
 const daylight=T.MathUtils.smoothstep(localSun.y,-.035,.055);
 const night=1-daylight;
 const nightDirection=useMemo(()=>new T.Vector3(-.35,.82,.45).normalize(),[]);
 const flight=useRef<{from:T.Vector3;target:T.Vector3;to:T.Vector3;look:T.Vector3;t:number;stage:'overview'|'orbit'|'align'|'descent'}|null>(null),guided=useRef(false);
 const descentArmed=useRef(true);
 const previousDistance=useRef(Infinity),sky=useMemo(()=>new T.Color('#03060c'),[]),dust=useMemo(()=>new T.Color('#8b6955'),[]),marsDaySky=useMemo(()=>new T.Color('#a17c69'),[]),marsTwilight=useMemo(()=>new T.Color('#74616b'),[]),marsNightSky=useMemo(()=>new T.Color('#111522'),[]),marsFog=useMemo(()=>new T.Color(),[]);
 useEffect(()=>{
  const ctl=controls.current;if(!ctl)return;setEarthFocus(false);
  camera.up.transformDirection(previousFrame.current).transformDirection(frame.systemToLocal);
  camera.position.applyMatrix4(previousFrame.current).applyMatrix4(frame.systemToLocal);
  ctl.target.applyMatrix4(previousFrame.current).applyMatrix4(frame.systemToLocal);
  previousFrame.current.copy(frame.localToSystem);
  SCENE_SUN_DIRECTION.copy(localSun);scene.userData.skyRotation=localRotation.clone();
  camera.far=Math.max(100000,new T.Vector3(...layout.mars).length()*frame.scale*12);camera.near=.000005;camera.updateProjectionMatrix();
  guided.current=mode==='model'||mode==='location';setClose(false);
  const near=guided.current,reframe=near&&camera.position.length()<5;
  const focusPosition=new T.Vector3(22,9,32).normalize().multiplyScalar(Math.max(4,dimensions[m.model].span*3)*UNIT),focusTarget=new T.Vector3(0,dimensions[m.model].span*.22*UNIT,0);
  const endBody=new T.Vector3(...(physicalDistances&&focusPair?layout.moon:layout.mars));
  const span=Math.max(1500,endBody.length()*1.3);
  const overviewCenter=endBody.clone().multiplyScalar(.5);
  const overviewPosition=overviewCenter.clone().add(new T.Vector3(.15,.8,1).normalize().multiplyScalar(span)).applyMatrix4(frame.systemToLocal);
  const overviewTarget=overviewCenter.clone().applyMatrix4(frame.systemToLocal);
  flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:mode==='overview'?overviewPosition:reframe?focusPosition:near?new T.Vector3(0,150,250):new T.Vector3(160,170,680),look:mode==='overview'?overviewTarget:reframe?focusTarget:surface.center.clone(),t:0,stage:mode==='overview'?'overview':reframe?'descent':near?'align':'orbit'};
  previousDistance.current=Infinity;descentArmed.current=true;
  ctl.enabled=false;ctl.minDistance=.000001;ctl.maxDistance=Math.max(24000,new T.Vector3(...layout.mars).length()*frame.scale*8);
 },[mode,reset,m.id,frame,camera,scene,localSun,physicalDistances,focusPair]);
 const focusPlanet=(body:'earth'|'moon'|'mars')=>{
  if(body!=='earth'){onWorld(body);return;}
  const earth=others.find(b=>b.body==='earth'),ctl=controls.current;if(!earth||!ctl)return;
  setEarthFocus(true);guided.current=false;
  flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:earth.position.clone().add(new T.Vector3(1,.45,1).normalize().multiplyScalar(earth.radius*3.2)),look:earth.position.clone(),t:0,stage:'overview'};
 };
 useEffect(()=>()=>{camera.up.set(0,1,0);SCENE_SUN_DIRECTION.copy(SUN_DIRECTION);delete scene.userData.skyRotation;scene.userData.skyVisibility=1},[scene]);
 useEffect(()=>{scene.userData.skyVisibility=1;scene.fog=null;if(scene.background instanceof T.Color)scene.background.set('#03060c');return()=>{scene.fog=null;if(scene.background instanceof T.Color)scene.background.set('#03060c')}},[scene,moon]);
 useFrame((_,dt)=>{const ctl=controls.current;if(!ctl)return;
  scene.userData.terrainSource=dem?dem.source:'تعذّر تحميل DEM — سطح تقريبي';
  scene.userData.altitude=Math.max(0,(camera.position.y-surface.ground(camera.position.x/UNIT,camera.position.z/UNIT))/UNIT);
  // Tile downloads may finish at any time: reveal new NASA detail gently
  // so an asynchronous image never produces another visual pop.
  nasaPatchFade.value=T.MathUtils.damp(nasaPatchFade.value,nasaPatch?1:0,2.1,Math.min(dt,.05));
  if(settings.navigation!=='orbit'&&close&&!flight.current)return;
  const viewUp=mode==='overview'||earthFocus?systemUp:surfaceUp;
  camera.up.lerp(viewUp,1-Math.exp(-Math.min(dt,.05)*6)).normalize();
  ctl.enabled=!flight.current&&(settings.navigation==='orbit'||!close);
  if(flight.current){ctl.minDistance=.000001;const f=flight.current;f.t=Math.min(1,f.t+Math.min(dt,.05)/(f.stage==='descent'?5:2));if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)f.t=1;const s=f.t*f.t*(3-2*f.t);
   if(f.stage==='overview'){camera.position.lerpVectors(f.from,f.to,s);ctl.target.lerpVectors(f.target,f.look,s)}
   else if(f.stage==='descent'){const ratio=Math.pow(f.to.length()/Math.max(f.from.length(),.00001),s);camera.position.copy(f.from).multiplyScalar(ratio).lerp(f.to,s);ctl.target.copy(f.target).multiplyScalar(ratio*(1-s)).addScaledVector(f.look,s)}
   else{const a=f.from.clone().sub(surface.center),b=f.to.clone().sub(surface.center);const q=new T.Quaternion().setFromUnitVectors(a.clone().normalize(),b.clone().normalize());const turn=new T.Quaternion().slerp(q,s);camera.position.copy(a.normalize().applyQuaternion(turn)).multiplyScalar(Math.max(430,T.MathUtils.lerp(f.from.distanceTo(surface.center),b.length(),s))).add(surface.center);ctl.target.lerpVectors(f.target,f.look,s)}
   ctl.update();if(f.t===1){flight.current=f.stage==='align'?{from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(22,9,32).normalize().multiplyScalar(Math.max(4,dimensions[m.model].span*3)*UNIT),look:new T.Vector3(0,dimensions[m.model].span*.22*UNIT,0),t:0,stage:'descent'}:null}
  }else if(mode!=='overview'&&!earthFocus){let distance=camera.position.distanceTo(surface.center);if(!guided.current&&distance<R+5){camera.position.sub(surface.center).normalize().multiplyScalar(R+5).add(surface.center);distance=R+5;ctl.update()}if(distance>500)descentArmed.current=true;if(!guided.current&&descentArmed.current&&distance<430&&distance<previousDistance.current-.00001){guided.current=true;flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(0,150,250),look:surface.center.clone(),t:0,stage:'align'}}previousDistance.current=distance}
  // Return to globe-centred orbit before surface orbit can swing through the planet.
  if(guided.current&&!flight.current&&camera.position.length()>R*.35){
   guided.current=false;descentArmed.current=false;ctl.target.copy(surface.center);
   ctl.minDistance=R+5;ctl.maxPolarAngle=Math.PI-.02;ctl.update();
  }
  if(guided.current&&Math.hypot(camera.position.x,camera.position.z)<24000*UNIT){const floor=surface.ground(camera.position.x/UNIT,camera.position.z/UNIT)+.6*UNIT;if(camera.position.y<floor){camera.position.y=floor;ctl.update()}}
  const altitude=Math.max(0,camera.position.distanceTo(surface.center)-surface.center.length());const nearSite=camera.position.length()<5000*UNIT;
  if(nearSite!==close)setClose(nearSite);
  const daylight=T.MathUtils.smoothstep(localSun.y,-.15,.25);
  const nearGround=1-T.MathUtils.smoothstep(altitude,2000*UNIT,20000*UNIT);
  scene.userData.skyVisibility=moon?1-nearGround*daylight*.72:1;
  if(!moon&&mode!=='overview'&&!earthFocus){const haze=1-T.MathUtils.smoothstep(altitude,3000*UNIT,18000*UNIT);const sunHeight=T.MathUtils.clamp(localSun.y,-1,1);const dusk=1-T.MathUtils.smoothstep(sunHeight,-.12,.22);const darkness=1-T.MathUtils.smoothstep(sunHeight,-.26,-.06);marsFog.copy(marsDaySky).lerp(marsTwilight,dusk).lerp(marsNightSky,darkness);const skyHaze=haze*(.3+.7*daylight);scene.userData.skyVisibility=1-skyHaze*.92;if(scene.background instanceof T.Color)scene.background.copy(sky).lerp(marsFog,skyHaze);if(haze>.01){if(!(scene.fog instanceof T.FogExp2))scene.fog=new T.FogExp2(marsFog,0);(scene.fog as T.FogExp2).color.copy(marsFog);(scene.fog as T.FogExp2).density=haze*(.45+.55*daylight)/(14000*UNIT)}else scene.fog=null}else{scene.fog=null;if(scene.background instanceof T.Color)scene.background.copy(sky)}
  if(close&&!flight.current){const limit=250*UNIT;ctl.target.x=T.MathUtils.clamp(ctl.target.x,-limit,limit);ctl.target.z=T.MathUtils.clamp(ctl.target.z,-limit,limit);ctl.target.y=Math.max(ctl.target.y,surface.ground(ctl.target.x/UNIT,ctl.target.z/UNIT)+.25*UNIT);}
  const tuning=cameraTuning(altitude,R,guided.current);
  ctl.rotateSpeed=(mode==='overview'||earthFocus?.55:tuning.rotate)*(coarsePointer?1.35:1);ctl.zoomSpeed=(mode==='overview'||earthFocus?.8:tuning.zoom)*(coarsePointer?1.5:1);ctl.panSpeed=mode==='overview'||earthFocus?.5:tuning.pan;
  ctl.enablePan=(mode==='overview'||earthFocus||nearSite)&&!flight.current;
  if(!flight.current)ctl.minDistance=earthFocus?(others.find(b=>b.body==='earth')?.radius??R)*1.025:mode==='overview'?1:guided.current?Math.max(1.2,dimensions[m.model].span*.85)*UNIT:R+5;
  ctl.maxPolarAngle=nearSite?Math.PI/2-.035:Math.PI-.02;
  const distance=camera.position.distanceTo(ctl.target),near=Math.max(.000005,Math.min(.1,distance/10000));if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
  if(pin.current){const facing=new T.Vector3(0,1,0).dot(camera.position.clone().normalize())>0;pin.current.style.display=mode==='overview'||earthFocus||nearSite||!facing?'none':'block';}
 });
 return <><SurfaceNavigation active={close&&!flight.current&&mode!=='story'} body={m.body} unit={UNIT} ground={surface.ground} center={surface.center} equipmentRadius={dimensions[m.model].span*.6}/><OrbitControls ref={controls} makeDefault enabled={settings.navigation==='orbit'||!close||!!flight.current} enableDamping dampingFactor={.085} rotateSpeed={coarsePointer?.65:.4} enablePan={close} screenSpacePanning={false} panSpeed={.4} minPolarAngle={.04} maxPolarAngle={close?Math.PI/2-.035:Math.PI-.02} minDistance={Math.max(1.2,dimensions[m.model].span*.85)*UNIT} maxDistance={14000} zoomSpeed={.6} onStart={()=>{if(flight.current){descentArmed.current=false;guided.current=flight.current.stage==='descent';}flight.current=null;}}/>{/* Uniform bounced light lifts the unlit terrain without introducing a second shadow direction. */}<ambientLight intensity={daylight*(moon?.26:.34)+night*(moon?.028:.045)} color={moon?'#c3d0e5':'#e6c6ae'}/><hemisphereLight args={[moon?'#c8d6ee':'#e9c6aa',moon?'#798295':'#9b7360',daylight*(moon?.14:.19)+night*.018]}/>{night>.001&&<directionalLight castShadow position={nightDirection.clone().multiplyScalar(350*UNIT)} color={moon?'#a8c5ee':'#b4c5dc'} intensity={night*(moon?.13:.095)} shadow-mapSize={[preset.shadows,preset.shadows]} shadow-camera-left={-90*UNIT} shadow-camera-right={90*UNIT} shadow-camera-top={90*UNIT} shadow-camera-bottom={-90*UNIT} shadow-camera-near={10*UNIT} shadow-camera-far={900*UNIT} shadow-normalBias={.004*UNIT} shadow-bias={-.000015} shadow-radius={0}/>}<directionalLight castShadow position={localSun.clone().multiplyScalar(350*UNIT)} color={moon?'#fff8ee':'#fff0dc'} intensity={4.0*solarIrradiance(ephemeris[m.body])/1361} shadow-mapSize={[preset.shadows,preset.shadows]} shadow-camera-left={-90*UNIT} shadow-camera-right={90*UNIT} shadow-camera-top={90*UNIT} shadow-camera-bottom={-90*UNIT} shadow-camera-near={10*UNIT} shadow-camera-far={900*UNIT} shadow-bias={-.000015} shadow-normalBias={.004*UNIT} shadow-radius={0}/><mesh geometry={surface.geometry} receiveShadow onClick={e=>{if(mode==='overview'&&e.delta<4){e.stopPropagation();onWorld(m.body)}}}><RegolithMaterial map={map} nasaPatch={nasaPatch} nasaPatchFade={nasaPatchFade} unit={UNIT} moon={moon} centerY={surface.center.y} rotation={surface.rotation} landingRadius={landingRadius}/></mesh>{globeOnly?null:moon?<ApolloRocks ground={surface.ground} unit={UNIT} clearance={Math.max(3,dimensions[m.model].span*.70)} count={preset.rocks}/>:<><MarsRocks ground={surface.ground} unit={UNIT} clearance={Math.max(3,dimensions[m.model].span*.7)} count={preset.rocks} lat={m.lat} lon={m.lon} landingRadius={landingRadius} site={m.id}/><MarsGroundMarks ground={surface.ground} unit={UNIT} model={m.model} lat={m.lat} lon={m.lon}/></>}{!moon&&<group position={surface.center}><Atmosphere r={R} earth={false}/></group>}<group scale={UNIT}><Model name={m.model}/></group>{others.map(({body,position,radius})=><group key={body}>{body==='moon'&&m.body!=='moon'?<OrbitingMoon position={position} earthPosition={new T.Vector3(...layout.earth).applyMatrix4(frame.systemToLocal)} radius={radius} rotation={localRotation.clone().multiply(bodyOrientation(body,ephemeris.epoch))} onClick={()=>focusPlanet(body)}/>:<Planet body={body} r={radius} pos={position.toArray() as [number,number,number]} rotation={localRotation.clone().multiply(bodyOrientation(body,ephemeris.epoch))} click={()=>focusPlanet(body)}/>} {mode==='overview'&&<Html position={position.clone().add(new T.Vector3(0,radius+100,0))} center><button className="worldLabel" onClick={()=>focusPlanet(body)}>{body==='earth'?'الأرض':body==='moon'?'القمر':'المريخ'} ↗</button></Html>}</group>)}{mode==='overview'&&<Html position={[0,100,0]} center><button className="worldLabel" onClick={()=>onWorld(m.body)}>{moon?'القمر':'المريخ'} ↗</button></Html>}<Html position={[0,.5,0]} center><div ref={pin}><button className="sitePin" onClick={()=>onMission(missions.findIndex(item=>item.id===m.id))}>{m.name} · قرّب للوصول<small dir="ltr">{Math.abs(m.lat)}° {m.lat<0?'S':'N'} · {m.lon}° E</small></button></div></Html>{mode!=='overview'&&!earthFocus&&!close&&missions.map((item,i)=>item.body===m.body&&item.id!==m.id?<SitePin key={item.id} m={item} rotation={surface.rotation} selected={false} onClick={()=>onMission(i)}/>:null)}</>;
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
float macroTone=soilNoise(metres*.00045+vec2(29.,13.))-.5;
diffuseColor.rgb*=1.+macroTone*.12*macroFade;
float grain=soilNoise(metres*48.)-.5;
float strata=(soilNoise(metres*.7)-.5)*2.;
float dust=soilNoise(metres*5.)-.5;
// Never replace planetary imagery with an unrelated flat grey/red surface.
// Preserve large-scale lunar mare / Martian albedo across the full approach.
diffuseColor.rgb*=1.+localFade*(grain*${moon?'.42':'.23'}*(1.-smoothstep(.01,.1,footprint))+dust*${moon?'.28':'.17'}*(1.-smoothstep(.2,2.,footprint))+strata*${moon?'.15':'.09'}*(1.-smoothstep(1.,8.,footprint)));
 ${moon?`// Apollo 11: grey, powdery lunar regolith and sparse dark mare basalt.
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
 // Dusty path to mission equipment follows the same corridor as rock exclusion.
 float trailAlong=(metres.x+metres.y)*.70710678;
 float trailBend=2.*sin(trailAlong*.045)*smoothstep(12.,65.,trailAlong);
 float trailAcross=abs((metres.x-metres.y)*.70710678-trailBend);
 float trailStart=smoothstep(${(landingRadius*.6).toFixed(2)},${(landingRadius+4).toFixed(2)},trailAlong);
 float dirtTrail=trailStart*(1.-smoothstep(112.,142.,trailAlong))*(1.-smoothstep(4.4,8.5,trailAcross));
 float dustyGrain=soilNoise(metres*3.4+vec2(9.,22.))-.5;
 vec3 packedDust=vec3(.395,.244,.167)*(1.+dustyGrain*.09);
 diffuseColor.rgb*=1.-dirtTrail*.105*localFade;
 
 `}
 `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
vec2 detailMetres=lunarPosition.xz / ${unit.toFixed(12)};
float detailFootprint=max(length(dFdx(detailMetres)),length(dFdy(detailMetres)));
float relief=(soilNoise(detailMetres*48.)-.5)*${moon?'.006':'.0045'}*(1.-smoothstep(.008,.045,detailFootprint));
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
