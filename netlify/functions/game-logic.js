const POSITIONS = ['acampamento','planicie','muralhas','portoes'];
const DEFENSE_ORDER = ['fosso','torres','muralha'];
const ACTIONS_PER_SEASON = 2;

const CONTINGENT_TEMPLATES = {
  gregos: [
    {id:'hoste', name:'Hoste aqueia', icon:'⚔', role:'Avança pela rota central.', position:'acampamento', troops:5, attack:2, defense:1},
    {id:'forrageadores', name:'Forrageadores', icon:'🌾', role:'Busca suprimentos nas rotas laterais.', position:'celeiro', troops:3, attack:0, defense:1},
    {id:'reforcos', name:'Reforços navais', icon:'⛵', role:'Chega pelo porto com tropas e artefatos.', position:'porto', troops:3, attack:1, defense:1}
  ],
  troia: [
    {id:'guarnicao', name:'Guarnição das muralhas', icon:'🏛', role:'Protege a cidade e as defesas.', position:'muralhas', troops:5, attack:1, defense:2},
    {id:'pelotaoB', name:'Pelotão B', icon:'🛡', role:'Sai para disputar a Planície.', position:'cidadela', troops:3, attack:2, defense:1},
    {id:'missaoHitita', name:'Missão hitita', icon:'🐎', role:'Constrói a aliança pela rota diplomática.', position:'rota-hitita-1', troops:2, attack:0, defense:1}
  ]
};

const ROUTE_LABELS = {
  acampamento:'Acampamento', celeiro:'Celeiro', floresta:'Floresta', porto:'Porto',
  planicie:'Planície', muralhas:'Muralhas', portoes:'Portões', cidadela:'Cidadela',
  'rota-hitita-1':'Rota hitita I', 'rota-hitita-2':'Rota hitita II', fronteiraHitita:'Fronteira hitita'
};

const DECKS = {
  troia: {
    era1: [
      {kind:'Construção', name:'Torres de vigia', effect:'Ativa torres: +1 defesa nas muralhas e melhora estratagema', apply:s=>{s.defenseCards.torres=true; s.bonusDefesaTroia+=1;}},
      {kind:'Construção', name:'Fosso de contenção', effect:'Ativa fosso: +2 defesa até ser tampado', apply:s=>{s.defenseCards.fosso=true; s.bonusDefesaTroia+=1;}},
      {kind:'Construção', name:'Pedras do alto', effect:'Ativa pedras: Gregos sofrem baixa extra nas muralhas', apply:s=>{s.defenseCards.pedras=true; s.bonusDefesaTroia+=1;}},
      {kind:'Construção', name:'Portões selados', effect:'+1 bônus de defesa nos portões', apply:s=>{s.bonusDefesaTroia+=1; s.portoesSelados=true;}},
      {kind:'Recurso', name:'Celeiros reais', effect:'+6 suprimento em estoque', apply:s=>{s.suprimentoTroia+=6;}},
      {kind:'Recurso', name:'Poços internos', effect:'+4 suprimento em estoque', apply:s=>{s.suprimentoTroia+=4;}},
      {kind:'Recrutamento', name:'Guarnição da cidade', effect:'+3 tropas', apply:s=>{s.tropasTroia+=3;}},
      {kind:'Sabedoria', name:'Conselho dos sábios', effect:'Estratagema mais eficaz durante o cerco', apply:s=>{s.estratagemaForteTroia=true;}},
      {kind:'Estratégia', name:'Racionamento estrito', effect:'Troia consome 50% menos suprimento durante todo o cerco', apply:s=>{s.racionamentoAtivo=true;}}
    ],
    era2: [
      {kind:'Recrutamento', name:'Aliados da Anatólia', effect:'+3 tropas para a defesa de Troia', apply:s=>{s.tropasTroia+=3;}},
      {kind:'Favor divino', name:'Favor de Apolo', effect:'+1 bônus de defesa troiano', apply:s=>{s.bonusDefesaTroia+=1;}},
      {kind:'Recurso', name:'Rotas secretas de abastecimento', effect:'+5 suprimentos nos celeiros de Troia', apply:s=>{s.suprimentoTroia+=5;}},
      {kind:'Favor divino', name:'Encanto de Afrodite', effect:'+2 tropas troianas', apply:s=>{s.tropasTroia+=2;}},
      {kind:'Construção', name:'Engenharia de Hefesto', effect:'+1 bônus de defesa troiano', apply:s=>{s.bonusDefesaTroia+=1;}}
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
      {kind:'Favor divino', name:'Lança de Atena', effect:'+1 bônus de ataque adicional', apply:s=>{s.bonusAtaqueGregos+=1;}},
      {kind:'Favor divino', name:'Terremoto', effect:'Reduz o bônus de defesa troiano em 1', apply:s=>{s.bonusDefesaTroia=Math.max(0,s.bonusDefesaTroia-1);}},
      {kind:'Ritual', name:'Sacrifício a Posêidon', effect:'+2 tropas chegam prontas ao acampamento', apply:s=>{s.tropasGregos+=2;}},
      {kind:'Favor divino', name:'Marés favoráveis', effect:'+1 determinação inicial', apply:s=>{s.determinacao=(s.determinacao||5)+1;}},
      {kind:'Favor divino', name:'Aquiles retorna ao combate', effect:'+2 determinação inicial', apply:s=>{s.determinacao=(s.determinacao||5)+2;}}
    ]
  }
};

