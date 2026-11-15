import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {transformWithOxc} from 'vite';
import * as T from 'three';

const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const math=url(stripTypeScriptTypes(read('sceneMath.ts')));
const geology=url(stripTypeScriptTypes(read('marsGeology.ts')).replace("from './sceneMath'",`from '${math}'`));
const stone=url(stripTypeScriptTypes(read('stoneMaterial.ts')).replace("from 'three'",`from '${import.meta.resolve('three')}'`));
const hooks=url('export const useMemo=fn=>fn();export const useEffect=()=>{};');
async function component(name){
 let code=(await transformWithOxc(read(name),name,{jsx:{runtime:'automatic'}})).code;
 for(const [name,target] of Object.entries({'react':hooks,'three':import.meta.resolve('three'),'react/jsx-runtime':import.meta.resolve('react/jsx-runtime'),'./sceneMath':math,'./marsGeology':geology,'./stoneMaterial':stone})){
  code=code.replaceAll(`from '${name}'`,`from '${target}'`).replaceAll(`from "${name}"`,`from '${target}'`);
 }
 return import(url(code));
}

for(const [file,exportName] of [['ApolloSurfaceDetails.tsx','ApolloRocks'],['MarsSurfaceDetails.tsx','MarsRocks']]){
 test(`${exportName} carries supported rock detail into the visible distance`,async()=>{
  const module=await component(file);
  const ground=(x,z)=>Math.sin(x*.002)*5+Math.cos(z*.002)*3-(x*x+z*z)/(2*3389500);
  const group=module[exportName]({ground,unit:1,count:250,clearance:7,lat:4.5,lon:135.6,landingRadius:12,site:'insight'});
  const meshes=group.props.children.map(child=>child.props.object);
  let far=0,middle=0;
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
  for(const mesh of meshes){
   for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
    if(scale.lengthSq()===0)continue;
    const distance=Math.hypot(position.x,position.z);
    assert.ok(distance>7,'equipment footprint remains clear');
    if(distance>250&&Math.max(scale.x,scale.z)>6)middle++;
    if(distance>900&&Math.max(scale.x,scale.z)>6){
     far++;
     const vertices=mesh.geometry.getAttribute('position'),point=new T.Vector3();
     let bottom=Infinity;
     for(let k=0;k<vertices.count;k++)bottom=Math.min(bottom,point.fromBufferAttribute(vertices,k).applyMatrix4(matrix).y);
     assert.ok(bottom<ground(position.x,position.z),'distant outcrops are embedded, not floating');
    }
   }
   mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();
  }
  assert.ok(middle>=16,'visible middle-distance formations');
  assert.ok(far>=8,'large silhouettes remain visible beyond the nearby exhibit');
 });
}
