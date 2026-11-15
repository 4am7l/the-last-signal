import { FalconBrief } from "./FalconBrief";
import { ApolloBrief } from "./ApolloBrief";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage, useExplorerText } from "./explorer-language";
import { englishEvent, englishExplanations, missionEnglish } from "./explorer-english";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NasaGallery } from "./NasaGallery";
import { missions, type Mission } from "./data";
import { exploreHref, matchesMission, type Page } from "./navigation";
function useEditorialCopy() {
  const t = useExplorerText();
  const english = useLanguage() === "en";
  return {
    t,
    english,
    bodyName: (m: Mission) => m.body === "moon" ? t("القمر", "Moon") : t("المريخ", "Mars"),
    missionName: (m: Mission) => english ? m.en : m.name,
    copy: (m: Mission) => english ? missionEnglish[m.id] : m,
  };
}
const year = (m: Mission) =>
  m.events.find((e) => e.stage === "landing")!.date.slice(0, 4);
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
  const { t, english } = useEditorialCopy();
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
  const { t, english, bodyName, missionName, copy } = useEditorialCopy();
  return (
    <main id="main-content" className="editorial-page" tabIndex={-1}>
      <section className="signal-hero">
        <div className="hero-copy">
          <h1>{t("ماذا تركنا على القمر والمريخ؟", "What did we leave on the Moon and Mars?")}</h1>
          <p>
            {t("من مرحلة الهبوط التي بقيت في بحر السكون إلى مروحية إنجينيويتي على المريخ. تصفّح مهمات ناسا وتعرّف إلى معداتها ومواقعها.", "From the descent stage at Tranquility Base to the Ingenuity helicopter on Mars. Explore NASA missions and the equipment they left behind.")}
          </p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/explore">
              {t("افتح المحاكاة", "Open simulation")} <span aria-hidden="true">{t("←", "→")}</span>
            </a>
            <a className="action action-line" href="#/archive">
              {t("أرشيف المهمات", "Mission archive")}
            </a>
          </div>
        </div>
        <figure className="hero-figure">
          <div className="hero-media">
            <img
              className="hero-photo"
              src="/photos/apollo-11-portrait.jpg"
              alt={t("باز ألدرين على سطح القمر", "Buzz Aldrin on the lunar surface")}
              width={960}
              height={600}
              fetchPriority="high"
            />
          </div>
          <figcaption className="hero-caption">
            <a href="https://nssdc.gsfc.nasa.gov/imgcat/html/object_page/a11_h_40_5903.html" target="_blank" rel="noreferrer">{t("باز ألدرين، أبولو 11 · ناسا", "Buzz Aldrin, Apollo 11 · NASA")}</a>
            <a href={exploreHref("apollo", "location")}>{t("موقع الهبوط ←", "Landing site →")}</a>
          </figcaption>
        </figure>
      </section>
      <DestinationBrowser />
      <section className="page-section featured-section">
        <div className="section-heading">
          <div>
            <h2>{t("من أرشيف المهمات", "From the mission archive")}</h2>
          </div>
          <a className="text-link" href="#/archive">
            {t("الأرشيف الكامل", "Full archive")} <Arrow />
          </a>
        </div>
        <div className="feature-grid">
          {[missions[0], missions[2], missions[3], ...missions.filter((mission) => mission.body === "moon")].map((m) => (
            <a
              className="feature-card"
              href={`#/archive?mission=${m.id}`}
              key={m.id}
            >
              <div className="feature-image">
                <img
                  src={`/photos/${m.id}.jpg`}
                  alt={copy(m).photoCaption}
                  loading="lazy"
                />
                <span>
                  {bodyName(m)} / {year(m)}
                </span>
              </div>
              <div className="feature-copy">
                {!english && <small>{m.en}</small>}
                <h3>
                  {missionName(m)}
                  <Arrow />
                </h3>
                <p>{copy(m).intro}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <ScienceIntroduction />
      <NasaGallery mission="apollo" />
      <NasaGallery mission="ingenuity" />
      <section className="closing-section">
        <h2>{t("دقة المحاكاة", "Simulation accuracy")}</h2>
        <p>
          {t("التضاريس المحلية وحركة المعدات تقريبية. تجد مصادر الصور والإحداثيات وحدود دقتها في سجل كل مهمة.", "Local terrain and equipment motion are approximate. Each mission record lists its image sources, coordinate reference and accuracy.")}
        </p>
        <a className="action action-line" href="#/guide">
          {t("دليل الاستكشاف وحدود المحاكاة", "Explorer guide and simulation limits")} <Arrow />
        </a>
      </section>
    </main>
  );
}
function DestinationBrowser() {
  const { t, missionName, copy } = useEditorialCopy();
  const [body, setBody] = useState<Mission["body"] | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const missionHeading = useRef<HTMLHeadingElement>(null);
  const missionTrigger = useRef<HTMLButtonElement>(null);
  const selected = missions.find((mission) => mission.id === missionId && mission.body === body);

  useEffect(() => { listHeading.current?.focus(); }, [body]);
  useEffect(() => { missionHeading.current?.focus(); }, [selected]);

  return (
    <section className="page-section destinations-section" aria-labelledby="destinations-title">
      <div className="section-heading destinations-heading">
        <h2 id="destinations-title">{t("أين توجد هذه المعدات؟", "Where is the equipment?")}</h2>
      </div>
      <div className="destinations">
        {[
          {
            body: "moon" as const,
            title: t("القمر", "Moon"),
            text: t("استكشف موقعي أبولو 11 وأبولو 15 والمعدات التي بقيت على القمر.", "Visit the Apollo 11 and Apollo 15 landing sites and the equipment left on the Moon."),
            img: "apollo",
            count: t("مهمتان", "Two missions"),
          },
          {
            body: "mars" as const,
            title: t("المريخ", "Mars"),
            text: t("استكشف مواقع العربات والمسبار الثابت والمروحية على المريخ.", "Explore the sites of the rovers, lander and helicopter on Mars."),
            img: "opportunity",
            count: t("أربع مهمات", "Four missions"),
          },
        ].map((d) => (
          <button
            type="button"
            className={`destination destination--expressive ${d.body}`}
            aria-label={t(`معدات ${d.title}`, `Equipment on ${d.body === "moon" ? "the Moon" : "Mars"}`)}
            aria-expanded={body === d.body}
            aria-controls="destination-equipment"
            onClick={() => {
              setBody(body === d.body ? null : d.body);
              setMissionId(null);
            }}
            key={d.body}
          >
            <span className="destination__media">
              <img
                src={`/photos/${d.img}.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="destination__content">
              <span className="destination__title-row">
                <span className="destination__title">{d.title}</span>
                <span className="destination__count">{d.count}</span>
              </span>
              <span className="destination__description">{d.text}</span>
              <span className="destination__cta">
                {body === d.body ? t("أخفِ القائمة", "Hide equipment") : t("اعرض المعدات", "Browse equipment")}
                <span className="material-symbols-rounded" aria-hidden="true">expand_more</span>
              </span>
            </span>
          </button>
        ))}
      </div>
      <div id="destination-equipment" className="destination-equipment" hidden={!body}>
        {body && (
          <>
            <h3 ref={listHeading} tabIndex={-1} id="destination-equipment-title">
              {body === "moon" ? t("معدات القمر", "Equipment on the Moon") : t("معدات المريخ", "Equipment on Mars")}
            </h3>
            <div className={`destination-equipment__layout${selected ? " has-selection" : ""}`}>
              <ul className="destination-missions" aria-labelledby="destination-equipment-title">
                {missions.filter((mission) => mission.body === body).map((mission) => (
                  <li key={mission.id}>
                    <button type="button" aria-expanded={selected?.id === mission.id} aria-controls="destination-mission-details"
                      onClick={(event) => {
                        missionTrigger.current = event.currentTarget;
                        setMissionId(selected?.id === mission.id ? null : mission.id);
                      }}>
                      <img src={`/photos/${mission.id}.jpg`} alt="" loading="lazy" />
                      <span>
                        <strong>{missionName(mission)}</strong>
                        <small>{copy(mission).site}</small>
                      </span>
                      <span className="material-symbols-rounded" aria-hidden="true">{t("chevron_left", "chevron_right")}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div id="destination-mission-details" hidden={!selected}>
                {selected && (
                  <article className="destination-mission" key={selected.id} aria-labelledby="destination-mission-title">
                    <div className="destination-mission__heading">
                      <h4 id="destination-mission-title" ref={missionHeading} tabIndex={-1}>{missionName(selected)}</h4>
                      <button className="destination-mission__close" type="button" aria-label={t("إغلاق وصف المعدّة", "Close equipment details")}
                        onClick={() => {
                          setMissionId(null);
                          missionTrigger.current?.focus();
                        }}>
                        <span className="material-symbols-rounded" aria-hidden="true">close</span>
                      </button>
                    </div>
                    <p>{copy(selected).intro}</p>
                    <p>{copy(selected).detail}</p>
                    <p className="destination-mission__site">{copy(selected).site}</p>
                    <a className="action action-solid" href={exploreHref(selected.id, "location")}>
                      {t("اذهب للمحاكاة", "Go to simulation")}
                      <span aria-hidden="true">{t("←", "→")}</span>
                    </a>
                  </article>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
export function Archive({ initialMission }: { initialMission?: string }) {
  const { t, english, bodyName, missionName, copy } = useEditorialCopy();
  const [query, setQuery] = useState(""),
    [body, setBody] = useState("all"),
    [sort, setSort] = useState("oldest"),
    [selected, setSelected] = useState(initialMission || "");
  const records = useMemo(
    () =>
      missions
        .filter((m) => matchesMission({ ...m, searchAliases: missionEnglish[m.id].site }, query, body))
        .sort((a, b) =>
          sort === "oldest"
            ? year(a).localeCompare(year(b))
            : year(b).localeCompare(year(a)),
        ),
    [query, body, sort],
  );
  const chosen = missions.find((m) => m.id === selected);
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => {
      const dossier = document.getElementById("mission-dossier");
      dossier?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
      dossier?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);
  return (
    <main
      id="main-content"
      className="editorial-page archive-page"
      tabIndex={-1}
    >
      <section className="page-intro">
        <h1>{t("أرشيف المهمات", "Mission archive")}</h1>
        <p>
          {t("سجلات مهمات لناسا على القمر والمريخ، مع صور المعدات ومواقع الهبوط.", "Records from NASA missions to the Moon and Mars, with equipment photos and landing sites.")}
        </p>
      </section>
      <section className="archive-browser" aria-label={t("أرشيف المهمات", "Mission archive")}>
        <div className="archive-controls">
          <label className="search-field">
            <span>{t("ابحث في الأرشيف", "Search the archive")}</span>
            <input
              type="search"
              placeholder={t("اسم المهمة أو موقع الهبوط…", "Mission name or landing site…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="filter-group" role="group" aria-label={t("تصفية الوجهة", "Filter by destination")}>
            {[
              ["all", t("كل الوجهات", "All destinations")],
              ["moon", t("القمر", "Moon")],
              ["mars", t("المريخ", "Mars")],
            ].map(([v, label]) => (
              <button
                key={v}
                aria-pressed={body === v}
                onClick={() => setBody(v)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="sort-field">
            {t("الترتيب", "Sort by")}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="oldest">{t("الأقدم وصولًا", "Earliest landing")}</option>
              <option value="newest">{t("الأحدث وصولًا", "Latest landing")}</option>
            </select>
          </label>
        </div>
        <div className="results-line" role="status">
          <span>
            {t(`${records.length} من ${missions.length} مهمات`, `${records.length} of ${missions.length} missions`)}
          </span>
          <small>{t("مرتبة حسب سنة الهبوط", "Sorted by landing year")}</small>
        </div>
        <div className="record-grid">
          {records.map((m) => (
            <article
              className={
                "mission-record " + (selected === m.id ? "is-selected" : "")
              }
              key={m.id}
            >
              <button
                className="record-open"
                onClick={() => setSelected(selected === m.id ? "" : m.id)}
                aria-expanded={selected === m.id}
                aria-controls="mission-dossier"
              >
                <div className="record-photo">
                  <img
                    src={`/photos/${m.id}.jpg`}
                    alt={copy(m).photoCaption}
                    loading="lazy"
                  />
                  <span className="record-year">{year(m)}</span>
                  <span className="record-body">{bodyName(m)}</span>
                </div>
                <div className="record-copy">
                  {!english && <small>{m.en}</small>}
                  <h2>
                    {missionName(m)}
                    <span aria-hidden="true">
                      {selected === m.id ? "−" : "+"}
                    </span>
                  </h2>
                  <p>{copy(m).intro}</p>
                  <div className="record-site">◎ {copy(m).site}</div>
                  <span className="record-read">
                    {selected === m.id ? t("أغلق سجل المهمة", "Close mission record") : t("اقرأ سجل المهمة", "Read mission record")}{" "}
                    <Arrow />
                  </span>
                </div>
              </button>
              <div className="record-actions">
                <a href={exploreHref(m.id, "location")}>{t("موقع الهبوط ↗", "Landing site ↗")}</a>
                <a href={exploreHref(m.id, "story")}>{t("مراحل الرحلة ↗", "Mission timeline ↗")}</a>
              </div>
            </article>
          ))}
        </div>
        {records.length === 0 && (
          <div className="empty-state">
            <h2>{t("لم نجد مهمة بهذه الكلمات.", "No missions match your search.")}</h2>
            <p>{t("جرّب اسمًا بالعربية أو الإنجليزية، أو أزل تصفية الوجهة.", "Try an Arabic or English name, or clear the destination filter.")}</p>
            <button
              className="action action-line"
              onClick={() => {
                setQuery("");
                setBody("all");
              }}
            >
              {t("إعادة عرض كل المهمات", "Show all missions")}
            </button>
          </div>
        )}
        {chosen && (
          <section
            className="dossier"
            key={chosen.id}
            id="mission-dossier"
            tabIndex={-1}
            aria-label={t(`سجل ${missionName(chosen)}`, `${chosen.en} record`)}
          >
            <div className="dossier-heading">
              <div>
                {!english && <div className="kicker">{chosen.en}</div>}
                <h2>{missionName(chosen)}</h2>
              </div>
              <button
                className="action action-line"
                onClick={() => setSelected("")}
              >
                {t("إغلاق السجل ×", "Close record ×")}
              </button>
            </div>
            <div className="dossier-grid">
              <div>
                <img
                  className="dossier-photo"
                  src={`/photos/${chosen.id}.jpg`}
                  alt={copy(chosen).photoCaption}
                />
                <small className="photo-credit">{copy(chosen).photoCaption}</small>
                {chosen.id === "apollo" ? <ApolloBrief /> : chosen.id === "apollo15" ? <FalconBrief /> : <MissionExplanation mission={chosen} />}
                <NasaGallery mission={chosen.id} compact />
                <h3>{t("كيف تعمل المعدات؟", "How does the equipment work?")}</h3>
                <p>{copy(chosen).detail}</p>
                <h3>{t("ما الذي بقي في الموقع؟", "What remains at the site?")}</h3>
                <p>{copy(chosen).final}</p>
                <a
                  className="text-link"
                  href={chosen.finalSource}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("المصدر الرسمي للموقع الأخير ↗", "Official source for the final location ↗")}
                </a>
                <h3>{t("مرجع الموقع المعروض", "Coordinate reference")}</h3>
                <p dir="ltr">
                  {chosen.lat}° / {chosen.lon}° E
                </p>
                <p>{copy(chosen).frame}</p>
                <a
                  className="text-link"
                  href={chosen.locationSource}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("مصدر الإحداثيات ↗", "Coordinate source ↗")}
                </a>
                <div className="hero-actions">
                  <a
                    className="action action-solid"
                    href={exploreHref(chosen.id, "model")}
                  >
                    {t("استكشف المجسّم", "Explore the model")} <Arrow />
                  </a>
                  <a
                    className="action action-line"
                    href={exploreHref(chosen.id, "story")}
                  >
                    {t("شاهد مراحل الرحلة", "Watch the mission")} <Arrow />
                  </a>
                </div>
              </div>
              <div>
                <h3>{t("محطات الرحلة", "Mission milestones")}</h3>
                <ol className="mission-timeline">
                  {chosen.events.map((e, i) => (
                    <li key={i}>
                      <time dateTime={e.date}>{e.date}</time>
                      <h4>{english ? englishEvent(e)[0] : e.title}</h4>
                      <p>{english ? englishEvent(e)[1] : e.text}</p>
                    </li>
                  ))}
                </ol>
                <a
                  className="text-link"
                  href={chosen.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("سجل المهمة لدى ناسا ↗", "NASA mission record ↗")}
                </a>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
export function Guide() {
  const { t } = useEditorialCopy();
  return (
    <main id="main-content" className="editorial-page guide-page" tabIndex={-1}>
      <section className="page-intro">
        <h1>{t("طريقة استخدام المحاكاة", "How to use the simulation")}</h1>
      </section>
      <section className="guide-steps">
        {[
          [
            "01",
            t("اختيار القمر أو المريخ", "Choose the Moon or Mars"),
            t("افتح الاستكشاف واختر القمر أو المريخ. اسحب لتدوير المشهد، أو استخدم أزرار اتجاه الكاميرا.", "Open Explore and select the Moon or Mars. Drag the scene or use the camera controls to rotate it."),
          ],
          [
            "02",
            t("الاقتراب من موقع الهبوط", "Approach a landing site"),
            t("اختر علامة المهمة، ثم قرّب بعجلة الفأرة أو بإصبعين على الهاتف. ينتقل المشهد تدريجيًا من المدار إلى المعدات على السطح.", "Choose a mission marker, then scroll or pinch to zoom from orbit down to the equipment."),
          ],
          [
            "03",
            t("فحص المعدات والتنقل على السطح", "Inspect equipment and move on the surface"),
            t("افتح المجسّم للتفاصيل، أو بدّل الملاحة إلى المشي والطيران من إعدادات المحاكاة. على الهاتف تظهر أزرار الحركة المناسبة.", "Open the model to inspect it, or choose Walk or Fly in the simulation settings. On phones, use the on-screen movement controls."),
          ],
          [
            "04",
            t("عرض مراحل المهمة", "Replay a mission"),
            t("تبويب الرحلة يعرض الانطلاق والعبور والهبوط والعمل. شغّل التسلسل أو اختر محطة؛ يمكنك إيقافه وتغيير سرعته وتحريك المرحلة يدويًا.", "The Mission tab covers launch, cruise, landing and surface operations. Play the sequence or select a milestone, then pause, adjust the speed or scrub through the phase."),
          ],
        ].map(([n, t, p]) => (
          <article key={n}>
            <span>{n}</span>
            <div>
              <h2>{t}</h2>
              <p>{p}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="guide-notes">
        <div>
          <h2>{t("على شاشة الهاتف", "On a phone")}</h2>
          <p>
            {t("اسحب بإصبع للدوران، وبإصبعين للتقريب. أخفِ تفاصيل المهمة لإفساح مجال للرؤية، وأظهرها عند القراءة. أدوات المشي والطيران تبقى داخل شاشة الاستكشاف.", "Drag with one finger to rotate and pinch to zoom. Hide mission details for a clearer view. Walking and flying controls are available in Explore.")}
          </p>
        </div>
        <div>
          <h2>{t("دقة التضاريس والحركة", "Terrain and animation accuracy")}</h2>
          <p>
            {t("الصور والمجسّمات من مصادر المهمة. التضاريس المحلية والحركة السينمائية توضيحية؛ ليست تسجيلًا فعليًا للرحلة أو مسحًا دقيقًا لكل موقع. يبقى مصدر الإحداثيات وحدود دقتها ظاهرين في كل سجل.", "Photos and models come from mission sources. Local terrain and animations are illustrative. Each record documents the coordinate source and its limitations.")}
          </p>
        </div>
      </section>
      <NasaGallery mission="insight" compact />
      <div className="guide-start">
        <a className="action action-solid" href="#/explore">
          {t("ابدأ الاستكشاف", "Start exploring")} <Arrow />
        </a>
        <a className="action action-line" href="#/archive">
          {t("ابدأ بالقراءة", "Read the mission records")} <Arrow />
        </a>
      </div>
    </main>
  );
}
export function SiteFooter({ onSources }: { onSources: () => void }) {
  const { t } = useEditorialCopy();
  return (
    <footer className="site-footer">
      <div>
        <strong>{t("الإشارة الأخيرة", "The Last Signal")}</strong>
        <span>{t("دليل علمي لمعدات القمر والمريخ.", "A guide to equipment on the Moon and Mars.")}</span>
        <small>{t("مشروع تعليمي مستقل · غير تابع لناسا", "Independent educational project · Unaffiliated with NASA")}</small>
      </div>
      <div>
        <a href="#/archive">{t("أرشيف المهمات", "Mission archive")}</a>
        <a href="#/guide">{t("دليل الرحلة", "Explorer guide")}</a>
        <button onClick={onSources}>{t("المصادر وحدود المحاكاة ↗", "Sources and simulation limits ↗")}</button>
      </div>
      <div className="footer-credit">
        <small>{t("صور المهمات: NASA / JPL · نسب كل صورة داخل سجلها", "Mission photos: NASA / JPL · Individual credits in each record")}</small>
      </div>
    </footer>
  );
}

const explanations: Record<
  string,
  { goal: string; finding: string; ending: string }
> = {
  opportunity: {
    goal: "البحث في صخور المريخ عن أدلة على وجود الماء في الماضي.",
    finding:
      "أظهرت دراسة الصخور أدلة على أن الماء أثّر في هذه المنطقة قديمًا. وجود دليل جيولوجي على الماء لا يعني اكتشاف حياة.",
    ending:
      "حجبت العاصفة الغبارية ضوء الشمس عن الألواح، وتوقف الاتصال في يونيو 2018. أُعلنت نهاية المهمة في فبراير 2019.",
  },
  spirit: {
    goal: "دراسة صخور فوهة غوسيف وتربتها لفهم البيئة التي تشكّلت فيها.",
    finding:
      "درست العربة المعادن والصخور، وصعدت تلال كولومبيا. يربط سجلها الزمني بين انتقالها في الموقع والمراحل المختلفة للاستكشاف.",
    ending:
      "علقت العجلات في تربة رخوة عند تروي خلال 2009. كان آخر اتصال في مارس 2010، ثم انتهت محاولات استعادته في مايو 2011.",
  },
  insight: {
    goal: "دراسة باطن المريخ من موقع ثابت، باستخدام قياسات زلزالية بدلًا من التجول على السطح.",
    finding:
      "سجل مقياس الزلازل اهتزازات مريخية؛ تساعد الموجات الزلزالية العلماء على دراسة البنية الداخلية للكوكب.",
    ending:
      "تراكم الغبار على الألواح الشمسية وخفّض الطاقة. كان آخر اتصال في ديسمبر 2022، وبقي المسبار في موقع هبوطه.",
  },
  ingenuity: {
    goal: "اختبار إمكانية الطيران المتحكّم به والمزوّد بالطاقة في جو المريخ.",
    finding:
      "نجحت أول رحلة في أبريل 2021، ثم توسعت التجربة إلى عمليات واستطلاع. كانت تجربة هندسية للطيران، وليست مختبرًا لتحليل الصخور.",
    ending:
      "تضررت شفرات المروحية خلال هبوط الرحلة 72 في يناير 2024، فتوقفت قدرتها على الطيران. لا يعني ذلك أن المجسّم السليم يعرض حالتها النهائية.",
  },
  apollo: {
    goal: "إنجاز هبوط بشري على القمر ثم إعادة الطاقم إلى الأرض.",
    finding:
      "عمل الرواد على السطح، وبقيت معدات علمية منها عاكس ليزري. تسمح مراجعة تسلسل المهمة بفهم الفرق بين المعدات التي عادت وتلك التي بقيت.",
    ending:
      "غادرت مرحلة الصعود السطح للعودة إلى المدار، بينما بقيت مرحلة الهبوط. لذلك لا تمثل المركبة الكاملة في المجسّم كل ما يوجد في الموقع اليوم.",
  },
};
function MissionExplanation({ mission }: { mission: Mission }) {
  const { t, english } = useEditorialCopy();
  const explanation = (english ? englishExplanations : explanations)[mission.id];
  return (
    <section className="mission-explanation" aria-label={t("شرح المهمة", "Mission overview")}>
      <h3>{t("لماذا أُرسلت؟", "Why was it sent?")}</h3>
      <p>{explanation.goal}</p>
      <h3>{t("ما الذي نتعلمه منها؟", "What did it find?")}</h3>
      <p>{explanation.finding}</p>
      <h3>{t("كيف انتهت مهمتها؟", "How did the mission end?")}</h3>
      <p>{explanation.ending}</p>
      <a
        className="text-link"
        href={mission.source}
        target="_blank"
        rel="noreferrer"
      >
        {t("اقرأ توثيق ناسا للمهمة ↗", "Read NASA’s mission documentation ↗")}
      </a>
    </section>
  );
}
function ScienceIntroduction() {
  const { t } = useEditorialCopy();
  return (
    <section className="science-introduction page-section">
      <div className="section-heading">
        <h2>{t("ماذا وجدت المهمات؟", "What did the missions find?")}</h2>
      </div>
      <div className="science-reading">
        <article>
          <h3>{t("آثار الماء في صخور المريخ", "Evidence of water in Martian rocks")}</h3>
          <p>
            {t("لم تذهب أوبورتيونيتي لرؤية منظر المريخ فقط. درست الصخور بحثًا عن آثار الماء القديم. حملت كاميرات وأدوات لفحص الصخور على ذراعها، وساعدت نتائجها في فهم بيئة المنطقة قبل وصول العربة بزمن طويل.", "Opportunity used cameras and instruments on its robotic arm to look for signs of ancient water. Its rock measurements helped scientists reconstruct the area’s earlier environment.")}
          </p>
          <p className="reading-conclusion">
            <strong>{t("الفكرة العلمية:", "The science")}</strong> {t("نستخدم خصائص الصخور للاستدلال على بيئة تكوّنها؛ الدليل على الماء ليس دليلًا مباشرًا على الحياة.", "Rock properties provide clues about how they formed. Evidence of water alone does not establish that life was present.")}
          </p>
          <a href={missions[0].source} target="_blank" rel="noreferrer">
            {t("المصدر: NASA / Opportunity ↗", "Source: NASA / Opportunity ↗")}
          </a>
          <a className="reading-next" href="#/archive?mission=opportunity">
            {t("اقرأ التسلسل الكامل للمهمة ←", "Read the full mission timeline →")}
          </a>
        </article>
        <article>
          <h3>{t("قياس الزلازل على المريخ", "Measuring marsquakes")}</h3>
          <p>
            {t("بقي إنسايت في مكانه، لكنه حمل مقياس زلازل لقياس اهتزازات المريخ. تساعد هذه القياسات على دراسة باطن الكوكب؛ فالمسبار الثابت يستطيع الإجابة عن أسئلة تختلف عن أسئلة العربة المتحركة.", "InSight stayed at its landing site and used a seismometer to detect marsquakes. Those readings helped scientists study the planet’s interior.")}
          </p>
          <p className="reading-conclusion">
            <strong>{t("الفكرة العلمية:", "The science")}</strong> {t("نختار الأداة حسب السؤال. الحركة على السطح ليست شرطًا لكل اكتشاف.", "A stationary seismometer can answer questions that a moving rover’s instruments cannot.")}
          </p>
          <a href={missions[2].source} target="_blank" rel="noreferrer">
            {t("المصدر: NASA / InSight ↗", "Source: NASA / InSight ↗")}
          </a>
          <a className="reading-next" href="#/archive?mission=insight">
            {t("اقرأ أدوات المسبار ومحطات عمله ←", "Explore InSight’s instruments and milestones →")}
          </a>
        </article>
      </div>
      <div className="reading-note">
        <h3>{t("لماذا بقيت المعدات هناك؟", "Why did the equipment stay there?")}</h3>
        <p>
          {t("تختلف الإجابة حسب المهمة: توقفت عربات ومسابير مع فقدان الطاقة أو الاتصال، وانتهى طيران إنجينيويتي بعد تضرر شفراتها. في أبولو 11، كان ترك مرحلة الهبوط جزءًا من طريقة مغادرة السطح. لهذا نفصل في كل سجل بين نهاية العمل، وآخر اتصال، والمعدات التي بقيت فعلًا.", "Rovers and landers stopped operating when power or contact was lost. Ingenuity stopped flying after its rotor blades were damaged. Apollo 11 left its descent stage behind when the crew lifted off.")}
        </p>
        <a href="#/archive">{t("قارن بين نهايات المهمات في الأرشيف ←", "Compare how the missions ended →")}</a>
      </div>
    </section>
  );
}
