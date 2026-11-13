import {useEffect,useState} from 'react';
import {decodeLola,decodeMola,type ElevationGrid} from './elevation';
const requests=new Map<string,Promise<ElevationGrid|null>>();
const sources={
 moon:'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4_uint.tif',
 mars:'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megr90n000cb.img',
 label:'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg004/megr90n000cb.lbl'
};
async function resource(kind:keyof typeof sources){
 try{const r=await fetch('/api/terrain?asset='+kind,{signal:AbortSignal.timeout(12000)});if(r.ok&&!(r.headers.get('content-type')??'').includes('text/html'))return r;throw Error();}
 catch{const r=await fetch(sources[kind],{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('DEM unavailable');return r;}
}
function load(body:string){if(!requests.has(body))requests.set(body,(async()=>{
 try{if(body==='moon')return decodeLola(await (await resource('moon')).arrayBuffer());
 const [image,label]=await Promise.all([resource('mars').then(r=>r.arrayBuffer()),resource('label').then(r=>r.text())]);return decodeMola(image,label);
 }catch{return null;}
})());return requests.get(body)!;}
export function useElevation(body:string){
 const [result,setResult]=useState<{body:string;grid:ElevationGrid|null}|null>(null);
 useEffect(()=>{let alive=true;if(body==='earth')return;load(body).then(grid=>{if(alive)setResult({body,grid})});return()=>{alive=false}},[body]);
 return result?.body===body?result.grid:null;
}
