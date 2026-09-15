# Guerra de Troia — Duelo online

Jogo de duelo sobre o cerco de Troia. Cada jogador entra pelo seu próprio dispositivo (celular ou computador) — não precisa mais revezar o mesmo aparelho. A sincronização entre os dois lados é feita por uma função serverless do próprio Netlify (Netlify Functions) usando Netlify Blobs para guardar o estado da sala. Sem Supabase, sem banco de dados externo.

## Jogar

1. Um dos jogadores abre o link do deploy e clica em **Criar sala** — ele joga como Troia e recebe um código de 5 letras.
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

- `index.html` — interface do jogo (fala com a API via `fetch`).
- `netlify/functions/room.js` — função serverless que cria/entra em salas e recebe as jogadas.
- `netlify/functions/game-logic.js` — as regras do jogo (baralhos, combate, suprimento etc.), rodando no servidor pra ninguém conseguir ver a jogada do adversário antes da hora.

## Atualizar o jogo

Qualquer push para a branch conectada (`main`) atualiza o site e as functions automaticamente.