const ERA_ROUNDS = {era1:3, era2:2};
const TROIA_ACTIONS = ['avancar','recuar','reforcar','buscar','estratagema'];
const GREGOS_ACTIONS = ['avancar','recuar','reforcar','buscar','estratagema'];
const ACTION_LABEL = {
  avancar:'Avançar', recuar:'Recuar', atacar:'Atacar',
  reforcar:'Reforçar', buscar:'Buscar recursos', estratagema:'Estratagema'
};
const LOCATION_LABEL = {
  acampamento:'Acampamento Grego', planicie:'Planície',
  muralhas:'Muralhas de Troia', portoes:'Portões de Troia'
};

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function dmgTroops(){ return 1+Math.floor(Math.random()*2); }

function createContingents(side, stats){
  return CONTINGENT_TEMPLATES[side].map(template=>({
    ...template,
    troops: template.troops,
    maxTroops: template.troops,
    attack: template.attack + (side==='gregos' ? Math.floor((stats.bonusAtaqueGregos||0)/2) : 0),
    defense: template.defense + (side==='troia' ? Math.floor((stats.bonusDefesaTroia||0)/2) : 0),
    route: side==='gregos' && template.id==='forrageadores' ? 'resources' : side==='gregos' && template.id==='reforcos' ? 'reinforcements' : side==='troia' && template.id==='missaoHitita' ? 'hitites' : side==='troia' && template.id==='pelotaoB' ? 'troiaField' : 'central'
  }));
}

function contingentById(siege, side, id){
  return (siege.contingents && siege.contingents[side] || []).find(c=>c.id===id) || null;
}

function routeNext(side, contingent, direction){
  const routes = {
    central:['acampamento','planicie','muralhas','portoes'],
    resources:['celeiro','floresta','planicie'],
    reinforcements:['porto','rota-hitita-1','rota-hitita-2','planicie'],
    troiaField:['cidadela','muralhas','planicie'],
    hitites:['cidadela','rota-hitita-1','rota-hitita-2','fronteiraHitita']
  };
  const route = routes[contingent.route] || routes.central;
  const index = route.indexOf(contingent.position);
  if(index < 0) return contingent.position;
  return route[clamp(index + direction, 0, route.length-1)];
}

function positionForSide(siege, side){
  return (siege.contingents[side]||[]).map(c=>`${c.name} em ${ROUTE_LABELS[c.position]||c.position}`).join(', ');
}

function createEraStats(){
  return {
    bonusDefesaTroia:0,
    defenseCards:{fosso:false, torres:false, pedras:false, muralha:false},
    portoesSelados:false,
    estratagemaForteTroia:false,
    racionamentoAtivo:false,
    tropasTroia:8,
    suprimentoTroia:4,
    bonusAtaqueGregos:0,
    estratagemaForteGregos:false,
    tropasGregos:8,
    suprimentoGregos:4,
    determinacao:5
  };
}

function createRoom(code){
  return {
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    revision: 0,
    tokens: { troia: null, gregos: null },
    phase: 'lobby',
    eraStage: 'era1',
    eraRound: 1,
    eraStats: createEraStats(),
    deckUsed: { troia: [], gregos: [] },
    hands: { troia: [], gregos: [] },
    chosenCards: { troia: [], gregos: [] },
    eraPicks: { troia: null, gregos: null },
    lastEraReveal: null,
    siege: null,
    actionPicks: { troia: [], gregos: [] },
    lastActions: null
  };
}

function findCardDef(side, era, name){
  return DECKS[side][era].find(c => c.name === name);
}

function drawHand(room, side){
  const era = room.eraStage;
  const size = 2;
  const pool = DECKS[side][era].filter(c=>!room.deckUsed[side].includes(c.name));
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  room.hands[side] = shuffled.slice(0, Math.min(size, shuffled.length));
  room.hands[side].forEach(c=>{
    if(!room.deckUsed[side].includes(c.name)) room.deckUsed[side].push(c.name);
  });
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
  const def = findCardDef(side, room.eraStage, card.name);
  room.eraPicks[side] = {kind:def.kind, name:def.name, effect:def.effect};
  if(room.eraPicks.troia && room.eraPicks.gregos){
    if(!room.chosenCards) room.chosenCards = { troia:[], gregos:[] };
    ['troia','gregos'].forEach(pickedSide=>{
      const picked = room.eraPicks[pickedSide];
      const pickedDef = findCardDef(pickedSide, room.eraStage, picked.name);
      pickedDef.apply(room.eraStats);
      room.chosenCards[pickedSide].push({stage:room.eraStage, kind:picked.kind, name:picked.name});
    });
    room.lastEraReveal = { troia: room.eraPicks.troia, gregos: room.eraPicks.gregos };
    room.hands = { troia:[], gregos:[] };
    room.phase = 'era-reveal';
  }
}

