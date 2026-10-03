# Da praia aos portões de Troia

Índice da campanha cooperativa: sete missões. Cada missão tem o seu doc de cenário (`CENARIO-MISSAO-N.md`), que é a fonte de verdade dela. As regras que valem para todas estão em `REGRAS-CAMPANHA.md`; os dilemas, em `DILEMAS.md`; os pergaminhos, em `MECANICA-PERGAMINHOS.md`.

Atualizado em 03/10/2026. Missões 1 a 3 jogáveis; 4 a 7 em desenho.

> A página `cooperativo/campanha.html` ainda mostra o plano antigo de seis capítulos (`cooperativo/campaign-plan.json`). Ela será atualizada junto com o código.

## Regras de projeto

- 1–5 jogadores locais. Um ou dois jogadores controlam três heróis; três a cinco jogadores controlam um herói cada. Odisseu e Agamêmnon são obrigatórios na seleção inicial; Aquiles, Ájax e Menelau completam a equipe.
- A geografia vem antes dos recortes: água, barrancos e rochas limitam o território. Uma região representa um trecho percorrível, não uma distância fixa em metros. O desenho final das peças e a escala das miniaturas dependem do teste de mesa.
- A base aqueia é um lugar de partida, abastecimento e retirada. Seu contingente não gera ataques automáticos nem soldados controláveis. Ela só é atacada quando o cenário prevê: na instalação (missão 1) e no contra-ataque de Heitor (missão 3).
- Comida, evoluções, habilidades aprendidas, pergaminhos, territórios revelados, heróis mortos e comandantes mortos persistem. Vida vem do armazém na preparação. Madeira será persistente depois que o plano do cavalo for revelado.
- Cada missão tem salvamento próprio. Heróis caídos e não socorridos até o fim morrem permanentemente; a campanha pode continuar com menos heróis, inclusive apenas um. **Nenhum herói morre por roteiro.**
- **Heitor** não pode morrer nas missões 2 e 3 (recua ferido). Na missão 4 ele pode morrer pelas mãos de qualquer herói. **Aquiles e Páris** seguem vivos até a missão 7, salvo morte em jogo. Enéias e Sarpédon podem morrer definitivamente desde a missão 3.

## As sete missões

### 1. O Desembarque — jogável (`cooperativo/index.html`, motor `landing.js`)
A frota chega a uma costa desconhecida. A expedição revela o território, recolhe as caixas espalhadas pelas praias, toma o posto de vigia troiano em A1 e instala ali o acampamento. Encontros: os náufragos e o velho do círculo de pedras (Zeus ou espião). **Revisão de 03/10 programada:** P1 vazio, vigia em A1 e exploração por missão. Doc: `CENARIO-MISSAO-1.md`.

### 2. Diante das muralhas — jogável (`reconhecimento.html`)
A expedição sobe a planície para reconhecer o portão de Troia e volta com todos de pé, perseguida depois do reconhecimento. No santuário de Apolo (C1), a decisão de tomar ou respeitar Criseida. Doc: `CENARIO-MISSAO-2.md`. A missão 2 antiga (`muralhas.html`) fica só como referência.

### 3. Segurar a linha — jogável (`segurar.html`)
Heitor lidera o contra-ataque contra o acampamento; os gregos precisam ferir Heitor até ele recuar. Se Criseida foi tomada, Crises pede a filha e vem a peste, ou Agamêmnon toma Briseida e começa a ira de Aquiles: **Pátroclo** entra no lugar dele. Doc: `CENARIO-MISSAO-3.md`. A defesa antiga (`defesa.html`) fica só como referência.

### Pátroclo (só se Briseida for tomada)
Pátroclo não tem morte por roteiro: ele morre ou sobrevive em jogo. Se cair, não há socorro, e Aquiles volta movido pela ira. Se o jogador o mantiver vivo, Aquiles nunca volta. A embaixada de Odisseu ou Ájax sempre falha. Regra completa em `CENARIO-MISSAO-3.md`.

