import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const file = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only Moon and Mars can be selected or rendered", () => {
  const main = file("src/main.tsx");
  const body = file("src/BodyStudy.tsx");
  const planet = file("src/Planet.tsx");
  const overview = file("src/SystemOverview.tsx");
  const space = file("src/Space.tsx");
  const surface = file("src/SurfaceWorld.tsx");

  assert.match(main, /body=\{body\}/);
  assert.doesNotMatch(main, /\["earth", "الأرض"\]/);
  assert.doesNotMatch(main, /overviewBody === "earth"/);
  assert.match(body, /body: "moon" \| "mars"/);
  assert.match(planet, /body:'moon'\|'mars'/);
  assert.doesNotMatch(planet, /EarthSurface|earth-clouds|body==='earth'/);
  assert.doesNotMatch(overview, /'earth'|body="earth"/);
  assert.doesNotMatch(space, /body="earth"|overviewBody\?\?.earth./);
  assert.doesNotMatch(surface, /earthFocus|focusPlanet|body==='earth'/);
  assert.equal(existsSync(new URL("../public/earth.jpg", import.meta.url)), false);
  assert.equal(existsSync(new URL("../public/earth-clouds.png", import.meta.url)), false);
});

test("loader waits for the current scene assets and first visible render frames", () => {
  const space = file("src/Space.tsx");
  const main = file("src/main.tsx");
  assert.match(space, /function SceneAssetsGate/);
  assert.match(space, /body === "moon" && mode === "surface" && <EagleAssets \/>/);
  const surface = file("src/SurfaceWorld.tsx");
  assert.match(surface, /mode==='surface'\|\|close\).*<EagleModel/);
  assert.match(space, /useLoader\(T.TextureLoader, body === "mars" \? "\/mars-nasa-viking.jpg" : "\/moon.jpg"\)/);
  assert.match(space, /frames\.current === 2/);
  assert.match(space, /onReady\(sceneKey\)/);
  assert.match(main, /readySceneKey !== sceneKey/);
  assert.match(main, /<PlanetLoadingIndicator key=\{sceneKey\}/);
  assert.match(main, /aria-busy=\{sceneLoading\}/);
});

test("Material 3 Expressive morph stays accessible and respects reduced motion", () => {
  const indicator = file("src/PlanetLoadingIndicator.tsx");
  const css = file("src/planet-loader.css");
  assert.match(indicator, /role="progressbar"/);
  assert.match(indicator, /aria-label=/);
  assert.match(indicator, /aria-live="polite"/);
  assert.match(css, /@keyframes tls-loading-morph/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /clip-path: polygon/);
  assert.match(css, /var\(--md-sys-color-primary-container\)/);
});

test("the Apollo site pin uses the published position and links to lunar descent", () => {
  const preview = file("src/BodyStudy.tsx");
  const marker = file("src/ApolloSiteMarker.tsx");
  const surface = file("src/SurfaceWorld.tsx");
  assert.match(preview, /point\(eagle.latitude, eagle.longitude, 300\)/);
  assert.match(surface, /mode==='planet'.*<ApolloSiteMarker/);
  assert.match(marker, /href=\{eagle.simulationHref\}/);
  assert.match(marker, /dot\(normal\) <= 0/);
});
