import {noise3} from './sceneMath';

// Site-seeded, illustrative regolith and landforms, not a reconstruction of MOLA/HiRISE imagery.
// Local geometry is anchored to the actual mission-site DEM when one is available.
const smooth=(a:number,b:number,x:number)=>{
 const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
 return t*t*(3-2*t);
};
function seededRandom(seed:number){
 let state=seed>>>0||1;
 return ()=>{
  state^=state<<13;state^=state>>>17;state^=state<<5;
  return (state>>>0)/4294967296;
 };
}
export function marsSiteSeed(lat:number,lon:number){
 return (Math.imul(Math.round((lat+90)*10000),73856093)^Math.imul(Math.round((lon+360)*10000),19349663))>>>0;
}
// All Mars landing sites need a safe nearly-level local apron. InSight sits on
// particularly smooth plains, so its landing apron and transition are wider.
export function marsLandingRadius(site:string,span:number){
 return Math.max(site==='insight'?28:site==='ingenuity'?17:19,span*1.6);
}
export type MarsCrater={x:number;z:number;radius:number};
export function marsCraterField(lat:number,lon:number,landingRadius:number):MarsCrater[]{
 const random=seededRandom(marsSiteSeed(lat,lon)^0x426ac17);
 return Array.from({length:49},()=>{
  const radius=4+Math.pow(random(),2.3)*92;
  const angle=random()*Math.PI*2;
  // Never put a crater bowl/rim beneath the exploration equipment.
  const distance=landingRadius+100+radius*1.65+Math.pow(random(),1.4)*2850;
  return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,radius};
 });
}
export function createMarsRelief(lat:number,lon:number,landingRadius:number,site=''){
 const random=seededRandom(marsSiteSeed(lat,lon));
 const wind=random()*Math.PI*2;
 const alongX=Math.cos(wind),alongZ=Math.sin(wind);
 const offsetX=(random()-.5)*3200,offsetZ=(random()-.5)*3200;
 const craters=marsCraterField(lat,lon,landingRadius);
 const isPlain=site==='insight';
 const roughness=isPlain ? 0.55 : 1;
 const broadAtCenter=noise3(offsetX*.0012,11,offsetZ*.0012)*15+noise3(offsetX*.0034,17,offsetZ*.0034)*4.5;
 const shelfAtCenter=Math.pow(Math.max(0,noise3(offsetX*.0017,29,offsetZ*.0017)-.2),2)*26;
 return (x:number,z:number)=>{
  const distance=Math.hypot(x,z);
  if(distance>5700)return 0;
  const onset=smooth(landingRadius,landingRadius+(isPlain?135:100),distance);
  const farFade=1-smooth(3450,5650,distance);
  if(onset<=0||farFade<=0)return 0;
  const x0=x+offsetX,z0=z+offsetZ;
  // Subtract the site's background height before adding landforms: avoids a
  // raised doughnut around an artificially flat landing area.
  const broad=(noise3(x0*.0012,11,z0*.0012)*15+noise3(x0*.0034,17,z0*.0034)*4.5)-broadAtCenter;
  const shelves=Math.pow(Math.max(0,noise3(x0*.0017,29,z0*.0017)-.2),2)*26-shelfAtCenter;
  const warp=noise3(x0*.0022,41,z0*.0022)*25;
  const ridge=Math.pow(1-Math.abs(noise3((x0+warp)*.007,53,(z0-warp)*.007)),5)*3.8;
  // Wind-smoothed sand ribbons with fine ripples, not metre-high repeated waves.
  const across=-x*alongZ+z*alongX;
  const downwind=x*alongX+z*alongZ;
  const dunePhase=across*.18+noise3(x0*.023,23,z0*.023)*1.2;
  const dunes=(Math.pow(.5+.5*Math.sin(dunePhase),3)-.36)*.72;
  const ripples=Math.sin(across*1.35+downwind*.09+noise3(x0*.14,5,z0*.14)*.4)*.045*(1-smooth(120,490,distance));
  let impacts=0;
  for(const crater of craters){
   const dx=x-crater.x,dz=z-crater.z,squared=dx*dx+dz*dz;
   const limit=crater.radius*1.5;
   if(squared>=limit*limit)continue;
   const u=Math.sqrt(squared)/crater.radius;
   const bowl=u<1?-.085*crater.radius*(1-u*u)**2:0;
   const rim=.027*crater.radius*Math.exp(-Math.pow((u-1)/.18,2));
   impacts+=(bowl+rim)*(1-smooth(1.25,1.5,u));
  }
  // Fade rather than clipping the geology. All missions get a stable landing
  // apron; surrounding relief stays readable at kilometre scales.
  return (broad+shelves+ridge+dunes+ripples+impacts)*roughness*onset*farFade;
 };
}
