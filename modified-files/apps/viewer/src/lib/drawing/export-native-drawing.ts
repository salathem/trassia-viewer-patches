/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { GraphicOverrideEngine } from '@ifc-lite/drawing-2d';
import { useViewerStore } from '@/store';
import { resolve } from '@/i18n/registry';
import { createDrawingExport, type NativeDrawingArtifact } from '@/hooks/useDrawingExport';
import { createExportDimensionGraphics } from '@/hooks/useExportDimensions';
import { prepareDrawingWithReferences, projectDrawingReferences } from '@/hooks/useReferenceImagesForDrawing';
import { prepareDxfUnderlaysForDrawing } from '@/hooks/useDxfUnderlay';
import { buildDxfMapToWorldTransform, resolveDxfExportGeoreference } from '@/hooks/dxfExportGeoref';
import { drawingWithDxfBounds } from '@/hooks/dxfDrawingBounds';
import { prepareNativeScanBand } from '@/hooks/useScanSectionLayer';
import type { ScanOutlineLayer } from '@/lib/scan-outline/scan-outline';
import { createScanOutlineTracer } from '@/lib/scan-outline/scan-outline-tracer';
import { currentDrawingRuntime } from './drawing-runtime';
import { drawingEntityColors } from './export-colors';
import { drawnSectionPlane } from './drawn-section-plane';
import { drawingExportFrame } from './export-view-frame';
import { chQpUndistorted } from '@/lib/ch/qp-corridor';
import { chQpHeightAnnotations, getChQpHeightEnabled } from '@/hooks/useChQpHeightAnnotations';
import { selectAnchorGeoref } from '@/lib/geo/select-anchor-georef';
import { totalYupOffset } from '@/lib/geo/coordinate-frame';
import { resolveProjection } from '@/lib/geo/reproject';
import { isGeographicProj4 } from '@ifc-lite/geo/proj4';

/** Composes the same native bounds, references, vectors, scan band, markups,
 * style and sheet inputs as the panel. The artifact producer itself is the
 * exact factory the UI hook calls; no panel or canvas click is required. */
