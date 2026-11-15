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
const { missions } = await load("../src/data.ts", { "./apollo": apolloModule, "./falcon": falconModule, "./intrepid": intrepidModule });
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
  assert.equal(missions.filter((m) => matchesMission(m, "", "mars")).length, 4);
});


test("Apollo 15 lands at the published Falcon site with its own timeline and locally available photos", async () => {
  const { falcon, falconGallery } = await import(falconModule);
  const { shotsFor } = await load("../src/journey.ts", { "./falcon": falconModule, "./intrepid": intrepidModule });
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
  const { shotsFor } = await load("../src/journey.ts", { "./falcon": falconModule, "./intrepid": intrepidModule });
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

test("Apollo markers face the camera when returning from each landing", () => {
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
