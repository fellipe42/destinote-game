// app/u/[username]/page.tsx
import Image from 'next/image';
import { PrismaClient } from '@prisma/client';
import { DN_DEFAULT_AVATAR } from '@/lib/constants';

const prisma = new PrismaClient();

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { lists: true },
  });

  if (!user || !user.isPublic) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-white/80">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          Perfil indisponível.
        </div>
      </main>
    );
  }

  const publicLists = user.lists.filter((l) => l.isPublic);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5">
          <Image
            src={user.image ?? DN_DEFAULT_AVATAR}
            alt={user.name ?? 'Perfil'}
            fill
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="text-xl font-semibold leading-tight">{user.name ?? 'Perfil'}</div>
          {user.bio ? <div className="text-sm text-white/70">{user.bio}</div> : null}
          <div className="mt-1 text-[11px] text-white/40">Perfil público</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white/85">Listas públicas</div>
        <div className="mt-3 space-y-2">
          {publicLists.length === 0 ? (
            <div className="text-sm text-white/60">Nada publicado ainda.</div>
          ) : (
            publicLists.map((l) => (
              <div key={l.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium">{l.name}</div>
                <div className="text-xs text-white/50">Compartilhada</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
