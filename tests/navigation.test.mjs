import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/sceneMath.ts',import.meta.url),'utf8'));
const {surfaceDetail,cameraTuning,zoomDistance}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
for(const body of ['moon','mars']){
 assert.equal(surfaceDetail(0,0,body),0);
 assert.equal(surfaceDetail(4100,0,body),0);
 for(let x=-3000;x<3000;x+=41){
  const h=surfaceDetail(x,123,body);
  assert.ok(Number.isFinite(h)&&Math.abs(h)<5);
  assert.ok(Math.abs(h-surfaceDetail(x+.00001,123,body))<.001);
 }
}
assert.notEqual(surfaceDetail(120,70,'moon'),surfaceDetail(120,70,'mars'));
assert.ok(cameraTuning(10,300,false).rotate<cameraTuning(300,300,false).rotate);
for(const min of [.0002,305]){
 let d=min*3;
 for(let i=0;i<100;i++){const next=zoomDistance(d,min,14000,true);assert.ok(next<d&&next>=min);d=next;}
 assert.ok(zoomDistance(d,min,14000,false)>d,'can reverse at minimum clearance');
}
console.log('Passed: terrain continuity, distinct geology, altitude sensitivity and zoom limits.');
