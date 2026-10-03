# Missão 1 · O Desembarque (proposta de cenário com revelação do mapa)

Status: **programado** em `cooperativo/landing.js` e `landing-app.js` (01/10/2026), aguardando teste de mesa.

## A ideia em uma frase

A frota chega a uma costa desconhecida. Na mesa há só a praia dos navios (N1). O resto do território aparece conforme os heróis avançam, e cada descoberta traz uma escolha: abastecer o acampamento, ajudar quem precisa ou se arriscar por uma recompensa.

## Regras novas (valem para toda a campanha)

1. **Revelar ao mover.** Mover para uma peça ainda não revelada custa a ação normal de Mover. O app mostra qual peça encaixar e onde, e o herói já entra nela.
2. **Caminhos desconhecidos.** O app marca, em cada peça revelada, as saídas que levam a peças ainda escondidas.
3. **Encontros.** Algumas peças têm uma cena que dispara quando um herói entra nela pela primeira vez. O app pausa, narra e oferece escolhas. Encontros não usam ficha física.
4. **Fichas de exploração (as lupas que já existem).** Quando uma peça com ficha é revelada, o app pede para colocar uma lupa nela. Explorar custa 1 ação, exige a peça sem inimigos e só pode ser feito uma vez.
5. **Troia também revela.** Se uma tropa troiana entra numa peça escondida, a peça é revelada e colocada na mesa. Revelar não dispara o encontro; só a primeira entrada de um herói dispara.
6. **O mapa permanece.** O que foi revelado na missão 1 já começa na mesa na missão 2.
7. **Caixa pesada.** Quem carrega uma caixa continua com suas ações (2, ou 3 para Menelau N2+), mas **só pode se mover uma vez por rodada**. Atacar, explorar, recuperar e usar habilidades continuam livres. Carregar não impede lutar; impede correr.

## O Alarme de Troia (substitui o limite de rodadas)

Em vez de "10 rodadas", a pressão vem de uma **trilha de Alarme**, de 0 a 18, que mede o quanto Troia já percebeu a invasão. Ela sobe com o tempo e com o que os heróis deixam acontecer:

| O que acontece | Alarme |
|---|---|
| Cada resposta de Troia (o tempo passa) | +1 |
| Um Explorador termina a resposta na peça dos heróis ou numa vizinha (ele vai relatar) | +1 por resposta |
| Barulho do navio encalhado (primeira entrada na peça do navio) | +1 |
| Falhar o favor do mendigo | +2 |
| Bênção de Zeus | −2 |

Cada patamar libera uma resposta, anunciada no painel de Troia antes de acontecer:

| Alarme | Troia responde |
|---|---|
| 4 | Um Explorador desce a colina (C2) |
| 8 | Um Lanceiro chega pela planície (P2) |
| 12 | Um Lanceiro em C2 |
| 18 | **Troia em peso.** Se o acampamento ainda não estiver defendido, a missão termina em derrota. |

Por que é melhor que contar rodadas: o relógio passa a ser consequência das escolhas. Derrotar os exploradores protege o grupo; ignorá-los acelera o fim. Equipes de 4 e 5 heróis recebem +1 Explorador no patamar 4.

**Calibragem (simulação automática, 01/10/2026):** a primeira versão (teto 12, combate somando Alarme) virava bola de neve e terminava em derrota por volta da rodada 5. Com os valores acima, todas as equipes de 3 a 5 heróis vencem nos dois roteiros em 10 a 13 rodadas, terminando com o Alarme entre 11 e 16. Um grupo de pessoas tende a jogar melhor que o robô de teste; os valores devem ser revistos no teste de mesa.

## Preparação

- **Na mesa:** apenas **N1**, com os navios.
- **Heróis:** todos em N1.
- **Caixas, sempre em praias** (uma por herói). Parte da carga foi parar ao longo da costa quando um navio se desgarrou da frota:

| Heróis | N1 | N2 | N3 | N4 |
|---|---|---|---|---|
| 3 | 1 | — | 1 | 1 |
| 4 | 1 | 1 | 1 | 1 |
| 5 | 2 | 1 | 1 | 1 |

  No **roteiro B**, as caixas de N3 e N2 trocam de lugar (com 3 heróis: N1, N2 e N4). As caixas fora de N1 só aparecem na mesa quando a praia é revelada.
- **Comida:** distribuição inicial como hoje (até 2 por herói; o resto fica no armazém).
- **Troia:** um Explorador está escondido em P1.
- **Roteiro A ou B**, escolhido na preparação: muda onde estão as caixas e os náufragos.

## Objetivos

| Objetivo | Condição |
|---|---|
| Abastecer | Entregar em A1 uma caixa por herói (1 ação por coleta, 1 por entrega, peça sem inimigos) |
| Instalar | Com todas as caixas entregues, 1 ação em A1 livre de inimigos |
| Defender | Duas respostas de Troia seguidas com A1 livre de inimigos e um herói de pé |

