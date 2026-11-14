import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useSimulation,PRESETS} from './simulation';

// Ultra uses native device resolution up to 2x without dynamic quality scaling.
export function RenderSettings(){
 const {gl,setDpr}=useThree();
 const settings=useSimulation();
 const clock=useRef({sum:0,frames:0,dpr:0});
 useFrame(({scene},dt)=>{
  gl.toneMappingExposure=settings.exposure;
  const state=clock.current;
  const targetDpr=Math.min(window.devicePixelRatio||1,PRESETS.ultra.dpr);
  if(state.dpr!==targetDpr){state.dpr=targetDpr;setDpr(targetDpr);}
  const elapsed=Math.min(dt,.25);
  state.sum+=elapsed;
  state.frames++;
  if(state.sum>=1){
   const fps=state.frames/state.sum;
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
