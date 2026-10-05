# Ilia — Guerra de Troia

A página inicial permite escolher entre **Competitivo** e **Cooperativo**.

- **Competitivo:** duelo online original em `competitivo.html`, com as mesmas regras, salas e funções Netlify. A sessão existente é retomada ao entrar nesse modo.
- **Cooperativo:** campanha local de mesa a partir de `cooperativo/index.html`. Uma a cinco pessoas compartilham o aparelho e controlam de três a cinco heróis. Não usa o backend nem as salas do competitivo.

## Campanha cooperativa

Jogo de tabuleiro **físico** (miniaturas, peças de mapa, tabuleiros de herói, cartas e fichas de comida) com o app como narrador e IA de Troia, no estilo de *Jornadas na Terra-média*. Sem sorte: decisão, combate e consequência. Sete missões; o plano completo está em `docs/CAMPANHA.md` e em `cooperativo/campanha.html`. As regras gerais estão em `docs/REGRAS-CAMPANHA.md`; cada missão tem o seu `docs/CENARIO-MISSAO-N.md`.

| Missão | Página | Motor | Estado |
|---|---|---|---|
| 1. O Desembarque | `cooperativo/index.html` | `landing.js` | jogável |
| 2. Diante das muralhas | `cooperativo/reconhecimento.html` | `reconhecimento.js` | jogável |
| 3. Segurar a linha | `cooperativo/segurar.html` | `segurar.js` | jogável |
| 4. A ira de Aquiles | — | — | em desenho |
| 5. O Paládio | — | — | em desenho |
| 6. Construir o cavalo | — | — | planejada |
| 7. A noite do cavalo | — | — | planejada |

Regras que valem em todas: 1–5 jogadores, Odisseu e Agamêmnon obrigatórios; rodada em **fase dos heróis** e **fase de Troia**; o **Alarme de Troia** traz reforços em patamares; **vida é comida** (o armazém só repõe vida entre missões); decisões com efeito escondido até a escolha (`docs/DILEMAS.md`); pergaminhos que atravessam missões (`docs/MECANICA-PERGAMINHOS.md`). O resultado de cada missão passa para a seguinte em `ilia-campanha-v1` (`campaign-state.js`).

Interface compartilhada: `mesa.js` e `mesa.css` (mapa, diálogos, heróis, painel de Troia); `heroes.js` e `troops.js` (personagens); `territory.js` (peças do mapa). Páginas antigas mantidas só como referência: `muralhas.html`, `defesa.html` e `exploracao.html`.

## Verificar localmente

Execute `node --test tests/*.test.cjs` (ou `npm test`). Cada missão tem a sua suíte, com um robô que joga todas as equipes possíveis para medir o equilíbrio; isso não substitui o teste de mesa.

Execute `node scripts/preview.cjs` (ou `npm run preview`) e abra `http://127.0.0.1:4180`. O competitivo online precisa de Netlify Functions. Requer Node.js 18 ou superior.

## Duelo online original

Jogo de duelo sobre o cerco de Troia. Cada jogador entra pelo seu próprio dispositivo (celular ou computador) — não precisa mais revezar o mesmo aparelho. A sincronização entre os dois lados é feita por uma função serverless do próprio Netlify (Netlify Functions) usando Netlify Blobs para guardar o estado da sala. Sem Supabase, sem banco de dados externo.

## Jogar

1. Um dos jogadores abre o link do deploy, escolhe **Competitivo** e clica em **Criar sala** — ele joga como Troia e recebe um código de 5 letras.
2. O outro jogador abre o mesmo link em outro dispositivo, clica em **Entrar com um código**, digita o código e joga como os Gregos.
3. Quando os dois estiverem na sala, qualquer um clica em **Começar duelo**.
4. Cada jogada fica escondida até os dois lados escolherem — o app avisa "aguardando o adversário" enquanto isso.

## Deploy no Netlify

1. Entre em [app.netlify.com](https://app.netlify.com) e clique em **Add new site → Import an existing project**.
2. Conecte esse repositório do GitHub (`Felipe20Salles/Ilia-Troy`).
3. Configurações de build: **nenhuma** — o Netlify detecta o `package.json` e instala a dependência (`@netlify/blobs`) sozinho antes de publicar as functions.
   - Build command: (deixe em branco)
   - Publish directory: `.`
4. Clique em **Deploy**. Em segundos você tem um link público (`algo.netlify.app`) pra jogar e compartilhar.

Netlify Blobs já vem habilitado automaticamente para qualquer site do Netlify — não precisa configurar nada além do deploy normal.

## Estrutura

- `index.html` — escolha entre competitivo e cooperativo.
- `competitivo.html` — interface do duelo (fala com a API via `fetch`).
- `cooperativo/` — interface e regras do protótipo cooperativo local.
- `netlify/functions/room.js` — função serverless que cria/entra em salas e recebe as jogadas.
- `netlify/functions/game-logic.js` — as regras do jogo (baralhos, combate, suprimento etc.), rodando no servidor pra ninguém conseguir ver a jogada do adversário antes da hora.

## Atualizar o jogo

Qualquer push para a branch conectada (`main`) atualiza o site e as functions automaticamente.
