import type { Mission } from "./data";
import type { Phase, Shot } from "./journey";

type MissionCopy = Pick<Mission, "intro" | "site" | "frame" | "final" | "detail" | "photoCaption">;

export const missionEnglish: Record<string, MissionCopy> = {
  apollo: {
    intro: "The crew returned to Earth. The descent stage and instruments stayed on the Moon.",
    site: "Tranquility Base · Sea of Tranquility",
    frame: "NASA’s published Apollo 11 landing coordinates, in degrees north and east.",
    final: "Eagle’s descent stage and surface equipment remain at Tranquility Base. The ascent stage left the Moon, so the complete model shows Eagle as it was at landing.",
    detail: "Eagle had two stages, one for landing and one for ascent. The equipment left behind includes a laser retroreflector.",
    photoCaption: "Buzz Aldrin on the Moon, photographed by Neil Armstrong · NASA",
  },
  opportunity: {
    intro: "A planned 90-day rover mission became more than 14 years of exploration.",
    site: "Eagle Crater · Meridiani Planum",
    frame: "MOLA / IAU 2000 · Published landing coordinates. The rover’s final location is different.",
    final: "Perseverance Valley, on the rim of Endeavour Crater. NASA’s traverse map marks the location of the last contact on June 10, 2018.",
    detail: "The solar-powered rover had six wheels, panoramic cameras and instruments on its arm for examining rocks. It found evidence of ancient water on Mars.",
    photoCaption: "Artist’s rendering of a Mars Exploration Rover · NASA/JPL-Caltech",
  },
  spirit: {
    intro: "Spirit climbed the Columbia Hills and found clues to Mars’s watery past.",
    site: "Gusev Crater · Landing site",
    frame: "MOLA / IAU 2000 · Published landing coordinates.",
    final: "Spirit remains at Troy, west of Home Plate in the Columbia Hills, where its wheels became stuck in loose soil.",
    detail: "Spirit shared Opportunity’s rover design. Its cameras and robotic arm examined rocks and minerals. It continued taking measurements after becoming stuck.",
    photoCaption: "Artist’s rendering of a rover built for the Spirit and Opportunity missions · NASA/JPL-Caltech",
  },
  insight: {
    intro: "A stationary lander used marsquakes to study the interior of Mars.",
    site: "Homestead Hollow · Elysium Planitia",
    frame: "Planetocentric coordinates tied to MOLA. The published study reports a difference of about 220 m from the inertial location.",
    final: "InSight remains at its landing site in Homestead Hollow.",
    detail: "The solar-powered lander carried a seismometer and a robotic arm. NASA’s model shows its configuration before the instruments were placed on the surface.",
    photoCaption: "Artist’s rendering of InSight · NASA/JPL-Caltech",
  },
  ingenuity: {
    intro: "The first powered, controlled flight on another planet.",
    site: "Jezero Crater · Perseverance landing area",
    frame: "This marker shows where Perseverance landed. Ingenuity’s last position is in the Valinor Hills.",
    final: "Perseverance photographed Ingenuity in the Valinor Hills on February 21, 2024, after flight 72 damaged its rotor blades.",
    detail: "Ingenuity used two counter-rotating rotors and a solar panel. The model shows it before the rotor blades were damaged.",
    photoCaption: "Ingenuity in the Valinor Hills, February 21, 2024 · NASA/JPL-Caltech/ASU/MSSS",
  },
};

export const englishDimensions: Record<string, string> = {
  rover: "Rover width: 2.3 m",
  insight: "Solar panel span: 6 m",
  ingenuity: "Rotor diameter: 1.2 m",
  apollo: "Landing gear span: about 9.4 m",
};

const phaseCopy: Record<Phase, [string, string]> = {
  launch: ["Launch", "The launch vehicle carries the spacecraft inside a protective fairing."],
  separation: ["Stage separation", "Spent stages separate after completing their burns. The timing here is illustrative."],
  cruise: ["Cruise", "The cruise stage carries the spacecraft and provides power and guidance."],
  entry: ["Descent begins", "The spacecraft begins its descent toward the landing site."],
  parachute: ["Parachute deployment", "The parachute slows the spacecraft before the final descent."],
  touchdown: ["Touchdown", "The landing system brings the spacecraft to the surface."],
  deploy: ["Surface deployment", "The spacecraft prepares for operations on the surface."],
  surface: ["Surface operations", "The mission continues on the surface."],
  end: ["End of mission", "See the linked mission record for the final operations and equipment location."],
  ascent: ["Lunar ascent", "Eagle’s ascent stage leaves the descent stage on the Moon and rejoins the command module."],
  return: ["Crew return", "The command module returns the crew to Earth."],
};

const eventCopy: Record<string, [string, string]> = {
  "2004-03-02": ["Evidence of ancient water", "NASA reported that rocks at the landing site preserved evidence of a past watery environment."],
  "2011-08-09": ["Arrival at Endeavour Crater", "Opportunity reached the crater rim after crossing Meridiani Planum."],
  "2015-03-24": ["A marathon on Mars", "Opportunity’s odometer passed the length of a marathon."],
  "2018-06-10": ["Last signal", "A global dust storm cut sunlight to Opportunity’s solar panels. Contact ceased."],
  "2019-02-13": ["End of mission", "NASA ended recovery attempts. Opportunity remained in Perseverance Valley."],
  "2005-08-21": ["Husband Hill summit", "Spirit reached the summit, with a broad view of the surrounding terrain."],
  "2009-05-01": ["Stuck in loose soil", "Spirit’s wheels became stuck at Troy in May. The timeline marks the start of that month."],
  "2010-03-22": ["Last contact", "Spirit sent its final known transmission before the Martian winter."],
  "2011-05-25": ["End of recovery attempts", "NASA ended attempts to contact Spirit."],
  "2018-12-19": ["Seismometer deployment", "InSight’s robotic arm placed the seismometer on the Martian surface."],
  "2019-04-06": ["First recorded marsquake", "InSight detected its first confirmed Martian seismic signal."],
  "2022-05-04": ["Largest recorded marsquake", "InSight recorded the strongest marsquake detected by the mission."],
  "2022-12-15": ["Last contact", "Dust buildup reduced the power available from InSight’s solar panels."],
  "2022-12-21": ["Mission declared complete", "InSight remained at its landing site."],
  "2021-04-19": ["First flight", "Ingenuity made the first powered, controlled flight on another planet."],
  "2021-05-07": ["Operations demonstration", "After its fifth flight, Ingenuity began demonstrating scouting and operational capabilities."],
  "2024-01-18": ["Flight 72", "Rotor blades were damaged during landing, ending Ingenuity’s ability to fly."],
  "2024-02-21": ["Photograph from the Valinor Hills", "Perseverance photographed Ingenuity at its final location."],
  "1969-07-21:surface": ["First steps on the Moon", "The astronauts walked on the surface and left it later that day in Eagle’s ascent stage."],
  "1969-07-24:end": ["Return to Earth", "The crew returned to Earth. Eagle’s descent stage and scientific equipment remained on the Moon."],
};

export function englishShot(shot: Shot) {
  const [title, text] = eventCopy[`${shot.date}:${shot.phase}`]
    ?? eventCopy[shot.date] ?? phaseCopy[shot.phase];
  return shot.annual
    ? { ...shot, title: `${shot.date.slice(0, 4)} mission update`, text }
    : { ...shot, title, text };
}
