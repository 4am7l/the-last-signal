import { useState } from "react";
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

type EagleImage = (typeof eagleImages)[number];

export function EagleGallery({ onSelect }: { onSelect?: (image: EagleImage) => void }) {
  const t = useExplorerText();
  return (
    <div className="eagle-gallery">
      {eagleImages.map((image, index) => {
        const label = t("كبّر الصورة", "Enlarge image") + " · " + image.id;
        const thumbnail = <img src={image.src} alt={t(image.ar, image.en)} loading={!onSelect && index === 0 ? "eager" : "lazy"} decoding="async" />;
        return (
          <figure key={image.id}>
            {onSelect ? (
              <button type="button" className="eagle-photo-button" aria-label={label} onClick={() => onSelect(image)}>{thumbnail}</button>
            ) : (
              <a href={image.src} target="_blank" rel="noreferrer" aria-label={label}>{thumbnail}</a>
            )}
            <figcaption>
              <span>{t(image.ar, image.en)}</span>
              <a href={image.source} target="_blank" rel="noreferrer">{t("المصدر", "Source")} · <bdi>{image.id}</bdi> <span aria-hidden="true">↗</span></a>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function EagleSidebar() {
  const t = useExplorerText();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selected, setSelected] = useState<EagleImage | null>(null);
  return (
    <aside className="eagle-sidebar" aria-label={t("عن أبولو 11", "About Apollo 11")}>
      <details open={window.matchMedia("(min-width: 851px) and (min-height: 480px)").matches}>
        <summary>{t("عن أبولو 11", "About Apollo 11")}</summary>
        <div className={`eagle-sidebar-layout${archiveOpen ? " has-archive" : ""}`}>
          <div className="eagle-sidebar-content">
            <h2>{t("إيغل — الوحدة القمرية", "Eagle — Lunar Module")}</h2>
            <p><time dateTime="1969-07-20">{t("20 تموز 1969", "July 20, 1969")}</time></p>
            <EagleSummary />
            <ul className="eagle-sources">
              <li><a href={eagle.catalog} target="_blank" rel="noreferrer">{t("سجل المركبة · ناسا", "Spacecraft record · NASA")}</a></li>
              <li><a href={eagle.archiveHref}>{t("صفحة الرحلة", "Mission page")}</a></li>
            </ul>
            <button className="action action-solid" type="button" aria-expanded={archiveOpen} aria-controls="eagle-photo-archive"
              onClick={() => { setArchiveOpen(!archiveOpen); setSelected(null); }}>
              {archiveOpen ? t("إخفاء الصور والمصادر", "Hide photos and sources") : t("الصور والمصادر", "Photos and sources")}
            </button>
          </div>
          <section className="eagle-sidebar-gallery" id="eagle-photo-archive" hidden={!archiveOpen} aria-labelledby="eagle-photo-archive-title">
            <h2 id="eagle-photo-archive-title">{t("أرشيف الصور", "Photo archive")}</h2>
            {archiveOpen && (selected ? (
              <div className="eagle-photo-preview">
                <button type="button" className="action action-line" onClick={() => setSelected(null)}>{t("رجوع للصور", "Back to photos")}</button>
                <img src={selected.src} alt={t(selected.ar, selected.en)} />
                <p>{t(selected.ar, selected.en)}</p>
                <a className="text-link" href={selected.source} target="_blank" rel="noreferrer">{t("المصدر", "Source")} · <bdi>{selected.id}</bdi> ↗</a>
              </div>
            ) : <EagleGallery onSelect={setSelected} />)}
          </section>
        </div>
      </details>
    </aside>
  );
}
