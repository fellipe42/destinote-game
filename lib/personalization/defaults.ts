// lib/personalization/defaults.ts
import type { PersonalizationState } from './types';
import { SEGMENT_COUNT, makeSegments } from './segments';

export const PERSONALIZATION_STORAGE_KEY = 'destinote:personalization:v1';

export function getDefaultPersonalizationState(): PersonalizationState {
  return {
    version: 1,
    theme: 'default',
    globe: {
      enabled: true,
      globeId: 'earth',
      // defaults requested: a bit dimmer, smaller, slower
      brightness: 0.75,
      scale: 0.9,
      rotationSeconds: 110,
      visibilitySegments: makeSegments(SEGMENT_COUNT, (i) => {
        // default: visible from ~25% to ~95% (matches previous behavior)
        const p = i / SEGMENT_COUNT;
        return p >= 0.25 && p <= 0.95;
      }),
    },
    background: {
      selectedIds: ['bg-1', 'bg-2', 'bg-3', 'bg-4', 'bg-5', 'bg-6'],
      weights: {
        'bg-1': 16.67,
        'bg-2': 16.67,
        'bg-3': 16.67,
        'bg-4': 16.67,
        'bg-5': 16.66,
        'bg-6': 16.66,
      },
      manualIds: [],
    },
  };
}
