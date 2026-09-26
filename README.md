# trassia-viewer-patches — MPL-2.0 Source Offer

This repository publishes the **source code of all MPL-2.0-licensed files that Trassia
modified** in its deployment of the IFC-Lite viewer application
(upstream: https://github.com/LTplus-AG/ifc-lite, Mozilla Public License 2.0).

It exists to satisfy the source-availability obligation of the MPL 2.0 (§3.2) for the
executable form served at https://viewer.trassia.com.

## Contents

- `patches/` — the exact patches (`0001`–`0076`, numbers no longer in use are listed below)
  applied, in numeric order, on top of upstream commit
  `ca6fef8d72176bd83127e20a314e4fad9c0acf59` (tag `@ifc-lite/wasm@10.1.2`)
- `modified-files/` — the sixty-five modified files in full source form
  (base commit + all patches applied):
  - `apps/viewer/src/components/viewer/CesiumOverlay.tsx`
  - `apps/viewer/src/components/viewer/Drawing2DCanvas.tsx`
  - `apps/viewer/src/components/viewer/EnvironmentPanel.tsx`
  - `apps/viewer/src/components/viewer/HierarchyPanel.tsx`
  - `apps/viewer/src/components/viewer/LensPanel.tsx`
  - `apps/viewer/src/components/viewer/PropertiesPanel.tsx`
  - `apps/viewer/src/components/viewer/StatusBar.tsx`
  - `apps/viewer/src/components/viewer/ViewerLayout.tsx`
  - `apps/viewer/src/components/viewer/Viewport.tsx`
  - `apps/viewer/src/components/viewer/ViewportContainer.tsx`
  - `apps/viewer/src/components/viewer/ViewportWelcomeCard.tsx`
  - `apps/viewer/src/components/viewer/cesium/addDataSourceLayer.ts`
  - `apps/viewer/src/components/viewer/cesium/useCesiumBridge.ts`
  - `apps/viewer/src/components/viewer/drawing/DrawingCanvasView.tsx`
  - `apps/viewer/src/components/viewer/drawing/DrawingToolbar.tsx`
  - `apps/viewer/src/components/viewer/hierarchy/HierarchyNode.tsx`
  - `apps/viewer/src/components/viewer/hierarchy/ModelHeaderRow.tsx`
  - `apps/viewer/src/components/viewer/properties/GeoreferencingPanel.tsx`
  - `apps/viewer/src/components/viewer/properties/PropertySetCard.tsx`
  - `apps/viewer/src/components/viewer/properties/modelMetadataStats.test.tsx`
  - `apps/viewer/src/components/viewer/ribbon/RibbonToolbar.tsx`
  - `apps/viewer/src/components/viewer/ribbon/tabs/FileTab.tsx`
  - `apps/viewer/src/components/viewer/ribbon/tabs/ViewTab.tsx`
  - `apps/viewer/src/components/viewer/sidebar/ActivityBar.tsx`
  - `apps/viewer/src/components/viewer/sidebar/CustomizeSidebar.tsx`
  - `apps/viewer/src/components/viewer/sidebar/SidebarDock.tsx`
  - `apps/viewer/src/components/viewer/sidebar/SidebarPanelHost.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasureHudReadouts.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurePointReadout.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurementList.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurementVisuals.tsx`
  - `apps/viewer/src/components/viewer/tools/SectionPanel.tsx`
  - `apps/viewer/src/components/viewer/tools/formatDistance.ts`
  - `apps/viewer/src/components/viewer/tools/measure-modes/components.test.ts`
  - `apps/viewer/src/components/viewer/tools/measure-modes/geo-readout.tsx`
  - `apps/viewer/src/components/viewer/tools/measure-parity.test.tsx`
  - `apps/viewer/src/components/viewer/useRenderUpdates.ts`
  - `apps/viewer/src/hooks/dxfExportGeoref.test.ts`
  - `apps/viewer/src/hooks/keyboard-shortcuts-list.ts`
  - `apps/viewer/src/hooks/useAnnotation2D.ts`
  - `apps/viewer/src/hooks/useDrawingExport.ts`
  - `apps/viewer/src/hooks/useDrawingGeneration.ts`
  - `apps/viewer/src/hooks/useIfcLoader.ts`
  - `apps/viewer/src/hooks/useKeyboardShortcuts.ts`
  - `apps/viewer/src/hooks/useMeasure2D.ts`
  - `apps/viewer/src/hooks/usePanelControls.ts`
  - `apps/viewer/src/hooks/useViewControls.ts`
  - `apps/viewer/src/i18n/catalogues/properties.en.ts`
  - `apps/viewer/src/lib/geo/cesium-bridge.ts`
  - `apps/viewer/src/lib/geo/ifc-spatial-reference.test.ts`
  - `apps/viewer/src/lib/geo/ifc-spatial-reference.ts`
  - `apps/viewer/src/lib/panels/registry.ts`
  - `apps/viewer/src/lib/panels/renderPanelBody.tsx`
  - `apps/viewer/src/main.tsx`
  - `apps/viewer/src/store/index.ts`
  - `apps/viewer/src/store/slices/measurementSlice.ts`
  - `apps/viewer/src/store/slices/sidebarSlice.test.ts`
  - `apps/viewer/src/store/slices/sidebarSlice.ts`
  - `apps/viewer/src/store/store-sync.ts`
  - `apps/viewer/vite.config.ts`
  - `packages/drawing-2d/src/dxf-exporter.test.ts`
  - `packages/drawing-2d/src/dxf-exporter.ts`
  - `packages/drawing-2d/src/dxf/writer.test.ts`
  - `packages/drawing-2d/src/dxf/writer.ts`
  - `packages/drawing-2d/src/index.ts`
- `LICENSE` — Mozilla Public License 2.0 (unchanged, from upstream)

All files in this repository are licensed under the **MPL-2.0**.

## What the patches do

Upstream 10.x rebuilt the measure, section, 2D drawing, environment and welcome
screens (HUD regions, a docked `drawing` panel instead of `Section2DPanel`, a docked
environment panel instead of Sun & Sky). With the move from `@ifc-lite/wasm@9.1.0`
to `@ifc-lite/wasm@10.1.2` (2026-09-26) the patches `0006`, `0008`, `0014`, `0015`,
`0027`, `0028`, `0029`, `0032`, `0037`, `0040`, `0049`, `0057`, `0063` and `0067`
are **no longer applied**: their function either moved to the port patches
`0068`–`0075` below, or the upstream now provides it itself (docking, floating and the separate window of
the drawing panel, floating panels clamped below the toolbar). Where a combined
entry below still names one of these numbers, that part describes the earlier
upstream layout. The other patches keep their described purpose; some were
re-anchored to the moved upstream code (e.g. the sidebar exclusivity logic now
lives in `store/store-sync.ts`).

- `0001`–`0003` — Swiss coordinate readout for the measurement tools
  (LV95/LV03 formatting, georeference status).
- `0004`–`0005` — property panel: Swiss/Trassia provenance property sets sorted
  to the top with a family badge, a free-text filter over the selected element's
  properties, and a one-click "colour by data origin" row in the Lens panel.
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
  activity bar; no upstream logic removed. Also in `usePanelControls.ts`:
  `closePanel` now closes side panels that have no visibility flag of their
  own (upstream's Zones and the Trassia panels) — their header close button
  was a no-op before.
- `0050` — status-bar counts over all loaded models: upstream derives
  "N elements / N tris" from the single active model's geometry result, so a
  federated project with 14 models showed the numbers of model 1. One import,
  one hook call (`useChGesamtStatistik`, overlay `lib/ch/gesamt-statistik.ts`:
  the upstream accumulator applied per model and summed; unchanged when no
  federated model is registered), three `stats.` -> `gesamt.` expressions and
  a `title` with the exact count on the two stats. Upstream accumulator kept.
- `0051` — "Trassia mode" for the rail and the ribbon: one condition in the
  activity bar's visible-panel filter (rail shows hierarchy, information, lens,
  drape and cut/fill unless `?voll=1`), a `filter` on the ribbon tab list (File,
  Home, View, Elements; Analyze and Author only with `?voll=1`), the ribbon
  switch notice and the File tab's "Cloud sources" button only in full mode.
  The mode switch and the lists are an overlay module (`lib/ch/modus.ts`);
  nothing is removed or unloaded.
- `0052` — the same mode on the welcome screen and the status bar: "Open from
  cloud", "Drive with any LLM", the tour invite, the Layers demo card and the
  "New here? ifclite.dev" chip render only in full mode; the status-bar link
  points to trassia.ch in Trassia mode and to ifclite.dev in full mode.
- `0053` — the three Trassia panel registry entries (from `0019`/`0021`/`0024`)
  get German titles/short labels and the cut/fill icon changes from `Ruler` to
  `ArrowUpDown`. Upstream entries untouched.
- `0054` — ribbon tab fallback: when the contextual tab driver selects a tab
  the current mode does not offer (Start blank -> Author in Trassia mode), one
  `useEffect` falls back to Home. No effect in full mode.
- `0055` — "Start blank" arms the wall tool (`setActiveTool('addElement')`)
  only in full mode; in Trassia mode the blank project stays in select mode,
  because the Author tab and the add-element panel are not offered there.
- `0056` — Trassia mode, consistently: the Alt+digit shortcut opens a panel
  only if the rail offers it in the current mode, and the sidebar customizer
  lists only those panels. Two one-line conditions plus imports; `?voll=1`
  keeps everything.
- `0058` — leftovers package: (a) `main.tsx` imports the overlay favicon
  switch; (b) Escape no longer closes the active tool when the key is meant
  for an open menu or dialog (one condition); (c) `DxfWriter` writes a
  multi-line header comment as one `999` group per line (single-line
  comments are byte-identical to before); (d) the section DXF export always
  writes the unit line and, for an axis/line cut, appends one `999` line per
  statement (axis, station, LV95, `zero at H`, corridor, created) from an
  overlay helper.
- `0059` — Trassia rail as a default, not a filter: the sidebar slice seeds
  (and resets) the hidden set with the panels outside the Trassia rail in
  Trassia mode (empty in full mode, as upstream), keeps the Trassia layout
  under its own localStorage key (`…:trassia`, so `?voll=1` stays pure
  upstream) and imports a pre-existing upstream layout once; the activity bar and the
  customize popover drop the hard filters from `0051`/`0056`, so every panel
  is listed under "Hidden" and can be shown again; Alt+digit follows the
  hidden set.
- `0060` — hierarchy panel, small improvements: Ctrl-click selects tree rows
  of any level (model, storey, type group, element) into an overlay row
  selection (one call at the top of `handleNodeClick`, one on the model
  header, a highlight class on both row kinds); Space toggles the visibility
  of those rows — each by its own state, a partly visible group hides — and,
  without a row selection, of the selected elements (previously Space could
  only hide); the "n models · Drag divider to resize" footer is removed
  (divider kept); the per-row counts become small grey text with a tooltip
  that names what is counted (the model row counts all IFC entities).
- `0061` — layout and dialog leftovers: (a) the left hierarchy panel and the
  viewport panel get explicit units (`"22%"`/`"120px"` and `"78%"`/`"30%"`)
  because `react-resizable-panels` 4 reads bare numbers as pixels — the
  upstream's `22`/`10` made the divider's double-click reset the panel to
  22 px; (b) the Drawing Settings box becomes a `role="dialog"` that takes
  focus on open and closes itself on Escape (marking the key as handled), and
  the global Escape shortcut skips a key another layer already handled
  (`e.defaultPrevented`); (c) in the sidebar customizer a row just hidden
  stays in place for 500 ms, dimmed and inert, before it moves to "Hidden" —
  so a double-click on "Hide" no longer hides two panels (list split in an
  overlay helper, `lib/ch/leiste-anpassen.ts`).

- `0062` — persisted sidebar layouts remember the panel registry in `chBekannt`.
  Newly appended upstream panels use the Trassia hidden default when an older
  layout is loaded, while the user's existing visibility choices are kept.

- `0064` — closing either half of a split sidebar targets that panel and keeps
  the other panel open. Header close buttons and a second click on the active
  rail icon use the same close action; an ephemeral revision keeps the existing
  exclusivity subscription from resolving that close intent again.
- `0065` — the terrain-height query and georeferencing controls follow the
  Trassia automatic-height policy. Old terrain samples are cleared before a
  new bridge is installed; when automatic height sampling is disabled, the
  panel shows the policy notice and hides terrain-derived save/snap actions.
- `0066` — the IFC geometry stream yields after a work budget so queued worker
  events do not continuously occupy the browser's microtask queue. The next
  event still passes the existing stale-session check before writing state.


- `0068` — measure tool on the 10.x HUD: the distance list and the viewport
  labels show ΔE/ΔN/ΔH instead of renderer axes on a georeferenced model; the
  list carries LV95 rows for polyline vertices and angle picks; the live
  coordinate readout also follows polyline, angle and radius measurements.
- `0069` — cross-section view in the upstream `drawing` panel: caption stamp and
  sheet title above the 2D canvas and the Normalprofil dimension chains passed
  to the canvas (four props); an always-visible "open in its own window" button in
  the drawing toolbar, using the upstream's own panel window. Replaces the former
  `Section2DPanel` parts of `0014`, `0027` and `0039`.
- `0070` — environment panel: the base-map picker (including the new
  `custom-3dtiles` source) stays behind `CH_BASISKARTEN_VERFUEGBAR`, fail-closed
  under the deployed CSP (successor of `0037`).
- `0071` — Trassia welcome card in the extracted `ViewportWelcomeCard`: in Trassia
  mode the logo, title and actions are replaced by the overlay `ChStartkarte`;
  the recent-files list stays; `?voll=1` shows the upstream card (successor of
  `0057` and the welcome part of `0052`).
- `0072` — section tool: mounts the overlay `ChSchnittKarte` (station cut,
  cross-section tools, longitudinal-profile tab) as a HUD item of the section
  tool (successor of `0006`, `0015`, `0049`).
- `0073` — sidebar exclusivity in `store/store-sync.ts`: an explicit close intent
  is not re-resolved, and closing the last panel collapses the sidebar
  (successor of the store parts of `0048`/`0064`).
- `0074` — hierarchy rows: model header buttons 24×24 px and always visible,
  Ctrl-click row selection with highlight, small grey row counts; the node row
  gets the row-selection highlight; row counts use the Swiss thousands separator
  (`4'196`) like the status bar (successor of `0032` and the row part of `0060`).
- `0075` — texts: `Del` and `Space` listed separately in the shortcut list,
  `Elements in Storeys` in the English property catalogue and the matching
  upstream test (successor of the text parts of `0010`/`0060`).
- `0076` — the Swiss height systems `LN02` (EPSG:5728) and `LHN95` (EPSG:5729) are
  recognised in `IfcProjectedCRS.VerticalDatum`, next to the upstream's NAVD88/NAP
  aliases. Upstream 10.x aligns federated models only when both declare a known
  vertical CRS; without these names every Swiss model beside the anchor stayed in
  its own local frame. Two assertions added to the existing upstream test.

Separate, newly created files of the Trassia deployment (e.g. Swiss coordinate
helpers, the drape/kubatur/profile panels, the pop-out frame, the Normalprofil
engine) are not modifications of MPL-covered files and are not part of this
source offer (MPL 2.0 is a file-level license; see §1.10 "Larger Work").

This repository is updated whenever the deployed application changes MPL-covered files.
Contact: kontakt@trassia.com
