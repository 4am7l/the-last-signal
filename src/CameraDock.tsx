import { useExplorerText } from "./explorer-language";
import type { CameraCommand } from "./CameraCommands";

export function CameraDock({
  onCamera, onReset, onFocus, busy = false,
}: {
  onCamera: (kind: CameraCommand["kind"]) => void;
  onReset: () => void;
  onFocus?: () => void;
  busy?: boolean;
}) {
  const t = useExplorerText();
  return (
    <div className="camera-dock" role="group" aria-label={t("تحكم الكاميرا", "Camera controls")}>
      <div className="camera-dock__zoom" role="group" aria-label={t("التقريب والإبعاد", "Zoom")}>
        <button type="button" aria-label={t("إبعاد الكاميرا", "Zoom out")} title={t("إبعاد (−)", "Zoom out (−)")} onClick={() => onCamera("out")}>
          <span className="material-symbols-rounded" aria-hidden="true">remove</span>
        </button>
        <button type="button" aria-label={t("تقريب الكاميرا", "Zoom in")} title={t("تقريب (+)", "Zoom in (+)")} onClick={() => onCamera("in")}>
          <span className="material-symbols-rounded" aria-hidden="true">add</span>
        </button>
      </div>
      <div className="camera-dock__actions">
        {onFocus && (
          <button type="button" className="camera-dock__focus" onClick={onFocus} disabled={busy}>
            <span className="material-symbols-rounded" aria-hidden="true">center_focus_strong</span>
            {t("تركيز المعدّة", "Focus on equipment")}
          </button>
        )}
        <button type="button" aria-label={t("إيقاف حركة الكاميرا", "Stop camera")} title={t("إيقاف الحركة", "Stop camera")} onClick={() => onCamera("stop")}>
          <span className="material-symbols-rounded" aria-hidden="true">stop</span>
        </button>
        <button type="button" aria-label={t("إعادة ضبط الكاميرا", "Reset camera")} title={t("إعادة ضبط الكاميرا", "Reset camera")} onClick={onReset}>
          <span className="material-symbols-rounded" aria-hidden="true">restart_alt</span>
        </button>
      </div>
    </div>
  );
}
