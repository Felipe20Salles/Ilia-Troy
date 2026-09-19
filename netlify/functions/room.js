const { getStore, connectLambda } = require('@netlify/blobs');
const logic = require('./game-logic');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode(){
  let out = '';
  for(let i=0;i<5;i++) out += CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)];
  return out;
}

function genToken(){
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function json(obj, status=200){
  return { statusCode: status, headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) };
}

function opponentOf(role){
  return role === 'troia' ? 'gregos' : 'troia';
}

function aiEraIndex(room, side){
  const hand = room.hands[side] || [];
  if(!hand.length) return 0;
  const priorities = side === 'gregos'
    ? ['Recrutamento','Equipamento','Favor divino','Recurso','Sabedoria','Ritual']
    : ['Construção','Recurso','Recrutamento','Favor divino','Armadilha','Sabedoria','Estratégia'];
  let best = 0;
  let bestScore = -1;
  hand.forEach((card, index)=>{
    let score = priorities.length - priorities.indexOf(card.kind);
    if(card.name.includes('Racionamento')) score += 4;
    if(card.name.includes('Terremoto') || card.name.includes('Muralha')) score += 3;
    if(card.effect.includes('+')) score += 1;
    if(score > bestScore){ bestScore = score; best = index; }
  });
  return best;
}

function aiAction(room, side){
  const s = room.siege;
  const actions = logic.actionsFor(room, side);
  if(side === 'gregos'){
    const consumo = Math.ceil(s.tropasGregos/4);
    if(actions.includes('buscar') && s.suprimentoGregos <= consumo*2) return 'buscar';
    if(s.greekPosition === 'acampamento' && actions.includes('avancar')) return 'avancar';
    if(s.greekPosition === 'planicie' && actions.includes('avancar') && s.tropasGregos >= s.tropasTroia) return 'avancar';
    if((s.greekPosition === 'muralhas' || s.greekPosition === 'portoes') && actions.includes('atacar')) return 'atacar';
    if(actions.includes('reforcar') && s.suprimentoGregos > consumo + 1) return 'reforcar';
    if(actions.includes('avancar')) return 'avancar';
    return actions[0];
  }
  const pressure = s.defenses
    ? ['fosso','torres','muralha'].some(k => s.defenses[k] && s.defenses[k].pressure > 0 && !s.defenses[k].broken)
    : false;
  if(pressure && actions.includes('reforcar') && s.suprimentoTroia > 0) return 'reforcar';
  const consumoGregos = Math.ceil(s.tropasGregos/4);
  if(actions.includes('atacar') && (s.greekPosition === 'acampamento' || s.suprimentoGregos <= consumoGregos*2)) return 'atacar';
  if(actions.includes('estratagema') && (s.greekPosition === 'muralhas' || s.greekPosition === 'planicie')) return 'estratagema';
  return actions[0];
}

function runAi(room){
  if(!room.ai || !room.ai.enabled || room.phase === 'fim') return;
  const side = room.ai.role;
  if(room.phase === 'era-pick' && !room.eraPicks[side]){
    logic.pickEraCard(room, side, aiEraIndex(room, side));
  }
  if(room.phase === 'siege-pick' && room.siege && !room.actionPicks[side]){
    logic.pickAction(room, side, aiAction(room, side));
  }
}

async function checkAuth(store, code, role, token){
  if(!code || !role || !token) return { error:'Parâmetros ausentes.', status:400 };
  if(role !== 'troia' && role !== 'gregos') return { error:'Papel inválido.', status:400 };
  const room = await store.get(String(code).toUpperCase(), {type:'json'});
  if(!room) return { error:'Sala não encontrada.', status:404 };
  if(room.tokens[role] !== token) return { error:'Credenciais inválidas para esta sala.', status:403 };
  return { room };
}

