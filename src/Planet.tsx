import {useElevation} from './useElevation';
import {elevationAt} from './elevation';
import {Suspense,useMemo,useRef,useEffect} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as T from 'three';
import type {Mission} from './data';
import {usePlanetTexture} from './usePlanetTexture';
import {localRelief} from './lunarTerrain';
import {mountains,surfaceDetail,marsRelief} from './sceneMath';
import {SCENE_SUN_DIRECTION,solarShader,type Occluder} from './solar';
// Equirectangular maps: Greenwich at u=.5, east-positive longitude.
export function point(lat:number,lon:number,r=300){const a=T.MathUtils.degToRad(lat),b=T.MathUtils.degToRad(lon);return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b))}
export function Atmosphere({r,earth}:{r:number;earth:boolean}){
 const uniforms=useMemo(()=>({tint:{value:new T.Color(earth?'#3189ff':'#bf7953')},sunDirection:{value:SCENE_SUN_DIRECTION},strength:{value:earth?.8:.24}}),[earth]);
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
 float rim=pow(1.-facing,3.);float alpha=rim*strength*(.035+.965*daylight);
 gl_FragColor=vec4(tint,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`;
 return <group>{(earth?[{scale:1+100/6371,side:T.BackSide},{scale:1.0015,side:T.FrontSide}]:[{scale:1.018,side:T.BackSide}]).map((layer,i)=><mesh key={i} scale={layer.scale} renderOrder={2}><sphereGeometry args={[r,96,64]}/><shaderMaterial transparent depthWrite={false} side={layer.side} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}/></mesh>)}</group>;
}
function Clouds({r}:{r:number}){
 const texture=useLoader(T.TextureLoader,'/earth-clouds.png');
 useEffect(()=>{texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true},[texture]);
 return <mesh><sphereGeometry args={[r*1.0016,96,64]}/><meshStandardMaterial map={texture} transparent opacity={.83} depthWrite={false} roughness={1}/></mesh>;
}
function EarthSurface({occluders}:{occluders:Occluder[]}){
 const map=usePlanetTexture('earth');const clouds=useLoader(T.TextureLoader,'/earth-clouds.png');
 const {gl}=useThree();
 const material=useMemo(()=>{map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());map.needsUpdate=true;
  const mat=new T.MeshStandardMaterial({map,roughness:.8,metalness:0});
  mat.onBeforeCompile=shader=>{solarShader(shader,occluders);shader.uniforms.cloudMask={value:clouds};
   shader.fragmentShader='uniform sampler2D cloudMask;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
float oceanMask=smoothstep(.01,.065,diffuseColor.b-max(diffuseColor.r,diffuseColor.g*.83));
roughnessFactor=mix(.88,.21,oceanMask);
`).replace('reflectedLight.directDiffuse*=sunlightVisibility;',`float cloudShadow=texture2D(cloudMask,vMapUv+vec2(.0006,.00025)).a;
reflectedLight.directDiffuse*=sunlightVisibility*(1.-cloudShadow*.37);`);
  };return mat;
 },[map,clouds,gl,occluders]);
 useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>;
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
export function Planet({body,r=300,pos=[0,-300,0],rotation,click,occluders=NO_OCCLUDERS}:{body:string;r?:number;pos?:[number,number,number];rotation?:T.Quaternion;click?:()=>void;occluders?:Occluder[]}){
 const dem=useElevation(body);
 const geometry=useMemo(()=>{
  const g=new T.SphereGeometry(r,256,192);
  if(dem){const positions=g.attributes.position;const n=new T.Vector3();for(let i=0;i<positions.count;i++){n.fromBufferAttribute(positions,i).normalize();const elevation=elevationAt(dem,Math.asin(n.y)*180/Math.PI,Math.atan2(-n.z,n.x)*180/Math.PI)*r/(body==='moon'?1737400:3389500);n.multiplyScalar(r+elevation);positions.setXYZ(i,n.x,n.y,n.z)}g.computeVertexNormals();}
  return g;
 },[body,r,dem]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={pos} quaternion={rotation}><mesh geometry={geometry} onClick={e=>{if(e.delta>4)return;e.stopPropagation();click?.()}}><meshStandardMaterial color={body==='mars'?'#a76d48':'#929796'} roughness={1}/><Suspense fallback={null}>{body==='earth'?<EarthSurface occluders={occluders}/>:body==='moon'?<LunarSurface r={dem?0:r} occluders={occluders}/>:<Surface body={body} occluders={occluders}/>}</Suspense></mesh>{body==='earth'&&<Suspense fallback={null}><Clouds r={r}/></Suspense>}{body!=='moon'&&<Atmosphere r={r} earth={body==='earth'}/>}</group>;
}
export function SitePin({m,rotation,onClick,selected}:{m:Mission;rotation:T.Quaternion;onClick:()=>void;selected:boolean}){const ref=useRef<T.Group>(null),el=useRef<HTMLButtonElement>(null);const center=useMemo(()=>new T.Vector3(0,-300,0),[]);const normal=useMemo(()=>point(m.lat,m.lon,1).applyQuaternion(rotation),[m.lat,m.lon,rotation]);const pos=useMemo(()=>normal.clone().multiplyScalar(302).add(center),[normal,center]);const scratch=useMemo(()=>new T.Vector3(),[]);useFrame(({camera})=>{const distance=camera.position.distanceTo(center);const visible=normal.dot(scratch.copy(camera.position).sub(pos).normalize())>.04&&distance<1600;if(ref.current)ref.current.visible=visible;if(el.current){el.current.style.visibility=visible?'visible':'hidden';el.current.tabIndex=visible?0:-1}});return <group ref={ref} position={pos}><mesh><sphereGeometry args={[selected?2:1.4,12,8]}/><meshBasicMaterial color="#e6f5bd"/></mesh><Html center zIndexRange={[8,1]} style={{pointerEvents:'none'}}><button ref={el} className={'sitePin '+(selected?'chosen':'')} style={{pointerEvents:'auto'}} onClick={onClick}><span className="pinDot"/>{m.name}<small dir="ltr">{Math.abs(m.lat).toFixed(3)}° {m.lat<0?'S':'N'} · {m.lon.toFixed(3)}° E</small></button></Html></group>}
function Regolith({moon,launch}:{moon:boolean;launch:boolean}){const material=useMemo(()=>{const mat=new T.MeshStandardMaterial({color:launch?'#475349':moon?'#797773':'#9a6d50',roughness:1});mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');shader.fragmentShader='varying vec3 vGround;\nfloat grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grit=grain(floor(vGround.xz*85.)); float strata=sin(vGround.x*.13+sin(vGround.z*.17))*sin(vGround.z*.08); diffuseColor.rgb*=.84+grit*.24+strata*.07;');};return mat},[moon,launch]);useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>}
// Illustrative metre-scale story terrain, shared relief functions with exploration.
export function terrainHeight(x:number,z:number,moon:boolean){const radius=moon?1737400:3389500;return localRelief(x,z)*(moon?1:.35)+mountains(x,z,moon?'moon':'mars')+surfaceDetail(x,z,moon?'moon':'mars')-(x*x+z*z)/(2*radius)}
export function Terrain({moon=false,launch=false}:{moon?:boolean;launch?:boolean}){
 const geometry=useMemo(()=>{
  const positions:number[]=[],indices:number[]=[],rings=224,sectors=192;
  for(let j=0;j<=rings;j++){const r=j===0?0:Math.exp(Math.log(.2)+(Math.log(24000)-Math.log(.2))*(j-1)/(rings-1));for(let i=0;i<=sectors;i++){const angle=i/sectors*Math.PI*2,x=Math.cos(angle)*r,z=Math.sin(angle)*r;positions.push(x,launch?0:terrainHeight(x,z,moon),z);if(j<rings&&i<sectors){const k=j*(sectors+1)+i;indices.push(k,k+1,k+sectors+1,k+1,k+sectors+2,k+sectors+1)}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[moon,launch]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh geometry={geometry} receiveShadow><Regolith moon={moon} launch={launch}/></mesh>;
}
