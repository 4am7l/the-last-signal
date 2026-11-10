import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const code=stripTypeScriptTypes(readFileSync(new URL('../src/lunarTerrain.ts',import.meta.url),'utf8'));
const {MOON_RADIUS_METRES,EARTH_RADIUS_METRES,METRES_TO_SCENE,MOON_RENDER_RADIUS,ringAngle,localRelief,craterHeight,craters}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(MOON_RADIUS_METRES*METRES_TO_SCENE,MOON_RENDER_RADIUS);
assert.ok(Math.abs(EARTH_RADIUS_METRES/MOON_RADIUS_METRES-3.667)<.001);
assert.ok(Math.abs(9.4*METRES_TO_SCENE/MOON_RENDER_RADIUS-9.4/MOON_RADIUS_METRES)<1e-15);
assert.equal(ringAngle(0),0);
assert.ok(Math.abs(ringAngle(480)-Math.PI)<1e-12);
for(let i=1;i<=480;i++)assert.ok(ringAngle(i)>ringAngle(i-1));
// Global silhouette no longer has fourteen-degree gaps between the far rings.
for(let i=162;i<=480;i++)assert.ok(ringAngle(i)-ringAngle(i-1)<Math.PI/180);
assert.equal(localRelief(0,0),0);
assert.equal(localRelief(8,0),0);
assert.equal(localRelief(1700,0),0);
assert.ok(craterHeight(0,20)<0);
assert.ok(craterHeight(20,20)>0);
assert.equal(craterHeight(30,20),0);
for(const c of craters){assert.ok(Math.hypot(c.x,c.z)-1.5*c.radius>9);assert.ok(Number.isFinite(localRelief(c.x,c.z)));}
for(let i=0;i<1000;i++){const x=Math.sin(i)*1600,z=Math.cos(i*.7)*1600;assert.ok(Math.abs(localRelief(x,z))<20);}
console.log('Passed: physical scale, equipment ratio, complete globe rings, crater bowls/rims, clear landing pad, and bounded local relief.');
