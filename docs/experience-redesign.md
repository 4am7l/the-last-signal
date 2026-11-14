# Experience redesign — 2026-11-14

## Inspection before implementation

Reviewed `4am7l/the-last-signal` at `d5fbc24`, its deployed home screen, mission data, timeline controls, mobile controls and scene entry points. Visually inspected the supplied EXOARCHIVE reference and its navigation/catalogue structure.

| Area | Existing Last Signal | Reference observation | Implemented direction |
| --- | --- | --- | --- |
| Entry | Simulation controls and introduction share the first screen | Editorial introduction before detailed exploration | Original Arabic cinematic home, charcoal/amber palette, waveform identity and existing Apollo photograph |
| Information structure | Five compact text cards beneath the simulation | Browsable catalogue, sources and contextual storytelling | Home, observatory, searchable archive and field guide with browser-history-aware links |
| Archive | Direct launch into a model | Searchable, illustrated records | Image records, Arabic/English/location search, destination filters, landing-year sort, sourced dossiers and timelines |
| Exploration | Orbital, model, site and story states | Multiple ways into objects and stories | Preserve all five existing simulation modes and link records directly to the relevant mission/view |
| Mobile | Existing touch navigation and collapsible details | Readable structured content | Responsive editorial pages, narrower filters, retained touch/walk/drone controls and improved settings placement |

No reference code, assets, branding or prose was copied. Photography is from the existing repository; data, models, coordinates, source links and caveats remain drawn from `src/data.ts` and the existing simulation. The redesign does not claim new mission facts, live telemetry or verified surface reconstructions.

## Behavior

- Hash routes work on static hosting without server rewrite changes: `#/`, `#/archive`, `#/guide`, and `#/explore?mission=apollo&view=location`.
- Invalid mission IDs and modes fall back safely. Back/forward navigation restores the destination and view.
- The home, guide and archive render without mounting WebGL; the existing lazy scene is loaded on entering exploration.
- Archive dossiers include mission events, equipment details, final-state descriptions, coordinate caveats, photo credits and original source links.
- Intro and scene-entry transitions respect reduced-motion preferences.
- Source/photo dialogs trap keyboard focus, restore focus on close and support Escape. A skip link targets the page content.
- The original renderer, planet/surface/camera logic, mission data and Ultra quality settings are unchanged.

## Validation

- `npm run build`: passes TypeScript and production bundling.
- `npm test`: nine passing tests, comprising six existing scene/terrain/coordinate checks and three added route/search checks.
- Browser: Arabic search without hamza, empty-result reset, Moon filter, Apollo dossier, archive-to-story link, timeline end date (1969-07-24), source-dialog open/Escape, and mobile walk-control availability verified.
- Visual review: desktop home and dossier; responsive home/archive at 390 px; simulation controls at 320 px. Content widths checked at 320 and 768 px, including the narrower viewport after scrollbars, without horizontal overflow in the archive.
- The QA browser reports WebGL renderer/context creation disabled. This also affects the pre-change production site. Actual GPU rendering, surface touchdown and camera flight could not be visually verified here; the existing relevant code and tests are preserved. Verify those interactions on a WebGL-capable device.
- Vite reports the existing large scene bundle (about 1.12 MB uncompressed). It remains lazy-loaded. This change does not lower quality or claim to eliminate the renderer's GPU cost.
