// components/profile/ThemeSettingsPanel.tsx
'use client';

import { THEMES } from '@/lib/personalization/catalog';
import { usePersonalization } from '@/contexts/PersonalizationContext';

export default function ThemeSettingsPanel() {
  const { state, setTheme } = usePersonalization();

  return (
    <div className="space-y-4">
      <p className="text-white/70 text-sm">
        Muda a paleta geral do site. Estrutura pronta pra você adicionar mais temas depois.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const active = state.theme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={[
                'rounded-2xl border p-4 text-left transition-all',
                'backdrop-blur-sm',
                active ? 'border-white/30 bg-white/10' : 'border-white/10 bg-black/20 hover:bg-black/25',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-semibold">{t.label}</p>
                  {t.description ? (
                    <p className="text-white/55 text-xs mt-1 leading-snug">{t.description}</p>
                  ) : null}
                </div>
                {active ? (
                  <span className="text-xs text-white/90 font-semibold">Ativo</span>
                ) : (
                  <span className="text-xs text-white/40">Selecionar</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-white/70 text-sm">
          <span className="text-white/90 font-semibold">Para adicionar um tema novo:</span>{' '}
          edite <code className="text-white/80">lib/personalization/catalog.ts</code> (lista{' '}
          <code className="text-white/80">THEMES</code>) e depois crie o bloco de variáveis em{' '}
          <code className="text-white/80">app/globals.css</code>.
        </p>
      </div>
    </div>
  );
}
