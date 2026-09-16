const DECKS = {
  troia: {
    era1: [
      {kind:'Construção', name:'Muralha de pedra', effect:'+2 resistência estrutural', apply:s=>{s.resistenciaEstrutural+=2;}},
      {kind:'Construção', name:'Torres de vigia', effect:'+2 resistência estrutural', apply:s=>{s.resistenciaEstrutural+=2;}},
      {kind:'Construção', name:'Fosso de contenção', effect:'+1 resistência estrutural', apply:s=>{s.resistenciaEstrutural+=1;}},
      {kind:'Construção', name:'Pedras do alto', effect:'+1 resistência estrutural', apply:s=>{s.resistenciaEstrutural+=1;}},
      {kind:'Recurso', name:'Celeiros reais', effect:'+6 suprimento em estoque', apply:s=>{s.suprimentoTroia+=6;}},
      {kind:'Recurso', name:'Poços internos', effect:'+4 suprimento em estoque', apply:s=>{s.suprimentoTroia+=4;}},
      {kind:'Recrutamento', name:'Guarnição da cidade', effect:'+3 tropas', apply:s=>{s.tropasTroia+=3;}},
      {kind:'Sabedoria', name:'Conselho dos sábios', effect:'Estratagema mais eficaz durante o cerco', apply:s=>{s.estratagemaForteTroia=true;}},
      {kind:'Estratégia', name:'Racionamento estrito', effect:'Consumo de suprimento reduzido em 30% durante todo o cerco', apply:s=>{s.racionamentoAtivo=true;}}
    ],
    era2: [
      {kind:'Armadilha', name:'Armadilhas na praia', effect:'Gregos perdem 2 tropas na travessia', apply:s=>{s.tropasGregos=Math.max(0,s.tropasGregos-2);}},
      {kind:'Favor divino', name:'Favor de Apolo', effect:'+1 resistência estrutural', apply:s=>{s.resistenciaEstrutural+=1;}},
      {kind:'Armadilha', name:'Emboscada noturna', effect:'Gregos perdem 1 tropa, Troia ganha 2 suprimento', apply:s=>{s.tropasGregos=Math.max(0,s.tropasGregos-1); s.suprimentoTroia+=2;}}
    ]
  },
  gregos: {
    era1: [
      {kind:'Recrutamento', name:'Recrutas de Micenas', effect:'+3 tropas', apply:s=>{s.tropasGregos+=3;}},
      {kind:'Recurso', name:'Grão de Ftia', effect:'+5 suprimento em estoque', apply:s=>{s.suprimentoGregos+=5;}},
      {kind:'Sabedoria', name:'Conselho de Nestor', effect:'Estratagema mais eficaz durante o cerco', apply:s=>{s.estratagemaForteGregos=true;}},
      {kind:'Recrutamento', name:'Mirmidões de Ftia', effect:'+4 tropas', apply:s=>{s.tropasGregos+=4;}},
      {kind:'Equipamento', name:'Forjas de bronze', effect:'+1 bônus de ataque permanente', apply:s=>{s.bonusAtaqueGregos+=1;}},
      {kind:'Recrutamento', name:'Contingente de Salamina', effect:'+2 tropas', apply:s=>{s.tropasGregos+=2;}}
    ],
    era2: [
      {kind:'Equipamento', name:'Aríete de guerra', effect:'+1 bônus de ataque adicional', apply:s=>{s.bonusAtaqueGregos+=1;}},
      {kind:'Equipamento', name:'Torres de cerco', effect:'Reduz a resistência estrutural de Troia em 1', apply:s=>{s.resistenciaEstrutural=Math.max(0,s.resistenciaEstrutural-1);}},
      {kind:'Ritual', name:'Sacrifício a Posêidon', effect:'+2 tropas (travessia segura)', apply:s=>{s.tropasGregos+=2;}},
      {kind:'Favor divino', name:'Marés favoráveis', effect:'+1 determinação inicial', apply:s=>{s.determinacao=(s.determinacao||2)+1;}},
      {kind:'Favor divino', name:'Aquiles retorna ao combate', effect:'+2 determinação inicial', apply:s=>{s.determinacao=(s.determinacao||2)+2;}}
    ]
  }
};

