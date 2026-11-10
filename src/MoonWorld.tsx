import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls,Html} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as T from 'three';
import {Planet,point} from './Planet';
import {Model,type Space} from './Space';
import {MOON_RENDER_RADIUS as R,METRES_TO_SCENE as UNIT,EARTH_RADIUS_METRES,MARS_RADIUS_METRES,localRelief,ringAngle} from './lunarTerrain';
// One continuous sphere, with logarithmically spaced rings resolving the landing site.
export function MoonWorld({mode,m,reset,onMission,onWorld}:Parameters<typeof Space>[0]){
 const controls=useRef<Controls>(null),pin=useRef<HTMLDivElement>(null);
 const {camera}=useThree();
 const [map,height]=useLoader(T.TextureLoader,['/moon.jpg','/moon-height.jpg']);
 const surface=useMemo(()=>{
  map.colorSpace=T.SRGBColorSpace;
  const image=height.image as HTMLImageElement,c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  const q=new T.Quaternion().setFromUnitVectors(point(m.lat,m.lon,1),new T.Vector3(0,1,0)),inv=q.clone().invert();
  function sample(n:T.Vector3){const local=n.clone().applyQuaternion(inv);const u=((Math.atan2(-local.z,local.x)/(2*Math.PI)+.5)%1+1)%1,v=Math.acos(T.MathUtils.clamp(local.y,-1,1))/Math.PI;
   const x=u*c.width-.5,y=T.MathUtils.clamp(v*c.height-.5,0,c.height-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
   const at=(a:number,b:number)=>pixels[(Math.min(c.height-1,b)*c.width+(a%c.width+c.width)%c.width)*4]/255;
   return {u,v:1-v,h:(T.MathUtils.lerp(T.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),T.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy)-.5)*2.1};
  }
  const base=sample(new T.Vector3(0,1,0)).h;
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],rings=480,sectors=320;
  for(let j=0;j<=rings;j++){const a=ringAngle(j);
   for(let i=0;i<=sectors;i++){const b=i/sectors*Math.PI*2,n=new T.Vector3(Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b));const s=sample(n);
    // Local crater bowls and rims are illustrative and fade into the mapped globe.
    const x=n.x*1737400,z=n.z*1737400,detail=localRelief(x,z)*(n.y>0?1:0);
    const p=n.multiplyScalar(R+s.h+detail*UNIT);p.y-=R+base;positions.push(p.x,p.y,p.z);uv.push(s.u,s.v);
    if(j<rings&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+1,k+sectors+1,k+1,k+sectors+2,k+sectors+1)}
   }
  }
  // Duplicate UV seam vertices per triangle so interpolation never crosses the map.
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const out=g.toNonIndexed();g.dispose();const uvs=out.attributes.uv;
  for(let i=0;i<uvs.count;i+=3){const us=[uvs.getX(i),uvs.getX(i+1),uvs.getX(i+2)];if(Math.max(...us)-Math.min(...us)>.5)for(let k=0;k<3;k++)if(us[k]<.5)uvs.setX(i+k,us[k]+1)}
  map.wrapS=T.RepeatWrapping;return {ground:(x:number,z:number)=>{const n=new T.Vector3(x*UNIT,R,z*UNIT).normalize();return (R+sample(n).h+localRelief(x,z)*UNIT)*n.y-R-base},geometry:out,center:new T.Vector3(0,-R-base,0),base};
 },[map,height,m.lat,m.lon]);
 useEffect(()=>()=>surface.geometry.dispose(),[surface]);
 const flight=useRef<{from:T.Vector3;target:T.Vector3;to:T.Vector3;look:T.Vector3;t:number}|null>(null),guided=useRef(false);
 useEffect(()=>{guided.current=mode==='model';const close=mode==='model';flight.current={from:camera.position.clone(),target:controls.current?.target.clone()??new T.Vector3(),to:close?new T.Vector3(22,9,32).multiplyScalar(UNIT):mode==='overview'?new T.Vector3(900,1400,3600):new T.Vector3(160,170,680),look:close?new T.Vector3(0,UNIT,0):surface.center.clone(),t:0}},[mode,reset,m.id,surface,camera]);
 useFrame((_,dt)=>{const ctl=controls.current;if(!ctl)return;
  if(flight.current){const f=flight.current;f.t=Math.min(1,f.t+Math.min(dt,.05)/3.2);const s=f.t*f.t*(3-2*f.t);if(guided.current){const ratio=Math.pow(f.to.length()/Math.max(f.from.length(),.00001),s);camera.position.copy(f.from).multiplyScalar(ratio).lerp(f.to,s);ctl.target.copy(f.target).multiplyScalar(ratio*(1-s)).addScaledVector(f.look,s)}else{camera.position.lerpVectors(f.from,f.to,s);ctl.target.lerpVectors(f.target,f.look,s);}ctl.update();if(f.t===1)flight.current=null}
  else if(!guided.current&&camera.position.distanceTo(surface.center)<430){guided.current=true;flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(22,9,32).multiplyScalar(UNIT),look:new T.Vector3(0,UNIT,0),t:0}}
  if(guided.current&&Math.hypot(camera.position.x,camera.position.z)<1600*UNIT){const floor=surface.ground(camera.position.x/UNIT,camera.position.z/UNIT)+2*UNIT;if(camera.position.y<floor){camera.position.y=floor;ctl.update()}}
  const distance=camera.position.distanceTo(ctl.target);const near=Math.max(.000005,Math.min(.1,distance/10000));if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
  if(pin.current)pin.current.style.display=distance<.15?'none':'block';
 });
 return <><OrbitControls ref={controls} makeDefault enableDamping enablePan={false} minDistance={8*UNIT} maxDistance={14000} zoomSpeed={1.8} onStart={()=>{if(!guided.current)flight.current=null}}/><ambientLight intensity={.055}/><directionalLight castShadow position={[.08,.12,.2]} intensity={3.4} shadow-mapSize={[2048,2048]} shadow-camera-left={-.025} shadow-camera-right={.025} shadow-camera-top={.025} shadow-camera-bottom={-.025} shadow-camera-near={.001} shadow-camera-far={1} shadow-bias={-.000001}/><mesh geometry={surface.geometry} receiveShadow><RegolithMaterial map={map} height={height}/></mesh><LunarRocks ground={surface.ground}/><group scale={UNIT}><Model name="apollo"/></group><Planet body="earth" r={EARTH_RADIUS_METRES*UNIT} pos={[-1800,350,-1900]}/>{mode==='overview'&&<><Planet body="mars" r={MARS_RADIUS_METRES*UNIT} pos={[1700,-300,-1400]} click={()=>onWorld('mars')}/><Html position={[1700,60,-1400]} center><button className="worldLabel" onClick={()=>onWorld('mars')}>المريخ ↗</button></Html></>}<Html position={[0,.5,0]} center><div ref={pin}><button className="sitePin" onClick={()=>onMission(4)}>أبولو 11 · قرّب للوصول<small dir="ltr">{m.lat}° N · {m.lon}° E</small></button></div></Html></>;
}

