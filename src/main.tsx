import { LanguageToggle } from "./LanguageToggle";
import { ExplorerLanguage, type Language } from "./explorer-language";
import { Home, Archive, Guide, SiteHeader, SiteFooter } from "./Experience";
import { ThemeToggle } from "./ThemeToggle";
import { PlanetLoadingIndicator } from "./PlanetLoadingIndicator";
import { destinations, parseRoute, exploreHref } from "./navigation";
import { SimulationPanel } from "./simulation";
import { MobileControls } from "./MobileControls";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import type { Mode } from "./Space";
import type { CameraCommand } from "./CameraCommands";
import "./style.css";
import "./mobile.css";
import "./experience.css";
import "./science-theme.css";
import "./material-theme.css";
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
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const { body, mode } = route;
  const [sources, setSources] = useState(false);
  const [reset, setReset] = useState(0);
  const [readySceneKey, setReadySceneKey] = useState<string | null>(null);
  const [failedSceneKey, setFailedSceneKey] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash));
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

  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, kind: "stop" });
  const cameraMove = (kind: CameraCommand["kind"]) =>
    setCameraCommand((previous) => ({ id: previous.id + 1, kind }));

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = english ? "ltr" : "rtl";
    document.title = {
      home: t("الإشارة الأخيرة", "The Last Signal"),
      archive: t("أرشيف المهمات — الإشارة الأخيرة", "Mission Archive — The Last Signal"),
      guide: t("دليل الاستكشاف — الإشارة الأخيرة", "Explorer Guide — The Last Signal"),
      explore: t("الاستكشاف — الإشارة الأخيرة", "Explore — The Last Signal"),
    }[route.page];
  }, [language, route.page]);

  useEffect(() => {
    if (route.page !== "explore") {
      setReadySceneKey(null);
      setFailedSceneKey(null);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.page]);

  const sceneKey = `${mode === "overview" ? "overview" : "terrain"}:${body}`;
  useEffect(() => {
    setReadySceneKey(null);
    setFailedSceneKey(null);
  }, [sceneKey]);

  useEffect(() => {
    if (!sources) return;
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
  }, [sources]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSources(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const sceneLoading = readySceneKey !== sceneKey && failedSceneKey !== sceneKey;
  const bodyName = body === "moon" ? t("القمر", "Moon") : t("المريخ", "Mars");

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
      {route.page === "archive" && <Archive />}
      {route.page === "guide" && <Guide />}
      {route.page === "explore" && (
        <div className="exploration-page fullscreen-explorer">
          <header className="fullscreen-toolbar">
            <a className="action action-line" href="#/">
              <span aria-hidden="true">{t("→", "←")}</span> {t("الرئيسية", "Home")}
            </a>
            <nav className="body-picker" aria-label={t("وجهة المحاكاة", "Simulation destination")}>
              {destinations.map((destination) => (
                <a key={destination} href={exploreHref(destination)} aria-current={body === destination ? "true" : undefined}>
                  {destination === "moon" ? t("القمر", "Moon") : t("المريخ", "Mars")}
                </a>
              ))}
            </nav>
            <div className="fullscreen-toolbar__actions">
              <LanguageToggle onToggle={toggleLanguage} />
              <ThemeToggle />
            </div>
          </header>
          <div className="explorer-navigation">
            <div className="explorer-entry">
              <h1 className="explorer-visually-hidden">{bodyName}</h1>
              {mode === "overview" && (
                <a className="action action-solid" href={exploreHref(body, "planet")}>{t("استكشف السطح", "Explore the surface")}</a>
              )}
              {mode === "planet" && (
                <a className="action action-solid" href={exploreHref(body, "surface")}>{t("انزل للسطح", "Descend to the surface")}</a>
              )}
              {mode !== "overview" && (
                <a className="action action-line" href={exploreHref(body, mode === "surface" ? "planet" : "overview")} aria-label={t("رجوع إلى منظر الجرم الكامل", "Back to the full globe")}>
                  <span aria-hidden="true">{t("→", "←")}</span> {t("رجوع", "Back")}
                </a>
              )}
            </div>
          </div>
          <main id="main-content" tabIndex={-1} className={`universe ${mode}`}>
            <div className="canvas" aria-busy={sceneLoading}>
              <Boundary key={sceneKey} view={mode} language={language} onError={() => setFailedSceneKey(sceneKey)}>
                <Suspense fallback={null}>
                  <Space mode={mode} body={body} reset={reset} cameraCommand={cameraCommand} sceneKey={sceneKey} onSceneReady={setReadySceneKey} />
                </Suspense>
              </Boundary>
            </div>
            {sceneLoading && <PlanetLoadingIndicator key={sceneKey} body={body} />}
            <MobileControls mode={mode} onCamera={cameraMove} onReset={() => setReset((v) => v + 1)} />
            {mode === "surface" && <SimulationPanel />}
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
              </div>
              <button onClick={() => setReset((v) => v + 1)}>
                {t("إعادة ضبط الكاميرا ⤾", "Reset camera ⤾")}
              </button>
            </div>
          </main>
        </div>
      )}
      {route.page !== "explore" && <SiteFooter onSources={() => setSources(true)} />}
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
            <p>{t("تُعرض تضاريس القمر والمريخ بمقياس موحّد في المعاينة. التفاصيل الصغيرة حول نقطة النزول توضيحية.", "The Moon and Mars use a normalized preview scale. Small terrain features around the descent point are illustrative.")}</p>
            <p>
              <a href="https://www.eso.org/public/images/eso0932a/" target="_blank" rel="noreferrer">
                {t("بانوراما درب التبانة", "Milky Way panorama")} · ESO/S. Brunier
              </a>
              {" · "}
              <a href="https://github.com/astronexus/HYG-Database" target="_blank" rel="noreferrer">
                {t("كتالوج النجوم", "Star catalogue")} · HYG
              </a>
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
