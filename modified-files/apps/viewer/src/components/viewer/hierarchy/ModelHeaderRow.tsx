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

import { Move3D, ChevronRight, Eye, EyeOff, FileBox, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { openRepositionModels } from '@/lib/model-placement/commands';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import type { TreeNode } from './types';
import type { HierarchyNodeAriaProps } from './HierarchyNode';
import { ModelRowTags } from './ModelRowTags';
import { chZeilenKlick, useChZeileGewaehlt } from '@/lib/ch/zeilen-auswahl';
import { chZahlExakt } from '@/lib/ch/gesamt-statistik';
import { SourceSyncIcon, useModelSyncProgress } from '@/components/sources/SourceDownloadStatus';

export interface ModelHeaderRowProps extends HierarchyNodeAriaProps {
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
  ariaLevel = 1,
  ariaSetSize = 1,
  ariaPosInSet = 1,
  tabIndex = -1,
  rowRef,
  onRowFocus,
}: ModelHeaderRowProps) {
  const { t } = useTranslation();
  const chGewaehlt = useChZeileGewaehlt(node.id);
  const modelId = node.modelIds[0];
  const syncState = useModelSyncProgress(modelId);

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
      {/* The parent role=tree handles Enter/Space for this row via useTreeKeyboard. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        ref={rowRef}
        role="treeitem"
        aria-level={ariaLevel}
        aria-setsize={ariaSetSize}
        aria-posinset={ariaPosInSet}
        aria-expanded={node.hasChildren ? node.isExpanded : undefined}
        data-node-id={node.id}
        tabIndex={tabIndex}
        onFocus={onRowFocus}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 border-l-4 transition-all group ch-zeile',
          'hover:bg-zinc-50 dark:hover:bg-zinc-900',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2',
          'border-transparent',
          !modelVisible && 'opacity-50',
          node.hasChildren && 'cursor-pointer',
          chGewaehlt && 'ch-zeile-gewaehlt'
        )}
        style={{ paddingLeft: '8px' }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button,[data-model-row-tags]')) return;
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
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="flex-1 min-w-0 text-sm truncate ml-1.5 text-zinc-900 dark:text-zinc-100">
              {node.name}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs break-all">{node.name}</TooltipContent>
        </Tooltip>

        {node.elementCount !== undefined && (
          <span className="ch-zeilenzahl text-2xs tabular-nums text-zinc-400 dark:text-zinc-500 px-1 shrink-0">
            {chZahlExakt(node.elementCount)}
          </span>
        )}
        <ModelRowTags modelId={modelId} modelName={node.name} />

        <button
          // 14px icon, `p-[5px]` a side: 14 + 2*5 = 24, the WCAG 2.2 2.5.8
          // minimum with no headroom to spare — these buttons sit `gap-1`
          // (4px) apart, so a bigger hit area (via padding or slop) would
          // overlap the next one (#5826 review round).
          className="p-[5px] relative focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="inline-flex h-6 w-6 items-center justify-center rounded p-0.5 opacity-70 hover:bg-muted hover:opacity-100 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100"
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
                  'inline-flex h-6 w-6 items-center justify-center rounded p-0.5 opacity-70 hover:bg-muted hover:opacity-100 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100',
                  sourceSyncing && 'opacity-100',
                )}
                disabled={sourceSyncing}
              >
                <SourceSyncIcon
                  name={node.name}
                  syncing={sourceSyncing}
                  state={syncState}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
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
                className="inline-flex h-6 w-6 items-center justify-center rounded p-0.5 opacity-70 hover:bg-muted hover:opacity-100 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100"
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
