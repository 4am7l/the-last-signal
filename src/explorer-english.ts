import { pathfinderEnglish, pathfinderTimeline } from "./pathfinder";
import { surveyorEnglish, surveyorTimeline } from "./surveyor";
import { intrepidEnglish, intrepidTimeline } from "./intrepid";
import { falconEnglish, falconTimeline } from "./falcon";
import { apolloPhoto } from "./apollo";
import type { Mission } from "./data";
import type { Phase, Shot } from "./journey";

type MissionCopy = Pick<Mission, "intro" | "site" | "frame" | "final" | "detail" | "photoCaption">;

export const missionEnglish: Record<string, MissionCopy> = {
  pathfinder: pathfinderEnglish,
  surveyor3: surveyorEnglish,
  apollo12: intrepidEnglish,
  apollo15: falconEnglish,
  apollo: {
    intro: "Eagle made the first crewed lunar landing and carried the EASEP surface experiments.",
    site: "Tranquility Base · Sea of Tranquility",
    frame: "NASA’s LRO-derived coordinates in the DE421 lunar reference frame.",
    final: "Eagle’s descent stage and surface equipment remain at Tranquility Base. The ascent stage left the Moon, so the complete model shows Eagle as it was at landing.",
    detail: "Eagle had descent and ascent stages. The descent stage, EASEP instruments and unpowered laser retroreflector remained at Tranquility Base.",
    photoCaption: apolloPhoto.en,
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
  pathfinder: "Sojourner rover length: 65 cm",
  surveyor3: "Landing-gear span: 4.2 m",
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
  "1969-07-21:surface": ["First steps on the Moon", "The crew deployed experiments and collected samples. Eagle’s ascent stage lifted off at 17:54:01 UT."],
  "1969-07-24:end": ["Return to Earth", "The crew returned to Earth. Eagle’s descent stage and scientific equipment remained on the Moon."],
};

const archiveEventCopy: Record<string, [string, string]> = {
  "2003-07-08": ["Launch from Earth", "Opportunity launched toward Mars aboard a Delta II rocket."],
  "2003-08-01": ["Interplanetary cruise", "Opportunity traveled from Earth to Mars. The simulation illustrates this phase without plotting the measured trajectory."],
  "2004-01-25": ["Landing in Eagle Crater", "Opportunity landed inside a small crater on Meridiani Planum. The date is in UTC."],
  "2003-06-10": ["Launch", "Spirit left Earth for Gusev Crater."],
  "2003-07-01": ["En route to Mars", "This date marks a point during cruise."],
  "2004-01-04": ["Arrival at Gusev Crater", "Spirit landed in Gusev Crater and began its geological survey. The date is in UTC."],
  "2018-05-05": ["Launch", "InSight launched from Vandenberg."],
  "2018-07-01": ["Cruise to Mars", "This date represents the cruise phase in the simulation."],
  "2018-11-26": ["Landing", "InSight landed in Homestead Hollow on Elysium Planitia."],
  "2020-07-30": ["Launch with Perseverance", "Ingenuity traveled underneath Perseverance. The 3D viewer shows the helicopter on its own for inspection."],
  "2020-09-01": ["Cruise to Mars", "Ingenuity traveled with Perseverance inside the cruise spacecraft."],
  "2021-02-18": ["Landing in Jezero Crater", "Ingenuity reached Mars attached beneath Perseverance."],
  "1969-07-16": ["Launch", "A Saturn V rocket carried Apollo 11 toward the Moon."],
  "1969-07-17": ["Cruise to the Moon", "Apollo 11 traveled toward the Moon. The simulation illustrates the trip."],
  "1969-07-19": ["Lunar orbit insertion", "The crew entered lunar orbit and began preparations to separate Eagle."],
  "1969-07-20": ["Eagle lands", "Armstrong and Aldrin landed in the Sea of Tranquility at 20:17:40 UT."],
};

export function englishEvent(event: Mission["events"][number]) {
  const translated = [...intrepidTimeline, ...falconTimeline, ...surveyorTimeline, ...pathfinderTimeline].find((item) => item.date === event.date && item.title === event.title);
  if (translated) return [translated.enTitle, translated.enText];
  return archiveEventCopy[event.date]
    ?? eventCopy[`${event.date}:${event.stage}`]
    ?? eventCopy[event.date]
    ?? [event.title, event.text];
}

export const englishExplanations: Record<string, { goal: string; finding: string; ending: string }> = {
  pathfinder: { goal: pathfinderEnglish.intro, finding: pathfinderEnglish.detail, ending: pathfinderEnglish.final },
  surveyor3: { goal: surveyorEnglish.intro, finding: surveyorEnglish.detail, ending: surveyorEnglish.final },
  opportunity: {
    goal: "Look for evidence of ancient water in Martian rocks.",
    finding: "Rock measurements showed that water had affected the area in the past. The findings established that water was present there.",
    ending: "A dust storm blocked sunlight from the solar panels. Contact stopped in June 2018, and NASA declared the mission over in February 2019.",
  },
  spirit: {
    goal: "Study the rocks and soil of Gusev Crater to understand how they formed.",
    finding: "Spirit examined rocks and minerals as it explored the Columbia Hills.",
    ending: "Its wheels became stuck at Troy in 2009. The last contact was in March 2010, and recovery attempts ended in May 2011.",
  },
  insight: {
    goal: "Study the Martian interior with seismic measurements from a stationary lander.",
    finding: "InSight recorded marsquakes. Seismic waves provided evidence about the layers inside Mars.",
    ending: "Dust on the solar panels reduced available power. The last contact was in December 2022, and the lander remains at the site.",
  },
  ingenuity: {
    goal: "Test powered, controlled flight in the Martian atmosphere.",
    finding: "The first flight succeeded in April 2021. Later flights demonstrated scouting and other operations.",
    ending: "Rotor blades were damaged on landing after flight 72 in January 2024. The model shows the helicopter before the damage.",
  },
  apollo: {
    goal: "Land a crew on the Moon and bring it back to Earth.",
    finding: "The astronauts worked on the surface and left scientific instruments, including a laser retroreflector.",
    ending: "The ascent stage lifted off to rejoin the command module. The descent stage remained at Tranquility Base.",
  },
};

export const englishAnnualStories: Record<string, Record<number, [string, string]>> = {
  pathfinder: { 1996: ["Launch", "A Delta II carried the lander and Sojourner toward Mars."], 1997: ["Landing and exploration", "Pathfinder landed in Ares Vallis and Sojourner explored near the station."] },
  surveyor3: { 1967: ["Landing and experiments", "The lander tested lunar soil in the Ocean of Storms."], 1969: ["Apollo 12 visits", "Astronauts recovered parts of the lander for study on Earth."] },
  apollo12: { 1969: ["Ocean of Storms", "Intrepid landed near Surveyor 3 and the crew deployed ALSEP."] },
  apollo15: { 1971: ["Hadley–Apennine", "Falcon landed and the crew explored the area using the lunar rover."] },
  opportunity: {
    2003: ["Launch", "A Delta II rocket carried Opportunity inside its protective fairing."],
    2004: ["Eagle and Endurance", "The rover began looking for evidence of water in the rocks."],
    2005: ["Free of the sand", "After weeks of recovery work, the rover escaped and continued south."],
    2006: ["Victoria’s rim", "Opportunity reached Victoria Crater after a long traverse."],
    2007: ["Dust storms and Victoria", "The rover weathered dust storms and began exploring the crater’s interior."],
    2008: ["Leaving Victoria", "Opportunity finished surveying Victoria and headed toward Endeavour."],
    2009: ["Rocks along the route", "The rover examined rocks on its way to Endeavour."],
    2010: ["Santa Maria", "Opportunity reached Santa Maria Crater in December."],
    2011: ["Arrival at Endeavour", "The rover reached the rim in August."],
    2012: ["Matijevic Hill", "Opportunity examined rocks around Matijevic Hill."],
    2013: ["A new distance record", "Opportunity passed the distance traveled by the Apollo 17 rover and continued its rock survey."],
    2014: ["40 kilometers", "Opportunity’s odometer passed 40 kilometers."],
    2015: ["A Martian marathon", "The rover passed marathon distance and continued its survey."],
    2016: ["Winter exploration", "Opportunity managed its power while exploring Marathon Valley."],
    2017: ["Perseverance Valley", "The rover entered Perseverance Valley on Endeavour’s rim."],
    2018: ["Last signal", "Communication stopped during a global dust storm."],
    2019: ["End of mission", "NASA ended attempts to restore contact."],
  },
  spirit: {
    2003: ["To Mars", "Spirit launched and traveled inside its cruise spacecraft."],
    2004: ["Gusev and the Columbia Hills", "The rover examined rocks that showed signs of alteration by water."],
    2005: ["Into the hills", "Spirit climbed Husband Hill and photographed dust devils."],
    2006: ["Home Plate", "The rover examined layers and materials from the area’s geologic past."],
    2007: ["Silica-rich soil", "Spirit found soil rich in silica, evidence of past water activity."],
    2008: ["Winter on a slope", "A slope near Home Plate helped the rover’s panels catch more sunlight."],
    2009: ["Stuck at Troy", "Spirit became stuck in loose soil and recovery attempts began."],
    2010: ["Last contact", "The rover had become a stationary science platform. Contact ceased in March."],
    2011: ["End of mission", "Recovery attempts ended. Spirit remains at Troy."],
  },
  insight: {
    2018: ["Landing and instrument deployment", "InSight landed on Elysium Planitia and placed its seismometer on the surface."],
    2019: ["Listening for marsquakes", "InSight began recording Martian seismic activity."],
    2020: ["Measurements from a fixed site", "Seismic measurements and work on the heat probe continued."],
    2021: ["Inside Mars", "Seismic measurements helped reveal the planet’s interior structure."],
    2022: ["Dust and declining power", "InSight recorded large marsquakes before losing power."],
  },
  ingenuity: {
    2020: ["A ride with Perseverance", "Ingenuity traveled under the rover inside the cruise spacecraft."],
    2021: ["First flight", "After deployment, Ingenuity demonstrated powered flight in the Martian atmosphere."],
    2022: ["Aerial scouting", "The helicopter continued flights in support of surface exploration."],
    2023: ["Extended operations", "Further flights gave the team more experience operating the helicopter on Mars."],
    2024: ["End of flight", "Flight 72 damaged the blades. Ingenuity remains in the Valinor Hills."],
  },
  apollo: {
    1969: ["From Earth to the Moon and back", "Apollo 11 launched, Eagle landed, and the crew returned, leaving the descent stage and equipment on the Moon."],
  },
};

export function englishShot(shot: Shot, missionId: string) {
  const timelines: Record<string, typeof pathfinderTimeline> = { apollo12: intrepidTimeline, apollo15: falconTimeline, surveyor3: surveyorTimeline, pathfinder: pathfinderTimeline };
  const timeline = timelines[missionId];
  if (timeline) {
    const event = timeline.find((item) => item.date === shot.date && item.phase === shot.phase);
    if (event) return { ...shot, title: event.enTitle, text: event.enText };
  }
  const annual = shot.annual ? englishAnnualStories[missionId]?.[Number(shot.date.slice(0, 4))] : undefined;
  const [title, text] = annual ?? eventCopy[`${shot.date}:${shot.phase}`]
    ?? eventCopy[shot.date] ?? phaseCopy[shot.phase];
  return { ...shot, title, text };
}
