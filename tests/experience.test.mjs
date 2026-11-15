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
const { parseRoute, exploreHref, destinations } = await load("../src/navigation.ts");

test("both destinations support every explorer view", () => {
  for (const body of destinations) {
    for (const mode of ["overview", "planet", "surface"]) {
      assert.deepEqual(parseRoute(exploreHref(body, mode)), { page: "explore", body, mode });
    }
  }
});

test("the fullscreen explorer defaults to the Moon", () => {
  assert.deepEqual(parseRoute("#/explore"), { page: "explore", body: "moon", mode: "overview" });
});

test("legacy mission links open planetary scenes and archive routes still load", () => {
  assert.deepEqual(parseRoute("#/explore?mission=apollo&view=location"), {
    page: "explore", body: "moon", mode: "surface",
  });
  assert.deepEqual(parseRoute("#/explore?mission=opportunity&view=planet"), {
    page: "explore", body: "mars", mode: "planet",
  });
  assert.equal(parseRoute("#/archive?mission=apollo").page, "archive");
  assert.equal(parseRoute("#/guide").page, "guide");
});

test("unknown routes and destination values fall back to local defaults", () => {
  assert.deepEqual(parseRoute("#/unknown?body=earth&view=invalid"), {
    page: "home", body: "moon", mode: "overview",
  });
});
