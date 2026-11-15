import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import * as THREE from "three";
const asModule = (source) => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const load = async (file, dependencies = {}) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        stripTypeScriptTypes(
          Object.entries(dependencies).reduce((source, [specifier, url]) => source.replace(JSON.stringify(specifier), JSON.stringify(url)), readFileSync(new URL(file, import.meta.url), "utf8")),
        ),
      ).toString("base64")
  );
const { parseRoute, exploreHref, matchesMission } = await load(
  "../src/navigation.ts",
);
const apolloModule = asModule(stripTypeScriptTypes(readFileSync(new URL("../src/apollo.ts", import.meta.url), "utf8")));
const falconModule = asModule(stripTypeScriptTypes(readFileSync(new URL("../src/falcon.ts", import.meta.url), "utf8")));
const intrepidModule = asModule(stripTypeScriptTypes(readFileSync(new URL("../src/intrepid.ts", import.meta.url), "utf8")));
const surveyorModule = asModule(stripTypeScriptTypes(readFileSync(new URL("../src/surveyor.ts", import.meta.url), "utf8")));
const pathfinderModule = asModule(stripTypeScriptTypes(readFileSync(new URL("../src/pathfinder.ts", import.meta.url), "utf8")));
const { missions } = await load("../src/data.ts", { "./apollo": apolloModule, "./falcon": falconModule, "./intrepid": intrepidModule, "./surveyor": surveyorModule, "./pathfinder": pathfinderModule });
const ids = missions.map((m) => m.id);
test("every mission deep link round trips all simulation modes", () => {
  for (const mission of ids)
    for (const mode of ["planet", "location", "model", "story"])
      assert.deepEqual(parseRoute(exploreHref(mission, mode), ids), {
        page: "explore",
        mission,
        mode,
      });
});
test("the fullscreen explorer defaults to the Moon and keeps a linked body on reload", () => {
  assert.equal(parseRoute("#/explore", ids).mission, "apollo");
  assert.equal(parseRoute("#/explore", ids).mode, "planet");
  assert.deepEqual(parseRoute("#/explore?mission=opportunity&view=overview", ids), {
    page: "explore",
    mission: "opportunity",
    mode: "planet",
  });
});
test("invalid paths and external query values fall back to safe local defaults", () => {
  assert.deepEqual(parseRoute("#/unknown?mission=missing&view=invalid", ids), {
    page: "home",
    mission: ids[0],
    mode: "planet",
  });
  assert.equal(parseRoute("#/archive?mission=apollo", ids).mission, "apollo");
  assert.equal(parseRoute("#/guide", ids).page, "guide");
});
test("archive search supports Arabic variants, English case, location and combined body filters", () => {
  const opportunity = missions[0],
    apollo = missions[4];
  assert.ok(matchesMission(opportunity, "اوبورتيونيتي", "mars"));
  assert.ok(matchesMission(opportunity, " OPPORTUNITY ", "all"));
  assert.ok(matchesMission(apollo, "بحر السكون", "moon"));
  assert.ok(!matchesMission(apollo, "Apollo", "mars"));
  assert.ok(!matchesMission(apollo, "unknown", "all"));
  assert.equal(missions.filter((m) => matchesMission(m, "", "mars")).length, 5);
});


test("Apollo 15 lands at the published Falcon site with its own timeline and locally available photos", async () => {
  const { falcon, falconGallery } = await import(falconModule);
  const { shotsFor } = await load("../src/journey.ts", { "./falcon": falconModule, "./intrepid": intrepidModule, "./surveyor": surveyorModule, "./pathfinder": pathfinderModule });
  assert.deepEqual([falcon.body, falcon.lat, falcon.lon], ["moon", 26.13239, 3.63330]);
  const shots = shotsFor(falcon);
  assert.ok(shots.every((shot) => shot.date.startsWith("1971")));
  assert.ok(shots.some((shot) => shot.phase === "ascent"));
  for (const image of falconGallery) {
    assert.ok(readFileSync(new URL("../public" + image.thumbnail, import.meta.url)).length > 0);
  }
});

