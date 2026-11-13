import {useEffect,useMemo} from 'react';
import * as T from 'three';
import {marsSiteSeed} from './marsGeology';

// Mars-only, instanced rock populations. Clustering and colours represent a
// plausible rocky regolith, not a photographic reconstruction of a landing site.
function randomFromSeed(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
const rockColours=['#a77b61','#977261','#79665c','#514d4c','#b38b6c','#746a61'];
export function MarsRocks({ground,unit,clearance,count,lat,lon}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number
}){
 const population=useMemo(()=>{
  const rand=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const outcropCenters=Array.from({length:28},()=>{
   const a=rand()*Math.PI*2,r=clearance+26+Math.pow(rand(),1.1)*390;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const largeCount=Math.max(250,Math.round(count*.75));
  const gravelCount=Math.max(1800,Math.round(count*2.8));
  const large=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:.97}),largeCount);
  const gravel=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:1}),gravelCount);
  const dummy=new T.Object3D(),tint=new T.Color();
  const scatter=(mesh:T.InstancedMesh,total:number,small:boolean)=>{
   for(let i=0;i<total;i++){
    let x=0,z=0;
    // Both isolated stones and wind/impact-concentrated rocky patches.
    for(let attempt=0;attempt<8;attempt++){
     if(rand()<.5){
      const center=outcropCenters[Math.floor(rand()*outcropCenters.length)];
      const a=rand()*Math.PI*2,r=Math.sqrt(rand())*(small?15:23);
      x=center.x+Math.cos(a)*r;z=center.z+Math.sin(a)*r;
     }else{
      const a=rand()*Math.PI*2,r=clearance+2+Math.pow(rand(),1.65)*(small?230:510);
      x=Math.cos(a)*r;z=Math.sin(a)*r;
     }
     if(Math.hypot(x,z)>clearance+1)break;
    }
    const size=small?.012+Math.pow(rand(),2.2)*.105:.12+Math.pow(rand(),3.1)*1.65;
    dummy.position.set(x*unit,ground(x,z)+size*(small?.22:.32)*unit,z*unit);
    dummy.rotation.set(rand()*Math.PI,rand()*Math.PI*2,rand()*Math.PI);
    dummy.scale.set(size*(.75+rand()*.9)*unit,size*(.32+rand()*.5)*unit,size*(.7+rand()*.85)*unit);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    tint.set(rockColours[Math.floor(rand()*rockColours.length)]);
    tint.multiplyScalar(.78+rand()*.35);
    mesh.setColorAt(i,tint);
   }
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   mesh.frustumCulled=false;
  };
  scatter(large,largeCount,false);
  scatter(gravel,gravelCount,true);
  large.castShadow=true;large.receiveShadow=true;
  gravel.castShadow=false;gravel.receiveShadow=true;
  return {large,gravel};
 },[ground,unit,clearance,count,lat,lon]);
 useEffect(()=>()=>{for(const mesh of [population.large,population.gravel]){
  mesh.geometry.dispose();(mesh.material as T.Material).dispose();mesh.dispose();
 }},[population]);
 return <group><primitive object={population.large}/><primitive object={population.gravel}/></group>;
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
  const fraction=.27+j/rings*.73;
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
  const scuff=model==='insight'?dustScuffGeometry(ground,unit,7,marsSiteSeed(lat,lon)):
   model==='ingenuity'?dustScuffGeometry(ground,unit,2.5,marsSiteSeed(lat,lon)):null;
  return {tracks,scuff};
 },[ground,unit,model,lat,lon]);
 useEffect(()=>()=>{for(const geometry of marks.tracks)geometry.dispose();marks.scuff?.dispose()},[marks]);
 return <group>
  {marks.tracks.map((geometry,i)=><mesh key={i} geometry={geometry}><meshBasicMaterial color="#3e2921" transparent opacity={.34} depthWrite={false} side={T.DoubleSide} polygonOffset polygonOffsetFactor={-2}/></mesh>)}
  {marks.scuff&&<mesh geometry={marks.scuff}><meshBasicMaterial color="#594136" transparent opacity={.22} depthWrite={false} side={T.DoubleSide} polygonOffset polygonOffsetFactor={-2}/></mesh>}
 </group>;
}