const ERA_ROUNDS = {era1:5, era2:3};
const TROIA_ACTIONS = ['atacar','reforcar','estratagema'];
const GREGOS_ACTIONS = ['atacar','reforcar','buscar','estratagema'];
const ACTION_LABEL = {atacar:'Atacar', reforcar:'Reforçar', buscar:'Buscar recursos', estratagema:'Estratagema'};
const LOCATION_LABEL = {muralhas:'Muralhas de Troia', planicie:'Planície', acampamento:'Acampamento Grego'};

function determineLocation(troiaAct, gregosAct){
  if(troiaAct==='atacar' && gregosAct==='atacar') return 'planicie';
  if(gregosAct==='atacar') return 'muralhas';
  if(troiaAct==='atacar') return 'acampamento';
  return null;
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function dmgTroops(){ return 2+Math.floor(Math.random()*2); }

function createEraStats(){
  return {resistenciaEstrutural:0,estratagemaForteTroia:false,racionamentoAtivo:false,tropasTroia:8,suprimentoTroia:4,bonusAtaqueGregos:0,estratagemaForteGregos:false,tropasGregos:8,suprimentoGregos:4,determinacao:2};
}

function createRoom(code){
  return {
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tokens: { troia: null, gregos: null },
    phase: 'lobby',
    eraStage: 'era1',
    eraRound: 1,
    eraStats: createEraStats(),
    deckUsed: { troia: [], gregos: [] },
    hands: { troia: [], gregos: [] },
    eraPicks: { troia: null, gregos: null },
    lastEraReveal: null,
    siege: null,
    actionPicks: { troia: null, gregos: null },
    lastActions: null
  };
}

function findCardDef(side, era, name){
  return DECKS[side][era].find(c => c.name === name);
}

function drawHand(room, side){
  const era = room.eraStage;
  const size = era==='era1' ? 3 : 2;
  const pool = DECKS[side][era].filter(c=>!room.deckUsed[side].includes(c.name));
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  room.hands[side] = shuffled.slice(0, Math.min(size, shuffled.length));
}

function dealEraHands(room){
  drawHand(room,'troia');
  drawHand(room,'gregos');
  room.eraPicks = { troia:null, gregos:null };
}

function startGame(room){
  if(room.phase !== 'lobby') return;
  room.phase = 'era-pick';
  dealEraHands(room);
}

function pickEraCard(room, side, index){
  if(room.phase !== 'era-pick') return;
  if(room.eraPicks[side]) return;
  const hand = room.hands[side];
  const card = hand[index];
  if(!card) return;
  room.deckUsed[side].push(card.name);
  const def = findCardDef(side, room.eraStage, card.name);
  def.apply(room.eraStats);
  room.eraPicks[side] = {kind:def.kind, name:def.name, effect:def.effect};
  if(room.eraPicks.troia && room.eraPicks.gregos){
    room.lastEraReveal = { troia: room.eraPicks.troia, gregos: room.eraPicks.gregos };
    room.hands = { troia:[], gregos:[] };
    room.phase = 'era-reveal';
  }
}

function addLog(siege, html){
  const c = siege.cycle;
  if(!siege.cycleLogs[c]) siege.cycleLogs[c] = [];
  siege.cycleLogs[c].push({html});
}

function resolveSupply(siege){
  let consumoT = Math.ceil(siege.tropasTroia/3);
  const consumoG = Math.ceil(siege.tropasGregos/3);
  if(siege.racionamentoAtivo) consumoT = Math.ceil(consumoT*0.7);
  siege.suprimentoGregos += 1;
  if(siege.suprimentoTroia < consumoT){
    const deficit = consumoT - siege.suprimentoTroia;
    siege.tropasTroia = Math.max(0, siege.tropasTroia-deficit);
    siege.suprimentoTroia = 0;
    addLog(siege, `<span class="tag troia">Troia</span> — o estoque não é mais reabastecido de fora; a fome cobra ${deficit} soldado(s).`);
  } else {
    siege.suprimentoTroia -= consumoT;
    addLog(siege, `<span class="tag troia">Troia</span> — a cidade ainda vive do que armazenou antes do cerco começar.`);
  }
  if(siege.suprimentoGregos < consumoG){
    const deficit = consumoG - siege.suprimentoGregos;
    siege.tropasGregos = Math.max(0, siege.tropasGregos-deficit);
    siege.determinacao = clamp(siege.determinacao-1, 0, siege.determinacaoMax);
    siege.suprimentoGregos = 0;
    addLog(siege, `<span class="tag gregos">Gregos</span> — falta suprimento mesmo com os navios de reforço; ${deficit} homem(ns) perdido(s), a moral cai.`);
  } else {
    siege.suprimentoGregos -= consumoG;
    addLog(siege, `<span class="tag gregos">Gregos</span> — os navios seguem trazendo o mínimo necessário.`);
  }
  if(siege.ociosidadeGregos>=2){
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> — homens longe de casa, sem combate há tempos, começam a duvidar da guerra.`);
  }
}

function initSiege(room){
  const s = room.eraStats;
  const siege = {
    resistenciaEstrutural: s.resistenciaEstrutural,
    estratagemaForteTroia: s.estratagemaForteTroia,
    racionamentoAtivo: s.racionamentoAtivo,
    tropasTroia: s.tropasTroia,
    suprimentoTroia: s.suprimentoTroia,
    bonusAtaqueGregos: s.bonusAtaqueGregos,
    estratagemaForteGregos: s.estratagemaForteGregos,
    tropasGregos: s.tropasGregos,
    suprimentoGregos: s.suprimentoGregos,
    determinacao: clamp(s.determinacao, 0, 16),
    determinacaoMax: 16,
    ociosidadeGregos: 0,
    cycle: 1,
    cycleLogs: {},
    lastLocation: null,
    gameOver: null,
    reason: null
  };
  if(siege.tropasGregos >= siege.tropasTroia*2){
    siege.determinacao = clamp(siege.determinacao+1, 0, siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> — o exército reunido é esmagadoramente superior; a confiança sobe antes mesmo do primeiro combate.`);
  }
  addLog(siege, `As primeiras tropas gregas tocam a praia. O cerco de Troia começa — resistência estrutural fixada em ${siege.resistenciaEstrutural}.`);
  resolveSupply(siege);
  siege.tropasTroiaMax = siege.tropasTroia;
  siege.tropasGregosMax = siege.tropasGregos;
  room.siege = siege;
  checkCollapse(room);
}

