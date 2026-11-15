import * as T from 'three';

// Shared dust/mineral response, with separate basalt and oxide palettes supplied
// by each instance. Screen filtering prevents distant grit from sparkling.
export function stoneMaterial(){
 const mat=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,metalness:0});
 mat.customProgramCacheKey=()=> 'weathered-stone-v1';
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vStone;\n'+shader.vertexShader.replace(
   '#include <begin_vertex>','#include <begin_vertex>\nvStone=position;');
  shader.fragmentShader='varying vec3 vStone;\n'+shader.fragmentShader.replace(
   '#include <color_fragment>',`#include <color_fragment>
 float stoneFootprint=max(length(dFdx(vStone)),length(dFdy(vStone)));
 float stoneGrain=fract(sin(dot(floor(vStone*95.),vec3(18.93,74.37,31.73)))*43758.54)-.5;
 float stonePores=fract(sin(dot(floor(vStone*29.),vec3(12.41,92.78,48.93)))*12542.19)-.5;
 float stoneSeam=exp(-pow(abs(dot(vStone,vec3(.73,.41,-.56))-.14)/.018,2.));
 float stoneDust=smoothstep(-.45,.55,vStone.y);
 diffuseColor.rgb*=1.+stoneDust*.045
  +stoneGrain*.17*(1.-smoothstep(.004,.024,stoneFootprint))
  +stonePores*.12*(1.-smoothstep(.018,.08,stoneFootprint))
  -stoneSeam*.14*(1.-smoothstep(.02,.10,stoneFootprint));`);
 };
 return mat;
}
