import {useEffect,useMemo} from 'react';
import * as T from 'three';
import {marsApproachMask,marsCraterField,marsSiteSeed} from './marsGeology';
import {noise3} from './sceneMath';

// Cinematic Mars rock populations. Three different fractured meshes for each
// large rock type retain giant boulders while avoiding identical silhouettes.
// The model placements are illustrative and not actual NASA obstacle surveys.
function randomFromSeed(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
const rockColours=['#987d6c','#8f7361','#685e58','#514a48','#af8870','#77695f','#907461'];
type RockShape='boulder'|'slab'|'gravel'|'monolith';
const variants:Record<RockShape,number>={boulder:3,slab:2,gravel:2,monolith:4};
function rockGeometry(shape:RockShape,variant:number){
 const geo=new T.IcosahedronGeometry(1,shape==='gravel'?0:shape==='slab'?1:shape==='monolith'?2:2);
 const positions=geo.getAttribute('position') as T.BufferAttribute;
 const shades:number[]=[];
 const salt=variant*47+(shape==='monolith'?129:shape==='slab'?71:shape==='gravel'?29:5);
 const axis=new T.Vector3(Math.sin(salt*.17),.25+Math.cos(salt*.41)*.25,Math.cos(salt*.23)).normalize();
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  const broad=noise3(x*2.4+salt*.03,y*2.7+salt*.019,z*2.5-salt*.025);
  const broken=noise3(x*6.7+salt*.17,y*7.3-salt*.13,z*7.1+salt*.07);
  const chips=noise3(x*13.2+salt*.2,y*11.7+salt*.11,z*12.5-salt*.13);
  const cleave=x*axis.x+y*axis.y+z*axis.z;
  const shear=Math.max(0,cleave-.46)*.22;
  const radial=Math.max(.62,1+broad*.24+broken*.145+chips*.065-shear);
  const height=shape==='slab'?.33:shape==='gravel'?.55:shape==='monolith'?(.92+variant*.15):.78;
  const flattenedY=Math.max(-.48,y*radial*height);
  const angularCut=shape==='monolith'&&variant%2===0?Math.max(0,z*.5+x*.27-.35)*.17:0;
  positions.setXYZ(i,x*radial-angularCut,flattenedY,z*radial);
  const shade=T.MathUtils.clamp(.85+broad*.055+broken*.09+chips*.045,.66,1.05);
  shades.push(shade,shade*.965,shade*.925);
 }
 positions.needsUpdate=true;
 geo.setAttribute('color',new T.Float32BufferAttribute(shades,3));
 geo.computeVertexNormals();
 return geo;
}
export function MarsRocks({ground,unit,clearance,count,lat,lon,landingRadius}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number;landingRadius:number
}){
 const population=useMemo(()=>{
  const rand=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const rims=marsCraterField(lat,lon,landingRadius).filter(c=>Math.hypot(c.x,c.z)<1050);
  const outcrops=Array.from({length:27},()=>{
   const a=rand()*Math.PI*2,r=landingRadius+28+Math.pow(rand(),1.15)*680;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const totals:Record<RockShape,number>={
   boulder:Math.max(170,Math.round(count*.60)),
   slab:Math.max(170,Math.round(count*.52)),
   monolith:Math.max(32,Math.round(count*.075)),
   gravel:Math.max(1600,Math.round(count*3.1))
  };
  const meshes:T.InstancedMesh[]=[];
  const dummy=new T.Object3D(),tint=new T.Color();
  const create=(shape:RockShape)=>{
   const kinds=variants[shape],whole=totals[shape];
   for(let variant=0;variant<kinds;variant++){
    const total=Math.floor(whole/kinds)+(variant<whole%kinds?1:0);
    const mesh=new T.InstancedMesh(
     rockGeometry(shape,variant),
     new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,metalness:0,flatShading:shape!=='gravel'}),total
    );
    for(let j=0;j<total;j++){
     const giant=shape==='monolith',small=shape==='gravel';
     const size=giant?5+Math.pow(rand(),1.45)*25:
      shape==='boulder'?.18+Math.pow(rand(),2.3)*4.1:
      shape==='slab'?.09+Math.pow(rand(),2.3)*1.85:.008+Math.pow(rand(),2.3)*.1;
     const safe=Math.max(clearance+size*1.5,giant?landingRadius+140:landingRadius+2);
     let x=0,z=0,found=false;
     for(let tries=0;tries<32;tries++){
      const choice=rand();
      if(giant){
       const a=rand()*Math.PI*2,d=safe+rand()*2100;
       x=Math.cos(a)*d;z=Math.sin(a)*d;
      }else if(choice<.48){
       const c=outcrops[Math.floor(rand()*outcrops.length)];
       const a=rand()*Math.PI*2,d=Math.sqrt(rand())*(small?19:36);
       x=c.x+Math.cos(a)*d;z=c.z+Math.sin(a)*d;
      }else if(choice<.68&&rims.length){
       const crater=rims[Math.floor(rand()*rims.length)];
       const a=rand()*Math.PI*2,d=crater.radius*(.93+rand()*.38);
       x=crater.x+Math.cos(a)*d;z=crater.z+Math.sin(a)*d;
      }else{
       const a=rand()*Math.PI*2,d=safe+2+Math.pow(rand(),1.48)*(small?350:1250);
       x=Math.cos(a)*d;z=Math.sin(a)*d;
      }
      const path=marsApproachMask(x,z,landingRadius);
      // Leave a dusty walkable route: scattered pebbles are fine; boulders are not.
      if(Math.hypot(x,z)>safe && (small||path<.025)){found=true;break;}
     }
     if(!found){
      const a=2.35+rand()*.3,d=safe+40+rand()*240;
      x=Math.cos(a)*d;z=Math.sin(a)*d;
     }
     const tall=giant&&variant%2===0;
     const sizeY=size*(tall?1.15+rand()*.65:.68+rand()*.42);
     dummy.position.set(x*unit,ground(x,z)+(giant?.23:.12)*sizeY*unit,z*unit);
     dummy.rotation.set((rand()-.5)*(giant?.36:.22),rand()*Math.PI*2,(rand()-.5)*(giant?.32:.24));
     dummy.scale.set(size*(.74+rand()*.48)*unit,sizeY*unit,size*(.7+rand()*.55)*unit);
     dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);
     tint.set(rockColours[Math.floor(rand()*rockColours.length)]);
     tint.multiplyScalar(.79+rand()*.31);
     mesh.setColorAt(j,tint);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=false;
    mesh.castShadow=!['gravel'].includes(shape);mesh.receiveShadow=true;
    meshes.push(mesh);
   }
  };
  create('monolith');create('boulder');create('slab');create('gravel');
  return meshes;
 },[ground,unit,clearance,count,lat,lon,landingRadius]);
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
