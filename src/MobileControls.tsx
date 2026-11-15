import { useExplorerText } from "./explorer-language";
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
 const t = useExplorerText();
 const settings=useSimulation();
 const walkable=mode==='model'||mode==='location';
 const moving=walkable&&settings.navigation!=='orbit';
 return <div className={'mobileControls'+(moving?' is-moving':'')} aria-label={t(t("التحكم باللمس", "Touch controls"), "Touch controls")}>
  <div className="mobileControlModes" role="group" aria-label={t(t("وضع الملاحة", "Navigation mode"), "Navigation mode")}>
   <button className={settings.navigation==='orbit'?'selected':''} onClick={()=>configure({navigation:'orbit'})}>{t(t("تدوير", "Orbit"), "Orbit")}</button>
   {walkable&&<><button className={settings.navigation==='walk'?'selected':''} onClick={()=>configure({navigation:'walk'})}>{t(t("مشي", "Walk"), "Walk")}</button>
   <button className={settings.navigation==='drone'?'selected':''} onClick={()=>configure({navigation:'drone'})}>{t(t("طيران", "Fly"), "Fly")}</button></>}
   {(mode==='model'||mode==='location'||mode==='story')&&<button className="mobileDetails" onClick={onTogglePanel}>{panelOpen?t("إخفاء التفاصيل", "Hide details"):t("تفاصيل المهمة", "Mission details")}</button>}
  </div>
  <div className="mobileControlLayout">
   <div className="mobileDpad" role="group" aria-label={moving?t("اتجاه الحركة", "Movement direction"):t("تدوير الكاميرا", "Rotate camera")}>
    {moving?<><span/><MoveButton code="KeyW" label={t("تقدم للأمام", "Move forward")}>↑</MoveButton><span/>
     <MoveButton code="KeyA" label={t("تحرك يسارًا", "Move left")}>←</MoveButton><span className="touchPadCenter">●</span><MoveButton code="KeyD" label={t("تحرك يمينًا", "Move right")}>→</MoveButton>
     <span/><MoveButton code="KeyS" label={t("تحرك للخلف", "Move backward")}>↓</MoveButton><span/></>:<>
     <span/><button aria-label={t(t("ارفع الكاميرا", "Tilt camera up"), "Tilt camera up")} onClick={()=>onCamera('up')}>↑</button><span/>
     <button aria-label={t(t("دوّر الكاميرا يسارًا", "Rotate camera left"), "Rotate camera left")} onClick={()=>onCamera('left')}>←</button><span className="touchPadCenter">●</span><button aria-label={t(t("دوّر الكاميرا يمينًا", "Rotate camera right"), "Rotate camera right")} onClick={()=>onCamera('right')}>→</button>
     <span/><button aria-label={t(t("اخفض الكاميرا", "Tilt camera down"), "Tilt camera down")} onClick={()=>onCamera('down')}>↓</button><span/>
    </>}
   </div>
   <div className="mobileZoom" role="group" aria-label={t(t("التقريب وخيارات الكاميرا", "Zoom and camera options"), "Zoom and camera options")}>
    {moving?<><MoveButton code={settings.navigation==='walk'?'Space':'KeyE'} label={settings.navigation==='walk'?t("اقفز", "Jump"):t("ارتفع", "Ascend")}>{t(t("↑ ارتفاع", "↑ Up"), "↑ Up")}</MoveButton>
      {settings.navigation==='drone'&&<MoveButton code="KeyQ" label={t("انخفاض", "Descend")}>{t(t("↓ انخفاض", "↓ Down"), "↓ Down")}</MoveButton>}
      <span className="mobileTouchHint">{t(t("اسحب على المشهد لتغيير اتجاه النظر", "Drag to look around"), "Drag to look around")}</span></>:<>
      <button className="mobileZoomMain" aria-label={t(t("تقريب المشهد", "Zoom in"), "Zoom in")} onClick={()=>onCamera('in')}>＋ <small>{t(t("تقريب", "In"), "In")}</small></button>
      <button className="mobileZoomMain" aria-label={t(t("إبعاد المشهد", "Zoom out"), "Zoom out")} onClick={()=>onCamera('out')}>− <small>{t(t("إبعاد", "Out"), "Out")}</small></button>
      <span className="mobileTouchHint">{t(t("إصبع للتدوير · إصبعان للتقريب", "Drag to rotate · pinch to zoom"), "Drag to rotate · pinch to zoom")}</span></>}
    <div className="mobileExtraActions">
     <button onClick={onReset}>⟳ <span>{t(t("إعادة", "Reset"), "Reset")}</span></button>
     {!moving&&<button onClick={()=>onCamera('stop')}>■ <span>{t(t("إيقاف", "Stop"), "Stop")}</span></button>}
     {!moving&&mode!=='overview'&&mode!=='story'&&<button onClick={onFocus}>◎ <span>{t(t("المعدّة", "Equipment"), "Equipment")}</span></button>}
    </div>
   </div>
  </div>
 </div>;
}
