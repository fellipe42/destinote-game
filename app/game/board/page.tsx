// app/game/board/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import BoardClient from '@/components/game/BoardClient';

export default function BoardPage() {
  const params = useSearchParams();
  const room = params.get('room');

  if (!room) {
    return (
      <div className="min-h-[100svh] w-full bg-black text-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="text-2xl font-bold">Board</div>
          <div className="mt-2 text-white/70">
            Faltou o parâmetro <b>?room=...</b>. Abra o jogo em <b>/game</b> e clique em “Board”.
          </div>
        </div>
      </div>
    );
  }

  return <BoardClient roomId={room} />;
}
