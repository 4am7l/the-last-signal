import {noise3} from './sceneMath';

// Deterministic, illustrative Martian micro-geology, not a surveyed MOLA/HiRISE DEM.
// Planet-scale elevations, when available, remain supplied by the existing DEM pipeline.
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
type Crater={x:number;z:number;radius:number};
export function createMarsRelief(lat:number,lon:number,clearance:number){
 const random=seededRandom(marsSiteSeed(lat,lon));
 const wind=random()*Math.PI*2;
 const alongX=Math.cos(wind),alongZ=Math.sin(wind);
 const offsetX=(random()-.5)*3200,offsetZ=(random()-.5)*3200;
 const craters:Crater[]=Array.from({length:52},()=>{
  const angle=random()*Math.PI*2;
  const distance=25+Math.pow(random(),1.25)*2500;
  return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,radius:4+Math.pow(random(),2.2)*115};
 });
 return (x:number,z:number)=>{
  const distance=Math.hypot(x,z);
  if(distance>5800)return 0;
  const safety=smooth(clearance+2,clearance+22,distance);
  const fade=1-smooth(3200,5600,distance);
  if(safety<=0||fade<=0)return 0;
  const x0=x+offsetX,z0=z+offsetZ;
  // Broad erosion-smoothed landforms, ridges and occasional exposed rocky mesas.
  const broad=noise3(x0*.0012,11,z0*.0012)*24+noise3(x0*.0038,17,z0*.0038)*7;
  const shelves=Math.pow(Math.max(0,noise3(x0*.0017,29,z0*.0017)-.12),2)*55;
  const warped=noise3(x0*.0022,41,z0*.0022)*42;
  const ridge=Math.pow(1-Math.abs(noise3((x0+warped)*.007,53,(z0-warped)*.007)),4)*7;
  // Wind-shaped sand waves with nested small ripples, strongest near sandy ground.
  const across=x*(-alongZ)+z*alongX;
  const downwind=x*alongX+z*alongZ;
  const dunePhase=across*.23+noise3(x0*.025,23,z0*.025)*1.8;
  const dunes=(Math.pow(.5+.5*Math.sin(dunePhase),3)-.35)*1.35;
  const ripplePhase=across*1.6+downwind*.11+noise3(x0*.16,5,z0*.16)*.6;
  const ripple=Math.sin(ripplePhase)*.095*(1-smooth(130,450,distance));
  let impact=0;
  for(const crater of craters){
   const dx=x-crater.x,dz=z-crater.z;
   const limit=crater.radius*1.55;
   const squared=dx*dx+dz*dz;
   if(squared>=limit*limit)continue;
   const u=Math.sqrt(squared)/crater.radius;
   const bowl=u<1?-.11*crater.radius*Math.pow(1-u*u,2):0;
   const rim=.032*crater.radius*Math.exp(-Math.pow((u-1)/.18,2));
   impact+=(bowl+rim)*(1-smooth(1.25,1.55,u));
  }
  return (broad+shelves+ridge+impact+dunes+ripple)*safety*fade;
 };
}
