> **تحديث 15 نوفمبر 2026:** هذه الوثيقة تسجّل مراحل سابقة من المحاكاة. العارض الحالي يقتصر على **القمر والمريخ**؛ أُزيل مجسّم الأرض وخرائطه من واجهة الاستكشاف ومن ملفات الإنتاج. تُستخدم بيانات الأرض فقط كمرجع حسابي في بعض معادلات المسافات والبعثات. مؤشر Material 3 Expressive يُعرض حتى تُحمّل الخامات الأساسية ومجسّم المهمة ويُرسم المشهد مرتين؛ التفاصيل الاختيارية تستكمل في الخلفية.

# Planet explorer: implementation and research

## Chosen stack
Keep Three.js + React Three Fiber + Drei already used by this project. OrbitControls manages orbit/dolly and touch; Html renders accessible mission buttons; useGLTF lazily loads the existing NASA equipment. A separate `Planet.tsx` owns globe material, atmospheric rim, pins and local terrain. Adding another rendering engine would duplicate cameras, GPU resources and input handling.

Compared with CesiumJS: Cesium supports tiled heightmap/quantized-mesh terrain and custom ellipsoids, making it suitable for a future planetary terrain service. It does not supply a detailed Mars/Moon terrain service automatically. This update does not pretend procedural terrain is measured Mars terrain.
- https://threejs.org/docs/pages/OrbitControls.html
- https://drei.docs.pmnd.rs/misc/html
- https://drei.docs.pmnd.rs/staging/stars
- https://cesium.com/learn/cesiumjs-learn/cesiumjs-terrain/
- https://cesium.com/learn/cesiumjs/ref-doc/CustomHeightmapTerrainProvider.html

## Coordinate contract
North-positive latitude and east-positive longitude, degrees. On Three.js SphereGeometry the center of an equirectangular map is u=.5. Longitude zero maps to +X and east 90 maps to -Z. Apply the same mission-centered quaternion to the sphere and every pin. Pins are surface-attached, horizon-culled, hidden at long range, and keyboard-focusable only while visible. Markers describe documented landing sites, not unverified final rover positions.

Orbit and location modes share the globe. Selecting a pin focuses its region and opens location details; a separate descent button enters a local metre-scale equipment environment. These are two visual scales, NOT seamless geodetic LOD. Astronomical distances in overview are compressed.

## Assets and fidelity
- `public/moon.jpg`: NASA CGI Moon Kit 2048×1024 LROC colour, official 2K image, delivered without a false resolution upscale.
- `public/moon-height.jpg`: NASA LOLA 1024×512 eight-bit elevation preview, used for subtle bump/displacement; not a numerically calibrated DEM.
- Official source: https://svs.gsfc.nasa.gov/4720/
- Downloads: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg and https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg
- Download transport: MaxwellLee/physics-lab `assets/textures`, because direct NASA downloads timed out in this environment. Its source manifest attributes these files to NASA LRO. NASA SVS / Ernie Wright / LROC / LOLA teams credited.
- `public/earth-clouds.png`: NASA Blue Marble clouds, 2048×1024; greyscale brightness converted to alpha. Source: https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l . NASA Goddard / Reto Stöckli / Robert Simmon; same transport mirror.
- Existing Earth/Mars maps retained: Solar System Scope, CC BY 4.0, https://www.solarsystemscope.com/textures/ . NASA alternative researched: https://science.nasa.gov/3d-resources/mars/ (Viking/USGS).
- Existing NASA GLB equipment and their individual source links in `src/data.ts` retained. These already supply the real equipment models; arbitrary new assets were unnecessary.

Mars has a subtle warm atmospheric rim; Earth has a blue rim and animated cloud layer; Moon has no atmosphere shader. Rim shaders are artistic scattering approximations, not a radiative transfer model. Stars are a decorative field, not an astrometric catalogue.

The local terrain is 24 km across with planetary curvature, deterministic illustrative hills and world-space regolith grain. Near terrain provides metre-scale relief; the equipment footprint is flat to keep its feet on the ground. This is NOT a reconstruction of Eagle crater, Gusev, Jezero, Elysium or Tranquility Base. Shadows, nearby rocks, a wider camera and distant relief replace the old isolated flat stage. Accurate local relief would require registered HiRISE/LOLA DEM tiles, a tile pipeline and georeferenced level-of-detail streaming; these are not supplied by this change.

