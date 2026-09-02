# trassia-viewer-patches — MPL-2.0 Source Offer

This repository publishes the **source code of all MPL-2.0-licensed files that Trassia
modified** in its deployment of the IFC-Lite viewer application
(upstream: https://github.com/LTplus-AG/ifc-lite, Mozilla Public License 2.0).

It exists to satisfy the source-availability obligation of the MPL 2.0 (§3.2) for the
executable form served at https://viewer.trassia.com.

## Contents

- `patches/` — the exact patches (`0001`–`0048`) applied, in numeric order, on top of
  upstream commit `49dfc3090425569095622ca567715d017c4cf166` (tag `@ifc-lite/wasm@6.1.1`)
- `modified-files/` — the forty-eight modified files in full source form
  (base commit + all patches applied):
  - `apps/viewer/src/components/viewer/CesiumOverlay.tsx`
  - `apps/viewer/src/components/viewer/Drawing2DCanvas.tsx`
  - `apps/viewer/src/components/viewer/HierarchyPanel.tsx`
  - `apps/viewer/src/components/viewer/LensPanel.tsx`
  - `apps/viewer/src/components/viewer/PropertiesPanel.tsx`
  - `apps/viewer/src/components/viewer/Section2DPanel.tsx`
  - `apps/viewer/src/components/viewer/StatusBar.tsx`
  - `apps/viewer/src/components/viewer/SunSkyPanel.tsx`
  - `apps/viewer/src/components/viewer/ViewerLayout.tsx`
  - `apps/viewer/src/components/viewer/Viewport.tsx`
  - `apps/viewer/src/components/viewer/ViewportContainer.tsx`
  - `apps/viewer/src/components/viewer/cesium/useCesiumBridge.ts`
  - `apps/viewer/src/components/viewer/hierarchy/HierarchyNode.tsx`
  - `apps/viewer/src/components/viewer/properties/ModelMetadataPanel.tsx`
  - `apps/viewer/src/components/viewer/properties/PropertySetCard.tsx`
  - `apps/viewer/src/components/viewer/ribbon/tabs/ViewTab.tsx`
  - `apps/viewer/src/components/viewer/sidebar/ActivityBar.tsx`
  - `apps/viewer/src/components/viewer/sidebar/SidebarDock.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurePanel.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurePointReadout.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurementVisuals.tsx`
  - `apps/viewer/src/components/viewer/tools/SectionPanel.tsx`
  - `apps/viewer/src/components/viewer/tools/formatDistance.ts`
  - `apps/viewer/src/components/viewer/tools/measure-modes/components.test.ts`
  - `apps/viewer/src/components/viewer/tools/measure-modes/geo-readout.tsx`
  - `apps/viewer/src/components/viewer/tools/measure-parity.test.tsx`
  - `apps/viewer/src/components/viewer/useRenderUpdates.ts`
  - `apps/viewer/src/hooks/dxfExportGeoref.test.ts`
  - `apps/viewer/src/hooks/useAnnotation2D.ts`
  - `apps/viewer/src/hooks/useDrawingExport.ts`
  - `apps/viewer/src/hooks/useDrawingGeneration.ts`
  - `apps/viewer/src/hooks/useIfcLoader.ts`
  - `apps/viewer/src/hooks/useMeasure2D.ts`
  - `apps/viewer/src/hooks/useViewControls.ts`
  - `apps/viewer/src/lib/geo/cesium-bridge.ts`
  - `apps/viewer/src/lib/panels/registry.ts`
  - `apps/viewer/src/lib/panels/renderPanelBody.tsx`
  - `apps/viewer/src/main.tsx`
  - `apps/viewer/src/store/index.ts`
  - `apps/viewer/src/store/slices/measurementSlice.ts`
  - `apps/viewer/src/store/slices/sidebarSlice.test.ts`
  - `apps/viewer/src/store/slices/sidebarSlice.ts`
  - `apps/viewer/vite.config.ts`
  - `packages/drawing-2d/src/dxf-exporter.test.ts`
  - `packages/drawing-2d/src/dxf-exporter.ts`
  - `packages/drawing-2d/src/dxf/writer.test.ts`
  - `packages/drawing-2d/src/dxf/writer.ts`
  - `packages/drawing-2d/src/index.ts`
- `LICENSE` — Mozilla Public License 2.0 (unchanged, from upstream)

All files in this repository are licensed under the **MPL-2.0**.

## What the patches do

- `0001`–`0003` — Swiss coordinate readout for the measurement tools
  (LV95/LV03 formatting, georeference status).
- `0004`–`0005` — property panel: Swiss/Trassia provenance property sets sorted
  to the top with a family badge, a free-text filter over the selected element's
  properties, and a one-click "colour by data origin" row in the Lens panel.
- `0006` — section panel: a "cross-section at station" block that places the
  section plane perpendicular to an `IfcAlignment` centreline at a chosen
  station (import plus one line of JSX; all of the logic lives in newly created
  files outside this source offer).
- `0007`–`0010` — corrections from the end-user acceptance test of 2026-08-26:
  - `0007` the object inspector's world position is now the real projected
    coordinate (E/N/H through the model's `IfcMapConversion`) instead of model
    coordinates printed under the letters E/N beside an `EPSG:2056` chip; with
    no georeference the row says `local` and carries no CRS chip. Includes the
    matching adjustment to the upstream test that pinned the old labels.
  - `0008` the measurement axis breakdown is ΔE/ΔN/ΔH on a georeferenced model
    (upstream's dX/dY/dZ are renderer axes, which put the northing under `dZ`
    with the sign inverted); E/N/H rows for polyline vertices and angle picks;
    the live coordinate box also follows polyline and angle measurements; the
    measure panel no longer sits under the ViewCube at phone width.
  - `0009` a failed `?model=` link and an unusable file report themselves
    visibly (empty, non-STEP and truncated files used to load as "IFC4 ·
    Ready"); an HTML response is never taken for a model.
  - `0010` `Elements with Geometry` renamed to `Elements in Storeys` (it counts
    storey assignments); a length of exactly zero prints `0.000 m`, not
    `0.0 mm`. Includes the matching adjustment to the upstream test.
- `0011`–`0012` — corrections from the same acceptance test, finding M-11
  (DXF export):
  - `0011` the exported DXF declares its unit in the header (`$INSUNITS = 6`,
    metres) instead of only in a `999` comment that no CAD import reads.
    Includes the matching adjustments to the three upstream tests that pinned
    the absence of the variable; their R12-conformance assertions are untouched.
  - `0012` a section cut placed at a station on an `IfcAlignment` exports as
    `<axis>_<station>_<date>.dxf` instead of `section-<direction>-<percent>.dxf`.
- `0013` — project sets: `?project=<slug>` loads a curated JSON manifest from
  the same origin and federates the models it names, then applies the start
  view, an optional auto-colour lens and an optional cross-section at an
  alignment station. Only a NAMED project stands the single-file `?model=`
  branch down; on narrow viewports the section panel folds itself away once it
  has placed the manifest's cut, and a headless hook evaluates the lens where
  the Lens panel is never mounted.
- `0014`–`0018` — cross-section (Querprofil) view: a caption stamp above the 2D
  canvas and in the sheet-mode title block (`0014`); the "Cross-section view"
  (corridor width, vertical exaggeration) and "Cross-sections along a line"
  blocks in the section panel (`0015`); the 3D section cap uses the
  **undistorted** drawing so an exaggeration set for the 2D panel never leaks
  into world space (`0016`); SVG, PDF and DXF exports use that same undistorted
  drawing — corridor in, exaggeration out (`0017`); a spatial pre-filter to the
  section corridor before the cut, corridor clipping and exaggeration after it,
  and the corridor setting in the regeneration key (`0018`). None of the five
  touches an upstream test, and all are inert without an alignment or user-line
  section.
- `0019`–`0025` — Trassia panels and terrain: registry entries and body cases
  for the terrain-drape (`0019`), cut-and-fill (`0021`) and longitudinal-profile
  (`0024`) panels — each APPENDED so the upstream's frozen Alt+1..0 mapping is
  untouched; draped line segments joined into the same GPU line buffer as the
  upstream's 3D DXF lines, and a file dropped on the viewport additionally
  draped onto the terrain (a DXF over 20 MB no longer also goes to the upstream
  2D underlay, whose import runs on the main thread in one pass) (`0020`); the
  project's tile sets as ADDITIONAL primitives of the same Cesium scene
  (`0022`) and their list above the model list in the hierarchy panel (`0023`);
  a pure re-export making `DxfWriter`/`sanitizeDxfLayerName` public so the
  longitudinal profile reuses the upstream DXF writer instead of forking it
  (`0025`).
- `0026`–`0032` — UX: a third Rollup entry for the pop-out window page
  (`0026`); the pop-out button in the 2D panel header (`0027`); the section
  panel (`0028`) and the 2D panel (`0029`) each swap their root element for a
  frame component that adds a height cap, sane z-ordering, a drag handle and —
  for the section panel — a dock button; a dock slot as first row of the right
  sidebar, rendering `null` without a docked panel (`0030`); the named-views
  row, the narrow-viewport hint and the panel-stack observer in the same row as
  the project strip, each rendering `null` when its case is absent (`0031`);
  the hierarchy row buttons grow from 18×18 px, hover-only, to 24×24 px, always
  visible (`0032`).
- `0033`–`0034` — alignment-design spike, entirely behind `?entwurf=1`: the
  registry entry is the list's ONLY conditional one and its body is reachable
  solely through a dynamic import, so the flag gates loading, not mere
  visibility (`0033`); the design corridor mesh is appended to the scene's
  batches and its edge lines merged into the shared line buffer through the
  same function the drape uses (`0034`).
- `0035` — CSP: one Vite plugin entry (`chKnockoutCsp()`, plugin in the overlay)
  rewrites the `this || (0,eval)("this")` global-object probe in the Knockout
  bundled with CesiumJS to `globalThis`. Without it, `import('cesium')` throws
  under a CSP whose `script-src` has no `'unsafe-eval'`. The build aborts if
  the expression is missing or a shipped bundle still contains `(0,eval)`.
- `0036`–`0037`, `0041` — Swiss context and WFS layers in world mode: two more
  hooks behind the tile hook — the optional swisstopo environment
  (buildings/vegetation/terrain, default OFF) and WFS layers as clamped
  `GeoJsonDataSource` (`0036`); their switches in the world-mode branch of the
  Sun & Sky panel, with the upstream base-map picker parked behind
  `CH_BASISKARTEN_VERFUEGBAR` because none of its four sources can load under
  the deployed CSP (`0037`); the base-map loading path itself shut down
  fail-closed — visible globe, no request — including a guard that stops the
  default `google-photorealistic` from silently calling cesium-ion (`0041`).
- `0038`, `0040` — pop-out window correctness: device-pixel ratio, keyboard and
  mouse listeners, the focused-input check and the wheel-zoom effect all follow
  the window the canvas ACTUALLY lives in (`canvas.ownerDocument.defaultView`)
  instead of the main window, and the narrow-header decision follows the
  measured panel width (`0038`); a hook re-fits the drawing while the child
  window is still settling its size, because the upstream's one-shot 50 ms fit
  runs before the pop-out has its real dimensions (`0040`).
- `0039` — the Normalprofil dimension chains, class labels and provenance note
  are drawn at the very end of the 2D canvas effect — an annotation ABOVE the
  profile — with all decisions (which alignment, which station) computed in
  overlay code.
- `0042` — the IFC model sits at LN02 level in the world scene: the geoid share
  the upstream adds to the IFC height runs through `chCesiumGeoidAnteil()`
  (0 in this scene, because swisstopo serves LN02 heights in the field Cesium
  reads as ellipsoidal) — in `computeCesiumModelOrigin` and in the
  snap-to-terrain mirror value alike. Before: the model floated 48.288 m above
  its surroundings (measured). The user's `cesiumHeightsAreEllipsoidal` opt-out
  is untouched.
- `0043` — one import line, `import './ch-dichte.css'` directly after
  `./index.css`: an overlay stylesheet cannot include itself, and the order
  matters because the density rules attach to Tailwind classes.
- `0044`–`0045` — sidebar sizing: a 240-px pixel floor beside the upstream's
  percent floor (a percent floor scales the wrong way — 14 % is 224 px on a
  1600-px screen but 482 px on 3440 px), with `MIN_WIDTH_PCT` lowered 14 → 6 as
  the persistence clamp, and the upstream clamp test following the new bound
  (`0044`); the DEFAULT width becomes `min(340 px, 22 %)` via
  `defaultWidthPct()`, applied at first start, broken stored value and layout
  reset only — a saved user width is never overwritten (`0045`).
- `0046` — header cleanup: the two Trassia header strips above the ribbon
  (project-loading strip, saved-views row) are unmounted from the layout; the
  project status moves into the left section of the status bar and the saved
  views become a "Saved views" ribbon group in the View tab (both new hosts
  are overlay components). The Swiss surroundings switches (swisstopo
  buildings/vegetation/terrain and official WFS layers) move out of the
  Sun & Sky panel into their own "Surroundings" button and panel next to
  World/Lighting — the Sun & Sky panel is pure lighting again. Touches five
  files: two mount removals, three one-to-two-line mount insertions.
- `0047` — status-bar spacing: one gap for the whole footer (`gap-3` on the
  root and the stats block) and the same vertical separator before "FPS" as
  between FPS, WebGPU and the flavor indicator. Three class/JSX lines, no logic.
- `0048` — sidebar toggling without the Information fallback: a second click on
  the active rail icon (Information included) closes the panel and collapses
  the sidebar to its icon rail instead of revealing Information; the
  exclusivity subscription does the same when the last open panel is closed
  through its own close button; a side-panel icon only highlights while the
  sidebar is expanded. Two small additions in the store and one line in the
  activity bar; no upstream logic removed.

Separate, newly created files of the Trassia deployment (e.g. Swiss coordinate
helpers, the drape/kubatur/profile panels, the pop-out frame, the Normalprofil
engine) are not modifications of MPL-covered files and are not part of this
source offer (MPL 2.0 is a file-level license; see §1.10 "Larger Work").

This repository is updated whenever the deployed application changes MPL-covered files.
Contact: kontakt@trassia.com
