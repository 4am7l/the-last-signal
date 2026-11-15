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

test("the empty archive and explorer do not load the removed mission media", () => {
  const editorial = file("src/Experience.tsx");
  const explorer = file("src/main.tsx");
  const space = file("src/Space.tsx");
  assert.match(editorial, /<ThemeToggle\s*\/>/);
  assert.match(editorial, /The archive is currently empty/);
  for (const source of [editorial, explorer, space]) {
    assert.doesNotMatch(source, /NasaGallery|\/photos\/|\/models\/|useGLTF/);
  }
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
