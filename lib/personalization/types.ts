// lib/personalization/types.ts
export type ThemeId = 'default' | 'dark' | 'holiday' | (string & {});
export type GlobeId =
  | 'earth'
  | 'mars'
  | 'blackhole'
  | 'spiral-objects'
  | 'galaxy'
  | 'fireworks'
  | (string & {});

export type BackgroundId = string;

export type GlobeVisibilitySegments = boolean[]; // length = SEGMENT_COUNT

export type GlobeSettings = {
  enabled: boolean;
  globeId: GlobeId;
  // 0..1
  brightness: number;
  // 0.6..1.3
  scale: number;
  // seconds for full rotation
  rotationSeconds: number;
  // segments painted as "visible"
  visibilitySegments: GlobeVisibilitySegments;
};

export type BackgroundSettings = {
  selectedIds: BackgroundId[];
  // weight percent (0..100) for selected backgrounds
  weights: Record<BackgroundId, number>;
  // ids manually adjusted (locked). others auto-balance
  manualIds: BackgroundId[];
};

export type PersonalizationState = {
  version: 1;
  theme: ThemeId;
  globe: GlobeSettings;
  background: BackgroundSettings;
};

export type CatalogTheme = {
  id: ThemeId;
  label: string;
  description?: string;
};

export type CatalogGlobe = {
  id: GlobeId;
  label: string;
  src: string;
  comingSoon?: boolean;
};

export type CatalogBackground = {
  id: BackgroundId;
  label: string;
  src: string;
  alt?: string;
  comingSoon?: boolean;
};
