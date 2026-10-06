# Pergaminhos: saber que atravessa a campanha (proposta)

Status: **regras fechadas em 02/10/2026**. A programação entra junto com a reformulação das missões 2 e 3.

## A ideia

Inspirada nas cadeias de construção do *7 Wonders*: uma carta da era 1 dá acesso gratuito a outra na era 2, que dá acesso a outra na era 3. No Ilia, as **eras são as missões** e as cartas são **pergaminhos**: conhecimento que a expedição recolhe no território (mapas, tabuinhas de cera, relatos de pastores, segredos de Troia) e que só mostra o seu valor mais tarde.

O que muda no jogo: hoje toda busca paga na hora (comida, Alarme). Com os pergaminhos, algumas buscas são um **investimento**: custam agora (ação, barulho, risco) e rendem numa missão futura. Isso cria a escolha que faltava: *pegar o ganho imediato ou apostar no futuro?*

## Regras propostas

1. **Onde se encontram.** Algumas fichas de exploração escondem um pergaminho. Como as outras fichas, a pista não revela o que há ali (só Atena).
2. **A quem pertencem.** O pergaminho é da expedição, não de um herói. Fica registrado na campanha e passa de uma missão para a próxima. Na mesa, é uma carta física de pergaminho, ao lado do tabuleiro.
3. **As cadeias.** Cada pergaminho pertence a uma **linha** (por exemplo, "Rotas da costa") e tem um nível: I, II ou III.
   - O nível I se encontra numa busca comum.
   - O nível II só existe para quem tem o I da mesma linha: numa missão seguinte, ao investigar o lugar ligado àquela linha, a expedição o recebe **de graça**, sem gastar a busca extra. Quem não tem o I encontra ali algo menor.
   - O III segue a mesma lógica a partir do II.
4. **O efeito.** Cada pergaminho tem um efeito numa missão futura, nunca um bônus de atributo (essa regra continua valendo só para as cartas de N2 e N3). Exemplos de efeitos:
   - começar a missão com uma peça já revelada;
   - um reforço troiano chega uma rodada mais tarde;
   - uma rota alternativa (uma conexão nova entre peças);
   - um objetivo da missão fica mais fácil, ou ganha uma solução alternativa.
5. **A narrativa.** Quando um pergaminho entra em jogo, o app narra a ligação: *"As rotas que vocês copiaram da tabuinha do mensageiro mostram uma trilha entre os pinheiros que os troianos não vigiam."*
6. **Escassez.** Por missão, 2 ou 3 oportunidades de pergaminho, e não dá para pegar todas: a busca faz barulho, e algumas ficam longe ou guardadas.

## Linhas de exemplo (a definir com você)

| Linha | I (missão 1 ou 2) | II (missão 3 ou 4) | III (missão 5 ou 6) |
|---|---|---|---|
| **Rotas da costa** | Tabuinha das patrulhas (P2): começa a missão 2 com uma peça revelada | Mapa das trilhas: uma conexão secreta no bosque | Caminho do cavalo: o cavalo entra em Troia por uma rota sem guardas |
| **Segredos de Troia** | Relato do espião (o velho, se descoberto): revela a intenção oculta de um comandante | Planta das muralhas: o portão fraco de Troia | Senha da guarda: a infiltração da missão 6 começa sem alerta |
| **Favor dos pastores** | Esconderijo da trilha (P6): +1 comida no início da próxima missão | Aliança com os pastores: eles escondem a madeira do cavalo | Guia nativo: revela o atalho final |

(A ideia de usar "Rotas da costa" como espinha da antiga missão 4, "Outro caminho", saiu com a nova estrutura de sete missões.)

## Decisões (02/10/2026)

1. **Três linhas**: Rotas da costa, Segredos de Troia e Favor dos pastores. **Dois pergaminhos possíveis por missão**; nenhuma expedição pega todos, e cada campanha segue um caminho.
2. **O nível II exige achar um lugar específico** na missão seguinte. A narração do pergaminho anterior dá a pista ("a tabuinha fala de uma trilha entre os pinheiros"). O pergaminho vira um objetivo extra que disputa tempo com o objetivo principal.
3. **Na mesa, cartas próprias**: símbolo da linha e número I, II ou III, guardadas ao lado do tabuleiro entre as missões.
4. **Na missão 1**, a tabuinha das patrulhas (P2) deixa de dar Alarme −2 e vira **Rotas da costa I** (sem efeito imediato; na missão 2, uma peça já revelada). Rodar de novo as simulações de equilíbrio antes de fechar.

## Como implementar (depois de aprovado)

- No registro da campanha (`campaign-state.js`), uma lista de pergaminhos conquistados.
- Na missão 1, 1 ou 2 fichas passam a esconder um pergaminho de nível I.
- As missões 2 a 6, quando refeitas, leem a lista e aplicam os efeitos e os níveis II e III.

## Decisões de 03/10/2026

- **Os segredos de Odisseu são pergaminhos** da linha Segredos de Troia, não uma trilha separada. Na missão 5 (o Paládio), viraram as quatro descobertas que originam o cavalo (a forma, o motivo, a medida e quem vai desconfiar). Como elas se encaixam nos níveis da linha ainda será ajustado. Ver `CENARIO-MISSAO-5.md`.
- A campanha agora tem sete missões. A tabela de níveis por missão (I nas missões 1–2, II nas 3–4, III nas 5–6) precisa ser revista.
