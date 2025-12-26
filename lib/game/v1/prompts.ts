// lib/game/v1/prompts.ts
import type { Prompt, PromptBank, PromptPhase } from './types';

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * FASE 1 — TEMAS CONCRETOS
 * Estrutura mental: “Coisas para fazer …”
 */
export const PHASE1_BUILTIN: string[] = [
  'Coisas para fazer num dia de chuva',
  'Coisas para fazer num domingo preguiçoso',
  'Coisas para fazer quando falta energia',
  'Coisas para fazer quando você está entediado',
  'Coisas para fazer sozinho (sem celular)',
  'Coisas para fazer com amigos em casa',
  'Coisas para fazer com pouco dinheiro',
  'Coisas para fazer em 10 minutos',
  'Coisas para fazer antes de dormir',
  'Coisas para fazer ao acordar',
  'Coisas para fazer quando você perdeu o ônibus',
  'Coisas para fazer enquanto espera alguém atrasado',
  'Coisas para fazer numa fila gigante',
  'Coisas para fazer num aeroporto (sem surtar)',
  'Coisas para fazer numa viagem de carro longa',
  'Coisas para fazer no intervalo do trabalho',
  'Coisas para fazer quando você quer impressionar alguém',
  'Coisas para fazer para levantar o astral',
  'Coisas para fazer pra recuperar o foco',
  'Coisas para fazer quando você não consegue dormir',
  'Coisas para fazer quando você está com ansiedade',
  'Coisas para fazer quando está calor demais',
  'Coisas para fazer quando está frio demais',
  'Coisas para fazer num dia de “autocuidado”',
  'Coisas para fazer pra ser mais saudável sem drama',
  'Coisas para fazer pra economizar tempo amanhã',
  'Coisas para fazer para organizar a vida em 15 minutos',
  'Coisas para fazer pra dar um reset mental',
  'Coisas para fazer pra ser uma pessoa mais interessante',
  'Coisas para fazer quando você está de ressaca',
  'Coisas para fazer no banheiro (sem ser esquisito)',
  'Coisas para fazer no transporte público',
  'Coisas para fazer enquanto cozinha',
  'Coisas para fazer enquanto lava a louça',
  'Coisas para fazer enquanto arruma o quarto',
  'Coisas para fazer quando o Wi-Fi cai',
  'Coisas para fazer quando o celular está sem bateria',
  'Coisas para fazer quando você está esperando um e-mail importante',
  'Coisas para fazer depois de uma discussão',
  'Coisas para fazer antes de pedir desculpas',
  'Coisas para fazer pra quebrar o gelo numa festa',
  'Coisas para fazer num encontro (primeiro date)',
  'Coisas para fazer num encontro longo (3+ horas)',
  'Coisas para fazer em casal em casa',
  'Coisas para fazer com a família num feriado',
  'Coisas para fazer com crianças por perto',
  'Coisas para fazer pra ajudar alguém hoje',
  'Coisas para fazer com a letra A',
  'Coisas para fazer com um objeto aleatório (uma caneca)',
  'Coisas para fazer olhando pela janela por 2 minutos',
  'Coisas para fazer para aprender algo novo sem curso',
  'Coisas para fazer pra ficar mais confiante',
  'Coisas para fazer pra ter uma conversa melhor',
  'Coisas para fazer numa cidade que você não conhece',
  'Coisas para fazer numa praia (sem cair no golpe do milho caro)',
  'Coisas para fazer num parque',
  'Coisas para fazer quando chove e você está sem guarda-chuva',
  'Coisas para fazer quando você esqueceu sua senha',
  'Coisas para fazer quando você está com fome mas sem vontade de cozinhar',
];

/**
 * FASE 2 — TEMAS DE ESCALA (ABSURDO / DISCUSSÃO)
 * Estrutura mental: “Qual dessas ações faz mais/menos sentido nesse cenário?”
 */
