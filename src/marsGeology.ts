import {noise3} from './sceneMath';

// Seeded cinematic Martian relief. These are illustrative mountains, valleys and
// eroded cliffs, not surveyed mission-site MOLA/HiRISE elevations.
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
// Only the actual footprint needs a safe landing zone, not an entire kilometre
// of flat landscape. Preserve distinct surrounding scenery at every site.
export function marsLandingRadius(site:string,span:number){
 return Math.max(site==='opportunity'?18:site==='insight'?11:site==='ingenuity'?8:9,span*(site==='opportunity'?1.4:.95));
}
// Broader, gradual blend at Opportunity prevents a synthetic mound under its rover.
export function marsLandingTransition(site:string){return site==='opportunity'?78:site==='insight'?45:28;}

/**
 * A narrow, gently meandering *illustrative* dirt approach from the current
 * surface-navigation spawn (positive X/Z) to the equipment. This is a walkable
 * area, not a historical NASA rover route. The same mask is used for rocks,
 * footsteps/navigation and ground shading to avoid invisible obstacles.
 */
export function marsApproachMask(x:number,z:number,equipmentRadius:number){
 const along=(x+z)*Math.SQRT1_2;
 const bend=2*Math.sin(along*.045)*smooth(12,65,along);
 const across=Math.abs((x-z)*Math.SQRT1_2-bend);
 return smooth(Math.max(0,equipmentRadius*.6),equipmentRadius+4,along)
  *(1-smooth(112,142,along))
  *(1-smooth(4.4,8.5,across));
}

