import {useElevation} from './useElevation';
import {elevationAt} from './elevation';
import {Suspense,useMemo,useEffect} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
import {usePlanetTexture} from './usePlanetTexture';
import {SCENE_SUN_DIRECTION,solarShader,type Occluder} from './solar';
// Equirectangular maps: Greenwich at u=.5, east-positive longitude.
export function point(lat:number,lon:number,r=300){const a=T.MathUtils.degToRad(lat),b=T.MathUtils.degToRad(lon);return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b))}
export function Atmosphere({r}:{r:number}){
 const uniforms=useMemo(()=>({tint:{value:new T.Color('#bf8b69')},sunDirection:{value:SCENE_SUN_DIRECTION},strength:{value:.36}}),[]);
 const vertexShader=`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 varying vec3 worldNormal; varying vec3 worldView;
 void main(){vec4 world=modelMatrix*vec4(position,1.);worldNormal=normalize(mat3(modelMatrix)*normal);worldView=cameraPosition-world.xyz;gl_Position=projectionMatrix*viewMatrix*world;
 #include <logdepthbuf_vertex>
 }`;
 const fragmentShader=`
 #include <common>
 #include <logdepthbuf_pars_fragment>
 varying vec3 worldNormal; varying vec3 worldView;
 uniform vec3 tint; uniform vec3 sunDirection; uniform float strength;
 void main(){
 #include <logdepthbuf_fragment>
 vec3 n=normalize(worldNormal);float facing=abs(dot(n,normalize(worldView)));
 float daylight=smoothstep(-.22,.35,dot(n,sunDirection));
 float rim=pow(1.-facing,2.05);float twilight=smoothstep(-.28,.12,dot(n,sunDirection));float alpha=rim*strength*(.012+.988*twilight);
 gl_FragColor=vec4(tint,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 return <group>{([{scale:1.023,side:T.BackSide,weight:1},{scale:1.008,side:T.FrontSide,weight:.46}]).map((layer,i)=><mesh key={i} scale={layer.scale} renderOrder={2}><sphereGeometry args={[r,96,64]}/><shaderMaterial transparent depthWrite={false} side={layer.side} uniforms={{...uniforms,strength:{value:uniforms.strength.value*layer.weight}}} vertexShader={vertexShader} fragmentShader={fragmentShader}/></mesh>)}</group>;
}
function Surface({body,occluders}:{body:string;occluders:Occluder[]}){
 const map=usePlanetTexture(body);const {gl}=useThree();
 const material=useMemo(()=>{map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());map.needsUpdate=true;const mat=new T.MeshStandardMaterial({map,roughness:1});mat.onBeforeCompile=shader=>solarShader(shader,occluders);return mat},[map,gl,occluders]);
 useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
}
function LunarSurface({r,occluders}:{r:number;occluders:Occluder[]}){
 const map=usePlanetTexture('moon');const height=useLoader(T.TextureLoader,'/moon-height.jpg');
 const material=useMemo(()=>{map.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map,bumpMap:height,bumpScale:r*.00012,displacementMap:height,displacementScale:r*.007,displacementBias:-r*.0035,roughness:1});mat.onBeforeCompile=shader=>solarShader(shader,occluders);return mat},[map,height,r,occluders]);
 useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
}
const NO_OCCLUDERS:Occluder[]=[];
export function Planet({body,r=300,pos=[0,-300,0],rotation,click,occluders=NO_OCCLUDERS}:{body:'moon'|'mars';r?:number;pos?:[number,number,number];rotation?:T.Quaternion;click?:()=>void;occluders?:Occluder[]}){
 const dem=useElevation(body);
 const geometry=useMemo(()=>{
  const g=new T.SphereGeometry(r,256,192);
  if(dem){const positions=g.attributes.position;const n=new T.Vector3();for(let i=0;i<positions.count;i++){n.fromBufferAttribute(positions,i).normalize();const elevation=elevationAt(dem,Math.asin(n.y)*180/Math.PI,Math.atan2(-n.z,n.x)*180/Math.PI)*r/(body==='moon'?1737400:3389500);n.multiplyScalar(r+elevation);positions.setXYZ(i,n.x,n.y,n.z)}g.computeVertexNormals();}
  return g;
 },[body,r,dem]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={pos} quaternion={rotation}><mesh geometry={geometry} onClick={e=>{if(e.delta>4)return;e.stopPropagation();click?.()}}><meshStandardMaterial color={body==='mars'?'#a76d48':'#929796'} roughness={1}/><Suspense fallback={null}>{body==='moon'?<LunarSurface r={dem?0:r} occluders={occluders}/>:<Surface body={body} occluders={occluders}/>}</Suspense></mesh>{body==='mars'&&<Atmosphere r={r}/>}</group>;
}
