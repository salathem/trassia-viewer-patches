/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import type { TranslationValue } from '../types';
export const alignmentSectionEn = {
  'alignmentSection.mode': 'Alignment',
  'alignmentSection.model': 'Alignment model',
  'alignmentSection.axis': 'Choose IfcAlignment',
  'alignmentSection.axisFallback': 'IfcAlignment #{id}',
  'alignmentSection.noAxes': 'No IfcAlignment',
  'alignmentSection.loading': 'Resolving alignment…',
  'alignmentSection.distance': 'Horizontal distance from start',
  'alignmentSection.approximate': 'Approximate curve · distance from start',
  'alignmentSection.help': 'Distance is geometric horizontal metres from the physical start, not authored chainage. The plane follows the evaluated tangent. Drag the plane handle or use Shift + mouse wheel in the 3D view to move along the alignment. The plane stays perpendicular to its tangent. Ctrl + mouse wheel or trackpad pinch zooms the view.',
  'alignmentSection.error': 'Cannot section this alignment: {detail}',
} as const satisfies Record<string, TranslationValue>;