function checkCollapse(room){
  const s = room.siege;
  if(s.tropasTroia<=0){ s.gameOver='gregos'; s.reason='tropas'; room.phase='fim'; return true; }
  if(s.tropasGregos<=0){ s.gameOver='troia'; s.reason='tropas'; room.phase='fim'; return true; }
  if(s.determinacao<=0){ s.gameOver='troia'; s.reason='moral'; room.phase='fim'; return true; }
  return false;
}

function affordReforcar(siege, side){
  const field = side==='troia' ? 'suprimentoTroia' : 'suprimentoGregos';
  if(siege[field]>=1){ siege[field]-=1; return true; }
  return false;
}

function assaultCamp(siege, ratio, bonusDano){
  bonusDano = bonusDano || 0;
  if(ratio >= 1.5){
    const dano = dmgTroops()+2+bonusDano;
    siege.tropasGregos = Math.max(0, siege.tropasGregos-dano);
    return `Com ampla superioridade numérica, Troia arrasa o acampamento grego — ${dano} baixa(s) grega(s).`;
  }
  if(ratio >= 0.8){
    const dano = Math.max(0, dmgTroops()+bonusDano);
    siege.tropasGregos = Math.max(0, siege.tropasGregos-dano);
    return `Troia ataca o acampamento grego em um confronto parelho — ${dano} baixa(s) grega(s).`;
  }
  const contraDano = dmgTroops();
  siege.tropasTroia = Math.max(0, siege.tropasTroia-contraDano);
  siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
  return `Em menor número mesmo atacando, Troia é repelida do acampamento grego — ${contraDano} baixa(s) troiana(s).`;
}

