import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as THREE from 'three';
// Exercise the actual exported source function without mounting a WebGL canvas.
const source=readFileSync(new URL('../src/Planet.tsx',import.meta.url),'utf8');
const fn=source.match(/export function point\([^\n]+/)[0].replace('export ','');
const js=stripTypeScriptTypes(fn);
const point=new Function('T',js+';return point;')(THREE);
const close=(v,w)=>assert.ok(v.distanceTo(w)<1e-9);
close(point(0,0,1),new THREE.Vector3(1,0,0));
close(point(0,90,1),new THREE.Vector3(0,0,-1));
close(point(90,0,1),new THREE.Vector3(0,1,0));
close(point(0,360,1),point(0,0,1));
for(const [lat,lon] of [[-1.9462,354.4734],[-14.5692,175.4729],[4.502,135.623],[18.4447,77.4508],[.674,23.473]]){
 const normal=point(lat,lon,1),q=new THREE.Quaternion().setFromUnitVectors(normal,new THREE.Vector3(0,1,0));
 close(point(lat,lon,300).applyQuaternion(q).add(new THREE.Vector3(0,-300,0)),new THREE.Vector3());
 // SphereGeometry UV convention, center longitude zero (phi = pi).
 const u=((lon/360+.5)%1),phi=u*Math.PI*2,theta=(90-lat)*Math.PI/180;
 close(normal,new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)));
}
console.log('Passed: cardinal directions, seam, five mission anchors, and equirectangular UV alignment.');
