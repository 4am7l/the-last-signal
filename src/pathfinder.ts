import type { Mission } from "./data";
import type { Shot } from "./journey";

export const pathfinderSource = "https://science.nasa.gov/mission/mars-pathfinder/";
export const pathfinderSpecs = "https://www.jpl.nasa.gov/news/press_kits/mpfland.pdf";
const landingCoordinates = "https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=MPFL-M-ASIMET-4-DDR-EDL-V1.0";

export const pathfinderEnglish = {
  site: "Ares Vallis · Chryse Planitia",
  frame: "Planetocentric latitude and east longitude from NASA’s Planetary Data System. The marker identifies the lander.",
  intro: "Mars Pathfinder tested airbag-assisted landing and delivered Sojourner, the first rover to operate on Mars.",
  detail: "The 3D reconstruction shows the open lander, its three solar-panel petals and the six-wheeled Sojourner nearby. The rover’s pose illustrates deployment.",
  final: "The lander remains in Ares Vallis. Its final data transmission arrived on September 27, 1997. Sojourner’s precise final position is unknown.",
  photoCaption: "Sojourner near the rocks nicknamed The Dice · NASA/JPL · PIA01122",
};

export const pathfinderTimeline: (Shot & { enTitle: string; enText: string })[] = [
  { date: "1996-12-04", phase: "launch", title: "الإطلاق على دلتا 2", text: "انطلقت المهمة من كيب كانافيرال باتجاه المريخ.", enTitle: "Delta II launch", enText: "Pathfinder launched from Cape Canaveral toward Mars.", source: pathfinderSource },
  { date: "1997-07-04", phase: "touchdown", title: "الهبوط في آريس فاليس", text: "أبطأت المظلة المركبة وامتصت الوسائد الهوائية الصدمة. ارتدت المركبة عدة مرات قبل أن تستقر وتفتح ألواحها.", enTitle: "Landing in Ares Vallis", enText: "A parachute slowed the descent and airbags absorbed the impact. The lander bounced several times before coming to rest and opening its panels.", source: pathfinderSource },
  { date: "1997-07-05", phase: "deploy", title: "نزول سوجورنر", text: "نزلت سوجورنر ذات العجلات الست عبر منحدر المركبة وبدأت استكشاف الصخور والتربة.", enTitle: "Sojourner rolls onto Mars", enText: "The six-wheeled Sojourner drove down the lander’s ramp and began exploring the rocks and soil.", source: pathfinderSource },
  { date: "1997-09-27", phase: "end", title: "آخر إرسال للبيانات", text: "وصل آخر إرسال من باثفايندر بعد نحو ثلاثة أشهر من العمل على سطح المريخ.", enTitle: "Final data transmission", enText: "The final data transmission from Pathfinder arrived after nearly three months on Mars.", source: pathfinderSource },
];

export const pathfinder: Mission = {
  id: "pathfinder",
  searchAliases: "Ares Vallis Chryse Planitia Sojourner Carl Sagan Memorial Station سوجورنر",
  name: "مارس باثفايندر",
  en: "Mars Pathfinder",
  body: "mars",
  model: "pathfinder",
  lat: 19.1,
  lon: 326.48,
  site: "آريس فاليس · سهول كريسي",
  frame: "خط عرض من مركز المريخ وخط طول شرقي وفق أرشيف ناسا PDS. يشير الموقع إلى منصة الهبوط.",
  intro: "اختبرت مارس باثفايندر الهبوط بالوسائد الهوائية وحملت سوجورنر، أول عربة عملت على سطح المريخ.",
  detail: "إعادة بناء تقريبية تُظهر منصة الهبوط مفتوحة بألواحها الشمسية الثلاثة وعربة سوجورنر ذات العجلات الست بجانبها. وضعية العربة توضيحية.",
  final: "بقيت المنصة في آريس فاليس. وصل آخر إرسال للبيانات في 27 سبتمبر 1997، وموقع سوجورنر النهائي الدقيق غير معروف.",
  photoCaption: "سوجورنر قرب صخور «ذا دايس» · ناسا/JPL · PIA01122",
  source: pathfinderSource,
  locationSource: landingCoordinates,
  finalSource: pathfinderSource,
  modelSource: "/models/pathfinder.glb",
  events: pathfinderTimeline.map(({ date, title, text, phase }) => ({
    date, title, text, stage: phase === "touchdown" ? "landing" : phase === "deploy" ? "surface" : phase === "launch" ? "launch" : "end",
  })),
};

export const pathfinderGallery = [
  ["PIA01122", "سوجورنر قرب صخور «ذا دايس»", "Sojourner near The Dice", "sojourner-rover-near-the-dice"],
  ["PIA01121", "منصة باثفايندر من كاميرا سوجورنر", "Pathfinder lander from Sojourner’s camera", "sojourner-rover-view-of-pathfinder-lander"],
  ["PIA00616", "المنصة والوسائد الهوائية بعد الهبوط", "Lander and airbags after landing", "lander-airbags-and-martian-terrain"],
].map(([id, ar, en, slug]) => ({
  id, ar, en, source: `https://science.nasa.gov/photojournal/${slug}/`,
  thumbnail: `/photos/${id === "PIA01122" ? "pathfinder" : "pathfinder/" + id}.jpg`,
  full: `/photos/${id === "PIA01122" ? "pathfinder" : "pathfinder/" + id}.jpg`,
}));
