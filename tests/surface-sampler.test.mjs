import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/surfaceSampler.ts',import.meta.url),'utf8'));
const {radialGroundSampler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('ground contacts match rendered triangles including the seam and pole',()=>{
 const sectors=32,radii=[0,1,3,8,20],positions=[];
 for(const radius of radii)for(let i=0;i<=sectors;i++){
  const angle=i/sectors*Math.PI*2,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  positions.push(x,Math.sin(x)*3+Math.cos(z)*2,z);
 }
 const ground=radialGroundSampler(positions,radii,sectors,1,()=>-999);
 const columns=sectors+1;
 for(let row=0;row<radii.length-1;row++)for(let column=0;column<sectors;column++){
  const k=row*columns+column;
  for(const indices of [[k,k+1,k+columns],[k+1,k+columns+1,k+columns]]){
   const points=indices.map(i=>positions.slice(i*3,i*3+3));
   // Arbitrary barycentric interior point, including the wraparound sector.
   const weights=[.23,.34,.43],expected=[0,0,0];
   points.forEach((p,i)=>p.forEach((v,axis)=>expected[axis]+=v*weights[i]));
   assert.ok(Math.abs(ground(expected[0],expected[2])-expected[1])<1e-8);
  }
 }
 assert.equal(ground(0,0),positions[1]);
 assert.equal(ground(21,0),-999,'analytic fallback outside the local mesh');
 const scaled=radialGroundSampler(positions,radii,sectors,.001,()=>-999);
 assert.equal(scaled(1000,0),ground(1,0),'metre input and render-unit output');
});
