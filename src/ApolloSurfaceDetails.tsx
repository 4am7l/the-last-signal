import {useEffect,useMemo} from 'react';
import * as T from 'three';
import {noise3} from './sceneMath';

// Seeded illustrative Apollo 11 debris: fractured, partly buried basalt and
// regolith pebbles. No towering monoliths or floating polygonal formations.
type Shape='boulder'|'slab'|'gravel';
const palette=['#777672','#898783','#aba69c','#5f605e','#77736b','#99958e','#62615e'];
const VARIANTS:Record<Shape,number>={boulder:4,slab:3,gravel:3};
function rng(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
function fracturedRock(shape:Shape,variant:number){
 const geo=new T.IcosahedronGeometry(1,shape==='boulder'?3:shape==='slab'?2:1);
 const pos=geo.getAttribute('position') as T.BufferAttribute;
 const color:number[]=[];
 const seed=variant*71+(shape==='boulder'?17:shape==='slab'?47:101);
 const sy=shape==='slab'?.43:shape==='gravel'?.67:.72;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const n1=noise3(x*2.1+seed*.07,y*2.3,z*2.15-seed*.04);
  const n2=noise3(x*6.1-seed*.02,y*5.7+seed*.1,z*6.3);
  const chips=noise3(x*12.5+seed*.2,y*12.8,z*11.6);
  const split=Math.max(0,x*.56+y*.42-z*.24-.40)*.20;
  const radius=Math.max(.62,1+n1*.27+n2*.115+chips*.038-split);
  const eccentricX=variant%2===0?1.2:.84,eccentricZ=variant%3===0?.79:1.12;
  pos.setXYZ(i,x*radius*eccentricX,y*radius*sy,z*radius*eccentricZ);
  const shade=T.MathUtils.clamp(.84+n1*.1+n2*.09+chips*.04,.64,1.08);
  color.push(shade,shade*.985,shade*.97);
 }
 pos.needsUpdate=true;
 geo.setAttribute('color',new T.Float32BufferAttribute(color,3));
 geo.computeVertexNormals();geo.computeBoundingBox();
 return geo;
}
function footprintSupport(ground:(x:number,z:number)=>number,x:number,z:number,r:number){
 const samples=[ground(x,z)];
 for(let k=0;k<8;k++){
  const a=k*Math.PI/4;
  samples.push(ground(x+Math.cos(a)*r,z+Math.sin(a)*r));
 }
 const high=Math.max(...samples),low=Math.min(...samples);
 return {height:samples.reduce((a,b)=>a+b,0)/samples.length,spread:high-low};
}
function rotatedBottom(geometry:T.BufferGeometry,matrix:T.Matrix4){
 const pos=geometry.getAttribute('position') as T.BufferAttribute,e=matrix.elements;
 let bottom=Infinity;
 for(let i=0;i<pos.count;i++){
  const y=pos.getX(i)*e[1]+pos.getY(i)*e[5]+pos.getZ(i)*e[9];
  if(y<bottom)bottom=y;
 }
 return bottom;
}
export function ApolloRocks({ground,unit,count,clearance}:{
 ground:(x:number,z:number)=>number;unit:number;count:number;clearance:number
}){
 const population=useMemo(()=>{
  const random=rng(0xa11011);
  const totals:Record<Shape,number>={
   boulder:Math.max(115,Math.round(count*.28)),
   slab:Math.max(185,Math.round(count*.43)),
   gravel:Math.max(2400,Math.round(count*3.35))
  };
  const occupied:{x:number;z:number;r:number}[]=[];
  const meshes:T.InstancedMesh[]=[];
  const dummy=new T.Object3D(),tint=new T.Color();
  for(const shape of ['boulder','slab','gravel'] as Shape[]){
   const small=shape==='gravel',kinds=VARIANTS[shape];
   for(let variant=0;variant<kinds;variant++){
    const n=Math.floor(totals[shape]/kinds)+(variant<totals[shape]%kinds?1:0);
    const geometry=fracturedRock(shape,variant);
    const mesh=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({
     color:'#ffffff',vertexColors:true,roughness:1,metalness:0}),n);
    const bounds=geometry.boundingBox!;
    const extent=Math.max(
     Math.abs(bounds.min.x),Math.abs(bounds.max.x),
     Math.abs(bounds.min.z),Math.abs(bounds.max.z));
    for(let i=0;i<n;i++){
     // Apollo 11 is a low-relief basalt mare: nearby stones remain smaller
     // than the lander, with only occasional metre-scale distant fragments.
     const size=shape==='boulder'?.12+Math.pow(random(),2.3)*1.05:
      shape==='slab'?.07+Math.pow(random(),2.25)*.65:
      .012+Math.pow(random(),2.2)*.13;
     const sx=size*(.75+random()*.43),sy=size*(.76+random()*.35),sz=size*(.72+random()*.48);
     const radius=extent*Math.max(sx,sz)*1.12;
     const minRadius=Math.max(clearance+radius+1.5,small?clearance+1:clearance+4);
     let x=0,z=0,found=false,support:{height:number;spread:number}|null=null;
     for(let attempts=0;attempts<32;attempts++){
      const a=random()*Math.PI*2;
      const far=random()<.20;
      const reach=small?(far?240:70):far?620:170;
      const r=minRadius+Math.pow(random(),small?.69:.93)*reach;
      x=Math.cos(a)*r;z=Math.sin(a)*r;
      // Leave a narrow unobstructed visitor approach from the camera side.
      const along=(x+z)*Math.SQRT1_2,across=Math.abs((x-z)*Math.SQRT1_2);
      if(!small&&along>0&&along<125&&across<6+radius)continue;
      if(!small&&occupied.some(p=>Math.hypot(x-p.x,z-p.z)<(radius+p.r)*1.15))continue;
      if(!small){
       const sample=footprintSupport(ground,x,z,Math.max(.25,radius*.65));
       if(sample.spread>size*unit*(shape==='boulder'?.38:.30))continue;
       support=sample;
      }
      found=true;break;
     }
     if(!found){
      dummy.position.set(0,-100000*unit,0);
      dummy.rotation.set(0,0,0);dummy.scale.set(0,0,0);
      dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);continue;
     }
     if(!small&&size>.3)occupied.push({x,z,r:radius});
     const lean=small?.20:shape==='boulder'?.08:.11;
     dummy.rotation.set((random()-.5)*lean,random()*Math.PI*2,(random()-.5)*lean);
     dummy.scale.set(sx*unit,sy*unit,sz*unit);
     dummy.position.set(0,0,0);dummy.updateMatrix();
     const base=rotatedBottom(geometry,dummy.matrix);
     const level=support??{height:ground(x,z),spread:0};
     // Real contact uses the transformed silhouette, with regolith burying
     // some of the lower facets so fragments do not levitate or balance.
     const burial=sy*unit*(small?.18:shape==='boulder'?.28:.24)+level.spread*.27;
     dummy.position.set(x*unit,level.height-base-burial,z*unit);
     dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
     tint.set(palette[Math.floor(random()*palette.length)]);
     tint.multiplyScalar(.80+random()*.24);
     mesh.setColorAt(i,tint);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=false;mesh.castShadow=!small;mesh.receiveShadow=true;
    meshes.push(mesh);
   }
  }
  return meshes;
 },[ground,unit,count,clearance]);
 useEffect(()=>()=>{for(const mesh of population){
  mesh.geometry.dispose();(mesh.material as T.Material).dispose();mesh.dispose();
 }},[population]);
 return <group>{population.map((mesh,i)=><primitive key={i} object={mesh}/>)}</group>;
}