**Opcionais:** resgatar os náufragos e cumprir o favor do mendigo.

**Derrota:** 3 danos ao acampamento, todos os heróis caídos, ou o Alarme chegar a 18 sem o acampamento defendido.

## Peça por peça

| Peça | Ao revelar | Conteúdo |
|---|---|---|
| **N1** Praia dos navios | (início) | Caixas iniciais |
| **A1** Clareira | "Restos de uma fogueira ainda morna. Alguém esteve aqui há pouco." | Local do acampamento |
| **A2** Praia alta | Coloquem uma lupa. | Ficha: **barris de água doce**, +1 comida no armazém |
| **N2** Praia rochosa | Caixa, conforme a tabela | Ficha: **destroços**, +1 comida |
| **N3** Rochedos | Caixa; encontro dos **náufragos** (roteiro A) | Missão leve com prazo |
| **N4** Enseada | **Navio encalhado** com caixa; náufragos no roteiro B | Barulho: Alarme +1 na primeira entrada |
| **P2** Planície aberta | Coloquem uma lupa. | Ficha: **rotas das patrulhas**. O corpo de um mensageiro troiano com as rotas das patrulhas: Alarme −2. (Fichas nunca melhoram atributos; isso cabe só às cartas de N2 e N3.) |
| **P1** Bosque rochoso | Revela o Explorador escondido. Coloquem uma lupa. | Desafio: **tomar o mirante troiano**. Custa 2 ações de heróis na peça, sem inimigos, e o barulho sobe o Alarme em 1. A equipe escolhe junta qual herói de pé recebe a evolução (N1 → N2 ou N2 → N3). |
| **P6** Trilha | — | Passagem |
| **C2** Colina rochosa | — | Passagem para C1 |
| **C1** Círculo de pedras | Encontro: **o mendigo** | Favor com recompensa ou penalidade |

**Nova peça:** C1 passa a fazer parte da missão 1 (liga-se a C2 e P2). No mapa físico ela já existe; no app falta desenhar o recorte dela. A missão 3 hoje usa C1 para revelar B2/B3/B4; isso será ajustado quando a missão 3 for refeita.

Total de fichas físicas de exploração: **4** (A2, N2, P2, P1).

## Encontros

### Náufragos (N3 no roteiro A, N4 no roteiro B)

> Três marinheiros do navio desgarrado estão agarrados às pedras, exaustos. A maré está subindo.

- **Resgatar:** custa **2 ações**, que podem ser de heróis diferentes presentes na peça. Recompensa: +1 comida no armazém, e os marinheiros contam onde a carga caiu (as praias com caixas ainda escondidas são reveladas na hora).
- **Prazo:** se ninguém concluir o resgate antes de o Alarme chegar a 8, a maré os leva. O app narra a perda.

### O mendigo do círculo de pedras (C1)

> Entre as pedras antigas, um velho de manto puído estende a mão. "Estrangeiros, a hospitalidade é sagrada. Tragam-me pão e me levem até o fogo do seu acampamento."

A identidade dele **não é sorteada nem escolhida no roteiro: depende do que os heróis fazem.** É a *xenia*, a lei grega da hospitalidade, que Zeus protege.

- **O favor:** entregar **1 comida** a ele em C1 e depois **escoltá-lo até A1**. Ele anda junto com um herói (como uma carga, mas sem ocupar a caixa) e não pode ser atacado.
- **Cumprido** (ele chega a A1 antes de o acampamento ser instalado): o velho se revela **Zeus**. "Honraram a hospitalidade." Todos os heróis recuperam toda a vida e preparam suas habilidades, e o Alarme cai 2.
- **Não cumprido** (o acampamento é instalado antes, ou os heróis o abandonam): ele se revela um **espião troiano** que viu tudo. "Troia saberá quantos vocês são." Alarme +2, e um Lanceiro surge em C1.
- **Mandá-lo embora** logo no encontro conta como não cumprido.

Assim a revelação é consequência: o grupo nunca sabe de antemão quem ele é, e a escolha de gastar comida e tempo é que define o desfecho.

## Crônica da rodada

No início de cada rodada (da 2 à 12), o app narra um acontecimento. Alguns trazem um **pedido**, verificado ao fim da resposta de Troia seguinte; o resultado aparece na crônica da rodada seguinte.

| Rodada | Crônica | Pedido e efeito |
|---|---|---|
| 2 | Marcas na areia | Narrativa: algo foi arrastado para o leste (pista das caixas) |
| 3 | Fumaça nas colinas | Um herói em P1, P6 ou C2; se não, Alarme +1 |
| 4 | Barris da frota | Um herói em N1: +1 comida no armazém |
| 5 | Um corvo no mastro | Narrativa |
| 6 | Olhos na mata | Nenhum explorador à vista ao fim da resposta: Alarme −1 |
| 7 | Chuva fina | Narrativa |
| 8 | O canto dos remadores | Na hora: heróis em A1 ou N1 preparam as habilidades |
| 9 | Fogueiras ao longe | Acampamento instalado: Alarme −1; se não, Alarme +1 |
| 10 a 12 | Mensageiro, névoa, madrugada | Narrativa |

