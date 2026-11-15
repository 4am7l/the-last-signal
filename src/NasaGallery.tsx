import { useEffect, useId, useRef, useState } from "react";

type NasaPhoto = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  center: string;
  source: string;
};
type NasaResult = { mission: string; photos: NasaPhoto[]; error?: string };

const names: Record<string, string> = {
  apollo: "أبولو 11",
  opportunity: "أوبورتيونيتي",
  spirit: "سبيريت",
  insight: "إنسايت",
  ingenuity: "إنجينيويتي",
};

/** NASA media cards are fetched only when the gallery approaches the viewport. */
export function NasaGallery({
  mission,
  compact = false,
}: {
  mission: string;
  compact?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<NasaPhoto[]>([]);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<NasaPhoto | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const ref = useRef<HTMLElement | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const heading = useId();

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
    if (!visible) return;
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
  }, [mission, visible]);

  useEffect(() => {
    if (!open) {
      setFullImage(null);
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
      // Return keyboard users to the photo they were viewing.
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
          <h2 id={heading}>صور {names[mission] ?? "المهمات"} من ناسا</h2>
        </div>
        <a
          className="action action-line"
          href={"https://images.nasa.gov/search?q=" + encodeURIComponent(names[mission] ?? "NASA")}
          target="_blank"
          rel="noopener noreferrer"
        >
          افتح أرشيف NASA
          <span className="material-symbols-rounded" aria-hidden="true">open_in_new</span>
        </a>
      </div>
      {loading && (
        <div className="nasa-gallery__loading" role="status">
          <span className="material-symbols-rounded" aria-hidden="true">image_search</span>
          جارٍ جلب الصور من مكتبة ناسا…
        </div>
      )}
      {!loading && photos.length > 0 && (
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
                aria-label={"تكبير صورة: " + photo.title}
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
                  بيانات الصورة الأصلية
                  <span className="material-symbols-rounded" aria-hidden="true">north_east</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      {visible && !loading && (error || !photos.length) && (
        <div className="nasa-gallery__fallback">
          <img src={"/photos/" + mission + ".jpg"} alt={"صورة أرشيفية من مهمة " + (names[mission] ?? mission)} loading="lazy" />
          <div>
            <strong>الصور الإضافية غير متوفرة حاليًا.</strong>
            <p>يمكنك تصفّح بقية الصور في مكتبة ناسا.</p>
          </div>
        </div>
      )}
      <p className="nasa-gallery__disclaimer">
        المصدر: NASA Image and Video Library. بعض المواد قد تتضمن حقوقًا لطرف ثالث؛
        راجع سجل الصورة الأصلي. الموقع مشروع تعليمي مستقل وغير معتمد من NASA.
      </p>
      {open && (
        <div className="nasa-lightbox" role="dialog" aria-modal="true" aria-label={"صورة NASA: " + open.title}>
          <button
            className="nasa-lightbox__backdrop"
            type="button"
            onClick={() => setOpen(null)}
            aria-label="إغلاق عرض الصورة"
          />
          <div className="nasa-lightbox__content" ref={lightboxRef}>
            <button className="nasa-lightbox__close" type="button" onClick={() => setOpen(null)} autoFocus>
              <span className="material-symbols-rounded" aria-hidden="true">close</span>
              إغلاق
            </button>
            <img src={fullImage ?? open.thumbnail} alt={open.title} />
            <div className="nasa-lightbox__caption">
              <h2>{open.title}</h2>
              {open.description && <p>{open.description}</p>}
              <a className="action action-solid" href={open.source} target="_blank" rel="noopener noreferrer">
                اعرض الصورة وبياناتها لدى NASA
                <span className="material-symbols-rounded" aria-hidden="true">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
