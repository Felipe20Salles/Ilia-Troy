(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'));
  else root.TroyWalls=factory(root.TroyHeroes);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES){
  'use strict';
  const VERSION=2,MAX_ROUNDS=14;
  const LAYOUT=[['M1','P2','M2','P4','P5'],['P1','B1','B2'],['A2','A1','P3']];
  const TERRAINS={M:{name:'Muralha',art:'portoes'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};}));
  const CONNECTIONS={A1:['A2','P3'],A2:['A1','P1'],P1:['A2','P2','P4'],P2:['P1','P3','B1'],P3:['A1','P2','B2'],B1:['P2','B2','P5'],B2:['P3','B1'],P4:['P1','M1'],P5:['B1','M2'],M1:['P4','M2'],M2:['P5','M1']};
  for(const [id,links] of Object.entries(CONNECTIONS))ZONES[id].links=links;
  const clone=s=>JSON.parse(JSON.stringify(s));
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone){s.enemies.push({id:'e'+s.nextEnemy++,zone,hp:3});}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['aquiles','ajax','odisseu'],owners=options.owners??ids.map((_,i)=>i%players+1);
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Escolha a quantidade de heróis indicada e atribua ao menos um a cada jogador.');
    const s={version:VERSION,mission:'muralhas',players,round:1,phase:'heroes',result:null,reason:'',scouted:[],retreatDeadline:null,ambush:false,guards:{},nextEnemy:1,
      heroes:ids.map((id,i)=>({id,owner:owners[i],zone:'A1',hp:6,ap:2,used:[],cargo:false})),enemies:[],log:[],outcome:null};
    spawn(s,'M1');if(ids.length>=4)spawn(s,'M2');log(s,'Reconheçam M1 e M2. Há sinais de patrulha em B1: a primeira entrada pode revelar uma emboscada.');return s;
  }

  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function enemyPlan(e,s){
    if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return {type:'attack'};
    const targets=s.heroes.filter(h=>h.hp>0&&h.zone!=='A1').sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone));
    if(!targets.length||(!s.scouted.length&&distance(e.zone,targets[0].zone)>2))return {type:'hold'};
    const choices=ZONES[e.zone].links.filter(id=>id!=='A1').sort((a,b)=>distance(a,targets[0].zone)-distance(b,targets[0].zone));
    return choices.length?{type:'move',zone:choices[0]}:{type:'hold'};
  }
  function waves(s,round){return !s.retreatDeadline&&round===5?['M1']:[];}
  function intent(e,s){const p=enemyPlan(e,s);return p.type==='attack'?'Atacar um herói aqui':p.type==='move'?'Avançar para '+ZONES[p.zone].name:'Manter posição; a base A1 é segura';}
  function finish(s,result,reason){s.result=result;s.phase='end';s.reason=reason;if(result==='victory')s.outcome={completed:'muralhas',next:'Segurar a linha',intel:['M1','M2']};log(s,reason);}
  function defeat(s){if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram durante o reconhecimento.');}
  function ambush(s,before){
    if(s.ambush||!s.heroes.some(h=>h.zone==='B1'&&before.heroes.find(a=>a.id===h.id).zone!=='B1'))return;
    s.ambush=true;spawn(s,'B2');if(s.heroes.length===5)spawn(s,'B2');log(s,'Emboscada revelada! Uma patrulha surge em B2. Ela age somente na resposta de Troia.');
  }
  function kill(s,e,damage){e.hp-=damage;if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,'Grupo '+e.id.slice(1)+' derrotado em '+e.zone+'.');}}
  function interaction(s,h){
    if(['M1','M2'].includes(h.zone)&&!s.scouted.includes(h.zone))return {label:'Reconhecer acesso',detail:h.zone+' · 1 ação sem inimigos',available:true};
    if(h.zone==='A1'&&s.scouted.length===2)return {label:'Concluir retirada',detail:'Todos de pé em A1 · 1 ação',available:s.heroes.every(a=>a.zone==='A1'&&a.hp>0)};
    return {label:s.scouted.length===2?'Retornar à base':'Reconhecer acessos',detail:s.scouted.length===2?'Reúnam todos em A1':'Investiguem M1 e M2',available:false};
  }
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada pela linha dourada.');h.zone=target;message='moveu para '+target;}
    else if(action==='attack'){const e=foes().find(e=>e.id===target);if(!e)return fail('Escolha um inimigo nesta casa.');kill(s,e,2);message='atacou: 2 de dano';}
    else if(action==='interact'){
      if(foes().length)return fail('Elimine os inimigos nesta casa antes de interagir.');
      if(['M1','M2'].includes(h.zone)&&!s.scouted.includes(h.zone)){
        s.scouted.push(h.zone);message='reconheceu '+h.zone;
        if(s.scouted.length===1)log(s,'As defesas resistem ao assalto direto. Falta observar o outro acesso.');
        else{s.retreatDeadline=Math.min(MAX_ROUNDS,s.round+6);for(let i=0;i<Math.ceil(s.heroes.length/2);i++)spawn(s,i%2?'M2':'M1');log(s,'Contra-ataque! Voltem todos a A1 e concluam a retirada até a rodada '+s.retreatDeadline+'. Os novos grupos agem na próxima resposta.');}
      }else if(h.zone==='A1'&&s.scouted.length===2&&s.heroes.every(a=>a.zone==='A1'&&a.hp>0)){
        h.ap--;finish(s,'victory','O assalto direto foi descartado, mas o reconhecimento foi um sucesso. A equipe voltou com informações dos dois acessos.');return {ok:true,state:s};
      }else return fail('Reconheça um acesso pendente ou reúna toda a equipe em A1.');
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta casa.');if(!h.used.length&&h.hp===6)return fail('Vida e habilidades já estão completas.');h.used=[];h.hp=Math.min(6,h.hp+1);message='recuperou habilidades e 1 de vida';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta casa.');a.hp=2;message='socorreu '+HEROES.find(d=>d.id===a.id).name;
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(!c||h.used.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');kill(s,e,c.value);}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma casa vizinha.');h.zone=e.zone;kill(s,e,c.value);}
      else if(c.type==='heal'){if(h.hp===6)return fail('Vida completa.');h.hp=Math.min(6,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===6)return fail('Escolha outro herói ferido nesta casa.');a.hp=Math.min(6,a.hp+c.value);}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);if(!ally||!ZONES[h.zone].links.includes(zone))return fail('Escolha um aliado nesta casa e um destino vizinho.');ally.zone=zone;}
      else if(c.type==='sprint'){if(target===h.zone||distance(h.zone,target)>2)return fail('Destino a até duas casas.');h.zone=target;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta casa.');a.used=[];}
      else return fail('Habilidade desconhecida.');
      h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    h.ap--;log(s,def.name+' '+message+'.');ambush(s,state);return {ok:true,state:s};
  }
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of s.enemies){
      const guard=s.guards[e.zone]||0;
      const h=s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const damage=Math.max(0,2-guard);s.guards[e.zone]=Math.max(0,guard-2);h.hp=Math.max(0,h.hp-damage);log(s,HEROES.find(d=>d.id===h.id).name+' sofreu '+damage+' de dano.');if(!h.hp){h.ap=0;}}
      else{const plan=enemyPlan(e,s);if(plan.type==='move'){e.zone=plan.zone;log(s,'Grupo '+e.id.slice(1)+' avançou para '+e.zone+'.');}}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.round>=(s.retreatDeadline||MAX_ROUNDS)){finish(s,'defeat',s.retreatDeadline?'O contra-ataque fechou a rota antes da retirada.':'O prazo do reconhecimento acabou.');return s;}
    s.round++;for(const zone of waves(s,s.round))spawn(s,zone);s.heroes.forEach(h=>{h.ap=h.hp>0?2:0;});
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!=='muralhas'||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&integer(h.hp,0,6)&&integer(h.ap,0,2)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>integer(n,0,2))))return false;
    if(!Array.isArray(s.scouted)||new Set(s.scouted).size!==s.scouted.length||s.scouted.some(id=>!['M1','M2'].includes(id))||typeof s.ambush!=='boolean'||s.heroes.some(h=>h.cargo))return false;
    if((s.scouted.length===2)!==(s.retreatDeadline!==null)||s.retreatDeadline!==null&&(!integer(s.retreatDeadline,1,MAX_ROUNDS)||s.round>s.retreatDeadline))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&e.zone!=='A1'&&integer(e.hp,1,3))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(s.scouted.length!==2||!s.heroes.every(h=>h.zone==='A1'&&h.hp>0)||s.outcome?.completed!=='muralhas'))return false;

    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,HEROES,LAYOUT,TERRAINS,ZONES,newGame,distance,intent,waves,interaction,act,trojanTurn,validSave};
});
