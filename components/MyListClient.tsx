'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Download, Edit2, SlidersHorizontal, X as XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import MyListCard from '@/components/my-list/MyListCard';
import StaticBackground from '@/components/my-list/StaticBackground';
import Navbar from '@/components/Navbar';
import ExportControls from '@/components/my-list/ExportControls';
import { exportToImage } from '@/lib/export/exportToImage';

/* eslint-disable @typescript-eslint/no-explicit-any */


type Category = {
  id: number;
  name: string;
  color?: string | null;
};

type Goal = {
  id: number;
  title: string;
  local?: string | null;
  done: boolean;
  category?: Category | null;
};

type ListChangedDetail = { source?: string };
type DoneChangedDetail = { goalId: number; done: boolean; source?: string };

const TITLE_KEY = 'destinote:my-list:title';
const APPEAR_KEY = 'destinote:my-list:appearance';

type BgPreset = 'nebula' | 'mono' | 'aurora';

function safeBaseName(input: string) {
  const raw = (input || 'Minha Lista')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  return cleaned || 'Minha_Lista';
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'object' && data) {
    const maybe = data as { error?: unknown; message?: unknown };
    const msg = maybe.error ?? maybe.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export default function MyListClient({ initialGoals }: { initialGoals: Goal[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);

  // Título editável
  const [customTitle, setCustomTitle] = useState('Minha lista');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('Minha lista');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Personalizar aparência + story export
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [bgPreset, setBgPreset] = useState<BgPreset>('nebula');
  const [includeDoneInStory, setIncludeDoneInStory] = useState(true);
  const [storyPageSize, setStoryPageSize] = useState<4 | 6 | 8>(6);
  const [storyPageIndex, setStoryPageIndex] = useState(0);

  // Sync quando o Server Component re-renderiza
  useEffect(() => {
    setGoals(initialGoals ?? []);
  }, [initialGoals]);

  // Carregar título do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TITLE_KEY);
      if (saved && saved.trim()) {
        setCustomTitle(saved);
        setDraftTitle(saved);
      }
    } catch { }
  }, []);

  // Persistir título
  useEffect(() => {
    try {
      localStorage.setItem(TITLE_KEY, customTitle);
    } catch { }
  }, [customTitle]);

  // Focus no input ao editar
  useEffect(() => {
    if (!isEditingTitle) return;
    const t = setTimeout(() => titleInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isEditingTitle]);

  const startEditingTitle = () => {
    setDraftTitle(customTitle);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setDraftTitle(customTitle);
    setIsEditingTitle(false);
  };

  const saveEditingTitle = () => {
    const next = draftTitle.trim() || 'Minha lista';
    setCustomTitle(next);
    setIsEditingTitle(false);
  };

  // Evita “lista velha” por cache/prefetch ao entrar na página
  const didInitialRefresh = useRef(false);
  useEffect(() => {
    if (didInitialRefresh.current) return;
    didInitialRefresh.current = true;
    const t = setTimeout(() => router.refresh(), 50);
    return () => clearTimeout(t);
  }, [router]);

  // Refresh se vier com ?v= ou ?ts= na URL
  useEffect(() => {
    const v = sp.get('v');
    const ts = sp.get('ts');
    if (!v && !ts) return;

    router.refresh();
    window.history.replaceState(null, '', '/my-list');
  }, [sp, router]);

  // Atualiza ao voltar para a aba
  useEffect(() => {
    const onFocus = () => router.refresh();
    const onVis = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [router]);

  // Atualiza ao voltar para a página (history)
  useEffect(() => {
    const onPageShow = () => router.refresh();
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [router]);

  // Atualiza quando mexerem na lista fora daqui
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ListChangedDetail>;
      if (ce?.detail?.source === 'my-list') return;
      router.refresh();
    };

    window.addEventListener('destinote:list-changed', handler as EventListener);
    return () => window.removeEventListener('destinote:list-changed', handler as EventListener);
  }, [router]);

  const removeFromListApi = async (goalId: number) => {
    const res = await fetch('/api/user/add-to-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, add: false }),
    });

    const data: unknown = await res.json().catch(() => ({}));
    if (!res.ok || !(typeof data === 'object' && data && (data as any).success)) {
      throw new Error(getApiErrorMessage(data, 'Erro ao remover da lista'));
    }

    window.dispatchEvent(
      new CustomEvent<ListChangedDetail>('destinote:list-changed', {
        detail: { source: 'my-list' },
      })
    );

    setTimeout(() => router.refresh(), 350);
  };

  const removeFromState = (goalId: number) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const toggleDone = async (goalId: number, nextDone: boolean) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, done: nextDone } : g)));

    const res = await fetch('/api/user/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, done: nextDone }),
    });

    const data: unknown = await res.json().catch(() => ({}));
    if (!res.ok || !(typeof data === 'object' && data && (data as any).success)) {
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, done: !nextDone } : g)));
      throw new Error(getApiErrorMessage(data, 'Erro ao marcar como completo'));
    }

    window.dispatchEvent(
      new CustomEvent<DoneChangedDetail>('destinote:done-changed', {
        detail: { goalId, done: nextDone, source: 'my-list' },
      })
    );

    setTimeout(() => router.refresh(), 250);
  };

  // Carregar aparência
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APPEAR_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        bgPreset: BgPreset;
        includeDoneInStory: boolean;
        storyPageSize: 4 | 6 | 8;
      }>;

      if (parsed.bgPreset) setBgPreset(parsed.bgPreset);
      if (typeof parsed.includeDoneInStory === 'boolean') setIncludeDoneInStory(parsed.includeDoneInStory);
      if (parsed.storyPageSize) setStoryPageSize(parsed.storyPageSize);
    } catch { }
  }, []);

  // Persistir aparência
  useEffect(() => {
    try {
      localStorage.setItem(APPEAR_KEY, JSON.stringify({ bgPreset, includeDoneInStory, storyPageSize }));
    } catch { }
  }, [bgPreset, includeDoneInStory, storyPageSize]);

  const storyGoals = useMemo(() => {
    return includeDoneInStory ? goals : goals.filter((g) => !g.done);
  }, [goals, includeDoneInStory]);

  const storyPages = useMemo(() => chunk(storyGoals, storyPageSize), [storyGoals, storyPageSize]);

  // evita index inválido quando muda filtro/tamanho
  useEffect(() => {
    setStoryPageIndex(0);
  }, [includeDoneInStory, storyPageSize, goals.length]);

  const handleExportStory = async (format: 'png' | 'jpg') => {
    try {
      const pagesNow = chunk(
        includeDoneInStory ? goals : goals.filter((g) => !g.done),
        storyPageSize
      );

      if (pagesNow.length === 0) return { success: false, error: 'Nada para exportar.' };

      const base = safeBaseName(customTitle);

      for (let i = 0; i < pagesNow.length; i++) {
        setStoryPageIndex(i);
        await nextPaint();
        await exportToImage('export-preview', format, `${base}_story_p${i + 1}`);
      }

      return { success: true, count: pagesNow.length };
    } catch {
      return { success: false, error: 'Falha ao exportar Story.' };
    }
  };

  const totalPages = Math.max(1, storyPages.length);
  const pageIndex = Math.min(storyPageIndex, totalPages - 1);

  return (
    <>
      <StaticBackground changeInterval={15000} showGlobe={true} />
      <Navbar />

      <main className="relative min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Header único (sem duplicar) */}
          <div className="mb-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="min-w-0">
                {!isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 truncate">
                      {customTitle}
                    </h1>
                    <button
                      onClick={startEditingTitle}
                      className="mt-2 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white/80"
                      title="Editar título"
                      aria-label="Editar título"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={titleInputRef}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingTitle();
                        if (e.key === 'Escape') cancelEditingTitle();
                      }}
                      className="mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white placeholder:text-white/40 w-[min(520px,80vw)]"
                      placeholder="Minha lista"
                    />
                    <button
                      onClick={saveEditingTitle}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-400/20 text-emerald-200"
                      title="Salvar"
                      aria-label="Salvar"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEditingTitle}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white/70"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                )}

                <p className="text-white/70">
                  {goals.length === 0
                    ? 'Você ainda não adicionou nenhum objetivo à sua lista.'
                    : `${goals.length} objetivo${goals.length !== 1 ? 's' : ''} na sua lista`}
                </p>
              </div>

              {goals.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <ExportControls
                    goals={goals}
                    customTitle={customTitle}
                    onExportStory={handleExportStory}
                    compact
                  />


                  <button
                    onClick={() => setCustomizeOpen((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm"
                    title="Personalizar aparência"
                  >
                    <SlidersHorizontal size={16} />
                    Personalizar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Painel Personalizar */}
          {customizeOpen && goals.length > 0 && (
            <div className="mb-6 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Personalizar aparência</h2>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-white/70 text-sm mb-2">Fundo do Story</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['nebula', 'aurora', 'mono'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setBgPreset(p)}
                        className={[
                          'px-3 py-2 rounded-lg border text-sm',
                          bgPreset === p
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 bg-white/5 text-white/70',
                        ].join(' ')}
                      >
                        {p === 'nebula' ? 'Nebula' : p === 'aurora' ? 'Aurora' : 'Mono'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-2">Itens por Story</p>
                  <div className="flex gap-2">
                    {[4, 6, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setStoryPageSize(n as 4 | 6 | 8)}
                        className={[
                          'px-3 py-2 rounded-lg border text-sm',
                          storyPageSize === n
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 bg-white/5 text-white/70',
                        ].join(' ')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-2">Concluídos no Story</p>
                  <button
                    onClick={() => setIncludeDoneInStory((v) => !v)}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm"
                  >
                    {includeDoneInStory ? 'Mostrar' : 'Ocultar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo */}
          {goals.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/70 text-lg mb-6">
                Sua lista está vazia. Que tal adicionar alguns objetivos?
              </p>
              <Link
                href="/?bulk=1"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all hover:scale-105"
              >
                <Download size={18} />
                Adicionar objetivos
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <MyListCard
                  key={goal.id}
                  id={goal.id}
                  title={goal.title}
                  local={goal.local}
                  done={goal.done}
                  category={goal.category}
                  onRemove={removeFromListApi}
                  onRemoved={removeFromState}
                  onToggleDone={toggleDone}
                />
              ))}
            </div>
          )}

          {/* Preview OFFSCREEN (1 único id) */}
          {goals.length > 0 && (
            <div className="fixed -left-[99999px] top-0">
              <div
                id="export-preview"
                style={{ width: 1080, height: 1920 }}
                className="relative overflow-hidden rounded-[48px] border border-white/10"
              >
                <div className="absolute inset-0 bg-[#0b0b12]" />
                {bgPreset === 'nebula' && (
                  <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_30%_10%,rgba(168,85,247,0.30),transparent_55%),radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_40%_90%,rgba(34,197,94,0.14),transparent_55%)]" />
                )}
                {bgPreset === 'aurora' && (
                  <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_30%,rgba(34,197,94,0.20),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.18),transparent_55%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.18),transparent_55%)]" />
                )}
                {bgPreset === 'mono' && (
                  <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.06),transparent_55%)]" />
                )}

                <div className="relative h-full px-16">
                  <div className="pt-16 text-center">
                    <p className="text-white/55 text-sm mb-3">
                      Página {pageIndex + 1}/{totalPages}
                    </p>
                    <h1 className="text-white text-6xl font-bold tracking-tight">
                      {customTitle}
                    </h1>
                    <p className="text-white/70 mt-4 text-2xl">
                      {storyGoals.length} objetivo{storyGoals.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="pt-12 space-y-4">
                    {(storyPages[pageIndex] ?? []).map((g) => (
                      <div
                        key={`story-${g.id}`}
                        className="rounded-2xl border border-white/12 bg-white/6 px-6 py-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p
                              className="text-white font-semibold text-[30px] leading-[1.12]"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                              title={g.title}
                            >
                              {g.title}
                            </p>

                            {g.local && (
                              <p
                                className="text-white/70 text-[22px] mt-2 leading-[1.2]"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                📍 {g.local}
                              </p>
                            )}

                            {g.category?.name && (
                              <p className="text-white/55 text-[18px] mt-3">
                                {g.category.name}
                              </p>
                            )}
                          </div>

                          {g.done && (
                            <div className="shrink-0 text-emerald-200/90 text-xl font-semibold">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute left-0 right-0 bottom-0 px-16 pb-14">
                    <div className="h-px bg-white/10 mb-6" />
                    <div className="flex items-center justify-between text-white/55 text-sm">
                      <span className="font-semibold tracking-wide">DESTINOTE</span>
                      <span>Lista • Sonhos • Checkpoints</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
