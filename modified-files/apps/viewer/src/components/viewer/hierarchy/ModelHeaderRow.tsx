/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * A `model-header` tree row (one federated model's visibility, reposition,
 * sync and remove controls). Split out of `HierarchyNode` (#4918 slice 4,
 * following the `ModelTagGroupRow` precedent) purely to stay under the
 * module-size budget — `HierarchyNode` still owns every other row type and
 * dispatches to this component for `model-header` nodes.
 */

import { Move3D, ChevronRight, Eye, EyeOff, FileBox, RefreshCw, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { openRepositionModels } from '@/lib/model-placement/commands';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import type { TreeNode } from './types';
import { ModelRowTags } from './ModelRowTags';
// Trassia overlay (Paket U3-klein): Zeilen-Auswahl fuer die Leertaste — Hervorhebung
// gewaehlter Zeilen und Ctrl-Klick auf der Modellzeile. Siehe lib/ch/zeilen-auswahl.ts.
import { chZeilenKlick, useChZeileGewaehlt } from '@/lib/ch/zeilen-auswahl';
import { chZahlExakt } from '@/lib/ch/gesamt-statistik';

// Trassia (Paket V-UX, P6 / Befund R-9): Zeilenschalter dauerhaft sichtbar und
// mindestens 24x24 px; upstream 18x18 px und erst beim Hovern eingeblendet — auf
// einem Zeigegeraet ohne Hover gab es sie gar nicht.
const CH_SCHALTER = 'inline-flex h-6 w-6 items-center justify-center rounded p-0.5 opacity-70 transition-opacity hover:bg-muted hover:opacity-100 group-hover:opacity-100';

export interface ModelHeaderRowProps {
  node: TreeNode;
  virtualRow: { size: number; start: number };
  modelsCount: number;
  modelVisible?: boolean;
  onModelVisibilityToggle: (modelId: string, e: React.MouseEvent) => void;
  onRemoveModel: (modelId: string, e: React.MouseEvent) => void;
  onSyncSourceModel?: (modelId: string, e: React.MouseEvent) => void;
  onModelHeaderClick: (modelId: string, nodeId: string, hasChildren: boolean) => void;
  sourceBacked?: boolean;
  sourceSyncing?: boolean;
}

export function ModelHeaderRow({
  node,
  virtualRow,
  modelsCount,
  modelVisible,
  onModelVisibilityToggle,
  onRemoveModel,
  onSyncSourceModel,
  onModelHeaderClick,
  sourceBacked = false,
  sourceSyncing = false,
}: ModelHeaderRowProps) {
  const { t } = useTranslation();
  const modelId = node.modelIds[0];
  // Trassia (U3-klein): steht die Zeile in der Zeilen-Auswahl (Leertaste)?
  const chGewaehlt = useChZeileGewaehlt(node.id);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 border-l-4 transition-all group ch-zeile',
          'hover:bg-zinc-50 dark:hover:bg-zinc-900',
          'border-transparent',
          !modelVisible && 'opacity-50',
          node.hasChildren && 'cursor-pointer',
          chGewaehlt && 'ch-zeile-gewaehlt'
        )}
        style={{ paddingLeft: '8px' }}
        onClick={(e) => {
          // Trassia (U3-klein): Ctrl-Klick = Zeile in die Auswahl, sonst Upstream.
          if (!chZeilenKlick(node, e)) return;
          onModelHeaderClick(modelId, node.id, node.hasChildren);
        }}
      >
        {/* Expand/collapse chevron */}
        {node.hasChildren ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-zinc-400 transition-transform shrink-0',
              node.isExpanded && 'rotate-90'
            )}
          />
        ) : (
          <div className="w-3.5" />
        )}

        <FileBox className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="flex-1 min-w-0 text-sm truncate ml-1.5 text-zinc-900 dark:text-zinc-100">
          {node.name}
        </span>

        {node.elementCount !== undefined && (
          // Trassia (U3-klein, TODO #29): klein und grau; die Zahl der Modellzeile
          // sind ALLE IFC-Entitaeten. Faellt weg, wenn die ZEILE schmal ist
          // (Container-Query in ch-dichte.css Regel 10), statt den Namen zu kuerzen.
          <span className="ch-zeilenzahl text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500 px-1 shrink-0">
            {/* Trassia: Schweizer Tausendertrennung wie Fusszeile und Koordinaten. */}
            {chZahlExakt(node.elementCount)}
          </span>
        )}
        <ModelRowTags modelId={modelId} modelName={node.name} />

        <button
          className="p-0.5"
          aria-label={t('hierarchy.node.repositionAriaLabel', { name: node.name })}
          title={t('hierarchy.node.repositionTooltip')}
          onClick={(event) => { event.stopPropagation(); openRepositionModels([modelId]); }}
        >
          <Move3D className="h-3.5 w-3.5" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onModelVisibilityToggle(modelId, e);
              }}
              aria-label={
                modelVisible
                  ? t('hierarchy.node.hideModelAriaLabel', { name: node.name })
                  : t('hierarchy.node.showModelAriaLabel', { name: node.name })
              }
              className={CH_SCHALTER}
            >
              {modelVisible ? (
                <Eye className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{modelVisible ? t('hierarchy.node.hideModel') : t('hierarchy.node.showModel')}</p>
          </TooltipContent>
        </Tooltip>

        {sourceBacked && onSyncSourceModel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSyncSourceModel(modelId, e);
                }}
                aria-label={t('hierarchy.node.syncModelAriaLabel', { name: node.name })}
                className={cn(
                  CH_SCHALTER,
                  sourceSyncing && 'opacity-100',
                )}
                disabled={sourceSyncing}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100',
                    sourceSyncing && 'animate-spin',
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {sourceSyncing ? t('hierarchy.node.syncing') : t('hierarchy.node.syncFromSource')}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {modelsCount > 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveModel(modelId, e);
                }}
                aria-label={t('hierarchy.node.removeModelAriaLabel', { name: node.name })}
                className={CH_SCHALTER}
              >
                <X className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t('hierarchy.node.removeModel')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
