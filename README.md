# trassia-viewer-patches — MPL-2.0 Source Offer

This repository publishes the **source code of all MPL-2.0-licensed files that Trassia
modified** in its deployment of the IFC-Lite viewer application
(upstream: https://github.com/LTplus-AG/ifc-lite, Mozilla Public License 2.0).

It exists to satisfy the source-availability obligation of the MPL 2.0 (§3.2) for the
executable form served at https://viewer.trassia.com.

## Contents

- `patches/` — the exact patches applied on top of upstream commit
  `ec358164ed368aba89ae1a9e8744977e54293fd7` (tag `@ifc-lite/wasm@6.0.0`)
- `modified-files/` — the four modified files in full source form (base commit + patches applied):
  - `apps/viewer/src/store/slices/measurementSlice.ts`
  - `apps/viewer/src/components/viewer/tools/MeasurePanel.tsx`
  - `apps/viewer/src/components/viewer/tools/MeasurePointReadout.tsx`
  - `apps/viewer/src/components/viewer/tools/measure-modes/geo-readout.tsx`
- `LICENSE` — Mozilla Public License 2.0 (unchanged, from upstream)

All files in this repository are licensed under the **MPL-2.0**.

Separate, newly created files of the Trassia deployment (e.g. Swiss coordinate helpers)
are not modifications of MPL-covered files and are not part of this source offer
(MPL 2.0 is a file-level license; see §1.10 "Larger Work").

This repository is updated whenever the deployed application changes MPL-covered files.
Contact: kontakt@trassia.com
