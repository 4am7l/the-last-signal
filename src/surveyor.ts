import type { Mission } from "./data";
import type { Shot } from "./journey";

export const surveyorSource = "https://science.nasa.gov/mission/surveyor-3/";
export const surveyorDimensions = "https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf";
const coordinates = "https://lroc.im-ldi.com/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf";
const photo = "https://starchild.gsfc.nasa.gov/docs/StarChild/space_level2/surveyor3.html";

export const surveyorEnglish = {
  site: "Oceanus Procellarum · Surveyor crater",
  frame: "Landing coordinates measured in Lunar Reconnaissance Orbiter imagery.",
  intro: "A robotic lander that tested the lunar soil two years before the Apollo 12 crew visited it.",
  detail: "Surveyor 3 used a TV camera and a robotic scoop to study the surface. The 3D reconstruction shows the lander in its operating configuration, including the camera and scoop later retrieved by Apollo 12.",
  final: "The lander remains inside Surveyor crater. Apollo 12 returned the camera and soil scoop to Earth for study.",
  photoCaption: "Pete Conrad beside Surveyor 3 · NASA / Alan Bean · AS12-48-7133",
};

export const surveyorTimeline: (Shot & { enTitle: string; enText: string })[] = [
  { date: "1967-04-17", phase: "launch", title: "إطلاق سيرفيور 3", text: "حمل صاروخ أطلس–سنتور المسبار من كيب كينيدي.", enTitle: "Surveyor 3 launches", enText: "An Atlas–Centaur launched the probe from Cape Kennedy.", source: surveyorSource },
  { date: "1967-04-20", phase: "touchdown", title: "الهبوط بعد ارتدادين", text: "استقر المسبار داخل الفوهة عند 00:04:17 بالتوقيت العالمي.", enTitle: "Touchdown after two bounces", enText: "The lander came to rest inside the crater at 00:04:17 UTC.", source: surveyorSource },
  { date: "1967-04-20", phase: "surface", title: "تجارب التربة والتصوير", text: "حفرت الذراع خنادق صغيرة واختبرت قدرة التربة على تحمّل الضغط، وأرسلت الكاميرا آلاف الصور.", enTitle: "Imaging and soil tests", enText: "The scoop dug small trenches and tested the soil’s load-bearing strength. The camera sent back thousands of images.", source: surveyorSource },
  { date: "1967-05-04", phase: "end", title: "آخر اتصال", text: "انتهى الاتصال بعد بدء الليل القمري وبقي المسبار داخل الفوهة.", enTitle: "Final contact", enText: "Contact ended after lunar night began. The lander stayed in the crater.", source: surveyorSource },
  { date: "1969-11-20", phase: "end", title: "زيارة أبولو 12", text: "استعاد رواد أبولو 12 كاميرا سيرفيور ومغرفة التربة لدراستهما على الأرض.", enTitle: "Apollo 12 visits the site", enText: "Apollo 12 astronauts retrieved Surveyor’s camera and scoop for study on Earth.", source: photo },
];

export const surveyor: Mission = {
  id: "surveyor3",
  name: "سيرفيور 3",
  en: "Surveyor 3",
  body: "moon",
  model: "surveyor3",
  lat: -3.0162,
  lon: 336.5820,
  site: "محيط العواصف · فوهة سيرفيور",
  frame: "إحداثيات الهبوط المقاسة من صور مركبة الاستطلاع القمرية LRO.",
  intro: "مسبار روبوتي اختبر تربة القمر قبل زيارة رواد أبولو 12 بنحو عامين.",
  detail: "استخدم سيرفيور 3 كاميرا تلفزيونية ومغرفة روبوتية لدراسة السطح. المجسّم إعادة بناء تقريبية لهيئته أثناء العمل، مع الكاميرا والمغرفة اللتين أعادهما أبولو 12 للأرض.",
  final: "بقي المسبار داخل فوهة سيرفيور، بينما أعادت أبولو 12 الكاميرا ومغرفة التربة إلى الأرض للدراسة.",
  photoCaption: "بيت كونراد بجانب سيرفيور 3 · ناسا / آلان بين · AS12-48-7133",
  source: surveyorSource,
  locationSource: coordinates,
  finalSource: surveyorSource,
  modelSource: "/models/surveyor3.glb",
  events: surveyorTimeline.map(({ date, title, text, phase }) => ({
    date, title, text, stage: phase === "touchdown" ? "landing" : phase === "surface" ? "surface" : phase === "launch" ? "launch" : "end",
  })),
};

export const surveyorGallery = [{
  id: "AS12-48-7133",
  ar: "بيت كونراد عند سيرفيور 3، وإنتريبيد في الخلفية",
  en: "Pete Conrad at Surveyor 3, with Intrepid in the distance",
  source: photo,
  thumbnail: "/photos/surveyor3.jpg",
  full: "/photos/surveyor3.jpg",
}];
