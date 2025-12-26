// components/profile/PersonalizationCards.tsx
'use client';

import { useMemo, useState } from 'react';
import { LayoutGroup } from 'framer-motion';
import { Palette, Globe2, Image as ImageIcon } from 'lucide-react';

import ExpandableSettingsCard from './ExpandableSettingsCard';
import ThemeSettingsPanel from './ThemeSettingsPanel';
import GlobeSettingsPanel from './GlobeSettingsPanel';
import BackgroundSettingsPanel from './BackgroundSettingsPanel';

type CardId = 'theme' | 'globe' | 'background';

export default function PersonalizationCards() {
  const [open, setOpen] = useState<CardId | null>(null);

  const items = useMemo(
    () => [
      {
        id: 'theme' as const,
        title: 'Tema',
        subtitle: 'Cores do site inteiro',
        Icon: Palette,
        content: <ThemeSettingsPanel />,
      },
      {
        id: 'globe' as const,
        title: 'Globo',
        subtitle: 'Escolha + onde aparece',
        Icon: Globe2,
        content: <GlobeSettingsPanel />,
      },
      {
        id: 'background' as const,
        title: 'Background',
        subtitle: 'Ordem + tempo de cada fundo',
        Icon: ImageIcon,
        content: <BackgroundSettingsPanel />,
      },
    ],
    []
  );

  return (
    <section aria-label="Personalização" className="mb-6">
      <LayoutGroup>
        <div className="grid md:grid-cols-3 gap-4">
          {items.map(({ id, title, subtitle, Icon, content }) => (
            <ExpandableSettingsCard
              key={id}
              id={id}
              title={title}
              subtitle={subtitle}
              Icon={Icon}
              isOpen={open === id}
              onOpen={() => setOpen(id)}
              onClose={() => setOpen(null)}
            >
              {content}
            </ExpandableSettingsCard>
          ))}
        </div>
      </LayoutGroup>
    </section>
  );
}
