import type { Mission } from "./data";
import type { Shot } from "./journey";

export const intrepidCatalog = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C";
export const intrepidCoordinates = "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html";
export const intrepidArchive = "https://www.nasa.gov/gallery/apollo-12/";
export const intrepidScience = "https://ntrs.nasa.gov/citations/19700025955";
export const intrepidModel = "https://science.nasa.gov/3d-resources/apollo-lunar-module/";
const nasaHistory = "https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/";

const events = [
  ["1969-11-14", "launch", "الإطلاق", "انطلقت أبولو 12 على ساتورن 5 الساعة 16:22 UTC. ضرب البرق الصاروخ مرتين، واستعاد الطاقم قراءات الأنظمة بتبديل SCE إلى AUX.", "Launch", "Apollo 12 launched on Saturn V at 16:22 UTC. Two lightning strikes disrupted telemetry, which the crew restored by switching SCE to AUX.", nasaHistory],
  ["1969-11-18", "cruise", "مدار القمر", "دخلت يانكي كليبر وإنتريبيد مدار القمر، استعدادًا للهبوط الدقيق قرب سيرفيور 3.", "Lunar orbit", "Yankee Clipper and Intrepid entered lunar orbit ahead of a precision landing near Surveyor 3.", nasaHistory],
  ["1969-11-19", "entry", "فصل إنتريبيد", "انفصلت إنتريبيد عند 04:16:03 UTC. بقي ريتشارد غوردون في المدار على متن يانكي كليبر.", "Intrepid separates", "Intrepid separated at 04:16:03 UTC. Richard Gordon remained in orbit aboard Yankee Clipper.", intrepidCatalog],
  ["1969-11-19", "touchdown", "الهبوط في محيط العواصف", "هبط بيت كونراد وآلان بين عند 06:54:35 UTC، على بعد أقل من 200 متر من سيرفيور 3.", "Landing in the Ocean of Storms", "Pete Conrad and Alan Bean landed at 06:54:35 UTC, less than 200 metres from Surveyor 3.", intrepidCatalog],
  ["1969-11-19", "deploy", "نشر حزمة ALSEP", "نشر الطاقم أدوات التجارب ورقاقة جمع الرياح الشمسية، وأخذ عينات قرب المركبة. تعطّلت كاميرا التلفزيون بعد توجيهها نحو الشمس.", "ALSEP deployment", "The crew deployed the experiments and a solar-wind collector and sampled near the lander. The television camera stopped working after it was pointed toward the Sun.", intrepidCatalog],
  ["1969-11-20", "surface", "زيارة سيرفيور 3", "استعاد الطاقم أجزاء من سيرفيور 3، منها كاميرا التلفزيون ومغرفة التربة. بلغ مجموع الصخور والتربة من الجولتين 34.35 كغ.", "Visiting Surveyor 3", "The crew recovered parts of Surveyor 3, including its television camera and soil scoop. The two moonwalks yielded 34.35 kg of rock and soil.", intrepidScience],
  ["1969-11-20", "ascent", "الإقلاع من القمر", "أقلعت مرحلة الصعود عند 14:25:47 UTC والتحمت بيانكي كليبر عند 17:58:22. بقيت مرحلة الهبوط على القمر.", "Lunar liftoff", "The ascent stage lifted off at 14:25:47 UTC and docked with Yankee Clipper at 17:58:22. The descent stage stayed on the Moon.", intrepidCatalog],
  ["1969-11-20", "end", "اصطدام مرحلة الصعود", "وُجّهت مرحلة الصعود للاصطدام بالقمر عند 22:17:17.7 UTC، وسجّل مقياس الزلازل الاهتزاز.", "Ascent-stage impact", "The ascent stage deliberately impacted the Moon at 22:17:17.7 UTC. The seismometer recorded the event.", "https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_impact.html"],
  ["1969-11-24", "return", "العودة إلى الأرض", "هبطت يانكي كليبر في المحيط الهادئ، وعاد الطاقم والعينات إلى الأرض.", "Return to Earth", "Yankee Clipper splashed down in the Pacific, bringing the crew and samples back to Earth.", nasaHistory],
] as const;

