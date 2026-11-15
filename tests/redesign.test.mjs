import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function file(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

test("Material tokens include both accessible surface schemes and expressive shape tokens", () => {
  const css = file("src/material-theme.css");
  assert.match(css, /:root\[data-theme="light"\]/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  for (const token of [
    "--md-sys-color-primary:",
    "--md-sys-color-on-primary:",
    "--md-sys-color-surface:",
    "--md-sys-color-on-surface:",
    "--md-sys-shape-corner-extra-large:",
    "--md-sys-motion-easing:",
  ]) {
    assert.ok(css.includes(token), "Missing token " + token);
  }
  assert.match(css, /prefers-reduced-motion/);
});

test("Theme control exposes accessible toggling and follows the visitor preference", () => {
  const toggle = file("src/ThemeToggle.tsx");
  const index = file("index.html");
  assert.match(toggle, /aria-pressed=\{dark\}/);
  assert.match(toggle, /localStorage\.setItem\("tls-theme", next\)/);
  assert.match(toggle, /prefers-color-scheme: dark/);
  assert.match(index, /Material\+Symbols\+Rounded/);
});

test("the Eagle archive includes the supplied and historical photographs", () => {
  const editorial = file("src/Experience.tsx");
  const data = file("src/eagle.ts");
  assert.match(editorial, /<ThemeToggle\s*\/>/);
  assert.match(editorial, /<EagleGallery \/>/);
  const details = file("src/EagleDetails.tsx");
  assert.match(details, /eagleImages\.map/);
  assert.match(details, /<EagleGallery compact \/>/);
  assert.match(editorial, /id="moon-archive-title"/);
  assert.match(editorial, /href=\{eagle.archiveHref\}/);
  assert.match(editorial, /href=\{eagle.simulationHref\}/);
  assert.match(data, /1969-059C/);
  assert.match(data, /AS11-40-5927/);
  assert.match(data, /apollo_lm_diagram\.gif/);
  assert.match(data, /body=moon&view=surface&mission=apollo/);
});

test("The local Samsung font supplies Arabic and English text while Material icons keep their font", () => {
  const index = file("index.html");
  const legacy = file("src/science-theme.css");
  const polish = file("src/expressive-polish.css");
  const entry = file("src/main.tsx");
  const base = file("src/style.css");
  const loader = file("src/planet-loader.css");
  assert.match(index, /rel="preload" href="\/samsung\.ttf" as="font"/);
  assert.doesNotMatch(index, /IBM\+Plex\+Sans\+Arabic|Space\+Grotesk/);
  assert.match(base, /@font-face\s*\{[^}]*font-family: "Samsung";[^}]*url\("\/samsung\.ttf"\)/);
  assert.match(base, /--tls-font: "Samsung", system-ui, sans-serif/);
  assert.match(loader, /font-family: var\(--tls-font\)/);
  assert.match(polish, /\.material-symbols-rounded\s*\{[^}]*font-family: "Material Symbols Rounded"/);
  assert.doesNotMatch(legacy, /@import url\("https:\/\/fonts\.googleapis/);
  assert.match(polish, /--tls-title-weight:\s*700/);
  assert.match(polish, /\.destinations-heading/);
  assert.match(polish, /\.destination--expressive/);
  assert.match(polish, /--tls-shape-card:/);
  assert.ok(entry.includes('import "./expressive-polish.css";'));
});

test("Moon and Mars destination cards retain functional exploration links", () => {
  const page = file("src/Experience.tsx");
  assert.match(page, /aria-labelledby="destinations-title"/);
  assert.match(page, /id="destinations-title"/);
  assert.match(page, /destination--expressive/);
  assert.match(page, /href=\{exploreHref\(body\)\}/);
});

test("Apollo uses the complete historical NASA module with both original stages", () => {
  const glb = readFileSync(new URL("../public/models/apollo.glb", import.meta.url));
  const { nodes } = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)));
  assert.ok(nodes.some((node) => node.name === "group31 15"));
  assert.ok(nodes.some((node) => node.name === "group51 g1"));
  const model = file("src/EagleModel.tsx");
  assert.match(model, /scene\.clone\(true\)/);
  assert.doesNotMatch(model, /removeFromParent/);
});
