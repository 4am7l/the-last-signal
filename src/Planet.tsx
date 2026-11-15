import {useElevation} from './useElevation';
import {elevationAt} from './elevation';
import {Suspense,useMemo,useRef,useEffect} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as T from 'three';
import {missions,type Mission} from './data';
import {usePlanetTexture} from './usePlanetTexture';
import {localRelief} from './lunarTerrain';
import {mountains,surfaceDetail,marsRelief,lunarPinPlacement} from './sceneMath';
import {SCENE_SUN_DIRECTION,solarShader,type Occluder} from './solar';
// Equirectangular maps: Greenwich at u=.5, east-positive longitude.
export function point(lat:number,lon:number,r=300){const a=T.MathUtils.degToRad(lat),b=T.MathUtils.degToRad(lon);return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b))}
import {MarsAtmosphere as Atmosphere} from './MarsAtmosphere';
export {MarsAtmosphere as Atmosphere} from './MarsAtmosphere';
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
const terrainCenter = new T.Vector3(0, -300, 0);
export const lunarSites = missions.flatMap((mission, index) => mission.body === 'moon' ? [{ mission, index }] : []);

export function lunarSiteDirection() {
 const direction = new T.Vector3();
 for (const { mission } of lunarSites) direction.add(point(mission.lat, mission.lon, 1));
 return direction.normalize();
}

// Persistent labels supply their own off-globe position even behind the camera.
const keepPinVisible = () => {};

export function SitePin({
 m, rotation, onClick, selected = false, center = terrainCenter, radius = 302, label = m.name, landingLabel, persistentSlot, labelOffset = 0,
}: {
 m: Mission;
 rotation: T.Quaternion;
 onClick?: () => void;
 selected?: boolean;
 center?: T.Vector3;
 radius?: number;
 label?: string;
 landingLabel?: string;
 persistentSlot?: number;
 labelOffset?: number;
}) {
 const group = useRef<T.Group>(null);
 const button = useRef<HTMLButtonElement>(null);
 const lastPlacement = useRef<{ x: number; y: number; onGlobe: boolean } | null>(null);
 const pressedPlacement = useRef<typeof lastPlacement.current>(null);
 const pressedPointer = useRef<number | null>(null);
 const gl = useThree((state) => state.gl);
 const normal = useMemo(() => point(m.lat, m.lon, 1).applyQuaternion(rotation), [m.lat, m.lon, rotation]);
 const position = useMemo(() => normal.clone().multiplyScalar(radius).add(center), [normal, radius, center]);
 const scratch = useMemo(() => new T.Vector3(), []);
 const persistent = persistentSlot !== undefined;
 const facesCamera = (camera: T.Camera) =>
  normal.dot(scratch.copy(camera.position).sub(position).normalize()) > .04;
 const calculatePosition = (_: T.Object3D, camera: T.Camera, size: {width:number;height:number}) => {
  const pressed = pressedPlacement.current;
  if (pressed) return [pressed.x, pressed.y];
  const facing = facesCamera(camera);
  const projected = scratch.copy(position).project(camera);
  if (!persistent) {
   const placement = { x: (projected.x + 1) * size.width / 2, y: (1 - projected.y) * size.height / 2, onGlobe: facing };
   lastPlacement.current = placement;
   return [placement.x, placement.y];
  }
  const canvas = gl.domElement.getBoundingClientRect();
  const stage = gl.domElement.closest('.explorer-stage')?.getBoundingClientRect();
  const visibleLeft = stage ? Math.max(0, stage.left - canvas.left) : 0;
  const visibleRight = stage ? Math.min(size.width, stage.right - canvas.left) : size.width;
  const placement = lunarPinPlacement(projected, facing, size.width, size.height, persistentSlot ?? 0, visibleLeft, visibleRight, labelOffset);
  lastPlacement.current = placement;
  button.current?.toggleAttribute('data-off-globe', !placement.onGlobe);
  return [placement.x, placement.y];
 };
 useFrame(({ camera }) => {
  const visible = (center !== terrainCenter || camera.position.distanceTo(center) < 1600) && facesCamera(camera);
  if (group.current) group.current.visible = visible;
  if (!persistent && button.current) {
   const available = visible || pressedPlacement.current !== null;
   button.current.style.visibility = available ? "visible" : "hidden";
   button.current.tabIndex = available ? 0 : -1;
  }
 });
 return (
  <group ref={group} position={position}>
   <mesh>
    <sphereGeometry args={[onClick ? (selected ? 2 : 1.4) : 3, 12, 8]} />
    <meshBasicMaterial color="#e6f5bd" />
   </mesh>
   {onClick && <Html center zIndexRange={[8, 1]} style={{ pointerEvents: "none" }}
    calculatePosition={calculatePosition}
    onOcclude={persistent ? keepPinVisible : undefined}>
    <button ref={button} type="button" aria-label={landingLabel} className={selected ? "sitePin chosen" : "sitePin"} style={{ pointerEvents: "auto" }}
     onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      pressedPointer.current = event.pointerId;
      pressedPlacement.current = lastPlacement.current;
     }}
     onPointerUp={(event) => {
      if (pressedPointer.current !== event.pointerId) return;
      event.stopPropagation();
      pressedPointer.current = null;
      pressedPlacement.current = null;
     }}
     onPointerCancel={() => { pressedPointer.current = null; pressedPlacement.current = null; }}
     onPointerLeave={() => { pressedPointer.current = null; pressedPlacement.current = null; }}
     onClick={(event) => {
      event.stopPropagation();
      onClick();
     }}>
     <span className="pinDot" aria-hidden="true" />{label}
     <small dir="ltr">{Math.abs(m.lat)}° {m.lat < 0 ? "S" : "N"} · {m.lon}° E</small>
    </button>
   </Html>}
  </group>
 );
}
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
