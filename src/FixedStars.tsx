import {useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {starDirections} from './sceneMath';

// Sky directions ignore translation. Explicit fragment depth matches the
// far plane of the logarithmic depth buffer used by opaque planets.
export function FixedStars({marsSurface}:{marsSurface:boolean}){
 const {gl}=useThree();
 const geometry=useMemo(()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(starDirections(80000),3));return g},[]);
 const uniforms=useMemo(()=>({skyRotation:{value:new T.Matrix3()},pixelRatio:{value:1},visibility:{value:1},panorama:{value:null as T.Texture|null},hasPanorama:{value:0}}),[]);
 useEffect(()=>{
  let alive=true;let loaded:T.Texture|undefined;
  // Optional photograph: a procedural Milky Way remains if the CDN fails.
  new T.TextureLoader().load('https://cdn.eso.org/images/large/eso0932a.jpg',texture=>{
   if(!alive){texture.dispose();return;}loaded=texture;texture.colorSpace=T.SRGBColorSpace;texture.wrapS=T.RepeatWrapping;
   uniforms.panorama.value=texture;uniforms.hasPanorama.value=1;
  },undefined,()=>{});
  return()=>{alive=false;loaded?.dispose();uniforms.panorama.value=null;uniforms.hasPanorama.value=0};
 },[uniforms]);
 useFrame(({scene},dt)=>{
  const q=scene.userData.skyRotation as T.Quaternion|undefined;uniforms.skyRotation.value.setFromMatrix4(new T.Matrix4().makeRotationFromQuaternion(q??new T.Quaternion()));
  uniforms.pixelRatio.value=Math.min(gl.getPixelRatio(),2);
  const target=Number(scene.userData.skyVisibility??(marsSurface&&scene.fog?0:1));
  uniforms.visibility.value=T.MathUtils.damp(uniforms.visibility.value,target,3,Math.min(dt,.05));
 });
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <>
  <mesh frustumCulled={false} renderOrder={-1100}>
   <sphereGeometry args={[1,64,32]}/>
   <shaderMaterial side={T.BackSide} toneMapped={false} transparent depthWrite={false} depthTest uniforms={uniforms}
    vertexShader={`uniform mat3 skyRotation;varying vec3 skyDirection;void main(){skyDirection=position;vec3 d=mat3(viewMatrix)*skyRotation*position;vec4 p=projectionMatrix*vec4(d,1.);gl_Position=vec4(p.xy,p.w,p.w);}`}
    fragmentShader={`uniform sampler2D panorama;uniform float hasPanorama;uniform float visibility;varying vec3 skyDirection;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){vec3 d=normalize(skyDirection);float latitude=dot(d,normalize(vec3(.25,.83,.5)));float band=exp(-latitude*latitude*65.);float wisps=noise(d*12.)*.55+noise(d*35.)*.3+noise(d*90.)*.15;float lane=smoothstep(.36,.66,wisps);// Neutral ivory starlight with warm dust extinction, not a blue nebula.
float dustLane=(1.-smoothstep(.38,.62,wisps))*exp(-latitude*latitude*190.);
vec3 starlight=mix(vec3(.21,.205,.19),vec3(.26,.225,.175),smoothstep(.45,.8,wisps));
vec3 transmission=exp(-dustLane*vec3(1.6,2.1,2.8));
vec3 color=starlight*band*(.2+.8*lane)*transmission;
vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
if(hasPanorama>.5)color=texture2D(panorama,uv).rgb*.72;
gl_FragDepth=1.;gl_FragColor=vec4(color,visibility);
#include <colorspace_fragment>
}`}/>
  </mesh>
  <points geometry={geometry} frustumCulled={false} renderOrder={-1000}>
   <shaderMaterial transparent depthWrite={false} depthTest uniforms={uniforms}
    vertexShader={`uniform mat3 skyRotation;uniform float pixelRatio;varying float brightness;varying vec3 tint;void main(){vec3 direction=mat3(viewMatrix)*skyRotation*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w,p.w);float seed=fract(sin(dot(position,vec3(127.1,311.7,74.7)))*43758.54);brightness=.11+.89*pow(seed,6.);tint=mix(vec3(1.,.84,.67),vec3(.76,.85,1.),fract(seed*43.));gl_PointSize=(.85+brightness*1.65)*pixelRatio;}`}
    fragmentShader={`uniform float visibility;uniform float hasPanorama;varying float brightness;varying vec3 tint;void main(){float r=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.08,.5,r))*brightness*visibility*mix(1.,.75,hasPanorama);if(alpha<.004)discard;gl_FragDepth=1.;gl_FragColor=vec4(tint,alpha);}`}/>
  </points>
 </>;
}
