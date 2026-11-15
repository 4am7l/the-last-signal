export const eagle = {
  latitude: 0.67416,
  longitude: 23.47314,
  coordinates: "0.67416° N · 23.47314° E",
  footpadSpan: 9.4,
  catalog: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
  coordinateSource: "https://lroc.im-ldi.com/data/support/downloads/2016_LROC_Coordinates_of_Human_Features.pdf",
  modelSource: "https://science.nasa.gov/3d-resources/apollo-lunar-module/",
  photoArchive: "https://www.nasa.gov/wp-content/uploads/static/history/ap11ann/kippsphotos/apollo.html",
};

const photoBase = "/photos/eagle/";
const nasaGallery = new URL(".", eagle.photoArchive).href;
const historicalPhoto = (id: string, file: string, ar: string, en: string) => ({
  id, src: photoBase + file + ".webp", ar, en, source: nasaGallery + file + ".jpg",
});

export const eagleImages = [
  {
    id: "AS11-40-5927", src: photoBase + "5927.webp",
    ar: "باز ألدرين يُخرج التجارب العلمية من إيغل على سطح القمر.",
    en: "Buzz Aldrin unloads scientific experiments from Eagle on the lunar surface.",
    source: "https://nssdc.gsfc.nasa.gov/planetary/image/ap11_lm_as11_40_5927.jpg",
  },
  historicalPhoto("AS11-40-5961", "5961", "إيغل من بعيد بعد الهبوط، بعدسة نيل أرمسترونغ.", "Neil Armstrong’s distant view of Eagle after landing."),
  historicalPhoto("AS11-40-5864", "5864", "فوهة محرك الهبوط أسفل المركبة.", "The descent engine nozzle beneath Eagle."),
  historicalPhoto("AS11-40-5899", "5899", "سُلّم المركبة واللوحة التذكارية.", "The lunar module’s ladder and commemorative plaque."),
  historicalPhoto("AS11-40-5920", "5920", "قدم الهبوط ومسبار ملامسة السطح.", "A landing footpad and its surface contact probe."),
  historicalPhoto("AS11-44-6574", "6574", "إيغل في المدار القمري بعد انفصالها عن كولومبيا.", "Eagle in lunar orbit after undocking from Columbia."),
  historicalPhoto("AS11-44-6642", "6642", "مرحلة الصعود تقترب من كولومبيا بعد الإقلاع من القمر.", "The ascent stage approaches Columbia after departing the Moon."),
  {
    id: "NASA NSSDCA", src: photoBase + "apollo_lm_diagram.gif",
    ar: "رسم هندسي يوضّح مرحلتي الهبوط والصعود في الوحدة القمرية.",
    en: "A technical diagram showing the lunar module’s descent and ascent stages.",
    source: "https://nssdc.gsfc.nasa.gov/image/spacecraft/apollo_lm_diagram.gif",
  },
];
