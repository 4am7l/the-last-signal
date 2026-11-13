import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useSimulation,PRESETS} from './simulation';
export function RenderSettings(){
 const {gl,setDpr}=useThree(),settings=useSimulation(),clock=useRef({sum:0,frames:0,dpr:0});
 useFrame(({scene},dt)=>{
  gl.toneMappingExposure=settings.exposure;
  const dpr=Math.min(window.devicePixelRatio||1,PRESETS[settings.quality].dpr);
  if(clock.current.dpr!==dpr){clock.current.dpr=dpr;setDpr(dpr);}
  clock.current.sum+=dt;clock.current.frames++;
  if(clock.current.sum>=.5){
   const {sum,frames}=clock.current;
   window.dispatchEvent(new CustomEvent('simulation-telemetry',{detail:{fps:frames/sum,frameMs:sum*1000/frames,calls:gl.info.render.calls,triangles:gl.info.render.triangles,textures:gl.info.memory.textures,altitude:scene.userData.altitude??0,stars:scene.userData.starSource,terrain:scene.userData.terrainSource}}));
   clock.current.sum=0;clock.current.frames=0;
  }
 });
 return null;
}
