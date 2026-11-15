import type { Mission } from "./data";
import type { Shot } from "./journey";

const catalog = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C";
const coordinates = "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html";
const modelSource = "https://science.nasa.gov/3d-resources/apollo-lunar-module/";
export const falconPressKit = "https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A15_PressKit.pdf";
export const falconArchive = "https://apollojournals.org/alsj/a15/images15.html";

const events = [
  ["1971-07-26", "launch", "الإطلاق", "انطلق الطاقم على ساتورن 5.", "Launch", "The crew launched aboard Saturn V."],
  ["1971-07-29", "cruise", "دخول مدار القمر", "دخلت إنديفر وفالكون مدار القمر.", "Lunar orbit insertion", "Endeavour and Falcon entered lunar orbit."],
  ["1971-07-30", "landing", "فالكون تهبط", "هبط سكوت وإروين في هادلي–أبينين عند 22:16:29 UTC، وبقي ووردن في المدار.", "Falcon lands", "Scott and Irwin landed at Hadley–Apennine at 22:16:29 UTC. Worden remained in orbit."],
  ["1971-07-31", "surface", "أول استخدام للعربة القمرية", "قاد الطاقم العربة القمرية للمرة الأولى ونشر حزمة التجارب ALSEP.", "First lunar rover drive", "The crew drove the Lunar Roving Vehicle for the first time and deployed ALSEP."],
  ["1971-08-02", "surface", "آخر جولة على السطح", "أكمل الطاقم الجولة الثالثة، وجمع عبر الجولات الثلاث 77.31 كغ من العينات.", "Final surface traverse", "The crew completed the third excursion. The three traverses yielded 77.31 kg of samples."],
  ["1971-08-02", "ascent", "الإقلاع من القمر", "أقلعت مرحلة الصعود بعد نحو 66 ساعة و55 دقيقة على السطح؛ بقيت منصة الهبوط في مكانها.", "Lunar liftoff", "The ascent stage lifted off after about 66 hours and 55 minutes. The descent stage remained at the landing site."],
  ["1971-08-03", "end", "اصطدام مرحلة الصعود", "بعد الالتحام ونقل الطاقم، وُجّهت مرحلة الصعود للاصطدام بالقمر غرب موقع الهبوط.", "Ascent-stage impact", "After docking and crew transfer, the ascent stage was deliberately sent to impact west of the landing site."],
  ["1971-08-07", "return", "العودة إلى الأرض", "هبطت كبسولة إنديفر في المحيط الهادئ.", "Return to Earth", "Endeavour splashed down in the Pacific Ocean."],
] as const;

export const falconEnglish = {
  site: "Hadley–Apennine · near Hadley Rille",
  frame: "LRO-derived coordinates in the DE421 lunar reference frame.",
  intro: "Falcon (LM-10) landed David Scott and James Irwin and carried the first Lunar Roving Vehicle used on the Moon.",
  detail: "The two-stage LM-10 carried a folded lunar rover and ALSEP. The scene uses NASA’s general Apollo lunar module as an illustrative Falcon model.",
  final: "Falcon’s descent stage remains at Hadley–Apennine. The ascent stage was deliberately crashed at a separate site after docking.",
  photoCaption: "Falcon from the ALSEP site during the third moonwalk · NASA · AS15-82-11057",
};

export const falcon: Mission = {
  id: "apollo15", name: "أبولو 15 · فالكون", en: "Apollo 15 · Falcon", body: "moon", model: "apollo",
  lat: 26.13239, lon: 3.63330,
  site: "هادلي–أبينين · قرب أخدود هادلي",
  frame: "إحداثيات مستخرجة من صور LRO وفق الإطار القمري DE421.",
  intro: "هبطت فالكون (LM‑10) بديفيد سكوت وجيمس إروين، وحملت أول عربة قمرية استُخدمت على القمر.",
  detail: "حملت الوحدة ذات المرحلتين عربة قمرية مطوية وحزمة ALSEP. يستخدم المشهد مجسّم ناسا العام لوحدة أبولو لتمثيل فالكون بشكل تقريبي.",
  final: "بقيت مرحلة الهبوط في هادلي–أبينين. بعد الالتحام، وُجّهت مرحلة الصعود للاصطدام بالقمر في موقع منفصل.",
  photoCaption: "فالكون من موقع ALSEP أثناء الجولة الثالثة · ناسا · AS15-82-11057",
  source: catalog, finalSource: coordinates, locationSource: coordinates, modelSource,
  events: events.map(([date, phase, title, text]) => ({
    date, title, text, stage: phase === "ascent" ? "surface" : phase === "return" ? "end" : phase,
  })),
};

export const falconTimeline: (Shot & { enTitle: string; enText: string })[] = events.map(([date, phase, title, text, enTitle, enText]) => ({
  date, phase: phase === "landing" ? "touchdown" : phase, title, text, enTitle, enText, source: catalog,
}));

const images = [
  ["82-11057", "فالكون من موقع التجارب في الجولة الثالثة", "Falcon from the experiment site during the third moonwalk"],
  ["87-11796", "فالكون من زاوية ثانية على سطح القمر", "Falcon from another angle on the lunar surface"],
  ["87-11839", "جانب فالكون وحجرة المعدات العلمية", "Falcon’s southeast side and scientific equipment bay"],
  ["88-11865", "جيمس إروين عند العلم وبالقرب منه فالكون والعربة", "James Irwin at the flag, with Falcon and the lunar rover nearby"],
  ["86-11592", "المحطة المركزية لحزمة ALSEP", "ALSEP central station"],
] as const;

export const falconGallery = images.map(([frame, ar, en]) => ({
  id: `AS15-${frame}`, ar, en, thumbnail: `/photos/falcon/${frame}.webp`,
  source: `${falconArchive}#${frame.split("-")[1]}`,
  full: `https://apollojournals.org/alsj/a15/AS15-${frame}HR.jpg`,
}));