## Validation
`npm run build` passes TypeScript and production bundling. Mathematical checks cover longitude/latitude orientation, coordinate-to-UV agreement and mission quaternion alignment. Assets are bundled locally (no NASA/CORS requests at runtime). Browser preview was attempted, but the environment reports WebGL renderer disabled and cannot create a context; GPU appearance, shaders, touch performance and mobile rendering have NOT been visually verified. Production build warns about the large existing Three.js chunk; models and Space remain lazy-loaded.

## Lunar detail and physical scale (2026-11-10)

- `lunarTerrain.ts` centralizes mean spherical radii: Moon 1,737,400 m,
  Earth 6,371,000 m, Mars 3,389,500 m. The Moon renderer uses 300 scene
  units per lunar radius, including metre-scaled equipment and rocks.
  Earth now has the correct 3.667:1 radius ratio in the lunar scene.
  Interplanetary separation is still deliberately compressed for browsing.
- The continuous sphere combines 160 logarithmic near-site rings with
  320 uniformly spaced far rings and 320 sectors. This removes sparse
  far-side triangles while preserving local detail around Apollo.
- Crater bowls/rims, sub-metre rocks, local undulations, and filtered dust
  shading are deterministic visual reconstruction, not surveyed features.
  Local relief fades by 1.6 km and leaves the equipment footprint clear.
- Global mountains and large craters follow the existing NASA-derived JPEG.
  Its current 2.1-unit display height range is **not calibrated elevation**.
  Attempts to download NASA's 16-bit TIFF files returned HTTP 503. Do not
  describe the displayed mountain heights as measured physical elevations.
  A future calibrated import should decode uint16 heights as `pixel / 2 -
  10000` metres relative to 1,737,400 m, per the NASA CGI Moon Kit.
- Earth has blue sun-facing limb scattering plus a thin surface haze, with
  a dim night limb. The shaders support the renderer's logarithmic depth.
  This is a visual atmosphere approximation, not a full atmospheric solver.
- Sources: https://svs.gsfc.nasa.gov/4720/ and
  https://science.nasa.gov/moon/by-the-numbers/ .
- Validation: production build, coordinate tests, and lunar geometry/scale
  tests. Visual WebGL QA remains unavailable in the current preview browser.

## Shared Mars/Moon exploration and fixed stars (2026-11-12)

- `SurfaceWorld.tsx` replaces the separate Mars model floor during exploration.
  Each destination keeps one spherical mesh from orbit down to its metre-scaled
  equipment. All four Mars missions keep their existing documented anchors.
  Story-mode transport animations remain educational reconstructions, now with
  a continuous radial terrain mesh instead of overlapping near/far planes.
- Camera approach first aligns outside the globe, then descends on a logarithmic
  distance curve. Near-ground height is checked against the same relief sampler.
  Reduced-motion preference skips the transitions.
- Added deterministic local mountain ranges, crater bowls/rims, rock instances,
  filtered ground grain, and Mars dust haze. Local mountains are visual scenery,
  NOT surveyed mountains at Apollo, Gusev, Elysium, Meridiani, or Jezero.
  Mars global relief is procedural (not MOLA); lunar global displacement still
  uses the existing uncalibrated NASA-derived JPEG. No additional DEM was imported.
- `FixedStars` projects unit sky directions through the rotational part of the
  view matrix. No camera translation, distance attenuation, time animation, or
  randomly regenerated positions. Stars keep pixel sizes and fade in Mars haze.
- `SystemOverview` has stable Earth/Moon/Mars identities independent of the selected
  mission. Exploration mode groups Earth and Moon, with Mars farther away, using
  true body-size ratios but deliberately compressed separations.
- Physical distance mode uses 384,400 km Earth–Moon and an explicitly illustrative
  225,000,000 km Earth–Mars separation. It is not a current ephemeris. Toggle between
  Earth/Moon framing and the full interplanetary scale; labels remain selectable.
  Earth in the lunar sky uses the reference mean lunar distance as well.
- Sources: https://spaceplace.nasa.gov/moon-distance/en/ and
  https://www.nasa.gov/wp-content/uploads/2024/12/esdmd-001-add-rev-b.pdf .
