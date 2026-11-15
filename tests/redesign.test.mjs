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

test("NASA galleries exist across editorial routes and the explorer", () => {
  const editorial = file("src/Experience.tsx");
  const explorer = file("src/main.tsx");
  assert.match(editorial, /<ThemeToggle\s*\/>/);
  assert.match(editorial, /<NasaGallery mission="apollo"/);
  assert.match(editorial, /<NasaGallery mission="insight"/);
  assert.match(editorial, /<NasaGallery mission=\{chosen\.id\}/);
  assert.match(explorer, /<NasaGallery mission=\{m\.id\}/);
});

test("NASA media endpoints are restricted to official hosts and lazy high-res requests", () => {
  const search = file("functions/api/nasa-gallery.ts");
  const asset = file("functions/api/nasa-asset.ts");
  const gallery = file("src/NasaGallery.tsx");
  for (const id of ["apollo", "spirit", "opportunity", "insight", "ingenuity"]) {
    assert.ok(search.includes(id + ":"), "Missing NASA mission " + id);
  }
  assert.match(search, /hostname\.endsWith\("\.nasa\.gov"\)/);
  assert.match(asset, /hostname\.endsWith\("\.nasa\.gov"\)/);
  assert.match(gallery, /IntersectionObserver/);
  assert.match(gallery, /nasa-asset\?id=/);
  assert.match(gallery, /loading=\{index > 1 \? "lazy" : "eager"\}/);
});
