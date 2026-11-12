import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../src/sceneMath.ts',import.meta.url),'utf8'));
const {RADII_KM,EARTH_MOON_KM,EXAMPLE_EARTH_MARS_KM,systemLayout,mountains,marsRelief,noise3,starDirections}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
for(const actual of [false,true]){
 const layout=systemLayout(actual),em=distance(layout.earth,layout.moon),mars=distance(layout.earth,layout.mars);
 assert.ok(em<mars/5,'Moon must belong to the Earth group, not to Mars');
 assert.ok(em>(RADII_KM.earth+RADII_KM.moon)*layout.scale,'bodies must not intersect');
 if(actual){assert.ok(Math.abs(em/layout.scale-EARTH_MOON_KM)<1e-8);assert.ok(Math.abs(mars/layout.scale-EXAMPLE_EARTH_MARS_KM)<1e-6);}
}
for(const body of ['moon','mars']){
 assert.equal(mountains(0,0,body),0);assert.equal(mountains(50,0,body),0);assert.equal(mountains(25000,0,body),0);
 let tallest=0;for(let x=-16000;x<=16000;x+=400)for(let z=-16000;z<=16000;z+=400){const h=mountains(x,z,body);assert.ok(Number.isFinite(h)&&h>=0);tallest=Math.max(tallest,h)}
 assert.ok(tallest>300&&tallest<2000,'mountain relief must be visible but not absurdly oversized');
}
for(let i=0;i<300;i++){
 const x=Math.sin(i),y=Math.cos(i*.3),z=Math.sin(i*.7),h=marsRelief(x,y,z);
 assert.ok(Number.isFinite(h)&&Math.abs(h)<3231);
 assert.ok(Math.abs(h-marsRelief(x+1e-7,y,z))<.1,'continuous terrain, no random per-frame changes');
 assert.ok(Math.abs(noise3(x,y,z))<=1);
}
const stars=starDirections(5000);assert.deepEqual(stars,starDirections(5000));
let north=0;for(let i=0;i<stars.length;i+=3){assert.ok(Math.abs(Math.hypot(stars[i],stars[i+1],stars[i+2])-1)<1e-6);if(stars[i+1]>0)north++}assert.equal(north,2500);
console.log('Passed: Earth–Moon grouping, non-overlap, physical distances, local mountains, Mars continuity, and stable all-sky star directions.');
