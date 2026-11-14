import {useEffect,useState,useMemo,useSyncExternalStore} from 'react';
import {approximateEphemeris,validEphemeris,type Ephemeris} from './science';
export const PRESETS={
 low:{dpr:1,stars:10000,shadows:512,rings:240,sectors:128,rocks:250},
 medium:{dpr:1.25,stars:30000,shadows:1024,rings:320,sectors:192,rocks:600},
 high:{dpr:1.5,stars:80000,shadows:2048,rings:400,sectors:256,rocks:1000},
 ultra:{dpr:2,stars:100000,shadows:4096,rings:480,sectors:320,rocks:1200}
} as const;
export type Settings={date:string;quality:keyof typeof PRESETS;inspection:boolean;exposure:number;navigation:'orbit'|'walk'|'drone';speed:number;starCount:number};
let state:Settings={date:new Date().toISOString().slice(0,10),quality:'ultra',inspection:true,exposure:1.05,navigation:'orbit',speed:1.5,starCount:100000};
const listeners=new Set<()=>void>();
export function configure(patch:Partial<Settings>){state={...state,...patch};listeners.forEach(f=>f());}
export function useSimulation(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>state);}
const cache=new Map<string,Ephemeris>();
export function useEphemeris(date:string){
 const epoch=Date.parse(date+'T12:00:00Z');
 const [resolved,setResolved]=useState<Ephemeris|null>(null);
 useEffect(()=>{
  let alive=true;const controller=new AbortController();
  if(cache.has(date)){setResolved(cache.get(date)!);return;}
  fetch('/api/ephemeris?date='+encodeURIComponent(date),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
   if(alive&&validEphemeris(data,epoch)){cache.set(date,data);setResolved(data);}
  }).catch(()=>{});
  return()=>{alive=false;controller.abort()};
 },[date,epoch]);
 const fallback=useMemo(()=>approximateEphemeris(epoch),[epoch]);
 return resolved?.epoch===epoch?resolved:fallback;
}
export type Telemetry={fps:number;frameMs:number;calls:number;triangles:number;textures:number;altitude:number;stars:string;terrain:string};
export function SimulationPanel(){
 const settings=useSimulation(),ephemeris=useEphemeris(settings.date);
 return <details className="simulationPanel"><summary>المحاكاة والإضاءة</summary>
 <label>التاريخ الفلكي UTC<input type="date" min="1800-01-01" max="2050-12-31" value={settings.date} onChange={e=>{const v=e.target.value;if(v>='1800-01-01'&&v<='2050-12-31')configure({date:v})}}/></label>
 <small>{ephemeris.source==='JPL Horizons'?'المواقع: JPL Horizons':'المواقع تقريبية — خدمة JPL غير متصلة'}</small>
 <label><input type="checkbox" checked={settings.inspection} onChange={e=>configure({inspection:e.target.checked})}/>إضاءة معاينة صناعية</label>
 <label>التعريض<input type="range" min=".2" max="2.5" step=".05" value={settings.exposure} onChange={e=>configure({exposure:Number(e.target.value)})}/></label>
 <label>الملاحة<select value={settings.navigation} onChange={e=>configure({navigation:e.target.value as Settings['navigation']})}><option value="orbit">مدار / معاينة</option><option value="walk">مشي قرب موقع المعدة</option><option value="drone">طيران حر قرب الموقع</option></select></label>
 <label>السرعة (م/ث)<input type="range" min=".5" max="12" step=".5" value={settings.speed} onChange={e=>configure({speed:Number(e.target.value)})}/><output>{settings.speed}</output></label>
 <small>الكمبيوتر: انقر المشهد لتفعيل الماوس، WASD للحركة، Shift للإسراع، Space للقفز، E/Q لارتفاع الدرون. الجوال: استخدم أزرار الحركة واسحب بإصبع واحد لتوجيه الكاميرا.</small>
 <small>المشي محصور ضمن 200 م من الموقع. تفاصيل الأرض الصغيرة إعادة بناء بصرية.</small>
 <a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noreferrer">HYG · David Nash · CC BY-SA 4.0</a>
 </details>;
}
