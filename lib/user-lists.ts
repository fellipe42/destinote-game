// lib/user-lists.ts
// Sprint 3.5: "Minhas Listas" — shared client-side types + defaults.
// Keep this file dependency-free.

export type ExportStylePreset = 'neon' | 'minimal' | 'morning' | 'newyear';
export type ExportTarget = 'story' | 'square' | 'paper';
export type ExportLayout = 'cards' | 'squares' | 'list';
export type ExportDensity = 'comfortable' | 'compact' | 'ultra';

// Reset rules (timer de limpeza / reset de checks)
export type ResetRule =
  | { kind: 'none' }
  | { kind: 'daily'; atHour?: number }
  | { kind: 'weekly'; weekday: number; atHour?: number }
  | { kind: 'monthly'; day: number; atHour?: number }
  | { kind: 'yearly'; month: number; day: number; atHour?: number };

export type ExportAppearance = {
  preset: ExportStylePreset;
  bgMode: 'image' | 'solid';
  backgroundId: string | null;
  backgroundColor: string | null;
  transparent: boolean;

  showGlobe: boolean;
  globeId: string | null;
  globeRotation: number; // degrees

  // visual weight
  cardOpacity: number; // 0..1
  cardBlur: number; // px
  cardRadius: number; // px
};

export type ExportSettings = {
  target: ExportTarget;
  layout: ExportLayout;
  density: ExportDensity;
  maxItems: number;
  itemThickness: number; // 1..4 (visual density)
  showChecks: boolean;
  includeDone: boolean;
};

export type UserListSummary = {
  id: string;
  title: string;
  templateId?: string | null;
  itemCount: number;
  updatedAt: string;
};

export type UserListItem = {
  id: string;
  text: string;
  done: boolean;
  order: number;
  resetRule: ResetRule | null;
};

export type UserListData = {
  list: {
    id: string;
    title: string;
    templateId?: string | null;
    appearance: ExportAppearance;
    exportSettings: ExportSettings;
  };
  items: UserListItem[];
};

export function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export const DEFAULT_EXPORT_APPEARANCE: ExportAppearance = {
  preset: 'neon',
  bgMode: 'image',
  backgroundId: 'bg-3',
  backgroundColor: '#0b0b12',
  transparent: false,
  showGlobe: true,
  globeId: 'earth',
  globeRotation: 25,
  cardOpacity: 0.75,
  cardBlur: 10,
  cardRadius: 18,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  target: 'story',
  layout: 'cards',
  density: 'comfortable',
  maxItems: 12,
  itemThickness: 2,
  showChecks: true,
  includeDone: true,
};

export type ListTemplate = {
  id: string;
  label: string;
  description: string;
  previewSrc?: string;
  defaultTitle: string;
  preset: ExportStylePreset;
  items: Array<{ text: string; resetRule?: ResetRule }>;
};

export const LIST_TEMPLATES: ListTemplate[] = [
  {
    id: 'weekly',
    label: 'Semanal',
    description: 'Tarefas domésticas que resetam toda semana.',
    previewSrc: '/images/list-templates/weekly.png',
    defaultTitle: 'Tarefas domésticas',
    preset: 'neon',
    items: [
      { text: 'Tirar o lixo', resetRule: { kind: 'weekly', weekday: 1 } },
      { text: 'Lavar roupa', resetRule: { kind: 'weekly', weekday: 6 } },
      { text: 'Lavar louça', resetRule: { kind: 'weekly', weekday: 0 } },
      { text: 'Organizar a casa', resetRule: { kind: 'weekly', weekday: 6 } },
      { text: 'Passar pano no chão', resetRule: { kind: 'weekly', weekday: 6 } },
      { text: 'Lavar o banheiro', resetRule: { kind: 'weekly', weekday: 0 } },
    ],
  },
  {
    id: 'daily',
    label: 'Diária',
    description: 'Hábitos diários com reset automático.',
    previewSrc: '/images/list-templates/daily.png',
    defaultTitle: 'Bons hábitos',
    preset: 'neon',
    items: [
      { text: 'Beber água (2L+)', resetRule: { kind: 'daily' } },
      { text: 'Ler (pelo menos 2 páginas)', resetRule: { kind: 'daily' } },
      { text: 'Ir à academia', resetRule: { kind: 'daily' } },
      { text: 'Escrever gratidão', resetRule: { kind: 'daily' } },
      { text: 'Meditar', resetRule: { kind: 'daily' } },
      { text: 'Soneca tática', resetRule: { kind: 'daily' } },
    ],
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    description: 'Sério, limpo e print-friendly.',
    previewSrc: '/images/list-templates/minimal.png',
    defaultTitle: 'Obrigações',
    preset: 'minimal',
    items: [
      { text: 'Pagar conta de luz e água', resetRule: { kind: 'monthly', day: 5 } },
      { text: 'Fazer compras domésticas', resetRule: { kind: 'monthly', day: 1 } },
      { text: 'Atualizar planilha de gastos', resetRule: { kind: 'monthly', day: 1 } },
      { text: 'Visitar pai e mãe', resetRule: { kind: 'monthly', day: 15 } },
      { text: 'Me inscrever numa corrida', resetRule: { kind: 'monthly', day: 10 } },
    ],
  },
  {
    id: 'morning',
    label: 'Manhã',
    description: 'Rotina matinal com vibe de nascer do sol.',
    previewSrc: '/images/list-templates/morning.png',
    defaultTitle: 'Milagre da Manhã',
    preset: 'morning',
    items: [
      { text: 'Acordar cedo', resetRule: { kind: 'daily' } },
      { text: 'Tomar suplementos', resetRule: { kind: 'daily' } },
      { text: 'Se alongar', resetRule: { kind: 'daily' } },
      { text: 'Se expor à luz do Sol', resetRule: { kind: 'daily' } },
      { text: 'Café da manhã saudável', resetRule: { kind: 'daily' } },
      { text: 'Começar pelo mais difícil', resetRule: { kind: 'daily' } },
    ],
  },
];