function addLog(siege, html){
  if(!siege.cycleLogs) siege.cycleLogs = {};
  const c = siege.cycle;
  if(!siege.cycleLogs[c]) siege.cycleLogs[c] = [];
  const prefix = siege.phaseOfYear ? `<b>${siege.phaseOfYear}</b> — ` : '';
  siege.cycleLogs[c].push({html: prefix + html});
}

function createDefenses(stats){
  return {
    fosso: { label:'Fosso', active:!!stats.defenseCards.fosso, pressure:0, max:2, broken:false, defenseBonus:2 },
    torres: { label:'Torres', active:!!stats.defenseCards.torres, pressure:0, max:2, broken:false, defenseBonus:1 },
    muralha: { label:'Muralha', active:true, pressure:0, max:3, broken:false, defenseBonus:2 },
    pedras: { label:'Pedras do alto', active:!!stats.defenseCards.pedras, bonus:true }
  };
}

function activeDefenseBonus(siege){
  const structureBonus = DEFENSE_ORDER.reduce((sum,k)=>{
    const d = siege.defenses[k];
    return sum + (d && d.active && !d.broken ? (d.defenseBonus || 0) : 0);
  }, 0);
  return structureBonus + (siege.bonusDefesaTroia || 0);
}

function nextDefenseTarget(siege){
  return DEFENSE_ORDER.find(k => siege.defenses[k].active && !siege.defenses[k].broken) || null;
}

function addDefensePressure(siege, amount){
  const target = nextDefenseTarget(siege);
  if(!target || amount<=0) return null;
  const def = siege.defenses[target];
  def.pressure += amount;
  if(def.pressure >= def.max){
    def.pressure = def.max;
    def.broken = true;
    if(target === 'muralha'){
      siege.muralhaRompida = true;
      siege.determinacao = clamp(siege.determinacao+2, 0, siege.determinacaoMax);
      addLog(siege, `<span class="tag gregos">Gregos</span> rompem a muralha. A determinação sobe em 2, e o caminho aos portões fica aberto.`);
    } else {
      siege.determinacao = clamp(siege.determinacao+1, 0, siege.determinacaoMax);
      addLog(siege, `<span class="tag gregos">Gregos</span> neutralizam ${def.label.toLowerCase()}. A determinação sobe em 1.`);
    }
  }
  return target;
}

function reduceDefensePressure(siege){
  const candidates = DEFENSE_ORDER
    .map(k => [k, siege.defenses[k]])
    .filter(([,d]) => d.active && !d.broken && d.pressure > 0)
    .sort((a,b)=>b[1].pressure-a[1].pressure);
  if(!candidates.length) return null;
  candidates[0][1].pressure -= 1;
  return candidates[0][1].label;
}

function supplyCostTroia(siege){
  const base = Math.ceil(siege.tropasTroia/4);
  return siege.racionamentoAtivo ? Math.ceil(base*0.5) : base;
}

function supplyCostGregos(siege){
  return Math.ceil(siege.tropasGregos/4);
}

function supplyYears(supply, cost){
  if(cost <= 0) return 99;
  return Math.floor(supply / cost);
}

function greekForageGain(troops){
  if(troops >= 9) return 7;
  if(troops >= 5) return 5;
  return 3;
}

function resolveSupply(siege, season){
  const winter = season === 'Inverno';
  const consumoT = Math.max(1, Math.ceil(supplyCostTroia(siege) * (winter ? 1 : 0.5)));
  const consumoG = Math.max(1, Math.ceil(supplyCostGregos(siege) * (winter ? 1 : 0.5)));
  const seasonText = winter ? 'no inverno' : `em ${season}`;
  if(siege.suprimentoTroia < consumoT){
    const deficit = consumoT - siege.suprimentoTroia;
    siege.tropasTroia = Math.max(0, siege.tropasTroia-deficit);
    siege.suprimentoTroia = 0;
    addLog(siege, `<span class="tag troia">Troia</span> não sustenta seus estoques; a fome cobra ${deficit} soldado(s).`);
  } else {
    siege.suprimentoTroia -= consumoT;
    addLog(siege, `<span class="tag troia">Troia</span> consome ${consumoT} suprimento ${seasonText}.`);
  }
  if(siege.suprimentoGregos < consumoG){
    const deficit = consumoG - siege.suprimentoGregos;
    siege.tropasGregos = Math.max(0, siege.tropasGregos-deficit);
    siege.determinacao = clamp(siege.determinacao-1, 0, siege.determinacaoMax);
    siege.suprimentoGregos = 0;
    addLog(siege, `<span class="tag gregos">Gregos</span> falham na logística; ${deficit} homem(ns) se perdem e a determinação cai.`);
  } else {
    siege.suprimentoGregos -= consumoG;
    addLog(siege, `<span class="tag gregos">Gregos</span> consomem ${consumoG} suprimento ${seasonText}.`);
  }
}

