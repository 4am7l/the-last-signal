import {useMemo,useEffect,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {useSimulation} from './simulation';

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
  worker.postMessage({});
  return()=>{worker.terminate();geometry?.dispose();};
 },[scene]);
 useEffect(()=>{catalog?.setDrawRange(0,Math.min(settings.starCount,catalog.attributes.position.count));},[catalog,settings.starCount]);
 const orientation=useMemo(()=>new T.Matrix4().makeRotationX(.02).multiply(new T.Matrix4().makeRotationZ(-.32)).multiply(new T.Matrix4().makeRotationY(Math.PI/2)),[]);
 const rotationScratch=useMemo(()=>new T.Matrix4(),[]);
 const uniforms=useMemo(()=>({skyRotation:{value:new T.Matrix3()},starRotation:{value:new T.Matrix3()},pixelRatio:{value:1},visibility:{value:1},panorama:{value:null as T.Texture|null},hasPanorama:{value:0},photoBlend:{value:0},texel:{value:new T.Vector2(1/6000,1/3000)}}),[]);
 useEffect(()=>{
  let alive=true;let loaded:T.Texture|undefined;
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
   if(!alive)return;
   loader.load('https://cdn.eso.org/images/large/eso0932a.jpg',install,undefined,()=>{if(alive)loader.load(mirror,install,undefined,()=>{})});
  };
  loader.load('https://cdn.eso.org/images/screen/eso0932a.jpg',texture=>{install(texture);upgrade()},undefined,upgrade);
  return()=>{alive=false;loaded?.dispose();uniforms.panorama.value=null;uniforms.hasPanorama.value=0;uniforms.photoBlend.value=0};
 },[uniforms,gl]);
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
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.5+noise(p*2.03+7.)*.25+noise(p*4.11+13.)*.125+noise(p*8.21+19.)*.0625;}
void main(){
 vec3 d=normalize(skyDirection);float latitude=d.y;
 float disk=exp(-latitude*latitude*90.);
 float core=pow(max(d.x,0.),18.)*exp(-latitude*latitude*30.);
 float cloud=fbm(d*16.);
 float split=latitude+(fbm(d*11.+5.)-.45)*.12;
 float dust=exp(-split*split*340.)*smoothstep(.22,.66,fbm(d*34.+3.));
 vec3 stellar=mix(vec3(.065,.095,.13),vec3(.38,.25,.14),pow(max(d.x,0.),3.));
 vec3 color=(stellar*disk*(.35+cloud*1.6)+vec3(.8,.64,.44)*core)*exp(-dust*vec3(3.4,4.1,5.2));
 color+=vec3(.018,.025,.045)*exp(-latitude*latitude*10.)*(.3+cloud);
 vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
 if(hasPanorama>.5){
  vec3 photograph=texture2D(panorama,uv).rgb;
  // Lift photographed faint star clouds, retain dark lanes and real colour variation.
  float luminance=dot(photograph,vec3(.2126,.7152,.0722));
  photograph=mix(vec3(luminance),photograph,1.12);
  photograph=pow(max(photograph,vec3(0.)),vec3(.94))*1.65;
  // Restrained optical glow from the photograph's brightest features only.
  vec3 bloom=vec3(0.);
  bloom+=max(texture2D(panorama,uv+texel*vec2(3.,0.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv-texel*vec2(3.,0.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv+texel*vec2(0.,3.)).rgb-.24,0.);
  bloom+=max(texture2D(panorama,uv-texel*vec2(0.,3.)).rgb-.24,0.);
  photograph+=bloom*.07;
  photograph=photograph/(vec3(1.)+photograph*.32);
  color=mix(color,photograph,photoBlend);
 }
 gl_FragDepth=1.;gl_FragColor=vec4(color,visibility);
 #include <colorspace_fragment>
}`}/>
  </mesh>
  {catalog&&<points geometry={catalog} frustumCulled={false} renderOrder={-1000}>
   <shaderMaterial toneMapped={false} transparent depthWrite={false} depthTest uniforms={uniforms}
    vertexShader={`uniform mat3 starRotation;uniform float pixelRatio;attribute float magnitude;attribute float temperature;varying float brightness;varying vec3 tint;
void main(){vec3 direction=mat3(viewMatrix)*starRotation*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w,p.w);
brightness=clamp(pow(10.,-.14*(magnitude-2.)),.015,1.);
tint=temperature<5800.?mix(vec3(1.,.57,.30),vec3(1.,.97,.91),clamp((temperature-2500.)/3300.,0.,1.)):mix(vec3(1.,.97,.91),vec3(.63,.77,1.),clamp((temperature-5800.)/10000.,0.,1.));
gl_PointSize=(1.15+pow(brightness,.7)*5.1)*pixelRatio;}`}
    fragmentShader={`uniform float visibility;uniform float photoBlend;varying float brightness;varying vec3 tint;
void main(){float r=length(gl_PointCoord-.5);float core=exp(-r*r*72.);float halo=exp(-r*r*13.)*.16*smoothstep(.4,.9,brightness);float alpha=(core+halo)*brightness*visibility*mix(.95,.64,photoBlend)*(1.-smoothstep(.4,.5,r));if(alpha<.002)discard;gl_FragDepth=1.;gl_FragColor=vec4(tint,alpha);
#include <colorspace_fragment>
}`}/>
  </points>}
 </>;
}
