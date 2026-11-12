import {useEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {OrbitControls,Html,Line} from '@react-three/drei';
import type {OrbitControls as Controls} from 'three-stdlib';
import {Planet} from './Planet';
import {RADII_KM,systemLayout} from './sceneMath';
export function SystemOverview({physical,focusPair,onWorld,reset}:{physical:boolean;focusPair:boolean;onWorld:(body:'moon'|'mars')=>void;reset:number}){
 const {camera,scene}=useThree(),controls=useRef<Controls>(null),layout=systemLayout(physical);
 useEffect(()=>{const span=physical?(focusPair?(layout.moon[0]-layout.earth[0])*1.2:layout.mars[0]):9000;camera.near=physical?10:.1;camera.far=physical?layout.mars[0]*10:50000;camera.position.set(span*.35,span*.3,span*.95);camera.updateProjectionMatrix();controls.current?.target.set(physical&&focusPair?(layout.earth[0]+layout.moon[0])/2:span*.25,0,0);controls.current?.update();scene.fog=null;return()=>{camera.near=.1;camera.far=30000;camera.updateProjectionMatrix()}},[physical,focusPair,reset,camera,scene]);
 return <><OrbitControls ref={controls} makeDefault enableDamping minDistance={700} maxDistance={physical?1e8:24000}/><ambientLight intensity={.07}/><directionalLight position={[200,300,500]} intensity={2.8}/>{(['earth','moon','mars'] as const).map(body=><group key={body}><Planet body={body} pos={layout[body]} r={RADII_KM[body]*layout.scale} click={body==='earth'?undefined:()=>onWorld(body)}/><Html position={[layout[body][0],RADII_KM[body]*layout.scale+150,0]} center><button className="worldLabel" style={{transform:physical&&!focusPair&&body==='moon'?'translateY(48px)':undefined}} onClick={()=>onWorld(body==='earth'?'moon':body)}>{body==='earth'?'الأرض':body==='moon'?'القمر':'المريخ'}{body!=='earth'?' ↗':''}</button></Html></group>)}<Line points={[layout.earth,layout.moon]} color="#48637d" lineWidth={1}/>{physical&&<Line points={[layout.moon,layout.mars]} color="#473e35" lineWidth={1}/>}</>;
}
