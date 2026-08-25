# trassia-viewer-patches — MPL-2.0 Source Offer

This repository publishes the **source code of all MPL-2.0-licensed files that Trassia
modified** in its deployment of the IFC-Lite viewer application
(upstream: https://github.com/LTplus-AG/ifc-lite, Mozilla Public License 2.0).

It exists to satisfy the source-availability obligation of the MPL 2.0 (§3.2) for the
executable form served at https://viewer.trassia.com.

## Contents

- `patches/` — the exact patches applied on top of upstream commit
  `ec358164ed368aba89ae1a9e8744977e54293fd7` (tag `@ifc-lite/wasm@6.0.0`)
- `modified-files/` — the fifteen modified files in full source form (base commit + patches applied):
  - `apps/viewer/src/store/slices/measurementSlice.ts`
  - `apps/viewer/src/components/viewer/tools/MeasurePanel.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurePointReadout.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurementVisuals.tsx`
  - `apps/viewer/src/components/viewer/tools/measure-modes/geo-readout.tsx`
  - `apps/viewer/src/components/viewer/tools/measure-modes/components.test.ts`
  - `apps/viewer/src/components/viewer/tools/measure-parity.test.tsx`
  - `apps/viewer/src/components/viewer/tools/formatDistance.ts`
  - `apps/viewer/src/components/viewer/tools/SectionPanel.tsx`
  - `apps/viewer/src/components/viewer/PropertiesPanel.tsx`
  - `apps/viewer/src/components/viewer/ViewerLayout.tsx`
  - `apps/viewer/src/components/viewer/LensPanel.tsx`
  - `apps/viewer/src/components/viewer/properties/PropertySetCard.tsx`
  - `apps/viewer/src/components/viewer/properties/ModelMetadataPanel.tsx`
  - `apps/viewer/src/hooks/useIfcLoader.ts`
- `LICENSE` — Mozilla Public License 2.0 (unchanged, from upstream)

All files in this repository are licensed under the **MPL-2.0**.

The patches fall into two groups:

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

Separate, newly created files of the Trassia deployment (e.g. Swiss coordinate
helpers, the property-set family classifier) are not modifications of MPL-covered
files and are not part of this source offer
(MPL 2.0 is a file-level license; see §1.10 "Larger Work").

This repository is updated whenever the deployed application changes MPL-covered files.
Contact: kontakt@trassia.com
