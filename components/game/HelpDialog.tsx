// components/game/HelpDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
          Ajuda
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-black/80 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Como jogar (beta notebook)</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-white/80">
          <p>
            Esta é a versão “passa o notebook”: o jogo controla <b>de quem é a vez</b> na escrita e na avaliação.
          </p>
          <p>
            <b>Fase 1</b>: cada pessoa escreve uma resposta por rodada. Depois rola votação por reações (👍 ❤️ 😂 🔥 💀)
            com limite por pessoa. Se o auto-voto estiver desativado, o jogo avisa.
          </p>
          <p>
            <b>Fase 2</b>: cada jogador faz uma ordenação <b>secreta</b> do deck (topo = mais perto de <b>100</b>, fim = mais
            perto de <b>0</b>). Depois vocês discutem e fazem uma ordenação <b>coletiva</b>. A revelação final mostra a
            carta vencedora e o Top 3.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
