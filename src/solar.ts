import * as T from 'three';
// One distant sun for every material, atmosphere and shadow ray.
export const SUN_DIRECTION=new T.Vector3(-.72,.44,.54).normalize();
export type Occluder={position:[number,number,number];radius:number};
export function eclipseVisibility(point:T.Vector3,occluder:Occluder){
 const delta=new T.Vector3(...occluder.position).sub(point),along=delta.dot(SUN_DIRECTION);
 if(along<=0)return 1;
 const distance=delta.addScaledVector(SUN_DIRECTION,-along).length(),width=Math.max(occluder.radius*.02,.0001);
 return T.MathUtils.smoothstep(distance,occluder.radius-width,occluder.radius+width);
}
export function solarShader(shader:T.WebGLProgramParametersWithUniforms,occluders:Occluder[]){
 shader.uniforms.sunDirection={value:SUN_DIRECTION};
 shader.uniforms.solarOccluders={value:Array.from({length:2},(_,i)=>{const o=occluders[i];return o?new T.Vector4(...o.position,o.radius):new T.Vector4(0,0,0,0)})};
 shader.vertexShader='varying vec3 solarWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nsolarWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
 shader.fragmentShader='varying vec3 solarWorld;\nuniform vec3 sunDirection;\nuniform vec4 solarOccluders[2];\n'+shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
float sunlightVisibility=1.;
for(int i=0;i<2;i++){
 vec3 delta=solarOccluders[i].xyz-solarWorld;float radius=solarOccluders[i].w;float along=dot(delta,sunDirection);
 if(radius>0.&&along>0.){float perpendicular=length(delta-sunDirection*along);float penumbra=max(radius*.02,.0001);sunlightVisibility*=smoothstep(radius-penumbra,radius+penumbra,perpendicular);}
}
reflectedLight.directDiffuse*=sunlightVisibility;
reflectedLight.directSpecular*=sunlightVisibility;
`);
}
