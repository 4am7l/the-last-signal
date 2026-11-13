import {useEffect,useMemo} from 'react';
import * as T from 'three';
import {marsApproachMask,marsCraterField,marsSiteSeed} from './marsGeology';
import {noise3} from './sceneMath';

// Distinct, high-detail eroded rock shapes rather than a few low-poly icosahedrons.
// These are site-seeded illustrative formations, not surveyed NASA rock meshes.
function randomFromSeed(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
const rockColours=['#987761','#816b5d','#a18770','#544d49','#b08d72','#6b5e55','#90735f','#655c52'];
type RockShape='boulder'|'slab'|'gravel'|'monolith';
const variants:Record<RockShape,number>={boulder:5,slab:3,gravel:3,monolith:6};
const aspects:[number,number,number][]=[
 [1.2,.8,1.05],[.88,1.3,1.18],[1.32,.67,.86],
 [.94,1.10,1.08],[1.08,.92,1.36],[1.48,.87,.92]
];
function soften(a:number,b:number,x:number){
 const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);
}
function rockGeometry(shape:RockShape,variant:number){
 const detail=shape==='gravel'?1:shape==='slab'?3:shape==='boulder'?6:7;
 const geo=new T.IcosahedronGeometry(1,detail);
 const pos=geo.getAttribute('position') as T.BufferAttribute,colors:number[]=[];
 const seed=variant*37+(shape==='monolith'?197:shape==='slab'?113:shape==='gravel'?29:61);
 const [sx,sy,sz]=aspects[variant%aspects.length];
 const a1=new T.Vector3(Math.sin(seed*.18),Math.cos(seed*.13),Math.cos(seed*.27)).normalize();
 const a2=new T.Vector3(Math.cos(seed*.23),-.23,Math.sin(seed*.18)).normalize();
 const a3=new T.Vector3(-.32,Math.sin(seed*.19),.87).normalize();
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  // Domain-warped, non-periodic rock fragments; no circular strata or
  // stacked rings. Multiple frequencies change the actual 3D silhouette.
  const wx=x+noise3(x*1.3+seed*.1,y*1.1,z*1.3)*.16;
  const wy=y+noise3(x*1.15,y*1.4+seed*.13,z*1.2)*.16;
  const wz=z+noise3(x*1.4,y*1.1,z*1.4-seed*.07)*.16;
  const coarse=noise3(wx*1.75+seed*.023,wy*1.8,wz*1.75);
  const medium=noise3(wx*4.6+seed*.31,wy*4.2,wz*4.4-seed*.17);
  const fine=noise3(wx*12.1-seed*.3,wy*10.7,wz*11.9+seed*.2);
  const p1=x*a1.x+y*a1.y+z*a1.z;
  const p2=x*a2.x+y*a2.y+z*a2.z;
  const p3=x*a3.x+y*a3.y+z*a3.z;
  const cleaved=soften(.43,.81,p1)*.23+soften(.48,.82,p2)*.20+soften(.52,.85,p3)*.13;
  const cracks=(Math.exp(-Math.pow((p1-.13)/.045,2))*.075+
    Math.exp(-Math.pow((p2+.23)/.035,2))*.055)*(shape==='gravel'?.28:1);
  const radius=Math.max(.47,1+coarse*.31+medium*.175+fine*.035-cleaved-cracks);
  const flatten=shape==='slab'?.46:shape==='gravel'?.76:shape==='boulder'?.81:.78;
  pos.setXYZ(i,(x*radius+medium*.035)*sx,
    (y*radius+coarse*.045)*sy*flatten,
    (z*radius+medium*.025)*sz);
  const oxidized=soften(-.4,.55,y)*.05;
  const weather=T.MathUtils.clamp(.83+coarse*.11+medium*.095+fine*.065+oxidized,.57,1.10);
  colors.push(weather,weather*.97,weather*.93);
 }
 pos.needsUpdate=true;
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geo.computeVertexNormals();
 geo.computeBoundingBox();
 return geo;
}
function rockMaterial(){
 const mat=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,metalness:0});
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vStone;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>','#include <begin_vertex>\nvStone=position;');
  shader.fragmentShader='varying vec3 vStone;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>',
   '#include <color_fragment>\nfloat coarseSpeck=fract(sin(dot(floor(vStone*41.),vec3(18.93,74.37,31.73)))*43758.54)-.5;\nfloat fineSpeck=fract(sin(dot(floor(vStone*140.),vec3(12.41,92.78,48.93)))*12542.19)-.5;\nfloat darkGrain=step(.30,coarseSpeck);\ndiffuseColor.rgb*=1.+coarseSpeck*.14+fineSpeck*.085-darkGrain*.07;');
 };
 mat.customProgramCacheKey=()=> 'mars-rock-mottled-v4';
 return mat;
}

