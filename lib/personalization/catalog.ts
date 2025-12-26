// lib/personalization/catalog.ts
import type { CatalogBackground, CatalogGlobe, CatalogTheme } from './types';

/**
 * THEMES
 * Add a new theme:
 *  1) add it here (id + label)
 *  2) add css variables in app/globals.css under html[data-dn-theme='YOUR_ID']
 */
export const THEMES: CatalogTheme[] = [
  {
    id: 'default',
    label: 'Padrão',
    description: 'Paleta original do Destinote.',
  },
  {
    id: 'dark',
    label: 'Dark (P&B)',
    description: 'Cards pretos, botões pretos, navbar branca.',
  },
  {
    id: 'holiday',
    label: 'Natalino',
    description: 'Vermelho, verde e dourado.',
  },

  {
    id: 'sky',
    label: 'Céu',
    description: 'Tons de azul e branco',
  },

];

/**
 * GLOBES
 * Add a new globe:
 *  1) put the image under /public/images
 *  2) add a new entry here
 */
export const GLOBES: CatalogGlobe[] = [
  { id: 'earth', label: 'Terra', src: '/images/globe-earth.png' },
  { id: 'mars', label: 'Marte', src: '/images/globe-mars.png' },
  { id: 'blackhole', label: 'Buraco negro', src: '/images/black-hole.png' },
  { id: 'music', label: 'Musical', src: '/images/music-globe.png' },



  // next globes (placeholders). When you add the files, set comingSoon false.
  { id: 'galaxy', label: 'Galáxia', src: '/images/globe-galaxy.png', comingSoon: true },
  { id: 'fireworks', label: 'Fogos', src: '/images/globe-fireworks.png', comingSoon: true },
];

/**
 * BACKGROUNDS
 * Keep this list scalable: today local files, tomorrow CDN.
 * Use ids that are stable; sources can move later.
 */
export const BACKGROUNDS: CatalogBackground[] = [
  { id: 'bg-1', label: 'Pôr do sol', src: '/images/bg-1-sunset.png', alt: 'Pôr do sol' },
  { id: 'bg-2', label: 'Nebulosa', src: '/images/bg-2.png' },
  { id: 'bg-3', label: 'Pirâmides', src: '/images/bg-3.png' },
  { id: 'bg-4', label: 'Lanternas voadoras', src: '/images/bg-4.png' },
  { id: 'bg-5', label: 'Espaço', src: '/images/bg-5.png' },
  { id: 'bg-6', label: 'Dunas', src: '/images/bg-6.png' },
  { id: 'bg-7', label: 'Vilarejo', src: '/images/bg-7.jpg' },
  { id: 'bg-8', label: 'Monte', src: '/images/bg-8.jpg' },
  { id: 'bg-9', label: 'Geleiras', src: '/images/bg-9.jpg' },
  { id: 'bg-10', label: 'Balão', src: '/images/bg-10.jpg' },
  { id: 'bg-11', label: 'Céu e gelo', src: '/images/bg-11.jpg' },
  { id: 'bg-12', label: 'Amanhecer gelado', src: '/images/bg-12.jpg' },
  { id: 'bg-13', label: 'Barquinho', src: '/images/bg-13.jpg' },
  { id: 'bg-14', label: 'Aurora no vale', src: '/images/bg-14.jpg' },
  { id: 'bg-15', label: 'Mar gelado', src: '/images/bg-15.jpg' },
  { id: 'bg-16', label: 'Galáxia', src: '/images/bg-16.jpg' },
  { id: 'bg-17', label: 'Vulcão', src: '/images/bg-17.jpg' },
  { id: 'bg-18', label: 'Montanha', src: '/images/bg-18.jpg' },
  { id: 'bg-19', label: 'Aurora e lanterna', src: '/images/bg-19.jpg' },
  { id: 'bg-20', label: 'Lua vermelha', src: '/images/bg-20.jpg' },
  { id: 'bg-21', label: 'Montes', src: '/images/bg-21.jpg' },
  { id: 'bg-22', label: 'Auroras', src: '/images/bg-22.jpg' },
  { id: 'bg-23', label: 'Montanhas', src: '/images/bg-23.jpg' },

];

export function getBackgroundById(id: string) {
  return BACKGROUNDS.find((b) => b.id === id);
}

export function getGlobeById(id: string) {
  return GLOBES.find((g) => g.id === id);
}

export function themeExists(id: string) {
  return THEMES.some((t) => t.id === id);
}
