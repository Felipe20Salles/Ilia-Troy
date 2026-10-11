# Regras confirmadas em 28/09/2026
Requisitos de implementação; esta lista não significa que todos já funcionem no protótipo.

> **03/10/2026:** várias regras abaixo foram superadas e estão marcadas. As regras em vigor ficam em `REGRAS-CAMPANHA.md` (gerais), nos `CENARIO-MISSAO-N.md` (por missão) e em `CAMPANHA.md` (índice e decisões de 03/10).

- Produto: tabuleiro físico espelhado pelo site. Jogadores informam posições/ações; software registra atributos, dano, exploração e instrui/narra respostas troianas. Competitivo em espera.
- **[Superado em parte, 03/10/2026:** C1 entrou na missão 1; as peças de cada missão estão nos docs `CENARIO-MISSAO-N.md`.**]** Missão 1: A1, A2, N1–N4, P1, P2, P6, C2 (10). Missão 2 acrescenta P3, P7, P4, M1, M4, B5 (16). As descobertas podem acrescentar N5, P5, C1, B1, M2 e M5. A Missão 3 começa com essas 22 peças e mantém M3, B2, B3 e B4 sob névoa até sua revelação.
- Ações intercaladas livremente. Troia responde após todos terminarem/passarem. Dano fixo.
- Rebote: ocorre somente em ataques corpo a corpo. Ataques à distância nunca geram rebote. O defensor sobrevivente e não atordoado causa metade do próprio Ataque, arredondada para baixo. Armadura e proteções aplicáveis reduzem o dano; não há rebote em cadeia.
- Armadura funciona novamente a cada ataque. Golpe de Escudo (desde N1): 1 ação, 2 dano contra armadura atual; quebra totalmente armadura até fim da missão e atordoa imediatamente, impedindo rebote. Recuperar prepara habilidade.
- Atordoamento impede ataques, rebotes e ataques de retirada; perde próxima ativação e então termina.
- Retirada comum: 1 ação e golpe de fuga da tropa não atordoada de menor Ataque na área. Dano igual à metade do Ataque, arredondada para baixo, ignorando Armadura. Se o herói cair, fica na origem. Sem rebote.
- Caminho Seguro: Odisseu move a si até 2 áreas; Abrir Caminho: Menelau move outro até 2. Ambos atravessam inimigos sem golpe de retirada.
- **[Superado, 03/10/2026:** fichas com conteúdo fixo por cenário e exploração por missão; ver `REGRAS-CAMPANHA.md`.**]** Exploração: ficha física genérica com código, 1 ação, mesma área sem inimigos; sorteio adequado à região/cenário, persistido. Retirar ficha após resolução.
- Emboscada: posicionar a tropa e confirmar, sem dano imediato. Ela age somente na próxima resposta troiana. O perigo de abandonar a área segue a regra normal de fuga.
- **[Superado, 02/10/2026:** "Vida é comida", em `REGRAS-CAMPANHA.md`.**]** Comida: 1 por herói no início da campanha, capacidade 2 (dois espaços no tabuleiro do herói). Descobertas abastecem estoque coletivo diretamente. Persiste entre missões; reposição na preparação sem ação mas descontando estoque; durante missão exige acampamento e 1 ação. Vida restaura entre missões; comida não.
- Evoluções físicas N2/N3, não equipamentos adicionais. Limite de recompensas conquistadas por campanha = heróis + 2. Oportunidades opcionais distribuídas nas missões.
- Cada descoberta oferece até dois heróis distintos presentes e abaixo de N3. Escolher uma evolução, respeitando N1→N2→N3; ausentes nunca elegíveis. Com um elegível, uma opção; todos N3, outro recurso útil.
- Evolução imediata, sem curar ou preparar habilidades; Menelau ganha ação adicional já na rodada do N2. N3 sem bloqueio por missão. Perder descoberta não pula níveis.
- Madeira e comida separadas das evoluções. Madeira só após plano revelado, em bosques/navios. Explorar recolhe uma carga, limite uma por herói, movimento normal. Entregar: 1 ação no acampamento. Caído deixa carga; recolher: 1 ação, mesma área livre, sem outra carga.
- **[Atualizado, 03/10/2026:** viraram as missões 6 e 7; ver `CAMPANHA.md`.**]** Construção do cavalo e falsa retirada adiadas: discutir ao chegar aos respectivos capítulos.

## Implementado nas missões 1 e 2

- Odisseu e Agamêmnon são obrigatórios; a interface não permite selecionar nível. A missão 1 ganhou preparação guiada de heróis, objetivo, montagem em pares, posicionamento e início.
- **[Superado em parte, 02/10/2026:** Recuperar virou Preparar habilidades e não cura; ver `REGRAS-CAMPANHA.md`.**]** As quatro ações principais são Mover, Atacar, Explorar e Recuperar. Habilidades ativas custam 1 ação. Na missão 2, Recuperar reúne comida, descanso, cura e preparação de habilidades.
- Alvos troianos aparecem pelo tipo, miniatura visual, vida, ataque, armadura e barra de vida; identificadores internos não são exibidos.
- Todo dano de Odisseu ignora Armadura. Golpe de Escudo de Ájax destrói a Armadura do alvo e o atordoa.
- Disparo Duplo de Odisseu substitui Tiro Preciso: até dois inimigos diferentes, juntos na área atual ou em uma área vizinha, sofrem 2 de dano cada, ignorando Armadura e sem rebote.
- **[Superado:** missão 2 antiga (`muralhas.js`). A missão 2 atual é `reconhecimento.js`; ver `CENARIO-MISSAO-2.md`.**]** O guarda precisa ser derrotado antes de Atacar o portão M1. O ataque fracassa, dispara o alarme e acrescenta lanceiros, Heitor e Páris; então os sobreviventes devem recuar para A1.
- **[Superado:** missão 2 antiga; ver `CENARIO-MISSAO-2.md`.**]** Fichas da missão 2 são neutras, persistidas, exploradas uma vez e removidas. P2 oferece evolução e revela P5/C1; B5 fornece comida, revela M5/M2/B1 e posiciona uma patrulha sem dano imediato; N4 fornece comida e revela N5.
- As missões 2 e 3 mantêm automaticamente a equipe e as evoluções da campanha. Cada missão orienta a montagem física em etapas: peças, fichas, tropas e heróis.
- Toda tropa que entra durante a partida abre um aviso que pausa a condução, mostra a miniatura, a quantidade e a peça onde deve ser colocada. O jogo só continua após os jogadores confirmarem a colocação; a nova tropa age na resposta seguinte de Troia.
- **[Superado:** missão 3 antiga (`defesa.js`). A missão 3 atual é `segurar.js`; ver `CENARIO-MISSAO-3.md`.**]** Na Missão 3, toda a ofensiva parte de M1/M2 e uma nova onda entra depois de cada resposta anterior à décima. P3 revela M3; C1 revela B2/B3/B4 e oferece uma evolução. Ambas são obrigatórias. A vitória exige dez respostas (limite de 10 rodadas), A1 livre e um sobrevivente de pé. Páris recua imediatamente ao chegar a 1 de vida; Heitor recua uma área por resposta até alcançar M1. Enéias e Sarpedon podem morrer definitivamente. Heróis aqueus caídos e não socorridos até o fim também morrem e não retornam.
