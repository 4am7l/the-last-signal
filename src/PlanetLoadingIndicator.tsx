import { useExplorerText } from "./explorer-language";
import { useEffect, useState } from "react";

type Destination = "moon" | "mars";

export function PlanetLoadingIndicator({
  body,
  mission,
}: {
  body: Destination;
  mission?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [body, mission]);

  const t = useExplorerText();
  const name = body === "moon" ? t("القمر", "Moon") : t("المريخ", "Mars");
  return (
    <div className="planet-loading-overlay" role="status" aria-live="polite" aria-atomic="true">
      <div className="planet-loading-card">
        <div className="m3-expressive-loading-container">
          <span
            className="m3-expressive-loading"
            role="progressbar"
            aria-label={t(`جارٍ تحميل مشهد ${name}`, `Loading the ${name} scene`)}
          >
            <span className="m3-expressive-loading__shape" />
          </span>
        </div>
        <span className="planet-loading-eyebrow">THE LAST SIGNAL · EXPLORATION</span>
        <h2>{t(`جارٍ تجهيز ${mission ?? name}`, `Preparing ${mission ?? name}`)}</h2>
        <p>{mission
          ? t(`نحمّل تضاريس ${name} وصوره ومجسّمات المهمة قبل عرض المشهد.`, "Loading terrain, textures and mission models.")
          : t(`نحمّل سطح ${name} وخرائطه لتبدأ الاستكشاف.`, "Loading the surface and its textures.")}</p>
        {elapsed >= 6 && (
          <small aria-hidden="true">{t(`تجهيز التفاصيل ثلاثية الأبعاد مستمر… ${elapsed} ث`, `Preparing 3D details… ${elapsed} s`)}</small>
        )}
      </div>
    </div>
  );
}