function resolveActionsLogic(siege, troiaAct, gregosAct){
  const troiaReforcou = troiaAct==='reforcar' && affordReforcar(siege,'troia');
  const gregosReforcou = gregosAct==='reforcar' && affordReforcar(siege,'gregos');
  if(troiaAct==='reforcar' && !troiaReforcou) addLog(siege, `<span class="tag troia">Troia</span> tenta reforçar, mas não há suprimento — a fortificação não melhora este ciclo.`);
  if(gregosAct==='reforcar' && !gregosReforcou) addLog(siege, `<span class="tag gregos">Gregos</span> tentam consolidar posição, mas faltam recursos.`);

  const location = determineLocation(troiaAct, gregosAct);
  siege.lastLocation = location;

  if(location === 'muralhas'){
    const tempBonus = troiaReforcou ? 1 : 0;
    if(troiaAct==='estratagema'){
      const anulado = siege.estratagemaForteTroia ? Math.random()<0.75 : Math.random()<0.5;
      if(anulado){
        siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
        addLog(siege, `Espiões troianos previram o ataque grego às muralhas — o assalto se dissolve, e o fracasso abala a moral do acampamento.`);
      } else {
        const lt = dmgTroops();
        siege.tropasTroia = Math.max(0, siege.tropasTroia-lt);
        addLog(siege, `A previsão falha — o ataque grego às muralhas ainda causa ${lt} baixa(s) troiana(s).`);
      }
    } else {
      const mult = 1 + (siege.resistenciaEstrutural + tempBonus)*0.2;
      const defesaEfetiva = siege.tropasTroia * mult;
      const ratio = defesaEfetiva>0 ? siege.tropasGregos/defesaEfetiva : 99;
      if(ratio>=1.5){
        const dano = dmgTroops()+siege.bonusAtaqueGregos+2;
        siege.tropasTroia = Math.max(0, siege.tropasTroia-dano);
        siege.resistenciaEstrutural = Math.max(0, siege.resistenciaEstrutural-1);
        siege.determinacao = clamp(siege.determinacao+1,0,siege.determinacaoMax);
        addLog(siege, `Com força esmagadora, os gregos rompem um trecho da muralha — ${dano} baixa(s) troiana(s), a estrutura se degrada permanentemente.`);
      } else if(ratio>=0.8){
        const dano = Math.max(1, Math.floor((dmgTroops()+siege.bonusAtaqueGregos)/2));
        siege.tropasTroia = Math.max(0, siege.tropasTroia-dano);
        addLog(siege, `Um assalto equilibrado contra as muralhas troianas — ${dano} baixa(s), mas a estrutura resiste.`);
      } else {
        const contraDano = dmgTroops()+tempBonus;
        siege.tropasGregos = Math.max(0, siege.tropasGregos-contraDano);
        siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
        addLog(siege, `"Um homem na muralha vale por dez" — o ataque grego é repelido com ${contraDano} baixa(s) e um golpe na moral.`);
      }
    }
  } else if(location === 'planicie'){
    const danoTroia = dmgTroops()+siege.bonusAtaqueGregos+1;
    const danoGregos = Math.max(1, dmgTroops()-1);
    siege.tropasTroia = Math.max(0, siege.tropasTroia-danoTroia);
    siege.tropasGregos = Math.max(0, siege.tropasGregos-danoGregos);
    if(danoTroia > danoGregos) siege.determinacao = clamp(siege.determinacao+1,0,siege.determinacaoMax);
    else if(danoGregos > danoTroia) siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `Na planície diante da cidade, os exércitos se enfrentam a céu aberto — a força bruta grega custa ${danoTroia} baixa(s) troiana(s), enquanto Troia resiste e inflige ${danoGregos} baixa(s) grega(s).`);
  } else if(location === 'acampamento'){
    const ratio = siege.tropasGregos>0 ? siege.tropasTroia/siege.tropasGregos : 99;
    if(gregosAct==='estratagema'){
      const anulado = siege.estratagemaForteGregos ? Math.random()<0.75 : Math.random()<0.5;
      if(anulado){
        siege.determinacao = clamp(siege.determinacao+1,0,siege.determinacaoMax);
        addLog(siege, `Odisseu antecipa a manobra troiana — a investida ao acampamento se perde, e a confiança do acampamento cresce.`);
      } else {
        addLog(siege, `A antecipação grega falha. ${assaultCamp(siege, ratio, 0)}`);
      }
    } else if(gregosAct==='buscar'){
      const saque = Math.floor(siege.suprimentoGregos/3);
      siege.suprimentoGregos -= saque; siege.suprimentoTroia += saque;
      siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
      addLog(siege, `Com metade do exército grego fora buscando recursos, Troia ataca o acampamento exposto (saque de ${saque} suprimento). ${assaultCamp(siege, ratio, 2)}`);
    } else if(gregosReforcou){
      addLog(siege, `O acampamento reforçado resiste melhor do que o esperado. ${assaultCamp(siege, ratio-0.3, 0)}`);
    } else {
      addLog(siege, assaultCamp(siege, ratio, 0));
    }
  } else {
    if(troiaAct==='reforcar' && gregosAct==='reforcar'){
      addLog(siege, `Ciclo sem confronto direto — os dois lados recuperam o fôlego.`);
    } else if(gregosAct==='buscar'){
      const ganho = Math.ceil(siege.tropasGregos/2);
      siege.suprimentoGregos += ganho;
      addLog(siege, `Navios gregos retornam da costa com +${ganho} suprimento.`);
    } else {
      addLog(siege, `Ciclo tenso, sem grandes movimentos.`);
    }
  }
  siege.ociosidadeGregos = gregosAct==='atacar' ? 0 : siege.ociosidadeGregos+1;
}

