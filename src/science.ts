// Units: kilometres, UTC milliseconds. Rendering basis: J2000 ecliptic (X,Z,-Y).
// JPL SSD Table 1 (1800–2050), https://ssd.jpl.nasa.gov/planets/approx_pos.html
export type Body='earth'|'moon'|'mars';
export type Vec3=[number,number,number];
export const AU_KM=149597870.7;
export const BODIES={
 earth:{id:399,radiusKm:6371,gravity:9.8,rotationHours:23.9345,tiltDegrees:23.44,atmosphere:'N2/O2'},
 moon:{id:301,radiusKm:1737.4,gravity:1.62,rotationHours:655.720,tiltDegrees:6.68,atmosphere:'exosphere'},
 mars:{id:499,radiusKm:3389.5,gravity:3.73,rotationHours:24.6229,tiltDegrees:25.19,atmosphere:'CO2'}
} as const;
export type Ephemeris={epoch:number;source:'JPL Horizons'|'Approximate';earth:Vec3;moon:Vec3;mars:Vec3};
const DEG=Math.PI/180;
export const julianDay=(epoch:number)=>epoch/86400000+2440587.5;
const elements={
 earth:[[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]],
 mars:[[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]]
};
export function kepler(a:number,e:number,i:number,L:number,peri:number,node:number):Vec3{
 const M=((L-peri)%360)*DEG;let E=M;
 for(let n=0;n<12;n++){const delta=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=delta;if(Math.abs(delta)<1e-13)break;}
 const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
 const w=(peri-node)*DEG,N=node*DEG,I=i*DEG;
 const c=Math.cos,s=Math.sin;
 return [(c(w)*c(N)-s(w)*s(N)*c(I))*x+(-s(w)*c(N)-c(w)*s(N)*c(I))*y,
 (s(w)*s(I))*x+c(w)*s(I)*y,
 -((c(w)*s(N)+s(w)*c(N)*c(I))*x+(-s(w)*s(N)+c(w)*c(N)*c(I))*y)];
}
export function approximateEphemeris(epoch:number):Ephemeris{
 const year=new Date(epoch).getUTCFullYear();if(!Number.isFinite(epoch)||year<1800||year>2050)throw new RangeError('Supported dates: 1800–2050');
 const d=julianDay(epoch)-2451545,T=d/36525;
 const planet=(b:'earth'|'mars')=>{const p=elements[b][0].map((v,i)=>v+T*elements[b][1][i]);return kepler(p[0]*AU_KM,p[1],p[2],p[3],p[4],p[5]);};
 // Mean lunar ellipse only: omits solar perturbations and is NOT a precision ephemeris.
 const lunar=kepler(384400,.0549,5.145,218.3164477+13.17639648*d,83.3532465+.11140353*d,125.04452-.0529538083*d);
 const bary=planet('earth');
 const earth=bary.map((v,i)=>v-lunar[i]/82.30056) as Vec3;
 return {epoch,source:'Approximate',earth,moon:earth.map((v,i)=>v+lunar[i]) as Vec3,mars:planet('mars')};
}
export function distanceKm(a:Vec3,b:Vec3){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
export function renderLayout(ephemeris:Ephemeris,physical:boolean){
 const scale=300/BODIES.mars.radiusKm;
 const relative=(body:Body,length?:number):Vec3=>{
  const delta=ephemeris[body].map((v,i)=>v-ephemeris.earth[i]);
  const factor=length===undefined?scale:length/Math.max(1,Math.hypot(...delta));
  return delta.map(v=>v*factor) as Vec3;
 };
 return {scale,earth:[0,0,0] as Vec3,moon:relative('moon',physical?undefined:1350),mars:relative('mars',physical?undefined:8500)};
}
export function solarIrradiance(position:Vec3){return 1361*(AU_KM/Math.hypot(...position))**2;}
export function validEphemeris(value:unknown,epoch:number):value is Ephemeris{
 const p=value as Ephemeris|undefined;
 return !!p&&p.source==='JPL Horizons'&&p.epoch===epoch&&(['earth','moon','mars'] as Body[]).every(b=>Array.isArray(p[b])&&p[b].length===3&&p[b].every(Number.isFinite)&&Math.hypot(...p[b])>1e8);
}
