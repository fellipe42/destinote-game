# Destinote — Personalização (Tema / Globo / Background)

Este pacote contém **apenas os arquivos alterados/adicionados** para:
- Painel de personalização na página **/perfil** (3 cards expansíveis: Tema, Globo, Background)
- Preferências em **localStorage** (versão v1)
- Integração com **ScrollBackgrounds** e **RotatingGlobe**
- Temas: `default`, `dark`, `holiday` (via `html[data-dn-theme="..."]`)

## Como aplicar
1) Faça backup (ou commit) do seu projeto antes.
2) Extraia este zip **por cima do seu projeto** mantendo a estrutura de pastas.
3) Rode o projeto normalmente.

## Onde mexer depois
- Catálogo (temas, globos, backgrounds):
  - `lib/personalization/catalog.ts`
- Defaults (inclui brilho/tamanho/velocidade default do globo e segmentos):
  - `lib/personalization/defaults.ts`
- Tokens de tema / cores:
  - `app/globals.css` (blocos `html[data-dn-theme='...']`)
- Painel do Perfil:
  - `components/profile/*`

## Observações
- Globos “em breve” já estão no catálogo, mas desativados na UI (para você adicionar os arquivos depois).
- A distribuição de tempo dos backgrounds funciona por **pesos que somam 100** (com “travamento” quando você ajusta manualmente um item).

Gerado em: 2025-12-23 12:52:31
