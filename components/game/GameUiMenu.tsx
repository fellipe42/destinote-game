// components/game/GameUiMenu.tsx
'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { GameUiPrefs } from '@/lib/game/v2/gameUiPrefs';
import { normalizeGameUiPrefs } from '@/lib/game/v2/gameUiPrefs';
import { Menu, Palette, Image as ImageIcon, Globe2, RefreshCcw, Wrench } from 'lucide-react';

const SWATCHES = ['#0B1220', '#0B0B13', '#101928', '#1B0B25', '#061821', '#1F1026', '#0F172A', '#0A1020', '#0E1A14', '#1A1A1A'];

function BgPreview({ id }: { id: number }) {
  const urlJpg = `/images/bg-${id}.jpg`;
  const urlPng = `/images/bg-${id}.png`;
  return (
    <div
      className="h-16 w-full rounded-xl border border-white/10 bg-white/5 overflow-hidden"
      style={{
        backgroundImage: `url(${urlJpg}), url(${urlPng})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="h-full w-full bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.70))]" />
    </div>
  );
}

export default function GameUiMenu({
  prefs,
  onChange,
  onReset,
  onDevExport,
}: {
  prefs: GameUiPrefs;
  onChange: (patch: Partial<GameUiPrefs>) => void;
  onReset: () => void;
  onDevExport?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ids = useMemo(() => Array.from({ length: 29 }, (_, i) => i + 2), []); // 2..30
  const isDev = process.env.NODE_ENV !== 'production';

  const modeBtn = (active: boolean) =>
    active
      ? 'bg-white/20 text-white'
      : 'bg-white/10 text-white hover:bg-white/15';

  const next = normalizeGameUiPrefs(prefs);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="bg-white/10 text-white hover:bg-white/15 px-3"
          aria-label="Menu"
          title="Menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[min(820px,calc(100vw-1.5rem))] border-white/10 bg-black/80 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-2 ring-purple-500/30">
              <Palette className="h-4 w-4" />
            </span>
            Personalização (só no jogo)
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className={modeBtn(next.bgMode === 'destinote')}
              onClick={() => onChange({ bgMode: 'destinote' })}
            >
              <Globe2 className="mr-2 h-4 w-4" />
              Destinote
            </Button>
            <Button
              variant="secondary"
              className={modeBtn(next.bgMode === 'bgImage')}
              onClick={() => onChange({ bgMode: 'bgImage' })}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              BG
            </Button>
            <Button
              variant="secondary"
              className={modeBtn(next.bgMode === 'solid')}
              onClick={() => onChange({ bgMode: 'solid' })}
            >
              <Palette className="mr-2 h-4 w-4" />
              Cor
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15" onClick={onReset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Globo / modo idle</div>
                  <div className="text-xs text-white/60">Deixa a vibe mais cinematográfica (leve).</div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!next.globeIdle}
                    onChange={(e) => onChange({ globeIdle: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-sm font-semibold">Vinheta</div>
              <div className="mt-1 text-xs text-white/60">Sempre aplicada para manter legibilidade.</div>
              <div className="mt-3 h-9 rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.20),transparent_45%),linear-gradient(to_bottom,rgba(0,0,0,0.25),rgba(0,0,0,0.80))]" />
            </div>
          </div>
        </div>

        {next.bgMode === 'bgImage' && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-semibold">Backgrounds</div>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {ids.map((id) => {
                const active = next.bgImageId === id;
                return (
                  <button
                    key={id}
                    className={
                      'group rounded-2xl border p-2 text-left transition ' +
                      (active
                        ? 'border-purple-500/50 bg-white/10 ring-2 ring-purple-500/30'
                        : 'border-white/10 bg-black/20 hover:bg-white/10')
                    }
                    onClick={() => onChange({ bgImageId: id })}
                  >
                    <BgPreview id={id} />
                    <div className="mt-2 text-[11px] font-semibold text-white/80">BG {id}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-white/50">Se algum BG não aparecer, é porque a imagem não está no build atual.</div>
          </div>
        )}

        {next.bgMode === 'solid' && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-semibold">Cores sólidas</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SWATCHES.map((hex) => {
                const active = next.solid?.hex?.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    onClick={() => onChange({ solid: { hex } })}
                    className={
                      'h-9 w-9 rounded-xl border transition ' +
                      (active ? 'border-purple-500/60 ring-2 ring-purple-500/30' : 'border-white/15 hover:border-white/30')
                    }
                    style={{ background: hex }}
                    aria-label={`Cor ${hex}`}
                    title={hex}
                  />
                );
              })}

              <div className="ml-2 flex items-center gap-2">
                <input
                  value={next.solid?.hex ?? '#0B1220'}
                  onChange={(e) => onChange({ solid: { hex: e.target.value } })}
                  className="w-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-white/25"
                  placeholder="#0B1220"
                />
                <div
                  className="h-9 w-12 rounded-xl border border-white/10"
                  style={{ background: next.solid?.hex ?? '#0B1220' }}
                />
              </div>
            </div>
          </div>
        )}

        {isDev && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-white/70" />
                <div>
                  <div className="text-sm font-semibold">Dev tools</div>
                  <div className="text-xs text-white/60">Aparece só fora de production.</div>
                </div>
              </div>
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/15"
                onClick={() => {
                  onDevExport?.();
                  setOpen(false);
                }}
                disabled={!onDevExport}
              >
                Exportar JSON
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
