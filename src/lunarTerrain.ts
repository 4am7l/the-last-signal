// Mean spherical radii, metres. The render scale is arbitrary; ratios are physical.
export const MOON_RADIUS_METRES = 1737400;
export const EARTH_RADIUS_METRES = 6371000;
export const MARS_RADIUS_METRES = 3389500;
export const MOON_RENDER_RADIUS = 300;
export const METRES_TO_SCENE = MOON_RENDER_RADIUS / MOON_RADIUS_METRES;
const smooth = (a:number,b:number,x:number) => {const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
// Reproducible visual microterrain, NOT surveyed Apollo crater coordinates.
export const craters=Array.from({length:34},(_,i)=>{
 const angle=i*2.399963229728653, distance=32+Math.pow(i/33,1.7)*1050;
 const radius=Math.min(3+(i*13%29)+distance*.025,(distance-24)/1.5);
 return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,radius};
});
export function craterHeight(distance:number,radius:number){
 const u=distance/radius;
 if(u>=1.5)return 0;
 const bowl=u<1?-radius*.16*Math.pow(1-u*u,2):0;
 const rim=radius*.055*Math.exp(-Math.pow((u-1)/.14,2));
 return (bowl+rim)*(1-smooth(1.25,1.5,u));
}
export function localRelief(x:number,z:number){
 const d=Math.hypot(x,z);if(d>=1600||d<=9)return 0;
 const broad=Math.sin(x*.008)*Math.cos(z*.011)*1.8;
 const grain=Math.sin(x*.23)*Math.cos(z*.29)*.1+Math.sin(x*.71+z*.49)*.035;
 let h=broad+grain;
 for(const crater of craters)h+=craterHeight(Math.hypot(x-crater.x,z-crater.z),crater.radius);
 return h*smooth(9,22,d)*(1-smooth(1200,1600,d));
}
// Preserve fine rings at the equipment AND adequate coverage on the far hemisphere.
export function ringAngle(index:number,nearRings=160,farRings=320,radiusMetres=MOON_RADIUS_METRES){
 if(index===0)return 0;
 if(index<=nearRings)return Math.exp(Math.log(.25/radiusMetres)+(Math.log(.01)-Math.log(.25/radiusMetres))*(index-1)/(nearRings-1));
 return .01+(Math.PI-.01)*(index-nearRings)/farRings;
}
