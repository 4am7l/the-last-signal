import { LanguageToggle } from "./LanguageToggle";
import { ExplorerLanguage, type Language } from "./explorer-language";
import { englishAnnualStories, englishDimensions, englishShot, missionEnglish } from "./explorer-english";
import { Home, Archive, Guide, SiteHeader, SiteFooter } from "./Experience";
import { NasaGallery } from "./NasaGallery";
import { ThemeToggle } from "./ThemeToggle";
import { PlanetLoadingIndicator } from "./PlanetLoadingIndicator";
import { parseRoute, exploreHref } from "./navigation";
import { SimulationPanel } from "./simulation";
import { MobileControls } from "./MobileControls";
import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { missions } from "./data";
import type { Mode } from "./Space";
import type { CameraCommand } from "./CameraCommands";
import { shotsFor, annualStories, dimensions } from "./journey";
import "./style.css";
import "./mobile.css";
import "./experience.css";
import "./science-theme.css";
import "./material-theme.css";
import "./nasa-gallery.css";
import "./expressive-polish.css";
import "./planet-loader.css";
import "./fullscreen-explorer.css";
const Space = lazy(() => import("./Space").then((m) => ({ default: m.Space })));
class Boundary extends React.Component<
  { children: React.ReactNode; onError?: () => void; language: Language; view: Mode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  componentDidUpdate(previous: Readonly<{ view: Mode }>) {
    if (this.state.error && previous.view !== this.props.view) {
      this.setState({ error: false });
    }
  }
  render() {
    return this.state.error ? (
      <div className="error">
        {this.props.language === "en"
          ? "This browser could not start the 3D scene. Try a browser with WebGL and graphics acceleration."
          : "لم يتمكن المتصفح من تشغيل المشهد ثلاثي الأبعاد. جرّب متصفحًا يدعم WebGL مع تسريع الرسومات."}
        <br />
        <a href="#/archive">{this.props.language === "en" ? "View mission photos and records →" : "تابع صور المهمات وسجلات الرحلات في الأرشيف ←"}</a>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [route, setRoute] = useState(() =>
    parseRoute(
      window.location.hash,
      missions.map((m) => m.id),
    ),
  );
  useEffect(() => {
    const sync = () =>
      setRoute(
        parseRoute(
          window.location.hash,
          missions.map((m) => m.id),
        ),
      );
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const [preferredLanguage, setPreferredLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("tls-explorer-language") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });
  const language = preferredLanguage;
  const english = language === "en";
  const t = (ar: string, en: string) => english ? en : ar;

  function toggleLanguage() {
    const next = english ? "ar" : "en";
    setPreferredLanguage(next);
    try {
      localStorage.setItem("tls-explorer-language", next);
    } catch {
      // The language still applies for this session.
    }
  }

  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({
    id: 0,
    kind: "stop",
  });
  const cameraMove = (kind: CameraCommand["kind"]) =>
    setCameraCommand((previous) => ({ id: previous.id + 1, kind }));
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [readySceneKey, setReadySceneKey] = useState<string | null>(null);
  const [failedSceneKey, setFailedSceneKey] = useState<string | null>(null);
  useEffect(() => {
    if (route.page !== "explore") {
      setReadySceneKey(null);
      setFailedSceneKey(null);
    }
  }, [route.page]);
  const [mode, setMode] = useState<Mode>(route.mode),
    [index, setIndex] = useState(() => Math.max(0, missions.findIndex((item) => item.id === route.mission))),
    [film, setFilm] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [image, setImage] = useState<string | null>(null),
    [sources, setSources] = useState(false),
    [reset, setReset] = useState(0);
  const m = missions[index],
    frames = useMemo(() => shotsFor(m), [m.id]),
    frameIndex = Math.min(frames.length - 1, Math.floor(film)),
    shot = frames[frameIndex],
    displayedShot = english ? englishShot(shot, m.id) : shot,
    missionName = english ? m.en : m.name,
    missionCopy = english ? missionEnglish[m.id] : m,
    bodyName = m.body === "moon" ? t("القمر", "Moon") : t("المريخ", "Mars"),
    progress = film - frameIndex,
    day = Date.parse(shot.date),
    event = shot,
    exact = true,
    start = Date.parse(frames[0].date),
    end = Date.parse(frames.at(-1)!.date),
    year = new Date(day).getUTCFullYear(),
    yearStory = (english ? englishAnnualStories[m.id] : annualStories(m))[year];
  const date = new Date(day).toLocaleDateString(english ? "en" : "ar-JO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  function setDay(value: number) {
    let n = 0;
    frames.forEach((f, i) => {
      if (Date.parse(f.date) <= value) n = i;
    });
    setFilm(n);
    setPlaying(false);
  }
  function select(i: number, next: Mode = "model") {
    window.location.hash = exploreHref(missions[i].id, next);
    setIndex(i);
    setFilm(0);
    setPlaying(false);
    setMode(next);
    setMobilePanelOpen(true);
    setReset((v) => v + 1);
  }
  function change(next: Mode) {
    window.location.hash = exploreHref(missions[index].id, next);
    setMode(next);
    setMobilePanelOpen(next !== "overview" && next !== "planet");
    setPlaying(false);
    setReset((v) => v + 1);
  }
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = english ? "ltr" : "rtl";
    document.title = {
      home: t("الإشارة الأخيرة — دليل معدات القمر والمريخ", "The Last Signal — Equipment on the Moon and Mars"),
      archive: t("أرشيف المهمات — الإشارة الأخيرة", "Mission Archive — The Last Signal"),
      guide: t("دليل الرحلة — الإشارة الأخيرة", "Explorer Guide — The Last Signal"),
      explore: t("الاستكشاف — الإشارة الأخيرة", "Explore — The Last Signal"),
    }[route.page];
  }, [language, route.page]);
  useEffect(() => {
    setMode(route.mode);
    setIndex(
      Math.max(
        0,
        missions.findIndex((m) => m.id === route.mission),
      ),
    );
    setFilm(0);
    setPlaying(false);
    setMobilePanelOpen(!["overview", "planet"].includes(route.mode));
    setReset((v) => v + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.page, route.mode, route.mission]);
  useEffect(() => {
    if (!image && !sources) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const items = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,[tabindex="0"]',
        ) || [],
      );
    items()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = items(),
        first = all[0],
        last = all.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [image, sources]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(now - last, 200);
      last = now;
      setFilm((f) => Math.min(frames.length - 0.001, f + (dt / 11000) * speed));
    }, 40);
    return () => clearInterval(timer);
  }, [playing, index, speed, frames.length]);
  useEffect(() => {
    if (film >= frames.length - 0.002) setPlaying(false);
  }, [film, frames.length]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImage(null);
        setSources(false);
        setPlaying(false);
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  const sceneKey = mode === "overview"
    ? `overview:${m.body}`
    : `${mode === "story" ? "story" : "surface"}:${m.body}:${m.id}`;
  const sceneLoading = readySceneKey !== sceneKey && failedSceneKey !== sceneKey;
  const years = Object.keys(annualStories(m)).map(Number);
  return (
    <ExplorerLanguage.Provider value={language}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {t("تجاوز إلى المحتوى", "Skip to content")}
      </a>
      {route.page !== "explore" && (
        <SiteHeader page={route.page} onSources={() => setSources(true)} onLanguageToggle={toggleLanguage} />
      )}
      {route.page === "home" && <Home />}
      {route.page === "archive" && (
        <Archive
          key={route.mission}
          initialMission={
            new URLSearchParams(window.location.hash.split("?")[1]).get(
              "mission",
            ) || undefined
          }
        />
      )}{" "}
      {route.page === "guide" && <Guide />}
      {route.page === "explore" && (
        <div className="exploration-page fullscreen-explorer">
          <header className="fullscreen-toolbar">
            <a className="action action-line" href="#/">
              <span aria-hidden="true">{english ? "←" : "→"}</span> {t("الرئيسية", "Home")}
            </a>
            <nav className="body-picker" aria-label={t("وجهة المحاكاة", "Simulation destination")}>
              {([
                ["moon", "apollo", t("القمر", "Moon")],
                ["mars", "opportunity", t("المريخ", "Mars")],
              ] as const).map(([body, mission, label]) => (
                <a
                  key={body}
                  href={exploreHref(mission, "overview")}
                  aria-current={m.body === body ? "true" : undefined}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="fullscreen-toolbar__actions">
              <LanguageToggle onToggle={toggleLanguage} />
              <ThemeToggle />
            </div>
          </header>
          <div className="explorer-navigation">
            {mode === "overview" ? (
              <div className="explorer-entry">
                <h1 className="explorer-visually-hidden">{bodyName}</h1>
                <a className="action action-solid" href={exploreHref(m.id, "planet")}>
                  {t("مواقع المهمات", "Mission sites")} <span aria-hidden="true">{english ? "→" : "←"}</span>
                </a>
              </div>
            ) : (
              <nav className="breadcrumb" aria-label={t("مسار الاستكشاف", "Exploration path")}>
                {mode === "planet" ? (
                  <>
                    <button onClick={() => change("overview")}>{t("الأجرام", "Moon and Mars")}</button>
                    <span aria-hidden="true">/</span>
                    <span>{bodyName}</span>
                  </>
                ) : (
                  <button
                    type="button"
                    className="explorer-back"
                    aria-label={t(`رجوع إلى منظر ${bodyName} الكامل`, `Back to the full ${bodyName} view`)}
                    onClick={() => change("planet")}
                  >
                    <span aria-hidden="true">{english ? "←" : "→"}</span>
                    {t("رجوع", "Back")}
                  </button>
                )}
                <span aria-hidden="true">/</span>
                <span className="breadcrumb__current">
                  {mode === "planet" ? t("اختر مهمة", "Select a mission") : missionName}
                </span>
              </nav>
            )}
            <details className="explorer-resources">
              <summary>{t("أرشيف وصور", "Archive and photos")}</summary>
              <div className="explorer-resources__content">
                <a className="text-link" href={`#/archive?mission=${m.id}`}>
                  {t("سجل " + missionName + " ←", missionName + " record →")}
                </a>
                <button className="source-link" onClick={() => setSources(true)}>
                  {t("المصادر والدقة", "Sources and accuracy")}
                </button>
                <NasaGallery mission={m.id} compact />
              </div>
            </details>
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className={`universe ${mode}${mobilePanelOpen ? " has-panel" : ""}`}
          >
            <div className="canvas" aria-busy={sceneLoading}>
              <Boundary key={sceneKey} view={mode} language={language} onError={() => setFailedSceneKey(sceneKey)}>
                <Suspense fallback={null}>
                  <Space
                    mode={mode}
                    m={m}
                    day={day}
                    shot={shot}
                    progress={progress}
                    journeyProgress={film / frames.length}
                    onWorld={(b) => select(b === "mars" ? 0 : 4, "planet")}
                    onMission={(i) => select(i, "location")}
                    reset={reset}
                    overviewBody={m.body}
                    language={language}
                    cameraCommand={cameraCommand}
                    sceneKey={sceneKey}
                    onSceneReady={setReadySceneKey}
                  />
                </Suspense>
              </Boundary>
            </div>
            {sceneLoading && (
              <PlanetLoadingIndicator key={sceneKey} body={m.body} mission={mode === "overview" ? undefined : missionName} />
            )}
            {mode !== "overview" && (
              <>
                {mode === "planet" ? (
                  <section className="welcome">
                    <h1>{bodyName}</h1>
                    <p>
                      {t("اسحب للدوران، وقرّب بإصبعين أو بعجلة الفأرة. اختر موقع مهمة وتابع التقريب إلى المعدات. أي سحب يوقف حركة الكاميرا التلقائية. العلامات تمثل مواقع الهبوط المشار إليها بمصادرها.", "Drag to rotate. Pinch or use the mouse wheel to zoom. Choose a landing site to explore its equipment. Dragging pauses the automatic camera motion.")}
                    </p>
                    {m.body === "moon" && (
                      <p className="disclosure">
                        {t("قطر القمر المرجعي: ٣٬٤٧٤٫٨ كم. يعرض هذا المشهد القمر وحده، مع تضاريس صغيرة توضيحية قرب المعدات.", "Reference Moon diameter: 3,474.8 km. Small terrain features near the equipment are illustrative.")}
                      </p>
                    )}
                    <div className="missionList">
                      {missions.map(
                        (x, i) =>
                          x.body === m.body && (
                            <button
                              key={x.id}
                              onClick={() => select(i, "location")}
                            >
                              <span>{english ? x.en : x.name}</span>
                              <small>{english ? "↗" : x.en + " ↗"}</small>
                            </button>
                          ),
                      )}
                    </div>
                  </section>
                ) : (
                  <aside
                    className={
                      "information " +
                      (mobilePanelOpen ? "mobile-expanded" : "mobile-collapsed")
                    }
                  >
                    <button
                      className="mobileSheetToggle"
                      aria-expanded={mobilePanelOpen}
                      onClick={() => setMobilePanelOpen((v) => !v)}
                    >
                      <span className="mobileSheetGrip" />
                      {mobilePanelOpen
                        ? t("إخفاء تفاصيل المهمة", "Hide mission details")
                        : t("عرض تفاصيل " + m.name, "Show " + m.en + " details")}
                      <span aria-hidden="true">
                        {mobilePanelOpen ? "⌄" : "⌃"}
                      </span>
                    </button>
                    {!english && <div className="eyebrow">{m.en}</div>}
                    <h2>{missionName}</h2>
                    <p>{missionCopy.intro}</p>
                    <div className="tabs">
                      {(
                        [
                          ["story", t("الرحلة", "Mission")],
                          ["model", t("المجسّم", "3D model")],
                          ["location", t("الموقع", "Location")],
                        ] as const
                      ).map(([v, t]) => (
                        <button
                          key={v}
                          className={mode === v ? "active" : ""}
                          onClick={() => change(v)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {mode === "story" ? (
                      <article aria-live="polite">
                        <span className="date">{date}</span>
                        <h3>{displayedShot.title}</h3>
                        <div className="missionMessage">
                          <span>
                            {t("سجل المهمة ·", "Mission log ·")}{" "}
                            {shot.phase === "end"
                              ? t("انتهى الاتصال", "End of operations")
                              : t("إعادة سرد", "Reconstruction")}
                          </span>
                          <p>{displayedShot.text}</p>
                          <a
                            href={shot.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("مصدر هذه المرحلة ↗", "Source for this phase ↗")}
                          </a>
                        </div>
                        {yearStory && (
                          <div className="yearStory">
                            <small>
                              {t(`قصة عام ${year} · ملخص سنوي`, `${year} · Annual summary`)}
                            </small>
                            <h3>{yearStory[0]}</h3>
                            <p>{yearStory[1]}</p>
                          </div>
                        )}
                        {!exact && (
                          <small>
                            أحدث محطة موثّقة قبل التاريخ المختار: {event.date}.
                            لا تتوفر نقطة تتبع يومية هنا.
                          </small>
                        )}
                        <p className="disclosure">
                          {t("نماذج الصاروخ والغلاف والرافعة والقاعدة القمرية مبسطة. تسلسل النقل والهبوط مستند إلى المصادر؛ الحركة ليست بيانات ملاحة أو مسار عجلات موثّقاً.", "The rocket, aeroshell, sky crane and lunar base are simplified. The animation reconstructs mission phases from published sources.")}
                        </p>
                      </article>
                    ) : mode === "location" ? (
                      <>
                        <p>
                          {t("قرّب بعجلة الفأرة أو بإصبعين للوصول مباشرة إلى المعدات على سطح الجرم، دون زر نزول.", "Zoom with the mouse wheel or pinch to approach the equipment on the surface.")}
                        </p>
                        <h3>{missionCopy.site}</h3>
                        <div className="coordinates" dir="ltr">
                          {Math.abs(m.lat)}° {m.lat < 0 ? "S" : "N"} / {m.lon}°
                          E
                        </div>
                        <p className="disclosure">{missionCopy.frame}</p>
                        <a
                          href={m.locationSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("مصدر الإحداثيات ↗", "Coordinate source ↗")}
                        </a>
                        <h3>{t("أين توجد الآن؟", "Where is it now?")}</h3>
                        <p>{missionCopy.final}</p>
                        <a
                          href={m.finalSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("الموقع الأخير في السجل الرسمي ↗", "Final location in the official record ↗")}
                        </a>
                        {m.id === "opportunity" && (
                          <button
                            className="photo"
                            onClick={() =>
                              setImage("/photos/opportunity-map.jpg")
                            }
                          >
                            <img
                              src="/photos/opportunity-map.jpg"
                              alt={t("خريطة ناسا لمسار أوبورتيونيتي وموقع الاتصال الأخير", "NASA map of Opportunity’s traverse and last contact site")}
                            />
                            <span>{t("افتح خريطة الموقع النهائي ⤢", "Open the final location map ⤢")}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <h3>{t("المعدات وسط أفق الكوكب", "Equipment on the surface")}</h3>
                        <a
                          href={dimensions[m.model].source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {english ? englishDimensions[m.model] : dimensions[m.model].label} · {t("مصدر القياس ↗", "Measurement source ↗")}
                        </a>
                        <p>{missionCopy.detail}</p>
                        <p className="disclosure">
                          {t("اسحب لتدوير المجسّم، واستعمل عجلة الفأرة أو إصبعين للتقريب. المجسّم مضبوط على البعد المنشور. على القمر يظهر مجسّم إيغل التاريخي على الكرة نفسها؛ مرحلة الصعود غادرت لاحقاً. الصخور والأرضية بيئة توضيحية وليست مسحاً للموقع.", "Drag to rotate the model. Pinch or scroll to zoom. Equipment is scaled to published dimensions and local terrain is illustrative.")}
                        </p>
                        <a
                          href={m.modelSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("مجسّم ناسا الأصلي ومصدره ↗", "Original NASA model ↗")}
                        </a>
                        <button
                          className="primary"
                          onClick={() => select(index, "story")}
                        >
                          {t("افتح قصة الرحلة ▶", "Watch the mission ▶")}
                        </button>
                      </>
                    )}
                    <button
                      className="photo"
                      onClick={() => setImage(`/photos/${m.id}.jpg`)}
                    >
                      <img src={`/photos/${m.id}.jpg`} alt={missionCopy.photoCaption} />
                      <span>{t("عرض الصورة كاملة ⤢", "View full photo ⤢")}</span>
                    </button>
                    <small>{missionCopy.photoCaption}</small>
                  </aside>
                )}
              </>
            )}
            <MobileControls
              mode={mode}
              panelOpen={mobilePanelOpen}
              onCamera={cameraMove}
              onReset={() => setReset((v) => v + 1)}
              onFocus={() => change("model")}
              onTogglePanel={() => setMobilePanelOpen((v) => !v)}
            />
            <SimulationPanel />
            <div className="sceneTools">
              <div
                className="cameraButtons"
                role="group"
                aria-label={t("تحكم الكاميرا", "Camera controls")}
              >
                <button
                  aria-label={t("تقريب الكاميرا", "Zoom in")}
                  title={t("تقريب · + بعد اختيار المشهد", "Zoom in · + with the scene focused")}
                  onClick={() => cameraMove("in")}
                >
                  ＋
                </button>
                <button
                  aria-label={t("إبعاد الكاميرا", "Zoom out")}
                  title={t("إبعاد · − بعد اختيار المشهد", "Zoom out · − with the scene focused")}
                  onClick={() => cameraMove("out")}
                >
                  −
                </button>
                <button onClick={() => cameraMove("stop")}>{t("إيقاف الحركة", "Stop camera")}</button>
                {mode !== "overview" && mode !== "story" && (
                  <button onClick={() => change("model")}>{t("تركيز المعدة", "Focus on equipment")}</button>
                )}
              </div>
              <button onClick={() => setReset((v) => v + 1)}>
                {t("إعادة ضبط الكاميرا ⤾", "Reset camera ⤾")}
              </button>
            </div>
          </main>
          {mode === "story" && (
            <details className="timebar explorer-timeline">
              <summary>{t("مراحل الرحلة", "Mission timeline")}</summary>
              <div className="timeTop">
                <button
                  className="play"
                  onClick={() => {
                    if (film >= frames.length - 0.002) setFilm(0);
                    setPlaying((v) => !v);
                  }}
                >
                  {playing ? t("Ⅱ إيقاف", "Ⅱ Pause") : t("▶ تشغيل", "▶ Play")}
                </button>
                <strong>{date}</strong>
                <label>
                  {t("سرعة العرض", "Playback speed")}{" "}
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={4}>4×</option>
                  </select>
                </label>
                <button
                  onClick={() => {
                    setFilm(frames.length - 0.001);
                    setPlaying(false);
                  }}
                >
                  {t("نهاية الرحلة ↗", "End of mission ↗")}
                </button>
              </div>
              <div className="filmControls">
                <span>{t("تفاصيل المرحلة:", "Phase:")} {displayedShot.title}</span>
                <input
                  dir="ltr"
                  type="range"
                  aria-label={t("تقدم المشهد المتحرك", "Animation progress")}
                  min={0}
                  max={0.999}
                  step={0.001}
                  value={progress}
                  onChange={(e) => {
                    setPlaying(false);
                    setFilm(frameIndex + Number(e.target.value));
                  }}
                />
                <small>{t("اسحب لترى الإقلاع أو الفصل أو الهبوط خطوة بخطوة.", "Drag to step through launch, separation or landing.")}</small>
              </div>
              <input
                dir="ltr"
                aria-label={t("تاريخ الرحلة", "Mission date")}
                type="range"
                min={start}
                max={end}
                step={86400000}
                value={day}
                onChange={(e) => {
                  setPlaying(false);
                  setDay(Number(e.target.value));
                }}
              />
              <div className="yearTicks" dir="ltr">
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setPlaying(false);
                      setFilm(
                        Math.max(
                          0,
                          frames.findIndex(
                            (f) => Number(f.date.slice(0, 4)) === y,
                          ),
                        ),
                      );
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="chapters">
                {frames.map((x, i) => (
                  <button
                    key={`${x.date}-${i}`}
                    className={frameIndex === i ? "selected" : ""}
                    onClick={() => {
                      setPlaying(false);
                      setFilm(i);
                    }}
                  >
                    <small>{x.date}</small>
                    {english ? englishShot(x, m.id).title : x.title}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
      {route.page !== "explore" && (
        <SiteFooter onSources={() => setSources(true)} />
      )}
      {image && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("الصورة الكاملة", "Full photo")}
        >
          <button className="close" onClick={() => setImage(null)}>
            {t("إغلاق ×", "Close ×")}
          </button>
          <img
            className="fullImage"
            src={image}
            alt={
              image.includes("map")
                ? t("خريطة المسار النهائي لأوبورتيونيتي", "Opportunity’s final traverse map")
                : missionCopy.photoCaption
            }
          />
        </div>
      )}
      {sources && (
        <div className="overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("المصادر والدقة", "Sources and accuracy")}
          >
            <button className="close" onClick={() => setSources(false)}>
              {t("إغلاق ×", "Close ×")}
            </button>
            <h2>{t("المصادر وحدود المحاكاة", "Sources and simulation limits")}</h2>
            <p>
              {t("مجسّمات المركبات وصور المهمات من ناسا وJPL. ارتفاعات القمر الأساسية من NASA LRO، وتُحمّل خرائط ألوان 8K من Solar System Scope تدريجيًا عند توفرها. خريطة JPEG الحالية تعرض شكل التضاريس العام، ولا تعطي ارتفاعات معايرة بالمتر. يعرض الموقع القمر والمريخ فقط، أما حفر وصخور الموقع الصغيرة فهي توضيحية. تضاريس المريخ والجبال والحفر المحلية على الجرمين توضيحية وليست مسحًا لمواقع المهمات. عرض الاستكشاف يضغط المسافات؛ وضع المقياس الفعلي يستخدم متوسط مسافة القمر ومثالًا لمسافة المريخ (٢٢٥ مليون كم)، وليس بيانات مدارية حية. مسافة المريخ تتغير مع المدار.", "NASA and JPL provide mission photos and models. Lunar elevation data comes from NASA LRO. Color textures from Solar System Scope are loaded when available. The rendered terrain near mission sites is an educational reconstruction.")}
            </p>
            <p>
              {t("الشريط يعرض تسلسل المحطات المؤرخة من الانطلاق إلى نهاية المهمة. كل مرحلة لها وقت عرض مستقل، مع ملخص لكل سنة. الرسائل إعادة سرد تعليمية وليست اتصالات مقتبسة. الحركة ليست بيانات SPICE أو إعادة بناء لمسارات العجلات أو الرحلات الـ72.", "The timeline follows documented mission events. The animations and mission messages are educational reconstructions.")}
            </p>
            <p>
              {t("الإحداثيات تحمل اسم مرجعها وتميز موقع الهبوط عن الموقع الأخير. لا ندعي إحداثيات نهائية دقيقة عندما لا توجد بيانات موثّقة مدمجة.", "Each record cites its coordinate reference and identifies the landing site and last known location.")}
            </p>
            {missions.map((x) => (
              <div key={x.id}>
                <h3>{english ? x.en : x.name}</h3>
                <a href={x.source} target="_blank" rel="noreferrer">
                  {t("تاريخ المهمة ↗", "Mission history ↗")}
                </a>{" "}
                ·{" "}
                <a href={x.modelSource} target="_blank" rel="noreferrer">
                  {t("المجسّم ↗", "3D model ↗")}
                </a>{" "}
                ·{" "}
                <a href={x.locationSource} target="_blank" rel="noreferrer">
                  {t("إحداثيات الهبوط ↗", "Landing coordinates ↗")}
                </a>{" "}
                ·{" "}
                <a href={x.finalSource} target="_blank" rel="noreferrer">
                  {t("آخر موقع ↗", "Final location ↗")}
                </a>
              </div>
            ))}
            <p>
              {t("يعرض المختبر جرمًا واحدًا بخلفية محايدة دون نجوم أو مشهد للمجموعة الشمسية. أحجام النماذج في شاشة الاختيار موحّدة للفحص ولا تمثل مقارنة للأحجام الفعلية. تضاريس مواقع المعدات إعادة بناء تعليمية وليست مسحًا دقيقًا كاملًا.", "Moon and Mars are shown separately at a normalized display scale.")}
            </p>
            <p>
              {t("تستخدم إضاءة السطح اتجاهات مبنية على JPL Horizons مع حسابات تقريبية عند التعذر. إضاءة فحص النماذج محسّنة لإظهار التفاصيل.", "Surface lighting uses directions based on JPL Horizons with approximate calculations when unavailable. Inspection lighting improves model visibility.")}
            </p>
            <p>
              Mars texture:{" "}
              <a
                href="https://science.nasa.gov/3d-resources/mars/"
                target="_blank"
                rel="noreferrer"
              >
                NASA/JPL-Caltech/USGS Viking planetary mosaic
              </a>
              . Moon:{" "}
              <a
                href="https://svs.gsfc.nasa.gov/4720/"
                target="_blank"
                rel="noreferrer"
              >
                NASA CGI Moon Kit · LROC / LOLA
              </a>
              .
            </p>
          </section>
        </div>
      )}
    </ExplorerLanguage.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
