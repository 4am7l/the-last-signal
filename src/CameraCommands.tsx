import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import type {OrbitControls} from 'three-stdlib';
import * as T from 'three';
export type CameraCommand={id:number;kind:'in'|'out'|'left'|'right'|'up'|'down'|'stop'};
export function CameraCommands({command}:{command?:CameraCommand}){
 const {camera,controls:raw,gl}=useThree(),controls=raw as OrbitControls|undefined,last=useRef(0),pending=useRef<number|null>(null);
 const run=(kind:CameraCommand['kind'])=>{if(!controls)return;controls.dispatchEvent({type:'start',target:controls});const step=.13;
  if(kind==='in'||kind==='out')pending.current=T.MathUtils.clamp(controls.getDistance()*(kind==='in'?.76:1.32),controls.minDistance,controls.maxDistance);
  else if(kind==='left'||kind==='right')controls.setAzimuthalAngle(controls.getAzimuthalAngle()+(kind==='left'?step:-step));
  else if(kind==='up'||kind==='down')controls.setPolarAngle(T.MathUtils.clamp(controls.getPolarAngle()+(kind==='up'?-step:step),controls.minPolarAngle,controls.maxPolarAngle));
  controls.update();
 };
 useEffect(()=>{if(command&&command.id!==last.current&&controls){last.current=command.id;run(command.kind)}},[command,controls]);
 useEffect(()=>{if(!controls)return;const cancel=()=>{pending.current=null};controls.addEventListener('start',cancel);return()=>controls.removeEventListener('start',cancel)},[controls]);
 useEffect(()=>{const canvas=gl.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','مشهد الفضاء: الأسهم للدوران، زائد وناقص للتقريب، Escape لإيقاف الحركة');
  const focus=()=>canvas.focus({preventScroll:true});const key=(event:KeyboardEvent)=>{const actions:Record<string,CameraCommand['kind']>={'+':'in','=':'in','-':'out',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Escape:'stop'};if(actions[event.key]){event.preventDefault();run(actions[event.key])}};
  canvas.addEventListener('pointerdown',focus);canvas.addEventListener('keydown',key);return()=>{canvas.removeEventListener('pointerdown',focus);canvas.removeEventListener('keydown',key)};
 },[gl,controls]);
 useFrame((_,dt)=>{if(!controls||pending.current===null)return;const distance=controls.getDistance(),next=T.MathUtils.damp(distance,pending.current,10,Math.min(dt,.05));camera.position.sub(controls.target).setLength(next).add(controls.target);controls.update();if(Math.abs(next-pending.current)<Math.max(.0000001,pending.current*.001))pending.current=null});
 return null;
}
