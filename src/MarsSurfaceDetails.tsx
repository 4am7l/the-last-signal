import {useEffect,useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import {marsCraterField,marsSiteSeed} from './marsGeology';
import {noise3} from './sceneMath';

// Ten separate CC0 Kenney Nature Kit GLB meshes are vendored in public/models/mars-rocks.
// Each is a different authored 3D silhouette, rather than a recoloured layered monolith.
const ROCK_ASSETS=[
 'rock-largea','rock-largeb','rock-largec','rock-larged','rock-largee','rock-largef',
 'rock-talla','rock-tallb','rock-smallb','rock-smallc'
];
const ROCK_PATHS=ROCK_ASSETS.map(name=>'/models/mars-rocks/'+name+'.glb');
const COLOURS=['#a0836f','#8c7364','#987c69','#655c56','#ae8970','#72675e','#83685d'];
function randomFromSeed(seed:number){
 let s=seed>>>0||1;
 return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
}
function rockGeometry(scene:T.Group,seed:number){
 scene.updateMatrixWorld(true);
 const parts:T.BufferGeometry[]=[];
 scene.traverse(object=>{
  if(!(object instanceof T.Mesh))return;
  const original=(object.geometry as T.BufferGeometry).clone();
  original.applyMatrix4(object.matrixWorld);
  for(const key of Object.keys(original.attributes))if(key!=='position')original.deleteAttribute(key);
  const plain=original.index?original.toNonIndexed():original;
  if(plain!==original)original.dispose();
  parts.push(plain);
 });
 if(!parts.length)return new T.IcosahedronGeometry(1,1);
 const merged=mergeGeometries(parts,false);
 parts.forEach(g=>g.dispose());
 if(!merged)return new T.IcosahedronGeometry(1,1);
 const position=merged.getAttribute('position') as T.BufferAttribute;
 merged.computeBoundingBox();
 const bounds=merged.boundingBox!;
 const cx=(bounds.min.x+bounds.max.x)*.5,cz=(bounds.min.z+bounds.max.z)*.5;
 const scale=1/Math.max(bounds.max.x-bounds.min.x,bounds.max.z-bounds.min.z,bounds.max.y-bounds.min.y,.001);
 for(let i=0;i<position.count;i++){
  const x=(position.getX(i)-cx)*scale,y=(position.getY(i)-bounds.min.y)*scale,z=(position.getZ(i)-cz)*scale;
  position.setXYZ(i,x,y,z);
 }
 position.needsUpdate=true;
 // Add mid-edge chiselling to the source mesh while retaining its unique shape.
 let result=mergeVertices(merged,1e-5);
 merged.dispose();
 const vertex=result.getAttribute('position') as T.BufferAttribute;
 const points=Array.from(vertex.array as ArrayLike<number>);
 const indices=result.index,faces:number[]=[],cache=new Map<string,number>();
 if(indices){
  const middle=(a:number,b:number)=>{
   const key=a<b?a+':'+b:b+':'+a;
   const existing=cache.get(key);if(existing!==undefined)return existing;
   const x=(points[a*3]+points[b*3])*.5;
   const y=(points[a*3+1]+points[b*3+1])*.5;
   const z=(points[a*3+2]+points[b*3+2])*.5;
   const rough=noise3(x*11+seed*.03,y*13+seed*.01,z*9)*.018;
   const normal=new T.Vector3(x,y,z).normalize().multiplyScalar(rough);
   const next=points.length/3;
   points.push(x+normal.x,y+normal.y,z+normal.z);
   cache.set(key,next);return next;
  };
  for(let i=0;i<indices.count;i+=3){
   const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
   const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);
   faces.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
  }
  const expanded=new T.BufferGeometry();
  expanded.setAttribute('position',new T.Float32BufferAttribute(points,3));
  expanded.setIndex(faces);result.dispose();result=expanded;
 }
 result.computeVertexNormals();
 return result;
}
function rockMaterial(){
 const m=new T.MeshStandardMaterial({color:'#ffffff',roughness:.96,metalness:0});
 m.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vRockShape;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRockShape=position;');
  shader.fragmentShader='varying vec3 vRockShape;\n'+shader.fragmentShader.replace('#include <color_fragment>',
  '#include <color_fragment>\nfloat grain=fract(sin(dot(floor(vRockShape*63.),vec3(127.1,311.7,74.7)))*43758.5453)-.5;\nfloat chips=fract(sin(dot(floor(vRockShape*17.),vec3(39.346,11.135,83.155)))*28145.183)-.5;\ndiffuseColor.rgb*=1.+grain*.11+chips*.15;');
 };
 m.customProgramCacheKey=()=> 'mars-kenney-rocks-v1';
 return m;
}
export function MarsRocks({ground,unit,clearance,count,lat,lon,landingRadius}:{
 ground:(x:number,z:number)=>number;unit:number;clearance:number;count:number;lat:number;lon:number;landingRadius:number
}){
 const loaded=useLoader(GLTFLoader,ROCK_PATHS);
 const shapes=useMemo(()=>loaded.map((g,i)=>rockGeometry(g.scene,121+i*13)),[loaded]);
 useEffect(()=>()=>shapes.forEach(geo=>geo.dispose()),[shapes]);
 const meshes=useMemo(()=>{
  const random=randomFromSeed(marsSiteSeed(lat,lon)^0x7159b);
  const craters=marsCraterField(lat,lon,landingRadius).filter(c=>Math.hypot(c.x,c.z)<1100);
  const clusters=Array.from({length:23},()=>{
   const a=random()*Math.PI*2,r=landingRadius+30+Math.pow(random(),.8)*610;
   return {x:Math.cos(a)*r,z:Math.sin(a)*r};
  });
  const proportions=[.11,.105,.10,.10,.10,.10,.02,.02,.17,.17];
  return shapes.map((geometry,i)=>{
   const giant=i===6||i===7,gravel=i>=8;
   const total=giant?Math.max(7,Math.round(count*proportions[i]*.55)):
    gravel?Math.max(450,Math.round(count*proportions[i]*2.8)):
    Math.max(50,Math.round(count*proportions[i]));
   const mesh=new T.InstancedMesh(geometry,rockMaterial(),total);
   const dummy=new T.Object3D(),colour=new T.Color();
   for(let j=0;j<total;j++){
    const size=giant?6+Math.pow(random(),.85)*26:
     gravel?.018+Math.pow(random(),2.1)*.23:.22+Math.pow(random(),2.2)*4;
    const minRadius=Math.max(clearance+size*1.7,giant?landingRadius+135:landingRadius+2);
    let x=0,z=0;
    for(let attempt=0;attempt<15;attempt++){
     const p=random();
     if(giant){
      const angle=random()*Math.PI*2,r=minRadius+random()*2200;
      x=Math.cos(angle)*r;z=Math.sin(angle)*r;
     }else if(p<.48){
      const c=clusters[Math.floor(random()*clusters.length)];
      const angle=random()*Math.PI*2,r=Math.sqrt(random())*(gravel?23:40);
      x=c.x+Math.cos(angle)*r;z=c.z+Math.sin(angle)*r;
     }else if(p<.70&&craters.length){
      const c=craters[Math.floor(random()*craters.length)];
      const angle=random()*Math.PI*2,r=c.radius*(.95+random()*.4);
      x=c.x+Math.cos(angle)*r;z=c.z+Math.sin(angle)*r;
     }else{
      const angle=random()*Math.PI*2,r=minRadius+Math.pow(random(),1.4)*(gravel?350:1100);
      x=Math.cos(angle)*r;z=Math.sin(angle)*r;
     }
     if(Math.hypot(x,z)>minRadius)break;
    }
    const height=size*(.78+random()*.52);
    dummy.position.set(x*unit,ground(x,z)-height*.075*unit,z*unit);
    dummy.rotation.set((random()-.5)*.18,random()*Math.PI*2,(random()-.5)*.18);
    dummy.scale.set(size*(.75+random()*.55)*unit,height*unit,size*(.8+random()*.45)*unit);
    dummy.updateMatrix();
    mesh.setMatrixAt(j,dummy.matrix);
    colour.set(COLOURS[Math.floor(random()*COLOURS.length)]).multiplyScalar(.82+random()*.3);
    mesh.setColorAt(j,colour);
   }
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   mesh.castShadow=!gravel;mesh.receiveShadow=true;mesh.frustumCulled=false;
   return mesh;
  });
 },[shapes,ground,unit,clearance,count,lat,lon,landingRadius]);
 useEffect(()=>()=>meshes.forEach(mesh=>{(mesh.material as T.Material).dispose();mesh.dispose()}),[meshes]);
 return <group>{meshes.map((mesh,i)=><primitive key={i} object={mesh}/>)}</group>;
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