export const PHASE2_BUILTIN: string[] = [
  'Pior coisa para se fazer num velório',
  'A última coisa que você faria num apocalipse zumbi',
  'A coisa menos apropriada para se fazer numa entrevista de emprego',
  'A coisa mais absurda para se fazer numa reunião importante',
  'Primeira coisa a se fazer ao acordar em Marte',
  'Pior coisa para se fazer quando você encontra seu ex',
  'A coisa mais suspeita para se fazer numa biblioteca silenciosa',
  'A coisa menos heroica para se fazer ao salvar o mundo',
  'A coisa mais cafona para se fazer num casamento chique',
  'A coisa mais perigosa para se fazer num laboratório (NÃO façam)',
  'A coisa mais inadequada para se fazer no próprio aniversário surpresa',
  'A coisa mais caótica para se fazer durante uma prova',
  'A pior reação possível ao ouvir “precisamos conversar”',
  'A coisa mais estranha para se fazer ao conhecer sogros pela primeira vez',
  'A coisa menos inteligente para se fazer quando você se perde numa floresta',
  'A coisa mais injustificável para se fazer numa mesa de RPG',
  'A coisa mais dramática para se fazer numa padaria',
  'A coisa mais suspeita para se fazer num aeroporto',
  'A coisa menos discreta para se fazer numa aula de yoga',
  'A coisa mais engraçada para se fazer num elevador lotado (sem crimes)',
  'A pior coisa para se fazer quando o avião faz um barulho esquisito',
  'A coisa mais absurda para se fazer ao ser abduzido por alienígenas',
  'A coisa menos apropriada para se fazer num interrogatório',
  'A primeira coisa para se fazer quando você vira invisível (por 10 min)',
  'A última coisa que você faria antes do fim do mundo (comédia permitida)',
  'A coisa mais inadequada para se fazer num grupo de WhatsApp da família',
  'A pior coisa para se fazer num jantar romântico',
  'A coisa mais insana para se fazer num banco',
  'A coisa menos útil para se fazer quando o planeta é invadido por robôs',
  'A coisa mais absurda para se fazer ao ganhar na loteria',
  'A coisa mais vergonhosa para se fazer num palco',
  'A pior coisa para se fazer quando você percebe que está ao vivo',
  'A coisa mais suspeita para se fazer num museu',
  'A coisa menos apropriada para se fazer numa sala de espera',
  'A coisa mais sem noção para se fazer numa apresentação em PowerPoint',
  'A coisa menos profissional para se fazer numa call com o chefe',
  'A pior coisa para se fazer quando você é o “médico” em um filme de terror',
  'A coisa mais absurda para se fazer numa nave espacial sem gravidade',
  'A coisa menos apropriada para se fazer durante uma oração',
  'A coisa mais dramática para se fazer ao pedir um lanche',
  'A pior coisa para se fazer quando você está tentando ser discreto',
  'A coisa mais improvável para se fazer ao se tornar rei/rainha por 1 dia',
  'A coisa menos sensata para se fazer num cassino em Las Vegas',
  'A coisa mais caótica para se fazer numa sala de aula',
  'A pior coisa para se fazer quando você tenta impressionar alguém',
  'A coisa mais suspeita para se fazer numa delegacia',
  'A coisa menos apropriada para se fazer num reality show',
  'A coisa mais absurda para se fazer quando você tem superpoderes',
  'A pior coisa para se fazer quando o microfone está aberto',
  'A coisa menos apropriada para se fazer no Natal em família',
  'A coisa mais absurda para se fazer ao ser promovido',
];

/** util: linhas -> lista limpa */
export function parsePromptLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** normaliza e deduplica, mantendo ordem */
export function normalizePromptList(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export function buildPromptPool(phase: PromptPhase, bank?: PromptBank | null): Prompt[] {
  const builtIn = phase === 'phase1' ? PHASE1_BUILTIN : PHASE2_BUILTIN;
  const custom = phase === 'phase1' ? bank?.phase1 ?? [] : bank?.phase2 ?? [];

  const merged = normalizePromptList([...builtIn, ...custom]);

  return merged.map((text) => ({
    id: `${phase}:${slugify(text)}`,
    phase,
    text,
    source: builtIn.includes(text) ? 'built-in' : 'custom',
  }));
}

export function pickRandomPrompt(pool: Prompt[], excludeIds?: Set<string>): Prompt {
  const candidates = excludeIds ? pool.filter((p) => !excludeIds.has(p.id)) : pool;
  const list = candidates.length ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)];
}