export async function exportNativeDrawing(format: 'svg' | 'dxf' | 'pdf', options: { scale?: number; signal?: AbortSignal; checkpoint?: () => void } = {}): Promise<NativeDrawingArtifact> {
  options.signal?.throwIfAborted(); options.checkpoint?.();
  const s = useViewerStore.getState(); const source = s.drawing2D;
  if (!source || s.drawing2DStatus !== 'ready') throw new Error('Generate a completed native drawing before exporting.');
  const geometry = currentDrawingRuntime()?.geometryResult ?? s.geometryResult;
  const plane = drawnSectionPlane(s);
  const showHeight = getChQpHeightEnabled();
  const current = () => {
    options.signal?.throwIfAborted(); options.checkpoint?.(); const now = useViewerStore.getState();
    if (now.drawing2D !== source || now.drawing2DStatus !== 'ready' || now.models !== s.models || now.mutationVersion !== s.mutationVersion
      || now.geometryContentVersion !== s.geometryContentVersion || now.referenceRevision !== s.referenceRevision
      || now.activeSheet !== s.activeSheet || now.sheetEnabled !== s.sheetEnabled || now.modelPlacement !== s.modelPlacement
      || now.dimensions2D !== s.dimensions2D || now.measure2DResults !== s.measure2DResults
      || now.polygonArea2DResults !== s.polygonArea2DResults || now.textAnnotations2D !== s.textAnnotations2D || now.cloudAnnotations2D !== s.cloudAnnotations2D
      || now.tagAnnotations2D !== s.tagAnnotations2D || now.unitDisplayOverrides !== s.unitDisplayOverrides
      || now.activePresetId !== s.activePresetId || now.overridesEnabled !== s.overridesEnabled || now.customOverrideRules !== s.customOverrideRules
      || now.anchorModelIdOverride !== s.anchorModelIdOverride || now.georefMutations !== s.georefMutations || now.pointCloudClassMask !== s.pointCloudClassMask
      || now.dxfUnderlays !== s.dxfUnderlays || now.drawing2DDisplayOptions !== s.drawing2DDisplayOptions
      || getChQpHeightEnabled() !== showHeight) throw new Error('Native drawing inputs changed during export. Discarded artifact.');
  };
  const raster = prepareDrawingWithReferences(chQpUndistorted(source), projectDrawingReferences(source.config.plane, s));
  const georefInputs = { models: s.models, legacyDataStore: s.ifcDataStore,
    legacyCoordinateInfo: s.geometryResult?.coordinateInfo, anchorModelIdOverride: s.anchorModelIdOverride, georefMutations: s.georefMutations };
  const georeference = resolveDxfExportGeoreference(georefInputs);
  const hasHeightAxis = source.config.plane.customPlane || source.config.plane.axis !== 'y';
  const anchor = showHeight && hasHeightAxis ? selectAnchorGeoref(georefInputs) : null;
  const projection = anchor ? await resolveProjection(anchor.eff.projectedCRS) : null;
  current();
  const offset = anchor && projection && !isGeographicProj4(projection) ? totalYupOffset(anchor.coordinateInfo) : null;
  const heightAnnotations = anchor && offset ? chQpHeightAnnotations(source, {
    ...anchor, originViewer: { x: -offset.x, y: -offset.y, z: -offset.z },
  }, showHeight) : [];
  const underlays = prepareDxfUnderlaysForDrawing({ enabled: true, plane: source.config.plane, sectionAxis: plane.axis,
    isCustomPlane: plane.custom !== undefined, flipped: plane.flipped, coordinateInfo: geometry?.coordinateInfo },
  { transform: buildDxfMapToWorldTransform(georeference), available: georeference !== null }, s);
  const drawing = drawingWithDxfBounds(raster.drawing, underlays, raster.hasReferences);
  const scanParams = { enabled: s.drawing2DDisplayOptions.showScanSection, sectionPlane: plane, coordinateInfo: geometry?.coordinateInfo,
    thickness: s.drawing2DDisplayOptions.scanSectionThickness, classMask: s.pointCloudClassMask, models: s.models,
    legacyPointClouds: geometry?.pointClouds };
  const band = scanParams.enabled ? prepareNativeScanBand(scanParams) : null;
  let outline: ScanOutlineLayer | null = null; const warnings: string[] = [];
  if (band?.sources.length && s.drawing2DDisplayOptions.scanSectionOutline) {
    const tracer = createScanOutlineTracer(); const abort = () => tracer.dispose(); options.signal?.addEventListener('abort', abort, { once: true });
    try {
      const result = await tracer.trace({ sources: band.sources, coordinateInfo: geometry?.coordinateInfo, plane: band.plane,
        thickness: scanParams.thickness, classMask: s.pointCloudClassMask, maxGap: s.drawing2DDisplayOptions.scanSectionOutlineMaxGap });
      current(); if (result.status === 'done') outline = result.layer;
      else if (result.status === 'failed') warnings.push(`Scan outline unavailable: ${result.message}`);
      else throw new Error('The native scan outline export was superseded.');
    } finally { options.signal?.removeEventListener('abort', abort); tracer.dispose(); }
  }
  current();
  const exporter = createDrawingExport({ drawing, heightAnnotations, displayOptions: s.drawing2DDisplayOptions, sectionPlane: plane,
    activePresetId: s.activePresetId, entityColorMap: drawingEntityColors(geometry), overridesEnabled: s.overridesEnabled,
    overrideEngine: new GraphicOverrideEngine(s.getActiveOverrideRules()), measure2DResults: s.measure2DResults,
    polygonArea2DResults: s.polygonArea2DResults, textAnnotations2D: s.textAnnotations2D, cloudAnnotations2D: s.cloudAnnotations2D,
    sheetEnabled: s.sheetEnabled, activeSheet: s.activeSheet, dxfUnderlays: underlays, ifcDataStore: s.ifcDataStore,
    coordinateInfo: geometry?.coordinateInfo, scanSection: { points: band?.merged.points ?? [], outline }, ...drawingExportFrame(source),
  }, { t: resolve, dimensionGraphicsAt: createExportDimensionGraphics(s.measure2DResults, s) });
  const artifact = format === 'svg' ? exporter.createSvgArtifact() : format === 'dxf' ? exporter.createDxfArtifact() : await exporter.createPdfArtifact(options.scale);
  current(); return { ...artifact, warnings: [...warnings, ...artifact.warnings] };
}