function initSiege(room){
  const s = room.eraStats;
  const siege = {
    bonusDefesaTroia: s.bonusDefesaTroia,
    portoesSelados: s.portoesSelados,
    defenses: createDefenses(s),
    muralhaRompida: false,
    estratagemaForteTroia: s.estratagemaForteTroia,
    racionamentoAtivo: s.racionamentoAtivo,
    tropasTroia: s.tropasTroia,
    suprimentoTroia: s.suprimentoTroia,
    bonusAtaqueGregos: s.bonusAtaqueGregos,
    estratagemaForteGregos: s.estratagemaForteGregos,
    tropasGregos: s.tropasGregos,
    suprimentoGregos: s.suprimentoGregos,
    determinacao: clamp(s.determinacao, 0, 10),
    determinacaoMax: 10,
    cycle: 1,
    maneuver: 1,
    maneuversPerYear: 3,
    phaseOfYear: 'Primavera',
    greekPosition: 'acampamento',
    lastLocation: 'acampamento',
    contingents: {gregos:createContingents('gregos', s), troia:createContingents('troia', s)},
    objectives: {
      gregos:[
        {id:'nono-ano', label:'Tomar os Portões até o Ano 9', progress:0, target:9},
        {id:'pelotao-b', label:'Derrotar o Pelotão B', progress:0, target:1}
      ],
      troia:[
        {id:'sexto-ano', label:'Manter as Muralhas até o Ano 6', progress:0, target:6},
        {id:'hititas', label:'Concluir a aliança hitita', progress:0, target:3}
      ]
    },
    hititeProgress: 0,
    hititeBlockYears: 0,
    hititeContactThisYear: false,
    hititeRewards: {year1:false, year2:false, year3:false},
    seasonActions: {gregos:[], troia:[]},
    actionsPerSeason: ACTIONS_PER_SEASON,
    lastGreekAssaultTarget: null,
    cycleLogs: {},
    greekAttackedThisYear: false,
    gameOver: null,
    reason: null
  };
  if(siege.tropasGregos >= siege.tropasTroia*2){
    siege.determinacao = clamp(siege.determinacao+1, 0, siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> chegam com superioridade esmagadora; a confiança sobe antes do primeiro combate.`);
  }
  addLog(siege, `O cerco começa. Os Gregos partem do acampamento e precisam abrir caminho até os portões.`);
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

function moveGreek(siege, delta){
  const cur = POSITIONS.indexOf(siege.greekPosition);
  let next = clamp(cur + delta, 0, POSITIONS.length-1);
  if(POSITIONS[next] === 'portoes' && !siege.muralhaRompida) next = POSITIONS.indexOf('muralhas');
  siege.greekPosition = POSITIONS[next];
  siege.lastLocation = siege.greekPosition;
}

function resolveFieldBattle(siege, troiaReforcou, gregosReforcou){
  const greekPower = siege.tropasGregos + siege.bonusAtaqueGregos + (gregosReforcou ? 1 : 0);
  const troiaPower = siege.tropasTroia + (troiaReforcou ? 1 : 0);
  const ratio = troiaPower>0 ? greekPower/troiaPower : 99;
  const danoTroia = ratio>=0.8 ? Math.max(1, dmgTroops()+siege.bonusAtaqueGregos-1) : 1;
  const danoGregos = ratio<1.2 ? Math.max(1, dmgTroops()-1) : 1;
  siege.tropasTroia = Math.max(0, siege.tropasTroia-danoTroia);
  siege.tropasGregos = Math.max(0, siege.tropasGregos-danoGregos);
  if(ratio>=1.2){
    moveGreek(siege, 1);
    siege.determinacao = clamp(siege.determinacao+1, 0, siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> vencem na planície, avançam uma posição e causam ${danoTroia} baixa(s). Troia inflige ${danoGregos}.`);
  } else if(ratio<0.8){
    moveGreek(siege, -1);
    siege.determinacao = clamp(siege.determinacao-1, 0, siege.determinacaoMax);
    addLog(siege, `<span class="tag troia">Troia</span> segura a planície e força recuo grego. Gregos perdem ${danoGregos}; Troia perde ${danoTroia}.`);
  } else {
    addLog(siege, `A planície termina sem ruptura clara. Troia perde ${danoTroia}; Gregos perdem ${danoGregos}.`);
  }
}

