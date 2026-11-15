import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {SCENE_SUN_DIRECTION} from './solar';

export function MarsAtmosphere({r}:{r:number}){
 const mesh=useRef<T.Mesh>(null);
 const scale=useMemo(()=>new T.Vector3(),[]);
 const uniforms=useMemo(()=>({
  planetCenter:{value:new T.Vector3()},planetRadius:{value:r},
  sunDirection:{value:SCENE_SUN_DIRECTION},
 }),[r]);
 useFrame(()=>{
  if(!mesh.current)return;
  mesh.current.getWorldPosition(uniforms.planetCenter.value);
  mesh.current.getWorldScale(scale);
  uniforms.planetRadius.value=r*Math.max(scale.x,scale.y,scale.z);
 });
 return <mesh ref={mesh} renderOrder={2} frustumCulled={false}>
  <sphereGeometry args={[r*1.018,64,40]}/>
  <shaderMaterial transparent depthWrite={false} side={T.BackSide} uniforms={uniforms}
   vertexShader={`
    #include <common>
    #include <logdepthbuf_pars_vertex>
    varying vec3 atmosphereWorld;
    void main(){
     vec4 world=modelMatrix*vec4(position,1.);
     atmosphereWorld=world.xyz;
     gl_Position=projectionMatrix*viewMatrix*world;
     #include <logdepthbuf_vertex>
    }`}
   fragmentShader={`
    #include <common>
    #include <logdepthbuf_pars_fragment>
    varying vec3 atmosphereWorld;
    uniform vec3 planetCenter,sunDirection;
    uniform float planetRadius;
    vec2 sphereRange(vec3 o,vec3 d,float radius){
     float b=dot(o,d),disc=b*b-dot(o,o)+radius*radius;
     if(disc<0.)return vec2(1.e6,-1.e6);
     float root=sqrt(disc);return vec2(-b-root,-b+root);
    }
    float density(vec3 p){return exp(-max(0.,length(p)-1.)/.0032);}
    void main(){
     #include <logdepthbuf_fragment>
     vec3 origin=(cameraPosition-planetCenter)/planetRadius;


     origin*=max(1.,1.0000002/max(length(origin),.0001));
     vec3 ray=normalize(atmosphereWorld-cameraPosition),sun=normalize(sunDirection);
     vec2 air=sphereRange(origin,ray,1.018);
     float begin=max(0.,air.x),end=air.y;
     vec2 ground=sphereRange(origin,ray,1.);
     if(ground.x>begin)end=min(end,ground.x);
     if(end<=begin)discard;
     float stepSize=(end-begin)/10.,viewDepth=0.;
     vec3 radiance=vec3(0.);
     vec3 extinction=vec3(45.,52.,68.);
     float mu=dot(ray,sun),g=.62;
     float dustPhase=(1.-g*g)/pow(max(.08,1.+g*g-2.*g*mu),1.5);
     float phase=.24*(1.+mu*mu)+.16*dustPhase;
     for(int i=0;i<10;i++){
      vec3 p=origin+ray*(begin+(float(i)+.5)*stepSize);
      float sampleDepth=density(p)*stepSize;
      vec2 shadow=sphereRange(p,sun,1.);
      if(shadow.y<0.||shadow.x<0.){
       float sunEnd=max(0.,sphereRange(p,sun,1.018).y),sunDepth=0.;
       for(int j=0;j<3;j++)sunDepth+=density(p+sun*((float(j)+.5)*sunEnd/3.))*sunEnd/3.;
       vec3 transmission=exp(-extinction*(viewDepth+sampleDepth*.5+sunDepth));
       radiance+=transmission*sampleDepth*vec3(53.,39.,27.)*phase;
      }
      viewDepth+=sampleDepth;
     }
     float alpha=clamp(1.-exp(-viewDepth*54.),0.,.985);
     if(alpha<.0001)discard;

     float aureole=pow(max(0.,mu),24.);
     radiance=mix(radiance,radiance*vec3(.72,.94,1.32),aureole*.42);
     gl_FragColor=vec4(radiance/max(alpha,.0001),alpha);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}/>
 </mesh>;
}
