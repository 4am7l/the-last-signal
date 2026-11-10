import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {OrbitControls,Html} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import * as T from 'three';
import {Planet,point} from './Planet';
import {Model,type Space} from './Space';
const R=300,UNIT=R/1737400;
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
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],rings=220,sectors=256;
  for(let j=0;j<=rings;j++){const a=j===0?0:Math.exp(T.MathUtils.lerp(Math.log(.25/1737400),Math.log(Math.PI),(j-1)/(rings-1)));
   for(let i=0;i<=sectors;i++){const b=i/sectors*Math.PI*2,n=new T.Vector3(Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b));const s=sample(n),d=a*1737400;
    // Sub-metre regolith is illustrative. It fades continuously into the global map.
    const x=n.x*1737400,z=n.z*1737400,detail=Math.sin(x*.23)*Math.cos(z*.29)*.12*T.MathUtils.smoothstep(d,7,20)*(1-T.MathUtils.smoothstep(d,300,900));
    const p=n.multiplyScalar(R+s.h+detail*UNIT);p.y-=R+base;positions.push(p.x,p.y,p.z);uv.push(s.u,s.v);
    if(j<rings&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+1,k+sectors+1,k+1,k+sectors+2,k+sectors+1)}
   }
  }
  // Duplicate UV seam vertices per triangle so interpolation never crosses the map.
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const out=g.toNonIndexed();g.dispose();const uvs=out.attributes.uv;
  for(let i=0;i<uvs.count;i+=3){const us=[uvs.getX(i),uvs.getX(i+1),uvs.getX(i+2)];if(Math.max(...us)-Math.min(...us)>.5)for(let k=0;k<3;k++)if(us[k]<.5)uvs.setX(i+k,us[k]+1)}
  map.wrapS=T.RepeatWrapping;return {geometry:out,center:new T.Vector3(0,-R-base,0),base};
 },[map,height,m.lat,m.lon]);
 useEffect(()=>()=>surface.geometry.dispose(),[surface]);
 const flight=useRef<{from:T.Vector3;target:T.Vector3;to:T.Vector3;look:T.Vector3;t:number}|null>(null),guided=useRef(false);
 useEffect(()=>{guided.current=mode==='model';const close=mode==='model';flight.current={from:camera.position.clone(),target:controls.current?.target.clone()??new T.Vector3(),to:close?new T.Vector3(22,9,32).multiplyScalar(UNIT):mode==='overview'?new T.Vector3(900,1400,3600):new T.Vector3(160,170,680),look:close?new T.Vector3(0,UNIT,0):surface.center.clone(),t:0}},[mode,reset,m.id,surface,camera]);
 useFrame((_,dt)=>{const ctl=controls.current;if(!ctl)return;
  if(flight.current){const f=flight.current;f.t=Math.min(1,f.t+Math.min(dt,.05)/3.2);const s=f.t*f.t*(3-2*f.t);if(guided.current){const ratio=Math.pow(f.to.length()/Math.max(f.from.length(),.00001),s);camera.position.copy(f.from).multiplyScalar(ratio).lerp(f.to,s);ctl.target.copy(f.target).multiplyScalar(ratio*(1-s)).addScaledVector(f.look,s)}else{camera.position.lerpVectors(f.from,f.to,s);ctl.target.lerpVectors(f.target,f.look,s);}ctl.update();if(f.t===1)flight.current=null}
  else if(!guided.current&&camera.position.distanceTo(surface.center)<430){guided.current=true;flight.current={from:camera.position.clone(),target:ctl.target.clone(),to:new T.Vector3(22,9,32).multiplyScalar(UNIT),look:new T.Vector3(0,UNIT,0),t:0}}
  if(guided.current&&camera.position.y<2*UNIT){camera.position.y=2*UNIT;ctl.update()}
  const distance=camera.position.distanceTo(ctl.target);const near=Math.max(.000005,Math.min(.1,distance/10000));if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
  if(pin.current)pin.current.style.display=distance<.15?'none':'block';
 });
 return <><OrbitControls ref={controls} makeDefault enableDamping enablePan={false} minDistance={8*UNIT} maxDistance={14000} zoomSpeed={1.8} onStart={()=>{if(!guided.current)flight.current=null}}/><ambientLight intensity={.055}/><directionalLight position={[200,300,500]} intensity={2.8}/><directionalLight castShadow position={[.08,.12,.2]} intensity={.6} shadow-mapSize={[2048,2048]} shadow-camera-left={-.025} shadow-camera-right={.025} shadow-camera-top={.025} shadow-camera-bottom={-.025} shadow-camera-near={.001} shadow-camera-far={1} shadow-bias={-.000001}/><mesh geometry={surface.geometry} receiveShadow><meshStandardMaterial map={map} roughness={1}/></mesh><group scale={UNIT}><Model name="apollo"/></group><Planet body="earth" r={564} pos={[-1800,350,-1900]}/>{mode==='overview'&&<><Planet body="mars" r={300} pos={[1700,-300,-1400]} click={()=>onWorld('mars')}/><Html position={[1700,60,-1400]} center><button className="worldLabel" onClick={()=>onWorld('mars')}>المريخ ↗</button></Html></>}<Html position={[0,.5,0]} center><div ref={pin}><button className="sitePin" onClick={()=>onMission(4)}>أبولو 11 · قرّب للوصول<small dir="ltr">{m.lat}° N · {m.lon}° E</small></button></div></Html></>;
}
