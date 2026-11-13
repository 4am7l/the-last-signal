import type {PointerEvent as ReactPointerEvent} from 'react';
import {configure,useSimulation} from './simulation';
import type {Mode} from './Space';
import type {CameraCommand} from './CameraCommands';

type Direction=CameraCommand['kind'];
type Props={
 mode:Mode;
 panelOpen:boolean;
 onCamera:(direction:Direction)=>void;
 onReset:()=>void;
 onFocus:()=>void;
 onTogglePanel:()=>void;
};
function movementSignal(code:string,pressed:boolean){
 window.dispatchEvent(new CustomEvent('mobile-navigation',{detail:{code,pressed}}));
}
function MoveButton({code,label,children}:{code:string;label:string;children:string}){
 const start=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
  movementSignal(code,true);
 };
 const stop=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  event.preventDefault();movementSignal(code,false);
 };
 return <button type="button" className="touchMove" aria-label={label}
  onPointerDown={start} onPointerUp={stop} onPointerCancel={stop}
  onLostPointerCapture={()=>movementSignal(code,false)} onContextMenu={e=>e.preventDefault()}>{children}</button>;
}
export function MobileControls({mode,panelOpen,onCamera,onReset,onFocus,onTogglePanel}:Props){
 const settings=useSimulation();
 const walkable=mode==='model'||mode==='location';
 const moving=walkable&&settings.navigation!=='orbit';
 return <div className={'mobileControls'+(moving?' is-moving':'')} aria-label="التحكم باللمس">
  <div className="mobileControlModes" role="group" aria-label="وضع الملاحة">
   <button className={settings.navigation==='orbit'?'selected':''} onClick={()=>configure({navigation:'orbit'})}>تدوير</button>
   {walkable&&<><button className={settings.navigation==='walk'?'selected':''} onClick={()=>configure({navigation:'walk'})}>مشي</button>
   <button className={settings.navigation==='drone'?'selected':''} onClick={()=>configure({navigation:'drone'})}>طيران</button></>}
   {(mode==='model'||mode==='location'||mode==='story')&&<button className="mobileDetails" onClick={onTogglePanel}>{panelOpen?'إخفاء التفاصيل':'تفاصيل المهمة'}</button>}
  </div>
  <div className="mobileControlLayout">
   <div className="mobileDpad" role="group" aria-label={moving?'اتجاه الحركة':'تدوير الكاميرا'}>
    {moving?<><span/><MoveButton code="KeyW" label="تقدم للأمام">↑</MoveButton><span/>
     <MoveButton code="KeyA" label="تحرك يسارًا">←</MoveButton><span className="touchPadCenter">●</span><MoveButton code="KeyD" label="تحرك يمينًا">→</MoveButton>
     <span/><MoveButton code="KeyS" label="تحرك للخلف">↓</MoveButton><span/></>:<>
     <span/><button aria-label="ارفع الكاميرا" onClick={()=>onCamera('up')}>↑</button><span/>
     <button aria-label="دوّر الكاميرا يسارًا" onClick={()=>onCamera('left')}>←</button><span className="touchPadCenter">●</span><button aria-label="دوّر الكاميرا يمينًا" onClick={()=>onCamera('right')}>→</button>
     <span/><button aria-label="اخفض الكاميرا" onClick={()=>onCamera('down')}>↓</button><span/>
    </>}
   </div>
   <div className="mobileZoom" role="group" aria-label="التقريب وخيارات الكاميرا">
    {moving?<><MoveButton code={settings.navigation==='walk'?'Space':'KeyE'} label={settings.navigation==='walk'?'اقفز':'ارتفع'}>↑ ارتفاع</MoveButton>
      {settings.navigation==='drone'&&<MoveButton code="KeyQ" label="انخفاض">↓ انخفاض</MoveButton>}
      <span className="mobileTouchHint">اسحب على المشهد لتغيير اتجاه النظر</span></>:<>
      <button className="mobileZoomMain" aria-label="تقريب المشهد" onClick={()=>onCamera('in')}>＋ <small>تقريب</small></button>
      <button className="mobileZoomMain" aria-label="إبعاد المشهد" onClick={()=>onCamera('out')}>− <small>إبعاد</small></button>
      <span className="mobileTouchHint">إصبع للتدوير · إصبعان للتقريب</span></>}
    <div className="mobileExtraActions">
     <button onClick={onReset}>⟳ <span>إعادة</span></button>
     {!moving&&<button onClick={()=>onCamera('stop')}>■ <span>إيقاف</span></button>}
     {!moving&&mode!=='overview'&&mode!=='story'&&<button onClick={onFocus}>◎ <span>المعدّة</span></button>}
    </div>
   </div>
  </div>
 </div>;
}
