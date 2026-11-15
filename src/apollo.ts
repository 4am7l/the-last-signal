export const apolloCatalog = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C";
export const apolloPhoto = {
  ar: "باز ألدرين يُخرج التجارب العلمية من إيغل · ناسا",
  en: "Buzz Aldrin unloads experiments from Eagle · NASA",
  source: "https://nssdc.gsfc.nasa.gov/planetary/image/ap11_lm_as11_40_5927.jpg",
};

export const apolloImageArchive = "https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/kippsphotos/apollo.html";
const archiveDirectory = new URL(".", apolloImageArchive).href;

const photographs = [
  ["34882", "S69-34882", "The Apollo 11 crew relaxes during training", "طاقم أبولو 11 أثناء التدريب"],
  ["38660", "S69-38660", "Apollo 11 Saturn V on launch pad 39A", "ساتورن V على منصة الإطلاق"],
  ["39525", "S69-39525", "Liftoff of Apollo 11", "لحظة إقلاع أبولو 11"],
  ["39961", "S69-39961", "Apollo 11 liftoff from launch tower camera", "الإقلاع من كاميرا برج الإطلاق"],
  ["39526", "S69-39526", "Moonbound Apollo 11 clears the launch tower", "ساتورن V يغادر برج الإطلاق"],
  ["6550", "AS11-44-6550", "Earthrise viewed from lunar orbit prior to landing", "شروق الأرض من المدار القمري"],
  ["6574", "AS11-44-6574", "Lunar module inspection after undocking", "معاينة إيغل بعد الانفصال"],
  ["6598", "AS11-44-6598", "Lunar module inspection after undocking", "إيغل بعد الانفصال من زاوية ثانية"],
  ["6611", "AS11-44-6611", "Crater 308 viewed from orbit", "فوهة 308 من المدار"],
  ["5390", "AS11-36-5390", "Lunar module pilot Edwin \"Buzz\" Aldrin", "باز ألدرين، طيار الوحدة القمرية"],
  ["39601", "S69-39601", "flight controllers", "مراقبو الرحلة أثناء النزول"],
  ["5454", "AS11-37-5454", "view from LM window", "من نافذة إيغل بعد الهبوط"],
  ["5863", "AS11-40-5863", "Aldrin exits the LM", "ألدرين يغادر إيغل"],
  ["5864", "AS11-40-5864", "lunar module skirt / descent engine nozzle", "فوهة محرك الهبوط"],
  ["5869", "AS11-40-5869", "Aldrin on the LM footpad", "ألدرين على إحدى قواعد الهبوط"],
  ["5872", "AS11-40-5872", "Aldrin erects solar wind experiment", "ألدرين ينصب تجربة الرياح الشمسية"],
  ["5873", "AS11-40-5873", "Aldrin beside solar wind experiment", "ألدرين بجانب تجربة الرياح الشمسية"],
  ["5875", "AS11-40-5875", "Aldrin salutes the U.S. Flag", "ألدرين يحيّي العلم"],
  ["5880", "AS11-40-5880", "Aldrin's boot and footprint in lunar soil", "حذاء ألدرين وأثر قدمه"],
  ["5886", "AS11-40-5886", "Neil Armstrong works at the lunar module", "أرمسترونغ يعمل عند المركبة"],
  ["5899", "AS11-40-5899", "LM ladder and commemorative plaque", "السلم واللوحة التذكارية"],
  ["5902", "AS11-40-5902", "Aldrin stands beside LM strut and probe", "ألدرين بجانب دعامة الهبوط"],
  ["5903", "AS11-40-5903", "Aldrin poses for portrait", "الصورة الشخصية لألدرين على القمر"],
  ["5920", "AS11-40-5920", "LM footpad and contact probe", "قاعدة هبوط ومسبار ملامسة السطح"],
  ["5924", "AS11-40-5924", "LM ascent stage and Earth overhead", "مرحلة الصعود والأرض فوقها"],
  ["5927", "AS11-40-5927", "Aldrin unpacks experiments from LM", "ألدرين يُخرج التجارب من إيغل"],
  ["5931", "AS11-40-5931", "Aldrin unpacks experiments", "ألدرين يفرغ معدات التجارب"],
  ["5942", "AS11-40-5942", "Aldrin carries the surface experiments", "ألدرين يحمل التجارب لنشرها"],
  ["5946", "AS11-40-5946", "Aldrin assembles seismic experiment", "ألدرين يركّب تجربة الزلازل"],
  ["5948", "AS11-40-5948", "Aldrin assembles seismic experiment", "تركيب مقياس الزلازل من زاوية ثانية"],
  ["5954", "AS11-40-5954", "Small crater near LM with rocky bottom", "فوهة صغيرة قرب إيغل"],
  ["5961", "AS11-40-5961", "Armstrong photo of LM from a distance", "إيغل من بعيد بعدسة أرمسترونغ"],
  ["5964", "AS11-40-5964", "Aldrin retrieves solar wind experiment", "ألدرين يستعيد تجربة الرياح الشمسية"],
  ["5480", "AS11-37-5480", "Flag and TV camera viewed from LM window", "العلم وكاميرا التلفزيون من نافذة إيغل"],
  ["5528", "AS11-37-5528", "Armstrong in LM after historic moonwalk", "أرمسترونغ بعد السير على القمر"],
  ["6642", "AS11-44-6642", "LM approaches CSM for docking / earthrise in b.g.", "مرحلة الصعود تقترب من كولومبيا"],
  ["6667", "AS11-44-6667", "view of full lunar disc during return trip", "قرص القمر في طريق العودة"],
  ["6689", "AS11-44-6689", "crescent Earth photographed during return trip", "هلال الأرض في طريق العودة"],
  ["6692", "AS11-44-6692", "closeup of Earth and terminator", "جانب الأرض المضاء وحدّ الظل"],
  ["40023", "S69-40023", "Mission Control celebrates after splashdown", "مركز التحكم يحتفل بعد الهبوط البحري"],
  ["40024", "S69-40024", "Mission Control celebrates Apollo 11", "احتفال مركز التحكم بنجاح أبولو 11"],
  ["40147", "S69-40147", "Apollo 11 astronauts still in their quarantine van", "الطاقم داخل مركبة الحجر الصحي"],
];

export const apolloGallery = [
  ...photographs.map(([file, id, en, ar]) => ({
    id, ar, en,
    thumbnail: file === "5927" ? "/photos/apollo.jpg" : `/photos/eagle/${file}.webp`,
    source: file === "5927" ? apolloPhoto.source
      : file === "5886" ? "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/AS11-40-5886.jpg"
      : archiveDirectory + (file === "5942" ? "5942a" : file) + ".jpg",
  })),
  {
    id: "LM diagram",
    ar: "رسم هندسي لمرحلتي الهبوط والصعود",
    en: "Technical diagram of the descent and ascent stages",
    thumbnail: "/photos/eagle/apollo_lm_diagram.gif",
    source: "https://nssdc.gsfc.nasa.gov/image/spacecraft/apollo_lm_diagram.gif",
  },
];