function resolveWallAssault(siege, troiaAct, troiaReforcou, gregosReforcou){
  const target = nextDefenseTarget(siege);
  if(!target){
    siege.greekPosition = 'portoes';
    addLog(siege, `<span class="tag gregos">Gregos</span> atravessam as defesas e chegam aos portões.`);
    return;
  }
  if(troiaAct==='estratagema'){
    const anulado = siege.estratagemaForteTroia ? Math.random()<0.75 : Math.random()<0.5;
    if(anulado){
      siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
      moveGreek(siege, -1);
      addLog(siege, `Estratagema troiano desorganiza o assalto às muralhas. Os Gregos recuam e perdem 1 determinação.`);
      return;
    }
  }
  const defenseBonus = activeDefenseBonus(siege) * 0.12 + (siege.defenses.pedras.active ? 0.25 : 0) + (troiaReforcou ? 0.25 : 0);
  const greekPower = siege.tropasGregos + siege.bonusAtaqueGregos + (gregosReforcou ? 1 : 0);
  const troiaPower = siege.tropasTroia * (1 + defenseBonus);
  const ratio = troiaPower>0 ? greekPower/troiaPower : 99;
  let pressure = 0;
  if(ratio>=1.25) pressure = 2;
  else if(ratio>=0.75) pressure = 1;
  const insist = siege.lastGreekAssaultTarget === target && pressure > 0;
  if(insist) pressure += 1;
  const danoTroia = pressure ? Math.max(1, Math.floor((dmgTroops()+siege.bonusAtaqueGregos)/2)) : 0;
  const danoGregos = Math.max(1, (siege.defenses.pedras.active ? 1 : 0) + (ratio<0.75 ? dmgTroops() : 0));
  siege.tropasTroia = Math.max(0, siege.tropasTroia-danoTroia);
  siege.tropasGregos = Math.max(0, siege.tropasGregos-danoGregos);
  if(pressure){
    const label = siege.defenses[target].label;
    addDefensePressure(siege, pressure);
    siege.lastGreekAssaultTarget = target;
    addLog(siege, `<span class="tag gregos">Gregos</span> pressionam ${label.toLowerCase()} (${pressure} pressão). Troia perde ${danoTroia}; Gregos perdem ${danoGregos}.`);
  } else {
    moveGreek(siege, -1);
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `<span class="tag troia">Troia</span> repele o ataque às muralhas. Os Gregos perdem ${danoGregos}, recuam e a determinação cai.`);
  }
}

function resolveGateAssault(room, siege, troiaReforcou, gregosReforcou){
  const greekPower = siege.tropasGregos + siege.bonusAtaqueGregos + (gregosReforcou ? 1 : 0);
  const troiaPower = siege.tropasTroia + (troiaReforcou ? 2 : 0) + (siege.portoesSelados ? 2 : 0);
  const ratio = troiaPower>0 ? greekPower/troiaPower : 99;
  if(ratio>=0.9){
    const dano = Math.max(1, dmgTroops()+siege.bonusAtaqueGregos);
    siege.tropasTroia = Math.max(0, siege.tropasTroia-dano);
    siege.gameOver='gregos';
    siege.reason='portoes';
    room.phase='fim';
    addLog(siege, `<span class="tag gregos">Gregos</span> vencem nos portões e tomam Troia.`);
  } else {
    const dano = dmgTroops()+1;
    siege.tropasGregos = Math.max(0, siege.tropasGregos-dano);
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    siege.greekPosition = 'muralhas';
    addLog(siege, `<span class="tag troia">Troia</span> repele o ataque final. Gregos perdem ${dano}, recuam às muralhas e perdem determinação.`);
  }
}

function resolveCampRaid(siege, gregosAct){
  if(gregosAct==='buscar'){
    const gain = greekForageGain(siege.tropasGregos);
    const delivered = Math.ceil(gain/2);
    siege.suprimentoGregos += delivered;
    siege.suprimentoTroia += 3;
    siege.tropasGregos = Math.max(0, siege.tropasGregos-1);
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `<span class="tag troia">Troia</span> acerta a busca de recursos: os Gregos recebem só ${delivered}, Troia saqueia +3, os Gregos perdem 1 tropa e 1 determinação.`);
    return;
  }
  const dano = dmgTroops();
  siege.tropasGregos = Math.max(0, siege.tropasGregos-dano);
  siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
  addLog(siege, `<span class="tag troia">Troia</span> ataca o acampamento e causa ${dano} baixa(s). A determinação grega cai.`);
}

