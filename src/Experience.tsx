import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NasaGallery } from "./NasaGallery";
import { Icon } from "./Icon";
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
          الإشارة الأخيرة<small>فضولك بداية الرحلة</small>
        </div>
      </a>
      <nav aria-label="التنقل الرئيسي">
        {(
          [
            ["home", "#/", "الرئيسية"],
            ["explore", "#/explore", "الاستكشاف"],
            ["archive", "#/archive", "قصص المهمات"],
            ["guide", "#/guide", "كيف أبدأ؟"],
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
    <main id="main-content" className="editorial-page youth-home" tabIndex={-1}>
      <section className="adventure-hero" aria-labelledby="adventure-title">
        <div className="hero-copy">
          <div className="adventure-eyebrow">
            <span aria-hidden="true">✦</span> لعقول فضولية من 8 إلى 16 سنة
          </div>
          <h1 id="adventure-title">
            الكون مليان قصص.
            <br />
            <em>جاهز تكتشفها؟</em>
          </h1>
          <p>
            اقترب من القمر، تعرّف إلى روبوتات المريخ، واكتشف ما تعلّمناه من
            رحلاتها. مغامرتك الفضائية تبدأ بسؤال!
          </p>
          <div className="hero-actions">
            <a className="action action-solid" href="#/explore">
              ابدأ الاستكشاف <span aria-hidden="true">←</span>
            </a>
            <a className="action action-line" href="#/archive">اكتشف قصص المهمات <Arrow /></a>
          </div>
          <div className="adventure-tags" aria-label="ما الذي ستجده؟">
            <span><i aria-hidden="true">◎</i> عوالم ثلاثية الأبعاد</span>
            <span><i aria-hidden="true">✧</i> قصص حقيقية</span>
            <span><Icon name="planet" /> على راحتك</span>
          </div>
        </div>
        <figure className="adventure-art">
          <img src="/illustrations/space-adventure.svg" width="660" height="560"
            alt="رسم تخيّلي لرائد فضاء يلوّح بجانب عربة استكشاف على سطح القمر"
            fetchPriority="high" />
          <figcaption>رسم تخيّلي · الأحجام والمسافات غير حقيقية</figcaption>
        </figure>
      </section>
      <section className="mission-strip" aria-label="عن الأرشيف">
        <div>
          <strong>5</strong>
          <span>
            قصص مهمات
            <br />
            <small>عربات وروّاد ومروحية</small>
          </span>
        </div>
        <div>
          <strong>2</strong>
          <span>
            عالمان للاستكشاف
            <br />
            <small>القمر والمريخ</small>
          </span>
        </div>
        <div>
          <strong aria-hidden="true">∞</strong>
          <span>
            مساحة للفضول
            <br />
            <small>استكشف وتعلّم بالوتيرة التي تحبها</small>
          </span>
        </div>
        <a href="#/guide">
          كيف تبدأ رحلتك؟ <Arrow />
        </a>
      </section>
      <section className="page-section destinations-section" aria-labelledby="destinations-title">
        <div className="section-heading destinations-heading">
          <div>
            <div className="kicker destinations-kicker">
              <Icon name="planet" />
              محطتك الأولى
            </div>
            <h2 id="destinations-title">إلى أين نذهب اليوم؟</h2>
          </div>
          <p>
            اختر عالمًا، حرّكه بإصبعك، واقترب من الأماكن التي وصلت إليها مهماتنا.
          </p>
        </div>
        <div className="destinations">
          {[
            {
              body: "moon",
              title: "القمر",
              id: "apollo",
              text: "اتبع قصة أبولو 11 واكتشف ما تركه روّاد الفضاء على أقرب جيراننا.",
              count: "مهمة واحدة",
            },
            {
              body: "mars",
              title: "المريخ",
              id: "opportunity",
              text: "قابل الروبوتات التي درست الصخور، ورصدت الزلازل، وجرّبت الطيران!",
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
                  src={`/illustrations/${d.body}-expedition.svg`}
                  alt={`رسم توضيحي لعالم ${d.title} ومعدات استكشافه، وليس مقياسًا حقيقيًا`}
                  width="600"
                  height="320"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="destination__content">
                <span className="destination__overline">{d.body === "moon" ? "جارنا الأقرب" : "الكوكب الأحمر"}</span>
                <div className="destination__title-row">
                  <h3>{d.title}</h3>
                  <span className="destination__count">{d.count}</span>
                </div>
                <p>{d.text}</p>
                <span className="destination__cta">
                  لنستكشف {d.title}
                  <Icon name="arrow-left" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className="page-section featured-section">
        <div className="section-heading">
          <div>
            <div className="kicker">لكل مستكشف حكاية</div>
            <h2>تعرّف إلى أبطال المهمات.</h2>
          </div>
          <a className="text-link" href="#/archive">
            كل المهمات <Arrow />
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
      <details className="gallery-discovery">
        <summary><span aria-hidden="true">▧</span> شاهد صورًا حقيقية من ناسا <span className="discovery-hint">افتح المعرض</span></summary>
        <NasaGallery mission="apollo" />
        <NasaGallery mission="ingenuity" />
      </details>
      <section className="closing-section">
        <div className="kicker">فضولك هو الوقود</div>
        <h2>لا تحتاج بدلة فضاء. فقط خيالك!</h2>
        <p>
          ابدأ بعالم يعجبك، أو اقرأ قصة مهمة. الصور العلمية من ناسا، والرسومات
          والحركة تساعدك على التخيّل والفهم؛ ليست تصويرًا حقيقيًا للرحلة.
        </p>
        <a className="action action-line" href="#/guide">
          أرني كيف أبدأ <Arrow />
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
        <div className="kicker">خمسة مستكشفين · خمس حكايات</div>
        <h1>
          لكل مهمة سؤال،
          <br />
          <em>ولكل رحلة حكاية.</em>
        </h1>
        <p>
          اختر مهمة لتعرف لماذا ذهبت، وماذا اكتشفت، وأين أصبحت اليوم.
          افتح مجسّمها عندما تريد رؤيتها عن قرب.
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
                <a href={exploreHref(m.id, "story")}>شاهد الرحلة ↗</a>
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
                <NasaGallery mission={chosen.id} compact />
                <details className="mission-deep-dive" key={chosen.id}>
                  <summary>اعرف أكثر: المعدات والموقع بالتفصيل</summary>
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
                </details>
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
        <div className="kicker">دليل المستكشف</div>
        <h1>
          رحلتك الأولى،
          <br />
          <em>خطوة بخطوة.</em>
        </h1>
        <p>
          لا تحتاج أي خبرة سابقة. اختر عالمًا، اقترب منه، ثم اكتشف قصته.
          يمكنك التوقف والعودة في أي وقت.
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
            "اقترب من المهمة",
            "اضغط على اسم المهمة. قرّب بعجلة الفأرة، أو باعد بين إصبعين على الهاتف، حتى ترى المعدات على السطح.",
          ],
          [
            "03",
            "استكشف المكان",
            "افتح «المجسّم» وحرّكه لترى شكله من كل الجهات. جرّب زر + للتقريب وزر − للابتعاد.",
          ],
          [
            "04",
            "أعد تشغيل الرحلة",
            "افتح «الرحلة» واضغط تشغيل. شاهد كيف انطلقت المهمة وهبطت، وأوقفها عند أي محطة تريد معرفة المزيد عنها.",
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
            الصور والمجسّمات من مصادر المهمة. التضاريس المحلية والحركة السينمائية
            توضيحية؛ ليست تسجيلًا فعليًا للرحلة أو مسحًا دقيقًا لكل موقع. يبقى مصدر
            الإحداثيات وحدود دقتها ظاهرين في كل سجل.
          </p>
        </div>
      </section>
      <section className="space-glossary" aria-labelledby="glossary-title">
        <h2 id="glossary-title">كلمات سترافقك في الرحلة</h2>
        <dl>
          <div><dt>المجسّم</dt><dd>شكل ثلاثي الأبعاد تستطيع تدويره ورؤيته من جهات مختلفة.</dd></div>
          <div><dt>المدار</dt><dd>المسار الذي يتبعه قمر أو مركبة حول جسم في الفضاء.</dd></div>
          <div><dt>المسبار</dt><dd>مركبة تستكشف الفضاء وتحمل أدوات علمية، من دون روّاد على متنها.</dd></div>
          <div><dt>المحاكاة</dt><dd>طريقة لرؤية فكرة على الشاشة. الحركة والتضاريس هنا توضيحية وليست تسجيلًا حقيقيًا للرحلة.</dd></div>
        </dl>
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
        <span>مساحة للفضول واكتشاف القمر والمريخ.</span>
        <small>مشروع تعليمي مستقل · غير تابع لناسا</small>
      </div>
      <div>
        <a href="#/archive">قصص المهمات</a>
        <a href="#/guide">كيف أبدأ؟</a>
        <button onClick={onSources}>المصادر وحدود المحاكاة ↗</button>
      </div>
      <div className="footer-credit">
        <span>THE LAST SIGNAL / HUMAN EXPLORATION</span>
        <small>صور المهمات: NASA / JPL · نسب كل صورة داخل سجلها</small>
        <small>رسومات توضيحية ومجسّمات تعليمية · للقمر والمريخ</small>
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
      <details className="mission-ending" key={mission.id}>
        <summary>كيف انتهت مهمتها؟</summary>
        <p>{explanation.ending}</p>
      </details>
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
          <div className="kicker">سؤال صغير، اكتشاف كبير</div>
          <h2>كيف نكتشف أسرار المريخ؟</h2>
        </div>
        <p>
          ابدأ بالفكرة البسيطة، وافتح «اعرف أكثر» عندما تريد التعمّق.
        </p>
      </div>
      <div className="science-reading">
        <article>
          <span className="reading-number" aria-hidden="true">◈</span>
          <h3>هل كان على المريخ ماء؟</h3>
          <p>فحصت عربة أوبورتيونيتي الصخور، ووجدت أدلة على أن الماء أثّر فيها قديمًا. الصخور تحتفظ بقصص من الماضي!</p>
          <details>
            <summary>اعرف أكثر عن أدلة الماء</summary>
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
          </details>
          <a className="reading-next" href="#/archive?mission=opportunity">
            اقرأ التسلسل الكامل للمهمة ←
          </a>
        </article>
        <article>
          <span className="reading-number" aria-hidden="true">≋</span>
          <h3>هل يهتز المريخ أيضًا؟</h3>
          <p>نعم! سجّل إنسايت اهتزازات في المريخ. ساعدت هذه القياسات العلماء على فهم ما يوجد داخل الكوكب.</p>
          <details>
            <summary>اعرف أكثر عن اهتزازات المريخ</summary>
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
          </details>
          <a className="reading-next" href="#/archive?mission=insight">
            اقرأ أدوات المسبار ومحطات عمله ←
          </a>
        </article>
      </div>
      <details className="reading-note">
        <summary>سؤال آخر: لماذا بقيت المعدات هناك؟</summary>
        <p>
          تختلف الإجابة حسب المهمة: توقفت عربات ومسابير مع فقدان الطاقة أو
          الاتصال، وانتهى طيران إنجينيويتي بعد تضرر شفراتها. في أبولو 11، كان
          ترك مرحلة الهبوط جزءًا من طريقة مغادرة السطح. لهذا نفصل في كل سجل بين
          نهاية العمل، وآخر اتصال، والمعدات التي بقيت فعلًا.
        </p>
        <a href="#/archive">قارن بين نهايات المهمات في الأرشيف ←</a>
      </details>
    </section>
  );
}
