/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * The coordinate bridge: where the model's georeference becomes a place on the
 * globe.
 *
 * Split out of CesiumOverlay.tsx (#2593). This is the file that decides WHERE
 * the model sits — ENU/ECEF framing, grid convergence, geoid undulation,
 * terrain clamping, and the placement draft the gizmo previews. Its history is
 * the georeferencing one (#1408 convergence, #1427 altitude, #2526 the
 * map-absolute guard), which is a different subject from what the world view
 * draws, and now reads as one.
 *
 * ORDERING NOTE: call this hook where its effect sat — after the viewer effect,
 * before the model hook, which rebuilds its matrix from `bridgeVersion`.
 */

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useViewerStore } from '@/store';
import { CH_AUTOMATIC_TERRAIN_HEIGHT, chQueryTerrainHeight } from '@/lib/ch/kontext/terrain-policy';
import { chSwisstopoSr } from '@/lib/ch/kontext/swisstopo-hoehe';
import type { MapConversion, ProjectedCRS } from '@ifc-lite/parser';
import type { CoordinateInfo } from '@ifc-lite/geometry';
import { createCesiumBridge, type CesiumBridge } from '@/lib/geo/cesium-bridge';
import {
  computeCesiumPlacement,
  shouldApplyGeoidUndulation,
  orthometricTargetForTerrain,
} from '@/lib/geo/cesium-placement';
import { egm96Undulation } from '@ifc-lite/geo';
import { bendsAwayFromAnchorPlane } from '@/lib/geo/globe-placement';
import { holdCameraY, type ViewerHeightFrame } from '@/lib/geo/viewer-up-scale';
// Trassia (V-WELT-FIX-2): in dieser Szene ist die Cesium-Hoehenachse LN02.
import { chCesiumGeoidAnteil } from '@/lib/ch/kontext/hoehenbezug';
import { getGlobalRenderer } from '@/hooks/useBCF';
import { getCesiumModule } from './cesium-module';
import type { CesiumViewerLifetime } from './cesium-viewer-lifetime';

export interface UseCesiumBridgeParams {
  status: 'idle' | 'loading' | 'ready' | 'error';
  viewerRef: RefObject<InstanceType<typeof import('cesium').Viewer> | null>;
  /** Synchronously retired before the Viewer owning async terrain work dies. */
  viewerLifetimeRef: RefObject<CesiumViewerLifetime | null>;
  /** Written by this hook; read by the model, camera and solar hooks. */
  bridgeRef: RefObject<CesiumBridge | null>;
  /** The camera-side bridge, which diverges from the model's only while a
   *  placement draft is previewing. */
  cameraBridgeRef: RefObject<CesiumBridge | null>;
  mapConversion?: MapConversion;
  cameraMapConversion?: MapConversion;
  projectedCRS?: ProjectedCRS;
  coordinateInfo?: CoordinateInfo;
  lengthUnitScale: number;
  storeyElevations?: Map<number, number>;
}

export interface UseCesiumBridgeResult {
  /** Bumped whenever the bridge is replaced, so dependants rebuild against it. */
  bridgeVersion: number;
}

