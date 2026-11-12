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
export function starDirections(count:number){const points=new Float32Array(count*3);const angle=Math.PI*(3-Math.sqrt(5));for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y),a=i*angle;points.set([r*Math.cos(a),y,r*Math.sin(a)],i*3)}return points}
