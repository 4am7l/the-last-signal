import { eagle, eagleImages } from "./eagle";
import { useExplorerText } from "./explorer-language";

export function EagleSummary() {
  const t = useExplorerText();
  return (
    <>
        <p>{t(
          "هبطت إيغل في بحر السكون وعلى متنها نيل أرمسترونغ وباز ألدرين. في اليوم التالي أقلعت مرحلة الصعود للالتحام بكولومبيا، وبقيت مرحلة الهبوط بأرجلها الأربع ومحرّكها على القمر.",
          "Eagle landed in the Sea of Tranquility carrying Neil Armstrong and Buzz Aldrin. The next day its ascent stage lifted off to dock with Columbia, leaving the descent stage, its four legs and its engine on the Moon.",
        )}</p>
        <p>{t("بحر السكون", "Tranquility Base")} · <bdi>{eagle.coordinates}</bdi></p>
        <p>{t("تعرض المحاكاة مجسّم إيغل الكامل كما ظهر وقت الهبوط.", "The simulation shows the complete Eagle lunar module as it appeared at touchdown.")}</p>
    </>
  );
}

export function EagleGallery({ compact = false }: { compact?: boolean }) {
  const t = useExplorerText();
  return (
        <div className="eagle-gallery">
          {eagleImages.map((image, index) => (
            <figure key={image.id}>
              <a href={image.src} target="_blank" rel="noreferrer" aria-label={t("افتح الصورة بحجمها الكامل", "Open full-size image") + " · " + image.id}>
                <img src={image.src} alt={t(image.ar, image.en)} loading={!compact && index === 0 ? "eager" : "lazy"} decoding="async" />
              </a>
              <figcaption>
                <span>{t(image.ar, image.en)}</span>
                <a href={image.source} target="_blank" rel="noreferrer" dir="ltr">{image.id} <span aria-hidden="true">↗</span></a>
              </figcaption>
            </figure>
          ))}
        </div>
  );
}

export function EagleSidebar() {
  const t = useExplorerText();
  return (
    <aside className="eagle-sidebar" aria-label={t("عن أبولو 11", "About Apollo 11")}>
      <details open={window.matchMedia("(min-width: 851px) and (min-height: 480px)").matches}>
        <summary>{t("عن أبولو 11", "About Apollo 11")}</summary>
        <div className="eagle-sidebar-content">
          <h2>{t("إيغل — الوحدة القمرية", "Eagle — Lunar Module")}</h2>
          <p><time dateTime="1969-07-20">{t("20 تموز 1969", "July 20, 1969")}</time></p>
          <EagleSummary />
          <ul className="eagle-sources">
            <li><a href={eagle.catalog} target="_blank" rel="noreferrer">{t("سجل المركبة · ناسا", "Spacecraft record · NASA")}</a></li>
            <li><a href={eagle.archiveHref}>{t("صفحة الرحلة", "Mission page")}</a></li>
          </ul>
          <details className="eagle-sidebar-gallery">
            <summary>{t("أرشيف الصور", "Photo archive")}</summary>
            <EagleGallery compact />
          </details>
        </div>
      </details>
    </aside>
  );
}