export function useCesiumBridge({
  status,
  viewerRef,
  viewerLifetimeRef,
  bridgeRef,
  cameraBridgeRef,
  mapConversion,
  cameraMapConversion,
  projectedCRS,
  coordinateInfo,
  lengthUnitScale,
  storeyElevations,
}: UseCesiumBridgeParams): UseCesiumBridgeResult {
  const terrainEnabled = useViewerStore((s) => s.cesiumTerrainEnabled);
  const sourceModelId = useViewerStore((s) => s.cesiumSourceModelId);
  const heightsAreEllipsoidal = useViewerStore((s) => s.cesiumHeightsAreEllipsoidal);
  const dataSource = useViewerStore((s) => s.cesiumDataSource);
  const setCesiumTerrainHeight = useViewerStore((s) => s.setCesiumTerrainHeight);
  const setCesiumTerrainSource = useViewerStore((s) => s.setCesiumTerrainSource);
  const setCesiumTerrainSaveHeight = useViewerStore((s) => s.setCesiumTerrainSaveHeight);
  const setCesiumTerrainClipY = useViewerStore((s) => s.setCesiumTerrainClipY);
  const globePlacement = useViewerStore((s) => s.cesiumGlobePlacement);
  const setGlobePlacementStatus = useViewerStore((s) => s.setCesiumGlobePlacementStatus);
  // Last-known placement altitude (in metres) used to keep the user's WORLD
  // camera position stable across bridge rebuilds. When the user toggles the
  // clamp or edits OrthogonalHeight, the model placement changes and the
  // entire viewer→ECEF frame translates with it; we offset the IFC viewer's
  // camera Y by the inverse so the user perceives the model moving instead
  // of the camera being dragged along.
  const prevPlacementRef = useRef<ViewerHeightFrame | null>(null);
  const prevSourceModelRef = useRef(sourceModelId);

  // Tracks bridge readiness as state (not just a ref) so dependants re-run.
  const [bridgeVersion, setBridgeVersion] = useState(0);

  // ─── Effect 2: Build the coordinate bridge with terrain-aware placement ─
  // Precomputes the model placement (floored to the visible surface when
  // necessary) BEFORE
  // building the bridge that the GLB and camera will share. This way the
  // model loads into Cesium at its final altitude — no post-load shifting,
  // no camera/model frame divergence, no compensation gymnastics.
  //
  // Sequence:
  //   1. Build a tentative bridge to recover the model's WGS84 lat/lon.
  //   2. Query terrain at that lat/lon (sync first, async with retry next).
  //   3. Auto-floor the model if its authored base sits below the visible surface.
  //   4. Rebuild the bridge with placementHeight baked into its enuToEcef
  //      origin so model matrix and camera frame share a single altitude.
  //   5. Push terrain-derived state (height, clip Y) and
  //      install the bridge.
  useEffect(() => {
    if (prevSourceModelRef.current !== sourceModelId) {
      prevSourceModelRef.current = sourceModelId;
      prevPlacementRef.current = null;
    }
    // Clear old model/provider samples before any asynchronous bridge work.
    setCesiumTerrainHeight(null);
    setCesiumTerrainSource(null);
    setCesiumTerrainSaveHeight(null);
    setCesiumTerrainClipY(null);
    if (status !== 'ready' || !mapConversion || !projectedCRS) {
      bridgeRef.current = null;
      cameraBridgeRef.current = null;
      prevPlacementRef.current = null;
      setGlobePlacementStatus(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const Cesium = getCesiumModule();
      const viewer = viewerRef.current;
      const lifetime = viewerLifetimeRef.current;
      if (!Cesium || !viewer || !lifetime?.isLive(viewer)) return;
      const isCancelled = () => cancelled || !lifetime.isLive(viewer)
        || useViewerStore.getState().cesiumSourceModelId !== sourceModelId;

      const cameraConversion = cameraMapConversion ?? mapConversion;
      const usesSeparateCameraBridge = cameraConversion !== mapConversion;
      const cameraTentative = await createCesiumBridge(
        cameraConversion, projectedCRS, coordinateInfo, lengthUnitScale,
        undefined, heightsAreEllipsoidal, globePlacement,
      );
      if (isCancelled()) return;
      if (!cameraTentative) {
        bridgeRef.current = null;
        cameraBridgeRef.current = null;
        return;
      }

      const modelTentative = usesSeparateCameraBridge
        ? await createCesiumBridge(
            mapConversion, projectedCRS, coordinateInfo, lengthUnitScale,
            undefined, heightsAreEllipsoidal, globePlacement,
          )
        : cameraTentative;
      if (isCancelled()) return;
      if (!modelTentative) {
        bridgeRef.current = null;
        return;
      }
      const swissFrame = chSwisstopoSr(projectedCRS.name) !== null;
      const queryAt = async (bridge: CesiumBridge, conversion: MapConversion) => {
        if (!CH_AUTOMATIC_TERRAIN_HEIGHT) return null;
        try {
          if (swissFrame) {
            // Trassia (Marco 2026-09-27, TODO 5/58): swisstopo LN02 at the IFC origin.
            // The bridge's modelOrigin is the render-frame geometry centre.
            // Using it here would move the query as model bounds stream in.
            return await chQueryTerrainHeight({
              conversion, projectedCRS, lengthUnitScale, isCancelled,
            });
          }
          // Outside the Swiss grids, preserve the admissible Cesium source.
          // The Trassia net allowlist does not include Open-Meteo or ion.
          return await bridge.queryTerrainHeight(Cesium, viewer, {
            cacheNamespace: [terrainEnabled ? 'terrain' : 'ellipsoid', dataSource].join(':'),
            residentGlobeOnly: true,
            cancellation: { isCancelled, onCancel: (stop) => lifetime.onRetire(stop) },
          });
        } catch (err) {
          console.warn('[CesiumOverlay] terrain query failed:', err);
          return null;
        }
      };
      const modelSample = queryAt(modelTentative, mapConversion);
      const [terrainSample, cameraTerrainSample] = await Promise.all([
        modelSample,
        usesSeparateCameraBridge ? queryAt(cameraTentative, cameraConversion) : modelSample,
      ]);
      if (isCancelled()) return;
      const terrainH = terrainSample?.height ?? null;
      // Placement is purely IFC-authored — no terrain/storey clamp. The
      // tentative bridges already carry the model's authored altitude
      // (IfcMapConversion.OrthogonalHeight + geometry origin), so they ARE
      // the final bridges. computeCesiumPlacement is still called for the
      // clip-plane Y; placementHeight == ifcOriginHeight.
      // The model origin is now ellipsoidal (orthometric + geoid N, #1355).
      // Express an orthometric terrain sample in the same ellipsoidal frame so
      // the below-terrain clip plane stays consistent; Cesium-sourced terrain
      // is already ellipsoidal and needs no shift.
      const terrainHForFrame = (terrainSample?.reference === 'orthometric' && terrainH !== null)
        ? terrainH + egm96Undulation(modelTentative.modelOrigin.latitude, modelTentative.modelOrigin.longitude)
        : terrainH;
      const placement = computeCesiumPlacement({
        coordinateInfo,
        projectedCRS,
        ifcOriginHeight: modelTentative.modelOrigin.height,
        terrainHeight: terrainHForFrame,
        storeyElevations,
        viewerUpScale: modelTentative.viewerUpScale,
      });
      const cameraPlacement = usesSeparateCameraBridge
        ? computeCesiumPlacement({
            coordinateInfo,
            projectedCRS,
            ifcOriginHeight: cameraTentative.modelOrigin.height,
            terrainHeight: cameraTerrainSample?.height ?? null,
            storeyElevations,
            viewerUpScale: cameraTentative.viewerUpScale,
          })
        : placement;

      // The model bridge is the tentative one — placement == authored origin.
      const bridge = modelTentative;

      if (terrainSample) {
        setCesiumTerrainHeight(terrainH);
        setCesiumTerrainSource(
          `${terrainSample.source}${terrainSample.reference === 'orthometric' ? ' (orthometric)' : ''}`,
        );
        // Snap-to-terrain target in the OrthogonalHeight frame: the read path
        // places the base at OrthogonalHeight + geoid N, so persist the
        // ellipsoidal terrain altitude (terrainHForFrame) minus the same N that
        // was actually applied to this model. N mirrors the bridge: the EGM96
        // undulation, or 0 when heights are flagged ellipsoidal. Keeps the snap
        // button round-tripping (#1456).
        // Trassia (V-WELT-FIX-2): muss dem Bruder in `cesium-bridge.ts`
        // FOLGEN, sonst speichert der Schnapp-Knopf eine Hoehe, die um die
        // Undulation neben der steht, die tatsaechlich angewandt wurde.
        // Siehe `lib/ch/kontext/hoehenbezug.ts`.
        const appliedGeoidN = shouldApplyGeoidUndulation(heightsAreEllipsoidal)
          ? chCesiumGeoidAnteil(
            egm96Undulation(modelTentative.modelOrigin.latitude, modelTentative.modelOrigin.longitude), swissFrame)
          : 0;
        setCesiumTerrainSaveHeight(
          terrainHForFrame !== null
            ? orthometricTargetForTerrain(terrainHForFrame, appliedGeoidN)
            : null,
        );
      }
      // The camera floor uses the committed camera frame, independent of a
      // model draft. A flat floor would cut a model bent away from that plane.
      setCesiumTerrainClipY(bendsAwayFromAnchorPlane(bridge.placement) ? null : cameraPlacement.terrainClipY);

      // World-camera stability: when this rebuild changes the placement
      // altitude (surface floor or OrthogonalHeight edited), shift the IFC
      // viewer-space camera Y by the inverse delta so the user's WORLD
      // camera ECEF position stays put. Without this, the entire frame
      // translates with the model and edits feel like the camera is
      // moving instead of the model — exactly what the user reported.
      const prevPlacement = prevPlacementRef.current;
      // Hold the height through the frame's Scale x FactorZ and centre, which can change too (#4675).
      const { placementHeight, modelCenterY } = placement;
      const nextPlacement = { placementHeight, modelCenterY, viewerUpScale: bridge.viewerUpScale };
      if (!usesSeparateCameraBridge) {
        prevPlacementRef.current = nextPlacement;
      }
      if (!usesSeparateCameraBridge && prevPlacement !== null) {
        const dh = placement.placementHeight - prevPlacement.placementHeight;
        // 5 cm threshold — rejects float jitter from cached terrain reads
        // re-flowing through the same effect, while a real placement edit
        // is always far larger.
        if (Math.abs(dh) > 0.05 || prevPlacement.viewerUpScale !== nextPlacement.viewerUpScale) {
          const renderer = getGlobalRenderer();
          if (renderer) {
            const cam = renderer.getCamera();
            const pos = cam.getPosition();
            cam.setPosition(pos.x, holdCameraY(pos.y, prevPlacement, nextPlacement), pos.z);
          }
        }
      }

      // Camera bridge: the separate camera-tentative when a placement draft
      // is previewing (camera holds the base frame while the model moves),
      // otherwise the model bridge itself. Both are already at their
      // authored altitude — no placement-override rebuild.
      const cameraBridge = usesSeparateCameraBridge ? cameraTentative : bridge;

      bridgeRef.current = bridge;
      cameraBridgeRef.current = cameraBridge;
      setGlobePlacementStatus({
        mode: bridge.placement.mode,
        anchorErrorMetres: bridge.placement.estimate?.total ?? null,
        prescribed: bridge.placement.prescribed,
      });
      setBridgeVersion((v) => v + 1);
    })();

    const stop = lifetimeRefStop(viewerLifetimeRef, () => { cancelled = true; });
    return () => { cancelled = true; stop(); };
    // terrainEnabled and ionToken intentionally omitted — Effect 1 already
    // owns those (it destroys/recreates the viewer when they change), and
    // listing them here would cause a redundant bridge rebuild while the
    // viewer is being torn down.
  }, [
    status,
    mapConversion,
    cameraMapConversion,
    projectedCRS,
    coordinateInfo,
    lengthUnitScale,
    terrainEnabled,
    sourceModelId,
    heightsAreEllipsoidal,
    dataSource,
    storeyElevations,
    setCesiumTerrainHeight,
    setCesiumTerrainSource,
    setCesiumTerrainSaveHeight,
    setCesiumTerrainClipY,
    globePlacement,
    setGlobePlacementStatus,
  ]);

  return { bridgeVersion };
}

/** Subscribe without retaining a stale lifetime when a new viewer replaces it. */
function lifetimeRefStop(
  lifetimeRef: RefObject<CesiumViewerLifetime | null>,
  stop: () => void,
): () => void {
  return lifetimeRef.current?.onRetire(stop) ?? (() => {});
}
