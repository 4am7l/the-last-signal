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

  const name = body === "moon" ? "القمر" : "المريخ";
  return (
    <div className="planet-loading-overlay" role="status" aria-live="polite" aria-atomic="true">
      <div className="planet-loading-card">
        <div className="m3-expressive-loading-container">
          <span
            className="m3-expressive-loading"
            role="progressbar"
            aria-label={`جارٍ تحميل مشهد ${name}`}
          >
            <span className="m3-expressive-loading__shape" />
          </span>
        </div>
        <span className="planet-loading-eyebrow">THE LAST SIGNAL · EXPLORATION</span>
        <h2>جارٍ تجهيز {name}</h2>
        <p>{mission
          ? `نحمّل تضاريس ${name} وصوره ومجسّمات المهمة قبل عرض المشهد.`
          : `نحمّل سطح ${name} وخرائطه لتبدأ الاستكشاف.`}</p>
        {elapsed >= 6 && (
          <small aria-hidden="true">تجهيز التفاصيل ثلاثية الأبعاد مستمر… {elapsed} ث</small>
        )}
      </div>
    </div>
  );
}