type PlacedRock={x:number;z:number;radius:number};
// Support is measured under the *whole* intended footprint, not just the
// rock centre. Distances are metres; ground() returns render-space elevation.
function surveyFootprint(ground:(x:number,z:number)=>number,x:number,z:number,radius:number){
 const heights=[ground(x,z)];
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  heights.push(ground(x+Math.cos(angle)*radius,z+Math.sin(angle)*radius));
 }
 const low=Math.min(...heights),high=Math.max(...heights);
 const mean=heights.reduce((a,b)=>a+b,0)/heights.length;
 return {mean,spread:high-low};
}
// The instanced rock is rotated and stretched before we calculate its real
// lowest vertex. Computing placement from the unrotated bounding box was the
// reason several large stones looked suspended or balanced on a point.
function lowestVertexAfterTransform(geometry:T.BufferGeometry,matrix:T.Matrix4){
 const pos=geometry.getAttribute('position') as T.BufferAttribute;
 const e=matrix.elements;let low=Infinity;
 for(let i=0;i<pos.count;i++){
  const y=pos.getX(i)*e[1]+pos.getY(i)*e[5]+pos.getZ(i)*e[9];
  if(y<low)low=y;
 }
 return low;
}
export function MarsRocks({ground,unit,clearance,count,lat,lon,landingRadius,site}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number;landingRadius:number;site:string
}){
 const population=useMemo(()=>{
  const rand=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const rims=marsCraterField(lat,lon,landingRadius).filter(c=>Math.hypot(c.x,c.z)<1200);
  const outcrops=Array.from({length:28},()=>{
   const a=rand()*Math.PI*2,r=landingRadius+80+Math.pow(rand(),1.15)*550;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const totals:Record<RockShape,number>={
   // The huge isolated monoliths looked like floating fantasy rocks. Terrain
   // itself now carries the cliffs; site-scale debris stays below human scale.
   monolith:0,
   boulder:Math.max(155,Math.round(count*.32)),
   slab:Math.max(250,Math.round(count*.56)),
   gravel:Math.max(3600,Math.round(count*5.5))
  };
  const occupied:PlacedRock[]=[];
  const meshes:T.InstancedMesh[]=[];
  const dummy=new T.Object3D(),tint=new T.Color();
  const types:RockShape[]=['boulder','slab','gravel'];
  for(const shape of types){
   const kinds=variants[shape],whole=totals[shape];
   const giant=shape==='monolith',small=shape==='gravel';
   for(let variant=0;variant<kinds;variant++){
    const total=Math.floor(whole/kinds)+(variant<whole%kinds?1:0);
    const geometry=rockGeometry(shape,variant);
    geometry.computeBoundingBox();
    const bounds=geometry.boundingBox!;
    const extent=Math.max(
     Math.abs(bounds.min.x),Math.abs(bounds.max.x),
     Math.abs(bounds.min.z),Math.abs(bounds.max.z));
    const material=rockMaterial();
    const mesh=new T.InstancedMesh(geometry,material,total);
    for(let i=0;i<total;i++){
     const size=giant?5+Math.pow(rand(),1.5)*24:
      shape==='boulder'?.15+Math.pow(rand(),2.25)*1.85:
      shape==='slab'?.08+Math.pow(rand(),2.2)*.96:
      .023+Math.pow(rand(),2.25)*.24;
     const ysize=size*(giant?.72+rand()*.40:.72+rand()*.48);
     const scaleX=size*(.78+rand()*.40),scaleZ=size*(.78+rand()*.43);
     // Actual projected radius includes the displaced source mesh extent.
     const footprint=Math.max(scaleX,scaleZ)*extent*(giant?1.15:1.08);
     const minDistance=Math.max(clearance+footprint+2,giant?landingRadius+125:landingRadius+3);
     let x=0,z=0,fit:{mean:number;spread:number}|null=null;
     let found=false;
     const tries=giant?56:small?12:shape==='boulder'?30:22;
     for(let attempt=0;attempt<tries;attempt++){
      const a=rand()*Math.PI*2,choice=rand();
      if(giant){
       // Large formations in the middle/far landscape, not on the rover.
       const r=minDistance+(rand()<.6?45+rand()*330:430+rand()*1500);
       x=Math.cos(a)*r;z=Math.sin(a)*r;
      }else if(small){
       const reach=rand()<.64?38:rand()<.82?110:250;
       const r=minDistance+Math.sqrt(rand())*reach;
       x=Math.cos(a)*r;z=Math.sin(a)*r;
       if(rand()<.11){
        const c=outcrops[Math.floor(rand()*outcrops.length)];
        const rr=rand()*15;
        x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
       }
      }else if(choice<.38){
       const c=outcrops[Math.floor(rand()*outcrops.length)];
       const rr=Math.sqrt(rand())*52;
       x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
      }else if(choice<.63&&rims.length){
       const c=rims[Math.floor(rand()*rims.length)];
       const rr=c.radius*(1.02+rand()*.44);
       x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
      }else{
       const r=minDistance+Math.pow(rand(),1.28)*(shape==='boulder'?1250:780);
       x=Math.cos(a)*r;z=Math.sin(a)*r;
      }
      const radius=Math.hypot(x,z);
      if(radius<minDistance)continue;
      // No boulder taller than the rover beside the mission exhibit. Larger
      // rocks belong to background outcrops rather than the walking area.
      if(shape==='boulder'&&radius<landingRadius+110&&size>1.05)continue;
      if(shape==='slab'&&radius<landingRadius+32&&size>.65)continue;
      // InSight sits on an open plain, Spirit beside a rockier shoulder,
      // Opportunity in Eagle crater, Ingenuity on a broken Jezero plain.
      if(site==='insight'&&shape==='boulder'&&radius<landingRadius+85&&rand()<.58)continue;
      if(site==='opportunity'&&shape==='boulder'&&radius<landingRadius+70&&rand()<.4)continue;
      if(site==='ingenuity'&&shape==='slab'&&radius>landingRadius+130&&rand()<.3)continue;
      // A navigable dirt strip has no boulder-sized obstacles.
      const path=marsApproachMask(x,z,landingRadius);
      if(!small&&path>.025)continue;
      if(!small){
       const margin=giant?1.17:shape==='boulder'?1.12:1.04;
       if(occupied.some(p=>Math.hypot(x-p.x,z-p.z)<margin*(footprint+p.radius)))continue;
      }
      // Sample whole support area before approving large rock placements.
      // Flat/slightly sloping ground is plausible; isolated steep ridges are not.
      if(giant||size>.85){
       const sample=surveyFootprint(ground,x,z,Math.max(.35,footprint*.62));
       const allowed=size*unit*(giant?.22:shape==='boulder'?.28:.32);
       if(sample.spread>allowed)continue;
       fit=sample;
      }
      found=true;break;
     }
     if(!found){
      // Hide impossible placements instead of stacking/floating them elsewhere.
      dummy.position.set(0,-100000*unit,0);
      dummy.rotation.set(0,0,0);
      dummy.scale.set(0,0,0);
      dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      continue;
     }
     if(!small&&size>.65)occupied.push({x,z,radius:footprint});
     // Heavy boulders barely tilt; remove vertical spires balanced on narrow ends.
     const lean=giant?.035:shape==='boulder'?.07:shape==='slab'?.11:.22;
     dummy.rotation.set((rand()-.5)*lean,rand()*Math.PI*2,(rand()-.5)*lean);
     dummy.scale.set(scaleX*unit,ysize*unit,scaleZ*unit);
     dummy.position.set(0,0,0);
     dummy.updateMatrix();
     const lowest=lowestVertexAfterTransform(geometry,dummy.matrix);
     const support=fit??{mean:ground(x,z),spread:0};
     // Embed the bottom 10–18% of the rock into local terrain, also accounting
     // for the mild slope across the entire footprint.
     // Sink an irregular lower band into the regolith, not just one pointed
     // vertex touching the surface. This avoids apparently hovering stones.
     const burial=(giant?.17:small?.16:shape==='boulder'?.30:.24)*ysize*unit+support.spread*.32;
     dummy.position.set(x*unit,support.mean-lowest-burial,z*unit);
     dummy.updateMatrix();
     mesh.setMatrixAt(i,dummy.matrix);
     tint.set(rockColours[Math.floor(rand()*rockColours.length)]);
     tint.multiplyScalar(.83+rand()*.25);
     mesh.setColorAt(i,tint);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=false;
    mesh.castShadow=!small;mesh.receiveShadow=true;
    meshes.push(mesh);
   }
  }
  return meshes;
 },[ground,unit,clearance,count,lat,lon,landingRadius,site]);
 useEffect(()=>()=>{for(const mesh of population){
  mesh.geometry.dispose();(mesh.material as T.Material).dispose();mesh.dispose();
 }},[population]);
 return <group>{population.map((mesh,i)=><primitive key={i} object={mesh}/>)}</group>;
}
function trackGeometry(ground:(x:number,z:number)=>number,unit:number,side:number){
 const vertices:number[]=[],indices:number[]=[],steps=88;
 for(let i=0;i<=steps;i++){
  const t=i/steps,x=-2.4-23*t,z=side*.7+Math.sin(t*Math.PI*1.3)*.48;
  for(const edge of [-1,1]){
   const xx=x,zz=z+edge*.12;
   vertices.push(xx*unit,ground(xx,zz)+.011*unit,zz*unit);
  }
  if(i<steps){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function dustScuffGeometry(ground:(x:number,z:number)=>number,unit:number,radius:number,seed:number){
 const rand=randomFromSeed(seed),segments=96,rings=4,vertices:number[]=[],indices:number[]=[];
 const perimeter=Array.from({length:segments+1},(_,i)=>.78+rand()*.3);
 perimeter[segments]=perimeter[0];
 for(let j=0;j<=rings;j++){
  const fraction=j/rings;
  for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,r=radius*fraction*perimeter[i];
   const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
   vertices.push(x*unit,ground(x,z)+.009*unit,z*unit);
   if(j<rings&&i<segments){
    const k=j*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);
   }
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
// Tracks are illustrative only: mission coordinates do not document wheel tracks.
export function MarsGroundMarks({ground,unit,model,lat,lon}:{
 ground:(x:number,z:number)=>number;unit:number;model:string;lat:number;lon:number
}){
 const marks=useMemo(()=>{
  const tracks=model==='rover'?[trackGeometry(ground,unit,-1),trackGeometry(ground,unit,1)]:[];
  const scuff=model==='insight'?dustScuffGeometry(ground,unit,4.4,marsSiteSeed(lat,lon)):
   model==='ingenuity'?dustScuffGeometry(ground,unit,2.5,marsSiteSeed(lat,lon)):null;
  return {tracks,scuff};
 },[ground,unit,model,lat,lon]);
 useEffect(()=>()=>{for(const geometry of marks.tracks)geometry.dispose();marks.scuff?.dispose()},[marks]);
 return <group>
  {marks.tracks.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial color="#3e2921" transparent opacity={.34} depthWrite={false} side={T.DoubleSide} polygonOffset polygonOffsetFactor={-2}/></mesh>)}
  {marks.scuff&&<mesh geometry={marks.scuff}><meshBasicMaterial color="#654b3c" transparent opacity={.095} depthWrite={false} side={T.DoubleSide} polygonOffset polygonOffsetFactor={-2}/></mesh>}
 </group>;
}
