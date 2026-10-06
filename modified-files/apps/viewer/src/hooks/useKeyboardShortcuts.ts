/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/** Live global and tool actions for the canonical keyboard table (#5841). */
import { useEffect } from 'react';
import { replayWorkspaceHistory } from '@/lib/model-placement/history';
import { registerKeyboardCommand, type CommandRun } from '@/lib/commands/dispatcher';
import type { KeyCommandId } from '@/lib/commands/keyboard-commands';
import { useViewerStore } from '@/store';
import { showAllFromStore } from '@/store/homeView';
import { hideSelectionFromStore } from '@/store/hideSelection';
import { workspacePanelForShortcutCode } from '@/lib/panels/registry';
import { bottomPanelFlags } from '@/lib/panels/bottom-panels';
// Trassia overlay (not upstream) — Paket U2/TODO #36 (Business-Entscheid
// 2026-09-03): Alt+Ziffer oeffnet im Trassia-Modus nur Panels, die die Leiste
// anbietet; ?voll=1 zeigt alle. Siehe lib/ch/modus.ts.
import { chVollmodus } from '@/lib/ch/modus';
import { chElementePlan, chPlanAusfuehren, chZeilenAuswahlLeeren, chZeilenSichtbarkeitUmschalten } from '@/lib/ch/zeilen-auswahl';
import { closeAllPanelWindows } from '@/services/panel-windows';
import { WALK_MOVEMENT_KEYS, eventKey, isTextEditingElement } from '@/lib/keyboard-event';
import { bindModelWorkspaceKeys } from '@/lib/commands/modeling/keys-workspace';
import {
  executeBasketIsolate, executeBasketAdd,
  executeBasketRemove, executeBasketSaveView,
} from '@/store/basket/basketCommands';

interface KeyboardShortcutsOptions { enabled?: boolean }

function escapeGlobal(closeAll: boolean, event?: KeyboardEvent): boolean | void {
  const target = event?.target as HTMLElement | null;
  if (target?.closest?.('[role="menu"], [role="menuitem"], [role="dialog"], [data-radix-menu-content], [aria-label="Customize sidebar panels"]')) return false;
  chZeilenAuswahlLeeren();
  const state = useViewerStore.getState();
  if (closeAll) {
    state.showWorkspacePanel('properties');
    state.resetDockLayout();
    closeAllPanelWindows();
    useViewerStore.setState(bottomPanelFlags(null));
    state.setOverridesPanelVisible(false);
    state.setChatPanelVisible(false);
    state.setSheetPanelVisible(false);
    state.setLeftPanelCollapsed(false);
    state.setRightPanelCollapsed(false);
  }
  if (state.activeTool !== 'select') state.setActiveTool('select', 'esc');
  else state.clearEntitySelection();
}

function rotateSelected(event: KeyboardEvent): boolean {
  const state = useViewerStore.getState();
  if (!state.editEnabled || !state.selectedEntity) return false;
  const result = state.rotateEntity(
    state.selectedEntity.modelId,
    state.selectedEntity.expressId,
    ((event.shiftKey ? -15 : 15) * Math.PI) / 180,
  );
  if (!result.ok) {
    void import('@/components/ui/toast').then(({ toast }) => toast.error(`Couldn't rotate: ${result.reason}`));
  }
  return true;
}

function finishMeasurement(): boolean {
  const state = useViewerStore.getState();
  if (state.activePolyline) {
    if (!state.finishPolyline(false)) {
      void import('@/components/ui/toast').then(({ toast }) => toast.error('Polyline needs at least 2 points'));
    }
    return true;
  }
  if (state.activeRadius) {
    if (!state.finishRadius()) {
      void import('@/components/ui/toast').then(({ toast }) => toast.error('Radius needs at least 3 points'));
    }
    return true;
  }
  return false;
}

function cancelMeasurement(): boolean {
  const state = useViewerStore.getState();
  if (state.activeMeasurement) { state.cancelMeasurement(); return true; }
  if (state.activePolyline) { state.cancelPolyline(); return true; }
  if (state.activeAngle) { state.cancelAngle(); return true; }
  if (state.activeRadius) { state.cancelRadius(); return true; }
  return false;
}

function splitSelected(): void {
  const state = useViewerStore.getState();
  if (state.session?.activeCommandId === 'element.split') {
    state.endCommand('cancel');
    return;
  }
  if (state.selectedEntityId === null) return;
  state.startCommand('element.split');
}

