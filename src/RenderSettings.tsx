import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useSimulation,PRESETS} from './simulation';

// Dynamic resolution changes the number of shaded pixels, not terrain geometry,
// textures, orbital coordinates, or the camera's freedom of movement.
export function RenderSettings(){
 const {gl,setDpr}=useThree();
 const settings=useSimulation();
 const clock=useRef({sum:0,frames:0,dpr:0,scale:1,slow:0,fast:0,elapsed:0});
 useFrame(({scene},dt)=>{
  gl.toneMappingExposure=settings.exposure;
  const state=clock.current;
  const maxDpr=Math.min(window.devicePixelRatio||1,PRESETS[settings.quality].dpr);
  // Keep a usable minimum on integrated GPUs, but never exceed the selected preset.
  const targetDpr=Math.min(maxDpr,Math.max(Math.min(maxDpr,0.65),maxDpr*state.scale));
  if(Math.abs(state.dpr-targetDpr)>.035){
   state.dpr=targetDpr;
   setDpr(targetDpr);
  }
  const elapsed=Math.min(dt,.25);
  state.sum+=elapsed;
  state.frames++;
  state.elapsed+=elapsed;
  if(state.sum>=1){
   const fps=state.frames/state.sum;
   // Hysteresis and a cooldown avoid constant framebuffer reallocations.
   if(state.elapsed>=3){
    if(fps<42){state.slow++;state.fast=0;}
    else if(fps>56){state.fast++;state.slow=0;}
    else{state.slow=0;state.fast=0;}
    if(state.slow>=2){
     state.scale=Math.max(.65,Math.round((state.scale-.1)*100)/100);
     state.slow=0;state.elapsed=0;
    }else if(state.fast>=5){
     state.scale=Math.min(1,Math.round((state.scale+.05)*100)/100);
     state.fast=0;state.elapsed=0;
    }
   }
   window.dispatchEvent(new CustomEvent('simulation-telemetry',{detail:{
    fps,frameMs:state.sum*1000/state.frames,
    calls:gl.info.render.calls,triangles:gl.info.render.triangles,
    textures:gl.info.memory.textures,altitude:scene.userData.altitude??0,
    stars:scene.userData.starSource,terrain:scene.userData.terrainSource
   }}));
   state.sum=0;state.frames=0;
  }
 });
 return null;
}