function RegolithMaterial({map,height}:{map:T.Texture;height:T.Texture}){
 const material=useMemo(()=>{
  const mat=new T.MeshStandardMaterial({map,bumpMap:height,bumpScale:.025,roughness:1});
  mat.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 lunarPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlunarPosition=position;');
   shader.fragmentShader='varying vec3 lunarPosition;\nfloat lunarHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec2 metres=lunarPosition.xz / ${UNIT.toFixed(12)};
float footprint=max(length(dFdx(metres)),length(dFdy(metres)));
float localFade=1.-smoothstep(300.,1500.,length(metres));
float grain=lunarHash(floor(metres*35.))-.5;
float dust=lunarHash(floor(metres*1.5))-.5;
diffuseColor.rgb*=1.+localFade*(grain*.19*(1.-smoothstep(.01,.1,footprint))+dust*.07*(1.-smoothstep(.2,2.,footprint)));
`);
  };return mat;
 },[map,height]);
 useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
}
function LunarRocks({ground}:{ground:(x:number,z:number)=>number}){
 const rocks=useMemo(()=>{
  const mesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#777570',roughness:1}),100);
  const obj=new T.Object3D();
  for(let i=0;i<100;i++){const a=i*2.399963,r=12+(i*47%260),x=Math.cos(a)*r,z=Math.sin(a)*r,size=.06+(i*7%19)*.025;
   obj.position.set(x*UNIT,ground(x,z)+size*.36*UNIT,z*UNIT);obj.rotation.set(i*.31,i*.7,i*.11);obj.scale.set(size*1.3*UNIT,size*.65*UNIT,size*UNIT);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
  }mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;return mesh;
 },[ground]);
 useEffect(()=>()=>{rocks.geometry.dispose();(rocks.material as T.Material).dispose();rocks.dispose()},[rocks]);return <primitive object={rocks}/>;
}
