// components/profile/ProfilePage.tsx
'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { DN_DEFAULT_AVATAR } from '@/lib/constants';

type UserListDTO = {
  id: string;
  name: string;
  isPublic: boolean;
};

export default function ProfilePage({
  lists,
  isAdmin,
}: {
  lists: UserListDTO[];
  isAdmin: boolean;
}) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'Perfil';

  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  const { mode, setMode, cardColorMode, cardColorOverride, setCardOverride } = usePersonalization();

  const myMainList = useMemo(() => lists[0], [lists]);

  const toggleVisibility = async (listId: string, next: boolean) => {
    await fetch(`/api/lists/${listId}/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: next }),
    });
    // aqui dá pra revalidar via router.refresh() se seu page usar server fetch
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold">{name}</div>
          <div className="mt-1 text-[11px] text-white/45">Perfil</div>
        </div>

        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5">
          <Image
            src={(session?.user as any)?.image ?? DN_DEFAULT_AVATAR}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* 1) Personalização no topo */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white/85">Personalização</div>
            <div className="text-xs text-white/55">
              Aplica em todo o site (exceto Jogo e Minha Lista).
            </div>
          </div>

          <button
            className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
            onClick={() => setMode(mode === 'site' ? 'custom' : 'site')}
            title="Alternar entre padrão do site e custom"
          >
            {mode === 'site' ? 'Usando padrão do site' : 'Customizado'}
          </button>
        </div>

        {/* Cards de personalização (placeholder – pluga seus 3 cards existentes aqui) */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Tema</div>
            <div className="mt-1 text-xs text-white/60">Seu seletor atual entra aqui.</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Cards</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
                onClick={() => setCardOverride('category', null)}
              >
                Por categoria
              </button>
              <button
                className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
                onClick={() => setCardOverride('override', '#0f0f14')}
              >
                Dark (preto)
              </button>
              <button
                className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
                onClick={() => setCardOverride('override', '#b60f1a')}
              >
                Natal (vermelho)
              </button>
              <div className="text-[11px] text-white/45">
                Atual: {cardColorMode}
                {cardColorOverride ? ` • ${cardColorOverride}` : ''}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Globo</div>
            <div className="mt-1 text-xs text-white/60">
              (Admin terá controles avançados aqui — nesta Sprint fica o “gancho”.)
            </div>
          </div>
        </div>

        {/* Admin block */}
        {isAdmin ? (
          <div className="mt-4 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4">
            <div className="text-sm font-semibold text-white/90">Configuração padrão do site (Admin)</div>
            <div className="mt-1 text-xs text-white/60">
              Salva defaults globais (não sobrescreve quem já customizou).
            </div>

            <button
              className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
              onClick={async () => {
                // exemplo mínimo: salva o override atual como default do site
                const payload = {
                  themeKey: 'default',
                  cardColorMode,
                  cardColorOverride,
                  chromeThemeColor: '#0b0b12',
                  globe: { enabled: true, initialX: 0, initialY: 0, scale: 1, opacity: 1 },
                  profile: { showGlobe: false, backgroundSet: 'profile' },
                };
                await fetch('/api/admin/site-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
              }}
            >
              Salvar como padrão do site
            </button>
          </div>
        ) : null}
      </section>

      {/* 2) Bloco grande: Minha lista / Minhas listas / Listas compartilhadas */}
      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/85">Minha lista</div>
            <button
              className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => setOpenA((v) => !v)}
            >
              {openA ? 'Fechar' : 'Abrir'}
            </button>
          </div>

          {myMainList ? (
            <div className="mt-3 text-xs text-white/70">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{myMainList.name}</div>
                  <div className="text-[11px] text-white/50">
                    Visibilidade: {myMainList.isPublic ? 'Pública' : 'Privada'}
                  </div>
                </div>

                <button
                  className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
                  onClick={() => toggleVisibility(myMainList.id, !myMainList.isPublic)}
                >
                  {myMainList.isPublic ? 'Privar' : 'Publicar'}
                </button>
              </div>

              {openA ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-white/65">
                  Expanded: detalhes da lista, stats, botões etc (Sprint 3.4 pode turbinar).
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 text-sm text-white/60">Você ainda não tem uma lista.</div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/85">Minhas listas • Listas compartilhadas</div>
            <button
              className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => setOpenB((v) => !v)}
            >
              {openB ? 'Fechar' : 'Abrir'}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {lists.slice(1).map((l) => (
              <div key={l.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{l.name}</div>
                    <div className="text-[11px] text-white/50">
                      {l.isPublic ? 'Compartilhada' : 'Privada'}
                    </div>
                  </div>

                  <button
                    className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs hover:bg-white/10"
                    onClick={() => toggleVisibility(l.id, !l.isPublic)}
                  >
                    {l.isPublic ? 'Privar' : 'Publicar'}
                  </button>
                </div>
              </div>
            ))}

            {openB ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                Expanded: “listas compartilhadas por outros” entra aqui.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 3) Informações do usuário */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white/85">Informações</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-white/50">Email</div>
            <div className="truncate text-sm">{session?.user?.email ?? '—'}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-white/50">Itens na lista</div>
            <div className="text-sm">—</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-white/50">Concluídos</div>
            <div className="text-sm">—</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[11px] text-white/50">Fotos</div>
            <div className="text-sm text-white/70">Mini álbum (placeholder)</div>
          </div>
        </div>
      </section>

      {/* 4) Planos */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white/85">Planos</div>
        <div className="mt-2 text-xs text-white/60">
          Preparação para Stripe: estruturar tiers + checkout (Sprint 3.4/3.5).
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Public</div>
            <div className="mt-1 text-xs text-white/60">Explorar a lista</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Plus</div>
            <div className="mt-1 text-xs text-white/60">Listas + recursos extra</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold">Premium</div>
            <div className="mt-1 text-xs text-white/60">Coleções premium + export</div>
          </div>
        </div>
      </section>
    </main>
  );
}
