// components/game/ThemeBankDialog.tsx
'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GameCard from './GameCard';
import { addTheme, loadThemeBank, resetThemeBank, removeTheme } from '@/lib/game/v2/themeBank';

export default function ThemeBankDialog({
  onPick,
  onChanged,
}: {
  onPick?: (phase: 'p1' | 'p2', theme: string) => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'p1' | 'p2'>('p1');
  const [text, setText] = useState('');
  const [tick, setTick] = useState(0);

  const isDev = process.env.NODE_ENV !== 'production';

  const bank = useMemo(() => {
    return loadThemeBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tick]);

  const list = phase === 'p1' ? bank.p1 : bank.p2;

  const bump = () => {
    setTick((t) => t + 1);
    onChanged?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
          Temas
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl border-white/10 bg-black text-white">
        <DialogHeader>
          <DialogTitle>Banco de temas</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPhase('p1')}
            variant="secondary"
            className={phase === 'p1' ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/15'}
          >
            Fase 1
          </Button>
          <Button
            onClick={() => setPhase('p2')}
            variant="secondary"
            className={phase === 'p2' ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/15'}
          >
            Fase 2
          </Button>
          <div className="flex-1" />
          {isDev ? (
            <Button
              onClick={() => {
                resetThemeBank();
                bump();
              }}
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/15"
            >
              Reset
            </Button>
          ) : null}
        </div>

        {isDev ? (
          <GameCard className="mt-4 p-4">
            <div className="text-sm font-semibold text-white/90">Editar banco (DEV)</div>
            <div className="mt-1 text-xs text-white/50">
              Dica: use “*” no setup para tema aleatório. (Usuário final não edita isso.)
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={phase === 'p1' ? 'Novo tema da Fase 1...' : 'Novo tema da Fase 2...'}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/25"
              />
              <Button
                onClick={() => {
                  const t = text.trim();
                  if (!t) return;
                  addTheme(phase, t);
                  setText('');
                  bump();
                }}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Adicionar
              </Button>
            </div>
          </GameCard>
        ) : (
          <div className="mt-4 text-xs text-white/50">
            Clique em <span className="font-semibold text-white/70">Selecionar</span> para usar um tema no setup (não edita o banco).
          </div>
        )}

        <div className="mt-4 max-h-[55vh] space-y-2 overflow-auto pr-1">
          {list.map((t) => (
            <GameCard
              key={t}
              className="p-3"
              right={
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-purple-600 text-white hover:bg-purple-700"
                    onClick={() => {
                      onPick?.(phase, t);
                      setOpen(false);
                    }}
                  >
                    Selecionar
                  </Button>

                  {isDev ? (
                    <Button
                      variant="secondary"
                      className="bg-white/10 text-white hover:bg-white/15"
                      onClick={() => {
                        removeTheme(phase, t);
                        bump();
                      }}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              }
              title={t}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/*
Changes Summary
- [UX] Usuário final não “remove” temas; agora a ação principal é “Selecionar”.
- [DEV] Edição do banco (adicionar/remover/reset) fica apenas em NODE_ENV !== 'production'.
- [HOOK] Callbacks onPick/onChanged permitem preencher inputs do setup e atualizar sugestões.
*/


// // components/game/ThemeBankDialog.tsx
// 'use client';

// import { useMemo, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';

// import { addTheme, loadThemeBank, resetThemeBank } from '@/lib/game/v2/themeBank';

// /**
//  * Banco de temas do jogo.
//  * - Produção: apenas escolher/copiar temas (sem deletar nem editar).
//  * - Dev: permite adicionar e resetar para defaults.
//  */
// export default function ThemeBankDialog({
//   editable = false,
//   onPick,
// }: {
//   editable?: boolean;
//   onPick?: (phase: 'p1' | 'p2', theme: string) => void;
// }) {
//   const [tick, setTick] = useState(0);
//   const bank = useMemo(() => loadThemeBank(), [tick]);

//   const [phase, setPhase] = useState<'p1' | 'p2'>('p1');
//   const [newTheme, setNewTheme] = useState('');

//   const list = phase === 'p1' ? bank.p1 : bank.p2;

//   function refresh() {
//     setTick((n) => n + 1);
//   }

//   function choose(theme: string) {
//     const t = theme.trim();
//     if (!t) return;
//     onPick?.(phase, t);

//     // Se não houver callback, fallback: copia pro clipboard (debug/manual).
//     if (!onPick) {
//       try {
//         navigator.clipboard.writeText(t);
//       } catch {
//         // ignore
//       }
//     }
//   }

//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
//           Temas
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="max-w-2xl border-white/10 bg-black/70 text-white backdrop-blur-xl">
//         <DialogHeader>
//           <DialogTitle>Banco de temas</DialogTitle>
//         </DialogHeader>

//         <div className="flex flex-wrap gap-2">
//           <Button
//             variant={phase === 'p1' ? 'default' : 'secondary'}
//             className={phase === 'p1' ? 'ring-2 ring-purple-500/40' : 'bg-white/10 text-white hover:bg-white/15'}
//             onClick={() => setPhase('p1')}
//           >
//             Fase 1
//           </Button>
//           <Button
//             variant={phase === 'p2' ? 'default' : 'secondary'}
//             className={phase === 'p2' ? 'ring-2 ring-purple-500/40' : 'bg-white/10 text-white hover:bg-white/15'}
//             onClick={() => setPhase('p2')}
//           >
//             Fase 2
//           </Button>

//           <div className="flex-1" />

//           {editable && (
//             <Button
//               variant="secondary"
//               className="bg-white/10 text-white hover:bg-white/15"
//               onClick={() => {
//                 resetThemeBank();
//                 refresh();
//               }}
//               title="Restaura temas padrão"
//             >
//               Resetar
//             </Button>
//           )}
//         </div>

//         {editable && (
//           <div className="flex gap-2">
//             <Input
//               value={newTheme}
//               onChange={(e) => setNewTheme(e.target.value)}
//               placeholder={phase === 'p1' ? 'Novo tema da Fase 1…' : 'Novo tema da Fase 2…'}
//               className="bg-black/30 text-white placeholder:text-white/40"
//             />
//             <Button
//               onClick={() => {
//                 const t = newTheme.trim();
//                 if (!t) return;
//                 addTheme(phase, t);
//                 setNewTheme('');
//                 refresh();
//               }}
//             >
//               Adicionar
//             </Button>
//           </div>
//         )}

//         <div className="max-h-[55vh] overflow-auto pr-1 space-y-2">
//           {list.map((t) => (
//             <div
//               key={t}
//               className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
//             >
//               <div className="text-sm text-white/90">{t}</div>
//               <Button
//                 variant="secondary"
//                 className="bg-white/10 text-white hover:bg-white/15"
//                 onClick={() => choose(t)}
//                 title="Selecionar este tema"
//               >
//                 Selecionar
//               </Button>
//             </div>
//           ))}

//           {!list.length && <div className="text-sm text-white/60">Sem temas.</div>}
//         </div>

//         <div className="text-xs text-white/50">
//           {onPick
//             ? 'Clique em “Selecionar” para preencher o campo de tema que estiver em foco no setup.'
//             : 'Clique em “Selecionar” para copiar o tema (fallback).'}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
