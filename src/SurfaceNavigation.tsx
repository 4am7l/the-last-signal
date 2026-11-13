import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {useSimulation,PRESETS} from './simulation';
import {BODIES,type Body} from './science';
export function SurfaceNavigation({active,body,unit,ground,center,equipmentRadius}:{active:boolean;body:Body;unit:number;ground:(x:number,z:number)=>number;center:T.Vector3;equipmentRadius:number}){
 const settings=useSimulation(),{camera,gl,controls}=useThree();
 const enabled=active&&settings.navigation!=='orbit';
 const keys=useRef(new Set<string>()),angles=useRef({yaw:0,pitch:0}),vertical=useRef(0),velocity=useRef(new T.Vector3()),grounded=useRef(false);
 const rocks=useMemo(()=>Array.from({length:PRESETS[settings.quality].rocks},(_,i)=>{
  const clearance=Math.max(2,equipmentRadius/.6*.7),a=i*2.399963,r=clearance+(i<900?Math.pow((i+1)/900,1.4)*45:50+Math.pow((i-899)/300,1.5)*450);
  const size=i<900?.012+Math.pow((i*7%29)/29,3)*.16:.045+Math.pow((i*7%29)/29,3)*(body==='moon'?1.1:.8);
  return {x:Math.cos(a)*r,z:Math.sin(a)*r,r:size*1.3};
 }),[settings.quality,equipmentRadius,body]);
 useEffect(()=>{
  if(!enabled)return;
  const direction=camera.getWorldDirection(new T.Vector3());
  angles.current={yaw:Math.atan2(-direction.x,-direction.z),pitch:Math.asin(T.MathUtils.clamp(direction.y,-1,1))};
  let x=camera.position.x/unit,z=camera.position.z/unit;
  if(Math.hypot(x,z)>190||Math.hypot(x,z)<equipmentRadius+.5){x=equipmentRadius+4;z=equipmentRadius+4;}
  camera.position.set(x*unit,ground(x,z)+1.7*unit,z*unit);vertical.current=0;velocity.current.set(0,0,0);
  const down=(e:KeyboardEvent)=>{if(document.pointerLockElement!==gl.domElement)return;keys.current.add(e.code);if(['Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code))e.preventDefault()};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
  const clear=()=>keys.current.clear();
  const move=(e:MouseEvent)=>{if(document.pointerLockElement===gl.domElement){angles.current.yaw-=e.movementX*.002;angles.current.pitch=T.MathUtils.clamp(angles.current.pitch-e.movementY*.002,-1.48,1.48)}};
  const lock=()=>{if(!window.matchMedia('(pointer:coarse)').matches&&document.pointerLockElement!==gl.domElement)gl.domElement.requestPointerLock()?.catch(()=>{})};
  // Touch devices cannot use pointer lock. Dragging the actual 3D canvas looks around,
  // while the on-screen movement pad emits the same key codes as the desktop controls.
  const touch= {id:-1,x:0,y:0};
  const touchDown=(e:PointerEvent)=>{if(e.pointerType!=='touch'||touch.id!==-1)return;touch.id=e.pointerId;touch.x=e.clientX;touch.y=e.clientY;};
  const touchMove=(e:PointerEvent)=>{
   if(e.pointerId!==touch.id)return;
   e.preventDefault();
   const dx=e.clientX-touch.x,dy=e.clientY-touch.y;
   touch.x=e.clientX;touch.y=e.clientY;
   angles.current.yaw-=dx*.0034;
   angles.current.pitch=T.MathUtils.clamp(angles.current.pitch-dy*.0034,-1.48,1.48);
  };
  const touchEnd=(e:PointerEvent)=>{if(e.pointerId===touch.id)touch.id=-1};
  const mobileKeys=(e:Event)=>{const data=(e as CustomEvent<{code:string;pressed:boolean}>).detail;if(!data)return;if(data.pressed)keys.current.add(data.code);else keys.current.delete(data.code)};
  const invisible=()=>{keys.current.clear();touch.id=-1};
  gl.domElement.addEventListener('click',lock);gl.domElement.addEventListener('pointerdown',touchDown);gl.domElement.addEventListener('pointermove',touchMove,{passive:false});gl.domElement.addEventListener('pointerup',touchEnd);gl.domElement.addEventListener('pointercancel',touchEnd);
  window.addEventListener('mobile-navigation',mobileKeys);document.addEventListener('visibilitychange',invisible);
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('mousemove',move);window.addEventListener('blur',clear);document.addEventListener('pointerlockchange',clear);
  return()=>{keys.current.clear();gl.domElement.removeEventListener('click',lock);gl.domElement.removeEventListener('pointerdown',touchDown);gl.domElement.removeEventListener('pointermove',touchMove);gl.domElement.removeEventListener('pointerup',touchEnd);gl.domElement.removeEventListener('pointercancel',touchEnd);
   window.removeEventListener('mobile-navigation',mobileKeys);document.removeEventListener('visibilitychange',invisible);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('mousemove',move);window.removeEventListener('blur',clear);document.removeEventListener('pointerlockchange',clear);if(document.pointerLockElement===gl.domElement)document.exitPointerLock();
   const ctl=controls as unknown as {target?:T.Vector3;update?:()=>void};
   ctl?.target?.copy(camera.position).add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(5*unit));ctl?.update?.();
  };
 },[enabled,body,unit,ground,gl,camera,controls,equipmentRadius]);
 useFrame((_,elapsed)=>{
  if(!enabled)return;
  const dt=Math.min(elapsed,.04),key=keys.current,walk=settings.navigation==='walk';
  const h=(key.has('KeyC')?1.05:1.7)*unit;
  const speed=settings.speed*(key.has('ShiftLeft')||key.has('ShiftRight')?2.5:1);
  const x=Number(key.has('KeyD'))-Number(key.has('KeyA')),z=Number(key.has('KeyS'))-Number(key.has('KeyW'));
  const motion=new T.Vector3(x,0,z);if(motion.lengthSq()>1)motion.normalize();
  motion.applyAxisAngle(new T.Vector3(0,1,0),angles.current.yaw).multiplyScalar(speed);
  velocity.current.lerp(motion,1-Math.exp(-dt*10));
  const before=camera.position.clone(),candidate=before.clone().addScaledVector(velocity.current,dt*unit);
  const mx=candidate.x/unit,mz=candidate.z/unit;
  const blocked=Math.hypot(mx,mz)>200||Math.hypot(mx,mz)<equipmentRadius+.35||rocks.some(r=>r.r>.12&&Math.hypot(mx-r.x,mz-r.z)<r.r+.3);
  const oldFloor=ground(before.x/unit,before.z/unit),floor=ground(mx,mz);
  const horizontal=Math.hypot(candidate.x-before.x,candidate.z-before.z);
  if(!blocked&&(!walk||floor-oldFloor<Math.max(.25*unit,horizontal*.7))){camera.position.x=candidate.x;camera.position.z=candidate.z;}
  const actualFloor=ground(camera.position.x/unit,camera.position.z/unit);
  if(walk){
   if(key.has('Space')&&grounded.current){vertical.current=2.4;grounded.current=false;key.delete('Space');}
   vertical.current-=BODIES[body].gravity*dt;camera.position.y+=vertical.current*unit*dt;
   if(camera.position.y<=actualFloor+h){camera.position.y=actualFloor+h;vertical.current=0;grounded.current=true;}
  }else{camera.position.y+=(Number(key.has('KeyE'))-Number(key.has('KeyQ')))*speed*unit*dt;camera.position.y=Math.max(actualFloor+.4*unit,Math.min(actualFloor+150*unit,camera.position.y));}
  const normal=camera.position.clone().sub(center).normalize();
  const orient=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal);
  camera.quaternion.copy(orient).multiply(new T.Quaternion().setFromEuler(new T.Euler(angles.current.pitch,angles.current.yaw,0,'YXZ')));
  camera.up.copy(normal);
 });
 return null;
}