### 4. A ira de Aquiles — em desenho
Heitor fica diante do portão, e a equipe o isola dos reforços. A missão tem dois caminhos, decididos na missão 3:
- **Briseida foi tomada:** se Pátroclo ainda estiver vivo, ele enfrenta Heitor, e a morte dele é quase inevitável; ela traz Aquiles de volta para vingá-lo. Se Pátroclo sobreviver, Aquiles nunca volta, e Heitor cai pelas mãos dos outros heróis.
- **Briseida não foi tomada:** Pátroclo nunca entra. O encontro de Aquiles com Heitor é um duelo de egos: quem é o maior guerreiro.

Qualquer herói pode matar Heitor; o golpe final de Aquiles é o feito dele.

**Se Heitor não morrer** (decidido em 03/10/2026): a missão não é repetida. Como em *Jornadas na Terra-média*, falhar o objetivo torna a missão seguinte muito mais difícil: sem velório não há trégua, e Heitor vivo comanda a vigilância da cidade na missão 5. Heitor vivo também defende o portão na missão 7. A própria missão 4 é bem mais difícil que a 3: Heitor, mais forte, corre pela muralha de volta ao portão, um passo por rodada, com reforços todas as rodadas; se chegar, escapa. Atena, disfarçada de Deífobo, pode fazê-lo parar uma rodada (Favor). Doc: `CENARIO-MISSAO-4.md` (rascunho).

### Interlúdio — o resgate do corpo
Príamo pede o corpo de Heitor e começa a trégua do velório.

### 5. O Paládio — em desenho
Durante a trégua, Odisseu entra sozinho em Troia, disfarçado de mendigo, e rouba o Paládio. É de lá que ele traz a ideia do cavalo: a forma (Troia venera o cavalo), o motivo (expiar o roubo), a medida do portão e quem vai desconfiar. Os outros heróis ficam no acampamento, distraindo Troia e preparando a saída de Odisseu. Se Heitor estiver vivo, não há trégua e a missão fica perto de um fracasso. Com o Paládio fora de Troia, Atena deixa de proteger a cidade; o roubo também dá o motivo do cavalo (a oferenda para expiar o sacrilégio). Doc: `CENARIO-MISSAO-5.md` (rascunho).

### 6. Construir o cavalo — planejado
O plano exige uma construção convincente enquanto patrulhas ainda ameaçam a operação. Os heróis dividem-se entre trabalhar, buscar material e interceptar patrulhas. O cavalo aparece como peça removível em estágios. Nenhum herói específico deve ser obrigatório para construir. A madeira e os pergaminhos reunidos antes reduzem o trabalho; a coleta mínima sempre permite tentar. Sem doc de cenário ainda.

### Interlúdio — a falsa partida
A frota finge partir para Tênedos e deixa o cavalo na praia.

### 7. A noite do cavalo — planejado
Dois mapas em jogo ao mesmo tempo, com o mesmo Alarme: no mapa da cidade, os infiltrados saem do cavalo e abrem o portão; no mapa externo, a frota volta em silêncio e se aproxima sem ser descoberta. Vitória com o portão aberto e a força de fora chegando a ele. Sem o Paládio roubado, a missão fica mais difícil, mas continua jogável. Epílogo: a Glória registrada nos feitos e o destino de Aquiles (a profecia de que morrerá depois de Troia). Sem doc de cenário ainda.

## Decisões de 03/10/2026

