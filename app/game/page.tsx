// app/game/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { makeRoomId } from '@/lib/game/v2/utils';
import GameV1Root from '@/components/gamev1/GameV1Root';

export default function GamePage() {
  const params = useSearchParams();
  const router = useRouter();

  const room = params.get('room');
  const [roomId, setRoomId] = useState<string | null>(room);

  useEffect(() => {
    if (room) {
      setRoomId(room);
      return;
    }
    const id = makeRoomId();
    setRoomId(id);
    router.replace(`/game?room=${encodeURIComponent(id)}`);
  }, [room, router]);

  if (!roomId) return null;

  return <GameV1Root roomId={roomId} />;
}
