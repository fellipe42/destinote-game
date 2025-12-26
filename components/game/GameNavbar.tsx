// components/game/GameNavbar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HelpDialog from './HelpDialog';
import ThemeBankDialog from './ThemeBankDialog';
import type { GameUiPrefs } from '@/lib/game/v2/gameUiPrefs';
import GameUiMenu from './GameUiMenu';
import { ArrowLeft, RotateCcw, Tv2 } from 'lucide-react';

export default function GameNavbar({
  roomId,
  onHardReset,
  prefs,
  onUiChange,
  onUiReset,
  onDevExport,
  showThemes,
  onPickTheme,
  onThemeBankChanged,
}: {
  roomId: string;
  onHardReset: () => void;
  prefs: GameUiPrefs;
  onUiChange: (patch: Partial<GameUiPrefs>) => void;
  onUiReset: () => void;
  onDevExport?: () => void;
  showThemes?: boolean;
  onPickTheme?: (phase: 'p1' | 'p2', theme: string) => void;
  onThemeBankChanged?: () => void;
}) {
  const canShowThemes = !!showThemes;

  return (
    <div className="fixed left-0 right-0 top-0 z-[70]">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-3">
        <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
          <Link href="/" title="Voltar ao site">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/15" title="Abrir telão/board">
          <Link href={`/game/board?room=${encodeURIComponent(roomId)}`}>
            <Tv2 className="mr-2 h-4 w-4" />
            Board
          </Link>
        </Button>

        <HelpDialog />

        {canShowThemes ? <ThemeBankDialog onPick={onPickTheme} onChanged={onThemeBankChanged} /> : null}

        <div className="flex-1" />

        <Button onClick={onHardReset} variant="secondary" className="bg-white/10 text-white hover:bg-white/15" title="Reset (hard)">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>

        <GameUiMenu prefs={prefs} onChange={onUiChange} onReset={onUiReset} onDevExport={onDevExport} />
      </div>
    </div>
  );
}