function resolveActionsLogic(room, siege, troiaAct, gregosAct){
  if(siege.contingents){
    resolveContingentRound(room, siege, troiaAct, gregosAct);
    return;
  }
  const troiaReforcou = troiaAct==='reforcar' && affordReforcar(siege,'troia');
  const gregosReforcou = gregosAct==='reforcar' && affordReforcar(siege,'gregos');
  if(troiaAct==='reforcar' && !troiaReforcou) addLog(siege, `<span class="tag troia">Troia</span> tenta reforçar, mas não há suprimento.`);
  if(gregosAct==='reforcar' && !gregosReforcou) addLog(siege, `<span class="tag gregos">Gregos</span> tentam consolidar posição, mas faltam recursos.`);
  if(troiaReforcou){
    const repaired = reduceDefensePressure(siege);
    addLog(siege, repaired ? `<span class="tag troia">Troia</span> reforça e remove 1 pressão de ${repaired.toLowerCase()}.` : `<span class="tag troia">Troia</span> reforça a posição deste ano.`);
  }
  if(gregosAct==='avancar'){
    moveGreek(siege, 1);
    addLog(siege, `<span class="tag gregos">Gregos</span> avançam para ${LOCATION_LABEL[siege.greekPosition]}.`);
  } else if(gregosAct==='recuar'){
    moveGreek(siege, -1);
    addLog(siege, `<span class="tag gregos">Gregos</span> recuam para ${LOCATION_LABEL[siege.greekPosition]}.`);
  } else if(gregosAct==='buscar' && troiaAct!=='atacar'){
    const gain = greekForageGain(siege.tropasGregos);
    siege.suprimentoGregos += gain;
    addLog(siege, `<span class="tag gregos">Gregos</span> dividem tropas para buscar recursos e recebem +${gain} suprimento.`);
  }
  if(gregosAct==='atacar') siege.greekAttackedThisYear = true;
  if(troiaAct==='atacar' && gregosAct==='buscar'){
    resolveCampRaid(siege, gregosAct);
  } else if(troiaAct==='atacar' && siege.greekPosition==='acampamento'){
    resolveCampRaid(siege, gregosAct);
  } else if(gregosAct==='atacar' && siege.greekPosition==='portoes'){
    resolveGateAssault(room, siege, troiaReforcou, gregosReforcou);
  } else if(gregosAct==='atacar' && siege.greekPosition==='muralhas'){
    resolveWallAssault(siege, troiaAct, troiaReforcou, gregosReforcou);
  } else if((troiaAct==='atacar' || gregosAct==='atacar') && siege.greekPosition==='planicie'){
    resolveFieldBattle(siege, troiaReforcou, gregosReforcou);
  } else if(troiaAct==='estratagema' && gregosAct==='avancar'){
    const chance = siege.estratagemaForteTroia ? 0.75 : 0.5;
    if(Math.random()<chance){
      moveGreek(siege, -1);
      siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
      addLog(siege, `<span class="tag troia">Troia</span> antecipa a marcha grega, força recuo e reduz a determinação.`);
    }
  } else if(gregosAct==='estratagema' && troiaAct==='atacar'){
    const chance = siege.estratagemaForteGregos ? 0.75 : 0.5;
    if(Math.random()<chance){
      siege.determinacao = clamp(siege.determinacao+1,0,siege.determinacaoMax);
      addLog(siege, `<span class="tag gregos">Gregos</span> antecipam a saída troiana. A determinação sobe.`);
    }
  }
  siege.lastLocation = siege.greekPosition;
}

function orderAction(order){ return typeof order === 'string' ? order : order && order.action; }
function orderContingent(order){ return typeof order === 'string' ? null : order && order.contingent; }

function resolveContingentRound(room, siege, troiaOrder, greekOrder){
  const orders = [{side:'troia',order:troiaOrder},{side:'gregos',order:greekOrder}];
  orders.forEach(({side,order})=>{
    const action = orderAction(order);
    const list = siege.contingents[side] || [];
    const contingent = contingentById(siege, side, orderContingent(order)) || list[0];
    if(!contingent || contingent.troops<=0) return;
    const dir = action==='recuar' ? -1 : action==='avancar' ? 1 : 0;
    if(dir){
      contingent.position = routeNext(side, contingent, dir);
      addLog(siege, `<span class="tag ${side}">${side==='troia'?'Troia':'Gregos'}</span> move ${contingent.name} para ${ROUTE_LABELS[contingent.position]||contingent.position}.`);
    }
    if(action==='buscar'){
      if(side==='gregos' && contingent.route==='resources' && ['celeiro','floresta'].includes(contingent.position)){
        siege.suprimentoGregos += 4;
        addLog(siege, `<span class="tag gregos">Gregos</span> recolhem +4 suprimentos com os Forrageadores.`);
      } else if(side==='troia' && contingent.route==='hitites' && contingent.position.startsWith('rota-hitita')){
        siege.hititeContactThisYear = true;
        addLog(siege, `<span class="tag troia">Troia</span> mantém contato com os Emissários de Hatti.`);
      }
    }
    if(action==='reforcar'){
      const field = side==='troia' ? 'suprimentoTroia' : 'suprimentoGregos';
      if(siege[field]>0){
        siege[field]-=1;
        if(side==='troia' && contingent.id==='guarnicao'){
          const repaired = reduceDefensePressure(siege);
          addLog(siege, repaired ? `<span class="tag troia">Troia</span> remove 1 pressão de ${repaired.toLowerCase()}.` : `<span class="tag troia">Troia</span> reforça a guarnição.`);
        } else if(side==='gregos' && contingent.id==='reforcos'){
          siege.tropasGregos += 1;
          contingent.troops += 1;
          addLog(siege, `<span class="tag gregos">Gregos</span> recebem 1 reforço do porto.`);
        }
      }
    }
  });

  const greek = (siege.contingents.gregos||[]).filter(c=>c.troops>0);
  const trojan = (siege.contingents.troia||[]).filter(c=>c.troops>0);
  const encounters = greek.flatMap(g=>trojan.filter(t=>t.position===g.position).map(t=>[g,t]));
  if(encounters.length) siege.greekAttackedThisYear = true;
  encounters.slice(0,1).forEach(([g,t])=>{
    const structural = ['muralhas','portoes'].includes(g.position) ? activeDefenseBonus(siege) : 0;
    const gp = g.troops + g.attack + siege.bonusAtaqueGregos;
    const tp = t.troops + t.defense + structural + siege.bonusDefesaTroia;
    if(gp >= tp){
      const loss = Math.max(1, Math.min(2, Math.ceil((gp-tp)/3)));
      t.troops = Math.max(0,t.troops-loss); siege.tropasTroia = Math.max(0,siege.tropasTroia-loss);
      if(t.id==='pelotaoB' && t.troops===0) siege.objectives.gregos[1].progress=1;
      addLog(siege, `<span class="tag gregos">Gregos</span> vencem o encontro em ${ROUTE_LABELS[g.position]||g.position} e causam ${loss} baixa(s).`);
    } else {
      const loss = Math.max(1, Math.min(2, Math.ceil((tp-gp)/3)));
      g.troops = Math.max(0,g.troops-loss); siege.tropasGregos = Math.max(0,siege.tropasGregos-loss);
      g.position = routeNext('gregos', g, -1);
      addLog(siege, `<span class="tag troia">Troia</span> segura ${ROUTE_LABELS[g.position]||g.position} e força ${g.name} a recuar.`);
    }
  });
  const hoste = contingentById(siege,'gregos','hoste');
  if(hoste) siege.greekPosition = hoste.position;
  if(hoste && hoste.position==='muralhas') addDefensePressure(siege, 1);
  if(siege.greekPosition==='portoes' && siege.muralhaRompida){
    siege.gameOver='gregos'; siege.reason='portoes'; room.phase='fim';
    addLog(siege, `<span class="tag gregos">Gregos</span> alcançam os portões de Troia.`);
  }
}