- Browser controls were checked; the preview still cannot create a WebGL context.
  Production build and numerical tests cover the available nonvisual validation.

## Camera and sunlight refinement (2026-11-12)

- `CameraCommands` operates the active OrbitControls in all scenes. Zoom buttons
  ease toward a bounded distance, canvas-focused arrow keys rotate, +/- zoom,
  and Escape/Stop interrupt motion. Pointer input also interrupts auto-flight.
  Surface orbit/pan speed and zoom sensitivity decrease near equipment; the
  close-view polar limit and terrain clearance prevent moving below the ground.
  The pan target is bounded around the selected equipment. Focus Equipment and
  Reset Camera provide recovery paths.
- `solar.ts` owns a common distant-sun direction for all lights, atmospheric
  shaders, and a small visible solar disk. ACES tone mapping and low ambient
  fill preserve a dark night side and clearer terminators.
- Planet materials support analytic occultation by the other spherical bodies
  in the overview. Shadows only appear when a body actually lies sunward on the
  light ray; the overview is not forced into a fabricated eclipse. Penumbra is
  an approximation, not a solar ephemeris or finite-disk eclipse solver.
- Earth uses ocean-dependent specular roughness and a cloud alpha shadow mask.
  The cloud shell is kept aligned with the shadow texture. This mask approximates
  cloud shadows; it is not ray-traced atmospheric volumetrics.
- Lunar displacement now scales with the displayed radius in overview and story
  shots. Local terrain casts/receives filtered shadow maps with a metre-scaled
  normal bias. The existing relief accuracy limitations still apply.
- Validation: TypeScript/Vite production build, existing geometry tests, and
  solar ray/penumbra/shader-integration checks. GPU appearance remains unverified
  because the preview browser has no WebGL context.


## Surface readability and sky (2026-11-15)

- Lunar local crater detail now blends into broad regional mountain shoulders,
  about 180 m–11 km from the equipment. This uses the lunar grey material and
  keeps the landing footprint level. The scenery remains illustrative.
- Mars atmosphere uses a bounded single-scattering approximation with exponential
  density, view and sunlight optical depth, dust phase and planet shadow. It is
  an illustrative rendering model, not measured weather or a full spectral solver.
  Reference: https://science.nasa.gov/mars/facts/ . No atmosphere is added to the Moon.
- Day/night haze colours now interpolate in the correct order. Mars daylight
  suppresses the stellar sky; night and orbital views retain visible stars.
- The 6,000 brightest HYG v4.1 records are bundled locally under CC BY-SA 4.0.
  Default draw count is 4,500; quality caps are 1,800 / 2,800 / 4,200 / 5,500.
  A local worker retains J2000 directions, magnitude ordering and colour index.
  See public/stars-hyg-bright.LICENSE.txt for attribution and modifications.
- Point stars use small, brighter cores; optional photographic Milky Way is
  subdued. There are no procedural luminous cloud substitutes when it is offline.
- Inspection lighting adds invisible overhead fill and a generated reflection
  environment so metallic equipment remains readable at night. The existing
  inspection toggle restores natural lighting and the prior scene environment.
  Orbital fill is weaker; daytime fill only supplies a restrained material bounce.


## Interaction and landscape distance refinement (2026-11-15)

- Hover feedback uses a Material-style state tint, small elevation changes and
  icon movement. Animation is limited to fine mouse pointers and respects the
  reduced-motion preference. Keyboard focus retains a visible state layer.
- Surface approach is keyed to navigation intent rather than terrain rebuilds.
  Async DEM arrivals no longer restart it. Controls are disabled during the
  approach, repeated focus requests are ignored, and a live status confirms the
  first click. The two automatic stages now take about three seconds normally.
- Both rock populations include low, partly buried distant outcrops. Their
  silhouettes scale with distance and retain the body's own material palette.
  Ground contacts now sample the actual rendered triangles with barycentric
  interpolation, avoiding a mismatch with unresolved analytic noise at distance.
- The visible solar disc, terrain directional light and atmospheric scattering
  share SCENE_SUN_DIRECTION from the dated ephemeris and body orientation.
  Angular disc size follows solar distance. The old shadow-casting night fill
  was removed; inspection lamps do not cast a competing shadow direction.
