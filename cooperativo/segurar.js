(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyHold=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  // Missão 3 — Segurar a linha: Heitor lidera o contra-ataque contra o acampamento.
  // Mesmas regras da campanha (docs/REGRAS-CAMPANHA.md) e o episódio de Criseida (docs/DILEMAS.md).
  const VERSION=1,MAX_ROUNDS=60,FOOD_LIMIT=2,ALARM_MAX=18,MISSION='segurar',TENTS=3,HEITOR_RETREAT=6;
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'},M:{art:'portoes',name:'Muralha'}};
  const NAMES={C1:'Santuário de Apolo',A1:'Acampamento',N4:'Navios negros',P3:'Campo aberto',P7:'Trilha dos pinheiros',P4:'Diante das muralhas',B5:'Bosque dos pastores',M4:'Torre de vigia',M1:'Portão de Troia'};
  const CONNECTIONS={P1:['P6','A1','A2','P3'],P6:['P1','A2','C2','P3','P7'],C2:['P6','A2','P2','P7','P4'],C1:['P2'],A1:['P1','A2','N1'],A2:['A1','P1','P6','C2','P2','N1','N2'],P2:['A2','C2','C1','N2','N3','N4'],N1:['A1','A2','N2'],N2:['N1','A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2'],
    P3:['P1','P6','P7','M4'],P7:['P6','C2','P4','P3','M4','M1'],P4:['C2','B5','P7','M1'],B5:['P4'],M4:['P3','P7','M1'],M1:['M4','P7','P4']};
  const ALL=Object.keys(CONNECTIONS),BASE=['P1','P6','C2','C1','A1','A2','P2','N1','N2','N3','N4'],BEACHES=['N1','N2','N3','N4'];
  // As rotas da tabuinha (Rotas da costa II) abrem uma trilha escondida entre P1 e P7.
  function zonesFor(scrolls=[]){const Z={};for(const [id,links] of Object.entries(CONNECTIONS))Z[id]={name:id+' · '+(NAMES[id]||TERRAINS[id[0]].name),terrain:id[0],art:TERRAINS[id[0]].art,links:[...links]};
    if(scrolls.includes('rotas-2')){Z.P1.links.push('P7');Z.P7.links.push('P1');}
    for(const [id,z] of Object.entries(Z))for(const n of z.links)if(!Z[n].links.includes(id))Z[n].links.push(id);return Z;}
  const ZONES=zonesFor();
  const ACTIVE=ZONES;function use(s){if(s&&s.scrolls?.includes('rotas-2')&&!ZONES.P1.links.includes('P7')){ZONES.P1.links.push('P7');ZONES.P7.links.push('P1');}return ZONES;}
  const TOKENS={
    N2:{kind:'food',amount:2,name:'Peixe na maré',hint:'Redes deixadas na arrebentação',found:'Os homens de {hero} recolhem as redes antes que o mar as leve. +2 comida.'},
    C2:{kind:'food',amount:2,name:'Colmeias na colina',hint:'Zumbido entre as pedras',found:'Colmeias selvagens entre as rochas. Os homens de {hero} voltam picados e contentes. +2 comida.'}
  };
  const tokenOf=(s,zone)=>TOKENS[zone];
  const FAVOR_MAX=6;
  const GODS={
    atena:{name:'Atena',cost:1,title:'Olhos de Atena',text:'Revela o que há numa ficha de exploração antes de investigá-la.'},
    poseidon:{name:'Poseidon',cost:2,title:'Mar revolto',text:'O mar se agita e atrasa as tropas de Troia. O Alarme cai 2.'},
    zeus:{name:'Zeus',cost:2,title:'Presságio de Zeus',text:'O pedido da crônica desta rodada conta como cumprido.'}
  };
  // A ofensiva sai do portão. Em 7 Páris, em 11 Heitor, que marcha direto para as tendas: com 4 de dano, ele recua e Troia recua com ele.
  const ALARM_STEPS={4:[['M1','lanceiro']],7:[['M1','paris']],11:[['M1','heitor']],15:[['M1','lanceiro']],18:[]};
  const ALARM_BONUS={4:[['P4','explorador']],7:[['M4','arqueiro']],11:[['M1','lanceiro']],15:[['M4','arqueiro']]};
  function alarmEntries(s,step){if(step===18){const list=[];for(let i=0;i<s.heroes.length-1;i++)list.push(['M1','lanceiro']);list.push(['M4','arqueiro']);return list;}return [...ALARM_STEPS[step],...(s.heroes.length>=4?ALARM_BONUS[step]||[]:[])];}
  const REVEAL_TEXT={};
  const PERSONAL={
    aquiles:{name:'Diante de Heitor',goal:1,text:'Cause dano a Heitor.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    menelau:{name:'A dívida de Páris',goal:1,text:'Cause dano a Páris.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    odisseu:{name:'Arco de Ítaca',goal:2,text:'Derrote 2 tropas troianas.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    ajax:{name:'Muralha dos aqueus',goal:3,text:'Resista de pé a 3 ataques no acampamento (A1 ou A2).',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    agamemnon:{name:'Rei dos reis',goal:1,text:'Esteja de pé em A1 quando Heitor recuar.',reward:'Aprende uma nova habilidade, à escolha do jogador.'}
  };
  const CHRONICLE={
    2:{id:'portao',title:'O portão se abre',text:'De madrugada, as trompas de Troia não contam homens: chamam para a guerra. O portão se abre.'},
    3:{id:'estacas',title:'Estacas afiadas',text:'Os carpinteiros da frota cravam estacas diante das tendas, mas alguém precisa vigiá-las.',demand:'Mantenham um herói de pé em A2 até a próxima resposta de Troia: o Alarme cai 1. Se não, os troianos arrancam as estacas: Alarme +1.'},
    4:{id:'heitor',title:'O nome de Heitor',text:'Nas fileiras troianas, um nome passa de boca em boca. Os gregos mais velhos sabem o que ele significa.'},
    5:{id:'feridos',title:'Os feridos',text:'Os feridos se amontoam nas tendas. Os curandeiros pedem comida, e não há muita.'},
    6:{id:'batedores',title:'Olhos na planície',text:'Batedores troianos medem a linha grega de longe.',demand:'Se nenhum explorador troiano estiver à vista ao fim da próxima resposta, o Alarme cai 1.'},
    7:{id:'flechas',title:'Chuva de flechas',text:'Do alto das colinas, flechas caem sobre as tendas. Ninguém sabe de onde vêm, mas todos sabem de quem.'},
    8:{id:'navios',title:'Fogo perto dos navios',text:'Uma tocha troiana cai perto dos navios. Se a frota queimar, ninguém volta para casa.',demand:'Mantenham um herói de pé em N1 até a próxima resposta de Troia, ou uma tenda pega fogo (1 dano às tendas).'},
    9:{id:'noite',title:'A noite das fogueiras',text:'Os troianos acampam na planície, à vista dos gregos. Mil fogueiras.'},
    10:{id:'aurora',title:'Aurora',text:'O dia nasce cinza. Quem ainda está de pé olha para o portão e espera.'},
    11:{id:'ultima',title:'A última carga',text:'Troia joga tudo o que tem contra as tendas. Ou a linha segura agora, ou não segura nunca.'},
    12:{id:'silencio',title:'Silêncio',text:'Por um instante, ninguém grita. Só se ouve o mar.'}
  };
  // A peste de Apolo (opção "Recusar"): castigo em ciclo, crescendo 1 a cada ciclo.
  const PLAGUE=['vida','favor','comida'];
  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  const up=h=>h.hp>0&&!h.away;
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function isRevealed(s,zone){return s.revealed.includes(zone);}
  function reveal(s,zone,by='heroi'){if(!ACTIVE[zone]||isRevealed(s,zone))return false;s.revealed.push(zone);s.lastReveals.push(zone);log(s,(by==='troia'?'Tropas troianas surgiram em '+zone+'. ':'Nova peça: ')+'posicionem '+ACTIVE[zone].name+' na mesa.');return true;}
  function spawn(s,zone,type='explorador'){const e=TROOPS.create('e'+s.nextEnemy++,zone,type);if(type==='heitor'&&s.scrolls.includes('segredos-1'))e.armor=0;s.enemies.push(e);reveal(s,zone,'troia');return e;}
  function startingAbilities(id,options){const known=options.known?.[id];if(Array.isArray(known)&&known.length&&known.every(n=>Number.isInteger(n)&&n>=0&&n<=2))return [...new Set(known)].sort();if(!options.abilities)return [0,1,2];const n=options.abilities[id];if(!Number.isInteger(n)||n<0||n>2)throw Error('Escolham a habilidade inicial de cada herói.');return [n];}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const legacy=options.legacy||{},scrolls=[...new Set(options.scrolls||[])];
    const revealed=ALL.filter(z=>!options.revealedZones||options.revealedZones.includes(z)||['A1','N1','M1'].includes(z));
    const heroes=ids.map((id,i)=>{const h={...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'A1',cargo:false,food:0,moves:0,away:false,known:startingAbilities(id,options)};const life=options.life?.[id];if(Number.isInteger(life))h.hp=Math.max(0,Math.min(HEROES.stats(h).maxHp,life));if(!h.hp)h.ap=0;h.startHp=h.hp;return h;});
    const store=Math.max(0,Math.min(99,Number.isInteger(options.campFood)?options.campFood:0))+(scrolls.includes('pastores-1')?1:0);
    const criseida=legacy.criseida==='taken'?'camp':'free';
    const s={version:VERSION,mission:MISSION,route:'A',players,playerNames,round:1,phase:'heroes',result:null,reason:'',campFood:store,foodSetup:store>0&&heroes.some(h=>h.hp<HEROES.stats(h).maxHp),foodSpent:0,
      scrolls,legacy,campDamage:0,built:true,supplies:{},delivered:0,required:0,criseida,crisesDone:criseida!=='camp',plague:0,plagueActive:false,embassy:0,heitorOut:false,commanderDown:false,retreated:0,
      revealed:[...revealed],lastReveals:[],visited:[...revealed],alarm:0,alarmFired:[],combatZones:[],shipNoise:true,
      tokens:Object.fromEntries(Object.keys(TOKENS).map(zone=>[zone,{resolved:false,peeked:false}])),favor:Math.max(0,Math.min(FAVOR_MAX,Number.isInteger(options.favor)?options.favor:1)),invokedRound:0,
      encounter:null,personal:Object.fromEntries(ids.map(id=>[id,{progress:0,done:false}])),lastFeats:[],chronicle:null,
      guards:{},nextEnemy:1,heroes,enemies:[],log:[],outcome:null};
    if(!s.foodSetup&&!s.crisesDone)s.encounter={id:'crises',zone:'A1'};
    log(s,'Heitor viu os gregos diante do portão. Agora Troia vem até o acampamento.');use(s);
    return s;
  }
  function distance(from,to){const Z=ACTIVE;if(!Z[from]||!Z[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of Z[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function knownDistance(s,from,to){use(s);if(!isRevealed(s,from)||!isRevealed(s,to))return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ACTIVE[at].links)if(!seen.has(n)&&isRevealed(s,n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone,goal='A1'){return ACTIVE[zone].links.slice().sort((a,b)=>distance(a,goal)-distance(b,goal))[0];}
  // A ofensiva marcha para as tendas; ataca quem estiver no caminho, a uma peça.
  function huntGoal(s,e){if(e.type==='heitor')return 'A1';const prey=s.heroes.filter(h=>up(h)&&distance(e.zone,h.zone)<=1).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone))[0];return prey?prey.zone:'A1';}
  // Quem atira de outra peça perde 1 de força: o tiro de longe é mais fraco que o golpe.
  function rangedTarget(s,e){const r=TROOPS.types[e.type]?.range||0;if(!r)return null;return s.heroes.filter(h=>up(h)&&distance(e.zone,h.zone)<=r).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||a.hp-b.hp)[0]||null;}
  function intimidationZone(s,e){return ACTIVE[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>up(h)&&h.zone===a))-Number(s.heroes.some(h=>up(h)&&h.zone===b))||distance(b,'A1')-distance(a,'A1'))[0];}
  function alarmMax(){return ALARM_MAX;}
  function nextAlarm(s){const steps=Object.keys(ALARM_STEPS).map(Number).filter(n=>!s.alarmFired.includes(n)).sort((a,b)=>a-b);if(!steps.length||s.commanderDown)return {at:ALARM_MAX,entries:[]};const at=steps[0];return {at,entries:criseidaDelays(s,at)?[]:alarmEntries(s,at)};}
  function waves(s){return nextAlarm(s).entries.map(([zone])=>zone);}
  // Com Criseida no acampamento, Troia hesita: o primeiro reforço não vem (DILEMAS.md).
  function criseidaDelays(s,step){return step===4&&s.criseida==='camp';}
  function intent(e,s){use(s);if(e.stunned)return 'Atordoado: perderá esta ativação';if(e.intimidated)return 'Intimidado: não poderá atacar nesta resposta';const lure=HEROES.taunt(s,e,distance,false);if(lure)return 'Priorizar Agamêmnon em '+lure.zone;const shot=rangedTarget(s,e);if(shot)return 'Atirar em '+heroName(shot.id)+(shot.zone!==e.zone?' em '+shot.zone:'');if(s.heroes.some(h=>h.zone===e.zone&&up(h)))return 'Atacar um herói aqui';const goal=huntGoal(s,e);if(goal!=='A1')return 'Atacar os gregos em '+goal;return e.zone==='A1'?'Atacar as tendas':'Avançar para '+ACTIVE[nextStep(e.zone)].name;}
  function finish(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;if(s.encounter?.id!=='ability')s.encounter=null;
    if(result==='victory')s.outcome={completed:MISSION,next:'Outro caminho',campFood:s.campFood,revealedZones:[...s.revealed],scrolls:[...s.scrolls],commanders:{heitor:'alive',paris:'alive'},legacy:{criseida:s.criseida,aquilesAway:s.heroes.some(h=>h.away),plague:s.plague},heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]}))};
    log(s,reason);}
  function defeat(s){if(s.result)return;if(s.campDamage>=TENTS)finish(s,'defeat','Troia rompeu a linha e incendiou as tendas.');else if(!s.heroes.some(up))finish(s,'defeat','Todos os heróis caíram, e a linha cedeu.');}
  // Vitória: Heitor ferido até a metade recua, e Troia recua com ele.
  function victory(s){if(s.result||!s.commanderDown)return;const king=s.heroes.find(h=>h.id==='agamemnon');if(king&&up(king)&&king.zone==='A1')feat(s,'agamemnon');finish(s,'victory','Heitor recua ferido para trás das muralhas, e Troia recua com ele. A linha grega segurou.');}
  function addAlarm(s,amount,reason){
    if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(ALARM_MAX,s.alarm+amount));if(s.alarm===before)return;
    log(s,'Alarme de Troia '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+ALARM_MAX+'): '+reason+'.');
    for(const step of Object.keys(ALARM_STEPS).map(Number).sort((a,b)=>a-b)){
      if(s.alarm<step||s.alarmFired.includes(step))continue;s.alarmFired.push(step);if(s.commanderDown)continue;
      if(criseidaDelays(s,step)){log(s,'Com a filha do sacerdote no acampamento grego, Troia hesita: o primeiro reforço não vem.');continue;}
      const entries=alarmEntries(s,step);for(const [zone,type] of entries){spawn(s,zone,type);if(type==='heitor')s.heitorOut=true;}
      log(s,(step===18?'Troia em peso! ':step===11?'Heitor sai pelo portão. ':step===7?'Páris aparece na muralha com o seu arco. ':'')+'Troia reage ao alarme '+step+': '+entries.map(([zone,type])=>TROOPS.types[type].short+' em '+zone).join(', ')+'.');
    }
    defeat(s);
  }
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  function feat(s,id,amount=1){
    const p=s.personal?.[id],def=PERSONAL[id],h=s.heroes.find(x=>x.id===id);if(!p||p.done||!def||!h||s.result)return;
    p.progress=Math.min(def.goal,p.progress+amount);if(p.progress<def.goal)return;p.done=true;s.lastFeats.push(id);addFavor(s,1,'o feito de '+heroName(id));const options=[0,1,2].filter(n=>!h.known.includes(n));if(options.length&&!s.encounter)s.encounter={id:'ability',hero:id,zone:h.zone,choices:options};else if(options.length)s.pendingAbility=id;
    log(s,'Feito de '+heroName(id)+': '+def.name+'. '+def.reward);
  }
  function eat(s,h,amount){const room=h&&up(h)?Math.max(0,HEROES.stats(h).maxHp-h.hp):0,gain=Math.min(room,amount),stored=amount-gain;if(gain)h.hp+=gain;s.campFood+=stored;
    return [gain?'+'+gain+' de vida para '+heroName(h.id):'',stored?'+'+stored+' comida no armazém':''].filter(Boolean).join(' e ');}
  // Custo pago em comida do armazém; o que faltar sai da vida de Agamêmnon (o rei responde pela expedição).
  function payFood(s,amount,reason){const fromStore=Math.min(s.campFood,amount);s.campFood-=fromStore;const rest=amount-fromStore,king=s.heroes.find(h=>h.id==='agamemnon');let lost=0;if(rest&&king&&king.hp>0){lost=Math.min(king.hp,rest);king.hp-=lost;if(!king.hp)king.ap=0;}log(s,reason+': '+fromStore+' comida do armazém'+(lost?' e '+lost+' de vida de Agamêmnon':'')+'.');return {fromStore,lost};}
  const CHRONICLE_CHECKS={
    estacas:{check:s=>s.heroes.some(h=>up(h)&&h.zone==='A2'),success:s=>addAlarm(s,-1,'as estacas seguraram a primeira carga'),fail:s=>addAlarm(s,1,'os troianos arrancaram as estacas')},
    batedores:{check:s=>!s.enemies.some(e=>e.type==='explorador'&&isRevealed(s,e.zone)),success:s=>addAlarm(s,-1,'nenhum batedor mede a linha grega'),fail:s=>log(s,'Crônica: os batedores continuam a medir a linha.')},
    navios:{check:s=>s.heroes.some(h=>up(h)&&h.zone==='N1'),success:s=>log(s,'Crônica: a tocha foi apagada antes de alcançar os navios.'),fail:s=>{s.campDamage++;log(s,'Crônica: o fogo pegou numa tenda ('+s.campDamage+'/'+TENTS+' danos).');defeat(s);}}
  };
  function resolveChronicle(s){const c=s.chronicle;if(!c||c.status!=='open'||s.result)return;const rule=CHRONICLE_CHECKS[c.id];const ok=c.favored||rule.check(s);c.status=ok?'success':'fail';s.chronicleResult={id:c.id,status:c.status};(ok?rule.success:rule.fail)(s);}
  function startChronicle(s){const entry=CHRONICLE[s.round];if(!entry||s.result){s.chronicle=null;return;}s.chronicle={round:s.round,id:entry.id,status:CHRONICLE_CHECKS[entry.id]?'open':'told'};log(s,'Crônica da rodada '+s.round+': '+entry.title+'.');}
  function enter(s,h,zone){h.zone=zone;reveal(s,zone);if(!s.visited.includes(zone))s.visited.push(zone);}
  function dropCargo(){}
  function retreat(s){s.commanderDown=true;s.retreated=s.enemies.length;s.enemies=[];log(s,'Heitor, ferido, recua para trás do portão. A ofensiva troiana recua com ele.');}
  function kill(s,e,damage,ignoreArmor=0){const armor=ignoreArmor===true?0:Math.max(0,(e.armor||0)-ignoreArmor);const dealt=Math.max(0,damage-armor);e.hp-=dealt;
    if(e.type==='heitor'&&e.hp>0&&e.hp<=HEITOR_RETREAT){retreat(s);return dealt;}
    if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');if(e.type==='heitor')retreat(s);}return dealt;}
  function strike(s,h,e,amount,options={}){
    const type=e.type,before=e.hp;
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu');
    const hurt=e.hp<before||!s.enemies.includes(e);
    if(hurt&&type==='heitor')feat(s,'aquiles');
    if(hurt&&type==='paris'&&h.id==='menelau')feat(s,'menelau');
    if(!s.enemies.includes(e)&&h.id==='odisseu')feat(s,'odisseu');
    if(s.commanderDown)return;
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(e.hp>0&&!e.stunned&&!options.ranged&&!(TROOPS.types[e.type]?.range>0)){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true,distance});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true,distance});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+heroName(h.id)+'.');if(!h.hp)return false;}
    h.moves++;enter(s,h,target);return true;
  }
  function interactions(s,h){
    use(s);const list=[],foes=s.enemies.some(e=>e.zone===h.zone),add=(id,label,detail,available=true)=>list.push({id,label,detail,available:available&&!foes});
    if(h.zone==='A1'&&s.plagueActive)add('council','Conselho de guerra','Reunir os reis e decidir de novo sobre Criseida');
    const achilles=s.heroes.find(a=>a.id==='aquiles');
    if(h.zone==='N4'&&achilles?.away&&['odisseu','ajax'].includes(h.id))add('embassy','Embaixada aos Mirmidões ('+s.embassy+'/2)','2 ações em N4, sem inimigos, de Odisseu ou Ájax');
    const token=s.tokens[h.zone];if(token&&!token.resolved&&isRevealed(s,h.zone))add('explore','Investigar: '+tokenOf(s,h.zone).hint.toLocaleLowerCase('pt-BR'),token.peeked?'Atena revelou: '+foundPreview(s,h.zone)+' A busca faz barulho (Alarme +1).':'Ninguém sabe o que há ali; a busca faz barulho (Alarme +1)');
    return list;
  }
  function foundPreview(s,zone){return tokenOf(s,zone).found.split('{hero}').join('quem investigar');}
  function tokenDetail(zone){const t=TOKENS[zone];return t?'+'+t.amount+' comida':'';}
  function interaction(s,h){const list=interactions(s,h);return list.find(x=>x.available)||list[0]||{id:null,label:'Explorar',detail:'Nada para resolver aqui',available:false};}
  function resolveToken(s,h,def){const t=tokenOf(s,h.zone);s.tokens[h.zone].resolved=true;const zone=h.zone;const message='explorou '+t.name+': '+eat(s,h,t.amount);s.lastFind={zone,title:t.hint,text:t.found.split('{hero}').join(def.name)};addAlarm(s,1,'o barulho da busca em '+zone+' chama atenção');return message;}
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});use(s);
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Concluam a distribuição da vida antes da primeira ação.');
    if(s.encounter)return fail('Resolvam a decisão antes de continuar.');
    if(!h||h.away)return fail(h?.away?'Aquiles está nas tendas dos Mirmidões e não luta.':'Herói desconhecido.');
    if(h.hp<=0||(h.ap<=0&&action!=='rescue'))return fail('Escolha um herói de pé com ações disponíveis.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone),visible=e=>e&&isRevealed(s,e.zone);let message='';
    if(action==='move'){if(!ACTIVE[h.zone].links.includes(target))return fail('Escolha uma região conectada.');const origin=h.zone,known=isRevealed(s,target);message=moveHero(s,h,target)?(known?'moveu para '+target:'avançou para o desconhecido e revelou '+target):'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&visible(e)&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      const options=interactions(s,h),choice=target?options.find(x=>x.id===target):options.find(x=>x.available);
      if(foes().length)return fail('Elimine os inimigos nesta peça antes de interagir.');
      if(!choice||!choice.available)return fail('Não há nada para resolver aqui.');
      if(choice.id==='explore')message=resolveToken(s,h,def);
      else if(choice.id==='council'){s.encounter={id:'crises',zone:'A1',council:true};message='reuniu os reis em conselho';}
      else if(choice.id==='embassy'){s.embassy++;if(s.embassy<2)message='começou a embaixada aos Mirmidões (1/2)';else{const a=s.heroes.find(x=>x.id==='aquiles');a.away=false;a.hp=HEROES.stats(a).maxHp;a.zone='N4';a.ap=0;s.lastFind={zone:'N4',title:'A volta de Aquiles',text:'Nas tendas negras, '+heroName(h.id)+' fala longamente. Aquiles escuta em silêncio e, por fim, pede a armadura. Os Mirmidões batem as lanças nos escudos.'};message='convenceu Aquiles a voltar à luta';}}
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível preparar habilidades com inimigos nesta peça.');if(!h.used.length)return fail('As habilidades já estão prontas. Vida só se recupera com comida encontrada.');h.used=[];message='preparou suas habilidades';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0&&!a.away);if(!a)return fail('Escolha um aliado caído nesta peça.');if(h.hp<2)return fail('Socorrer transfere 1 de vida: quem socorre precisa ter ao menos 2.');h.hp--;a.hp=1;a.ap=1;message='socorreu '+heroName(a.id)+', dando-lhe 1 da sua própria força';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(c&&h.known&&!h.known.includes(n))return fail('Este herói ainda não conhece esta habilidade.');if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target&&visible(e)),a=s.heroes.find(a=>a.id===target&&!a.away);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,{piercing:c.piercing,stun:c.stun,breakArmor:c.breakArmor,ranged:c.type==='ranged'});}
      else if(c.type==='multiRanged'){
        const ids=String(target).split(',').filter(Boolean),targets=[...new Set(ids)].map(id=>s.enemies.find(enemy=>enemy.id===id&&visible(enemy)));
        if(!targets.length||targets.length>2||targets.some(enemy=>!enemy)||new Set(targets.map(enemy=>enemy.zone)).size!==1||distance(h.zone,targets[0].zone)>1)return fail('Escolha até dois inimigos diferentes, juntos nesta área ou em uma área vizinha.');
        for(const enemy of targets){if(s.commanderDown)break;strike(s,h,enemy,c.value,{piercing:true,ranged:true});}
      }
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,0,{precision:true,piercing:true,ranged:true});}
      else if(c.type==='charge'){if(!e||!ACTIVE[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma peça vizinha.');h.moves++;enter(s,h,e.zone);strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta peça.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&up(a));const steps=ally?knownDistance(s,h.zone,zone):Infinity;if(!ally||zone===h.zone||steps>c.value)return fail('Escolha um aliado nesta peça e um destino revelado a até duas áreas.');ally.moves++;enter(s,ally,zone);}
      else if(c.type==='sprint'){const steps=distance(h.zone,target);if(target===h.zone||steps>2)return fail('Destino a até duas peças.');h.moves++;if(steps===2){const mid=ACTIVE[h.zone].links.filter(z=>ACTIVE[z].links.includes(target)).sort((a,b)=>Number(isRevealed(s,b))-Number(isRevealed(s,a)))[0];enter(s,h,mid);}enter(s,h,target);}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta peça.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;kill(s,e,c.value);if(s.enemies.includes(e)){e.zone=zone;e.intimidated=true;reveal(s,zone,'troia');log(s,TROOPS.label(e)+' sofreu '+c.value+' de dano, recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    if(action!=='rescue')h.ap=Math.max(0,h.ap-1);log(s,def.name+' '+message+'.');defeat(s);victory(s);return {ok:true,state:s};
  }
  function invoke(state,god,target){
    const s=clone(state),fail=error=>({ok:false,error,state}),g=GODS[god];use(s);
    if(!g)return fail('Deus desconhecido.');if(s.result||s.phase!=='heroes'||s.foodSetup)return fail('Não é possível invocar agora.');if(s.encounter)return fail('Resolvam a decisão antes de continuar.');
    if(s.invokedRound===s.round)return fail('Os deuses já foram invocados nesta rodada.');if(s.favor<g.cost)return fail(g.name+' exige '+g.cost+' de Favor.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;let message;
    if(god==='atena'){const tk=s.tokens[target];if(!tk||tk.resolved||tk.peeked||!isRevealed(s,target))return fail('Escolha uma ficha de exploração à vista.');tk.peeked=true;s.lastFind={zone:target,title:'Olhos de Atena',text:foundPreview(s,target)};message='Atena revelou o que há em '+target;}
    else if(god==='poseidon'){addAlarm(s,-2,'o mar revolto atrasa as tropas de Troia');message='o mar de Poseidon se agitou contra Troia';}
    else{const c=s.chronicle;if(!c||c.status!=='open'||c.favored)return fail('Não há pedido da crônica em aberto.');c.favored=true;message='Zeus enviou um presságio: o pedido da crônica está cumprido';}
    s.favor-=g.cost;s.invokedRound=s.round;log(s,g.title+': '+message+' (Favor '+s.favor+'/'+FAVOR_MAX+').');defeat(s);victory(s);return {ok:true,state:s};
  }
  // As saídas que o comandante tem diante de Crises (DILEMAS.md).
  function crisesChoices(s){const list=['sacrifice'];if(s.heroes.some(h=>h.id==='aquiles'&&!h.away))list.push('briseida');if(!s.encounter?.council)list.push('refuse');list.push('intercede');return list;}
  function choose(state,choice){const r=chooseOne(state,choice);if(r.ok&&!r.state.encounter&&r.state.pendingAbility){const s=r.state,h=s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;const left=h?[0,1,2].filter(x=>!h.known.includes(x)):[];if(left.length)s.encounter={id:'ability',hero:h.id,zone:h.zone,choices:left};}return r;}
  function chooseOne(state,choice){
    const s=clone(state),fail=error=>({ok:false,error,state});use(s);if(!s.encounter)return fail('Não há decisão aberta.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;const enc=s.encounter,h=s.heroes.find(a=>a.id===enc.hero);
    if(enc.id==='crises'){
      if(!crisesChoices(s).includes(choice))return fail('Escolha indisponível.');
      const end=(title,text)=>{s.encounter=null;s.crisesDone=true;s.plagueActive=false;s.lastFind={zone:'A1',title,text};};
      if(choice==='sacrifice'){const paid=payFood(s,2,'A hecatombe a Apolo');s.criseida='returned';end('A hecatombe','Criseida volta ao pai num navio carregado de oferendas. Na praia, os bois são sacrificados a Apolo, e a fumaça sobe reta. '+(paid.lost?'Faltou comida no armazém, e o rei pagou com a própria força.':'O armazém ficou mais leve.'));log(s,'Criseida foi devolvida com sacrifício a Apolo.');return {ok:true,state:s};}
      if(choice==='briseida'){const a=s.heroes.find(x=>x.id==='aquiles');a.away=true;a.zone='N4';a.ap=0;s.criseida='returned';end('A ira de Aquiles','Criseida volta ao pai. Para não ficar sem a sua parte, Agamêmnon manda buscar Briseida nas tendas de Aquiles. Aquiles não ergue a espada contra o rei: ergue-se, chama os Mirmidões e se recolhe aos navios negros. Ele não lutará.');log(s,'Briseida foi tomada de Aquiles. Aquiles se retira para os navios negros (N4).');return {ok:true,state:s};}
      if(choice==='intercede'){if(s.favor<5)return fail('A intercessão exige 5 de Favor.');s.favor-=5;end('A intercessão','Atena fala com Zeus, e Zeus fala com Apolo. A peste passa ao largo das tendas, e Criseida continua no acampamento. Os deuses não farão isso de novo tão cedo.');log(s,'Um deus intercedeu junto a Zeus: a peste não virá (Favor −5).');return {ok:true,state:s};}
      if(choice==='refuse'){s.encounter=null;s.crisesDone=true;s.plagueActive=true;s.lastFind={zone:'A1',title:'A recusa',text:'Agamêmnon expulsa o velho sacerdote. Crises caminha pela praia até o mar e ergue as mãos para Apolo. À noite, os cães começam a morrer.'};log(s,'Agamêmnon recusou o resgate. A peste de Apolo começa.');return {ok:true,state:s};}
    }
    if(enc.id==='ability'){const n=Number(choice);if(!h||!enc.choices.includes(n))return fail('Escolham uma das habilidades ainda não aprendidas.');h.known.push(n);h.known.sort();s.encounter=null;s.lastLearn={hero:h.id,kind:'ability',card:n};log(s,heroName(h.id)+' aprendeu '+HEROES.find(d=>d.id===h.id).cards[n].name+'. Virem a carta no tabuleiro do herói.');const next=s.pendingAbility&&s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;if(next){const left=[0,1,2].filter(x=>!next.known.includes(x));if(left.length)s.encounter={id:'ability',hero:next.id,zone:next.zone,choices:left};}return {ok:true,state:s};}
    return fail('Decisão desconhecida.');
  }
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição indisponível.');
    if(delta===1){if(!s.campFood)return fail('O armazém está vazio.');if(h.hp>=HEROES.stats(h).maxHp)return fail('Este herói já está com a vida cheia.');h.hp++;s.campFood--;if(h.hp>0&&h.ap===0)h.ap=HEROES.stats(h).actions;}
    else{if(h.hp<=h.startHp)return fail('Só é possível devolver o que foi distribuído agora.');h.hp--;s.campFood++;if(!h.hp)h.ap=0;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Vida reposta com o armazém. Restam '+s.campFood+' comida(s) guardadas.');if(!s.crisesDone)s.encounter={id:'crises',zone:'A1'};return {ok:true,state:s};}
  // A peste da vez: vida, Favor ou comida, em ciclo, crescendo 1 a cada ciclo.
  function plagueStrike(s){const kind=PLAGUE[s.plague%3],amount=Math.floor(s.plague/3)+1;s.plague++;let text='';
    if(kind==='vida'){const hit=s.heroes.filter(up);for(const h of hit){h.hp=Math.max(0,h.hp-amount);if(!h.hp)h.ap=0;}text='A peste entra nas tendas: cada herói de pé perde '+amount+' de vida.';}
    else if(kind==='favor'){const paid=Math.min(s.favor,amount),rest=amount-paid;s.favor-=paid;const king=s.heroes.find(h=>h.id==='agamemnon');let lost=0;if(rest&&king&&king.hp>0){lost=Math.min(king.hp,rest);king.hp-=lost;}text='Os deuses viram as costas: '+(paid?'−'+paid+' de Favor':'não há Favor a perder')+(lost?', e Agamêmnon perde '+lost+' de vida':'')+'.';}
    else{const r=payFood(s,amount,'A peste estraga a comida');text='A peste estraga os mantimentos: '+r.fromStore+' comida do armazém'+(r.lost?' e '+r.lost+' de vida de Agamêmnon':'')+'.';}
    s.lastFind={zone:'A1',title:'A peste de Apolo',text:text+' No Conselho de guerra, em A1, o comandante pode mudar de ideia.'};log(s,'Peste de Apolo: '+text);}
  function trojanTurn(state){
    const s=clone(state);use(s);if(s.result||s.phase!=='heroes'||s.foodSetup||s.encounter)return s;s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of [...s.enemies]){
      if(!s.enemies.some(a=>a.id===e.id))continue;
      if(e.stunned){e.stunned=false;log(s,TROOPS.label(e)+' perdeu a ativação por Atordoamento.');continue;}
      const intimidated=!!e.intimidated;e.intimidated=false;
      const lure=HEROES.taunt(s,e,distance,false);
      if(lure&&lure.zone!==e.zone&&!rangedTarget(s,e)){e.zone=ACTIVE[e.zone].links.slice().sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para Agamêmnon em '+e.zone+'.');continue;}
      const guard=s.guards[e.zone]||0,ranged=intimidated?null:rangedTarget(s,e);
      const h=intimidated?null:ranged||lure||s.heroes.filter(h=>h.zone===e.zone&&up(h)).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const damage=HEROES.damage(s,h,(e.attack??2)-(h.zone!==e.zone?1:0),log,{distance});log(s,heroName(h.id)+' sofreu '+damage+' de dano'+(h.zone!==e.zone?' à distância':'')+'.');if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&h.id!=='odisseu'&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2);kill(s,e,rebound);log(s,'Rebote grego corpo a corpo: '+rebound+' de dano em '+TROOPS.label(e)+'.');if(s.commanderDown){victory(s);return s;}}if(h.hp>0&&h.id==='ajax'&&['A1','A2'].includes(h.zone))feat(s,'ajax');if(!h.hp)h.ap=0;}
      else if(e.zone==='A1'){if(guard){s.guards.A1--;log(s,'A proteção absorveu o ataque às tendas.');}else{s.campDamage++;log(s,'Ataque às tendas: '+s.campDamage+'/'+TENTS+' danos.');}}
      else{e.zone=nextStep(e.zone,huntGoal(s,e));reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    victory(s);if(s.result)return s;
    resolveChronicle(s);if(s.result)return s;
    if(s.plagueActive){plagueStrike(s);defeat(s);if(s.result)return s;}
    s.round++;s.combatZones=[];s.heroes.forEach(h=>{h.ap=up(h)?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;h.moves=0;});
    addAlarm(s,2,'a ofensiva de Troia avança');
    startChronicle(s);
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!==MISSION||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players||!Array.isArray(s.revealed)||!s.revealed.includes('A1')||s.revealed.some(z=>!ZONES[z]))return false;
    if(!integer(s.alarm,0,ALARM_MAX)||!Array.isArray(s.alarmFired)||s.alarmFired.some(n=>!ALARM_STEPS[n]))return false;
    if(!s.heroes.some(h=>h.id==='odisseu')||!s.heroes.some(h=>h.id==='agamemnon')||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&typeof h.away==='boolean'&&Array.isArray(h.known)&&h.known.length>=1))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,99)||!integer(s.campDamage,0,TENTS)||typeof s.commanderDown!=='boolean'||!Array.isArray(s.scrolls)||!['camp','free','returned'].includes(s.criseida)||!integer(s.plague,0,99)||!integer(s.embassy,0,2))return false;
    if(!s.tokens||Object.keys(s.tokens).sort().join()!==Object.keys(TOKENS).sort().join()||!integer(s.favor,0,FAVOR_MAX))return false;
    if(s.encounter!==null&&(!s.encounter||!['crises','ability'].includes(s.encounter.id)))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&TROOPS.types[e.type]&&integer(e.hp,1,TROOPS.types[e.type].hp)))return false;
    if(s.result==='victory'&&(!s.commanderDown||s.outcome?.completed!==MISSION))return false;
    return Array.isArray(s.log)&&typeof s.reason==='string';
  }
  function zonesOf(s){return use(s);}
  return {VERSION,MAX_ROUNDS,MISSION,huntGoal,alarmMax,ALARM_MAX,PERSONAL,CHRONICLE,GODS,FAVOR_MAX,TENTS,HEITOR_RETREAT,invoke,tokenOf,ALARM_STEPS,FOOD_LIMIT,HEROES,TROOPS,TERRAINS,ZONES,TOKENS,REVEAL_TEXT,BEACHES,BASE,newGame,distance,knownDistance,isRevealed,intent,waves,nextAlarm,interaction,interactions,tokenDetail,act,choose,crisesChoices,allocateFood,finishFoodSetup,trojanTurn,validSave,zonesOf};
});
