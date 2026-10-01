(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./final-board.js'),require('./troops.js'));
  else root.TroyWalls=factory(root.TroyHeroes,root.TroyFinalBoard,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,BOARD,TROOPS){
  'use strict';
  const VERSION=10,MAX_ROUNDS=14,BASIC_ATTACK=2,ENEMY_ATTACK=2,FOOD_LIMIT=2;
  const LAYOUT=[['M4','M1'],['P3','P7','P4','B5'],['P1','P6','C2'],['A1','A2','P2'],['N1','N2','N3','N4']];
  const BASE_ZONES=LAYOUT.flat(),ALL_ZONES=Object.keys(BOARD.points);
  const TERRAINS={C:{name:'Colina',art:'colina'},M:{name:'Muralha',art:'portoes'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  ALL_ZONES.forEach(id=>{const [x,y]=BOARD.points[id];ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};});
  const CONNECTIONS={...BOARD.links,N1:['A1','A2','N2'],N2:['N1','A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2','N5'],N5:['N4','B2']};
  for(const id of Object.keys(ZONES))ZONES[id].links=(CONNECTIONS[id]||[]).filter(n=>ZONES[n]);for(const id of Object.keys(ZONES))for(const n of ZONES[id].links)if(!ZONES[n].links.includes(id))ZONES[n].links.push(id);
  if(!ZONES.B5.links.includes('M1'))ZONES.B5.links.push('M1');
  if(!ZONES.M1.links.includes('B5'))ZONES.M1.links.push('B5');
  const clone=s=>JSON.parse(JSON.stringify(s));
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone,type='explorador',extra={}){const enemy={...TROOPS.create('e'+s.nextEnemy++,zone,type),...extra};s.enemies.push(enemy);return enemy;}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const storedFood=Number.isInteger(options.campFood)?options.campFood:Number.isInteger(options.resources?.food)?options.resources.food:0;
    const s={version:VERSION,mission:'muralhas',players,playerNames,round:1,phase:'heroes',result:null,reason:'',gateAssaulted:false,gateAssaultRound:null,retreatDeadline:null,ambush:false,guards:{},nextEnemy:1,campFood:Math.max(0,storedFood),foodSpent:0,evolutionChoices:[],evolutions:0,commanders:{heitor:'unseen',paris:'unseen',eneias:'unseen',sarpedon:'unseen'},revealedZones:[...BASE_ZONES],
      explorations:{P2:{type:'evolution',amount:1,resolved:false},B5:{type:'food',amount:Math.max(1,ids.length-1),resolved:false},N4:{type:'food',amount:Math.max(1,ids.length-1),resolved:false}},
      heroes:ids.map((id,i)=>({...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'A1',cargo:false,food:Math.min(FOOD_LIMIT,options.food?.[id]??FOOD_LIMIT)})),enemies:[],log:[],outcome:null};
    spawn(s,'M1','guarda');if(ids.length>=4)spawn(s,'M4','arqueiro');log(s,'Abram caminho até M1 e tentem atacar o Portão de Troia. Há sinais de patrulha em B5.');return s;
  }

  function active(s,id){return !s?.revealedZones||s.revealedZones.includes(id);}
  function distance(from,to,state){if(!ZONES[from]||!ZONES[to]||!active(state,from)||!active(state,to))return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(active(state,n)&&!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function intimidationZone(s,e){return ZONES[e.zone].links.filter(z=>z!=='A1'&&active(s,z)).sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(b,'A1',s)-distance(a,'A1',s))[0];}
  function enemyPlan(e,s){
    if(e.stunned)return {type:'stun'};
    if(e.retreating){if(e.zone==='M1')return {type:'escape'};const zone=ZONES[e.zone].links.filter(z=>active(s,z)).sort((a,b)=>distance(a,'M1',s)-distance(b,'M1',s))[0];return zone?{type:'retreat',zone}:{type:'escape'};}
    const metric=(a,b)=>distance(a,b,s),lure=HEROES.taunt(s,e,metric,true),canAttack=!e.intimidated;if(lure){if(lure.zone===e.zone&&canAttack)return {type:'attack',target:lure.id};const zone=ZONES[e.zone].links.filter(z=>z!=='A1'&&active(s,z)).sort((a,b)=>metric(a,lure.zone)-metric(b,lure.zone))[0];return zone?{type:'move',zone}:{type:'hold'};}
    const inRange=canAttack?s.heroes.filter(h=>h.hp>0&&h.zone!=='A1'&&metric(e.zone,h.zone)<=(TROOPS.types[e.type]?.range||0)).sort((a,b)=>metric(e.zone,a.zone)-metric(e.zone,b.zone)||b.hp-a.hp):[];if(inRange.length)return {type:'attack',target:inRange[0].id};if(e.type==='guarda'||e.sentry)return {type:'hold'};
    const targets=s.heroes.filter(h=>h.hp>0&&h.zone!=='A1').sort((a,b)=>metric(e.zone,a.zone)-metric(e.zone,b.zone));
    if(!targets.length||(!s.gateAssaulted&&metric(e.zone,targets[0].zone)>2))return {type:'hold'};
    const choices=ZONES[e.zone].links.filter(id=>id!=='A1'&&active(s,id)).sort((a,b)=>metric(a,targets[0].zone)-metric(b,targets[0].zone));
    return choices.length?{type:'move',zone:choices[0]}:{type:'hold'};
  }
  function waves(s,round){if(round===2)return ['M4'];return !s.retreatDeadline&&round===5?['M4']:[];}
  function intent(e,s){const p=enemyPlan(e,s);return p.type==='stun'?'Atordoado: perderá esta ativação':p.type==='retreat'?'Recuar para '+ZONES[p.zone].name:p.type==='escape'?'Sair do alcance dos gregos pelas muralhas':e.intimidated?'Intimidado: não poderá atacar nesta resposta':p.type==='attack'?'Atacar '+HEROES.find(h=>h.id===p.target)?.name:p.type==='move'?'Avançar para '+ZONES[p.zone].name:e.type==='guarda'?'Defender o portão':'Manter posição; a base A1 é segura';}
  function finish(s,result,reason){s.result=result;s.phase='end';s.reason=reason;if(result==='victory')s.outcome={completed:'muralhas',next:'Segurar a linha',intel:['M1'],revealedZones:s.revealedZones,explorations:s.explorations,campFood:s.campFood,commanders:s.commanders};log(s,reason);}
  function defeat(s){if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram durante o reconhecimento.');}
  function ambush(s,h){
    if(s.ambush)return;
    s.ambush=true;spawn(s,'B5');if(s.heroes.length===5)spawn(s,'B5');
    log(s,'Emboscada revelada! Uma patrulha surge na própria B5, sem dano imediato. Ela agirá somente na próxima resposta de Troia.');
  }
  function retreatCommander(s,e){
    if(!['heitor','paris'].includes(e.type)||!['muralhas','defesa'].includes(s.mission)||e.hp>1)return false;
    e.hp=1;s.commanders??={};
    if(e.type==='heitor'){
      if(e.zone==='M1'){s.enemies=s.enemies.filter(a=>a.id!==e.id);s.commanders.heitor='retreated';log(s,'Heitor atravessou M1 e ficou protegido pelas muralhas.');return true;}
      if(!e.retreating)log(s,'Heitor foi gravemente ferido e iniciou uma retirada gradual até M1.');
      e.retreating=true;s.commanders.heitor='retreating';return true;
    }
    s.enemies=s.enemies.filter(a=>a.id!==e.id);s.commanders[e.type]='retreated';log(s,TROOPS.label(e)+' foi gravemente ferido e recuou do campo.');return true;
  }
  function kill(s,e,damage,piercing=false){e.hp-=Math.max(0,damage-(piercing===true?0:Math.max(0,(e.armor||0)-(typeof piercing==='number'?piercing:0))));if(retreatCommander(s,e))return;if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);if(e.type==='eneias'||e.type==='sarpedon'){s.commanders??={};s.commanders[e.type]='dead';}log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');}}
  function hurtHero(s,h,amount,options){return HEROES.damage(s,h,amount,log,options);}
  function strike(s,h,e,amount,options={}){
    kill(s,e,amount,options.piercing||h.id==='odisseu');
    if(!s.enemies.some(a=>a.id===e.id))return;
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(e.hp>0&&!e.stunned&&!options.ranged){const damage=hurtHero(s,h,Math.floor((e.attack??ENEMY_ATTACK)/2),{ignoreGuard:true});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??ENEMY_ATTACK)-(b.attack??ENEMY_ATTACK)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??ENEMY_ATTACK)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+HEROES.find(d=>d.id===h.id).name+'.');if(!h.hp)return false;}
    h.zone=target;return true;
  }
  function eat(s,h){h.food--;s.foodSpent++;}
  function interaction(s,h){
    if(h.zone==='A1'&&s.gateAssaulted)return {label:'Explorar',detail:'Concluir retirada com os sobreviventes em A1',available:s.heroes.some(a=>a.hp>0)&&s.heroes.filter(a=>a.hp>0).every(a=>a.zone==='A1')};
    if(h.zone==='A1'&&h.food<FOOD_LIMIT&&s.campFood>0)return {label:'Explorar',detail:'Repor comida até o limite usando o armazém',available:true};
    if(s.explorations[h.zone]&&!s.explorations[h.zone].resolved)return {label:'Explorar',detail:'Revelar a ficha desta área',available:true};
    return {label:'Explorar',detail:s.gateAssaulted?'Reúnam os sobreviventes em A1':'Procure uma ficha ou alcance o portão',available:false};
  }
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone);let message='';
    if(action==='move'){if(!active(s,target)||!ZONES[h.zone].links.includes(target))return fail('Escolha uma região revelada e conectada pela linha dourada.');const origin=h.zone;message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'&&target==='gate'){if(h.zone!=='M1'||s.gateAssaulted||foes().length)return fail('Ataque o portão em M1 depois de eliminar seus defensores.');s.gateAssaulted=true;s.gateAssaultRound=s.round;s.retreatDeadline=Math.min(MAX_ROUNDS,s.round+6);for(let i=0;i<s.heroes.length-1;i++)spawn(s,i%2?'M4':'M1','lanceiro');spawn(s,'M4','paris');s.commanders.paris='active';message='atacou o Portão de Troia, mas os portões são intransponíveis';log(s,'ALARME NAS MURALHAS! Páris chega com os primeiros reforços. Heitor foi chamado e entrará na próxima rodada. Persistir no ataque será suicídio: retornem a A1 até a rodada '+s.retreatDeadline+'.');}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&!e.retreating&&distance(h.zone,e.zone,s)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      if(foes().length)return fail('Elimine os inimigos nesta casa antes de interagir.');
      if(h.zone==='A1'&&s.gateAssaulted&&s.heroes.some(a=>a.hp>0)&&s.heroes.filter(a=>a.hp>0).every(a=>a.zone==='A1')){
        h.ap--;finish(s,'victory','O ataque ao portão fracassou, mas os sobreviventes retornaram com a certeza de que Troia exige outro plano.');return {ok:true,state:s};
      }else if(h.zone==='A1'&&h.food<FOOD_LIMIT&&s.campFood>0){const amount=Math.min(FOOD_LIMIT-h.food,s.campFood);s.campFood-=amount;h.food+=amount;message='repôs '+amount+' comida(s) no acampamento';}
      else if(s.explorations[h.zone]&&!s.explorations[h.zone].resolved){
        const found=s.explorations[h.zone];found.resolved=true;
        if(found.type==='food'){s.campFood+=found.amount;const reveal=h.zone==='B5'?['M5','M2','B1']:h.zone==='N4'?['N5']:[];for(const id of reveal)if(!s.revealedZones.includes(id))s.revealedZones.push(id);message='explorou '+h.zone+': '+found.amount+' comida(s) foram armazenadas no acampamento'+(reveal.length?' e as peças '+reveal.join(', ')+' foram reveladas':'');if(h.zone==='B5')ambush(s,h);}
        else {for(const id of ['P5','C1'])if(!s.revealedZones.includes(id))s.revealedZones.push(id);const eligible=s.heroes.filter(a=>a.level<3).map(a=>a.id).sort(()=>Math.random()-.5);s.evolutionChoices=eligible.slice(0,2);message='explorou '+h.zone+': P5 e C1 foram reveladas e surgiu uma oportunidade de evolução';}
      }else return fail('Não há uma ficha inexplorada ou objetivo disponível nesta área.');
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta casa.');
      const wounded=h.hp<HEROES.stats(h).maxHp;if(!h.used.length&&!wounded)return fail('Vida e habilidades já estão completas.');
      if(wounded&&!h.food&&!(h.zone==='A1'&&s.campFood>0))return fail('Recuperar vida exige comida carregada ou disponível no acampamento.');
      h.used=[];if(wounded){if(h.food)eat(s,h);else{s.campFood--;s.foodSpent++;}h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+2);}message=wounded?'comeu, descansou e recuperou até 2 de vida':'descansou e preparou suas habilidades';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta casa.');if(!h.food)return fail('Socorrer exige 1 comida de quem socorre.');eat(s,h);a.hp=2;a.ap=1;message='socorreu '+HEROES.find(d=>d.id===a.id).name+' com 1 ação disponível';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target&&!e.retreating),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone,s)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,{piercing:c.piercing,stun:c.stun,breakArmor:c.breakArmor,ranged:c.type==='ranged'});}
      else if(c.type==='multiRanged'){
        const ids=String(target).split(',').filter(Boolean),targets=[...new Set(ids)].map(id=>s.enemies.find(enemy=>enemy.id===id));
        if(!targets.length||targets.length>2||targets.some(enemy=>!enemy)||new Set(targets.map(enemy=>enemy.zone)).size!==1||distance(h.zone,targets[0].zone,s)>1)return fail('Escolha até dois inimigos diferentes, juntos nesta área ou em uma área vizinha.');
        for(const enemy of targets)strike(s,h,enemy,c.value,{piercing:true,ranged:true});
      }
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone,s)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,Math.max(0,e.hp-1),{piercing:true,ranged:true});}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma casa vizinha.');h.zone=e.zone;strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta casa.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);if(!ally||zone===h.zone||distance(h.zone,zone,s)>c.value)return fail('Escolha um aliado nesta casa e destino a até duas áreas reveladas.');ally.zone=zone;}
      else if(c.type==='sprint'){if(target===h.zone||distance(h.zone,target,s)>2)return fail('Destino a até duas áreas reveladas.');h.zone=target;}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta casa.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;e.zone=zone;e.intimidated=true;log(s,TROOPS.label(e)+' recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    h.ap=h.hp>0?h.ap-1:0;log(s,def.name+' '+message+'.');defeat(s);return {ok:true,state:s};
  }
  function chooseEvolution(state,heroId){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId);
    if(!s.evolutionChoices.includes(heroId)||!h||h.level>=3)return {ok:false,error:'Esta evolução não está disponível.',state};
    const oldMax=HEROES.stats(h).maxHp;h.level++;s.evolutions++;s.evolutionChoices=[];
    if(h.id==='menelau'&&h.level===2)h.ap++;
    log(s,HEROES.find(d=>d.id===h.id).name+' conquistou a evolução N'+h.level+'. A Vida atual permanece '+h.hp+'/'+HEROES.stats(h).maxHp+(HEROES.stats(h).maxHp>oldMax?' apesar do novo limite.':''));
    return {ok:true,state:s};
  }
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of [...s.enemies]){
      if(e.stunned){e.stunned=false;log(s,'Grupo '+e.id.slice(1)+' perdeu a ativação por Atordoamento.');continue;}
      const intimidated=!!e.intimidated,plan=enemyPlan(e,s);e.intimidated=false;const h=plan.type==='attack'?(plan.target?s.heroes.find(h=>h.id===plan.target):s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0]):null;
      if(h){const damage=hurtHero(s,h,e.attack??ENEMY_ATTACK);log(s,HEROES.find(d=>d.id===h.id).name+' sofreu '+damage+' de dano.');if(h.hp>0&&!h.stunned&&(TROOPS.types[e.type]?.range||0)===0&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2),before=e.hp;kill(s,e,rebound,h.id==='odisseu');log(s,'Rebote grego corpo a corpo: '+Math.max(0,before-e.hp)+' de dano em '+TROOPS.label(e)+(h.id==='odisseu'?' ignorando Armadura':'')+'.');}}
      else if(plan.type==='retreat'){e.zone=plan.zone;log(s,'Heitor recuou uma área até '+e.zone+' e permanece fora do alcance de novos ataques.');}
      else if(plan.type==='escape'){s.enemies=s.enemies.filter(a=>a.id!==e.id);s.commanders[e.type]='retreated';log(s,TROOPS.label(e)+' alcançou M1 e deixou o campo sob proteção das muralhas.');}
      else if(plan.type==='move'){e.zone=plan.zone;log(s,'Grupo '+e.id.slice(1)+(intimidated?' avançou sem atacar, ainda abalado, para ':' avançou para ')+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.round>=(s.retreatDeadline||MAX_ROUNDS)){finish(s,'defeat',s.retreatDeadline?'O contra-ataque fechou a rota antes da retirada.':'O prazo do reconhecimento acabou.');return s;}
    s.round++;for(const zone of waves(s,s.round))spawn(s,zone,s.round===2?'explorador':'arqueiro');if(s.gateAssaulted&&s.commanders.heitor==='unseen'&&s.round===s.gateAssaultRound+1){spawn(s,'M1','heitor');s.commanders.heitor='active';log(s,'Heitor atravessou os portões e entrou em M1 para comandar a perseguição.');}s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;});
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!=='muralhas'||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(s.playerNames!==undefined&&(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players||s.playerNames.some(n=>typeof n!=='string'||!n.trim()||n.length>30)))return false;
    if(!s.heroes.some(h=>h.id==='odisseu')||!s.heroes.some(h=>h.id==='agamemnon')||new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>integer(n,0,2))))return false;
    if(!s.explorations||Object.keys(s.explorations).sort().join(',')!=='B5,N4,P2'||!Object.values(s.explorations).every(x=>['food','evolution'].includes(x.type)&&integer(x.amount,1,4)&&typeof x.resolved==='boolean')||!integer(s.campFood,0,40)||!integer(s.foodSpent,0,40)||s.heroes.some(h=>!integer(h.food,0,FOOD_LIMIT))||!Array.isArray(s.evolutionChoices)||s.evolutionChoices.some(id=>!s.heroes.some(h=>h.id===id&&h.level<3))||!integer(s.evolutions,0,s.heroes.length+2))return false;
    const expected=[...BASE_ZONES];if(s.explorations.B5.resolved)expected.push('M5','M2','B1');if(s.explorations.P2.resolved)expected.push('P5','C1');if(s.explorations.N4.resolved)expected.push('N5');
    if(!Array.isArray(s.revealedZones)||new Set(s.revealedZones).size!==s.revealedZones.length||s.revealedZones.slice().sort().join(',')!==expected.sort().join(',')||typeof s.ambush!=='boolean'||typeof s.gateAssaulted!=='boolean'||s.heroes.some(h=>h.cargo||!s.revealedZones.includes(h.zone)))return false;
    if(s.gateAssaulted!==(s.retreatDeadline!==null)||s.gateAssaulted!==(s.gateAssaultRound!==null)||s.retreatDeadline!==null&&(!integer(s.retreatDeadline,1,MAX_ROUNDS)||!integer(s.gateAssaultRound,1,MAX_ROUNDS)||s.round>s.retreatDeadline))return false;
    if(!s.commanders||!['heitor','paris','eneias','sarpedon'].every(id=>['unseen','active','retreated','dead'].includes(s.commanders[id])))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&s.revealedZones.includes(e.zone)&&e.zone!=='A1'&&integer(e.hp,1,e.type?TROOPS.types[e.type]?.hp||0:3)&&(e.armor===undefined||integer(e.armor,0,100))&&(e.attack===undefined||integer(e.attack,0,100))&&(e.stunned===undefined||typeof e.stunned==='boolean')&&(e.intimidated===undefined||typeof e.intimidated==='boolean')&&(e.retreating===undefined||typeof e.retreating==='boolean')&&(e.sentry===undefined||typeof e.sentry==='boolean'))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(!s.gateAssaulted||!s.heroes.some(h=>h.hp>0)||!s.heroes.filter(h=>h.hp>0).every(h=>h.zone==='A1')||s.outcome?.completed!=='muralhas'))return false;

    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,HEROES,TROOPS,LAYOUT,TERRAINS,ZONES,newGame,distance,intent,waves,interaction,act,chooseEvolution,trojanTurn,validSave};
});
