/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { useViewerStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { measureLivePoint } from './readouts';

/** {@link measureLivePoint} over the store, shared by the Point tab and the HUD readouts. */
export function useMeasureLivePoint() {
  return useViewerStore(useShallow(measureLivePoint));
}