export type MarsCrater={x:number;z:number;radius:number};
export function marsCraterField(lat:number,lon:number,landingRadius:number):MarsCrater[]{
 const random=seededRandom(marsSiteSeed(lat,lon)^0x426ac17);
 return Array.from({length:62},()=>{
  const radius=5+Math.pow(random(),1.65)*125;
  const angle=random()*Math.PI*2;
  // Keep impact bowls away from equipment and the nearby walking landscape.
  const distance=landingRadius+470+radius*1.7+Math.pow(random(),1.15)*3200;
  return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,radius};
 });
}
type Mesa={x:number;z:number;rx:number;rz:number;height:number;angle:number};
type Valley={x:number;z:number;angle:number;width:number;length:number;depth:number;phase:number};
export function createMarsRelief(lat:number,lon:number,landingRadius:number,site=''){
 const random=seededRandom(marsSiteSeed(lat,lon));
 const wind=random()*Math.PI*2,acrossX=-Math.sin(wind),acrossZ=Math.cos(wind);
 const offsetX=(random()-.5)*2800,offsetZ=(random()-.5)*2800;
 const craters=marsCraterField(lat,lon,landingRadius);
 const mesas:Mesa[]=Array.from({length:12},(_,i)=>{
  const angle=i*2.399963+random()*.7;
  const distance=340+Math.pow(random(),.7)*2950;
  const radius=135+random()*390;
  return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,
   rx:radius*(.72+random()*.7),rz:radius*(.7+random()*.75),
   height:85+Math.pow(random(),.75)*345,angle:random()*Math.PI};
 });
 const valleys:Valley[]=Array.from({length:5},(_,i)=>{
  const a=i*2.399963+random();
  const d=320+random()*2400;
  return {x:Math.cos(a)*d,z:Math.sin(a)*d,angle:random()*Math.PI*2,
   width:45+random()*125,length:500+random()*1700,depth:45+random()*170,phase:random()*6};
 });
 const centerNoise=noise3(offsetX*.001,11,offsetZ*.001)*42+noise3(offsetX*.003,17,offsetZ*.003)*11;
 // Low, continuous undulations around the equipment. Seeded offset keeps the
 // horizon different at each site. Subtract the centre noise so every lander
 // remains seated exactly on its terrain (no isolated pedestal or crater).
 const localSlowCenter=noise3(offsetX*.012,73,offsetZ*.012);
 const localFineCenter=noise3(offsetX*.035,91,offsetZ*.035);
 return (x:number,z:number)=>{
  const distance=Math.hypot(x,z);
  if(distance>13500)return 0;
  const landing=smooth(landingRadius,landingRadius+marsLandingTransition(site),distance);
  const falloff=1-smooth(7900,12800,distance);
  if(falloff<=0)return 0;
  const x0=x+offsetX,z0=z+offsetZ;
  // Gentle, irregular high ground at the landing site: surrounding soil dips
  // by about a metre over hundreds of metres instead of a visible crater or
  // a lone steep cone. The adjacent terrain continues with rolling relief.
  const lobeDistance=Math.hypot(x*.91+z*.09,z*1.09-x*.055);
  const lowShoulder=-1.15*smooth(18,255,lobeDistance)*
   (1-smooth(410,790,lobeDistance));
  const rolling=
   (noise3(x0*.012,73,z0*.012)-localSlowCenter)*2.3+
   (noise3(x0*.035,91,z0*.035)-localFineCenter)*.42;
  const nearGround=(lowShoulder+rolling)*(1-smooth(630,1050,distance));
  // The severe mesa / ridge field should grow gradually in the distance,
  // not form an artificial wall immediately around a level landing platform.
  const ruggedness=smooth(180,590,distance);
  const broad=noise3(x0*.001,11,z0*.001)*42+noise3(x0*.003,17,z0*.003)*11-centerNoise;
  const warped=noise3(x0*.0019,29,z0*.0019)*72;
  const ridged=Math.pow(1-Math.abs(noise3((x0+warped)*.005,41,(z0-warped)*.005)),2.2)*55;
  // Sculpted eroded mesas: high broken tops, steep terraced sides and talus aprons.
  let cliffs=0;
  for(const m of mesas){
   const dx=x-m.x,dz=z-m.z;
   if(Math.abs(dx)>m.rx*1.65||Math.abs(dz)>m.rz*1.65)continue;
   const ca=Math.cos(m.angle),sa=Math.sin(m.angle);
   const xx=dx*ca+dz*sa,zz=dz*ca-dx*sa;
   const distort=noise3(x*.005,53,z*.005)*.14+noise3(x*.013,37,z*.013)*.045;
   const u=Math.hypot(xx/m.rx,zz/m.rz)+distort;
   if(u>1.5)continue;
   const crest=1-smooth(.57,1.01,u);
   const talus=(1-smooth(.94,1.5,u))*.20;
   const layers=(.80+.14*Math.sin(u*32+noise3(x*.018,9,z*.018)*2.4));
   const fractures=1+noise3(x*.011,61,z*.011)*.18+noise3(x*.028,57,z*.028)*.075;
   cliffs+=m.height*(crest*layers*fractures+talus);
  }
  // Branching erosional valleys crossing the high ground without flattening it.
  let canyons=0;
  for(const v of valleys){
   const dx=x-v.x,dz=z-v.z,ca=Math.cos(v.angle),sa=Math.sin(v.angle);
   const along=dx*ca+dz*sa;
   if(Math.abs(along)>v.length*.65)continue;
   const perpendicular=-dx*sa+dz*ca;
   const centerline=Math.sin(along*.0034+v.phase)*v.width*.48+
    noise3(along*.0045,v.phase,0)*v.width*.33;
   const width=Math.abs(perpendicular-centerline);
   if(width>v.width*1.45)continue;
   const rim=1-smooth(v.width*.6,v.width*1.45,width);
   const lengthMask=1-smooth(v.length*.42,v.length*.64,Math.abs(along));
   canyons-=v.depth*rim*lengthMask;
  }
  // Fine dunes, ripple fields and gravelly ridges near the camera.
  const across=x*acrossX+z*acrossZ;
  const dunes=(Math.pow(.5+.5*Math.sin(across*.055+noise3(x0*.01,7,z0*.01)*1.4),3)-.42)*.85;
  const ripples=Math.sin(across*.72+noise3(x0*.11,5,z0*.11)*.35)*.038*
   (1-smooth(120,520,distance));
  let impacts=0;
  for(const crater of craters){
   const dx=x-crater.x,dz=z-crater.z;
   const limit=crater.radius*1.55;
   if(dx*dx+dz*dz>=limit*limit)continue;
   const u=Math.hypot(dx,dz)/crater.radius;
   const bowl=u<1?-.15*crater.radius*Math.pow(1-u*u,2):0;
   const rim=.054*crater.radius*Math.exp(-Math.pow((u-1)/.16,2));
   impacts+=(bowl+rim)*(1-smooth(1.27,1.55,u));
  }
  return (nearGround+(broad+ridged+cliffs+canyons)*ruggedness*landing+
   (dunes+ripples)*landing+impacts)*falloff;
 };
}
