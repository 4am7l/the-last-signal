import { useExplorerText } from "./explorer-language";
import { apolloCatalog } from "./apollo";

export function ApolloBrief() {
  const t = useExplorerText();
  return (
    <section className="apollo-brief" aria-label={t("الملف التقني لأبولو 11", "Apollo 11 technical brief")}>
      <h3>{t("إيغل · الوحدة القمرية", "Eagle · Lunar module")}</h3>
      <p>{t(
        "حمل ساتورن V أبولو 11 من كيب كانافيرال في 16 تموز 1969. هبط نيل أرمسترونغ وباز ألدرين في بحر السكون عند 20:17:40 بالتوقيت العالمي يوم 20 تموز. أمضيا 21 ساعة و36 دقيقة على السطح، وجمعا 21.55 كغ من الصخور والتربة، بما فيها عينات أُخذت بأنابيب لُبّية.",
        "Saturn V launched Apollo 11 from Cape Canaveral on July 16, 1969. Neil Armstrong and Buzz Aldrin landed at 20:17:40 UT on July 20 in the Sea of Tranquility. They spent 21 hours and 36 minutes on the surface and collected 21.55 kg of lunar rock and soil, including core samples.",
      )}</p>
      <dl className="apollo-specs">
        <div>
          <dt>{t("الوحدة القمرية كاملة", "Complete lunar module")}</dt>
          <dd>{t("15,103 كغ للمرحلتين مع الوقود.", "15,103 kg for both stages with propellant.")}</dd>
        </div>
        <div>
          <dt>{t("مرحلة الهبوط", "Descent stage")}</dt>
          <dd>{t(
            "كتلة جافة 2,034 كغ ووقود 8,248 كغ. جسم ثماني الأضلاع عرضه 4.2 م وسماكته 1.7 م. امتداد الأرجل 9.4 م، وأقصى دفع لمحرك الهبوط نحو 45,000 نيوتن. حملت خزانات وقود Aerozine 50 ورباعي أكسيد النيتروجين والماء والأكسجين والهيليوم ومعدات السطح.",
            "Dry mass 2,034 kg, plus 8,248 kg of propellant. Its octagonal body measured 4.2 m across by 1.7 m thick, with a 9.4 m landing-gear span and about 45,000 N of maximum thrust. It housed Aerozine 50 fuel, nitrogen tetroxide oxidizer, water, oxygen, helium and surface equipment.",
          )}</dd>
        </div>
        <div>
          <dt>{t("مرحلة الصعود", "Ascent stage")}</dt>
          <dd>{t(
            "كتلة جافة 2,445 كغ ووقود 2,376 كغ. ارتفاعها نحو 2.8 م وعرضها 4.0 × 4.3 م. مقصورة مضغوطة بحجم 6.65 م³ بلا مقاعد، مع لوحة تحكم وفتحة التحام ودافعات مناورة. دفع محركها الثابت نحو 15,000 نيوتن.",
            "Dry mass 2,445 kg, plus 2,376 kg of propellant. About 2.8 m high and 4.0 × 4.3 m wide. Its 6.65 m³ pressurized cabin had a control console and docking hatch. The stage used maneuvering thrusters and a fixed engine producing about 15,000 N.",
          )}</dd>
        </div>
      </dl>
      <h3>{t("حزمة التجارب السطحية EASEP", "EASEP surface experiments")}</h3>
      <p>{t(
        "وُضعت الحزمة البالغ وزنها 48 كغ على بعد نحو 17 م جنوب إيغل. ضمّت لوحين شمسيين، ومقياس زلازل سلبيًا لدراسة باطن القمر، وكاشف غبار، وسخانًا نظائريًا وهوائيًا. كان تردد استقبال الأوامر 2119 MHz وإرسال البيانات 2276.5 MHz.",
        "The 48 kg package was deployed about 17 m south of Eagle. It included two solar panels, a passive seismometer for studying the Moon’s interior, a dust detector, an isotope heater and an antenna. It received commands at 2119 MHz and transmitted data at 2276.5 MHz.",
      )}</p>
      <p>{t(
        "وُضع العاكس الليزري على بعد نحو 5 م إلى الشمال الغربي المائل للشمال من الحزمة ويعمل بلا طاقة. بدأ تشغيل الحزمة في 21 تموز. اشتغلت رغم تجاوز الحد الحراري المخطط بـ30°م، وأعيد تشغيلها في اليوم القمري التالي. انتهت التجربة في 27 آب 1969 بعد أن توقفت عن استقبال الأوامر.",
        "The unpowered laser retroreflector was placed about 5 m north-northwest of the package. The package was switched on July 21. It operated 30°C above its planned thermal limit and restarted on the next lunar day. The experiment ended on August 27, 1969 after it stopped accepting commands.",
      )}</p>
      <a className="text-link" href={apolloCatalog} target="_blank" rel="noreferrer">{t("السجل التقني · ناسا", "Technical record · NASA")} · <bdi>1969-059C</bdi></a>
    </section>
  );
}
