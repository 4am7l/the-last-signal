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
            <span /> دليل علمي لمعدات استكشاف الفضاء <b>NASA MISSIONS</b>
          </div>
          <h1>
            ماذا تركنا على
            <br />
            <em>القمر والمريخ؟</em>
          </h1>
          <p>
            أرسلت هذه المهمات معدات لدراسة الصخور، وقياس الزلازل، واختبار
            الطيران بعيدًا عن الأرض. انتهت رحلاتها، لكن نتائجها ما زالت جزءًا من
            معرفتنا بالكواكب.
            <br />
            تعرّف إلى هدف كل مهمة وأدواتها ونتائجها، ثم استكشف موقعها ومجسّمها.
          </p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/archive">
              اقرأ المهمات ونتائجها <Arrow />
            </a>
            <a className="action action-line" href="#/explore">
              افتح المحاكاة <span aria-hidden="true">←</span>
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
          <span>MISSION • INSTRUMENT • EVIDENCE</span>
          <a href="#/archive">سجلات المهمات ومصادرها ←</a>
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
            الفترة التي يغطيها الأرشيف
            <br />
            <small>من أبولو إلى إنجينيويتي</small>
          </span>
        </div>
        <a href="#/guide">
          كيف تبدأ رحلتك؟ <Arrow />
        </a>
      </section>
      <ScienceIntroduction />
      <section className="page-section">
        <div className="section-heading">
          <div>
            <div className="kicker">02 / الموقع الجغرافي</div>
            <h2>أين توجد هذه المعدات؟</h2>
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
              text: "موقع أبولو 11 ومعدات الهبوط على سطح القمر.",
              img: "apollo",
            },
            {
              body: "mars",
              title: "المريخ",
              en: "MARS",
              id: "opportunity",
              text: "عربات ومسبار ثابت ومروحية في مواقع مختلفة.",
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
            <div className="kicker">03 / اقرأ المهمة</div>
            <h2>المعدات في سياقها العلمي.</h2>
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
        <div className="kicker">كيف تقرأ هذا الأرشيف؟</div>
        <h2>الصورة وثيقة. والمجسّم وسيلة للفهم.</h2>
        <p>
          اقرأ سجل المهمة أولًا، ثم استخدم المحاكاة لفهم شكل المعدات وتسلسل
          الرحلة. الحركة والتضاريس المحلية إعادة بناء تعليمية، وليست تسجيلًا
          حقيقيًا أو مسحًا دقيقًا للموقع. مصدر كل مهمة وحدود دقة إحداثياتها
          مذكوران في سجلها.
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
        <div className="kicker">سجلات الاستكشاف / MISSION ARCHIVE</div>
        <h1>
          معدات الاستكشاف،
          <br />
          <em>مهمةً بعد مهمة.</em>
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
                <MissionExplanation mission={chosen} />
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
          كيف تستخدم
          <br />
          <em>المحاكاة العلمية؟</em>
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
        <span>دليل علمي لمعدات القمر والمريخ.</span>
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
        <div>
          <div className="kicker">01 / من السؤال إلى النتيجة</div>
          <h2>كيف تتحول المعدات إلى معرفة؟</h2>
        </div>
        <p>
          نبدأ بالسؤال الذي أُرسلت المهمة للإجابة عنه، ثم ننظر إلى الأداة
          والدليل الذي جمعته.
        </p>
      </div>
      <div className="science-reading">
        <article>
          <span className="reading-number">أ</span>
          <h3>الصخور تحفظ تاريخ الماء</h3>
          <p>
            لم تذهب أوبورتيونيتي لرؤية منظر المريخ فقط. درست الصخور بحثًا عن
            آثار الماء القديم. حملت كاميرات وأدوات لفحص الصخور على ذراعها،
            وساعدت نتائجها في فهم بيئة المنطقة قبل وصول العربة بزمن طويل.
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
          <span className="reading-number">ب</span>
          <h3>يمكن دراسة الأعماق من السطح</h3>
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
