/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Unified workspace sidebar (#1208 follow-up).
 *
 * The right region of the viewer is a VS Code-style **activity bar + docked
 * sidebar**. This slice owns the *layout* of that sidebar — which panels
 * appear in the activity bar, in what order, whether the sidebar is
 * expanded / collapsed-to-icons / hidden, and how wide it is. The *which
 * panel is showing* question is answered by the per-panel visibility flags
 * (kept mutually exclusive by a store subscription in `store/index.ts`),
 * mirrored here as the runtime-only `sidebarActivePanel`.
 *
 * Persistence: the customizable layout (mode / width / order / hidden set)
 * is a cross-file workspace preference saved to localStorage, so — like the
 * dock layout (#1201) — it is intentionally NOT cleared on a new file load.
 * It can additionally be captured into / restored from a Flavor via
 * {@link SidebarSlice.serializeSidebarLayout} / {@link SidebarSlice.applySidebarLayout}.
 */

import type { StateCreator } from 'zustand';
import {
  WORKSPACE_PANELS,
  isWorkspacePanelId,
  getPanelDef,
  SIDEBAR_DEFAULT_WIDTH_PCT,
  type WorkspacePanelId,
} from '@/lib/panels/registry';

/** Clamp the docked-split ratio so neither half can collapse to nothing. */
const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
function clampSplitRatio(r: number): number {
  if (!Number.isFinite(r)) return 0.5;
  return Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, r));
}

/** Only right-pane (`side`) panels can share the docked split (#1266); bottom
 *  and left panels have their own regions. */
function canShareSplit(id: WorkspacePanelId): boolean {
  return getPanelDef(id)?.region === 'side';
}

/** Expanded = rail + content pane; collapsed = icon-only rail. The activity-bar
 *  rail is always visible — there is intentionally no "fully off" mode (the
 *  rail is the always-available entry point to every panel). */
export type SidebarMode = 'expanded' | 'collapsed';

/** The portable shape captured into a Flavor's `layout.state.sidebar`. */
export interface SidebarLayoutSnapshot {
  mode: SidebarMode;
  widthPct: number;
  order: WorkspacePanelId[];
  hiddenIds: WorkspacePanelId[];
}

const STORAGE_KEY = 'ifc-lite:sidebar-layout-v1';
// Trassia (Paket V-PFLEGE, Teil A): von 14 auf 6 gesenkt.
//
// Diese Klemme ist die PERSISTENZ-Schranke — sie faengt kaputte oder
// veraltete gespeicherte Werte ab. Der echte, bildschirmbreitenabhaengige
// Boden liegt in SidebarDock.tsx (MIN_WIDTH_PX = 240 px), weil nur dort die
// Breite der Zeile bekannt ist; ein Prozentwert allein kann ihn nicht
// ausdruecken. Bliebe hier 14 stehen, wuerde der Speicher jede vom Nutzer
// gezogene Breite unter 14 % sofort wieder hochklemmen und die Aenderung in
// SidebarDock waere wirkungslos.
//
// 6 % deckt 240 px bis hinauf zu einem 4000-px-Schirm ab (240/4000 = 6 %) und
// bleibt zugleich eine echte Schranke gegen eine auf null gespeicherte Breite.
const MIN_WIDTH_PCT = 6;
const MAX_WIDTH_PCT = 60;

// Display order in the rail. Hierarchy (#1267) is appended to WORKSPACE_PANELS
// to keep the frozen Alt+1..0 mapping intact, but its natural home is the TOP
// of the rail (it's the primary navigation surface), so float it to the front
// here. The registry order still drives Alt+N; this only drives display.
const DEFAULT_ORDER: WorkspacePanelId[] = (() => {
  const ids = WORKSPACE_PANELS.map((p) => p.id);
  const rest = ids.filter((id) => id !== 'hierarchy');
  return ids.includes('hierarchy') ? ['hierarchy', ...rest] : rest;
})();

// Trassia (Marco-Go 03.09.2026): die Vorgabebreite der Seitenleiste ist
// 340 PIXEL, nicht 22 Prozent.
//
// Warum: ein Prozentwert skaliert mit dem Bildschirm, der Platzbedarf des
// Inhalts nicht. 22 % sind auf 1600 px 352 px — aber auf einem 2560er Schirm
// **563 px** und auf 3440 px 757 px. Die 563 px waren die „viel zu grosse"
// Box aus Marcos Befund (gemessen 2026-09-01,
// Business/tests/20260903_ui-dichte/leiste-*.json). 340 px ist die heutige
// 1600-px-Breite, also der Wert, den bisher niemand beanstandet hat.
//
// Paket V-PFLEGE hat den ZIEHBODEN auf Pixel umgestellt (MIN_WIDTH_PX in
// SidebarDock.tsx); dies hier ist das Gegenstueck fuer die VORGABE.
const DEFAULT_WIDTH_PX = 340;