export const intrepidEnglish = {
  site: "Oceanus Procellarum · near Surveyor Crater",
  frame: "Coordinates of the descent stage from LRO imagery in the DE421 lunar reference frame.",
  intro: "Intrepid (LM-6) carried Pete Conrad and Alan Bean to Apollo 12’s precision landing near Surveyor 3.",
  detail: "The surface scene shows the descent stage that remains at the site. It is reconstructed from NASA’s general Apollo Lunar Module model. The mission story also shows the complete vehicle as it appeared at landing.",
  final: "The descent stage and ALSEP remain in the Ocean of Storms. The ascent stage was deliberately sent to a separate impact site at 3.94° S, 21.20° W.",
  photoCaption: "Pete Conrad beside Intrepid on the Moon · NASA/JSC · AS12-47-6988",
};

export const intrepid: Mission = {
  id: "apollo12", name: "أبولو 12 · إنتريبيد", en: "Apollo 12 · Intrepid", body: "moon", model: "apollo",
  lat: -3.0128, lon: 336.5781,
  site: "محيط العواصف · قرب فوهة سيرفيور",
  frame: "موضع مرحلة الهبوط من صور LRO وفق الإطار القمري DE421.",
  intro: "حملت إنتريبيد (LM‑6) بيت كونراد وآلان بين إلى موقع الهبوط الدقيق لأبولو 12 قرب سيرفيور 3.",
  detail: "يعرض مشهد السطح مرحلة الهبوط الباقية، بتمثيل مبني على مجسّم ناسا العام لوحدة أبولو. تعرض قصة المهمة أيضًا المركبة كاملة بهيئة الهبوط.",
  final: "بقيت مرحلة الهبوط وحزمة ALSEP في محيط العواصف. اصطدمت مرحلة الصعود عمدًا في موقع منفصل عند 3.94° جنوبًا، 21.20° غربًا.",
  photoCaption: "بيت كونراد بجانب إنتريبيد على القمر · NASA/JSC · AS12-47-6988",
  source: intrepidCatalog, finalSource: intrepidCoordinates, locationSource: intrepidCoordinates, modelSource: intrepidModel,
  events: events
    .filter((event) => event[1] !== "entry")
    .map(([date, phase, title, text]) => ({
      date, title, text,
      stage: phase === "touchdown" ? "landing" : phase === "ascent" || phase === "deploy" ? "surface" : phase === "return" ? "end" : phase,
    })),
};

export const intrepidTimeline: (Shot & { enTitle: string; enText: string })[] = events.map(
  ([date, phase, title, text, enTitle, enText, source]) => ({ date, phase, title, text, enTitle, enText, source }),
);

const images = [
  ["AS12-47-6988", "بيت كونراد بجانب إنتريبيد على القمر", "Pete Conrad beside Intrepid on the Moon", "https://www.nasa.gov/image-detail/amf-as12-47-6988/", "https://images-assets.nasa.gov/image/as12-47-6988/as12-47-6988~large.jpg"],
  ["AS12-51-7507", "إنتريبيد في مدار القمر قبل النزول", "Intrepid in lunar orbit before descent", "https://science.nasa.gov/resource/apollo-12-lunar-module-in-landing-configuration-photographed-in-lunar-orbit/", "https://nssdc.gsfc.nasa.gov/planetary/image/apollo12_lunar_module.jpg"],
  ["AS12-46-6728", "آلان بين عند آخر درجات السلّم", "Alan Bean at the bottom of the ladder", "https://www.nasa.gov/image-detail/amf-as12-46-6728/", "https://images-assets.nasa.gov/image/as12-46-6728/as12-46-6728~large.jpg"],
  ["AS12-46-6749", "آلان بين عند حجرة المعدات MESA", "Alan Bean at the MESA equipment bay", "https://www.nasa.gov/image-detail/amf-as12-46-6749/", "https://images-assets.nasa.gov/image/as12-46-6749/as12-46-6749~large.jpg"],
  ["Surveyor-3", "كونراد بجانب سيرفيور 3 وإنتريبيد في الخلفية", "Conrad beside Surveyor 3, with Intrepid in the distance", intrepidCatalog, "https://nssdc.gsfc.nasa.gov/planetary/lunar/a12surveyor3.gif"],
  ["LM-diagram", "مخطط ناسا لوحدة أبولو القمرية", "NASA’s Apollo Lunar Module diagram", intrepidCatalog, "https://nssdc.gsfc.nasa.gov/image/spacecraft/apollo_lm_diagram.gif"],
] as const;

export const intrepidGallery = images.map(([id, ar, en, source, full]) => ({
  id, ar, en, source, full, thumbnail: `/photos/intrepid/${id.toLowerCase()}.webp`,
}));
