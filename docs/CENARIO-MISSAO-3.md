# Cenário da missão 3 — Segurar a linha

Status: **jogável** em `cooperativo/segurar.html` (motor `segurar.js`). Este doc foi escrito em 03/10/2026 a partir do código e registra a regra de Pátroclo aprovada nesse dia, **ainda não programada**. Substitui a defesa antiga (`defesa.html`), que fica no repositório só como referência.

Mesmas regras da campanha (`REGRAS-CAMPANHA.md`) e o episódio de Criseida (`DILEMAS.md`).

## A ideia em uma frase

Heitor viu os gregos diante do portão. Agora Troia vem até o acampamento: a linha precisa segurar até Heitor ser ferido e recuar.

## Preparação

- **Mapa:** o que as missões anteriores revelaram, mais A1, N1 e M1, sempre na mesa.
- **Heróis:** todos em A1, com as evoluções e habilidades da campanha. A vida vem do armazém.
- **Favor:** o que a campanha trouxe (até 6).
- **Se Criseida foi tomada na missão 2:** Crises chega ao acampamento no início (ver abaixo).

## Objetivos

- **Vitória:** causar 4 de dano em Heitor (vida 10, ataque 3, Armadura 1). Ele recua para trás das muralhas, e Troia recua com ele.
- **Derrota:** 3 danos às tendas, ou todos os heróis caídos.

## O Alarme

Sobe 2 por fase de Troia. Toda a ofensiva sai do portão (M1).

| Alarme | Troia responde | Com 4 ou 5 heróis, a mais |
|---|---|---|
| 4 | Lanceiros em M1 | Exploradores em P4 |
| 7 | **Páris** em M1 (alcance 2) | Arqueiros em M4 |
| 11 | **Heitor** em M1: marcha direto para as tendas | Lanceiros em M1 |
| 15 | Lanceiros em M1 | Arqueiros em M4 |
| 18 | Troia em peso: uma companhia de lanceiros por herói, menos uma, e arqueiros em M4 | — |

- Páris (a até 2 peças) e os arqueiros (a 1 peça) atiram sem avançar; de longe, o tiro tira 1 a menos.
- As tropas marcham para A1 e atacam quem estiver a até uma peça do caminho.
- Com Criseida no acampamento, o primeiro reforço (Alarme 4) não vem.

## Fichas de exploração

| Peça | Achado |
|---|---|
| N2 | Peixe na maré: +2 comida |
| C2 | Colmeias na colina: +2 comida |

## Deuses

Atena (1 Favor) revela uma ficha; Poseidon (2) agita o mar, e o Alarme cai 2; Zeus (2) dá por cumprido o pedido da crônica da rodada.

## Pergaminhos

- **Rotas da costa II:** abre a trilha escondida P1–P7.
- **Segredos de Troia I:** Heitor entra sem Armadura.
- **Favor dos pastores I:** +1 comida no armazém.

## Crises, a peste e Briseida

Se Criseida foi tomada, Crises pede a filha no início. As opções A a D e a peste estão em `DILEMAS.md`. O comandante pode rever a decisão no **Conselho de guerra** (1 ação em A1).

### Opção B: Agamêmnon toma Briseida, e Pátroclo entra (regra aprovada em 03/10/2026)

Substitui o retorno de Aquiles pela embaixada aos Mirmidões, que o código ainda usa.

1. **Gatilho exclusivo.** Pátroclo só existe se Agamêmnon tomar Briseida de Aquiles. Em qualquer outra escolha, ou se Aquiles não estiver na equipe, Pátroclo nunca entra em cena e o jogo segue normal.
2. **Aquiles sai, Pátroclo entra.** O jogador de Aquiles passa a jogar Pátroclo, que veste a armadura de Aquiles: tem a **força inicial de Aquiles** (N1: vida 6, ataque 2) e **apenas uma habilidade**.
3. **A embaixada sempre falha.** Odisseu ou Ájax podem tentar convencer Aquiles a voltar, como no canto 9 da Ilíada, mas a tentativa nunca o traz de volta.
4. **Só a morte de Pátroclo traz Aquiles de volta.** Quando Pátroclo cai, **não há socorro**: ele sai de cena, definitivamente. Aquiles volta, movido pela ira, com **todas as habilidades e evoluções que tinha**.
5. **Pátroclo vivo é uma desvantagem assumida.** O jogador pode jogar com cuidado para manter Pátroclo vivo. Nesse caso, **Aquiles nunca volta**: a campanha segue com Pátroclo, mais fraco, no lugar dele, e não existe o duelo entre Aquiles e Heitor.
6. **O duelo entre Pátroclo e Heitor tende a acontecer.** Heitor marcha sobre o acampamento, e Pátroclo usa a armadura de Aquiles: a morte de Pátroclo é quase inevitável, e a consequência dela é a ira de Aquiles.

**Padrões propostos para a programação** (mudar se não fizer sentido):
- Aquiles volta na rodada seguinte à morte de Pátroclo, nos navios negros (N4).
- A habilidade de Pátroclo é a habilidade inicial que o jogador escolheu para Aquiles.
- Pátroclo não evolui nem cumpre os feitos de Aquiles.
- A morte de Pátroclo não diminui a equipe: Aquiles ocupa o lugar dele.

### O duelo de Pátroclo com Heitor deve ser desejado (decidido em 03/10/2026)

O jogo encaminha Pátroclo para enfrentar Heitor, como se esse fosse o objetivo dele, para que o jogador queira o duelo mesmo sabendo que Pátroclo provavelmente morre.

