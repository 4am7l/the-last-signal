import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';

export function InspectionEnvironment({strength}:{strength:number}){
 const {gl,scene}=useThree();
 const environment=useMemo(()=>{
  const width=64,height=32,pixels=new Float32Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const latitude=((y+.5)/height-.5)*Math.PI;
   const up=Math.sin(latitude),sky=Math.max(0,up);
   const overhead=Math.pow(sky,8)*2.4;
   const ambient=.16+.20*sky;
   const i=(y*width+x)*4;
   pixels[i]=ambient+overhead;
   pixels[i+1]=ambient*1.04+overhead;
   pixels[i+2]=ambient*1.12+overhead*1.04;
   pixels[i+3]=1;
  }
  const texture=new T.DataTexture(pixels,width,height,T.RGBAFormat,T.FloatType);
  texture.mapping=T.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const generator=new T.PMREMGenerator(gl);
  const target=generator.fromEquirectangular(texture);
  texture.dispose();generator.dispose();return target;
 },[gl]);
 useEffect(()=>{
  const previous=scene.environment,previousIntensity=scene.environmentIntensity;
  scene.environment=environment.texture;
  return()=>{scene.environment=previous;scene.environmentIntensity=previousIntensity;};
 },[scene,environment]);
 useEffect(()=>()=>environment.dispose(),[environment]);
 useFrame(()=>{scene.environmentIntensity=strength;});
 return null;
}