function hideSelected(event: KeyboardEvent): boolean {
  if (event.key === ' ') {
    const tag = document.activeElement?.tagName;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'A') return false;
  }
  if (event.key === ' ') {
    const s = useViewerStore.getState();
    const actions = { hideEntities: s.hideEntities, showEntities: s.showEntities, setModelVisibility: s.setModelVisibility };
    let steps = chZeilenSichtbarkeitUmschalten({ versteckt: s.hiddenEntities, modellSichtbar: (id) => s.models.get(id)?.visible }, actions);
    if (steps === 0) {
      const ids = s.selectedEntityIds.size > 0 ? [...s.selectedEntityIds] : s.selectedEntityId === null ? [] : [s.selectedEntityId];
      const plan = chElementePlan(ids, s.hiddenEntities);
      chPlanAusfuehren(plan, actions);
      steps = plan.length;
    }
    return steps > 0;
  }
  return hideSelectionFromStore();
}

function walkOwns(event: KeyboardEvent): boolean {
  const key = eventKey(event);
  return useViewerStore.getState().activeTool === 'walk' && key !== null && WALK_MOVEMENT_KEYS.has(key);
}

/** Each command id below gets its chord and context from KEY_COMMANDS. */
const RUNNERS: readonly [KeyCommandId, CommandRun][] = [
  ['edit.undo', () => { replayWorkspaceHistory(useViewerStore.getState(), 'undo'); }],
  ['edit.redo', () => { replayWorkspaceHistory(useViewerStore.getState(), 'redo'); }],
  ['tool.select', () => { useViewerStore.getState().setActiveTool('select'); }],
  ['tool.walk', () => { useViewerStore.getState().setActiveTool('walk'); }],
  ['tool.measure', () => { useViewerStore.getState().setActiveTool('measure'); }],
  ['tool.section', () => { useViewerStore.getState().setActiveTool('section'); }],
  ['tool.annotate', () => { useViewerStore.getState().setActiveTool('annotate'); }],
  ['ui.openPanel', (event) => {
    const panel = workspacePanelForShortcutCode(event.code);
    if (!panel || (!chVollmodus() && useViewerStore.getState().sidebarHiddenIds.includes(panel))) return false;
    useViewerStore.getState().openPanelInHome(panel, 'shortcut');
  }],
  ['ui.toggleSidebar', () => { useViewerStore.getState().cycleSidebarMode(); }],
  ['edit.toggleEditMode', () => { useViewerStore.getState().toggleEditEnabled(); }],
  ['tool.split', () => { splitSelected(); }],
  ['edit.rotate', rotateSelected],
  ['basket.isolate', () => { executeBasketIsolate(); }],
  ['basket.add', () => { executeBasketAdd(); }],
  ['basket.remove', () => { executeBasketRemove(); }],
  ['basket.toggleDock', (event) => {
    if (walkOwns(event)) return false;
    useViewerStore.getState().toggleBottomPanel('presentation', 'shortcut');
  }],
  ['basket.saveView', () => {
    if (useViewerStore.getState().pinboardEntities.size === 0) return false;
    void executeBasketSaveView().catch((error: unknown) => console.error('[keyboard] Could not save basket view:', error));
  }],
  ['visibility.hideSelection', hideSelected],
  ['visibility.toggleSelection', hideSelected],
  ['visibility.showAll', (event) => {
    if (walkOwns(event)) return false;
    showAllFromStore('a');
  }],
  ['measure.cancel', cancelMeasurement],
  ['measure.finish', finishMeasurement],
  ['measure.toggleSnap', () => { useViewerStore.getState().toggleSnap(); }],
  ['selection.escape', (event) => escapeGlobal(false, event)],
  ['ui.closeAllPanels', (event) => escapeGlobal(true, event)],
  ['ui.toggleTheme', () => { useViewerStore.getState().toggleTheme(); }],
];

const TOOL_CONTEXT: Partial<Record<KeyCommandId, string>> = {
  'measure.cancel': 'measure',
  'measure.finish': 'measure',
  'measure.toggleSnap': 'measure',
};

/** Undo / redo also run from a focused combobox or menu button; only real text editing keeps its own. */
const HISTORY_COMMANDS: ReadonlySet<KeyCommandId> = new Set(['edit.undo', 'edit.redo']);

export function useKeyboardShortcuts({ enabled = true }: KeyboardShortcutsOptions = {}): void {
  useEffect(() => {
    if (!enabled) return;
    const dispose = RUNNERS.map(([id, run]) => registerKeyboardCommand(id, run, {
      active: TOOL_CONTEXT[id] ? () => useViewerStore.getState().activeTool === TOOL_CONTEXT[id] : undefined,
      allowInTextEntry: HISTORY_COMMANDS.has(id) ? (event: KeyboardEvent) => !isTextEditingElement(event.target) : undefined,
    }));
    dispose.push(bindModelWorkspaceKeys());
    return () => { for (const remove of dispose) remove(); };
  }, [enabled]);
}
