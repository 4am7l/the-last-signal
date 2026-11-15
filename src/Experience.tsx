import { eagle, eagleImages } from "./eagle";
import { EagleGallery, EagleSummary } from "./EagleDetails";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage, useExplorerText } from "./explorer-language";
import { destinations, exploreHref, type Destination, type Page } from "./navigation";

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
const homeMissions = [{
  id: "apollo",
  body: "moon" as Destination,
  name: ["أبولو 11", "Apollo 11"] as const,
  intro: [
    "صور مركبة إيغل في بحر السكون وتفاصيل مرحلة الهبوط التي بقيت على القمر.",
    "See Eagle at Tranquility Base and the descent stage left on the Moon.",
  ] as const,
  archiveHref: eagle.archiveHref,
  simulationHref: eagle.simulationHref,
  catalog: eagle.catalog,
  images: eagleImages,
}];

export function Home() {
  const t = useExplorerText();
  const cover = eagleImages[0];
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
            <a className="text-link" href="#/archive">{t("أرشيف المهمات", "Mission archive")}</a>
          </div>
        </div>
        <figure className="hero-figure">
          <img className="hero-photo" src={cover.src} alt={t(cover.ar, cover.en)} fetchPriority="high" />
          <figcaption className="hero-caption">
            <span>{t("باز ألدرين عند إيغل · أبولو 11", "Buzz Aldrin at Eagle · Apollo 11")}</span>
            <a href={cover.source} target="_blank" rel="noreferrer">NASA · {cover.id} <Arrow /></a>
          </figcaption>
        </figure>
      </section>
      <section className="page-section destinations-section" aria-labelledby="destinations-title">
        <div className="section-heading destinations-heading">
          <h2 id="destinations-title">{t("وجهات الاستكشاف", "Explore a destination")}</h2>
        </div>
        <div className="destinations">
          {destinations.map((body) => {
            const moon = body === "moon";
            const bodyLabel = moon ? t("القمر", "The Moon") : t("المريخ", "Mars");
            const bodyCover = moon ? eagleImages[1] : null;
            const missions = homeMissions.filter((mission) => mission.body === body);
            return (
              <article className={`destination destination--expressive ${body}`} key={body}>
                <a className="destination__media" href={exploreHref(body)} aria-label={bodyLabel}>
                  <img src={bodyCover?.src ?? "/mars-nasa-viking.jpg"} alt="" loading="lazy" />
                </a>
                <div className="destination__content">
                  <div className="destination__title-row">
                    <h3><a href={exploreHref(body)}>{bodyLabel}</a></h3>
                    <a href={exploreHref(body)} aria-label={t("افتح المعاينة", "Open preview") + " · " + bodyLabel}><Arrow /></a>
                  </div>
                  {bodyCover && (
                    <a className="text-link" href={bodyCover.source} target="_blank" rel="noreferrer">NASA · {bodyCover.id}</a>
                  )}
                  {missions.length > 0 && (
                    <ul className="eagle-mission-list">
                      {missions.map((mission) => <li key={mission.id}><a href={mission.archiveHref}>{t(...mission.name)}</a></li>)}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="page-section featured-section" aria-labelledby="home-missions-title">
        <div className="section-heading">
          <h2 id="home-missions-title">{t("من أرشيف المهمات", "From the mission archive")}</h2>
          <a className="text-link" href="#/archive">{t("الأرشيف الكامل", "Full archive")} <Arrow /></a>
        </div>
        {homeMissions.map((mission) => (
          <article className="home-mission" key={mission.id}>
            <header className="home-mission-copy">
              <h3><a href={mission.archiveHref}>{t(...mission.name)} <Arrow /></a></h3>
              <p>{t(...mission.intro)}</p>
              <div className="hero-actions">
                <a className="action action-solid" href={mission.simulationHref}>{t("شغّل المحاكاة", "Open simulation")} <Arrow /></a>
                <a className="text-link" href={mission.catalog} target="_blank" rel="noreferrer">{t("سجل المهمة · ناسا", "Mission record · NASA")} <Arrow /></a>
              </div>
            </header>
            <EagleGallery images={mission.images} />
          </article>
        ))}
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
        <EagleSummary />
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
        <EagleGallery />
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
