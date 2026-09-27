(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./final-board.js'),require('./troops.js'));
  else root.TroyWalls=factory(root.TroyHeroes,root.TroyFinalBoard,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,BOARD,TROOPS){
  'use strict';
  const VERSION=7,MAX_ROUNDS=14,BASIC_ATTACK=2,ENEMY_ATTACK=2;
  const LAYOUT=[['M4','M1'],['P3','P7','P4','B5'],['P1','P6','C2'],['A1','A2','P2'],['N1','N2','N3','N4']];
  const TERRAINS={C:{name:'Colina',art:'colina'},M:{name:'Muralha',art:'portoes'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};}));
  const CONNECTIONS={...BOARD.links,N1:['A1','A2','N2'],N2:['N1','A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2']};
  for(const id of Object.keys(ZONES))ZONES[id].links=(CONNECTIONS[id]||[]).filter(n=>ZONES[n]);for(const id of ['N1','N2','N3','N4'])for(const n of ZONES[id].links)if(!ZONES[n].links.includes(id))ZONES[n].links.push(id);
  const clone=s=>JSON.parse(JSON.stringify(s));
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone,type='explorador'){s.enemies.push(TROOPS.create('e'+s.nextEnemy++,zone,type));}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['aquiles','ajax','odisseu'],owners=options.owners??ids.map((_,i)=>i%players+1);
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Escolha a quantidade de heróis indicada e atribua ao menos um a cada jogador.');
    const s={version:VERSION,mission:'muralhas',players,round:1,phase:'heroes',result:null,reason:'',scouted:[],retreatDeadline:null,ambush:false,guards:{},nextEnemy:1,foodSites:{A1:ids.length*2,B5:2,N3:2},foodSpent:0,weaponStock:ids.length,
      heroes:ids.map((id,i)=>({...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'A1',cargo:false,food:1,weapon:false})),enemies:[],log:[],outcome:null};
    spawn(s,'M1','guarda');if(ids.length>=4)spawn(s,'M4','arqueiro');log(s,'Reconheçam M1. Há sinais de patrulha em B5: a primeira entrada pode revelar uma emboscada.');return s;
  }

  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function enemyPlan(e,s){
    if(e.stunned)return {type:'stun'};
    const lure=HEROES.taunt(s,e,distance,true);if(lure){if(lure.zone===e.zone)return {type:'attack',target:lure.id};const zone=ZONES[e.zone].links.filter(z=>z!=='A1').sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];return {type:'move',zone};}
    const inRange=s.heroes.filter(h=>h.hp>0&&h.zone!=='A1'&&distance(e.zone,h.zone)<=(TROOPS.types[e.type]?.range||0)).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||b.hp-a.hp);if(inRange.length)return {type:'attack',target:inRange[0].id};if(e.type==='guarda')return {type:'hold'};
    const targets=s.heroes.filter(h=>h.hp>0&&h.zone!=='A1').sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone));
    if(!targets.length||(!s.scouted.length&&distance(e.zone,targets[0].zone)>2))return {type:'hold'};
    const choices=ZONES[e.zone].links.filter(id=>id!=='A1').sort((a,b)=>distance(a,targets[0].zone)-distance(b,targets[0].zone));
    return choices.length?{type:'move',zone:choices[0]}:{type:'hold'};
  }
  function waves(s,round){return !s.retreatDeadline&&round===5?['M1']:[];}
  function intent(e,s){const p=enemyPlan(e,s);return p.type==='stun'?'Atordoado: perderá esta ativação':p.type==='attack'?'Atacar '+HEROES.find(h=>h.id===p.target)?.name:p.type==='move'?'Avançar para '+ZONES[p.zone].name:e.type==='guarda'?'Defender o portão':'Manter posição; a base A1 é segura';}
  function finish(s,result,reason){s.result=result;s.phase='end';s.reason=reason;if(result==='victory')s.outcome={completed:'muralhas',next:'Segurar a linha',intel:['M1']};log(s,reason);}
  function defeat(s){if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram durante o reconhecimento.');}
  function ambush(s,before){
    if(s.ambush||!s.heroes.some(h=>h.zone==='B5'&&before.heroes.find(a=>a.id===h.id).zone!=='B5'))return;
    s.ambush=true;spawn(s,'P4');if(s.heroes.length===5)spawn(s,'P4');log(s,'Emboscada revelada! Uma patrulha surge em P4. Ela age somente na resposta de Troia.');
  }
  function kill(s,e,damage,piercing=false){e.hp-=Math.max(0,damage-(piercing===true?0:Math.max(0,(e.armor||0)-(typeof piercing==='number'?piercing:0))));if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');}}
  function hurtHero(s,h,amount){return HEROES.damage(s,h,amount,log);}
  function strike(s,h,e,amount,piercing=false){kill(s,e,amount,piercing);if(e.hp>0){const damage=hurtHero(s,h,Math.ceil((e.attack??ENEMY_ATTACK)/2));log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}}
  function eat(s,h){h.food--;s.foodSpent++;}
  function interaction(s,h){
    if(['M1'].includes(h.zone)&&!s.scouted.includes(h.zone))return {label:'Reconhecer acesso',detail:h.zone+' · 1 ação sem inimigos',available:true};
    if(h.zone==='A1'&&s.scouted.length===1)return {label:'Concluir retirada',detail:'Todos de pé em A1 · 1 ação',available:s.heroes.every(a=>a.zone==='A1'&&a.hp>0)};
    return {label:s.scouted.length===1?'Retornar à base':'Reconhecer acessos',detail:s.scouted.length===1?'Reúnam todos em A1':'Investiguem M1',available:false};
  }
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada pela linha dourada.');h.zone=target;message='moveu para '+target;}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,h.weapon?1:false);message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      if(foes().length)return fail('Elimine os inimigos nesta casa antes de interagir.');
      if(['M1'].includes(h.zone)&&!s.scouted.includes(h.zone)){
        s.scouted.push(h.zone);message='reconheceu '+h.zone;
        {s.retreatDeadline=Math.min(MAX_ROUNDS,s.round+6);for(let i=0;i<Math.ceil(s.heroes.length/2);i++)spawn(s,i%2?'M4':'M1','lanceiro');log(s,'Contra-ataque! Voltem todos a A1 e concluam a retirada até a rodada '+s.retreatDeadline+'. Os novos grupos agem na próxima resposta.');}
      }else if(h.zone==='A1'&&s.scouted.length===1&&s.heroes.every(a=>a.zone==='A1'&&a.hp>0)){
        h.ap--;finish(s,'victory','O assalto direto foi descartado, mas o reconhecimento foi um sucesso. A equipe voltou com informações do portão M1.');return {ok:true,state:s};
      }else return fail('Reconheça um acesso pendente ou reúna toda a equipe em A1.');
     }else if(action==='arm'){
      if(h.zone!=='P2'||foes().length||h.weapon||s.weaponStock<=0)return fail('Explore a ficha de P2 sem inimigos para obter uma arma.');h.weapon=true;s.weaponStock--;message='encontrou uma arma reforçada: ataques básicos ignoram 1 de Armadura';
     }else if(action==='gather'){
      if(foes().length)return fail('Elimine os inimigos antes de coletar comida.');
      if(!(s.foodSites[h.zone]>0))return fail('Não há comida disponível nesta área.');
      if(h.food>=3)return fail('Este herói já carrega 3 comidas.');
      s.foodSites[h.zone]--;h.food++;message='coletou 1 comida';
    }else if(action==='share'){
      const a=s.heroes.find(a=>a.id===target&&a.id!==h.id&&a.zone===h.zone&&a.hp>0&&a.food<3);
      if(!a||!h.food)return fail('Escolha um aliado de pé nesta área com espaço para comida.');
      h.food--;a.food++;message='entregou 1 comida a '+a.id;
    }else if(action==='eat'){
      if(foes().length)return fail('Elimine os inimigos antes de comer.');
      if(!h.food||h.hp===HEROES.stats(h).maxHp)return fail('É preciso comida e vida a recuperar.');
      eat(s,h);h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+2);message='consumiu 1 comida e recuperou até 2 de vida';
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta casa.');if(!h.used.length)return fail('Habilidades já estão prontas.');h.used=[];message='recuperou habilidades, sem recuperar vida';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta casa.');if(!h.food)return fail('Socorrer exige 1 comida de quem socorre.');eat(s,h);a.hp=2;message='socorreu '+HEROES.find(d=>d.id===a.id).name;
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,c.piercing);if(c.stun&&e.hp>0)e.stunned=true;}
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,Math.max(0,e.hp-1),true);}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma casa vizinha.');h.zone=e.zone;strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');if(!h.food)return fail('Esta cura exige 1 comida.');eat(s,h);h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta casa.');if(!h.food)return fail('Esta cura exige 1 comida de quem usa a habilidade.');eat(s,h);a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);if(!ally||zone===h.zone||distance(h.zone,zone)>c.value)return fail('Escolha um aliado nesta casa e destino a até duas áreas.');ally.zone=zone;}
      else if(c.type==='sprint'){if(target===h.zone||distance(h.zone,target)>2)return fail('Destino a até duas casas.');h.zone=target;}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta casa.');a.used=[];}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    h.ap=h.hp>0?h.ap-1:0;log(s,def.name+' '+message+'.');ambush(s,state);defeat(s);return {ok:true,state:s};
  }
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of [...s.enemies]){
      if(e.stunned){e.stunned=false;log(s,'Grupo '+e.id.slice(1)+' perdeu a ativação por Atordoamento.');continue;}
      const plan=enemyPlan(e,s),h=plan.type==='attack'?(plan.target?s.heroes.find(h=>h.id===plan.target):s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0]):null;
      if(h){const damage=hurtHero(s,h,e.attack??ENEMY_ATTACK);log(s,HEROES.find(d=>d.id===h.id).name+' sofreu '+damage+' de dano.');if(h.hp>0){kill(s,e,Math.ceil(HEROES.stats(h).attack/2));log(s,'Rebote aqueu: '+Math.ceil(HEROES.stats(h).attack/2)+' de dano ao grupo '+e.id.slice(1)+'.');}}
      else{const plan=enemyPlan(e,s);if(plan.type==='move'){e.zone=plan.zone;log(s,'Grupo '+e.id.slice(1)+' avançou para '+e.zone+'.');}}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.round>=(s.retreatDeadline||MAX_ROUNDS)){finish(s,'defeat',s.retreatDeadline?'O contra-ataque fechou a rota antes da retirada.':'O prazo do reconhecimento acabou.');return s;}
    s.round++;for(const zone of waves(s,s.round))spawn(s,zone,'arqueiro');s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;});
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!=='muralhas'||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>integer(n,0,2))))return false;
    if(!integer(s.weaponStock,0,s.heroes.length)||s.heroes.some(h=>typeof h.weapon!=='boolean')||s.weaponStock+s.heroes.filter(h=>h.weapon).length!==s.heroes.length)return false;
    if(!s.foodSites||Object.keys(s.foodSites).sort().join(',')!=='A1,B5,N3'||!integer(s.foodSites.A1,0,s.heroes.length*2)||!integer(s.foodSites.B5,0,2)||!integer(s.foodSites.N3,0,2)||!integer(s.foodSpent,0,s.heroes.length*3+4)||s.heroes.some(h=>!integer(h.food,0,3))||Object.values(s.foodSites).reduce((a,b)=>a+b,0)+s.heroes.reduce((n,h)=>n+h.food,0)+s.foodSpent!==s.heroes.length*3+4)return false;
    if(!Array.isArray(s.scouted)||new Set(s.scouted).size!==s.scouted.length||s.scouted.some(id=>!['M1'].includes(id))||typeof s.ambush!=='boolean'||s.heroes.some(h=>h.cargo))return false;
    if((s.scouted.length===1)!==(s.retreatDeadline!==null)||s.retreatDeadline!==null&&(!integer(s.retreatDeadline,1,MAX_ROUNDS)||s.round>s.retreatDeadline))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&e.zone!=='A1'&&integer(e.hp,1,e.type?TROOPS.types[e.type]?.hp||0:3)&&(e.armor===undefined||integer(e.armor,0,100))&&(e.attack===undefined||integer(e.attack,0,100))&&(e.stunned===undefined||typeof e.stunned==='boolean'))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(s.scouted.length!==1||!s.heroes.every(h=>h.zone==='A1'&&h.hp>0)||s.outcome?.completed!=='muralhas'))return false;

    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,HEROES,TROOPS,LAYOUT,TERRAINS,ZONES,newGame,distance,intent,waves,interaction,act,trojanTurn,validSave};
});