- **Zeus e a balança de ouro.** Quando Heitor sai do portão (Alarme 11), Zeus aparece para Pátroclo e pesa o destino dele, como na Ilíada. A tela mostra os dois pratos: o que acontece se Pátroclo enfrentar Heitor e o que acontece se ele fugir. É uma exceção à regra de efeitos escondidos (`DILEMAS.md`).
- **Se Pátroclo sobreviver à missão 3,** a visita se repete no início da missão 4.
- **Condição (decidida em 03/10/2026):** Pátroclo precisa morrer **de frente para Heitor**: cair na mesma peça de Heitor, depois de tê-lo atacado pelo menos uma vez. Se morrer de outro jeito, Aquiles volta, mas sem os prêmios abaixo.
- **A escolha não é um botão:** o jogador decide jogando, levando Pátroclo até Heitor ou mantendo-o longe. A balança só deixa claro o que está em jogo.
- **As recompensas da promessa:**
  1. **O dano fica:** todo ferimento que Pátroclo fizer em Heitor continua na missão seguinte.
  2. **A ira de Aquiles:** Aquiles volta com todas as habilidades e, na primeira rodada dele, os troianos que estiverem por perto fogem de medo.
  3. **A honra dos deuses:** +2 de Favor.
  4. **A glória de Pátroclo** fica registrada para o epílogo da campanha.

### A cena da balança (texto aprovado em 03/10/2026)

**1. A visita (quando Heitor sai do portão)**

> *O céu escurece sobre a planície. Por um instante, o barulho da batalha some, e Pátroclo ouve apenas o próprio coração dentro da armadura emprestada.*
>
> *No alto do Ida, Zeus ergue a balança de ouro. Num prato, põe a sorte de Pátroclo; no outro, a de Heitor.*
>
> **"Filho de Menécio. Vestes o bronze de Aquiles, e Troia inteira te teme por causa dele. Heitor saiu do portão. Vai ao encontro dele, e os deuses lembrarão o teu nome."**

**Os dois pratos:**

| ⚖️ Enfrentar Heitor | ⚖️ Afastar-se dele |
|---|---|
| *"O bronze cai, mas o golpe fica."* | *"Viverás, à sombra de quem não voltará."* |
| O estrago que fizeres em Heitor ele levará consigo. | Pátroclo segue lutando, sem a força de Aquiles. |
| Aquiles voltará, e os troianos fugirão diante da ira dele. | Aquiles não volta mais à guerra. |
| Os deuses honrarão a tua coragem: +2 de Favor. | — |
| O teu nome ficará entre os que não se esquecem. | — |

> *A balança oscila e não decide. A escolha é tua.*

**2. Se Pátroclo morre de frente para Heitor**

> *Pátroclo cai com a lança de Heitor no peito. O elmo de Aquiles rola pela poeira.*
>
> *Nos navios negros, Aquiles ouve a notícia e solta um grito que atravessa a planície. Os cavalos troianos recuam. Os homens de Heitor olham para o mar, e pela primeira vez sentem medo.*
>
> **Aquiles volta à guerra.**

**3. Se Pátroclo morre de outro jeito**

> *Pátroclo cai longe de Heitor, numa escaramuça sem nome. Aquiles chora o amigo e volta à guerra, mas a balança de Zeus não se mexeu: essa morte não foi a que os deuses pesaram.*

**4. Se a missão termina e Pátroclo continua vivo**

> *Pátroclo sobrevive ao dia. Nos navios negros, Aquiles continua de braços cruzados. A balança de Zeus volta a subir; ela será pesada outra vez.*

### Sem Briseida: o duelo de egos

Se Briseida não for tomada, Pátroclo nunca entra. Aquiles segue na equipe, e o encontro dele com Heitor, na missão 4, é um **duelo de egos**: ver quem é o maior guerreiro. A morte de Heitor acontece por essa via.

## Crônica

| Rodada | Crônica | Pedido |
|---|---|---|
| 2 | O portão se abre | — |
| 3 | Estacas afiadas | Um herói de pé em A2 até a próxima resposta: Alarme −1; se não, +1 |
| 4 | O nome de Heitor | — |
| 5 | Os feridos | — |
| 6 | Olhos na planície | Nenhum explorador à vista ao fim da resposta: Alarme −1 |
| 7 | Chuva de flechas | — |
| 8 | Fogo perto dos navios | Um herói de pé em N1 até a próxima resposta; se não, 1 dano às tendas |
| 9 a 12 | A noite das fogueiras, Aurora, A última carga, Silêncio | — |

## Feitos pessoais (aprovados em 03/10/2026)

| Herói | Feito | Meta |
|---|---|---|
| Aquiles | Diante de Heitor | Causar dano a Heitor |
| Menelau | A dívida de Páris | Causar dano a Páris |
| Odisseu | Arco de Ítaca | Derrotar 2 tropas |
| Ájax | Muralha dos aqueus | Resistir de pé a 3 ataques no acampamento (A1 ou A2) |
| Agamêmnon | Rei dos reis | Estar de pé em A1 quando Heitor recuar |

Recompensa: +1 Favor e Glória (`REGRAS-CAMPANHA.md`). O código ainda dá uma habilidade nova, quando o herói tem alguma a aprender.

## O que passa para a missão 4

- Heitor e Páris vivos (recuaram).
- Criseida (no acampamento ou devolvida), a peste, e se Aquiles saiu da equipe ou se Pátroclo está em jogo.
- Pergaminhos, armazém, mapa revelado, vida e habilidades dos heróis.

## Decisões em aberto

Nenhuma sobre Pátroclo: as perguntas de 03/10 foram respondidas no mesmo dia (acima).