/**
 * Die Vorgabebreite als Prozentwert des aktuellen Fensters.
 *
 * Zwei Eigenschaften, beide beabsichtigt:
 *
 *  1. **Nie breiter als bisher.** Es gilt das Minimum aus 340 px und dem
 *     alten Prozentwert. Auf einem schmalen Fenster (unter ~1545 px) sind
 *     22 % weniger als 340 px — dort bleibt alles exakt wie vorher. Die
 *     Aenderung kann die Vorgabe also nur verkleinern, nie vergroessern.
 *  2. **Kein Ueberschreiben gespeicherter Werte.** Diese Funktion liefert nur
 *     den FALLBACK. Wer die Leiste je gezogen hat, hat einen `widthPct` in
 *     `localStorage`; der Zweig in `loadPersisted()` nimmt ihn unveraendert.
 *     Die Vorgabe wird beim Start NICHT geschrieben (`persist` laeuft nur aus
 *     Aktionen heraus) — ohne gespeicherten Wert wird sie darum bei jedem
 *     Start neu aus der aktuellen Fensterbreite gerechnet und ergibt wieder
 *     340 px, auf jedem Schirm.
 *
 * Ohne `window` (SSR, node:test) bleibt es beim alten Prozentwert.
 */
function defaultWidthPct(): number {
  if (typeof window === 'undefined' || !(window.innerWidth > 0)) {
    return SIDEBAR_DEFAULT_WIDTH_PCT;
  }
  return Math.min(SIDEBAR_DEFAULT_WIDTH_PCT, (DEFAULT_WIDTH_PX / window.innerWidth) * 100);
}

function clampWidth(pct: number): number {
  if (!Number.isFinite(pct)) return defaultWidthPct();
  return Math.max(MIN_WIDTH_PCT, Math.min(MAX_WIDTH_PCT, pct));
}

/**
 * Reconcile a possibly-stale persisted order with the live registry: keep the
 * persisted ordering for ids that still exist, drop unknown ids, and append
 * any registry panels the persisted list never knew about (so newly-added
 * panels surface instead of silently vanishing).
 */
