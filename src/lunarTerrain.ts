import {noise3} from './sceneMath';
// Mean spherical radii, metres. The render scale is arbitrary; ratios are physical.
export const MOON_RADIUS_METRES = 1737400;
export const EARTH_RADIUS_METRES = 6371000;
export const MARS_RADIUS_METRES = 3389500;
export const MOON_RENDER_RADIUS = 300;
export const METRES_TO_SCENE = MOON_RENDER_RADIUS / MOON_RADIUS_METRES;
const smooth = (a:number,b:number,x:number) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
// Low mare basalt plains around Apollo 11, with small softened impact
// craters and distant rolling regolith. This is illustrative microterrain,
// not a metre-accurate Apollo site survey.
export const craters=Array.from({length:28},(_,i)=>{
 const angle=i*2.399963229728653+.25*Math.sin(i*1.7);
 const distance=i<7?145+i*101:36+Math.pow((i-6)/22,1.18)*1010;
 const radius=i<7?25+(i*19%62):4+(i*11%21);
 return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,radius};
});
export function craterHeight(distance:number,radius:number){
 const u=distance/radius;
 if(u>=1.5)return 0;
 const bowl=u<1?-radius*.085*Math.pow(1-u*u,2):0;
 const rim=radius*.032*Math.exp(-Math.pow((u-1)/.22,2));
 return (bowl+rim)*(1-smooth(1.28,1.5,u));
}
const moonNoiseOrigin=noise3(0,19,0),fineNoiseOrigin=noise3(0,37,0),ridgeOrigin=noise3(0,53,0),rubbleOrigin=noise3(0,67,0);
export function localRelief(x:number,z:number){
 const d=Math.hypot(x,z);
 if(d>=1750||d<=5)return 0;
 const pad=smooth(5,18,d),edge=1-smooth(1250,1750,d);
 // Wide, broad shouldered rises, not pointed mountain cones.
 const broad=(noise3(x*.006,19,z*.006)-moonNoiseOrigin)*2.35+
  (noise3(x*.021,37,z*.021)-fineNoiseOrigin)*.51;
 const ridge=(noise3(x*.0035,53,z*.0035)-ridgeOrigin)*4.2;
 const shoulder=(Math.exp(-((x-215)**2/(2*180**2)+(z+110)**2/(2*260**2)))-
  Math.exp(-((215)**2/(2*180**2)+(110)**2/(2*260**2))))*2.9;
 const smallRubble=(noise3(x*.095,67,z*.095)-rubbleOrigin)*.075;
 let impacts=0;
 for(const c of craters){
  const dx=x-c.x,dz=z-c.z,range=c.radius*1.5;
  if(Math.abs(dx)<range&&Math.abs(dz)<range)impacts+=craterHeight(Math.hypot(dx,dz),c.radius);
 }
 return (broad+ridge+shoulder+smallRubble+impacts)*pad*edge;
}
// Preserve fine rings at the equipment AND adequate coverage on the far hemisphere.
export function ringAngle(index:number,nearRings=160,farRings=320,radiusMetres=MOON_RADIUS_METRES){
 if(index===0)return 0;
 if(index<=nearRings)return Math.exp(Math.log(.25/radiusMetres)+(Math.log(.01)-Math.log(.25/radiusMetres))*(index-1)/(nearRings-1));
 return .01+(Math.PI-.01)*(index-nearRings)/farRings;
}
