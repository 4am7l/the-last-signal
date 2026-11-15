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

/**
 * Illustrative, mission-specific MER rover wheel paths. The rover and both
 * parallel tyre marks use this exact reference frame, so their contact lanes
 * follow the same heading instead of diverging into a separate road.
 * They are visitor visualizations, not historical NASA traverse coordinates.
 */
export function marsRoverRoadYaw(site:string){
 return site==='spirit'?-0.36:site==='opportunity'?.26:0;
}
function roverRoadBend(t:number,site:string){
 const u=Math.max(0,Math.min(1,t));
 const direction=site==='spirit'?1:-1;
 return direction*(.68*u*u*(3-2*u)+.26*Math.sin(Math.PI*u)**2);
}
export function marsRoverRoadPoint(t:number,side:number,site:string){
 const u=Math.max(0,Math.min(1,t));
 const localX=-.95-33*u;
 const localZ=side*.72+roverRoadBend(u,site);
 const yaw=marsRoverRoadYaw(site),c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:localX*c+localZ*s,z:-localX*s+localZ*c};
}
export function marsRoverRoadClearance(x:number,z:number,site:string,margin:number){
 if(site!=='spirit'&&site!=='opportunity')return false;
 const yaw=marsRoverRoadYaw(site),c=Math.cos(yaw),s=Math.sin(yaw);
 const localX=x*c-z*s,localZ=x*s+z*c;
 const travel=-localX;
 if(travel<.6-margin||travel>34.0+margin)return false;
 const bend=roverRoadBend((travel-.95)/33,site);
 return Math.abs(localZ-bend)<1.0+margin;
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
  const distance=580+Math.pow(random(),.7)*2780;
  const radius=275+random()*430;
  return {x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,
   rx:radius*(.92+random()*.50),rz:radius*(.90+random()*.54),
   height:45+Math.pow(random(),.75)*135,angle:random()*Math.PI};
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
 const regionalCenter=noise3(offsetX*.007,25,offsetZ*.007);
 const smallStonesCenter=noise3(offsetX*.071,117,offsetZ*.071);
 const soilRipplesCenter=noise3(offsetX*.21,133,offsetZ*.21);
 // Four story-site landforms. Illustrative metre-scale detail, NOT a claim that
 // MOLA resolves these slopes; the referenced mission coordinates remain real.
 // The origin remains at height zero so equipment never floats or gets buried.
 const ingenuityHillAtOrigin=8.2*Math.exp(
  -(125*125/(2*92*92)+45*45/(2*115*115)));
 const spiritShoulderAtOrigin=3.4*Math.exp(
  -(115*115/(2*105*105)+90*90/(2*95*95)));
 return (x:number,z:number)=>{
  const distance=Math.hypot(x,z);
  if(distance>13500)return 0;
  const landing=smooth(landingRadius,landingRadius+marsLandingTransition(site),distance);
  const falloff=1-smooth(7900,12800,distance);
  if(falloff<=0)return 0;
  const x0=x+offsetX,z0=z+offsetZ;
  // Differentiated, naturally uneven landscapes instead of one flattened pad
  // for every mission. Keep a short low-gradient footprint under the equipment
  // and reveal slope, terrain height and rock fields within walking distance.
  // Keep only the actual landing-gear contact patch level. The old radial
  // mask flattened a huge halo around every site, making all scenes look alike.
  const supportRadius=Math.max(3.2,Math.min(6,landingRadius*.28));
  const safeFootprint=smooth(supportRadius,supportRadius+8,distance);
  const vicinity=1-smooth(430,860,distance);
  const regional=(noise3(x0*.007,25,z0*.007)-regionalCenter)*4.5;
  const rolling=(noise3(x0*.012,73,z0*.012)-localSlowCenter)*3.8+
   (noise3(x0*.035,91,z0*.035)-localFineCenter)*1.18+
   (noise3(x0*.071,117,z0*.071)-smallStonesCenter)*.52+
   (noise3(x0*.21,133,z0*.21)-soilRipplesCenter)*.075+
   regional;
  let feature=0;
  if(site==='opportunity'){
   // Opportunity actually landed in Eagle crater. Show a broad, gently
   // irregular crater floor, shoulder and broken rim, not a hard circular pit.
   const d=Math.hypot(x*.93+z*.085,z*1.08-x*.055);
   const unevenRim=83+9*noise3(x*.018,57,z*.018);
   const floorClimb=2.9*smooth(landingRadius*.75,69,d)*(1-smooth(180,330,d));
   const brokenRim=1.4*Math.exp(-Math.pow((d-unevenRim)/34,2));
   feature=floorClimb+brokenRim;
  }else if(site==='spirit'){
   // Gusev: modest traversable slope with an off-centre rocky shoulder.
   const rise=(x*.78+z*.63)*.045*(1-smooth(260,560,distance));
   const dx=x+115,dz=z-90;
   const hill=3.4*Math.exp(-(dx*dx/(2*105*105)+dz*dz/(2*95*95)));
   feature=rise+(hill-spiritShoulderAtOrigin)*(1-smooth(330,700,distance));
  }else if(site==='insight'){
   // InSight's Homestead Hollow is a low-relief, shallow depression,
   // surrounded by rolling sandy ground; no conspicuous artificial mound.
   const d=Math.hypot(x*1.1+z*.07,z*.94-x*.05);
   feature=2.2*smooth(9,155,d)*(1-smooth(265,515,d));
  }else if(site==='ingenuity'){
   // Jezero: a broad shoulder of rocky high ground to one side, with nearby
   // low swales. Zero-centre correction preserves contact with the helicopter.
   const dx=x-125,dz=z+45;
   const hill=8.2*Math.exp(-(dx*dx/(2*92*92)+dz*dz/(2*115*115)));
   const shallowSwale=1.6*Math.exp(-((x+105)**2+(z-75)**2)/(2*110*110));
   feature=(hill-ingenuityHillAtOrigin)-shallowSwale*(1-smooth(340,700,distance));
  }else{
   // Future landing sites: distinct rolling terrain without forced craters.
   feature=(x*.32-z*.22)*.015*(1-smooth(220,490,distance));
  }
  const nearGround=(rolling+feature)*safeFootprint*vicinity;
  // Bring large rocky mountains in from the middle distance, smoothly.
  const ruggedness=smooth(85,360,distance);
  const broad=noise3(x0*.001,11,z0*.001)*42+noise3(x0*.003,17,z0*.003)*11-centerNoise;
  const warped=noise3(x0*.0019,29,z0*.0019)*72;
  // Fade only the distant sharp ridge crests; preserve the existing nearby soil.
  const sharpRidge=Math.pow(1-Math.abs(noise3((x0+warped)*.005,41,(z0-warped)*.005)),2.2)*55;
  const ridged=sharpRidge*(1-.52*smooth(500,1100,distance));
  // Distant eroded hills: broad rounded crowns, low shoulders and no knife peaks.
  let cliffs=0;
  for(const m of mesas){
   const dx=x-m.x,dz=z-m.z;
   if(Math.abs(dx)>m.rx*1.65||Math.abs(dz)>m.rz*1.65)continue;
   const ca=Math.cos(m.angle),sa=Math.sin(m.angle);
   const xx=dx*ca+dz*sa,zz=dz*ca-dx*sa;
   const distort=noise3(x*.005,53,z*.005)*.14+noise3(x*.013,37,z*.013)*.045;
   const u=Math.hypot(xx/m.rx,zz/m.rz)+distort;
   if(u>1.5)continue;
   const roundCrown=Math.pow(1-smooth(.12,1.13,u),1.25);
   const shoulder=(1-smooth(.82,1.5,u))*.20;
   const erosion=.94+noise3(x*.004,61,z*.004)*.055+noise3(x*.012,57,z*.012)*.025;
   cliffs+=m.height*(roundCrown*erosion+shoulder);
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
