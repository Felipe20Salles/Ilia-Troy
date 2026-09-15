# Guerra de Troia — Duelo local

Jogo de duelo hotseat (revezando o mesmo aparelho) sobre o cerco de Troia. É um único arquivo `index.html` estático — sem backend, sem banco de dados, todo o estado vive na memória do navegador durante a partida.

## Jogar

Abra o link do deploy (Netlify) e comece o duelo. A cada jogada o app pede pra passar o celular pro outro jogador antes de mostrar as opções, pra ninguém ver a jogada do adversário antes da hora.

## Deploy no Netlify

1. Entre em [app.netlify.com](https://app.netlify.com) e clique em **Add new site → Import an existing project**.
2. Conecte esse repositório do GitHub (`Felipe20Salles/Ilia-Troy`).
3. Configurações de build: **nenhuma** — não há build step, é HTML puro.
   - Build command: (deixe em branco)
   - Publish directory: `.`
4. Clique em **Deploy**. Em segundos você tem um link público (`algo.netlify.app`) pra jogar e compartilhar.

## Atualizar o jogo

Qualquer push para a branch conectada (`main`) atualiza o site automaticamente — o Netlify já fica escutando o repositório.
