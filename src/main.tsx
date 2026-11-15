import { Home, Archive, Guide, SiteHeader, SiteFooter } from "./Experience";
import { NasaGallery } from "./NasaGallery";
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
const Space = lazy(() => import("./Space").then((m) => ({ default: m.Space })));
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="error">
        لم يتمكن المتصفح من تشغيل المشهد ثلاثي الأبعاد. جرّب متصفحًا يدعم WebGL مع
        تسريع الرسومات.
        <br />
        <a href="#/archive">تابع صور المهمات وسجلات الرحلات في الأرشيف ←</a>
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

  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({
    id: 0,
    kind: "stop",
  });
  const cameraMove = (kind: CameraCommand["kind"]) =>
    setCameraCommand((previous) => ({ id: previous.id + 1, kind }));
  const [overviewBody, setOverviewBody] = useState<"earth" | "moon" | "mars">(
    "earth",
  );
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("overview"),
    [index, setIndex] = useState(0),
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
    progress = film - frameIndex,
    day = Date.parse(shot.date),
    event = shot,
    exact = true,
    start = Date.parse(frames[0].date),
    end = Date.parse(frames.at(-1)!.date),
    year = new Date(day).getUTCFullYear(),
    yearStory = annualStories(m)[year];
  const date = new Date(day).toLocaleDateString("ar-JO", {
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
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);
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
    document.title = {
      home: "الإشارة الأخيرة — دليل معدات القمر والمريخ",
      archive: "أرشيف المهمات — الإشارة الأخيرة",
      guide: "دليل الرحلة — الإشارة الأخيرة",
      explore: "الاستكشاف — الإشارة الأخيرة",
    }[route.page];
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
  const years = Object.keys(annualStories(m)).map(Number);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        تجاوز إلى المحتوى
      </a>
      <SiteHeader page={route.page} onSources={() => setSources(true)} />
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
        <div className="exploration-page">
          <div className="explore-toolbar">
            <div>
              <span className="pulse-dot" /> غرفة الاستكشاف{" "}
              <small>INTERACTIVE OBSERVATORY</small>
            </div>
            <nav aria-label="وجهة المحاكاة">
              <a
                href={exploreHref(m.id, "overview")}
                aria-current={mode === "overview" ? "page" : undefined}
              >
                الكواكب
              </a>
              <a
                href={exploreHref("opportunity", "planet")}
                aria-current={
                  m.body === "mars" && mode !== "overview" ? "page" : undefined
                }
              >
                المريخ
              </a>
              <a
                href={exploreHref("apollo", "planet")}
                aria-current={
                  m.body === "moon" && mode !== "overview" ? "page" : undefined
                }
              >
                القمر
              </a>
            </nav>
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className={`universe ${mode}${mobilePanelOpen ? " has-panel" : ""}`}
          >
            <div
              key={`${mode}-${m.id}`}
              className="scene-arrival"
              aria-hidden="true"
            >
              <span className="arrival-line" />
              <small>
                THE LAST SIGNAL /{" "}
                {mode === "overview" ? "OBSERVATORY" : m.en.toUpperCase()}
              </small>
              <strong>
                {mode === "overview"
                  ? "استكشف جرمًا واحدًا"
                  : mode === "planet"
                    ? m.body === "moon"
                      ? "في مدار القمر"
                      : "في مدار المريخ"
                    : m.name}
              </strong>
              <span className="arrival-line" />
            </div>
            <div className="canvas">
              <Boundary>
                <Suspense
                  fallback={<div className="loading">جارٍ تجهيز الرحلة…</div>}
                >
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
                    overviewBody={overviewBody}
                    cameraCommand={cameraCommand}
                  />
                </Suspense>
              </Boundary>
            </div>
            {mode === "overview" ? (
              <section className="welcome body-study-panel">
                <div className="eyebrow">
                  مختبر الكواكب · نموذج ثلاثي الأبعاد
                </div>
                <h1>
                  {overviewBody === "earth"
                    ? "الأرض"
                    : overviewBody === "moon"
                      ? "القمر"
                      : "المريخ"}
                </h1>
                <p>جرم واحد، بتفاصيله. اسحب لتدوير النموذج وقرّب لفحص السطح.</p>
                <div
                  className="body-picker"
                  role="group"
                  aria-label="اختر الجرم"
                >
                  {(
                    [
                      ["earth", "الأرض"],
                      ["moon", "القمر"],
                      ["mars", "المريخ"],
                    ] as const
                  ).map(([body, label]) => (
                    <button
                      key={body}
                      aria-pressed={overviewBody === body}
                      onClick={() => setOverviewBody(body)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {overviewBody !== "earth" && (
                  <button
                    className="primary"
                    onClick={() =>
                      select(overviewBody === "mars" ? 0 : 4, "planet")
                    }
                  >
                    استكشف السطح والمعدات ↗
                  </button>
                )}
                <p className="hint">
                  حجم العرض موحّد لتسهيل الفحص؛ ليس مقارنة بين الأحجام الحقيقية.
                  الأرض متاحة للدوران والفحص، والهبوط متاح للقمر والمريخ.
                </p>
              </section>
            ) : (
              <>
                <div className="breadcrumb">
                  <button onClick={() => change("overview")}>الكواكب</button>
                  <span>/</span>
                  <button onClick={() => change("planet")}>
                    {m.body === "mars" ? "المريخ" : "القمر"}
                  </button>
                  <span>/</span>
                  <span>{mode === "planet" ? "اختر مهمة" : m.name}</span>
                </div>
                {mode === "planet" ? (
                  <section className="welcome">
                    <div className="eyebrow">أطلس المعدات البشرية</div>
                    <h1>{m.body === "mars" ? "المريخ" : "القمر"}</h1>
                    <p>
                      اسحب للدوران، وقرّب بإصبعين أو بعجلة الفأرة. اختر موقع مهمة
                      وتابع التقريب إلى المعدات. أي سحب يوقف حركة الكاميرا
                      التلقائية.
                      <br />
                      العلامات تمثل مواقع الهبوط المشار إليها بمصادرها.
                    </p>
                    {m.body === "moon" && (
                      <p className="disclosure">
                        قطر القمر المرجعي: ٣٬٤٧٤٫٨ كم · الأرض أكبر منه بنحو ٣٫٦٧
                        مرة في القطر. يعرض هذا المشهد القمر وحده. الحفر الصغيرة
                        قرب المعدات توضيحية.
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
                              <span>{x.name}</span>
                              <small>{x.en} ↗</small>
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
                        ? "إخفاء تفاصيل المهمة"
                        : "عرض تفاصيل " + m.name}
                      <span aria-hidden="true">
                        {mobilePanelOpen ? "⌄" : "⌃"}
                      </span>
                    </button>
                    <div className="eyebrow">{m.en} / أرشيف المهمة</div>
                    <h2>{m.name}</h2>
                    <p>{m.intro}</p>
                    <div className="tabs">
                      {(
                        [
                          ["story", "الرحلة"],
                          ["model", "المجسّم"],
                          ["location", "الموقع"],
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
                        <h3>{event.title}</h3>
                        <div className="missionMessage">
                          <span>
                            سجل المهمة ·{" "}
                            {shot.phase === "end"
                              ? "انتهى الاتصال"
                              : "إعادة سرد"}
                          </span>
                          <p>{shot.text}</p>
                          <a
                            href={shot.source}
                            target="_blank"
                            rel="noreferrer"
                          >
                            مصدر هذه المرحلة ↗
                          </a>
                        </div>
                        {yearStory && (
                          <div className="yearStory">
                            <small>
                              قصة عام {year} · ملخص سنوي، لا حدث مؤرخ في الأول
                              من يناير
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
                          نماذج الصاروخ والغلاف والرافعة والقاعدة القمرية مبسطة.
                          تسلسل النقل والهبوط مستند إلى المصادر؛ الحركة ليست
                          بيانات ملاحة أو مسار عجلات موثّقاً.
                        </p>
                      </article>
                    ) : mode === "location" ? (
                      <>
                        <p>
                          قرّب بعجلة الفأرة أو بإصبعين للوصول مباشرة إلى المعدات
                          على سطح الجرم، دون زر نزول.
                        </p>
                        <h3>{m.site}</h3>
                        <div className="coordinates" dir="ltr">
                          {Math.abs(m.lat)}° {m.lat < 0 ? "S" : "N"} / {m.lon}°
                          E
                        </div>
                        <p className="disclosure">{m.frame}</p>
                        <a
                          href={m.locationSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          مصدر الإحداثيات ↗
                        </a>
                        <h3>أين توجد الآن؟</h3>
                        <p>{m.final}</p>
                        <a
                          href={m.finalSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          الموقع الأخير في السجل الرسمي ↗
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
                              alt="خريطة ناسا لمسار أوبورتيونيتي وموقع الاتصال الأخير"
                            />
                            <span>افتح خريطة الموقع النهائي ⤢</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <h3>المعدات وسط أفق الكوكب</h3>
                        <a
                          href={dimensions[m.model].source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {dimensions[m.model].label} · مصدر القياس ↗
                        </a>
                        <p>{m.detail}</p>
                        <p className="disclosure">
                          اسحب لتدوير المجسّم، واستعمل عجلة الفأرة أو إصبعين
                          للتقريب. المجسّم مضبوط على البعد المنشور. على القمر
                          يظهر مجسّم إيغل التاريخي على الكرة نفسها؛ مرحلة الصعود
                          غادرت لاحقاً. الصخور والأرضية بيئة توضيحية وليست مسحاً
                          للموقع.
                        </p>
                        <a
                          href={m.modelSource}
                          target="_blank"
                          rel="noreferrer"
                        >
                          مجسّم ناسا الأصلي ومصدره ↗
                        </a>
                        <button
                          className="primary"
                          onClick={() => select(index, "story")}
                        >
                          افتح قصة الرحلة ▶
                        </button>
                      </>
                    )}
                    <button
                      className="photo"
                      onClick={() => setImage(`/photos/${m.id}.jpg`)}
                    >
                      <img src={`/photos/${m.id}.jpg`} alt={m.photoCaption} />
                      <span>عرض الصورة كاملة ⤢</span>
                    </button>
                    <small>{m.photoCaption}</small>
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
                aria-label="تحكم الكاميرا"
              >
                <button
                  aria-label="تقريب الكاميرا"
                  title="تقريب · + بعد اختيار المشهد"
                  onClick={() => cameraMove("in")}
                >
                  ＋
                </button>
                <button
                  aria-label="إبعاد الكاميرا"
                  title="إبعاد · − بعد اختيار المشهد"
                  onClick={() => cameraMove("out")}
                >
                  −
                </button>
                <button onClick={() => cameraMove("stop")}>إيقاف الحركة</button>
                {mode !== "overview" && mode !== "story" && (
                  <button onClick={() => change("model")}>تركيز المعدة</button>
                )}
              </div>
              <button onClick={() => setReset((v) => v + 1)}>
                إعادة ضبط الكاميرا ⤾
              </button>
              <span>
                {mode === "overview"
                  ? "نموذج مستقل · حجم عرض موحّد"
                  : mode === "planet" || mode === "location"
                    ? "أطلس مداري · علامات بإحداثيات الهبوط"
                    : "أفق ممتد · تضاريس محلية توضيحية"}
              </span>
            </div>
          </main>
          {mode === "story" && (
            <section className="timebar">
              <div className="timeTop">
                <button
                  className="play"
                  onClick={() => {
                    if (film >= frames.length - 0.002) setFilm(0);
                    setPlaying((v) => !v);
                  }}
                >
                  {playing ? "Ⅱ إيقاف" : "▶ تشغيل"}
                </button>
                <strong>{date}</strong>
                <label>
                  سرعة العرض{" "}
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
                  نهاية الرحلة ↗
                </button>
              </div>
              <div className="filmControls">
                <span>تفاصيل المرحلة: {shot.title}</span>
                <input
                  dir="ltr"
                  type="range"
                  aria-label="تقدم المشهد المتحرك"
                  min={0}
                  max={0.999}
                  step={0.001}
                  value={progress}
                  onChange={(e) => {
                    setPlaying(false);
                    setFilm(frameIndex + Number(e.target.value));
                  }}
                />
                <small>اسحب لترى الإقلاع أو الفصل أو الهبوط خطوة بخطوة.</small>
              </div>
              <input
                dir="ltr"
                aria-label="تاريخ الرحلة"
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
                    {x.title}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="archive">
            <div className="archiveTop">
              <span>معدات بعيدة. قصص باقية.</span>
              <small>اختر مهمة لاستكشاف مجسّمها ورحلتها</small>
            </div>
            <div className="cards">
              {missions.map((x, i) => (
                <button
                  className={
                    "card " +
                    (index === i && mode !== "overview" ? "selected" : "")
                  }
                  key={x.id}
                  onClick={() => select(i)}
                >
                  <small>
                    {x.body === "mars" ? "المريخ" : "القمر"} / 0{i + 1}
                  </small>
                  <h3>{x.name}</h3>
                  <span>{x.en}</span>
                  <b>↗</b>
                </button>
              ))}
            </div>
          </section>
          <NasaGallery mission={m.id} compact />
        </div>
      )}
      <SiteFooter onSources={() => setSources(true)} />
      {image && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="الصورة الكاملة"
        >
          <button className="close" onClick={() => setImage(null)}>
            إغلاق ×
          </button>
          <img
            className="fullImage"
            src={image}
            alt={
              image.includes("map")
                ? "خريطة المسار النهائي لأوبورتيونيتي"
                : m.photoCaption
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
            aria-label="المصادر والدقة"
          >
            <button className="close" onClick={() => setSources(false)}>
              إغلاق ×
            </button>
            <h2>
              مصادر حقيقية.
              <br />
              ودقة موضّحة.
            </h2>
            <p>
              مجسّمات المركبات وصور المهمات من ناسا وJPL. ارتفاعات القمر الأساسية
              من NASA LRO، وتُحمّل خرائط ألوان 8K من Solar System Scope تدريجيًا
              عند توفرها. خريطة JPEG الحالية تعرض شكل التضاريس العام، ولا تعطي
              ارتفاعات معايرة بالمتر. أبعاد القمر والأرض والمعدات متناسبة، أما
              حفر وصخور الموقع الصغيرة فهي توضيحية. تضاريس المريخ والجبال والحفر
              المحلية على الجرمين توضيحية وليست مسحًا لمواقع المهمات. عرض
              الاستكشاف يضغط المسافات؛ وضع المقياس الفعلي يستخدم متوسط مسافة
              القمر ومثالًا لمسافة المريخ (٢٢٥ مليون كم)، وليس بيانات مدارية حية.
              مسافة المريخ تتغير مع المدار.
            </p>
            <p>
              الشريط يعرض تسلسل المحطات المؤرخة من الانطلاق إلى نهاية المهمة. كل
              مرحلة لها وقت عرض مستقل، مع ملخص لكل سنة. الرسائل إعادة سرد
              تعليمية وليست اتصالات مقتبسة. الحركة ليست بيانات SPICE أو إعادة
              بناء لمسارات العجلات أو الرحلات الـ72.
            </p>
            <p>
              الإحداثيات تحمل اسم مرجعها وتميز موقع الهبوط عن الموقع الأخير. لا
              ندعي إحداثيات نهائية دقيقة عندما لا توجد بيانات موثّقة مدمجة.
            </p>
            {missions.map((x) => (
              <div key={x.id}>
                <h3>{x.name}</h3>
                <a href={x.source} target="_blank" rel="noreferrer">
                  تاريخ المهمة ↗
                </a>{" "}
                ·{" "}
                <a href={x.modelSource} target="_blank" rel="noreferrer">
                  المجسّم ↗
                </a>{" "}
                ·{" "}
                <a href={x.locationSource} target="_blank" rel="noreferrer">
                  إحداثيات الهبوط ↗
                </a>{" "}
                ·{" "}
                <a href={x.finalSource} target="_blank" rel="noreferrer">
                  آخر موقع ↗
                </a>
              </div>
            ))}
            <p>
              يعرض المختبر جرمًا واحدًا بخلفية محايدة دون نجوم أو مشهد للمجموعة
              الشمسية. أحجام النماذج في شاشة الاختيار موحّدة للفحص ولا تمثل
              مقارنة للأحجام الفعلية. تضاريس مواقع المعدات إعادة بناء تعليمية
              وليست مسحًا دقيقًا كاملًا.
            </p>
            <p>
              تستخدم إضاءة السطح اتجاهات مبنية على JPL Horizons مع حسابات
              تقريبية عند التعذر. إضاءة فحص النماذج محسّنة لإظهار التفاصيل.
            </p>
            <p>
              Earth texture:{" "}
              <a
                href="https://www.solarsystemscope.com/textures/"
                target="_blank"
                rel="noreferrer"
              >
                Solar System Scope
              </a>{" "}
              · CC BY 4.0. Mars texture:{" "}
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
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
