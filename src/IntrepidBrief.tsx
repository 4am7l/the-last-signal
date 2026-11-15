import { useExplorerText } from "./explorer-language";
import { intrepidCatalog, intrepidCoordinates, intrepidModel, intrepidScience } from "./intrepid";

export function IntrepidBrief() {
  const t = useExplorerText();
  return (
    <section className="apollo-brief" aria-label={t("الملف التقني لإنتريبيد", "Intrepid technical brief")}>
      <h3>{t("إنتريبيد · الوحدة القمرية LM‑6", "Intrepid · LM‑6 lunar module")}</h3>
      <p>{t(
        "هبط القائد بيت كونراد وطيار الوحدة القمرية آلان بين في محيط العواصف في 19 نوفمبر 1969. بقي ريتشارد غوردون في المدار على متن يانكي كليبر. استغرقت إقامة كونراد وبين على السطح نحو 31 ساعة و31 دقيقة، منها 7 ساعات و45 دقيقة في جولتين خارج المركبة.",
        "Commander Pete Conrad and lunar module pilot Alan Bean landed in the Ocean of Storms on November 19, 1969. Richard Gordon remained in orbit aboard Yankee Clipper. Conrad and Bean spent about 31 hours 31 minutes on the Moon, including 7 hours 45 minutes across two moonwalks.",
      )}</p>
      <dl className="apollo-specs">
        <div><dt>{t("التصنيع والكتلة", "Manufacturer and mass")}</dt><dd>{t("غرومان · 15,235 كغ للمرحلتين مع الوقود والمؤكسد وفق NSSDCA.", "Grumman · 15,235 kg for both stages with propellant, as listed by NSSDCA.")}</dd></div>
        <div><dt>{t("مرحلة الهبوط", "Descent stage")}</dt><dd>{t("2,118 كغ كتلة جافة مع معدات السطح، و8,359 كغ من الوقود والمؤكسد. جسم مثمّن عرضه 4.2 م وسماكته 1.7 م، وامتداد القوائم 9.4 م. دفع المحرك الأقصى نحو 45 كيلو نيوتن.", "2,118 kg dry including stowed surface equipment, with 8,359 kg of propellant. The octagonal body is 4.2 m across and 1.7 m thick, with a 9.4 m landing-gear span. Maximum engine thrust was about 45 kN.")}</dd></div>
        <div><dt>{t("مرحلة الصعود", "Ascent stage")}</dt><dd>{t("2,383 كغ كتلة جافة و2,375 كغ من الوقود والمؤكسد. حجم المقصورة 6.65 م³، ومحرك الصعود بقوة نحو 15 كيلو نيوتن. استُخدم 16 دافعًا صغيرًا للمناورة وست بطاريات فضة–زنك لتغذية الوحدة كاملة.", "2,383 kg dry with 2,375 kg of propellant. The crew cabin measured 6.65 m³ and the ascent engine produced about 15 kN. Sixteen thrusters handled maneuvering and six silver–zinc batteries powered the complete module.")}</dd></div>
      </dl>
      <h3>{t("تجارب السطح وسيرفيور 3", "Surface experiments and Surveyor 3")}</h3>
      <p>{t(
        "جمع الطاقم 34.35 كغ من الصخور والتربة واستعاد نحو 10 كغ من أجزاء سيرفيور 3. ضمّت حزمة ALSEP مقاييس للزلازل والمجال المغناطيسي والرياح الشمسية والأيونات والضغط والغبار. غذّاها مولّد SNAP‑27 بقدرة تقارب 70 واط عند التشغيل. عملت المحطة من 19 نوفمبر 1969 حتى 30 سبتمبر 1977.",
        "The crew collected 34.35 kg of rock and soil and recovered roughly 10 kg of Surveyor 3 parts. ALSEP measured seismic activity, magnetic fields, solar wind, ions, pressure and dust. Its SNAP‑27 generator initially supplied about 70 W. The station operated from November 19, 1969, to September 30, 1977.",
      )}</p>
      <p>{t(
        "يعرض مشهد السطح المركبة كاملة بهيئتها وقت الهبوط باستخدام مجسّم ناسا العام لوحدة أبولو القمرية. بعد إقلاع المقصورة، بقيت القاعدة السفلية في الموقع.",
        "The surface scene shows the complete lunar module as it appeared at landing, using NASA’s general Apollo model. The descent stage stayed at the site after the crew cabin lifted off.",
      )}</p>
      <div className="equipment-actions">
        <a className="action action-line" href={intrepidCatalog} target="_blank" rel="noreferrer">NASA NSSDCA · 1969‑099C</a>
        <a className="action action-line" href={intrepidScience} target="_blank" rel="noreferrer">{t("التقرير العلمي · ناسا", "Science report · NASA")}</a>
        <a className="action action-line" href={intrepidCoordinates} target="_blank" rel="noreferrer">{t("إحداثيات بقايا المركبة", "Spacecraft remains coordinates")}</a>
        <a className="action action-line" href={intrepidModel} target="_blank" rel="noreferrer">{t("مصدر المجسّم · ناسا", "Model source · NASA")}</a>
      </div>
    </section>
  );
}
