import type { PromptBank } from './types';

export const DEFAULT_PROMPT_BANK: PromptBank = {
  version: 'v0',
  updatedAt: Date.now(),
  packs: [
    { id: 'cinematic', name: 'Cinemático', description: 'Missões, cenas e frases de filme.' },
    { id: 'humor', name: 'Humor & Caos', description: 'Ideias ridículas com confiança.' },
    { id: 'nerd', name: 'Nerd & Sci-Fi', description: 'Multiverso, IA, tecnologia e bizarrice elegante.' },
    { id: 'romance', name: 'Romance & Drama', description: 'Cenas, confissões e finais.' },
    { id: 'vida', name: 'Vida Real', description: 'Hábitos, coragem e coisas “pé no chão”.' },
    { id: 'desafio', name: 'Desafio', description: 'Coisas que doem… e valem a pena.' },
  ],
  prompts: [
    // Cinemático
    { id: 'p01', packId: 'cinematic', packName: 'Cinemático', category: 'Aventura', text: 'Uma missão que começa com “Eu preciso de…”' },
    { id: 'p02', packId: 'cinematic', packName: 'Cinemático', category: 'Aventura', text: 'Algo que você faria se tivesse 1 hora pra ser herói.' },
    { id: 'p03', packId: 'cinematic', packName: 'Cinemático', category: 'Plot', text: 'Uma decisão impulsiva que dá certo (por sorte).' },
    { id: 'p04', packId: 'cinematic', packName: 'Cinemático', category: 'Cena', text: 'Descreva uma cena em 8–12 palavras.' },
    { id: 'p05', packId: 'cinematic', packName: 'Cinemático', category: 'Final', text: 'Uma frase final antes do corte pra preto.' },

    // Humor & Caos
    { id: 'p06', packId: 'humor', packName: 'Humor & Caos', category: 'Humor', text: 'Uma coisa ridícula que você defenderia com convicção.' },
    { id: 'p07', packId: 'humor', packName: 'Humor & Caos', category: 'Caos', text: 'A pior ideia possível… mas com carisma.' },
    { id: 'p08', packId: 'humor', packName: 'Humor & Caos', category: 'Plot Twist', text: 'Algo normal… que vira absurdo no final.' },
    { id: 'p09', packId: 'humor', packName: 'Humor & Caos', category: 'Vergonha', text: 'Uma coisa que você faria se ninguém pudesse registrar.' },
    { id: 'p10', packId: 'humor', packName: 'Humor & Caos', category: 'Memes', text: 'Um “tutorial” que daria errado do jeito mais engraçado.' },

    // Nerd & Sci-Fi
    { id: 'p11', packId: 'nerd', packName: 'Nerd & Sci-Fi', category: 'Sci-Fi', text: 'Uma tecnologia que resolve um problema cotidiano.' },
    { id: 'p12', packId: 'nerd', packName: 'Nerd & Sci-Fi', category: 'Multiverso', text: 'Você encontra sua versão alternativa e…' },
    { id: 'p13', packId: 'nerd', packName: 'Nerd & Sci-Fi', category: 'IA', text: 'O assistente virtual faz UMA coisa inesperada.' },
    { id: 'p14', packId: 'nerd', packName: 'Nerd & Sci-Fi', category: 'Tempo', text: 'Uma regra bizarra de viagem no tempo.' },
    { id: 'p15', packId: 'nerd', packName: 'Nerd & Sci-Fi', category: 'Boss Fight', text: 'Um chefe final absurdo (e seu ponto fraco).' },

    // Romance & Drama
    { id: 'p16', packId: 'romance', packName: 'Romance & Drama', category: 'Romance', text: 'Uma cena romântica em 10 palavras.' },
    { id: 'p17', packId: 'romance', packName: 'Romance & Drama', category: 'Drama', text: 'Uma confissão que muda tudo.' },
    { id: 'p18', packId: 'romance', packName: 'Romance & Drama', category: 'Mensagem', text: 'Um texto curto que você não teria coragem de enviar.' },
    { id: 'p19', packId: 'romance', packName: 'Romance & Drama', category: 'Cliffhanger', text: 'Termine uma frase com “…e então eu ouvi a porta.”' },
    { id: 'p20', packId: 'romance', packName: 'Romance & Drama', category: 'Voto', text: 'Um “eu prometo” que ninguém esperava.' },

    // Vida Real
    { id: 'p21', packId: 'vida', packName: 'Vida Real', category: 'Vida', text: 'Um hábito pequeno com efeito gigante.' },
    { id: 'p22', packId: 'vida', packName: 'Vida Real', category: 'Coragem', text: 'Uma coisa que você sempre adiou.' },
    { id: 'p23', packId: 'vida', packName: 'Vida Real', category: 'Rotina', text: 'Uma mudança de 2 minutos por dia que melhora tudo.' },
    { id: 'p24', packId: 'vida', packName: 'Vida Real', category: 'Família', text: 'Um gesto simples que conserta um dia ruim.' },
    { id: 'p25', packId: 'vida', packName: 'Vida Real', category: 'Amizade', text: 'Uma frase que você queria ouvir (e pode dizer hoje).' },

    // Desafio
    { id: 'p26', packId: 'desafio', packName: 'Desafio', category: 'Desafio', text: 'Um desafio que começa agora, sem desculpas.' },
    { id: 'p27', packId: 'desafio', packName: 'Desafio', category: 'Disciplina', text: 'Uma regra que você seguiria por 30 dias.' },
    { id: 'p28', packId: 'desafio', packName: 'Desafio', category: 'Limite', text: 'Algo que te assusta um pouco — perfeito.' },
    { id: 'p29', packId: 'desafio', packName: 'Desafio', category: 'Corpo', text: 'Um desafio físico que viraria história pra contar.' },
    { id: 'p30', packId: 'desafio', packName: 'Desafio', category: 'Mente', text: 'Um desafio mental que ninguém veria, mas você sentiria.' },
  ],
};