function finishYear(room){
  const siege = room.siege;
  siege.phaseOfYear = 'Inverno';
  resolveSupply(siege, 'Inverno');
  if(siege.cycle % 2 === 0){
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> completam dois anos longe de casa; a determinação cai em 1.`);
  }
  if(!siege.greekAttackedThisYear){
    siege.determinacao = clamp(siege.determinacao-1,0,siege.determinacaoMax);
    addLog(siege, `<span class="tag gregos">Gregos</span> passam o ano sem ataque relevante; os reis pressionam e a determinação cai.`);
  }
  resolveHititeYear(room);
  if(checkCollapse(room)) return;
  if(siege.cycle >= 6 && !siege.muralhaRompida){
    siege.gameOver='troia'; siege.reason='sexto-ano'; room.phase='fim';
    addLog(siege, `<span class="tag troia">Troia</span> mantém as muralhas até o sexto ano e vence por resistência.`);
    return;
  }
  if(siege.cycle >= 9 && siege.greekPosition!=='portoes'){
    siege.gameOver='troia'; siege.reason='nono-ano'; room.phase='fim';
    addLog(siege, `<span class="tag troia">Troia</span> sobrevive ao nono ano; o cerco grego perde sua última chance.`);
    return;
  }
  siege.cycle += 1;
  siege.maneuver = 1;
  siege.phaseOfYear = 'Primavera';
  siege.greekAttackedThisYear = false;
  room.phase = 'siege-pick';
}

function resolveHititeYear(room){
  const siege = room.siege;
  if(!siege.contingents) return;
  if(!siege.hititeRewards) siege.hititeRewards = {year1:false,year2:false,year3:false};
  const emissarios = contingentById(siege,'troia','missaoHitita');
  const greekBlocker = (siege.contingents.gregos||[]).some(c => c.troops>0 && ['rota-hitita-1','rota-hitita-2'].includes(c.position));
  if(greekBlocker){
    siege.hititeBlockYears = (siege.hititeBlockYears||0)+1;
    if(siege.hititeBlockYears >= 2 && siege.hititeProgress>0){
      siege.hititeProgress -= 1;
      siege.hititeBlockYears = 0;
      addLog(siege, `<span class="tag gregos">Gregos</span> mantêm a rota ocupada por dois anos; o progresso de Hatti recua 1 nível.`);
    } else {
      addLog(siege, `<span class="tag gregos">Gregos</span> bloqueiam a rota dos Emissários de Hatti.`);
    }
  } else if(siege.hititeContactThisYear) {
    siege.hititeBlockYears = 0;
    siege.hititeProgress = clamp(siege.hititeProgress+1,0,4);
    const level = siege.hititeProgress;
    if(level===1 && !siege.hititeRewards.year1){ siege.suprimentoTroia += 3; siege.hititeRewards.year1=true; addLog(siege, `<span class="tag troia">Troia</span> recebe +3 suprimentos de Hatti.`); }
    if(level===2 && !siege.hititeRewards.year2){ const troops=2; siege.suprimentoTroia += 0; siege.tropasTroia += troops; if(emissarios) emissarios.troops += troops; siege.hititeRewards.year2=true; addLog(siege, `<span class="tag troia">Troia</span> recebe ${troops} tropas que se juntam aos Emissários de Hatti.`); }
    if(level===3 && !siege.hititeRewards.year3){ siege.suprimentoTroia += 4; siege.hititeRewards.year3=true; addLog(siege, `<span class="tag troia">Troia</span> recebe +4 suprimentos de Hatti.`); }
    addLog(siege, `<span class="tag troia">Troia</span> mantém a rota de Hatti (${siege.hititeProgress}/4).`);
    if(siege.hititeProgress>=4){ siege.gameOver='troia'; siege.reason='hititas'; room.phase='fim'; addLog(siege, `<span class="tag troia">Troia</span> recebe o exército principal de Hatti e vence.`); }
  }
  siege.hititeContactThisYear = false;
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
    room.actionPicks = { troia:[], gregos:[] };
  }
}

function actionsFor(room, role){
  if(!room.siege) return role==='troia' ? TROIA_ACTIONS : GREGOS_ACTIONS;
  return role==='troia' ? TROIA_ACTIONS : GREGOS_ACTIONS;
}

function pickAction(room, side, action, contingentId){
  if(room.phase !== 'siege-pick') return;
  if(!Array.isArray(room.actionPicks[side])) room.actionPicks[side] = room.actionPicks[side] ? [room.actionPicks[side]] : [];
  if(room.actionPicks[side].length >= ACTIONS_PER_SEASON) return;
  if(!actionsFor(room, side).includes(action)) return;
  room.actionPicks[side].push({action, contingent:contingentId || CONTINGENT_TEMPLATES[side][0].id});
  if(room.actionPicks.troia.length >= ACTIONS_PER_SEASON && room.actionPicks.gregos.length >= ACTIONS_PER_SEASON){
    room.lastActions = {
      troia: room.actionPicks.troia,
      gregos: room.actionPicks.gregos,
      maneuver: room.siege.maneuver,
      phaseOfYear: room.siege.phaseOfYear,
      positionBefore: room.siege.greekPosition
    };
    room.phase = 'siege-reveal';
  }
}

function resolveCycle(room){
  if(room.phase !== 'siege-reveal') return;
  const siege = room.siege;
  const troiaOrders = Array.isArray(room.lastActions.troia) ? room.lastActions.troia : [room.lastActions.troia];
  const greekOrders = Array.isArray(room.lastActions.gregos) ? room.lastActions.gregos : [room.lastActions.gregos];
  const rounds = Math.max(troiaOrders.length, greekOrders.length);
  for(let i=0;i<rounds;i++) resolveActionsLogic(room, siege, troiaOrders[i] || 'reforcar', greekOrders[i] || 'avancar');
  room.lastActions.positionAfter = siege.greekPosition;
  room.lastActions.location = siege.lastLocation;
  room.actionPicks = { troia:[], gregos:[] };
  resolveSupply(siege, siege.phaseOfYear);
  if(checkCollapse(room)) return;
  if(siege.maneuver < siege.maneuversPerYear){
    siege.maneuver += 1;
    siege.phaseOfYear = ['Primavera','Verão','Outono'][siege.maneuver-1];
    room.phase = 'siege-pick';
  } else {
    finishYear(room);
  }
}

function restart(room){
  room.eraStage = 'era1';
  room.eraRound = 1;
  room.eraStats = createEraStats();
  room.deckUsed = { troia:[], gregos:[] };
  room.hands = { troia:[], gregos:[] };
  room.chosenCards = { troia:[], gregos:[] };
  room.eraPicks = { troia:null, gregos:null };
  room.lastEraReveal = null;
  room.siege = null;
  room.actionPicks = { troia:[], gregos:[] };
  room.lastActions = null;
  room.phase = 'lobby';
  startGame(room);
}

function publicSiegeInfo(siege){
  const tCost = supplyCostTroia(siege);
  const gCost = supplyCostGregos(siege);
  return {
    bonusDefesaTroia: activeDefenseBonus(siege),
    bonusDefesaBaseTroia: siege.bonusDefesaTroia || 0,
    defenses: siege.defenses,
    muralhaRompida: siege.muralhaRompida,
    tropasTroia: siege.tropasTroia, tropasTroiaMax: siege.tropasTroiaMax,
    suprimentoTroia: siege.suprimentoTroia,
    consumoTroia: tCost,
    anosSuprimentoTroia: supplyYears(siege.suprimentoTroia, tCost),
    tropasGregos: siege.tropasGregos, tropasGregosMax: siege.tropasGregosMax,
    suprimentoGregos: siege.suprimentoGregos,
    consumoGregos: gCost,
    anosSuprimentoGregos: supplyYears(siege.suprimentoGregos, gCost),
    bonusAtaqueGregos: siege.bonusAtaqueGregos,
    determinacao: siege.determinacao, determinacaoMax: siege.determinacaoMax,
    cycle: siege.cycle,
    maneuver: siege.maneuver,
    maneuversPerYear: siege.maneuversPerYear,
    actionsPerSeason: siege.actionsPerSeason || ACTIONS_PER_SEASON,
    phaseOfYear: siege.phaseOfYear,
    greekPosition: siege.greekPosition,
    contingents: siege.contingents || {gregos:[],troia:[]},
    objectives: siege.objectives || {gregos:[],troia:[]},
    hititeProgress: siege.hititeProgress || 0,
    cycleLogs: siege.cycleLogs || {},
    lastLocation: siege.lastLocation || null,
    gameOver: siege.gameOver,
    reason: siege.reason
  };
}

module.exports = {
  ERA_ROUNDS, TROIA_ACTIONS, GREGOS_ACTIONS, ACTION_LABEL, LOCATION_LABEL,
  createRoom, startGame, pickEraCard, advanceEraRound, pickAction, resolveCycle, restart,
  actionsFor, publicSiegeInfo
};
