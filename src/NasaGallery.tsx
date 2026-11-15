import { pathfinderGallery, pathfinderSource } from "./pathfinder";
import { surveyorGallery, surveyorSource } from "./surveyor";
import { intrepidArchive, intrepidGallery } from "./intrepid";
import { falconArchive, falconGallery } from "./falcon";
import { apolloGallery, apolloImageArchive } from "./apollo";
import { missions } from "./data";
import { createPortal } from "react-dom";
import { useExplorerText } from "./explorer-language";
import { useEffect, useId, useRef, useState } from "react";

type NasaPhoto = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  center: string;
  source: string;
  full?: string;
};
type NasaResult = { mission: string; photos: NasaPhoto[]; error?: string };

const names: Record<string, string> = {
  pathfinder: "مارس باثفايندر",
  surveyor3: "سيرفيور 3",
  apollo: "أبولو 11",
  apollo12: "أبولو 12",
  apollo15: "أبولو 15",
  opportunity: "أوبورتيونيتي",
  spirit: "سبيريت",
  insight: "إنسايت",
  ingenuity: "إنجينيويتي",
};

export function NasaGallery({
  mission,
  compact = false,
}: {
  mission: string;
  compact?: boolean;
}) {
  const t = useExplorerText();
  const name = t(names[mission] ?? "المهمات", missions.find(item => item.id === mission)?.en ?? "Missions");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const localGallery = mission === "apollo" ? apolloGallery : mission === "apollo12" ? intrepidGallery : mission === "apollo15" ? falconGallery : mission === "surveyor3" ? surveyorGallery : mission === "pathfinder" ? pathfinderGallery : null;
  const localPhotos: NasaPhoto[] | undefined = localGallery?.map((image) => ({
    id: image.id,
    title: t(image.ar, image.en),
    description: "",
    thumbnail: image.thumbnail,
    date: "",
    center: "NASA",
    source: image.source,
    full: "full" in image && typeof image.full === "string" ? image.full : image.id === "AS11-40-5927" || image.id === "LM diagram" ? image.thumbnail : image.source,
  }));
  const [remotePhotos, setPhotos] = useState<NasaPhoto[]>([]);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<NasaPhoto | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const ref = useRef<HTMLElement | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const heading = useId();
  const photos = localPhotos ?? remotePhotos;

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || localGallery) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setPhotos([]);
    fetch("/api/nasa-gallery?mission=" + encodeURIComponent(mission), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("NASA gallery unavailable");
        return response.json() as Promise<NasaResult>;
      })
      .then((result) => {
        setPhotos(result.photos ?? []);
        setError(Boolean(result.error) || !result.photos?.length);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(true);
        console.warn("NASA gallery:", reason);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mission, visible, localGallery]);

  useEffect(() => {
    if (!open) {
      setFullImage(null);
      return;
    }
    if (open.full) {
      setFullImage(open.full);
      return;
    }
    const controller = new AbortController();
    setFullImage(null);
    fetch("/api/nasa-asset?id=" + encodeURIComponent(open.id), {
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<{ full: string | null }> : null)
      .then((data) => {
        if (!controller.signal.aborted && data?.full) setFullImage(data.full);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) {
      lastTrigger.current?.focus({ preventScroll: true });
      return;
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(null);
      }
      if (event.key === "Tab") {
        const focusables = lightboxRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  return (
    <section
      className={"nasa-gallery" + (compact ? " nasa-gallery--compact" : "")}
      ref={ref}
      aria-labelledby={heading}
    >
      <div className="nasa-gallery__heading">
        <div>
          <h2 id={heading}>{t(`صور ${name} من ناسا`, `${name} photos from NASA`)}</h2>
        </div>
        <a
          className="action action-line"
          href={localPhotos ? (mission === "apollo12" ? intrepidArchive : mission === "apollo15" ? falconArchive : mission === "surveyor3" ? surveyorSource : mission === "pathfinder" ? pathfinderSource : apolloImageArchive) : "https://images.nasa.gov/search?q=" + encodeURIComponent(name)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("افتح أرشيف NASA", "Open NASA’s archive")}
          <span className="material-symbols-rounded" aria-hidden="true">open_in_new</span>
        </a>
      </div>
      {!localPhotos && loading && (
        <div className="nasa-gallery__loading" role="status">
          <span className="material-symbols-rounded" aria-hidden="true">image_search</span>
          {t("جارٍ جلب الصور من مكتبة ناسا…", "Loading photos from NASA…")}
        </div>
      )}
      {(localPhotos || !loading) && photos.length > 0 && (
        <div className="nasa-gallery__grid">
          {photos.map((photo, index) => (
            <article className="nasa-photo-card" key={photo.id}>
              <button
                className="nasa-photo-card__open"
                type="button"
                onClick={(event) => {
                  lastTrigger.current = event.currentTarget;
                  setOpen(photo);
                }}
                aria-label={t("تكبير صورة: ", "Enlarge photo: ") + photo.title}
              >
                <img
                  src={photo.thumbnail}
                  alt={photo.title}
                  loading={index > 1 ? "lazy" : "eager"}
                  decoding="async"
                />
                <span className="nasa-photo-card__zoom material-symbols-rounded" aria-hidden="true">
                  zoom_out_map
                </span>
              </button>
              <div className="nasa-photo-card__caption">
                <h3 title={photo.title}>{photo.title}</h3>
                <p>{photo.center} {photo.date ? "· " + photo.date : ""}</p>
                <a href={photo.source} target="_blank" rel="noopener noreferrer">
                  {t("بيانات الصورة الأصلية", "Original photo record")}
                  <span className="material-symbols-rounded" aria-hidden="true">north_east</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      {!localPhotos && visible && !loading && (error || !photos.length) && (
        <div className="nasa-gallery__fallback">
          <img src={"/photos/" + mission + ".jpg"} alt={t("صورة أرشيفية من مهمة ", "Archival photo from ") + name} loading="lazy" />
          <div>
            <strong>{t("الصور الإضافية غير متوفرة حاليًا.", "Additional photos are currently unavailable.")}</strong>
            <p>{t("يمكنك تصفّح بقية الصور في مكتبة ناسا.", "Browse more photos in NASA’s library.")}</p>
          </div>
        </div>
      )}
      <p className="nasa-gallery__disclaimer">
        {localPhotos ? t("المصادر موضّحة مع كل صورة.", "Sources and credits are listed with each image.") : t("المصدر: NASA Image and Video Library. بعض المواد قد تتضمن حقوقًا لطرف ثالث؛ راجع سجل الصورة الأصلي. الموقع مشروع تعليمي مستقل وغير معتمد من NASA.", "Source: NASA Image and Video Library. Consult the original photo record for rights information. This is an independent educational project.")}
      </p>
      {open && createPortal(
        <div className="nasa-lightbox" role="dialog" aria-modal="true" aria-label={t("صورة NASA: ", "NASA photo: ") + open.title}>
          <button
            className="nasa-lightbox__backdrop"
            type="button"
            onClick={() => setOpen(null)}
            aria-label={t("إغلاق عرض الصورة", "Close photo viewer")}
          />
          <div className="nasa-lightbox__content" ref={lightboxRef}>
            <button className="nasa-lightbox__close" type="button" onClick={() => setOpen(null)} autoFocus>
              <span className="material-symbols-rounded" aria-hidden="true">close</span>
              {t("إغلاق", "Close")}
            </button>
            <img src={fullImage ?? open.thumbnail} alt={open.title} onError={() => setFullImage(null)} />
            <div className="nasa-lightbox__caption">
              <h2>{open.title}</h2>
              {open.description && <p>{open.description}</p>}
              <a className="action action-solid" href={open.source} target="_blank" rel="noopener noreferrer">
                {t("اعرض الصورة وبياناتها لدى NASA", "View the original photo at NASA")}
                <span className="material-symbols-rounded" aria-hidden="true">open_in_new</span>
              </a>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
