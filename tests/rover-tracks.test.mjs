import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const math=stripTypeScriptTypes(readFileSync(new URL('../src/sceneMath.ts',import.meta.url),'utf8'));
const mathUrl='data:text/javascript;base64,'+Buffer.from(math).toString('base64');
const source=stripTypeScriptTypes(readFileSync(new URL('../src/marsGeology.ts',import.meta.url),'utf8'))
 .replace("from './sceneMath'",`from '${mathUrl}'`);
const {marsRoverRoadPoint:point,marsRoverRoadYaw:yaw,marsRoverRoadClearance:clear}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const site of ['spirit','opportunity']){
 const heading=yaw(site);
 // The GLB's local wheelbase axis is Z. The rendered model rotates it by
 // PI/2 + heading, giving this direction in the site's XZ plane.
 const forward={x:Math.cos(heading),z:-Math.sin(heading)};
 for(const side of [-1,1]){
  const a=point(0,side,site),b=point(1e-6,side,site);
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  assert.ok(Math.abs(dx*forward.z-dz*forward.x)/length<1e-6,'rear tracks parallel to wheelbase');
  for(let i=0;i<=120;i++){
   const p=point(i/120,side,site);
   assert.ok(clear(p.x,p.z,site,.1),'both lanes excluded from boulder placement');
   const other=point(i/120,-side,site);
   assert.ok(Math.abs(Math.hypot(p.x-other.x,p.z-other.z)-1.44)<1e-12,'constant wheel gauge');
  }
 }
}
assert.notEqual(yaw('spirit'),yaw('opportunity'));
assert.equal(clear(0,0,'insight',1),false);
console.log('Passed: both rover wheelbase headings, paired track gauge and boulder clearance.');