function sanitize(room, role){
  const opponent = opponentOf(role);
  const out = {
    code: room.code,
    phase: room.phase,
    role,
    solo: !!(room.ai && room.ai.enabled),
    aiRole: room.ai && room.ai.enabled ? room.ai.role : null,
    roomFull: !!(room.tokens.troia && room.tokens.gregos),
    eraStage: room.eraStage,
    eraRound: room.eraRound,
    eraRoundsTotal: logic.ERA_ROUNDS[room.eraStage]
  };
  if(room.phase === 'era-pick' || room.phase === 'era-reveal'){
    const s = room.eraStats;
    out.resources = {
      bonusDefesaTroia: s.bonusDefesaTroia,
      defenseCards: s.defenseCards,
      portoesSelados: !!s.portoesSelados,
      racionamentoAtivo: !!s.racionamentoAtivo,
      tropasTroia: s.tropasTroia,
      suprimentoTroia: s.suprimentoTroia,
      bonusAtaqueGregos: s.bonusAtaqueGregos,
      tropasGregos: s.tropasGregos,
      suprimentoGregos: s.suprimentoGregos,
      chosenCards: room.chosenCards || {troia:[], gregos:[]}
    };
  }
  if(room.phase === 'era-pick'){
    out.picked = !!room.eraPicks[role];
    out.opponentPicked = !!room.eraPicks[opponent];
    out.pendingPreparation = room.eraPicks[role] || null;
    out.myHand = out.picked ? [] : (room.hands[role]||[]).map(c=>({kind:c.kind, name:c.name, effect:c.effect}));
  }
  if(room.phase === 'era-reveal'){
    out.reveal = room.lastEraReveal;
  }
  if(room.siege){
    out.siege = logic.publicSiegeInfo(room.siege);
  }
  if(room.phase === 'siege-pick'){
    out.actions = logic.actionsFor(room, role);
    out.picked = !!room.actionPicks[role];
    out.opponentPicked = !!room.actionPicks[opponent];
  }
  if(room.phase === 'siege-reveal'){
    out.lastActions = room.lastActions;
    out.location = room.lastActions.location || room.siege.lastLocation;
  }
  return out;
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    connectLambda(event);
    const store = getStore('guerra-de-troia-rooms');
    if(event.httpMethod === 'POST' && action === 'create'){
      let code;
      for(let tries=0; tries<10; tries++){
        code = genCode();
        const existing = await store.get(code, {type:'json'});
        if(!existing) break;
      }
      const room = logic.createRoom(code);
      const token = genToken();
      room.tokens.troia = token;
      await store.setJSON(code, room);
      return json({...sanitize(room, 'troia'), token});
    }

    if(event.httpMethod === 'POST' && action === 'create-solo'){
      const body = JSON.parse(event.body || '{}');
      const role = body.role === 'gregos' ? 'gregos' : 'troia';
      const aiRole = opponentOf(role);
      let code;
      for(let tries=0; tries<10; tries++){
        code = genCode();
        const existing = await store.get(code, {type:'json'});
        if(!existing) break;
      }
      const room = logic.createRoom(code);
      const token = genToken();
      room.tokens[role] = token;
      room.tokens[aiRole] = 'AI-' + genToken();
      room.ai = { enabled:true, role:aiRole };
      logic.startGame(room);
      runAi(room);
      await store.setJSON(code, room);
      return json({...sanitize(room, role), token});
    }

    if(event.httpMethod === 'POST' && action === 'join'){
      const body = JSON.parse(event.body || '{}');
      const code = (body.code || '').toUpperCase().trim();
      if(!code) return json({error:'Código obrigatório.'}, 400);
      const room = await store.get(code, {type:'json'});
      if(!room) return json({error:'Sala não encontrada.'}, 404);
      if(room.tokens.gregos) return json({error:'Sala já está cheia.'}, 409);
      const token = genToken();
      room.tokens.gregos = token;
      room.updatedAt = Date.now();
      await store.setJSON(room.code, room);
      return json({...sanitize(room, 'gregos'), token});
    }

    if(event.httpMethod === 'GET' && action === 'state'){
      const auth = await checkAuth(store, params.code, params.role, params.token);
      if(auth.error) return json(auth, auth.status);
      return json(sanitize(auth.room, params.role));
    }

    if(event.httpMethod === 'POST'){
      const body = JSON.parse(event.body || '{}');
      const auth = await checkAuth(store, body.code, body.role, body.token);
      if(auth.error) return json(auth, auth.status);
      const room = auth.room;
      const role = body.role;

      if(action === 'start'){
        if(!room.tokens.troia || !room.tokens.gregos) return json({error:'Aguardando o segundo jogador entrar na sala.'}, 400);
        logic.startGame(room);
      } else if(action === 'pick-era'){
        logic.pickEraCard(room, role, body.index);
        runAi(room);
      } else if(action === 'advance-era'){
        logic.advanceEraRound(room);
        runAi(room);
      } else if(action === 'pick-action'){
        logic.pickAction(room, role, body.choice);
        runAi(room);
      } else if(action === 'resolve-cycle'){
        logic.resolveCycle(room);
        runAi(room);
      } else if(action === 'restart'){
        logic.restart(room);
        runAi(room);
      } else {
        return json({error:'Ação desconhecida.'}, 400);
      }

      room.updatedAt = Date.now();
      await store.setJSON(room.code, room);
      return json(sanitize(room, role));
    }

    return json({error:'Requisição inválida.'}, 400);
  } catch(err){
    return json({error: err.message || 'Erro interno.'}, 500);
  }
};
