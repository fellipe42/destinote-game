// app/perfil/page.tsx
'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Mail,
  Shield,
  ListChecks,
  LogOut,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import StaticBackground from '@/components/my-list/StaticBackground';
import Navbar from '@/components/Navbar';
import PersonalizationCards from '@/components/profile/PersonalizationCards';

type ListCountResponse = {
  authenticated: boolean;
  count: number;
  limit: number | null;
  accessLevel: string;
};

const PLAN_NAMES: Record<string, string> = {
  public: 'Público (sem lista)',
  user: 'Usuário Básico',
  plus: 'Plus',
  premium: 'Premium',
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  public: 'Você precisa fazer login para criar uma lista',
  user: 'Até 10 objetivos na sua lista',
  plus: 'Até 100 objetivos na sua lista',
  premium: 'Objetivos ilimitados na sua lista',
};

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoggedIn = !!session?.user?.email;

  const [listInfo, setListInfo] = useState<ListCountResponse>({
    authenticated: false,
    count: 0,
    limit: 0,
    accessLevel: 'public',
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (status === 'loading') return;
      if (!isLoggedIn) {
        router.push('/entrar');
        return;
      }

      try {
        const res = await fetch('/api/user/list-count');
        const data = (await res.json()) as ListCountResponse;
        setListInfo(data);
      } catch {
        setListInfo({
          authenticated: true,
          count: 0,
          limit: 10,
          accessLevel: 'user',
        });

      } finally {
        setLoaded(true);
      }
    };
    run();
  }, [status, isLoggedIn, router]);

  if (status === 'loading' || !loaded) {
    return (
      <>
        <StaticBackground changeInterval={15000} showGlobe={false} />
        <Navbar />
        <div className="min-h-screen pt-24 px-4 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-xl">Carregando seu perfil...</div>
          </div>
        </div>
      </>
    );
  }

  if (!isLoggedIn) {
    return null; // Já vai redirecionar
  }

  const planName = PLAN_NAMES[listInfo.accessLevel] || 'Desconhecido';
  const planDesc = PLAN_DESCRIPTIONS[listInfo.accessLevel] || '';
  const hasList = listInfo.count > 0;
  const listFull = listInfo.limit !== null && listInfo.limit > 0 && listInfo.count >= listInfo.limit;
  const canUpgrade = listInfo.accessLevel !== 'premium';

  return (
    <>
      <StaticBackground changeInterval={15000} showGlobe={false} />
      <Navbar />

      <main className="relative min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 truncate">
                {session?.user?.name ?? 'Perfil'}
              </h1>
              <p className="text-white/50 text-xs tracking-wide">Perfil</p>
            </div>

            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-black/20 shadow-lg shrink-0">
              <Image
                src="/images/fellipe.jpg"
                alt="Foto do perfil"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          </div>

          {/* Personalização */}
          <PersonalizationCards />

          {/* Seção: Informações do Usuário */}
          <section className="mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <User size={24} />
                Informações do usuário
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-white/60" />
                  <div>
                    <p className="text-xs text-white/50 uppercase">Email</p>
                    <p className="text-white font-medium">{session?.user?.email}</p>
                  </div>
                </div>

                {session?.user?.name && (
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-white/60" />
                    <div>
                      <p className="text-xs text-white/50 uppercase">Nome</p>
                      <p className="text-white font-medium">{session.user.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Seção: Plano e Limites */}
          <section className="mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={24} />
                Plano e limites
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/50 uppercase mb-1">Plano atual</p>
                  <p className="text-white font-bold text-xl">{planName}</p>
                  <p className="text-white/60 text-sm">{planDesc}</p>
                </div>

                <div>
                  <p className="text-xs text-white/50 uppercase mb-1">
                    Objetivos na lista
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-white font-bold text-3xl">{listInfo.count}</p>
                    {listInfo.limit !== null && (
                      <p className="text-white/60 text-lg">/ {listInfo.limit}</p>
                    )}
                    {listInfo.limit === null && (
                      <p className="text-white/60 text-lg">/ ilimitado</p>
                    )}
                  </div>

                  {/* Barra de progresso */}
                  {listInfo.limit !== null && (
                    <div className="mt-3">
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${listFull ? 'bg-red-500' : 'bg-purple-500'
                            }`}
                          style={{
                            width: `${Math.min(
                              (listInfo.count / listInfo.limit) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Aviso se lista cheia */}
                {listFull && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">
                        Limite atingido!
                      </p>
                      <p className="text-red-300/80 text-sm mb-3">
                        Você atingiu o limite de objetivos do seu plano. Faça upgrade
                        para adicionar mais.
                      </p>
                      {canUpgrade && (
                        <Link
                          href="/perfil/planos"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all hover:scale-105"
                        >
                          Ver planos
                          <ArrowRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA upgrade se não estiver no limite mas pode fazer upgrade */}
                {!listFull && canUpgrade && (
                  <Link
                    href="/perfil/planos"
                    className="block w-full rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 p-4 text-center transition-all"
                  >
                    <p className="text-purple-300 font-semibold mb-1">
                      Quer adicionar mais objetivos?
                    </p>
                    <p className="text-purple-400/80 text-sm mb-3">
                      Faça upgrade e desbloqueie mais recursos
                    </p>
                    <span className="inline-flex items-center gap-2 text-purple-300 font-semibold">
                      Ver planos disponíveis
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Seção: Minha Lista */}
          <section className="mb-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <ListChecks size={24} />
                Minha lista
              </h2>

              <div className="space-y-3">
                {hasList ? (
                  <>
                    <p className="text-white/70">
                      Você tem {listInfo.count} objetivo{listInfo.count !== 1 ? 's' : ''}{' '}
                      na sua lista
                    </p>
                    <Link
                      href="/my-list"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all hover:scale-105"
                    >
                      <ListChecks size={18} />
                      Ver minha lista
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-white/70 mb-3">
                      Você ainda não tem objetivos na sua lista
                    </p>
                    <Link
                      href="/?bulk=1"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all hover:scale-105"
                    >
                      <Plus size={18} />
                      Criar minha lista
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Botão Sair */}
          <section>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 p-4 flex items-center justify-between transition-all"
            >
              <span className="inline-flex items-center gap-2 text-red-400 font-semibold">
                <LogOut size={20} />
                Sair da conta
              </span>
              <span className="text-red-400/60 text-sm">logout</span>
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
