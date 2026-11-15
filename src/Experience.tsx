import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NasaGallery } from "./NasaGallery";
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
      <div className="site-header__actions">
        <ThemeToggle />
        <button className="source-link" onClick={onSources}>
          المصادر والدقة <Arrow />
        </button>
      </div>
    </header>
  );
}
export function Home() {
  return (
    <main id="main-content" className="editorial-page" tabIndex={-1}>
      <section className="signal-hero">
        <div className="hero-copy">
          <h1>ماذا تركنا على القمر والمريخ؟</h1>
          <p>
            من مرحلة الهبوط التي بقيت في بحر السكون إلى مروحية إنجينيويتي على
            المريخ. تصفّح خمس مهمات لناسا وتعرّف إلى معداتها ومواقعها.
          </p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/explore">
              افتح المحاكاة <span aria-hidden="true">←</span>
            </a>
            <a className="text-link" href="#/archive">
              أرشيف المهمات
            </a>
          </div>
        </div>
        <figure className="hero-figure">
          <img
            className="hero-photo"
            src="/photos/apollo.jpg"
            alt="باز ألدرين على سطح القمر"
            fetchPriority="high"
          />
          <figcaption className="hero-caption">
            <span>باز ألدرين أثناء مهمة أبولو 11، 1969 · ناسا</span>
            <a href={exploreHref("apollo", "location")}>موقع الهبوط ←</a>
          </figcaption>
        </figure>
      </section>
      <section className="page-section destinations-section" aria-labelledby="destinations-title">
        <div className="section-heading destinations-heading">
          <h2 id="destinations-title">أين توجد هذه المعدات؟</h2>
        </div>
        <div className="destinations">
          {[
            {
              body: "moon",
              title: "القمر",
              id: "apollo",
              text: "تعرّف إلى موقع أبولو 11 والمعدات التي بقيت على سطح القمر.",
              img: "apollo",
              count: "مهمة واحدة",
            },
            {
              body: "mars",
              title: "المريخ",
              id: "opportunity",
              text: "استكشف مواقع العربات والمسبار الثابت والمروحية على المريخ.",
              img: "opportunity",
              count: "أربع مهمات",
            },
          ].map((d) => (
            <a
              className={`destination destination--expressive ${d.body}`}
              href={exploreHref(d.id, "planet")}
              key={d.body}
            >
              <div className="destination__media">
                <img
                  src={`/photos/${d.img}.jpg`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="destination__content">
                <div className="destination__title-row">
                  <h3>{d.title}</h3>
                  <span className="destination__count">{d.count}</span>
                </div>
                <p>{d.text}</p>
                <span className="destination__cta">
                  استكشف المواقع
                  <span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="page-section featured-section">
        <div className="section-heading">
          <div>
            <h2>من أرشيف المهمات</h2>
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
      <ScienceIntroduction />
      <NasaGallery mission="apollo" />
      <NasaGallery mission="ingenuity" />
      <section className="closing-section">
        <h2>دقة المحاكاة</h2>
        <p>
          التضاريس المحلية وحركة المعدات تقريبية. تجد مصادر الصور والإحداثيات
          وحدود دقتها في سجل كل مهمة.
        </p>
        <a className="action action-line" href="#/guide">
          دليل الاستكشاف وحدود المحاكاة <Arrow />
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
        <h1>أرشيف المهمات</h1>
        <p>
          سجلات خمس مهمات لناسا على القمر والمريخ، مع صور المعدات ومواقع الهبوط.
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
                <a href={exploreHref(m.id, "story")}>مراحل الرحلة ↗</a>
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
                <div className="kicker">{chosen.en}</div>
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
                <MissionExplanation mission={chosen} />
                <NasaGallery mission={chosen.id} compact />
                <h3>كيف تعمل المعدات؟</h3>
                <p>{chosen.detail}</p>
                <h3>ما الذي بقي في الموقع؟</h3>
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
                    شاهد مراحل الرحلة <Arrow />
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
        <h1>طريقة استخدام المحاكاة</h1>
      </section>
      <section className="guide-steps">
        {[
          [
            "01",
            "اختيار القمر أو المريخ",
            "افتح الاستكشاف واختر القمر أو المريخ. اسحب لتدوير المشهد، أو استخدم أزرار اتجاه الكاميرا.",
          ],
          [
            "02",
            "الاقتراب من موقع الهبوط",
            "اختر علامة المهمة، ثم قرّب بعجلة الفأرة أو بإصبعين على الهاتف. ينتقل المشهد تدريجيًا من المدار إلى المعدات على السطح.",
          ],
          [
            "03",
            "فحص المعدات والتنقل على السطح",
            "افتح المجسّم للتفاصيل، أو بدّل الملاحة إلى المشي والطيران من إعدادات المحاكاة. على الهاتف تظهر أزرار الحركة المناسبة.",
          ],
          [
            "04",
            "عرض مراحل المهمة",
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
          <h2>دقة التضاريس والحركة</h2>
          <p>
            الصور والمجسّمات من مصادر المهمة. التضاريس المحلية والحركة السينمائية
            توضيحية؛ ليست تسجيلًا فعليًا للرحلة أو مسحًا دقيقًا لكل موقع. يبقى مصدر
            الإحداثيات وحدود دقتها ظاهرين في كل سجل.
          </p>
        </div>
      </section>
      <NasaGallery mission="insight" compact />
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
        <span>دليل علمي لمعدات القمر والمريخ.</span>
        <small>مشروع تعليمي مستقل · غير تابع لناسا</small>
      </div>
      <div>
        <a href="#/archive">أرشيف المهمات</a>
        <a href="#/guide">دليل الرحلة</a>
        <button onClick={onSources}>المصادر وحدود المحاكاة ↗</button>
      </div>
      <div className="footer-credit">
        <small>صور المهمات: NASA / JPL · نسب كل صورة داخل سجلها</small>
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
  const explanation = explanations[mission.id];
  return (
    <section className="mission-explanation" aria-label="شرح المهمة">
      <h3>لماذا أُرسلت؟</h3>
      <p>{explanation.goal}</p>
      <h3>ما الذي نتعلمه منها؟</h3>
      <p>{explanation.finding}</p>
      <h3>كيف انتهت مهمتها؟</h3>
      <p>{explanation.ending}</p>
      <a
        className="text-link"
        href={mission.source}
        target="_blank"
        rel="noreferrer"
      >
        اقرأ توثيق ناسا للمهمة ↗
      </a>
    </section>
  );
}
function ScienceIntroduction() {
  return (
    <section className="science-introduction page-section">
      <div className="section-heading">
        <h2>ماذا وجدت المهمات؟</h2>
      </div>
      <div className="science-reading">
        <article>
          <h3>آثار الماء في صخور المريخ</h3>
          <p>
            لم تذهب أوبورتيونيتي لرؤية منظر المريخ فقط. درست الصخور بحثًا عن آثار
            الماء القديم. حملت كاميرات وأدوات لفحص الصخور على ذراعها، وساعدت
            نتائجها في فهم بيئة المنطقة قبل وصول العربة بزمن طويل.
          </p>
          <p className="reading-conclusion">
            <strong>الفكرة العلمية:</strong> نستخدم خصائص الصخور للاستدلال على
            بيئة تكوّنها؛ الدليل على الماء ليس دليلًا مباشرًا على الحياة.
          </p>
          <a href={missions[0].source} target="_blank" rel="noreferrer">
            المصدر: NASA / Opportunity ↗
          </a>
          <a className="reading-next" href="#/archive?mission=opportunity">
            اقرأ التسلسل الكامل للمهمة ←
          </a>
        </article>
        <article>
          <h3>قياس الزلازل على المريخ</h3>
          <p>
            بقي إنسايت في مكانه، لكنه حمل مقياس زلازل لقياس اهتزازات المريخ.
            تساعد هذه القياسات على دراسة باطن الكوكب؛ فالمسبار الثابت يستطيع
            الإجابة عن أسئلة تختلف عن أسئلة العربة المتحركة.
          </p>
          <p className="reading-conclusion">
            <strong>الفكرة العلمية:</strong> نختار الأداة حسب السؤال. الحركة على
            السطح ليست شرطًا لكل اكتشاف.
          </p>
          <a href={missions[2].source} target="_blank" rel="noreferrer">
            المصدر: NASA / InSight ↗
          </a>
          <a className="reading-next" href="#/archive?mission=insight">
            اقرأ أدوات المسبار ومحطات عمله ←
          </a>
        </article>
      </div>
      <div className="reading-note">
        <h3>لماذا بقيت المعدات هناك؟</h3>
        <p>
          تختلف الإجابة حسب المهمة: توقفت عربات ومسابير مع فقدان الطاقة أو
          الاتصال، وانتهى طيران إنجينيويتي بعد تضرر شفراتها. في أبولو 11، كان
          ترك مرحلة الهبوط جزءًا من طريقة مغادرة السطح. لهذا نفصل في كل سجل بين
          نهاية العمل، وآخر اتصال، والمعدات التي بقيت فعلًا.
        </p>
        <a href="#/archive">قارن بين نهايات المهمات في الأرشيف ←</a>
      </div>
    </section>
  );
}
