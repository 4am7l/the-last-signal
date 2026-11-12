import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {SUN_DIRECTION} from './solar';
// Angular disk in the same infinite sky as the stars, hidden by opaque bodies.
export function SunDisc(){
 const {gl,size}=useThree();const geometry=useMemo(()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(SUN_DIRECTION.toArray(),3));return g},[]);
 const uniforms=useMemo(()=>({resolutionY:{value:1}}),[]);
 useFrame(()=>{uniforms.resolutionY.value=size.height*gl.getPixelRatio()});
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <points geometry={geometry} frustumCulled={false} renderOrder={-900}><shaderMaterial transparent depthTest={false} depthWrite={false} uniforms={uniforms} vertexShader={`uniform float resolutionY;void main(){vec3 direction=mat3(viewMatrix)*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w*.99999,p.w);gl_PointSize=clamp(resolutionY*projectionMatrix[1][1]*.00465*6.,6.,180.);}`} fragmentShader={`void main(){float r=length(gl_PointCoord-.5);float disk=1.-smoothstep(.074,.084,r);float halo=exp(-r*19.)*.18;float a=max(disk,halo)*(1.-smoothstep(.4,.5,r));gl_FragColor=vec4(1.,.96,.86,a);}`}/></points>;
}
