import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const load = async (file) =>
  import(
    "data:text/javascript;base64," +
      Buffer.from(
        stripTypeScriptTypes(
          readFileSync(new URL(file, import.meta.url), "utf8"),
        ),
      ).toString("base64")
  );
const { parseRoute, exploreHref, matchesMission } = await load(
  "../src/navigation.ts",
);
const { missions } = await load("../src/data.ts");
const ids = missions.map((m) => m.id);
test("every mission deep link round trips all simulation modes", () => {
  for (const mission of ids)
    for (const mode of ["overview", "planet", "location", "model", "story"])
      assert.deepEqual(parseRoute(exploreHref(mission, mode), ids), {
        page: "explore",
        mission,
        mode,
      });
});
test("invalid paths and external query values fall back to safe local defaults", () => {
  assert.deepEqual(parseRoute("#/unknown?mission=missing&view=invalid", ids), {
    page: "home",
    mission: ids[0],
    mode: "overview",
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
