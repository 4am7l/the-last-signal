import { useEffect, useMemo, useState } from "react";
import { missions, type Mission } from "./data";
import { exploreHref, matchesMission, type Page } from "./navigation";
const bodyName = (m: Mission) => (m.body === "moon" ? "القمر" : "المريخ");
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
}: {
  page: Page;
  onSources: () => void;
}) {
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="الإشارة الأخيرة — الرئيسية">
        <span className="signal-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <div>
          الإشارة الأخيرة<small>THE LAST SIGNAL</small>
        </div>
      </a>
      <nav aria-label="التنقل الرئيسي">
        {(
          [
            ["home", "#/", "الرئيسية"],
            ["explore", "#/explore", "الاستكشاف"],
            ["archive", "#/archive", "أرشيف المهمات"],
            ["guide", "#/guide", "دليل الرحلة"],
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
      <button className="source-link" onClick={onSources}>
        المصادر والدقة <Arrow />
      </button>
    </header>
  );
}
export function Home() {
  return (
    <main id="main-content" className="editorial-page" tabIndex={-1}>
      <section className="signal-hero">
        <img
          className="hero-photo"
          src="/photos/apollo.jpg"
          alt="باز ألدرين على سطح القمر — تصوير نيل أرمسترونغ، ناسا"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="kicker">
            <span /> أرشيف بشري خارج الأرض <b>VOL. 01</b>
          </div>
          <h1>
            للصمت
            <br />
            حكاياتٌ <em>بعيدة.</em>
          </h1>
          <p>
            عربات توقفت. أجنحة سكنت. وآثار لم تمحُها الريح.
            <br />
            اقترب من المعدات التي تركناها خلفنا، واكتشف الرحلات التي غيّرت
            نظرتنا إلى الكون.
          </p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/explore">
              ادخل فضاء الاستكشاف <Arrow />
            </a>
            <a className="action action-line" href="#/archive">
              تصفّح الأرشيف <span aria-hidden="true">←</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="pulse-dot" /> من المدار إلى السطح · تجربة تفاعلية
            ثلاثية الأبعاد
          </div>
        </div>
        <a className="hero-coordinate" href={exploreHref("apollo", "location")}>
          <span>نقطة البداية / 1969</span>
          <strong>قاعدة السكون</strong>
          <span dir="ltr">0.67416° N / 23.47314° E</span>
          <b>
            استكشف موقع أبولو 11 <Arrow />
          </b>
        </a>
        <div className="hero-caption">NASA · صورة أرشيفية / أبولو 11</div>
        <div className="hero-bottom">
          <span>THE TRANSMISSION ENDS. THE STORY CONTINUES.</span>
          <a href="#/archive">تابع أثر الإشارة ↓</a>
        </div>
      </section>
      <section className="mission-strip" aria-label="عن الأرشيف">
        <div>
          <strong>05</strong>
          <span>
            مهمات موثّقة
            <br />
            <small>لكل منها قصة ومجسّم</small>
          </span>
        </div>
        <div>
          <strong>02</strong>
          <span>
            عالمان للاستكشاف
            <br />
            <small>القمر والمريخ</small>
          </span>
        </div>
        <div>
          <strong>1969—2024</strong>
          <span>
            سنوات من الحكايات
            <br />
            <small>من أبولو إلى إنجينيويتي</small>
          </span>
        </div>
        <a href="#/guide">
          كيف تبدأ رحلتك؟ <Arrow />
        </a>
      </section>
      <section className="page-section">
        <div className="section-heading">
          <div>
            <div className="kicker">01 / اختر وجهتك</div>
            <h2>عالمان. آثار لا تُنسى.</h2>
          </div>
          <p>
            ابدأ من المدار، اختر علامة المهمة، ثم اقترب حتى تصل إلى المعدات على
            السطح.
          </p>
        </div>
        <div className="destinations">
          {[
            {
              body: "moon",
              title: "القمر",
              en: "THE MOON",
              id: "apollo",
              text: "إلى المكان الذي تركنا فيه خطواتنا الأولى.",
              img: "apollo",
            },
            {
              body: "mars",
              title: "المريخ",
              en: "MARS",
              id: "opportunity",
              text: "اتبع مستكشفين حملوا فضولنا بدلًا منا.",
              img: "opportunity",
            },
          ].map((d) => (
            <a
              className={`destination ${d.body}`}
              href={exploreHref(d.id, "planet")}
              key={d.body}
            >
              <img src={`/photos/${d.img}.jpg`} alt="" loading="lazy" />
              <div>
                <span>{d.en}</span>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
                <b>
                  ابدأ الاستكشاف <Arrow />
                </b>
              </div>
              <small>
                {d.body === "moon" ? "01 مهمة" : "04 مهمات"} / أطلس المواقع
              </small>
            </a>
          ))}
        </div>
      </section>
      <section className="page-section featured-section">
        <div className="section-heading">
          <div>
            <div className="kicker">02 / من سجل المهمات</div>
            <h2>وراء كل آلة، رحلة.</h2>
          </div>
          <a className="text-link" href="#/archive">
            الأرشيف الكامل <Arrow />
          </a>
        </div>
        <div className="feature-grid">
          {[missions[0], missions[2], missions[3]].map((m) => (
            <a
              className="feature-card"
              href={`#/archive?mission=${m.id}`}
              key={m.id}
            >
              <div className="feature-image">
                <img
                  src={`/photos/${m.id}.jpg`}
                  alt={m.photoCaption}
                  loading="lazy"
                />
                <span>
                  {bodyName(m)} / {year(m)}
                </span>
              </div>
              <div className="feature-copy">
                <small>{m.en}</small>
                <h3>
                  {m.name}
                  <Arrow />
                </h3>
                <p>{m.intro}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="closing-section">
        <div className="signal-mark large" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="kicker">ليست نهاية الاتصال نهاية المعرفة</div>
        <h2>
          المعدات بقيت هناك.
          <br />
          <em>والاكتشاف يصل إلينا.</em>
        </h2>
        <a
          className="action action-solid"
          href={exploreHref("opportunity", "story")}
        >
          شاهد رحلة أوبورتيونيتي <Arrow />
        </a>
      </section>
    </main>
  );
}
export function Archive({ initialMission }: { initialMission?: string }) {
  const [query, setQuery] = useState(""),
    [body, setBody] = useState("all"),
    [sort, setSort] = useState("oldest"),
    [selected, setSelected] = useState(initialMission || "");
  const records = useMemo(
    () =>
      missions
        .filter((m) => matchesMission(m, query, body))
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
        <div className="kicker">سجلات الاستكشاف / MISSION ARCHIVE</div>
        <h1>
          خمسة مسارات.
          <br />
          <em>إرثٌ واحد.</em>
        </h1>
        <p>
          ابحث عن مهمة، اقرأ ما تركته خلفها، أو افتح موقعها داخل المحاكاة.
          التواريخ والمواقع مرتبطة بمصادرها الأصلية.
        </p>
      </section>
      <section className="archive-browser" aria-label="أرشيف المهمات">
        <div className="archive-controls">
          <label className="search-field">
            <span>ابحث في الأرشيف</span>
            <input
              type="search"
              placeholder="اسم المهمة أو موقع الهبوط…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="filter-group" role="group" aria-label="تصفية الوجهة">
            {[
              ["all", "كل الوجهات"],
              ["moon", "القمر"],
              ["mars", "المريخ"],
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
            الترتيب
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="oldest">الأقدم وصولًا</option>
              <option value="newest">الأحدث وصولًا</option>
            </select>
          </label>
        </div>
        <div className="results-line" role="status">
          <span>
            {records.length} من {missions.length} مهمات
          </span>
          <small>مرتبة حسب سنة الهبوط</small>
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
                    alt={m.photoCaption}
                    loading="lazy"
                  />
                  <span className="record-year">{year(m)}</span>
                  <span className="record-body">{bodyName(m)}</span>
                </div>
                <div className="record-copy">
                  <small>{m.en}</small>
                  <h2>
                    {m.name}
                    <span aria-hidden="true">
                      {selected === m.id ? "−" : "+"}
                    </span>
                  </h2>
                  <p>{m.intro}</p>
                  <div className="record-site">◎ {m.site}</div>
                  <span className="record-read">
                    {selected === m.id ? "أغلق سجل المهمة" : "اقرأ سجل المهمة"}{" "}
                    <Arrow />
                  </span>
                </div>
              </button>
              <div className="record-actions">
                <a href={exploreHref(m.id, "location")}>موقع الهبوط ↗</a>
                <a href={exploreHref(m.id, "story")}>الرحلة السينمائية ↗</a>
              </div>
            </article>
          ))}
        </div>
        {records.length === 0 && (
          <div className="empty-state">
            <h2>لم نجد مهمة بهذه الكلمات.</h2>
            <p>جرّب اسمًا بالعربية أو الإنجليزية، أو أزل تصفية الوجهة.</p>
            <button
              className="action action-line"
              onClick={() => {
                setQuery("");
                setBody("all");
              }}
            >
              إعادة عرض كل المهمات
            </button>
          </div>
        )}
        {chosen && (
          <section
            className="dossier"
            id="mission-dossier"
            tabIndex={-1}
            aria-label={`سجل ${chosen.name}`}
          >
            <div className="dossier-heading">
              <div>
                <div className="kicker">ملف المهمة / {chosen.en}</div>
                <h2>{chosen.name}</h2>
              </div>
              <button
                className="action action-line"
                onClick={() => setSelected("")}
              >
                إغلاق السجل ×
              </button>
            </div>
            <div className="dossier-grid">
              <div>
                <img
                  className="dossier-photo"
                  src={`/photos/${chosen.id}.jpg`}
                  alt={chosen.photoCaption}
                />
                <small className="photo-credit">{chosen.photoCaption}</small>
                <h3>المعدات وإرثها</h3>
                <p>{chosen.detail}</p>
                <h3>أين بقيت؟</h3>
                <p>{chosen.final}</p>
                <a
                  className="text-link"
                  href={chosen.finalSource}
                  target="_blank"
                  rel="noreferrer"
                >
                  المصدر الرسمي للموقع الأخير ↗
                </a>
                <h3>مرجع الموقع المعروض</h3>
                <p dir="ltr">
                  {chosen.lat}° / {chosen.lon}° E
                </p>
                <p>{chosen.frame}</p>
                <a
                  className="text-link"
                  href={chosen.locationSource}
                  target="_blank"
                  rel="noreferrer"
                >
                  مصدر الإحداثيات ↗
                </a>
                <div className="hero-actions">
                  <a
                    className="action action-solid"
                    href={exploreHref(chosen.id, "model")}
                  >
                    استكشف المجسّم <Arrow />
                  </a>
                  <a
                    className="action action-line"
                    href={exploreHref(chosen.id, "story")}
                  >
                    عِش الرحلة <Arrow />
                  </a>
                </div>
              </div>
              <div>
                <h3>محطات الرحلة</h3>
                <ol className="mission-timeline">
                  {chosen.events.map((e, i) => (
                    <li key={i}>
                      <time dateTime={e.date}>{e.date}</time>
                      <h4>{e.title}</h4>
                      <p>{e.text}</p>
                    </li>
                  ))}
                </ol>
                <a
                  className="text-link"
                  href={chosen.source}
                  target="_blank"
                  rel="noreferrer"
                >
                  سجل المهمة لدى ناسا ↗
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
  return (
    <main id="main-content" className="editorial-page guide-page" tabIndex={-1}>
      <section className="page-intro">
        <div className="kicker">قبل أن تبدأ / FIELD GUIDE</div>
        <h1>
          من أول نظرة،
          <br />
          <em>إلى أول خطوة.</em>
        </h1>
        <p>
          أنت تتحكم في المسافة والزمن. ابدأ بنظرة على العالم، ثم اقترب من
          الحكاية التي تريدها.
        </p>
      </section>
      <section className="guide-steps">
        {[
          [
            "01",
            "اختر عالمًا",
            "افتح الاستكشاف واختر القمر أو المريخ. اسحب لتدوير المشهد، أو استخدم أزرار اتجاه الكاميرا.",
          ],
          [
            "02",
            "اقترب من الأثر",
            "اختر علامة المهمة، ثم قرّب بعجلة الفأرة أو بإصبعين على الهاتف. ينتقل المشهد تدريجيًا من المدار إلى المعدات على السطح.",
          ],
          [
            "03",
            "استكشف المكان",
            "افتح المجسّم للتفاصيل، أو بدّل الملاحة إلى المشي والطيران من إعدادات المحاكاة. على الهاتف تظهر أزرار الحركة المناسبة.",
          ],
          [
            "04",
            "أعد تشغيل الرحلة",
            "تبويب الرحلة يعرض الانطلاق والعبور والهبوط والعمل. شغّل التسلسل أو اختر محطة؛ يمكنك إيقافه وتغيير سرعته وتحريك المرحلة يدويًا.",
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
          <h2>على شاشة الهاتف</h2>
          <p>
            اسحب بإصبع للدوران، وبإصبعين للتقريب. أخفِ تفاصيل المهمة لإفساح مجال
            للرؤية، وأظهرها عند القراءة. أدوات المشي والطيران تبقى داخل شاشة
            الاستكشاف.
          </p>
        </div>
        <div>
          <h2>اعرف ما تراه</h2>
          <p>
            الصور والمجسّمات من مصادر المهمة. التضاريس المحلية والحركة
            السينمائية توضيحية؛ ليست تسجيلًا فعليًا للرحلة أو مسحًا دقيقًا لكل
            موقع. يبقى مصدر الإحداثيات وحدود دقتها ظاهرين في كل سجل.
          </p>
        </div>
      </section>
      <div className="guide-start">
        <a className="action action-solid" href="#/explore">
          ابدأ الاستكشاف <Arrow />
        </a>
        <a className="action action-line" href="#/archive">
          ابدأ بالقراءة <Arrow />
        </a>
      </div>
    </main>
  );
}
export function SiteFooter({ onSources }: { onSources: () => void }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>الإشارة الأخيرة</strong>
        <span>أرشيف الرحلات التي تركت أثرًا.</span>
        <small>مشروع تعليمي مستقل · غير تابع لناسا</small>
      </div>
      <div>
        <a href="#/archive">أرشيف المهمات</a>
        <a href="#/guide">دليل الرحلة</a>
        <button onClick={onSources}>المصادر وحدود المحاكاة ↗</button>
      </div>
      <div className="footer-credit">
        <span>THE LAST SIGNAL / HUMAN EXPLORATION</span>
        <small>صور المهمات: NASA / JPL · نسب كل صورة داخل سجلها</small>
        <a
          href="https://www.eso.org/public/images/eso0932a/"
          target="_blank"
          rel="noreferrer"
        >
          خلفية المحاكاة: ESO/S. Brunier · CC BY 4.0 ↗
        </a>
      </div>
    </footer>
  );
}