function advanceEraRound(room){
  if(room.phase !== 'era-reveal') return;
  room.lastEraReveal = null;
  if(room.eraRound < ERA_ROUNDS[room.eraStage]){
    room.eraRound += 1;
    room.phase = 'era-pick';
    dealEraHands(room);
  } else if(room.eraStage === 'era1'){
    room.eraStage = 'era2';
    room.eraRound = 1;
    room.phase = 'era-pick';
    dealEraHands(room);
  } else {
    initSiege(room);
    if(room.phase !== 'fim') room.phase = 'siege-pick';
    room.actionPicks = { troia:null, gregos:null };
  }
}

function pickAction(room, side, action){
  if(room.phase !== 'siege-pick') return;
  if(room.actionPicks[side]) return;
  room.actionPicks[side] = action;
  if(room.actionPicks.troia && room.actionPicks.gregos){
    room.lastActions = { troia: room.actionPicks.troia, gregos: room.actionPicks.gregos };
    room.phase = 'siege-reveal';
  }
}

function resolveCycle(room){
  if(room.phase !== 'siege-reveal') return;
  const siege = room.siege;
  resolveActionsLogic(siege, room.lastActions.troia, room.lastActions.gregos);
  room.lastActions = null;
  room.actionPicks = { troia:null, gregos:null };
  if(checkCollapse(room)) return;
  siege.cycle += 1;
  resolveSupply(siege);
  if(checkCollapse(room)) return;
  room.phase = 'siege-pick';
}

function restart(room){
  room.eraStage = 'era1';
  room.eraRound = 1;
  room.eraStats = createEraStats();
  room.deckUsed = { troia:[], gregos:[] };
  room.hands = { troia:[], gregos:[] };
  room.eraPicks = { troia:null, gregos:null };
  room.lastEraReveal = null;
  room.siege = null;
  room.actionPicks = { troia:null, gregos:null };
  room.lastActions = null;
  room.phase = 'lobby';
  startGame(room);
}

module.exports = {
  ERA_ROUNDS, TROIA_ACTIONS, GREGOS_ACTIONS, ACTION_LABEL, LOCATION_LABEL,
  createRoom, startGame, pickEraCard, advanceEraRound, pickAction, resolveCycle, restart,
  determineLocation
};
