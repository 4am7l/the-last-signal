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
 [.75,1.52,1.02],[1.08,.92,1.36],[1.48,.87,.76]
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
  const flatten=shape==='slab'?.46:shape==='gravel'?.76:shape==='boulder'?.81:1;
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
export function MarsRocks({ground,unit,clearance,count,lat,lon,landingRadius}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number;landingRadius:number
}){
 const population=useMemo(()=>{
  const rand=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const rims=marsCraterField(lat,lon,landingRadius).filter(c=>Math.hypot(c.x,c.z)<1200);
  const outcrops=Array.from({length:32},()=>{
   const a=rand()*Math.PI*2,r=landingRadius+22+Math.pow(rand(),1.1)*490;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const totals:Record<RockShape,number>={
   boulder:Math.max(240,Math.round(count*.62)),
   slab:Math.max(300,Math.round(count*.71)),
   monolith:Math.max(42,Math.round(count*.09)),
   // Most old gravel was too small and too far away to see at walking height.
   gravel:Math.max(3600,Math.round(count*5.5))
  };
  const meshes:T.InstancedMesh[]=[];
  const dummy=new T.Object3D(),tint=new T.Color();
  const create=(shape:RockShape)=>{
   const kinds=variants[shape],whole=totals[shape];
   for(let variant=0;variant<kinds;variant++){
    const total=Math.floor(whole/kinds)+(variant<whole%kinds?1:0);
    const giant=shape==='monolith',small=shape==='gravel';
    const geometry=rockGeometry(shape,variant);
    const bottom=geometry.boundingBox?.min.y??-1;
    const mesh=new T.InstancedMesh(geometry,rockMaterial(),total);
    for(let i=0;i<total;i++){
     const size=giant?4.5+Math.pow(rand(),1.6)*24:
      shape==='boulder'?.18+Math.pow(rand(),2.3)*4.6:
      shape==='slab'?.11+Math.pow(rand(),2.3)*2.2:
      .023+Math.pow(rand(),2.25)*.24;
     const minDistance=Math.max(clearance+size*1.45,giant?landingRadius+34:landingRadius+2);
     let x=0,z=0,good=false;
     for(let tries=0;tries<50;tries++){
      const choice=rand(),a=rand()*Math.PI*2;
      if(giant){
       // Fractured giants in the mid-distance, plus far canyon outcrops.
       const r=minDistance+(rand()<.55?20+rand()*180:230+rand()*1550);
       x=Math.cos(a)*r;z=Math.sin(a)*r;
      }else if(small){
       // A physical near-field gravel carpet, not just shader pixels.
       const reach=rand()<.60?33:rand()<.82?90:250;
       const r=minDistance+Math.sqrt(rand())*reach;
       x=Math.cos(a)*r;z=Math.sin(a)*r;
       if(rand()<.12){
        const c=outcrops[Math.floor(rand()*outcrops.length)];
        const rr=rand()*15;
        x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
       }
      }else if(choice<.48){
       const c=outcrops[Math.floor(rand()*outcrops.length)];
       const rr=Math.sqrt(rand())*42;
       x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
      }else if(choice<.7&&rims.length){
       const c=rims[Math.floor(rand()*rims.length)];
       const rr=c.radius*(.95+rand()*.4);
       x=c.x+Math.cos(a)*rr;z=c.z+Math.sin(a)*rr;
      }else{
       const r=minDistance+Math.pow(rand(),1.38)*1000;
       x=Math.cos(a)*r;z=Math.sin(a)*r;
      }
      const path=marsApproachMask(x,z,landingRadius);
      if(Math.hypot(x,z)>minDistance&&(small||path<.03)){good=true;break;}
     }
     if(!good){const a=2.35+rand()*.3,r=minDistance+35+rand()*160;x=Math.cos(a)*r;z=Math.sin(a)*r;}
     const ysize=size*(giant?.63+rand()*.7:.72+rand()*.5);
     // Match the rock's actual lower vertex to terrain; bury just a little.
     const burial=(giant?.095:small?.15:.10)*size;
     dummy.position.set(x*unit,ground(x,z)-bottom*ysize*unit-burial*unit,z*unit);
     dummy.rotation.set((rand()-.5)*.17,rand()*Math.PI*2,(rand()-.5)*.17);
     dummy.scale.set(size*(.78+rand()*.43)*unit,ysize*unit,size*(.74+rand()*.52)*unit);
     dummy.updateMatrix();
     mesh.setMatrixAt(i,dummy.matrix);
     tint.set(rockColours[Math.floor(rand()*rockColours.length)]);
     tint.multiplyScalar(.82+rand()*.27);
     mesh.setColorAt(i,tint);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.frustumCulled=false;mesh.castShadow=!small;mesh.receiveShadow=true;
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
