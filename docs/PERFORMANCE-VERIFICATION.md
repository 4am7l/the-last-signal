# Loading and rendering verification — 2026-11-13

## Starting point

Reviewed `main` at `56e5704ef33d01439253c659cb8a67107a183bee` before changes.

| Commit | GitHub Actions result | Evidence |
| --- | --- | --- |
| `a51199f` | Failed: TS2554, `useTrekPatch` called with four arguments before the hook accepted its enable flag | [Run 43413439827](https://github.com/4am7l/the-last-signal/actions/runs/43413439827) |
| `dcbd26b` | Passed; fixes that signature mismatch | [Run 43413515484](https://github.com/4am7l/the-last-signal/actions/runs/43413515484) |
| `56e5704` | Passed | [Run 43413578357](https://github.com/4am7l/the-last-signal/actions/runs/43413578357) |

## Changes and concrete bounds

- The opening overview no longer mounts the equipment model. The default rover asset is **11,910,084 bytes**; its download and GLB parsing are deferred until planet/mission selection. This is a deferred asset size, not a measured page-load time reduction.
- Optional Moon/Earth 8K requests start after 1.5 seconds, unless already cached. The bundled maps render first. Final texture resolution and anisotropy are unchanged.
- Height-map RGBA readback is memoized independently of site, quality and DEM changes. These changes no longer allocate and read the same canvas again.
- Distant fragments skip local soil noise when its existing fade is exactly zero. Normal-detail noise is skipped beyond its existing 12 m screen-space cutoff; derivative evaluation stays outside the branch. Near-surface noise, mesh resolution and texture sources are unchanged.
- Moon/Mars night-side visibility now responds to the existing artificial inspection-light checkbox. Turning it off retains the previous night ambient intensity. Solar direction and the continuous terrain/camera descent are unchanged.
- NASA Trek registration/fade and the rover/track transforms remain intact. A regression test checks both mission headings, 1.44 m paired-lane spacing and boulder exclusion along both routes.

## Automated validation

`npm ci --no-audit --no-fund`, `npm test`, and `npm run build` were run locally. All six test files pass. TypeScript and the production bundle pass. Vite still reports a large 3D chunk (approximately 1.12 MB before gzip); this change does not claim a bundle-size reduction.

The old lunar test could not import its relative TypeScript dependency from a data URL. Its loader now resolves that dependency. Two stale assertions now use the actual documented flat-pad/fade bounds (5 m / 1750 m), without changing terrain behavior.

CI now uses the committed lockfile with `npm ci` and runs the tests before the production build.

## Runtime limits

Local Chrome checks cover Moon selection, the Apollo descent and Mars/Opportunity exploration with no captured shader or application errors in those checks. The real DEM service was unavailable locally, so the fallback terrain was exercised; successful live DEM delivery is not claimed. NASA imagery remains optional with the existing fallback. No controlled before/after loading-time or FPS benchmark was collected, so no speed percentage is claimed.

**Cloudflare deployment has not been verified.** A passing GitHub build is not evidence of a successful Cloudflare deployment.
