import { falcon, falconPressKit } from "./falcon";
import { useExplorerText } from "./explorer-language";

export function FalconBrief() {
  const t = useExplorerText();
  return (
    <section className="apollo-brief" aria-label={t("الملف التقني لفالكون", "Falcon technical brief")}>
      <h3>{t("فالكون · الوحدة القمرية LM‑10", "Falcon · LM‑10 lunar module")}</h3>
      <p>{t(
        "هبط ديفيد سكوت وجيمس إروين مساء 30 تموز 1971 عند سفح جبال أبينين القمرية، بينما بقي ألفريد ووردن في المدار على متن إنديفر.",
        "David Scott and James Irwin landed at the foot of the lunar Apennines on July 30, 1971. Alfred Worden remained in lunar orbit aboard Endeavour.",
      )}</p>
      <dl className="apollo-specs">
        <div><dt>{t("الكتلة الكاملة", "Total spacecraft mass")}</dt><dd>{t("16,430 كغ للمرحلتين مع الوقود.", "16,430 kg for both stages with propellant.")}</dd></div>
        <div><dt>{t("مرحلة الهبوط", "Descent stage")}</dt><dd>{t("2,797 كغ كتلة جافة و8,873 كغ من الوقود والمؤكسد. حملت العربة القمرية المطوية ومعدات السطح.", "2,797 kg dry and 8,873 kg of propellant. It carried the folded lunar rover and surface equipment.")}</dd></div>
        <div><dt>{t("مرحلة الصعود", "Ascent stage")}</dt><dd>{t("2,385 كغ كتلة جافة و2,375 كغ من الوقود والمؤكسد. أعادت الطاقم والعينات إلى المدار.", "2,385 kg dry and 2,375 kg of propellant. It returned the crew and samples to orbit.")}</dd></div>
      </dl>
      <h3>{t("العربة القمرية والتجارب", "Lunar rover and experiments")}</h3>
      <p>{t(
        "قضى الطاقم نحو 66 ساعة و55 دقيقة على السطح. خلال ثلاث جولات قطع 27.9 كم، وجمع 77.31 كغ من العينات ونشر حزمة التجارب ALSEP.",
        "The crew spent about 66 hours and 55 minutes on the surface. Across three moonwalks they covered 27.9 km, collected 77.31 kg of samples and deployed ALSEP.",
      )}</p>
      <p>{t(
        "بقيت منصة الهبوط في هادلي–أبينين. يعرض المجسّم التوضيحي المركبة كاملة وقت الهبوط، باستخدام نموذج ناسا العام لعائلة أبولو.",
        "The descent stage remains at Hadley–Apennine. The simulation depicts the full spacecraft at touchdown using NASA’s general Apollo lunar module model.",
      )}</p>
      <div className="equipment-actions">
        <a className="action action-line" href={falcon.source} target="_blank" rel="noreferrer">NASA NSSDCA · 1971‑063C</a>
        <a className="action action-line" href={falconPressKit} target="_blank" rel="noreferrer">{t("رسومات LM‑10 · ناسا", "LM‑10 drawings · NASA")}</a>
      </div>
    </section>
  );
}
