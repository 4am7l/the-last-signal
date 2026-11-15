import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const load=name=>stripTypeScriptTypes(readFileSync(new URL(`../src/${name}.ts`,import.meta.url),'utf8'));
const mathUrl=url(load('sceneMath'));
const {fissureMask}=await import(mathUrl);
const {createMarsRelief,marsCraterField,marsLandingRadius}=await import(url(load('marsGeology').replace("from './sceneMath'",`from '${mathUrl}'`)));

// Real geometry grooves must stay bounded and outside equipment footprints.
for(let x=-10;x<=10;x++)for(let z=-10;z<=10;z++)assert.ok(fissureMask(x,z)<1e-20);
assert.equal(fissureMask(500,500),0);
for(let a=-70;a<=155;a+=3){
 const across=46+7*Math.sin(a*.031)+2*Math.sin(a*.087);
 const norm=.83**2+.56**2;
 const x=(a*.83-across*.56)/norm,z=(a*.56+across*.83)/norm;
 assert.ok(fissureMask(x,z)>.999,'continuous trunk in the heightfield');
 const delta=Math.abs(fissureMask(x+.005,z)-fissureMask(x-.005,z));
 assert.ok(delta<.03,'continuous groove edges');
}
for(const [site,lat,lon] of [['spirit',-14.57,175.47],['opportunity',-1.95,354.47],['insight',4.5,135.6],['ingenuity',18.44,77.45]]){
 const pad=marsLandingRadius(site,5),field=marsCraterField(lat,lon,pad);
 assert.deepEqual(field,marsCraterField(lat,lon,pad),'site layout is reproducible');
 assert.ok(field.some(c=>Math.hypot(c.x,c.z)<200),'craters visible within exploring distance');
 for(const c of field)assert.ok(Math.hypot(c.x,c.z)-c.radius*1.55>pad,'impact bowls clear equipment');
 const ground=createMarsRelief(lat,lon,pad,site);
 assert.equal(ground(0,0),0);
 for(let x=-3;x<=3;x++)assert.equal(ground(x,0),0,'landing gear contact remains level');
 for(let i=0;i<700;i++){
  const x=Math.sin(i*1.7)*2500,z=Math.cos(i*.93)*2500;
  assert.ok(Number.isFinite(ground(x,z)));
  assert.ok(Math.abs(ground(x+.05,z)-ground(x-.05,z))<2,'no discontinuous terrain walls');
 }
 assert.equal(ground(14000,0),0,'local geology blends back into the globe');
}
console.log('Passed: fissure continuity, clear equipment footprints, nearby seeded craters, and continuous terrain at every Mars site.');