## Feitos pessoais

| Herói | Feito | Objetivo | Recompensa |
|---|---|---|---|
| Aquiles | Glória | Derrotar 2 tropas | Alarme −1 e recupera 2 de vida |
| Odisseu | Batedor da frota | Revelar 3 peças | Alarme −1 e +1 comida |
| Agamêmnon | Senhor do acampamento | Estar em A1 na instalação | Proteção 2 em A1 na resposta seguinte |
| Menelau | Irmão de armas | Socorrer ou curar um aliado, ou ajudar nos náufragos | +1 comida e prepara as habilidades |
| Ájax | Muralha dos aqueus | Resistir de pé a 3 ataques | Recupera 2 de vida e prepara as habilidades |

Cada feito vale uma vez por missão. Com crônica e feitos, a simulação segue vencível para todas as equipes, em 9 a 14 rodadas.

## O que passa para a campanha

| Resultado | Efeito na missão 2 |
|---|---|
| Caixas entregues | Suprimentos |
| Náufragos resgatados | +1 comida no armazém |
| Favor do mendigo cumprido | Bênção de Zeus (efeito a definir na missão 2) |
| Evolução do mirante | O herói começa a missão 2 em N2 (conta no limite de evoluções da campanha) |
| Peças reveladas | Já começam na mesa |

## O que testar na mesa

- Duração real (meta: 30 minutos ou mais) e em que ponto do Alarme o grupo costuma terminar.
- Se o grupo entende os caminhos desconhecidos e o Alarme sem consultar o manual.
- Se a caixa pesada torna as praias distantes caras demais.
- Se o resgate e o favor do mendigo são tentadores ou sempre ignorados.
- Se o mirante em P1 é forte demais para a missão 1.

## Decisões em aberto

1. Valores do Alarme (patamares 3, 6, 9 e 12) são iniciais e precisam de teste.
2. **Evolução no mirante** já na missão 1: aceitável? Ela consome uma das recompensas do limite da campanha (heróis + 2).
3. Efeito da **bênção de Zeus** na missão 2.

## Revisão de 02/10/2026 (após o primeiro teste de mesa)

O teste mostrou a missão fácil demais: dava para cumprir tudo, e os deuses e os feitos faziam o trabalho das habilidades dos heróis.

**Regra de design:** deuses, feitos e encontros nunca curam, preparam habilidades ou aumentam atributos. Isso é papel dos heróis (habilidades) e das cartas de N2 e N3.

**Deuses (agem sobre o mundo):** Atena (1 Favor) revela uma ficha; Poseidon (2) agita o mar e o Alarme cai 2; Zeus (2) cumpre o pedido da crônica da rodada. Hera e o raio de Zeus saíram.

**Feitos:** Aquiles e Ájax, Alarme −1; Agamêmnon, Alarme −2; Odisseu, Alarme −1 e +1 comida; Menelau, +1 comida. A bênção de Zeus (o velho) dá Favor e Alarme −2, sem cura. A crônica dos remadores virou só narrativa.

**Pressão de Troia:**
- As tropas caçam quem carrega caixa a até duas peças de distância. Carregar sozinho é perigoso; o grupo precisa escoltar.
- Ao Alarme 8, Troia guarnece o mirante de P1 com uma companhia que não sai do posto.
- O velho vai embora (e conta para Troia) se não receber pão até o Alarme 10.
- Teto do Alarme: 18 (21 para equipes de 5, que têm 5 caixas a buscar).

**Simulação:** com um robô que escolta os carregadores e ignora todo o conteúdo opcional, todas as equipes vencem nos dois roteiros em 10 a 15 rodadas. Fazer também os náufragos, o velho e o mirante dentro dos prazos exige escolhas: não dá para fazer tudo.

**Mapa:** o pedido da crônica em aberto aparece como etiqueta nas peças onde se resolve.

## Habilidades conquistadas (02/10/2026)

- Cada herói começa com **uma** habilidade, escolhida pelo jogador na preparação. As outras ficam viradas para baixo no tabuleiro do herói.
- **Cumprir o feito pessoal ensina uma nova habilidade**, à escolha do jogador, que vira a carta. Essa é a recompensa do feito (o Alarme −1 e afins saíram); o feito ainda dá +1 Favor.
- Uma passiva (o Sobrevivente do Ájax) só age depois de aprendida.
- Simulação: com uma habilidade inicial, todas as equipes vencem nos dois roteiros. As equipes de 5 têm teto de Alarme 22 (18 + 4), por terem 5 caixas a buscar.
