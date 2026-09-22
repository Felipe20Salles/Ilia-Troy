# Ilia — Guerra de Troia

A página inicial permite escolher entre **Competitivo** e **Cooperativo**.

- **Competitivo:** duelo online original em `competitivo.html`, com as mesmas regras, salas e funções Netlify. A sessão existente é retomada ao entrar nesse modo.
- **Cooperativo:** protótipo local em `cooperativo/index.html`. Uma a cinco pessoas compartilham o aparelho e controlam de três a cinco heróis na missão **O Desembarque**. Não usa o backend nem as salas do competitivo.

## Campanha cooperativa: O Desembarque

O capítulo 1 está jogável em `cooperativo/index.html`. O capítulo 2 também está jogável em cooperativo/muralhas.html. Os capítulos 3–6 permanecem como roteiro. O plano completo pode ser lido em `cooperativo/campanha.html` e `docs/CAMPANHA.md`. A fonte estruturada é `cooperativo/campaign-plan.json`. Não há navegação jogável para missões ainda não implementadas.

Selecione 1–5 jogadores locais. Com um ou dois jogadores, escolha três heróis entre Aquiles, Ájax, Odisseu, Menelau e Agamêmnon; com três a cinco, cada pessoa recebe um herói. Atribuições J1–J5 são configuráveis e persistem. Cada herói tem duas ações e três habilidades. Menelau oferece cura, ataque e proteção; Agamêmnon move aliados, recupera habilidades de outro herói e protege a área, sem conceder ações extras.

### Montagem e objetivo

O mapa usa a paisagem fornecida pelo usuário, preservada em `cooperativo/assets/territorio-troia.png`. As nove regiões têm limites irregulares sobre a imagem contínua. N1 e N2 são praias secas; A1 é a clareira, A2 seu acesso; P1/P2/P3 formam a planície; B1/B2, o bosque. Mar, colina e espaços sem contorno não são casas nesta missão. As conexões douradas, definidas pelo motor, controlam o movimento. Tendas são marcadores separados que aparecem somente após instalar a base. Os limites não são moldes finais de impressão.

Todos começam em N1. Há uma caixa por herói, distribuídas entre N1 (metade arredondada para cima) e N2. Cada herói transporta uma; coleta, entrega em A1 e instalação custam uma ação e exigem casa livre de inimigos. Heróis caídos deixam a caixa na casa, onde pode ser recuperada.

Depois de entregar todas as caixas, instale A1. Isso convoca imediatamente dois grupos (3–4 heróis) ou três (5 heróis), alternando P2 e B1. A equipe vence após duas respostas consecutivas de Troia terminarem com A1 livre de inimigos e um herói de pé lá. Uma interrupção zera a contagem. Perde com três danos ao acampamento, todos caídos ou fim da rodada 10. Concluir a segunda defesa na rodada 10 ainda é vitória.

Troianos atacam primeiro heróis na mesma casa; sem heróis de pé em A1, sabotam o acampamento; caso contrário, avançam uma casa rumo a A1. Empates de alvo seguem a ordem da equipe. Movimento e ataque não ocorrem na mesma ativação. Reforços anunciados nas rodadas 3 (B1), 5 (P1; também B1 com 5 heróis), 7 (P2) e 9 (B1). Uma patrulha inicial em P1; equipes de 4–5 heróis também têm uma em B1. Este é um balanceamento inicial, ainda sujeito a testes de mesa.

### Progresso e cenário anterior

O mapa natural usa `ilia-desembarque-v2`. O save `ilia-desembarque-v1` do mapa quadrado é preservado, mas não é retomado na geografia nova. A vitória registra o capítulo concluído e os recursos iniciais da campanha em `ilia-campanha-v1`: suprimentos entregues e zero materiais do cavalo. Esses dados preparam uma continuação futura; ainda não existe importação para o capítulo 2. O jogo é local e não sincroniza aparelhos.

A exploração de 16 peças continua disponível em `cooperativo/exploracao.html`, com seu save `ilia-cooperativo-v2` e motor anterior. As buscas em A1/A2, B2/B4 e C2/C3, os artefatos sorteados e a retirada permanecem como cenário experimental separado.

## Verificar localmente

Execute `node --test tests/*.test.cjs` (ou `npm test`). A suíte cobre as 16 equipes possíveis de três a cinco heróis, partidas solo e com dois jogadores, todas as 15 habilidades, caixas, defesa, derrotas e persistência, além da exploração anterior. A suíte verifica vitórias dentro do prazo com todas as equipes; isso não estabelece duração mínima ou balanceamento definitivo.

Execute `node scripts/preview.cjs` (ou `npm run preview`) e abra `http://127.0.0.1:4173`. O competitivo online precisa de Netlify Functions. Requer Node.js 18 ou superior.

Arquivos da missão: `heroes.js` (elenco), `landing.js` (regras), `landing-app.js` (preparação, interface e salvamento), `territory.js` (áreas), `natural-map.js` (tabuleiro), `landing.css` (layout). A exploração mantém `game.js`, `app.js` e `puzzle.js`. Nenhuma arte nova foi gerada para o Desembarque.

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

## Missão 2 — Diante das muralhas

Abra `cooperativo/muralhas.html`. Reconheça M1/M2 sem inimigos, depois reúna todos vivos em A1 e conclua a retirada. Limite inicial de 14 rodadas; o segundo reconhecimento inicia o contra-ataque e um prazo de seis rodadas adicionais, limitado a 14. A base é segura e não ataca. B1 anuncia uma emboscada única em B2.

Regras em `muralhas.js`, interface em `muralhas-app.js`, mapa em `muralhas-map.js`. Salvamento independente `ilia-muralhas-v2`; `campaign-state.js` preserva resultados sem acumular suprimentos por repetição. Muralhas esquemáticas aguardam validação antes da arte final. Fronteiras claras contínuas e acessos dourados tracejados foram reforçados nas duas missões. Capítulos 3–6 ainda planejados.
