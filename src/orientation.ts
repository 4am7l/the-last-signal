import * as T from 'three';
import {julianDay,type Body} from './science';
// Mean IAU orientation, pck00010 / IAU 2009; no nutation/libration or polar motion.
// Not a substitute for mission SPICE kernels.
export function bodyOrientation(body:Body,epoch:number){
 const d=julianDay(epoch)-2451545,t=d/36525,rad=Math.PI/180;
 const p=body==='earth'?[-.641*t,90-.557*t,190.147+360.9856235*d]:
 body==='moon'?[269.9949+.0031*t,66.5392+.013*t,38.3213+13.17635815*d]:
 [317.68143-.1061*t,52.88650-.0609*t,176.630+350.89198226*d];
 const [ra,dec,w]=p.map(v=>v*rad);
 const pole=new T.Vector3(Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec));
 const node=new T.Vector3(-Math.sin(ra),Math.cos(ra),0);
 const cross=new T.Vector3().crossVectors(pole,node);
 const prime=node.clone().multiplyScalar(Math.cos(w)).addScaledVector(cross,Math.sin(w));
 const east=node.clone().multiplyScalar(-Math.sin(w)).addScaledVector(cross,Math.cos(w));
 const convert=(v:T.Vector3)=>{v.applyAxisAngle(new T.Vector3(1,0,0),-23.43928*rad);return new T.Vector3(v.x,v.z,-v.y)};
 return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(convert(prime),convert(pole),convert(east).negate()));
}
