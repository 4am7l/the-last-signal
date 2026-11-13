import {useEffect,useState} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
const urls:Record<string,string>={earth:'8k_earth_daymap.jpg',moon:'8k_moon.jpg',mars:'8k_mars.jpg'};
const cache=new Map<string,Promise<T.Texture>>();
export function usePlanetTexture(body:string,detail=true){
 const base=useLoader(T.TextureLoader,body==='mars'?'/mars-nasa-viking.jpg':'/'+body+'.jpg'),{gl}=useThree();
 const [high,setHigh]=useState<{body:string;map:T.Texture}|null>(null);
 useEffect(()=>{
  const configure=(t:T.Texture)=>{t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.anisotropy=Math.min(16,gl.capabilities.getMaxAnisotropy());t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t};
  configure(base);// Mars uses a locally bundled NASA/JPL/USGS Viking map consistently. Do not
  // asynchronously swap to a differently colour-graded 8K map mid-flight.
  if(body==='mars'||!detail||!urls[body]||gl.capabilities.maxTextureSize<8192)return;
  let alive=true;
  // Give the bundled globe a first frame before optional 8K downloads.
  // Keep the identical full-resolution texture and cache it across visits.
  const upgrade=()=>{
   if(!cache.has(body))cache.set(body,new T.TextureLoader().loadAsync('https://www.solarsystemscope.com/textures/download/'+urls[body]));
   cache.get(body)!.then(t=>{if(alive)setHigh({body,map:configure(t)})}).catch(()=>{cache.delete(body)});
  };
  if(cache.has(body))upgrade();
  const timer=cache.has(body)?undefined:window.setTimeout(upgrade,1500);
  return()=>{alive=false;if(timer!==undefined)window.clearTimeout(timer)};
 },[base,body,detail,gl]);
 return high?.body===body?high.map:base;
}
