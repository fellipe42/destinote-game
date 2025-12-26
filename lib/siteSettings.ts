// lib/siteSettings.ts
// Motivo: Prisma + SQLite não aceita campo Json. Guardamos JSON como string e parseamos aqui.
// Também unificamos leitura/escrita para servir /api/site-settings (personalizationDefaults)
// e /api/admin/site-settings (data: settings gerais).

import prisma from '@/lib/prisma';
import { getDefaultPersonalizationState } from '@/lib/personalization/defaults';
import type { PersonalizationState } from '@/lib/personalization/types';

export type SiteUiSettingsData = {
  themeKey: string;
  cardColorMode: 'category' | 'override';
  cardColorOverride: string | null;
  chromeThemeColor?: string;
  globe?: {
    enabled: boolean;
    initialX?: number;
    initialY?: number;
    scale?: number;
    opacity?: number;
  };
  profile?: {
    showGlobe?: boolean;
    backgroundSet?: 'profile' | 'default';
  };
};

export type SiteSettingsData = {
  personalizationDefaults: PersonalizationState;
  ui: SiteUiSettingsData;
};

function defaultUiSettings(): SiteUiSettingsData {
  return {
    themeKey: 'default',
    cardColorMode: 'category',
    cardColorOverride: null,
    chromeThemeColor: '#0b0b12',
    globe: { enabled: true },
    profile: { showGlobe: false, backgroundSet: 'profile' },
  };
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  const personalizationDefaults = safeJsonParse<PersonalizationState>(
    row?.personalizationDefaults,
    getDefaultPersonalizationState()
  );

  const ui = safeJsonParse<SiteUiSettingsData>(row?.data ?? null, defaultUiSettings());

  return { personalizationDefaults, ui };
}

// Atualiza somente o bloco UI (admin). Defaults globais de personalização são tratados separadamente (seed/admin futuro).
export async function updateSiteUiSettings(ui: SiteUiSettingsData) {
  const saved = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { data: JSON.stringify(ui) },
    create: {
      id: 1,
      personalizationDefaults: JSON.stringify(getDefaultPersonalizationState()),
      data: JSON.stringify(ui),
    },
  });

  return {
    personalizationDefaults: safeJsonParse(saved.personalizationDefaults, getDefaultPersonalizationState()),
    ui,
  };
}
