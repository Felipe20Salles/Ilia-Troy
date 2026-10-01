(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyLanding=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  const VERSION=7,MAX_ROUNDS=10,FOOD_LIMIT=2;
  const LAYOUT=[['P1','P6','C2'],['A1','A2','P2'],['N1','N2','N3','N4']];
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};}));
  const CONNECTIONS={"P3":["P1","P6"],"P1":["P3","P6","A1","A2"],"P6":["P3","P1","A2","C2"],"C2":["P6","A2","P2"],"A1":["P1","A2","N1"],"A2":["A1","P1","P6","C2","P2","N1","N2"],"P2":["A2","C2","N2","N3","N4"],"N1":["A1","A2","N2"],"N2":["N1","A2","P2","N3"],"N3":["N2","P2","N4"],"N4":["N3","P2"]};
  for(const [id,links] of Object.entries(CONNECTIONS))if(ZONES[id])ZONES[id].links=links.filter(next=>ZONES[next]);
  const clone=s=>JSON.parse(JSON.stringify(s));
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone,type='explorador'){s.enemies.push(TROOPS.create('e'+s.nextEnemy++,zone,type));}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const s={version:VERSION,mission:'desembarque',players,playerNames,round:1,phase:'heroes',result:null,reason:'',foodSetup:true,campFood:ids.length*2,foodSpent:0,campDamage:0,delivered:0,required:ids.length,built:false,held:0,supplies:{N1:Math.ceil(ids.length/2),N2:Math.floor(ids.length/2)},guards:{},nextEnemy:1,
      heroes:ids.map((id,i)=>({...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:options.shoreDeployment?['N1','N2','N4'][i%3]:'N1',cargo:false,food:0})),enemies:[],log:[],outcome:null};
    spawn(s,'P1');if(ids.length>=4)spawn(s,'C2');log(s,'Desembarque: levem '+s.required+' caixas das praias N1/N2 ao acampamento A1.');return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone){return ZONES[zone].links.slice().sort((a,b)=>distance(a,'A1')-distance(b,'A1'))[0];}
  function intimidationZone(s,e){return ZONES[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(b,'A1')-distance(a,'A1'))[0];}
  function waves(s,round){const zones=({3:['C2'],5:['P1'],7:['P2'],9:['C2']})[round]||[];return s.heroes.length===5&&round===5?[...zones,'C2']:zones;}
  function intent(e,s){if(e.stunned)return 'Atordoado: perderá esta ativação';if(e.intimidated)return 'Intimidado: não poderá atacar nesta resposta';const lure=HEROES.taunt(s,e,distance,false);if(lure)return 'Priorizar Agamêmnon em '+lure.zone;if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';return e.zone==='A1'?'Sabotar o acampamento':'Avançar para '+ZONES[nextStep(e.zone)].name;}
  function finish(s,result,reason){s.result=result;s.phase='end';s.reason=reason;if(result==='victory')s.outcome={completed:'desembarque',next:'Diante das muralhas',supplies:s.required,horseMaterials:0,campFood:s.campFood};log(s,reason);}
  function defeat(s){if(s.campDamage>=3)finish(s,'defeat','O acampamento sofreu três danos. Os gregos precisam refazer o desembarque.');else if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram. A expedição precisa recuar.');}
  function kill(s,e,damage,piercing=false){e.hp-=Math.max(0,damage-(piercing?0:e.armor||0));if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');}}
  function strike(s,h,e,amount,options={}){
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu');
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(e.hp>0&&!e.stunned&&!options.ranged){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+HEROES.find(d=>d.id===h.id).name+'.');if(!h.hp){if(h.cargo){s.supplies[origin]=(s.supplies[origin]||0)+1;h.cargo=false;log(s,'A caixa caiu em '+origin+'.');}return false;}}
    h.zone=target;return true;
  }
  function interaction(s,h){
    if(h.cargo&&h.zone==='A1')return {label:'Entregar caixa',detail:'Abastecer o acampamento',available:true};
    if(!h.cargo&&(s.supplies[h.zone]||0)>0)return {label:'Carregar caixa',detail:'Leve uma caixa até A1',available:true};
    if(h.zone==='A1'&&s.delivered===s.required&&!s.built)return {label:'Instalar acampamento',detail:'Inicia o contra-ataque anunciado',available:true};
    if(h.zone==='A1'&&s.built&&h.food<FOOD_LIMIT&&s.campFood>0)return {label:'Repor comida',detail:'Complete até 2 usando o armazém',available:true};
    return {label:s.built?'Defender A1':'Suprimentos',detail:s.built?'Resista a 2 respostas consecutivas':h.cargo?'Leve sua caixa até A1':'Caixas em N1 e N2',available:false};
  }
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Conclua a distribuição inicial de alimentos antes da primeira ação.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada pela linha dourada.');const origin=h.zone;message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      if(foes().length)return fail('Elimine os inimigos nesta casa antes de interagir.');
      if(h.cargo&&h.zone==='A1'){h.cargo=false;s.delivered++;message='entregou uma caixa em A1 ('+s.delivered+'/'+s.required+')';}
      else if(!h.cargo&&(s.supplies[h.zone]||0)>0){s.supplies[h.zone]--;h.cargo=true;message='carregou uma caixa de '+h.zone;}
      else if(h.zone==='A1'&&s.delivered===s.required&&!s.built){s.built=true;s.held=0;for(let i=0;i<Math.ceil(s.heroes.length/2);i++)spawn(s,i%2?'C2':'P2','lanceiro');message='instalou o acampamento. Contra-ataque em P2/C2: defendam A1 por duas respostas consecutivas';}
      else if(h.zone==='A1'&&s.built&&h.food<FOOD_LIMIT&&s.campFood>0){const amount=Math.min(FOOD_LIMIT-h.food,s.campFood);h.food+=amount;s.campFood-=amount;message='repôs '+amount+' comida(s) usando o armazém';}
      else return fail('Não há entrega, coleta ou instalação disponível aqui.');
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta casa.');if(!h.used.length&&h.hp===HEROES.stats(h).maxHp)return fail('Vida e habilidades já estão completas.');const wounded=h.hp<HEROES.stats(h).maxHp;if(wounded&&!h.food&&!(h.zone==='A1'&&s.built&&s.campFood>0))return fail('Recuperar vida exige comida carregada ou disponível no acampamento.');h.used=[];if(wounded){if(h.food)h.food--;else s.campFood--;s.foodSpent++;h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+2);}message=wounded?'comeu, descansou e recuperou até 2 de vida':'preparou suas habilidades';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta casa.');if(!h.food)return fail('Socorrer exige 1 comida de quem socorre.');h.food--;s.foodSpent++;a.hp=2;a.ap=1;message='socorreu '+HEROES.find(d=>d.id===a.id).name+' com 1 ação disponível';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,{piercing:c.piercing,stun:c.stun,breakArmor:c.breakArmor,ranged:c.type==='ranged'});}
      else if(c.type==='multiRanged'){
        const ids=String(target).split(',').filter(Boolean),targets=[...new Set(ids)].map(id=>s.enemies.find(enemy=>enemy.id===id));
        if(!targets.length||targets.length>2||targets.some(enemy=>!enemy)||new Set(targets.map(enemy=>enemy.zone)).size!==1||distance(h.zone,targets[0].zone)>1)return fail('Escolha até dois inimigos diferentes, juntos nesta área ou em uma área vizinha.');
        for(const enemy of targets)strike(s,h,enemy,c.value,{piercing:true,ranged:true});
      }
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,0,{precision:true,piercing:true,ranged:true});}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma casa vizinha.');h.zone=e.zone;strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta casa.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);if(!ally||zone===h.zone||distance(h.zone,zone)>c.value)return fail('Escolha um aliado nesta casa e destino a até duas áreas.');ally.zone=zone;}
      else if(c.type==='sprint'){if(target===h.zone||distance(h.zone,target)>2)return fail('Destino a até duas casas.');h.zone=target;}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta casa.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;e.zone=zone;e.intimidated=true;log(s,TROOPS.label(e)+' recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    h.ap--;log(s,def.name+' '+message+'.');return {ok:true,state:s};
  }
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição inicial indisponível.');
    if(delta===1){if(!s.campFood)return fail('Não há mais alimentos para distribuir.');if(h.food>=FOOD_LIMIT)return fail('Este herói já carrega o limite de 2 comidas.');h.food++;s.campFood--;}
    else{if(!h.food)return fail('Este herói não possui comida para devolver.');h.food--;s.campFood++;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Distribuição inicial concluída. '+s.campFood+' comida(s) permaneceram no armazém.');return {ok:true,state:s};}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of [...s.enemies]){
      if(e.stunned){e.stunned=false;log(s,'Grupo '+e.id.slice(1)+' perdeu a ativação por Atordoamento.');continue;}
      const intimidated=!!e.intimidated;e.intimidated=false;
      const lure=HEROES.taunt(s,e,distance,false);
      if(lure&&lure.zone!==e.zone){e.zone=ZONES[e.zone].links.slice().sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];log(s,'Grupo '+e.id.slice(1)+' avançou para Agamêmnon em '+e.zone+'.');continue;}
      const guard=s.guards[e.zone]||0;
      const h=intimidated?null:lure||s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const damage=HEROES.damage(s,h,e.attack??2,log);log(s,HEROES.find(d=>d.id===h.id).name+' sofreu '+damage+' de dano.');if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2);kill(s,e,rebound);log(s,'Rebote grego corpo a corpo: '+rebound+' de dano em '+TROOPS.label(e)+'.');}if(!h.hp){h.ap=0;if(h.cargo){s.supplies[h.zone]=(s.supplies[h.zone]||0)+1;h.cargo=false;log(s,'Uma caixa caiu em '+h.zone+' e pode ser recuperada.');}}}
      else if(e.zone==='A1'){if(guard){s.guards.A1--;log(s,'A proteção absorveu a sabotagem.');}else{s.campDamage++;log(s,'Acampamento sabotado: '+s.campDamage+'/3 danos.');}}
      else{e.zone=nextStep(e.zone);log(s,'Grupo '+e.id.slice(1)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.built){const held=s.heroes.some(h=>h.zone==='A1'&&h.hp>0)&&!s.enemies.some(e=>e.zone==='A1');s.held=held?s.held+1:0;log(s,held?'Acampamento defendido: '+s.held+'/2 respostas consecutivas.':'Defesa interrompida: limpem A1 e mantenham um herói de pé lá.');if(s.held>=2){finish(s,'victory','O acampamento está seguro. Os gregos têm uma base para avançar em direção às muralhas.');return s;}}
    if(s.round>=MAX_ROUNDS){finish(s,'defeat','O tempo acabou antes de consolidar o acampamento.');return s;}
    s.round++;for(const zone of waves(s,s.round))spawn(s,zone,s.round>=5?'lanceiro':'explorador');s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;});
    if(s.round===3)log(s,'Alerta: Troia reconheceu o desembarque. Chegou uma patrulha pela colina C2.');
    if(s.round===5)log(s,'A pressão aumenta. Uma nova patrulha entra pela planície.');
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!=='desembarque'||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(s.playerNames!==undefined&&(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players||s.playerNames.some(n=>typeof n!=='string'||!n.trim()||n.length>30)))return false;
    if(!s.heroes.some(h=>h.id==='odisseu')||!s.heroes.some(h=>h.id==='agamemnon')||new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>integer(n,0,2))))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,s.heroes.length*2)||!integer(s.foodSpent,0,s.heroes.length*2+20)||s.heroes.some(h=>!integer(h.food,0,FOOD_LIMIT))||s.foodSetup&&s.foodSpent!==0)return false;
    if(s.required!==s.heroes.length||!integer(s.delivered,0,s.required)||!integer(s.campDamage,0,3)||typeof s.built!=='boolean'||(s.built&&s.delivered!==s.required)||!integer(s.held,0,2)||(!s.built&&s.held!==0)||!s.supplies||Object.entries(s.supplies).some(([id,n])=>!ZONES[id]||!integer(n,0,s.required)))return false;
    if(s.delivered+s.heroes.filter(h=>h.cargo).length+Object.values(s.supplies).reduce((n,x)=>n+x,0)!==s.required)return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&integer(e.hp,1,e.type?TROOPS.types[e.type]?.hp||0:3)&&(e.armor===undefined||integer(e.armor,0,100))&&(e.attack===undefined||integer(e.attack,0,100))&&(e.stunned===undefined||typeof e.stunned==='boolean')&&(e.intimidated===undefined||typeof e.intimidated==='boolean'))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(!s.built||s.held!==2||s.campDamage>=3||s.outcome?.completed!=='desembarque'||s.outcome.supplies!==s.required||s.outcome.horseMaterials!==0))return false;
    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,FOOD_LIMIT,HEROES,TROOPS,LAYOUT,TERRAINS,ZONES,newGame,distance,intent,waves,interaction,act,allocateFood,finishFoodSetup,trojanTurn,validSave};
});
