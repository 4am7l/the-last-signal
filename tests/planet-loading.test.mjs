import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const file = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only Moon and Mars can be selected or rendered", () => {
  const main = file("src/main.tsx");
  const planet = file("src/Planet.tsx");
  const overview = file("src/SystemOverview.tsx");
  const space = file("src/Space.tsx");
  const surface = file("src/SurfaceWorld.tsx");

  assert.match(main, /href=\{exploreHref\(mission, "planet"\)\}/);
  assert.doesNotMatch(main, /\["earth", "الأرض"\]/);
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
  assert.match(space, /useLoader\(T.TextureLoader, body === "mars" \? "\/mars-nasa-viking.jpg" : "\/moon.jpg"\)/);
  assert.match(space, /useGLTF\(\x60\/models\/\$\{props\.m\.model\}\.glb\x60\)/);
  assert.match(space, /frames\.current >= 2/);
  assert.match(space, /onReady\?\.\(sceneKey\)/);
  assert.match(main, /readySceneKey !== sceneKey/);
  assert.match(main, /<PlanetLoadingIndicator key=\{loadingKey\}/);
  assert.match(main, /aria-busy=\{sceneLoading\}/);
});

test("equipment selection paints the destination loader before committing the scene", () => {
  const main = file("src/main.tsx");
  const indicator = file("src/PlanetLoadingIndicator.tsx");
  assert.match(main, /paintFrame = requestAnimationFrame\([\s\S]*?commitFrame = requestAnimationFrame\([\s\S]*?setIndex\(sceneSelection\.index\)/);
  assert.match(main, /sceneLoading = Boolean\(sceneSelection\) \|\|/);
  assert.match(main, /const loadingMode = sceneSelection\?\.mode \?\? mode/);
  assert.match(indicator, /Preparing \$\{mission \?\? name\}/);
});

test("equipment changes keep the previous scene visible behind the loading card", () => {
  const main = file("src/main.tsx");
  const space = file("src/Space.tsx");
  const css = file("src/planet-loader.css");
  assert.match(main, /overScene=\{loadingOverScene\}/);
  assert.match(css, /\.planet-loading-overlay--over-scene\s*\{\s*background: transparent;/);
  assert.match(space, /deferredScene = useDeferredValue\(props\)/);
  assert.match(space, /deferredScene\.sceneKey === props\.sceneKey \? props : deferredScene/);
  assert.match(space, /<SceneAssetsGate \{\.\.\.visibleScene\}/);
});

test("returning to the globe reuses equipment loading while body switches stay direct", () => {
  const main = file("src/main.tsx");
  assert.match(main, /onClick=\{\(\) => change\("planet"\)\}/);
  assert.match(main, /function change\(next: Mode\)\s*\{\s*select\(index, next, false\);\s*\}/);
  const picker = main.match(/<nav className="body-picker"[\s\S]*?<\/nav>/)?.[0] ?? "";
  assert.match(picker, /href=\{exploreHref\(mission, "planet"\)\}/);
  assert.doesNotMatch(picker, /onClick=|setSceneSelection/);
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
