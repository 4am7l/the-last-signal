import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';

test('bundled bright-star catalogue works offline and packs finite unit directions',async()=>{
 const data=JSON.parse(readFileSync(new URL('../public/stars-hyg-bright.json',import.meta.url),'utf8'));
 assert.equal(data.stars.length,6000);
 assert.equal(data.license,'CC BY-SA 4.0');
 let last=-Infinity;
 for(const [ra,dec,mag,ci] of data.stars){
  assert.ok([ra,dec,mag,ci].every(Number.isFinite));
  assert.ok(ra>=0&&ra<=2*Math.PI&&Math.abs(dec)<=Math.PI/2);
  assert.ok(mag>=last&&mag<6.2,'only bright stars, sorted for quality limits');last=mag;
 }
 let packed;
 const context={self:{postMessage:value=>{packed=value;}},fetch:async path=>{
  assert.equal(path,'/stars-hyg-bright.json','no external network required');
  return {ok:true,json:async()=>data};
 }};
 const source=stripTypeScriptTypes(readFileSync(new URL('../src/starCatalog.worker.ts',import.meta.url),'utf8')).replace('export {};','');
 vm.runInNewContext(source,context);
 await context.self.onmessage();
 assert.equal(packed.count,6000);assert.equal(packed.error,undefined);
 for(let i=0;i<packed.count;i++){
  assert.ok(Math.abs(Math.hypot(...packed.position.slice(i*3,i*3+3))-1)<1e-6);
  assert.equal(packed.magnitude[i],Math.fround(data.stars[i][2]));
  assert.ok(packed.temperature[i]>2000&&packed.temperature[i]<25000);
 }
});