test("Intrepid has the LRO landing coordinates, its 1969 timeline and local gallery", async () => {
  const { intrepid, intrepidGallery } = await import(intrepidModule);
  const { shotsFor } = await load("../src/journey.ts", { "./falcon": falconModule, "./intrepid": intrepidModule, "./surveyor": surveyorModule, "./pathfinder": pathfinderModule });
  assert.ok(ids.includes(intrepid.id));
  assert.deepEqual([intrepid.body, intrepid.lat, intrepid.lon], ["moon", -3.0128, 336.5781]);
  const shots = shotsFor(intrepid);
  assert.deepEqual(shots.filter(shot => shot.phase === "touchdown").map(shot => shot.date), ["1969-11-19"]);
  assert.equal(shots.at(-1).date, "1969-11-24");
  assert.ok(matchesMission(intrepid, "Intrepid", "moon"));
  for (const asset of ["/models/apollo.glb", "/photos/apollo12.jpg", ...intrepidGallery.map(photo => photo.thumbnail)]) {
    assert.ok(readFileSync(new URL("../public" + asset, import.meta.url)).length > 0, asset);
  }
});

test("Pathfinder links to Ares Vallis and includes the mission photos and both vehicles", async () => {
  const { pathfinder, pathfinderGallery, pathfinderTimeline } = await import(pathfinderModule);
  assert.deepEqual([pathfinder.body, pathfinder.lat, pathfinder.lon], ["mars", 19.1, 326.48]);
  assert.ok(matchesMission(pathfinder, "Ares", "mars"));
  assert.equal(pathfinderTimeline.find(shot => shot.phase === "touchdown").date, "1997-07-04");
  for (const { thumbnail } of pathfinderGallery) {
    assert.equal(readFileSync(new URL("../public" + thumbnail, import.meta.url)).readUInt16BE(0), 0xffd8);
  }
  const model = readFileSync(new URL("../public" + pathfinder.modelSource, import.meta.url));
  const { nodes } = JSON.parse(model.subarray(20, 20 + model.readUInt32LE(12)));
  assert.equal(nodes.filter(node => node.name?.startsWith("Solar panel petal")).length, 3);
  assert.equal(nodes.filter(node => node.name === "Sojourner wheel").length, 6);
});

test("Intrepid retains every primitive of its landing legs and braces", async () => {
  const { keepApolloDescentStage } = await load("../src/apolloDescentStage.ts");
  const scene = new THREE.Group();
  const module = new THREE.Group();
  module.name = "lunarlande";
  scene.add(module);
  const names = ["group31 15", "group31 16", "group31 g6", "group31 g7", "group31 19", "polySurfa1", "pCube2"];
  const parts = names.map(name => {
    const part = new THREE.Group();
    part.userData.name = name;
    part.add(new THREE.Mesh(), new THREE.Mesh());
    module.add(part);
    return part;
  });
  const descent = scene.clone(true);
  keepApolloDescentStage(descent);
  assert.deepEqual(descent.children[0].children.map(part => part.userData.name), names.slice(0, -1));
  assert.ok(descent.children[0].children.every(part => part.children.length === 2));
  assert.equal(module.children.length, parts.length);
});

test("Lunar markers face the camera when returning from each landing", () => {
  const planet = readFileSync(new URL("../src/Planet.tsx", import.meta.url), "utf8");
  const pointSource = planet.match(/export function point\([^\n]+/)[0];
  const directionSource = planet.slice(planet.indexOf("export function lunarSiteDirection"), planet.indexOf("export function SitePin"));
  const lunarSites = missions.filter((mission) => mission.body === "moon").map((mission) => ({ mission }));
  const functions = stripTypeScriptTypes(pointSource + "\n" + directionSource).replaceAll("export ", "");
  const { point, lunarSiteDirection } = new Function(
    "T", "lunarSites", functions + ";return { point, lunarSiteDirection };",
  )(THREE, lunarSites);
  const center = new THREE.Vector3(0, -299, 0);
  for (const { mission: landingSite } of lunarSites) {
    const up = new THREE.Vector3(0, 1, 0);
    const rotation = new THREE.Quaternion().setFromUnitVectors(point(landingSite.lat, landingSite.lon, 1), up);
    const camera = lunarSiteDirection().applyQuaternion(rotation).multiplyScalar(800).add(center);
    for (const { mission } of lunarSites) {
      const normal = point(mission.lat, mission.lon, 1).applyQuaternion(rotation);
      const pin = normal.clone().multiplyScalar(302).add(center);
      assert.ok(normal.dot(camera.clone().sub(pin).normalize()) > .04, `${mission.id} after leaving ${landingSite.id}`);
    }
  }
});
