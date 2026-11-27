/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Selection position in the federation anchor's projected CRS, when valid.
 * The disclosure also exposes the model and render frames and the georeferencing editor.
 */

import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from '@/i18n';
import { useAnchorGeoreference } from '@/lib/geo/useAnchorGeoreference';
import { ChWorldRows, ChWorldSummary } from './ChWorldPosition';
import { CoordRow, CoordVal } from './CoordinateDisplay';
import { GeoreferencingPanel } from './GeoreferencingPanel';
import { InspectorRow } from './inspector-ui';
import { usePersistentDisclosure } from './usePersistentDisclosure';
import { useCopyValue } from './useCopyValue';

interface Vec3 { x: number; y: number; z: number }

export interface EntityCoordinates {
  worldZup: { center: Vec3 };
  local: { center: Vec3; min: Vec3; max: Vec3 };
}

export function EntityPositionSection({ coordinates, georefPanel }: {
  coordinates: EntityCoordinates | null;
  georefPanel: ComponentProps<typeof GeoreferencingPanel>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = usePersistentDisclosure('coordinates', false);
  const { copiedKey, copy } = useCopyValue();
  const geographicAnchor = useAnchorGeoreference()?.geographic === true;
  const world = coordinates?.worldZup.center;
  const size = coordinates ? {
    x: (coordinates.local.max.x - coordinates.local.min.x).toFixed(2),
    y: (coordinates.local.max.y - coordinates.local.min.y).toFixed(2),
    z: (coordinates.local.max.z - coordinates.local.min.z).toFixed(2),
  } : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="inspector-kv group/disclosure min-h-7 w-full gap-x-2 pl-3 pr-1 text-left text-xs hover:bg-muted/50">
        <span className="min-w-0 truncate text-muted-foreground">{t('properties.panel.positionLabel')}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
          {world ? (
            geographicAnchor ? (
              <span className="min-w-0 truncate font-mono tabular-nums text-foreground">
                <CoordVal axis="X" value={world.x} />{' '}
                <CoordVal axis="Y" value={world.y} />{' '}
                <CoordVal axis="Z" value={world.z} /> · local
              </span>
            ) : <ChWorldSummary coordinates={coordinates} />
          ) : (
            <span className="min-w-0 truncate text-muted-foreground">{t('properties.panel.worldCoordinatesDetails')}</span>
          )}
        </span>
        <span className="flex h-6 w-6 items-center justify-center">
          <ChevronDown className="inspector-chevron size-3.5 text-muted-foreground" aria-hidden="true" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {coordinates && (
          <div className="space-y-0.5 py-1 pl-3 pr-1">
            {/* An angular anchor cannot label a length as projected E/N/H. */}
            {geographicAnchor ? (
              <CoordRow
                label={t('properties.panel.worldCoordinates')}
                values={[
                  { axis: 'X', value: coordinates.worldZup.center.x },
                  { axis: 'Y', value: coordinates.worldZup.center.y },
                  { axis: 'Z', value: coordinates.worldZup.center.z },
                ]}
                primary
              />
            ) : (
              <ChWorldRows
                coordinates={coordinates}
                coordCopied={copiedKey}
                onCopy={(label, text) => copy(text, label)}
              />
            )}
            <CoordRow
              label={t('properties.panel.localCoordinates')}
              values={[
                { axis: 'X', value: coordinates.local.center.x },
                { axis: 'Y', value: coordinates.local.center.y },
                { axis: 'Z', value: coordinates.local.center.z },
              ]}
            />
          </div>
        )}
        {size && <InspectorRow label={t('properties.panel.sizeLabel')} value={t('properties.panel.sizeDisplay', size)} mono copy={false} />}
        <GeoreferencingPanel {...georefPanel} />
      </CollapsibleContent>
    </Collapsible>
  );
}