- **Sete missões**, na ordem acima. A morte de Heitor vem antes do Paládio, como na tradição; o roubo do Paládio deixa de ser o que torna Heitor mortal.
- **Heitor** pode morrer na missão 4 pelas mãos de qualquer herói; o golpe final de Aquiles é o feito dele (Aquiles não é obrigatório na equipe).
- **Aquiles e Páris vivos até a missão 7.** Nenhuma morte por roteiro; sem julgamento das armas nem suicídio de Ájax.
- **Pátroclo** entra só se Agamêmnon tomar Briseida de Aquiles (missão 3, opção B), com a força inicial de Aquiles e uma habilidade. Morre sem socorro e, só então, Aquiles volta com tudo o que tinha. Vivo, Aquiles nunca volta. A embaixada sempre falha. Sem Briseida, o encontro de Aquiles com Heitor é um duelo de egos. Regra completa em `CENARIO-MISSAO-3.md`.
- **Missão 5 solo:** só Odisseu entra em Troia; os outros ficam no acampamento. Como a mesa participa ainda está em aberto.
- **Feitos a partir da missão 3:** +1 Favor e Glória (registro narrativo para o epílogo, sem efeito de regra). Ver `REGRAS-CAMPANHA.md`.
- **Suspeita** é o Alarme com outro nome, na missão 5.
- **Exploração por missão** no lugar da exploração por movimento. Ver `REGRAS-CAMPANHA.md`.
- **Missão 1:** P1 começa vazio e a vigia troiana fica em A1. Ver `CENARIO-MISSAO-1.md`.
- **Missão 1, a rendição da vigia:** o batedor substituto aparece descendo o morro quando o posto é descoberto; se chegar antes, Alarme +2 e ele fica no posto.
- **Falhar não repete a missão 4:** Heitor escapa correndo até o portão. Vivo, ele torna a missão 5 muito mais difícil (sem trégua, cidade vigiada por ele) e defende o portão na missão 7.
- **Zeus e a balança de ouro:** Zeus mostra a Pátroclo as recompensas de morrer de frente para Heitor (o dano fica em Heitor, a ira de Aquiles, +2 Favor, a glória de Pátroclo). Ver `CENARIO-MISSAO-3.md`.
- **As quatro descobertas de Odisseu** (a forma, garantida; o motivo; a medida; quem vai desconfiar) originam o cavalo. Os outros jogadores distraem Troia e preparam a saída. Ver `CENARIO-MISSAO-5.md`.
- **A ideia do cavalo vem de Odisseu,** trazida de dentro de Troia na missão 5. Os outros não buscam madeira nessa missão.

## Cronologia e tradição

| O jogo | A tradição |
|---|---|
| Desembarque e acampamento (1) | Desembarque nove anos antes da Ilíada; o jogo comprime o tempo |
| Reconhecimento do portão (2) | Invenção do jogo (a tradição tem uma embaixada de Odisseu e Menelau antes da guerra) |
| Criseida tomada no santuário (2) | Na Ilíada, capturada no saque de Tebas |
| Crises, peste, Briseida e ira (3) | Ilíada, canto 1; o jogo separa em opções |
| Heitor ataca o acampamento (3) | Batalha junto às naus, cantos 12 a 15 |
| Pátroclo joga no lugar de Aquiles e morre diante de Heitor | Canto 16; no jogo ele pode sobreviver, e aí Aquiles não volta |
| A embaixada a Aquiles sempre falha | Canto 9 |
| Morte de Heitor (4) | Canto 22, com Atena disfarçada de Deífobo |
| Resgate do corpo e trégua | Canto 24 |
| Odisseu mendigo e o Paládio (5) | Na tradição, duas incursões separadas, bem depois do velório e da morte de Aquiles e de Páris; o jogo junta as duas na trégua |
| Construção do cavalo (6) e noite do cavalo (7) | Epeu, Sínon, Laocoonte e o saque |
| Aquiles e Páris vivos até o fim | Na tradição, Páris mata Aquiles, e Filoctetes mata Páris, antes do cavalo |

## Validação antes das próximas artes

- Testar o Desembarque com três, quatro e cinco heróis, mantendo escolhas viáveis para todos os elencos.
- Medir rodadas, tempo real, ações ociosas, dificuldade de ler caminhos e frequência de derrotas. Não transformar rodadas simuladas em promessa de minutos de partida.
- Conferir em papel se miniaturas e marcadores cabem nas regiões; o tabuleiro digital ainda não determina tamanho físico.
- Só fechar cortes de peças e produzir a extensão de Troia (mapa da cidade) depois de validar as necessidades das missões 5 e 7.
