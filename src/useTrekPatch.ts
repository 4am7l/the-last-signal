import {useEffect,useState} from 'react';
import * as T from 'three';

// Official NASA/JPL Trek equirectangular WMTS layers. They are georegistered
// global imagery, not new fictional ground textures. If CORS, data coverage
// or the network fails, the base globe imagery remains fully functional.
type Body='moon'|'mars';
export type TrekPatch={
 texture:T.Texture;
 // Equirectangular UV: west, south, width, height in the same coordinates
 // as the global image (0..1, bottom-to-top).
 extent:T.Vector4;
 source:string;
};
const atlasCache=new Map<string,Promise<TrekPatch|null>>();
const trekLayers:Record<Body,{name:string;z:number;source:string}>={
 moon:{
  name:'Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02',
  z:8,
  source:'NASA LRO WAC global 100 m imagery'
 },
 mars:{
  name:'Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m',
  z:7,
  source:'NASA/JPL/USGS Viking MDIM21 232 m imagery'
 }
};
const mod=(n:number,d:number)=>((n%d)+d)%d;
const loadImage=(url:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{
 const image=new Image();
 image.crossOrigin='anonymous';
 image.decoding='async';
 image.onload=()=>resolve(image);
 image.onerror=()=>reject(new Error('NASA Trek tile unavailable'));
 image.src=url;
});
async function buildPatch(body:Body,latitude:number,longitude:number):Promise<TrekPatch|null>{
 const layer=trekLayers[body],tiles=4,side=256;
 const cols=2**(layer.z+1),rows=2**layer.z;
 const longitudeU=mod(longitude+180,360)/360;
 const latitudeV=T.MathUtils.clamp((90-latitude)/180,0,1-1e-8);
 const firstCol=T.MathUtils.clamp(Math.floor(longitudeU*cols)-1,0,cols-tiles);
 const firstRow=T.MathUtils.clamp(Math.floor(latitudeV*rows)-1,0,rows-tiles);
 const base='https://trek.nasa.gov/tiles/'+layer.name+
  '/1.0.0/default/default028mm/';
 const urls:string[]=[];
 for(let row=0;row<tiles;row++)for(let col=0;col<tiles;col++){
  urls.push(base+layer.z+'/'+(firstRow+row)+'/'+(firstCol+col)+'.jpg');
 }
 const images=await Promise.all(urls.map(loadImage));
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=tiles*side;
 const ctx=canvas.getContext('2d');
 if(!ctx)return null;
 for(let row=0;row<tiles;row++)for(let col=0;col<tiles;col++){
  ctx.drawImage(images[row*tiles+col],col*side,row*side,side,side);
 }
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 texture.minFilter=T.LinearMipmapLinearFilter;
 texture.magFilter=T.LinearFilter;
 texture.anisotropy=8;
 texture.needsUpdate=true;
 // NASA WMTS atlas is north-to-south. CanvasTexture's flipY maps the
 // northernmost row to v=1, matching our spherical UV convention.
 const minU=firstCol/cols,minV=1-(firstRow+tiles)/rows;
 return {
  texture,
  extent:new T.Vector4(minU,minV,tiles/cols,tiles/rows),
  source:layer.source
 };
}
function cachedPatch(body:Body,lat:number,lon:number){
 const key=body+':'+lat.toFixed(4)+':'+lon.toFixed(4);
 if(!atlasCache.has(key)){
  atlasCache.set(key,buildPatch(body,lat,lon).catch(()=>null));
 }
 return atlasCache.get(key)!;
}
export function useTrekPatch(body:string,lat:number,lon:number,enabled=true){
 const key=body+':'+lat.toFixed(4)+':'+lon.toFixed(4);
 const [ready,setReady]=useState<{key:string;patch:TrekPatch|null}|null>(null);
 useEffect(()=>{
  // Initial orbital view should not request 16 local imagery tiles before
  // the visitor selects a planet/site. Begin only once exploration starts.
  if(!enabled||(body!=='moon'&&body!=='mars'))return;
  let active=true;
  cachedPatch(body,lat,lon).then(patch=>{
   if(active)setReady({key,patch});
  });
  return()=>{active=false};
 },[body,lat,lon,key,enabled]);
 return enabled&&ready?.key===key?ready.patch:null;
}
