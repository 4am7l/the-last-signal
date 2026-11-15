import { eagle, eagleImages } from "./eagle";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, useExplorerText } from "./explorer-language";
import { destinations, exploreHref, type Page } from "./navigation";

function Arrow() {
  return (
    <svg
      className="arrow-icon"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}
export function SiteHeader({
  page,
  onSources,
  onLanguageToggle,
}: {
  page: Page;
  onSources: () => void;
  onLanguageToggle: () => void;
}) {
  const t = useExplorerText();
  const english = useLanguage() === "en";
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label={t("الإشارة الأخيرة — الرئيسية", "The Last Signal — Home")}>
        <span className="signal-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <div>
          {t("الإشارة الأخيرة", "The Last Signal")}{!english && <small>THE LAST SIGNAL</small>}
        </div>
      </a>
      <nav aria-label={t("التنقل الرئيسي", "Main navigation")}>
        {(
          [
            ["home", "#/", t("الرئيسية", "Home")],
            ["explore", "#/explore", t("الاستكشاف", "Explore")],
            ["archive", "#/archive", t("أرشيف المهمات", "Mission archive")],
            ["guide", "#/guide", t("دليل الرحلة", "Explorer guide")],
          ] as const
        ).map(([id, href, label]) => (
          <a
            key={id}
            href={href}
            aria-current={page === id ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="site-header__actions">
        <LanguageToggle onToggle={onLanguageToggle} />
        <ThemeToggle />
        <button className="source-link" onClick={onSources}>
          {t("المصادر والدقة", "Sources and accuracy")} <Arrow />
        </button>
      </div>
    </header>
  );
}
export function Home() {
  const t = useExplorerText();
  return (
    <main id="main-content" className="editorial-page" tabIndex={-1}>
      <section className="signal-hero">
        <div className="hero-copy">
          <h1>{t("الإشارة الأخيرة", "The Last Signal")}</h1>
          <p>{t("استكشف القمر والمريخ في محاكاة ثلاثية الأبعاد.", "Explore the Moon and Mars in a 3D simulation.")}</p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/explore">
              {t("افتح المحاكاة", "Open simulation")} <Arrow />
            </a>
          </div>
        </div>
      </section>
      <section className="page-section destinations-section" aria-labelledby="destinations-title">
        <div className="section-heading destinations-heading">
          <h2 id="destinations-title">{t("وجهات الاستكشاف", "Explore a destination")}</h2>
        </div>
        <div className="destinations">
          {destinations.map((body) => (
            <article className={`destination destination--expressive ${body}`} key={body}>
              <div className="destination__content">
                <div className="destination__title-row">
                  <h3><a href={exploreHref(body)}>{body === "moon" ? t("القمر", "The Moon") : t("المريخ", "Mars")}</a></h3>
                  <a href={exploreHref(body)} aria-label={body === "moon" ? t("استكشف القمر", "Explore the Moon") : t("استكشف المريخ", "Explore Mars")}><Arrow /></a>
                </div>
                {body === "moon" && (
                  <ul className="eagle-mission-list">
                    <li><a href={eagle.archiveHref}>{t("أبولو 11", "Apollo 11")}</a></li>
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Archive({ mission }: { mission?: string }) {
  const t = useExplorerText();
  if (mission !== "apollo") {
    return (
      <main id="main-content" className="editorial-page" tabIndex={-1}>
        <section className="page-intro">
          <h1>{t("أرشيف المهمات", "Mission archive")}</h1>
        </section>
        <section className="page-section" aria-labelledby="moon-archive-title">
          <h2 id="moon-archive-title">{t("القمر", "The Moon")}</h2>
          <ul className="eagle-mission-list">
            <li><a href={eagle.archiveHref}>{t("أبولو 11", "Apollo 11")}</a></li>
          </ul>
        </section>
      </main>
    );
  }
  return (
    <main id="main-content" className="editorial-page" tabIndex={-1}>
      <section className="page-intro">
        <a className="text-link" href="#/archive">{t("القمر · أرشيف المهمات", "The Moon · Mission archive")}</a>
        <p>{t("أبولو 11 · 20 تموز 1969", "Apollo 11 · July 20, 1969")}</p>
        <h1>{t("إيغل — الوحدة القمرية", "Eagle — Lunar Module")}</h1>
        <p>{t(
          "هبطت إيغل في بحر السكون وعلى متنها نيل أرمسترونغ وباز ألدرين. في اليوم التالي أقلعت مرحلة الصعود للالتحام بكولومبيا، وبقيت مرحلة الهبوط بأرجلها الأربع ومحرّكها على القمر.",
          "Eagle landed in the Sea of Tranquility carrying Neil Armstrong and Buzz Aldrin. The next day its ascent stage lifted off to dock with Columbia, leaving the descent stage, its four legs and its engine on the Moon.",
        )}</p>
        <p>{t("بحر السكون", "Tranquility Base")} · <bdi>{eagle.coordinates}</bdi></p>
        <p>{t("تعرض المحاكاة مجسّم إيغل الكامل كما ظهر وقت الهبوط.", "The simulation shows the complete Eagle lunar module as it appeared at touchdown.")}</p>
        <div className="hero-actions">
          <a className="action action-solid" href={eagle.simulationHref}>
            {t("شغّل محاكاة أبولو 11", "Open Apollo 11 simulation")} <Arrow />
          </a>
        </div>
        <ul className="eagle-sources">
          <li><a href={eagle.catalog} target="_blank" rel="noreferrer">NASA NSSDCA · 1969-059C</a></li>
          <li><a href={eagle.coordinateSource} target="_blank" rel="noreferrer">{t("مرجع الإحداثيات · LROC", "Coordinate reference · LROC")}</a></li>
          <li><a href={eagle.modelSource} target="_blank" rel="noreferrer">{t("المجسّم الأصلي · NASA", "Original model · NASA")}</a></li>
          <li><a href={eagle.photoArchive} target="_blank" rel="noreferrer">{t("أرشيف صور أبولو 11 · NASA", "Apollo 11 photo archive · NASA")}</a></li>
        </ul>
      </section>
      <section className="page-section" aria-labelledby="eagle-timeline-title">
        <div className="section-heading">
          <h2 id="eagle-timeline-title">{t("مراحل الرحلة", "Mission timeline")}</h2>
          <a className="text-link" href={eagle.missionSource} target="_blank" rel="noreferrer">{t("سجل المهمة · ناسا", "Mission record · NASA")}</a>
        </div>
        <ol>
          {eagle.missionEvents.map(([date, ar, en]) => (
            <li key={date}><time dateTime={date}><bdi>{date}</bdi></time> · {t(ar, en)}</li>
          ))}
        </ol>
      </section>
      <section className="page-section" aria-labelledby="eagle-gallery-title">
        <div className="section-heading">
          <h2 id="eagle-gallery-title">{t("صور إيغل والرسم الهندسي", "Eagle photographs and technical diagram")}</h2>
        </div>
        <div className="eagle-gallery">
          {eagleImages.map((image, index) => (
            <figure key={image.id}>
              <a href={image.src} target="_blank" rel="noreferrer" aria-label={t("افتح الصورة بحجمها الكامل", "Open full-size image") + " · " + image.id}>
                <img src={image.src} alt={t(image.ar, image.en)} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
              </a>
              <figcaption>
                <span>{t(image.ar, image.en)}</span>
                <a href={image.source} target="_blank" rel="noreferrer" dir="ltr">{image.id} <Arrow /></a>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Guide() {
  const t = useExplorerText();
  return (
    <main id="main-content" className="editorial-page guide-page" tabIndex={-1}>
      <section className="page-intro">
        <h1>{t("طريقة استخدام المحاكاة", "How to use the simulation")}</h1>
      </section>
      <section className="guide-steps">
        {[
          [
            t("اختر القمر أو المريخ", "Choose the Moon or Mars"),
            t("اسحب لتدوير المشهد. استخدم عجلة الفأرة أو قرّب بإصبعين للتكبير.", "Drag to rotate. Scroll or pinch to zoom."),
          ],
          [
            t("انزل إلى السطح", "Descend to the surface"),
            t("افتح استكشاف السطح واختر النزول. استخدم زر الرجوع للعودة إلى منظر الجرم الكامل.", "Open the surface explorer and select Descend. Use Back to return to the full globe."),
          ],
          [
            t("تنقّل على السطح", "Move around on the surface"),
            t("بعد النزول، اختر المشي أو الطيران من إعدادات المحاكاة. تظهر أزرار الحركة على الهاتف.", "After descending, choose Walk or Fly in the simulation settings. Movement controls appear on phones."),
          ],
        ].map(([title, description]) => (
          <article key={title}>
            <div><h2>{title}</h2><p>{description}</p></div>
          </article>
        ))}
      </section>
      <div className="guide-start">
        <a className="action action-solid" href="#/explore">{t("ابدأ الاستكشاف", "Start exploring")} <Arrow /></a>
      </div>
    </main>
  );
}

export function SiteFooter({ onSources }: { onSources: () => void }) {
  const t = useExplorerText();
  return (
    <footer className="site-footer">
      <strong>{t("الإشارة الأخيرة", "The Last Signal")}</strong>
      <div>
        <a href="#/guide">{t("دليل الاستكشاف", "Explorer guide")}</a>
        <button onClick={onSources}>{t("المصادر وحدود المحاكاة ↗", "Sources and simulation limits ↗")}</button>
      </div>
    </footer>
  );
}
