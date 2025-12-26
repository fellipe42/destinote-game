# DESTINOTE

Destinote e uma plataforma estilo *bucket list* / catalogo de objetivos de vida (1000+ goals), com estetica cinematografica (holografico/neon) e foco em exploracao/scroll imersivo.

Este README existe para substituir a pasta `GUIAS/` (que virou um cemitério de docs duplicados). A ideia e ter **1 fonte de verdade**: este arquivo.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- TailwindCSS
- Framer Motion (animacoes)
- Prisma + SQLite (dev local)
- NextAuth (autenticacao) + Prisma Adapter (infra pronta)
- Seed via CSV (bilingue PT/EN)

## Como rodar (local)

```bash
# 1) instalar deps
npm install

# 2) variaveis de ambiente
cp .env.example .env

# 3) migrar + seed
npm run db:migrate
npm run db:seed

# 4) dev server
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Seeds (CSV)

Os dados vivem em `prisma/seed-data/`:

- `goals.csv`  (PT/EN no mesmo arquivo: `title_pt`, `title_en`, `location_pt`, `location_en`, `notes_pt`, `notes_en`...)
- `categories.csv` (categorias)
- `macro_categories.csv` (macro-categorias / grupos)

O seed principal esta em:

- `prisma/seed.ts`

## Internacionalizacao (PT/EN)

- O idioma atual e controlado por `useLang()` em `lib/useLang.ts`.
- O parametro `?lang=pt|en` e respeitado (e normalizado por `normalizeLang` em `lib/lang.ts`).
- Endpoints principais recebem `lang` e retornam campos no idioma.

## Top10 (regra de negocio)

- Top10 e uma vitrine/atalho.
- **Itens Top10 nao sao exclusivos**: eles aparecem normalmente na lista principal.
- Clicar em um card Top10 **nao** abre/expande o card Top10. O clique apenas "teleporta" para o card equivalente na lista principal e abre (expand) la.

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build
npm start          # prod
npm run lint       # lint
npm run db:migrate # prisma migrate dev
npm run db:seed    # popula o banco via CSV
npm run db:studio  # prisma studio
```

## Estrutura (alto nivel)

- `app/` (rotas e paginas)
  - `app/page.tsx` (Home: hero, backgrounds, Top10, lista principal, filtros via URL)
  - `app/categorias/page.tsx` (pagina de categorias + macro-categorias)
  - `app/api/*` (rotas de API)
- `components/` (UI reutilizavel)
- `lib/` (utilitarios: lang, filtros, prisma, etc.)
- `prisma/` (schema + seed + SQLite)

## Notas rapidas

- A base visual (Navbar/cards/backgrounds) e considerada sagrada: alteracoes de layout so quando explicitamente pedido.
- Para comparar mudancas entre branches/versoes, use `git diff --no-index` (Windows) ou GitLens no VS Code.
