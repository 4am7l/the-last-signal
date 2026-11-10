import {Suspense,useMemo,useRef,useEffect} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as T from 'three';
import type {Mission} from './data';
// Equirectangular maps: Greenwich at u=.5, east-positive longitude.
export function point(lat:number,lon:number,r=300){const a=T.MathUtils.degToRad(lat),b=T.MathUtils.degToRad(lon);return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b))}
function Atmosphere({r,earth}:{r:number;earth:boolean}){
 const uniforms=useMemo(()=>({tint:{value:new T.Color(earth?'#3189ff':'#bf7953')},sunDirection:{value:new T.Vector3(200,300,500).normalize()},strength:{value:earth?.8:.24}}),[earth]);
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
function Clouds({r}:{r:number}){const texture=useLoader(T.TextureLoader,'/earth-clouds.png'),ref=useRef<T.Mesh>(null);useFrame((_,dt)=>{if(ref.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)ref.current.rotation.y+=dt*.008});return <mesh ref={ref}><sphereGeometry args={[r*1.006,64,48]}/><meshStandardMaterial map={texture} transparent opacity={.65} depthWrite={false} roughness={1}/></mesh>}
function Surface({body}:{body:string}){const map=useLoader(T.TextureLoader,`/${body}.jpg`);const {gl}=useThree();useEffect(()=>{map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());map.needsUpdate=true},[map,gl]);return <meshStandardMaterial map={map} roughness={1}/>}
function LunarSurface(){const [map,height]=useLoader(T.TextureLoader,['/moon.jpg','/moon-height.jpg']);map.colorSpace=T.SRGBColorSpace;return <meshStandardMaterial map={map} bumpMap={height} bumpScale={1.1} displacementMap={height} displacementScale={2.1} displacementBias={-1} roughness={1}/>}
export function Planet({body,r=300,pos=[0,-300,0],rotation,click}:{body:string;r?:number;pos?:[number,number,number];rotation?:T.Quaternion;click?:()=>void}){return <group position={pos} quaternion={rotation}><mesh onClick={e=>{e.stopPropagation();click?.()}}><sphereGeometry args={[r,192,128]}/><meshStandardMaterial color={body==='mars'?'#a76d48':'#929796'} roughness={1}/><Suspense fallback={null}>{body==='moon'&&r===300?<LunarSurface/>:<Surface body={body}/>}</Suspense></mesh>{body==='earth'&&<Suspense fallback={null}><Clouds r={r}/></Suspense>}{body!=='moon'&&<Atmosphere r={r} earth={body==='earth'}/>}</group>}
export function SitePin({m,rotation,onClick,selected}:{m:Mission;rotation:T.Quaternion;onClick:()=>void;selected:boolean}){const ref=useRef<T.Group>(null),el=useRef<HTMLButtonElement>(null);const center=useMemo(()=>new T.Vector3(0,-300,0),[]);const normal=useMemo(()=>point(m.lat,m.lon,1).applyQuaternion(rotation),[m.lat,m.lon,rotation]);const pos=useMemo(()=>normal.clone().multiplyScalar(302).add(center),[normal,center]);const scratch=useMemo(()=>new T.Vector3(),[]);useFrame(({camera})=>{const distance=camera.position.distanceTo(center);const visible=normal.dot(scratch.copy(camera.position).sub(pos).normalize())>.04&&distance<1600;if(ref.current)ref.current.visible=visible;if(el.current){el.current.style.visibility=visible?'visible':'hidden';el.current.tabIndex=visible?0:-1}});return <group ref={ref} position={pos}><mesh><sphereGeometry args={[selected?2:1.4,12,8]}/><meshBasicMaterial color="#e6f5bd"/></mesh><Html center zIndexRange={[8,1]} style={{pointerEvents:'none'}}><button ref={el} className={'sitePin '+(selected?'chosen':'')} style={{pointerEvents:'auto'}} onClick={onClick}><span className="pinDot"/>{m.name}<small dir="ltr">{Math.abs(m.lat).toFixed(3)}° {m.lat<0?'S':'N'} · {m.lon.toFixed(3)}° E</small></button></Html></group>}
function Regolith({moon,launch}:{moon:boolean;launch:boolean}){const material=useMemo(()=>{const mat=new T.MeshStandardMaterial({color:launch?'#475349':moon?'#797773':'#9a6d50',roughness:1});mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');shader.fragmentShader='varying vec3 vGround;\nfloat grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grit=grain(floor(vGround.xz*85.)); float strata=sin(vGround.x*.13+sin(vGround.z*.17))*sin(vGround.z*.08); diffuseColor.rgb*=.84+grit*.24+strata*.07;');};return mat},[moon,launch]);useEffect(()=>()=>material.dispose(),[material]);return <primitive object={material} attach="material"/>}
// Deterministic illustrative regolith, in metres. This is deliberately not labelled a site DEM.
export function Terrain({moon=false,launch=false}:{moon?:boolean;launch?:boolean}){const geometry=useMemo(()=>{const g=new T.PlaneGeometry(24000,24000,160,160);g.rotateX(-Math.PI/2);const p=g.attributes.position;const radius=moon?1737400:3389500;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z);const blend=T.MathUtils.smoothstep(d,18,500);const hills=(Math.sin(x*.0009)*Math.cos(z*.0013)*100+Math.sin(x*.003+z*.002)*24)*blend;const bowl=-d*d/(2*radius);p.setY(i,launch?0:hills+bowl)}g.computeVertexNormals();return g},[moon,launch]);useEffect(()=>()=>geometry.dispose(),[geometry]);const near=useMemo(()=>{const g=new T.PlaneGeometry(300,300,100,100);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z);p.setY(i,Math.sin(x*.19)*Math.cos(z*.23)*.32*T.MathUtils.smoothstep(d,9,32)+.015)}g.computeVertexNormals();return g},[]);useEffect(()=>()=>near.dispose(),[near]);return <group><mesh geometry={geometry} receiveShadow><Regolith moon={moon} launch={launch}/></mesh>{!launch&&<mesh geometry={near} receiveShadow><Regolith moon={moon} launch={launch}/></mesh>}</group>}
