/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * The viewer's right region (#1208): a VS Code-style activity bar + a
 * resizable docked content pane.
 *
 * Two modes (persisted in `sidebarSlice`):
 *   - `expanded`  — content pane + activity bar (the content pane is resizable).
 *   - `collapsed` — activity bar only (icons); clicking an icon re-expands.
 *
 * The activity-bar rail is ALWAYS visible — it is the always-available entry
 * point to every panel, so there is no "fully hidden" state. The content pane
 * width is stored as a % of the main row so it survives reloads and travels
 * with a Flavor; while dragging we hold a local % to avoid writing localStorage
 * on every mouse move.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useViewerStore } from '@/store';
import { ActivityBar } from './ActivityBar';
import { SidebarPanelHost } from './SidebarPanelHost';
// Trassia overlay (not upstream) — Paket V-UX (P4): der Platz, in den das
// Schnittpanel andockt. Eine eigene Zeile ueber dem Panelwirt, damit es weder
// Drape noch Kubatur noch die Attribute verdraengt.
import { ChSectionDockSlot } from '@/components/viewer/ChSectionDockSlot';

const ACTIVITY_BAR_PX = 48; // w-12
// Mirrors the clamp in sidebarSlice so the live drag matches what is persisted.
const MIN_WIDTH_PCT = 14;
const MAX_WIDTH_PCT = 60;
// Trassia (Paket V-PFLEGE, Teil A): Pixelboden neben dem Prozentboden.
//
// Ein Prozentboden skaliert falsch herum — je breiter der Bildschirm, desto
// breiter das erzwungene Minimum, obwohl der Platzbedarf des Inhalts in
// Pixeln konstant ist. 14 % sind auf 1600 px 224 px, auf 2560 px aber 358 px
// und auf 3440 px 482 px. Auf einem grossen Schirm liess sich die Leiste
// dadurch nicht mehr schmal ziehen, ohne dass ein Grund sichtbar war (Marcos
// Befund vom 2026-09-01).
//
// 240 px ist gemessen, nicht geraten: unterhalb davon laeuft im schmalsten
// Upstream-Panel (Clash) die Knopfreihe aus dem Kasten — Protokoll
// Business/tests/20260903_ui-dichte/audit-vorher.json.
//
// Der Boden ist das MINIMUM aus beiden Werten, nie das Maximum: auf schmalen
// Fenstern bleibt alles wie bisher (dort sind 14 % ohnehin weniger als
// 240 px), auf breiten wird der Prozentboden geloest. Diese Aenderung kann
// den erlaubten Bereich also nur vergroessern, nie verkleinern.
const MIN_WIDTH_PX = 240;

export function SidebarDock() {
  const mode = useViewerStore((s) => s.sidebarMode);
  const widthPct = useViewerStore((s) => s.sidebarWidthPct);
  const setSidebarWidthPct = useViewerStore((s) => s.setSidebarWidthPct);

  const rootRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [dragPct, setDragPct] = useState<number | null>(null);
  // Teardown for an in-flight resize, so a mid-drag unmount (viewport mode
  // switch) doesn't leak document listeners + a stuck body userSelect (#1208).
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => resizeCleanupRef.current?.(), []);

  // Measure the parent row so we can turn the persisted % into a pixel width
  // without a circular width dependency.
  useEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === 'undefined') return;
    const update = () => setRowWidth(parent.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [mode]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const parent = rootRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const move = (ev: MouseEvent) => {
        // The content pane's right edge is fixed against the activity bar;
        // dragging its left edge sets the width. Clamp live to the same range
        // the store enforces so the pane doesn't rubber-band past the limits.
        const contentPx = rect.right - ACTIVITY_BAR_PX - ev.clientX;
        const pct = (contentPx / rect.width) * 100;
        // Trassia: der kleinere der beiden Boeden gewinnt (siehe MIN_WIDTH_PX).
        const minPct = rect.width > 0
          ? Math.min(MIN_WIDTH_PCT, (MIN_WIDTH_PX / rect.width) * 100)
          : MIN_WIDTH_PCT;
        setDragPct(Math.max(minPct, Math.min(MAX_WIDTH_PCT, pct)));
      };
      const teardown = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeCleanupRef.current = null;
      };
      const up = () => {
        teardown();
        setDragPct((pct) => {
          if (pct !== null) setSidebarWidthPct(pct);
          return null;
        });
      };
      resizeCleanupRef.current = teardown;
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [setSidebarWidthPct],
  );

  const effectivePct = dragPct ?? widthPct;
  const contentPx = rowWidth > 0 ? Math.round((rowWidth * effectivePct) / 100) : undefined;

  return (
    <div ref={rootRef} className="flex h-full shrink-0">
      {mode === 'expanded' && (
        <>
          {/* Resize handle */}
          <div
            onMouseDown={onResizeStart}
            className="w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/70 transition-colors"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
          />
          <div
            className="h-full min-w-0 overflow-hidden panel-container flex flex-col"
            style={{ width: contentPx ?? `${effectivePct}%` }}
          >
            <ChSectionDockSlot />
            <div className="min-h-0 flex-1">
              <SidebarPanelHost />
            </div>
          </div>
        </>
      )}
      <ActivityBar />
    </div>
  );
}
