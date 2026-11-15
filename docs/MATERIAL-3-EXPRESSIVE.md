# Material 3 Expressive redesign — The Last Signal

## Scope and approach

This branch revises the existing React/Three.js experience in place without rewriting the rendering engine. It covers all four navigable routes: home, archive, guide and explorer. The visual language is **Google Material 3 Expressive–inspired**, not a claim that the Google Material Web package supplies every Expressive component.

### Why we did not install the full `@material/web` package

The official library is in maintenance mode and does not include a complete Expressive React component set. Injecting web components across a functional React/Three.js project would add JS, introduce framework integration risk, and bring minimal visual benefit for the current controls. Instead we use:

- Material 3 semantic color and shape tokens (`--md-sys-*`) in `src/material-theme.css`.
- Material Symbols Rounded, Google's official icon font, loaded once from Google Fonts.
- Native accessible React controls for tabs, navigation, filters, dialogs and toggles.
- Expressive large surfaces, pill-shaped controls and motion easing with reduced-motion handling.

Resources: https://m3.material.io/ and https://material-web.dev/.

## Two complete themes

The theme toggle is a small independent React component (`src/ThemeToggle.tsx`) mounted within the global site header.

- On initial load, an inline script applies the stored theme **before** the first paint.
- With no explicit saved preference, the visitor's OS preference is used, and subsequent OS changes are followed.
- The visitor's first manual toggle stores the chosen theme in `localStorage["tls-theme"]`.
- The semantic variables are inherited by all routes and do not require a React state update in the WebGL scene.
- The `theme-color` metadata and `color-scheme` are updated for mobile browser chrome and native form controls.

## Scientific imagery

Mission galleries are in `src/NasaGallery.tsx`. They use two Cloudflare Pages Functions:

1. `GET /api/nasa-gallery?mission=apollo|opportunity|spirit|insight|ingenuity`
2. `GET /api/nasa-asset?id=<NASA_ID>`

The gallery requests official NASA metadata from `images-api.nasa.gov` only when it approaches the viewport (IntersectionObserver), caches the resulting response at the CDN edge, displays descriptive captions and NASA links, and requests a high-resolution asset only if the visitor opens a photo. The server limits mission IDs, validates asset identifiers and accepts only official HTTPS NASA-hosted images.

The content is not a substitute for photojournal source records. NASA/third-party copyright or endorsement restrictions still apply. The existing `/public/photos` assets remain a graceful fallback if the NASA service is down.

NASA policy: https://www.nasa.gov/nasa-brand-center/images-and-media/

## 3D safety boundary

No changes were made to `Space.tsx`, `Planet.tsx`, `SurfaceWorld.tsx`, terrain generation, ephemerides, simulation physics or camera functions. The visual redesign applies to the DOM surrounding the canvas. The existing landing/navigation interactions and timeline remain in place.

## Verification

The repository's GitHub Actions workflow runs `npm ci`, `npm test`, and `npm run build` (including `tsc --noEmit`) on feature branches.

Manual checks still necessary before merging or publishing:

- Desktop: switch themes on each of the four routes, and verify header, dialogs, archive filters, mission dossier, and exploration controls.
- Mobile: verify sticky/pill navigation, collapsible mission sheet, movement/zoom controls, no horizontal overflow, and reduced-motion.
- 3D: independently test overview, planetary orbit, mission model, location and story modes for both Moon and Mars.
- NASA: confirm the gallery loads, fallback works when offline, metadata corresponds to each mission, and full-resolution viewer opens.
- Visual QA: review light/dark contrast and component spacing in a real browser.

**Do not merge the feature branch to `main` or publish the production site until those visual and interaction checks are done.**
