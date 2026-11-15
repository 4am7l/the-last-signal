import {useEffect,useLayoutEffect,useState} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
const cache=new Map<string,Promise<T.Texture>>();
export function planetTexturePath(body:string){return '/'+body+'.jpg';}

export function usePlanetTexture(body:string,detail=true){
 const base=useLoader(T.TextureLoader,planetTexturePath(body)),{gl}=useThree();
 const [high,setHigh]=useState<{body:string;map:T.Texture}|null>(null);
 const maxAnisotropy=Math.min(16,gl.capabilities.getMaxAnisotropy());
 const map=high?.body===body?high.map:base;
 useLayoutEffect(()=>{
  if(map.colorSpace===T.SRGBColorSpace&&map.wrapS===T.RepeatWrapping&&map.anisotropy===maxAnisotropy)return;
  map.colorSpace=T.SRGBColorSpace;
  map.wrapS=T.RepeatWrapping;
  map.anisotropy=maxAnisotropy;
  map.needsUpdate=true;
 },[map,maxAnisotropy]);
 useEffect(()=>{
  if(body!=='moon'||!detail||gl.capabilities.maxTextureSize<8192)return;
  let alive=true;
  const upgrade=()=>{
   if(!cache.has(body))cache.set(body,new T.TextureLoader().loadAsync('https://www.solarsystemscope.com/textures/download/8k_moon.jpg'));
   cache.get(body)!.then(t=>{if(alive)setHigh({body,map:t})}).catch(()=>{cache.delete(body)});
  };
  if(cache.has(body))upgrade();
  const timer=cache.has(body)?undefined:window.setTimeout(upgrade,1500);
  return()=>{alive=false;if(timer!==undefined)window.clearTimeout(timer)};
 },[body,detail,gl]);
 return map;
}
