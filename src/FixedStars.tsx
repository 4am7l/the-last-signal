import {useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {starDirections} from './sceneMath';
// Directions at infinity: translation and dolly never change star positions/sizes.
export function FixedStars({marsSurface}:{marsSurface:boolean}){
 const {gl}=useThree();
 const geometry=useMemo(()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(starDirections(5000),3));return g},[]);
 const uniforms=useMemo(()=>({pixelRatio:{value:Math.min(gl.getPixelRatio(),1.5)},visibility:{value:1}}),[gl]);
 useFrame(({camera})=>{uniforms.visibility.value=marsSurface?T.MathUtils.smoothstep(camera.position.length(),.05,2):1});
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <points geometry={geometry} frustumCulled={false} renderOrder={-1000}><shaderMaterial transparent depthWrite={false} depthTest={false} uniforms={uniforms} vertexShader={`uniform float pixelRatio;varying float brightness;void main(){vec3 direction=mat3(viewMatrix)*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w*.999999,p.w);brightness=.35+.65*fract(sin(dot(position,vec3(127.1,311.7,74.7)))*43758.54);gl_PointSize=(1.+brightness*1.3)*pixelRatio;}`} fragmentShader={`uniform float visibility;varying float brightness;void main(){float r=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.12,.5,r))*brightness*visibility;gl_FragColor=vec4(vec3(.79,.85,1.),alpha);}`}/></points>;
}
