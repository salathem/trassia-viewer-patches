/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Workspace-panel registry (issues #1200 / #1201 / #1208).
 *
 * Single source of truth for the panels the unified sidebar switches
 * between, floats, and pops out. Each entry carries its id, labels, icon,
 * an activity-bar `group` (for divider clustering) and a `prefersWide`
 * hint (code/table/timeline panels want a wider sidebar + bigger pop-out).
 *
 * The panel switcher, the activity bar, the keyboard shortcuts (Alt+N by
 * array index — DO NOT reorder the first seven, that mapping shipped in
 * #1200), the floating-panel host and the pop-out windows all read this.
 * The actual panel components are mapped from an id by `renderPanelBody`,
 * which keeps this module free of heavy imports.
 */

import {
  Info,
  GitCompareArrows,
  MessageSquare,
  ClipboardCheck,
  Palette,
  Crosshair,
  Puzzle,
  Terminal,
  CalendarRange,
  Table2,
  ListTree,
  Users,
  Cloud,
  Layers as LayersIcon,
  Box,
  // Trassia overlay (not upstream) — Paket V-DRAPE.
  Mountain,
  // Trassia overlay (not upstream) — Paket V-KUBATUR; Symbol seit U4
  // Auf/Ab statt Lineal (Review B5: das Lineal sagte «Messen»).
  ArrowUpDown,
  // Trassia overlay (not upstream) — Paket V-LAENGSSCHNITT.
  ChartSpline,
  // Trassia overlay (not upstream) — Trassierungs-Spike S0 (Paket ENTWURF).
  Route,
  type LucideIcon,
} from 'lucide-react';
// Trassia overlay (not upstream) — die Spike-Flagge `?entwurf=1`. Winzig und
// ohne Abhaengigkeiten; der eigentliche Spike haengt hinter einem dynamischen
// Import (siehe renderPanelBody.tsx) und liegt darum nicht im Startbuendel.
import { chEntwurfAktiv } from '@/lib/ch/entwurf/entwurf-flag';

/** Every panel reachable from the unified sidebar rail. `properties` is the
 *  Information panel (the right pane's default fallback). Each panel opens in
 *  its home {@link WorkspacePanelDef.region} — `side` panels in the right pane,
 *  `bottom` panels (Script / Schedule / Lists) in the bottom strip, and the
 *  `left` panel (Hierarchy) in the left navigation slot (#1267). */
export type WorkspacePanelId =
  | 'hierarchy'
  | 'properties'
  | 'compare'
  | 'bcf'
  | 'ids'
  | 'lens'
  | 'clash'
  | 'extensions'
  | 'sources'
  | 'script'
  | 'gantt'
  | 'lists'
  | 'collab'
  | 'layers'
  | 'zones'
  // Trassia overlay (not upstream) — Paket V-DRAPE.
  | 'drape'
  // Trassia overlay (not upstream) — Paket V-KUBATUR.
  | 'kubatur'
  // Trassia overlay (not upstream) — Paket V-LAENGSSCHNITT.
  | 'laengsschnitt'
  // Trassia overlay (not upstream) — Trassierungs-Spike S0, nur bei `?entwurf=1`.
  | 'entwurf';

/** Activity-bar clustering — a divider is drawn whenever the group changes. */
export type PanelGroup = 'navigate' | 'inspect' | 'review' | 'author' | 'work';

/** Where a panel docks when opened from the rail. `left` is the dedicated
 *  hierarchy navigation slot, toggled via `leftPanelCollapsed` (#1267). */
export type PanelRegion = 'side' | 'bottom' | 'left';

export interface WorkspacePanelDef {
  id: WorkspacePanelId;
  /** Full label (tooltip / floating-window title / sidebar header). */
  title: string;
  /** Short label for menus / the switcher dropdown. */
  short: string;
  Icon: LucideIcon;
  /** Activity-bar group used to cluster icons with dividers. */
  group: PanelGroup;
  /** Home dock: the right pane (`side`) or the bottom strip (`bottom`). */
  region: PanelRegion;
  /** Wider default pop-out / float size for content-heavy panels. */
  prefersWide?: boolean;
}

export const WORKSPACE_PANELS: readonly WorkspacePanelDef[] = [
  // Alt+1..9 / Alt+0 — order frozen since #1200 for the first seven.
  { id: 'properties', title: 'Information', short: 'Info', Icon: Info, group: 'inspect', region: 'side' },
  { id: 'compare', title: 'Compare models', short: 'Compare', Icon: GitCompareArrows, group: 'inspect', region: 'side' },
  { id: 'bcf', title: 'BCF issues', short: 'BCF', Icon: MessageSquare, group: 'review', region: 'side' },
  { id: 'ids', title: 'IDS validation', short: 'IDS', Icon: ClipboardCheck, group: 'review', region: 'side' },
  { id: 'lens', title: 'Lens rules', short: 'Lens', Icon: Palette, group: 'review', region: 'side' },
  { id: 'clash', title: 'Clash detection', short: 'Clash', Icon: Crosshair, group: 'review', region: 'side' },
  { id: 'extensions', title: 'Extensions', short: 'Extensions', Icon: Puzzle, group: 'author', region: 'side' },
  // Bottom-strip panels — launched from the rail, open at the bottom by default.
  { id: 'script', title: 'Script editor', short: 'Script', Icon: Terminal, group: 'work', region: 'bottom', prefersWide: true },
  { id: 'gantt', title: 'Construction schedule', short: 'Schedule', Icon: CalendarRange, group: 'work', region: 'bottom', prefersWide: true },
  { id: 'lists', title: 'Entity lists', short: 'Lists', Icon: Table2, group: 'work', region: 'bottom', prefersWide: true },
  // Left-slot nav panel (#1267), APPENDED so the frozen Alt+1..0 mapping above
  // is untouched (it gets no Alt shortcut). Its default *display* position is the
  // top of the rail (see DEFAULT_ORDER in sidebarSlice); the activity bar toggles
  // its left slot via `leftPanelCollapsed` rather than the right-pane flags.
  { id: 'hierarchy', title: 'Hierarchy', short: 'Tree', Icon: ListTree, group: 'navigate', region: 'left' },
  // Collaboration room roster (link-based multiuser). APPENDED so the frozen
  // Alt+1..0 mapping stays intact (no Alt shortcut). The activity bar hides it
  // while the collab feature flag is off (see ActivityBar).
  { id: 'collab', title: 'Collaboration room', short: 'Room', Icon: Users, group: 'review', region: 'side' },
  // Cloud sources (CDE integrations). APPENDED — no Alt shortcut. Always on
  // the rail; providers that failed to register are reported inside the panel.
  { id: 'sources', title: 'Cloud sources', short: 'Sources', Icon: Cloud, group: 'inspect', region: 'side' },
  // IFCX layer stack + per-layer diff (#1717). APPENDED so the frozen
  // Alt+1..0 mapping stays intact (no Alt shortcut). The activity bar only
  // surfaces it while a federated layer stack is loaded.
  { id: 'layers', title: 'Layer stack', short: 'Layers', Icon: LayersIcon, group: 'review', region: 'side' },
  // Location zones (construction sections / takt areas, #1810). APPENDED so
  // the frozen Alt+1..0 mapping stays intact (no Alt shortcut).
  { id: 'zones', title: 'Location zones', short: 'Zones', Icon: Box, group: 'review', region: 'side' },
  // Trassia (Paket V-DRAPE): 2D-Daten (DXF, GeoJSON/WFS) auf die
  // Gelaendeoberflaeche legen. ANGEHAENGT, damit die eingefrorene
  // Alt+1..0-Zuordnung der ersten zehn Eintraege unberuehrt bleibt — dieses
  // Panel bekommt keine Ziffer und ist ueber die Leiste erreichbar.
  // U4 (Review B5): eigene Flaechen deutsch — Titel = Tooltip in der Leiste
  // und Kopfzeile des Panels; Upstream-Eintraege bleiben englisch.
  { id: 'drape', title: 'Drape auf Gelände (DXF, GeoJSON, WFS)', short: 'Drape', Icon: Mountain, group: 'author', region: 'side' },
  // Trassia (Paket V-KUBATUR): Auftrag/Abtrag zwischen zwei Modellen entlang
  // einer Achse. ANGEHAENGT, aus demselben Grund wie `drape` — keine Ziffer,
  // erreichbar ueber die Leiste.
  { id: 'kubatur', title: 'Auftrag / Abtrag (Kubatur)', short: 'Auftrag/Abtrag', Icon: ArrowUpDown, group: 'author', region: 'side' },
  // Trassia (Paket V-LAENGSSCHNITT): Hoehenprofil entlang einer Achse.
  // ANGEHAENGT wie `drape` und `kubatur` — keine Ziffer, erreichbar ueber die
  // Leiste. `prefersWide`, weil eine Profilzeichnung Breite braucht: ein
  // ausgeklinktes Fenster ist damit 780 x 680 statt 440 x 640 px
  // (`services/panel-windows.ts`). Auf die Breite der ANGEDOCKTEN
  // Seitenleiste wirkt das Feld nicht — `SIDEBAR_WIDE_WIDTH_PCT` steht
  // zwar unten in dieser Datei, wird aber nirgends gelesen (geprueft im
  // Pin 989da893: einzige Fundstelle ist die Deklaration selbst).
  { id: 'laengsschnitt', title: 'Längsprofil', short: 'Längsprofil', Icon: ChartSpline, group: 'author', region: 'side', prefersWide: true },
  // Trassia (Trassierungs-Spike S0): Achse und Gradiente entwerfen, Korridor,
  // Massen und Normbefunde. **Nur bei `?entwurf=1`** — ohne die Flagge steht
  // der Eintrag gar nicht in der Registratur, also gibt es kein Symbol in der
  // Leiste, keinen Tastenweg und keinen Aufrufer fuer den dynamischen Import.
  // Das ist der Unterschied zwischen „unsichtbar" und „nicht geladen".
  //
  // ANGEHAENGT wie `drape`, `kubatur` und `laengsschnitt`. Der bedingte
  // Eintrag ist der EINZIGE in dieser Liste — und er steht am Ende, damit die
  // eingefrorene Alt+1..0-Zuordnung der ersten zehn Eintraege in beiden
  // Faellen (Flagge an wie aus) dieselbe ist.
  ...(chEntwurfAktiv()
    ? [{ id: 'entwurf' as const, title: 'Alignment design (spike)', short: 'Design', Icon: Route, group: 'author' as const, region: 'side' as const, prefersWide: true }]
    : []),
];

/** The bottom-strip panel ids, mapped to their store visibility flag + setter
 *  names — these stay independent of the single-tenant right pane. */
export type BottomPanelId = Extract<WorkspacePanelId, 'script' | 'gantt' | 'lists'>;

export function isBottomPanel(id: WorkspacePanelId): id is BottomPanelId {
  return id === 'script' || id === 'gantt' || id === 'lists';
}

/** The left-slot nav panel (Hierarchy, #1267): toggled via `leftPanelCollapsed`,
 *  never floated / popped / docked into the right pane. */
export function isLeftPanel(id: WorkspacePanelId): id is 'hierarchy' {
  return id === 'hierarchy';
}

const PANEL_BY_ID = new Map<WorkspacePanelId, WorkspacePanelDef>(WORKSPACE_PANELS.map((p) => [p.id, p]));

export function getPanelDef(id: WorkspacePanelId): WorkspacePanelDef | undefined {
  return PANEL_BY_ID.get(id);
}

/** Type guard for narrowing arbitrary strings to a known panel id. */
export function isWorkspacePanelId(id: string): id is WorkspacePanelId {
  return PANEL_BY_ID.has(id as WorkspacePanelId);
}

/**
 * Map an Alt+digit shortcut's `KeyboardEvent.code` to the workspace panel it
 * opens (#1200/#1208). Digit/Numpad 1-9 select the first nine panels; 0 selects
 * the tenth. Keyed off `code` (not `key`) so it stays layout-independent — on
 * macOS Alt+1 yields the character "¡" but the code is still "Digit1". Returns
 * undefined for non-digit codes (so other Alt combos fall through) or a digit
 * past the registry length.
 */
export function workspacePanelForShortcutCode(code: string): WorkspacePanelId | undefined {
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(code);
  if (!m) return undefined;
  const n = Number(m[1]);
  return WORKSPACE_PANELS[n === 0 ? 9 : n - 1]?.id;
}

/** The analysis / tool panels that toggle in the sidebar (everything except
 *  the Information fallback, which shows when no other panel is open). */
export type AnalysisPanelId = Exclude<WorkspacePanelId, 'properties'>;

export function isAnalysisPanel(id: WorkspacePanelId): id is AnalysisPanelId {
  return id !== 'properties';
}

/** Default docked-sidebar width as a % of the viewport, and the wider default
 *  used when a `prefersWide` panel (Script / Gantt / Lists) is active. */
export const SIDEBAR_DEFAULT_WIDTH_PCT = 22;
export const SIDEBAR_WIDE_WIDTH_PCT = 40;