function normalizeOrder(order: unknown): WorkspacePanelId[] {
  const seen = new Set<WorkspacePanelId>();
  const out: WorkspacePanelId[] = [];
  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id === 'string' && isWorkspacePanelId(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  // Surface registry panels the persisted list never knew about, in
  // DEFAULT_ORDER order. Hierarchy (#1267) is special: its documented home is
  // the TOP of the rail, so a first-time migration of an order saved BEFORE it
  // existed prepends it instead of trailing it at the bottom.
  for (const id of DEFAULT_ORDER) {
    if (seen.has(id)) continue;
    if (id === 'hierarchy') out.unshift(id);
    else out.push(id);
  }
  return out;
}

/** Information is the always-available fallback — it can never be hidden. */
function normalizeHidden(hidden: unknown): WorkspacePanelId[] {
  if (!Array.isArray(hidden)) return [];
  const out = new Set<WorkspacePanelId>();
  for (const id of hidden) {
    if (typeof id === 'string' && isWorkspacePanelId(id) && id !== 'properties') out.add(id);
  }
  return [...out];
}

function isMode(m: unknown): m is SidebarMode {
  return m === 'expanded' || m === 'collapsed';
}

/** Coerce a persisted / captured mode, migrating the retired `hidden` value to
 *  `collapsed` so the rail stays visible. */
function coerceMode(m: unknown, fallback: SidebarMode): SidebarMode {
  if (isMode(m)) return m;
  if (m === 'hidden') return 'collapsed';
  return fallback;
}

function loadPersisted(): SidebarLayoutSnapshot {
  const fallback: SidebarLayoutSnapshot = {
    mode: 'expanded',
    // Trassia: 340 px statt 22 % — siehe defaultWidthPct().
    widthPct: defaultWidthPct(),
    order: [...DEFAULT_ORDER],
    hiddenIds: [],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SidebarLayoutSnapshot>;
    return {
      mode: coerceMode(parsed?.mode, 'expanded'),
      // Trassia: der GESPEICHERTE Wert gewinnt unveraendert; nur wenn keiner
      // da ist (oder er kaputt ist), greift die 340-px-Vorgabe.
      widthPct: clampWidth(typeof parsed?.widthPct === 'number' ? parsed.widthPct : defaultWidthPct()),
      order: normalizeOrder(parsed?.order),
      hiddenIds: normalizeHidden(parsed?.hiddenIds),
    };
  } catch (error) {
    console.warn('[sidebar] ignoring malformed persisted layout:', error);
    return fallback;
  }
}

function persist(snap: SidebarLayoutSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch (error) {
    // Quota / private mode — the layout just won't persist this session.
    console.warn('[sidebar] failed to persist layout:', error);
  }
}

export interface SidebarSlice {
  /** expanded | collapsed (icons only) | hidden (off). Persisted. */
  sidebarMode: SidebarMode;
  /** Docked sidebar width as a % of the viewport. Persisted. */
  sidebarWidthPct: number;
  /** Activity-bar order of every panel id. Persisted. */
  sidebarOrder: WorkspacePanelId[];
  /** Panels removed from the activity bar (never includes `properties`). Persisted. */
  sidebarHiddenIds: WorkspacePanelId[];
  /** Customize ("edit the bar") mode — runtime only, never persisted. */
  sidebarCustomizing: boolean;
  /** The panel currently shown in the dock — runtime only; tracked from the
   *  per-panel visibility flags by the store subscription. */
  sidebarActivePanel: WorkspacePanelId;
  /** The panel shown in the LOWER half of a split docked pane, or null when the
   *  pane isn't split (#1266). Side panels only; runtime-only (a within-session
   *  power feature, like the float layout's geometry). */
  sidebarSecondaryPanel: WorkspacePanelId | null;
  /** Fraction (0.2 to 0.8) of the docked pane's height given to the TOP panel
   *  when split. Runtime-only. */
  sidebarSplitRatio: number;
  /** Panels currently torn off into an OS / PiP window — runtime only
   *  (window handles can't persist, and pop-up blockers forbid auto-reopen). */
  poppedOutIds: WorkspacePanelId[];

  setSidebarMode: (mode: SidebarMode) => void;
  /** Off ⇄ on (expanded). The "is the sidebar optional" toggle. */
  toggleSidebar: () => void;
  /** expanded → collapsed → hidden → expanded. */
  cycleSidebarMode: () => void;
  setSidebarWidthPct: (pct: number) => void;
  /** Move a panel to a new index within the activity-bar order. */
  reorderSidebarPanel: (id: WorkspacePanelId, toIndex: number) => void;
  /** Show / hide a panel in the activity bar (`properties` always shows). */
  setPanelShownInSidebar: (id: WorkspacePanelId, shown: boolean) => void;
  setSidebarCustomizing: (on: boolean) => void;
  /** Restore order / hidden / width / mode to the shipped defaults. */
  resetSidebarLayout: () => void;
  /** Set the active docked panel (called by the store's exclusivity subscription). */
  setSidebarActivePanel: (id: WorkspacePanelId) => void;
  /** Set / clear the lower-half split panel (#1266). Ignores non-side panels and
   *  a panel that already owns the top half. Un-floating is the caller's job. */
  setSidebarSecondaryPanel: (id: WorkspacePanelId | null) => void;
  /** Resize the docked split (fraction for the top panel, clamped 0.2 to 0.8). */
  setSidebarSplitRatio: (ratio: number) => void;
  /** Track a panel popped out into / re-docked from an OS window. */
  setPanelPoppedOut: (id: WorkspacePanelId, on: boolean) => void;

  /** Capture the customizable layout (for a Flavor's `layout.state.sidebar`). */
  serializeSidebarLayout: () => SidebarLayoutSnapshot;
  /** Apply a captured layout (from a Flavor). Persists + tolerates garbage. */
  applySidebarLayout: (snap: unknown) => void;
}

export const createSidebarSlice: StateCreator<SidebarSlice, [], [], SidebarSlice> = (set, get) => {
  const persisted = loadPersisted();

  /** Persist only the four layout fields, reading the rest from current state. */
  const persistCurrent = (patch: Partial<SidebarLayoutSnapshot>) => {
    const s = get();
    persist({
      mode: patch.mode ?? s.sidebarMode,
      widthPct: patch.widthPct ?? s.sidebarWidthPct,
      order: patch.order ?? s.sidebarOrder,
      hiddenIds: patch.hiddenIds ?? s.sidebarHiddenIds,
    });
  };

  return {
    sidebarMode: persisted.mode,
    sidebarWidthPct: persisted.widthPct,
    sidebarOrder: persisted.order,
    sidebarHiddenIds: persisted.hiddenIds,
    sidebarCustomizing: false,
    sidebarActivePanel: 'properties',
    sidebarSecondaryPanel: null,
    sidebarSplitRatio: 0.5,
    poppedOutIds: [],

    setSidebarMode: (mode) => {
      // Leaving expanded mode hides the activity bar / content pane, so the
      // customize popover would be stranded with no UI — exit customize too.
      set({ sidebarMode: mode, sidebarCustomizing: mode === 'expanded' ? get().sidebarCustomizing : false });
      persistCurrent({ mode });
    },

    toggleSidebar: () => {
      get().setSidebarMode(get().sidebarMode === 'expanded' ? 'collapsed' : 'expanded');
    },

    cycleSidebarMode: () => {
      get().setSidebarMode(get().sidebarMode === 'expanded' ? 'collapsed' : 'expanded');
    },

    setSidebarWidthPct: (pct) => {
      const widthPct = clampWidth(pct);
      set({ sidebarWidthPct: widthPct });
      persistCurrent({ widthPct });
    },

    reorderSidebarPanel: (id, toIndex) => {
      const order = [...get().sidebarOrder];
      const from = order.indexOf(id);
      if (from === -1) return;
      order.splice(from, 1);
      const clamped = Math.max(0, Math.min(order.length, toIndex));
      order.splice(clamped, 0, id);
      set({ sidebarOrder: order });
      persistCurrent({ order });
    },

    setPanelShownInSidebar: (id, shown) => {
      if (id === 'properties') return; // the fallback always shows
      const hiddenIds = new Set(get().sidebarHiddenIds);
      if (shown) hiddenIds.delete(id);
      else hiddenIds.add(id);
      const next = [...hiddenIds];
      set({ sidebarHiddenIds: next });
      persistCurrent({ hiddenIds: next });
    },

    setSidebarCustomizing: (on) => set({ sidebarCustomizing: on }),

    resetSidebarLayout: () => {
      const snap: SidebarLayoutSnapshot = {
        mode: 'expanded',
        // Trassia: „Layout zuruecksetzen" gibt die neue Vorgabe, nicht die alte.
        widthPct: defaultWidthPct(),
        order: [...DEFAULT_ORDER],
        hiddenIds: [],
      };
      set({
        sidebarMode: snap.mode,
        sidebarWidthPct: snap.widthPct,
        sidebarOrder: snap.order,
        sidebarHiddenIds: snap.hiddenIds,
        sidebarCustomizing: false,
        // Drop any docked split back to a single panel (#1266).
        sidebarSecondaryPanel: null,
        sidebarSplitRatio: 0.5,
      });
      persist(snap);
    },

    setSidebarActivePanel: (id) => {
      const patch: Partial<SidebarSlice> = {};
      if (get().sidebarActivePanel !== id) patch.sidebarActivePanel = id;
      // The top half can't also be the bottom half: if the new primary is the
      // split secondary, collapse the split (#1266).
      if (get().sidebarSecondaryPanel === id) patch.sidebarSecondaryPanel = null;
      if (Object.keys(patch).length > 0) set(patch);
    },

    setSidebarSecondaryPanel: (id) => {
      if (id !== null && (!canShareSplit(id) || id === get().sidebarActivePanel)) return;
      set({ sidebarSecondaryPanel: id });
    },

    setSidebarSplitRatio: (ratio) => set({ sidebarSplitRatio: clampSplitRatio(ratio) }),

    setPanelPoppedOut: (id, on) => {
      const current = get().poppedOutIds;
      const has = current.includes(id);
      if (on && !has) set({ poppedOutIds: [...current, id] });
      else if (!on && has) set({ poppedOutIds: current.filter((x) => x !== id) });
    },

    serializeSidebarLayout: () => {
      const s = get();
      return {
        mode: s.sidebarMode,
        widthPct: s.sidebarWidthPct,
        order: [...s.sidebarOrder],
        hiddenIds: [...s.sidebarHiddenIds],
      };
    },

    applySidebarLayout: (snap) => {
      const obj = (snap ?? {}) as Partial<SidebarLayoutSnapshot>;
      const next: SidebarLayoutSnapshot = {
        mode: coerceMode(obj.mode, get().sidebarMode),
        widthPct: clampWidth(typeof obj.widthPct === 'number' ? obj.widthPct : get().sidebarWidthPct),
        order: normalizeOrder(obj.order),
        hiddenIds: normalizeHidden(obj.hiddenIds),
      };
      set({
        sidebarMode: next.mode,
        sidebarWidthPct: next.widthPct,
        sidebarOrder: next.order,
        sidebarHiddenIds: next.hiddenIds,
      });
      persist(next);
    },
  };
};
