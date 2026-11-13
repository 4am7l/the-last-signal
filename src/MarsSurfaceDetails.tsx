import {useEffect,useMemo} from 'react';
import * as T from 'three';
import {marsCraterField,marsSiteSeed} from './marsGeology';
import {noise3} from './sceneMath';

// Mars-only instanced geology: battered basalt blocks, dust-covered flat slabs
// and small gravel. Seeded per mission site; not surveyed rock coordinates.
function randomFromSeed(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
const rockColours=['#99715d','#927366','#76675e','#514d4b','#ad8970','#6b635d','#856d5b'];
type RockShape='boulder'|'slab'|'gravel';
function rockGeometry(shape:RockShape){
 const geo=new T.IcosahedronGeometry(1,shape==='boulder'?2:shape==='slab'?1:0);
 const positions=geo.getAttribute('position') as T.BufferAttribute;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  // World-independent coherent damage keeps shared polygon vertices consistent.
  const rough=noise3(x*2.7+17,y*3.1+2,z*2.9-8);
  const fracture=noise3(x*5.3-4,y*4.2,z*4.9+13);
  const radius=1+rough*.23+fracture*.095;
  const yScale=shape==='slab'?.40:shape==='gravel'?.57:.78;
  const flattenedBottom=Math.max(-.64,y*radius*yScale);
  positions.setXYZ(i,x*radius,flattenedBottom,z*radius);
 }
 positions.needsUpdate=true;
 geo.computeVertexNormals();
 return geo;
}
export function MarsRocks({ground,unit,clearance,count,lat,lon,landingRadius}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number;landingRadius:number
}){
 const population=useMemo(()=>{
  const rand=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const craterRims=marsCraterField(lat,lon,landingRadius).filter(c=>Math.hypot(c.x,c.z)<850);
  const outcropCenters=Array.from({length:25},()=>{
   const a=rand()*Math.PI*2,r=landingRadius+28+Math.pow(rand(),1.2)*430;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const boulderCount=Math.max(100,Math.round(count*.38));
  const slabCount=Math.max(140,Math.round(count*.52));
  const gravelCount=Math.max(1050,Math.round(count*2.2));
  const makeMesh=(shape:RockShape,total:number)=>new T.InstancedMesh(
   rockGeometry(shape),new T.MeshStandardMaterial({color:'#ffffff',roughness:1,metalness:0}),total
  );
  const boulders=makeMesh('boulder',boulderCount);
  const slabs=makeMesh('slab',slabCount);
  const gravel=makeMesh('gravel',gravelCount);
  const dummy=new T.Object3D(),tint=new T.Color();
  function place(mesh:T.InstancedMesh,total:number,shape:RockShape){
   for(let i=0;i<total;i++){
    let x=0,z=0,size=0;
    size=shape==='boulder'?.16+Math.pow(rand(),2.7)*1.28:shape==='slab'?.10+Math.pow(rand(),2.4)*.9:.009+Math.pow(rand(),2.1)*.075;
    const minimumRadius=clearance+(shape==='gravel'?.45:size*1.6);
    for(let attempt=0;attempt<12;attempt++){
     const kind=rand();
     if(kind<.43){
      const center=outcropCenters[Math.floor(rand()*outcropCenters.length)];
      const a=rand()*Math.PI*2,r=Math.sqrt(rand())*(shape==='gravel'?17:29);
      x=center.x+Math.cos(a)*r;z=center.z+Math.sin(a)*r;
     }else if(kind<.68&&craterRims.length){
      const crater=craterRims[Math.floor(rand()*craterRims.length)];
      const a=rand()*Math.PI*2,r=crater.radius*(.95+rand()*.3);
      x=crater.x+Math.cos(a)*r;z=crater.z+Math.sin(a)*r;
     }else{
      const a=rand()*Math.PI*2,r=minimumRadius+2+Math.pow(rand(),1.65)*(shape==='gravel'?240:670);
      x=Math.cos(a)*r;z=Math.sin(a)*r;
     }
     if(Math.hypot(x,z)>minimumRadius)break;
    }
    // Prevent an isolated oversize boulder from looking like a raised landing pad.
    if(shape!=='gravel'&&Math.hypot(x,z)<landingRadius+7){
     const a=Math.atan2(z,x),r=landingRadius+8+rand()*6;
     x=Math.cos(a)*r;z=Math.sin(a)*r;
    }
    const flat=shape==='slab';
    dummy.position.set(x*unit,ground(x,z)+(flat?.16:shape==='gravel'?.18:.27)*size*unit,z*unit);
    dummy.rotation.set(flat?(rand()-.5)*.17:rand()*Math.PI,rand()*Math.PI*2,flat?(rand()-.5)*.17:rand()*Math.PI);
    dummy.scale.set(size*(.78+rand()*.42)*unit,size*(.72+rand()*.32)*unit,size*(.76+rand()*.5)*unit);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    tint.set(rockColours[Math.floor(rand()*rockColours.length)]);
    tint.multiplyScalar(.78+rand()*.24);
    mesh.setColorAt(i,tint);
   }
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   mesh.frustumCulled=false;
  }
  place(boulders,boulderCount,'boulder');
  place(slabs,slabCount,'slab');
  place(gravel,gravelCount,'gravel');
  boulders.castShadow=true;boulders.receiveShadow=true;
  slabs.castShadow=true;slabs.receiveShadow=true;
  gravel.castShadow=false;gravel.receiveShadow=true;
  return {boulders,slabs,gravel};
 },[ground,unit,clearance,count,lat,lon,landingRadius]);
 useEffect(()=>()=>{for(const mesh of [population.boulders,population.slabs,population.gravel]){
  mesh.geometry.dispose();(mesh.material as T.Material).dispose();mesh.dispose();
 }},[population]);
 return <group><primitive object={population.boulders}/><primitive object={population.slabs}/><primitive object={population.gravel}/></group>;
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
