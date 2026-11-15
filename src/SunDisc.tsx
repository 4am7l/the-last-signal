import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as T from 'three';
import {SCENE_SUN_DIRECTION} from './solar';
export function SunDisc({angularRadius=.00465}:{angularRadius?:number}){
 const {gl,size}=useThree();const geometry=useMemo(()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(SCENE_SUN_DIRECTION.toArray(),3));return g},[]);
 const uniforms=useMemo(()=>({resolutionY:{value:1},angularRadius:{value:angularRadius}}),[]);
 useFrame(()=>{uniforms.angularRadius.value=angularRadius;uniforms.resolutionY.value=size.height*gl.getPixelRatio();geometry.attributes.position.setXYZ(0,SCENE_SUN_DIRECTION.x,SCENE_SUN_DIRECTION.y,SCENE_SUN_DIRECTION.z);geometry.attributes.position.needsUpdate=true});
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <points geometry={geometry} frustumCulled={false} renderOrder={-900}><shaderMaterial toneMapped={false} transparent depthTest depthWrite={false} uniforms={uniforms} vertexShader={`uniform float resolutionY;uniform float angularRadius;void main(){vec3 direction=mat3(viewMatrix)*position;vec4 p=projectionMatrix*vec4(direction,1.);gl_Position=vec4(p.xy,p.w,p.w);gl_PointSize=clamp(resolutionY*projectionMatrix[1][1]*angularRadius*6.,6.,180.);}`} fragmentShader={`void main(){gl_FragDepth=1.;float r=length(gl_PointCoord-.5);float disk=1.-smoothstep(.074,.084,r);float halo=exp(-r*19.)*.18;float a=max(disk,halo)*(1.-smoothstep(.4,.5,r));gl_FragColor=vec4(1.,.96,.86,a);}`}/></points>;
}
