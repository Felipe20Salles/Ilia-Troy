const { getStore } = require('@netlify/blobs');
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

async function checkAuth(store, code, role, token){
  if(!code || !role || !token) return { error:'Parâmetros ausentes.', status:400 };
  if(role !== 'troia' && role !== 'gregos') return { error:'Papel inválido.', status:400 };
  const room = await store.get(String(code).toUpperCase(), {type:'json'});
  if(!room) return { error:'Sala não encontrada.', status:404 };
  if(room.tokens[role] !== token) return { error:'Credenciais inválidas para esta sala.', status:403 };
  return { room };
}

function sanitize(room, role){
  const opponent = role==='troia' ? 'gregos' : 'troia';
  const out = {
    code: room.code,
    phase: room.phase,
    role,
    roomFull: !!(room.tokens.troia && room.tokens.gregos),
    eraStage: room.eraStage,
    eraRound: room.eraRound,
    eraRoundsTotal: logic.ERA_ROUNDS[room.eraStage]
  };
  if(room.phase === 'era-pick'){
    out.picked = !!room.eraPicks[role];
    out.opponentPicked = !!room.eraPicks[opponent];
    out.myHand = out.picked ? [] : (room.hands[role]||[]).map(c=>({kind:c.kind, name:c.name, effect:c.effect}));
  }
  if(room.phase === 'era-reveal'){
    out.reveal = room.lastEraReveal;
  }
  if(room.siege){
    const s = room.siege;
    out.siege = {
      resistenciaEstrutural: s.resistenciaEstrutural,
      tropasTroia: s.tropasTroia, tropasTroiaMax: s.tropasTroiaMax,
      suprimentoTroia: s.suprimentoTroia,
      tropasGregos: s.tropasGregos, tropasGregosMax: s.tropasGregosMax,
      suprimentoGregos: s.suprimentoGregos,
      bonusAtaqueGregos: s.bonusAtaqueGregos,
      determinacao: s.determinacao, determinacaoMax: s.determinacaoMax,
      cycle: s.cycle,
      log: s.log,
      gameOver: s.gameOver,
      reason: s.reason
    };
  }
  if(room.phase === 'siege-pick'){
    out.actions = role==='troia' ? logic.TROIA_ACTIONS : logic.GREGOS_ACTIONS;
    out.picked = !!room.actionPicks[role];
    out.opponentPicked = !!room.actionPicks[opponent];
  }
  if(room.phase === 'siege-reveal'){
    out.lastActions = room.lastActions;
  }
  return out;
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
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
      return json({ code, role:'troia', token });
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
      return json({ code: room.code, role:'gregos', token });
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
      } else if(action === 'advance-era'){
        logic.advanceEraRound(room);
      } else if(action === 'pick-action'){
        logic.pickAction(room, role, body.choice);
      } else if(action === 'resolve-cycle'){
        logic.resolveCycle(room);
      } else if(action === 'restart'){
        logic.restart(room);
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
