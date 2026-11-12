export const RADII_KM={earth:6371,moon:1737.4,mars:3389.5};
export const EARTH_MOON_KM=384400;
// Explicit illustrative orbital separation, not today's ephemeris.
export const EXAMPLE_EARTH_MARS_KM=225000000;
export function systemLayout(physical:boolean){
 const scale=300/RADII_KM.mars;
 return {scale,earth:[-2300,0,0] as [number,number,number],moon:[-2300+(physical?EARTH_MOON_KM*scale:1350),0,0] as [number,number,number],mars:[-2300+(physical?EXAMPLE_EARTH_MARS_KM*scale:8500),0,0] as [number,number,number]};
}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
function hash(x:number,y:number,z:number){const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n)}
export function noise3(x:number,y:number,z:number){
 const a=Math.floor(x),b=Math.floor(y),c=Math.floor(z),u=smooth(x-a),v=smooth(y-b),w=smooth(z-c);
 const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
 return mix(mix(mix(hash(a,b,c),hash(a+1,b,c),u),mix(hash(a,b+1,c),hash(a+1,b+1,c),u),v),mix(mix(hash(a,b,c+1),hash(a+1,b,c+1),u),mix(hash(a,b+1,c+1),hash(a+1,b+1,c+1),u),v),w)*2-1;
}
// Coherent visual relief only: no MOLA elevations are claimed.
export function marsRelief(x:number,y:number,z:number){return noise3(x*5,y*5,z*5)*2400+noise3(x*19,y*19,z*19)*650+noise3(x*61,y*61,z*61)*180}
export function mountains(x:number,z:number,body:'moon'|'mars'){
 const d=Math.hypot(x,z);if(d<100||d>24000)return 0;
 let h=0;
 for(let i=0;i<9;i++){
  const a=i*2.3999+.6,r=2500+(i*1379%12000),cx=Math.cos(a)*r,cz=Math.sin(a)*r;
  const width=650+(i*281%1800),q=((x-cx)**2+(z-cz)**2)/(width*width);
  h+=(body==='moon'?240:400)*(1+(i%4)*.35)*Math.exp(-q)*(1+.22*noise3(x*.001,0,z*.001));
 }
 return h*smooth((d-100)/700)*(1-smooth((d-18000)/6000));
}
// Seeded random directions avoid the visible Fibonacci lattice during rotation.
// Balanced hemispheres keep coverage even without imposing a visible pattern.
export function starDirections(count:number){
 const points=new Float32Array(count*3);let seed=73519;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<count;i++){const y=(i%2?-1:1)*random(),r=Math.sqrt(1-y*y),a=random()*Math.PI*2;points.set([r*Math.cos(a),y,r*Math.sin(a)],i*3)}return points;
}
// Illustrative local geology, NOT a DEM reconstruction of a mission site.
export function surfaceDetail(x:number,z:number,body:'moon'|'mars'){
 const d=Math.hypot(x,z),fade=smooth((d-9)/20)*(1-smooth((d-2600)/1400));
 if(!fade)return 0;
 const n=noise3(x*.012,body==='moon'?0:7,z*.012);
 if(body==='moon'){
  const brokenRidges=(1-Math.abs(noise3(x*.035,2,z*.035)))**3;
  return (n*1.3+brokenRidges*.6+noise3(x*.23,0,z*.23)*.12)*fade;
 }
 const wind=x*.16+z*.065+noise3(x*.006,4,z*.006)*2.5;
 const dunes=Math.pow(.5+.5*Math.sin(wind),3)*1.2;
 const shelves=Math.tanh(noise3(x*.008,5,z*.008)*4)*2.1;
 return (dunes+shelves+n*.45+noise3(x*.32,3,z*.32)*.08)*fade;
}
export function cameraTuning(altitude:number,radius:number,local:boolean){
 const ratio=Math.max(0,altitude)/Math.max(radius,1e-9);
 return {rotate:local?.32:Math.max(.035,Math.min(.65,ratio*.8)),
 zoom:local?.45:Math.max(.055,Math.min(.85,ratio*.95)),pan:local?.35:0};
}
// Zoom relative to clearance, not the planet-centre distance.
export function zoomDistance(distance:number,min:number,max:number,inward:boolean){
 const clearance=Math.max(distance-min,min*.015,1e-7);
 return Math.max(min,Math.min(max,min+clearance*(inward?.72:1.38)));
}
