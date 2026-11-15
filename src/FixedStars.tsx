import {useMemo,useEffect,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {useSimulation,PRESETS} from './simulation';

// Photographic sky: ESO/S. Brunier, eso0932a (CC BY 4.0).
// Photographic exposure/orientation is artistic; point stars use HYG J2000 coordinates.
export function FixedStars({marsSurface}:{marsSurface:boolean}){
 const {gl}=useThree();
 const settings=useSimulation();
 const [catalog,setCatalog]=useState<T.BufferGeometry|null>(null);
 const {scene}=useThree();
 useEffect(()=>{
  const worker=new Worker(new URL('./starCatalog.worker.ts',import.meta.url),{type:'module'});let geometry:T.BufferGeometry|undefined;
  scene.userData.starSource='جارٍ تحميل HYG — السماء الفوتوغرافية ظاهرة أثناء التحميل';
  worker.onmessage=({data})=>{
   if(data.error){scene.userData.starSource='تعذّر تحميل HYG — خلفية فوتوغرافية فقط';return;}
   geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(data.position,3));geometry.setAttribute('magnitude',new T.BufferAttribute(data.magnitude,1));geometry.setAttribute('temperature',new T.BufferAttribute(data.temperature,1));setCatalog(geometry);
   scene.userData.starSource='HYG v4.1 · '+data.count.toLocaleString()+' نجمة كتالوجية متاحة · J2000';
  };
  worker.onerror=()=>{scene.userData.starSource='تعذّر تحميل HYG — خلفية فوتوغرافية فقط';};
  // The star catalogue is optional for first paint. Yield to the planetary
  // renderer, then populate the same catalogue without changing its quality.
  const launch=window.setTimeout(()=>worker.postMessage({}),350);
  return()=>{window.clearTimeout(launch);worker.terminate();geometry?.dispose();};
 },[scene]);
 useEffect(()=>{catalog?.setDrawRange(0,Math.min(settings.starCount,PRESETS[settings.quality].stars,catalog.attributes.position.count));},[catalog,settings.starCount,settings.quality]);
 const orientation=useMemo(()=>new T.Matrix4().makeRotationX(.02).multiply(new T.Matrix4().makeRotationZ(-.32)).multiply(new T.Matrix4().makeRotationY(Math.PI/2)),[]);
 const rotationScratch=useMemo(()=>new T.Matrix4(),[]);
 const uniforms=useMemo(()=>({skyRotation:{value:new T.Matrix3()},starRotation:{value:new T.Matrix3()},pixelRatio:{value:1},visibility:{value:1},panorama:{value:null as T.Texture|null},hasPanorama:{value:0},photoBlend:{value:0},texel:{value:new T.Vector2(1/6000,1/3000)}}),[]);
 useEffect(()=>{
  let alive=true;let loaded:T.Texture|undefined;
  let upgradeTimer:ReturnType<typeof setTimeout>|undefined;
  const loader=new T.TextureLoader();
  const install=(texture:T.Texture)=>{
   if(!alive){texture.dispose();return;}
   const previous=loaded;loaded=texture;texture.colorSpace=T.SRGBColorSpace;texture.wrapS=T.RepeatWrapping;
   texture.anisotropy=Math.min(8,gl.capabilities.getMaxAnisotropy());
   const image=texture.image as HTMLImageElement;
   uniforms.texel.value.set(1/image.width,1/image.height);
   uniforms.panorama.value=texture;uniforms.hasPanorama.value=1;previous?.dispose();
  };
  const mirror='https://raw.githubusercontent.com/TokisanGames/Sky3D/main/addons/sky_3d/assets/thirdparty/textures/milkyway/Milkyway.jpg';
  const upgrade=()=>{
   if(settings.quality==='low'||settings.quality==='medium')return;
   if(!alive)return;
   loader.load('https://cdn.eso.org/images/large/eso0932a.jpg',install,undefined,()=>{if(alive)loader.load(mirror,install,undefined,()=>{})});
  };
  // Show the lighter panorama first. Downloading/uploading the multi-
  // megapixel version immediately competes with the planet and terrain.
  const scheduleUpgrade=()=>{
   if(!alive)return;
   upgradeTimer=window.setTimeout(upgrade,1300);
  };
  loader.load('https://cdn.eso.org/images/screen/eso0932a.jpg',texture=>{install(texture);scheduleUpgrade()},undefined,scheduleUpgrade);
  return()=>{alive=false;if(upgradeTimer!==undefined)window.clearTimeout(upgradeTimer);loaded?.dispose();uniforms.panorama.value=null;uniforms.hasPanorama.value=0;uniforms.photoBlend.value=0};
 },[uniforms,gl,settings.quality]);
 useFrame(({scene},dt)=>{
  const q=scene.userData.skyRotation as T.Quaternion|undefined;
  rotationScratch.makeRotationFromQuaternion(q??new T.Quaternion());
  uniforms.starRotation.value.setFromMatrix4(rotationScratch);
  rotationScratch.multiply(orientation);
  uniforms.skyRotation.value.setFromMatrix4(rotationScratch);
  uniforms.pixelRatio.value=Math.min(gl.getPixelRatio(),2);
  const target=Number(scene.userData.skyVisibility??(marsSurface&&scene.fog?0:1));
  uniforms.visibility.value=T.MathUtils.damp(uniforms.visibility.value,target,3,Math.min(dt,.05));
  uniforms.photoBlend.value=T.MathUtils.damp(uniforms.photoBlend.value,uniforms.hasPanorama.value,2,Math.min(dt,.05));
 });

 return <>
  <mesh frustumCulled={false} renderOrder={-1100}>
   <sphereGeometry args={[1,64,32]}/>
   <shaderMaterial side={T.BackSide} toneMapped={false} transparent depthWrite={false} depthTest uniforms={uniforms}
    vertexShader={`uniform mat3 skyRotation;varying vec3 skyDirection;void main(){skyDirection=position;vec3 d=mat3(viewMatrix)*skyRotation*position;vec4 p=projectionMatrix*vec4(d,1.);gl_Position=vec4(p.xy,p.w,p.w);}`}
    fragmentShader={`uniform sampler2D panorama;uniform float hasPanorama;uniform float photoBlend;uniform float visibility;uniform vec2 texel;varying vec3 skyDirection;
void main(){
 vec3 d=normalize(skyDirection);
 // The bundled catalogue supplies the stars immediately. Keep the fallback
 // black instead of inventing luminous procedural galactic clouds.
 vec3 color=vec3(0.);
 vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
 if(hasPanorama>.5){
  vec3 photograph=texture2D(panorama,uv).rgb;
  // Lift photographed faint star clouds, retain dark lanes and real colour variation.
  float luminance=dot(photograph,vec3(.2126,.7152,.0722));
  photograph=mix(vec3(luminance),photograph,1.12);
  photograph=pow(max(photograph,vec3(0.)),vec3(1.16))*.48;
  // Restrained optical glow from the photograph's brightest features only.
  vec3 bloom=vec3(0.);
  bloom+=max(texture2D(panorama,uv+texel*vec2(3.,0.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv-texel*vec2(3.,0.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv+texel*vec2(0.,3.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv-texel*vec2(0.,3.)).rgb-.24,0.);
  photograph+=bloom*.025;
  photograph=photograph/(vec3(1.)+photograph*.32);
  color=mix(color,photograph,photoBlend);
 }
 gl_FragDepth=1.;gl_FragColor=vec4(color,visibility*.58);
 #include <colorspace_fragment>
}`}/>
  </mesh>
  {catalog&&<points geometry={catalog} frustumCulled={false} renderOrder={-1000}>
   <shaderMaterial toneMapped={false} transparent depthWrite={false} depthTest uniforms={uniforms}
    vertexShader={`uniform mat3 starRotation;uniform float pixelRatio;attribute float magnitude;attribute float temperature;varying float brightness;varying vec3 tint;
void main(){vec3 direction=mat3(viewMatrix)*starRotation*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w,p.w);
brightness=clamp(pow(10.,-.18*(magnitude-1.)),.09,1.);
tint=temperature<5800.?mix(vec3(1.,.57,.30),vec3(1.,.97,.91),clamp((temperature-2500.)/3300.,0.,1.)):mix(vec3(1.,.97,.91),vec3(.63,.77,1.),clamp((temperature-5800.)/10000.,0.,1.));
gl_PointSize=(1.8+pow(brightness,.7)*2.8)*pixelRatio;}`}
    fragmentShader={`uniform float visibility;uniform float photoBlend;varying float brightness;varying vec3 tint;
void main(){float r=length(gl_PointCoord-.5);float core=exp(-r*r*72.);float halo=exp(-r*r*13.)*.16*smoothstep(.4,.9,brightness);float alpha=(core+halo)*brightness*visibility*mix(1.65,1.45,photoBlend)*(1.-smoothstep(.4,.5,r));if(alpha<.002)discard;gl_FragDepth=1.;gl_FragColor=vec4(tint,clamp(alpha,0.,1.));
#include <colorspace_fragment>
}`}/>
  </points>}
 </>;
}
