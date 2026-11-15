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
  const ref = useRef<HTMLElement | null>(null);
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
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <section
      className={"nasa-gallery" + (compact ? " nasa-gallery--compact" : "")}
      ref={ref}
      aria-labelledby={heading}
    >
      <div className="nasa-gallery__heading">
        <div>
          <span className="kicker">NASA IMAGE & VIDEO LIBRARY</span>
          <h2 id={heading}>الصور الأصلية: {names[mission] ?? "المهمات"}</h2>
          <p>
            أرشيف مصوّر من ناسا. الصور وسيلة توثيق مستقلة عن المحاكاة الثلاثية
            الأبعاد، وبيانات كل صورة محفوظة في مصدرها.
          </p>
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
                onClick={() => setOpen(photo)}
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
      {!loading && (error || !photos.length) && (
        <div className="nasa-gallery__fallback">
          <img src={"/photos/" + mission + ".jpg"} alt={"صورة أرشيفية من مهمة " + (names[mission] ?? mission)} loading="lazy" />
          <div>
            <strong>الصور الإضافية غير متوفرة حاليًا.</strong>
            <p>يمكنك فتح مكتبة ناسا الأصلية من الرابط أعلاه. المعرض لا يعرض صورًا غير موثّقة عند تعذّر الاتصال.</p>
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
          <div className="nasa-lightbox__content">
            <button className="nasa-lightbox__close" type="button" onClick={() => setOpen(null)} autoFocus>
              <span className="material-symbols-rounded" aria-hidden="true">close</span>
              إغلاق
            </button>
            <img src={open.thumbnail} alt={open.title} />
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
