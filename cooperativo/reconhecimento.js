(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyRecon=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  // Missão 2 — Diante das muralhas: reconhecer o portão de Troia e voltar com todos de pé ao acampamento.
  // Mesmas regras da campanha (docs/REGRAS-CAMPANHA.md): Alarme com patamares, vida é comida, fases de herói e de Troia.
  const VERSION=2,MAX_ROUNDS=60,FOOD_LIMIT=2,ALARM_MAX=18,MISSION='reconhecimento';
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'},M:{art:'portoes',name:'Muralha'}};
  const NAMES={C1:'Santuário de Apolo',A1:'Acampamento',P3:'Campo aberto',P7:'Trilha dos pinheiros',P4:'Diante das muralhas',B5:'Bosque dos pastores',M4:'Torre de vigia',M1:'Portão de Troia'};
  const CONNECTIONS={P1:['P6','A1','A2','P3'],P6:['P1','A2','C2','P3','P7'],C2:['P6','A2','P2','P7','P4'],C1:['P2'],A1:['P1','A2','N1'],A2:['A1','P1','P6','C2','P2','N1','N2'],P2:['A2','C2','C1','N2','N3','N4'],N1:['A1','A2','N2'],N2:['N1','A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2'],
    P3:['P1','P6','P7','M4'],P7:['P6','C2','P4','P3','M4','M1'],P4:['C2','B5','P7','M1'],B5:['P4','M1'],M4:['P3','P7','M1'],M1:['M4','P7','P4','B5']};
  const ZONES={};
  for(const [id,links] of Object.entries(CONNECTIONS))ZONES[id]={name:id+' · '+(NAMES[id]||TERRAINS[id[0]].name),terrain:id[0],art:TERRAINS[id[0]].art,links:[...links]};
  for(const [id,z] of Object.entries(ZONES))for(const n of z.links)if(!ZONES[n].links.includes(id))ZONES[n].links.push(id);
  const BASE=['P1','P6','C2','C1','A1','A2','P2','N1','N2','N3','N4'],WALLS=['P3','P7','P4','M4','M1'];
  const BEACHES=['N1','N2','N3','N4'];
  // Fichas de exploração: a pista não revela o que há ali.
  const TOKENS={
    P3:{kind:'clue',name:'Torres no horizonte',hint:'Torres no alto da planície',found:'Do meio do campo aberto, os homens contam as torres de Troia. Uma delas, colada à muralha, tem arqueiros. À esquerda, uma trilha de pastores some entre os pinheiros.'},
    P4:{kind:'food',amount:2,name:'Rebanho troiano',hint:'Balidos atrás das oliveiras',found:'Um rebanho de Troia pasta sem pastor à sombra das muralhas. Os homens de {hero} levam o que conseguem carregar. +2 comida.'},
    P7:{kind:'trail',amount:1,name:'Trilha dos pinheiros',hint:'Uma trilha some entre os pinheiros',found:'Uma trilha estreita de pastores, coberta de agulhas de pinheiro. +1 comida (pinhões e uma lebre).',foundScroll:'É a trilha da tabuinha do mensageiro. Seguindo as marcas de cera, os homens de {hero} descobrem por onde ela contorna as patrulhas: pergaminho Rotas da costa II.'},
    M4:{kind:'tower',name:'Torre de vigia',hint:'A torre dos arqueiros',found:'Do alto da torre se vê o portão, as ruas e os homens de Troia.'}
  };
  const tokenOf=(s,zone)=>TOKENS[zone];
  // Exploração por missão (REGRAS-CAMPANHA.md): só se anda por peças reveladas; cada ficha revela as peças para onde a pista aponta.
  const CLUES={P3:['M4','P7'],P7:['P4','M1'],P4:['B5']};
  const CLUE_TEXT={P7:'Do alto da trilha, entre os pinheiros, aparece a planície diante das muralhas e, no fundo, o portão de Troia.',P4:'Atrás das oliveiras, um bosque fechado solta fumaça de lenha: alguém vive ali.'};
  const FAVOR_MAX=6;
  const GODS={
    atena:{name:'Atena',cost:1,title:'Olhos de Atena',text:'Revela o que há numa ficha de exploração antes de investigá-la.'},
    poseidon:{name:'Poseidon',cost:2,title:'Mar revolto',text:'O mar se agita e atrasa as tropas de Troia. O Alarme cai 2.'},
    zeus:{name:'Zeus',cost:2,title:'Presságio de Zeus',text:'O pedido da crônica desta rodada conta como cumprido.'}
  };
  // Patamares do Alarme. Em 15 desce Sarpédon (derrotá-lo faz Troia recuar); em 18, Troia em peso sai pelo portão.
  const ALARM_STEPS={4:[['P4','explorador']],7:[['P7','lanceiro']],11:[['M1','lanceiro']],15:[['M1','sarpedon']],18:[]};
  const ALARM_BONUS={7:[['P4','explorador']],15:[['M1','lanceiro']]};
  function alarmEntries(s,step){if(step===18){const list=[];for(let i=0;i<s.heroes.length-1;i++)list.push(['M1','lanceiro']);list.push(['M4','arqueiro']);return list;}return [...ALARM_STEPS[step],...(s.heroes.length>=4?ALARM_BONUS[step]||[]:[])];}
  const REVEAL_TEXT={
    P3:'Um campo aberto sobe até as muralhas. Não há onde se esconder: das torres, tudo aqui é visto.',
    P7:'Uma trilha de pastores some entre os pinheiros, rumo ao alto.',
    P4:'A planície diante das muralhas. Oliveiras, muros de pedra baixos e, ao fundo, o portão.',
    B5:'Um bosque fechado. Fumaça de lenha entre as árvores: alguém vive aqui.',
    M4:'Uma torre de vigia colada à muralha. Arqueiros andam lá em cima.',
    M1:'O portão de Troia. Bronze, madeira escura e guardas imóveis. Do alto, alguém observa.'
  };
  const PERSONAL={
    aquiles:{name:'O guarda do portão',goal:1,text:'Derrote o guarda do portão de Troia.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    odisseu:{name:'Olhos de Ítaca',goal:2,text:'Investigue 2 fichas de exploração.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    agamemnon:{name:'Ninguém fica na planície',goal:1,text:'Esteja em A1 quando a expedição voltar completa.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    menelau:{name:'Irmão de armas',goal:1,text:'Socorra ou cure um aliado.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    ajax:{name:'Escudo diante das muralhas',goal:2,text:'Resista de pé a 2 ataques perto das muralhas (P3, P7, P4, M4 ou M1).',reward:'Aprende uma nova habilidade, à escolha do jogador.'}
  };
  const CHRONICLE={
    2:{id:'trompas',title:'Trompas na cidade',text:'Do alto das muralhas soam trompas. Não é um ataque: é Troia contando os seus homens.'},
    3:{id:'heitor',title:'Um elmo de crina',text:'Um guerreiro de elmo de crina observa do alto do portão. Os veteranos dizem o nome dele em voz baixa: Heitor.'},
    4:{id:'saque',title:'Saqueadores',text:'Enquanto os heróis sobem a planície, vultos rondam as tendas vazias.',demand:'Mantenham um herói de pé em A1 até a próxima resposta de Troia, ou os saqueadores levam 1 comida do armazém.'},
    5:{id:'paris',title:'O arco de Páris',text:'Uma flecha crava na terra, a um passo dos heróis. Lá no alto, um arqueiro de manto colorido sorri. Não errou por acaso.'},
    6:{id:'batedores',title:'Cavalos troianos',text:'Cavaleiros troianos cruzam a planície ao longe, rápidos, e somem atrás das oliveiras.',demand:'Se nenhum batedor troiano estiver à vista ao fim da próxima resposta, o Alarme cai 1.'},
    7:{id:'chuva',title:'Chuva no Ida',text:'Nuvens escuras descem do monte Ida. A chuva apaga as pegadas e encharca as cordas dos arcos.'},
    8:{id:'mortos',title:'Os mortos da praia',text:'No acampamento, os mortos do desembarque são queimados. A fumaça sobe reta no ar parado.'},
    9:{id:'torres',title:'Sinais nas torres',text:'As torres trocam sinais com espelhos de bronze. Alguém precisa cegar os olhos da muralha.',demand:'Se um herói estiver de pé em P3 ou P7 na próxima resposta de Troia, o Alarme cai 1. Se não, sobe 1.'},
    10:{id:'andromaca',title:'Uma mulher na muralha',text:'Do alto da muralha, uma mulher com um menino no colo procura alguém na planície. Ela não procura os gregos.'},
    11:{id:'conselho',title:'O conselho de Príamo',text:'Ouve-se um murmúrio que vem de dentro da cidade, como de uma assembleia. Troia está decidindo o que fazer com os gregos.'},
    12:{id:'noite',title:'Noite sem lua',text:'A noite cai sem lua. Fogueiras nas muralhas, fogueiras no acampamento, e o escuro inteiro entre os dois.'}
  };
  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function isRevealed(s,zone){return s.revealed.includes(zone);}
  function reveal(s,zone,by='heroi'){if(!ZONES[zone]||isRevealed(s,zone))return false;s.revealed.push(zone);s.lastReveals.push(zone);log(s,(by==='troia'?'Tropas troianas surgiram em '+zone+'. ':'Nova peça: ')+'posicionem '+ZONES[zone].name+' na mesa.');return true;}
  function spawn(s,zone,type='explorador'){const e=TROOPS.create('e'+s.nextEnemy++,zone,type);s.enemies.push(e);reveal(s,zone,'troia');return e;}
  function startingAbilities(id,options){const known=options.known?.[id];if(Array.isArray(known)&&known.length&&known.every(n=>Number.isInteger(n)&&n>=0&&n<=2))return [...new Set(known)].sort();if(!options.abilities)return [0,1,2];const n=options.abilities[id];if(!Number.isInteger(n)||n<0||n>2)throw Error('Escolham a habilidade inicial de cada herói.');return [n];}
  // options.legacy traz o que a missão 1 deixou (DILEMAS.md): náufragos, o velho, o mirante.
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    // Equipe vinda da campanha: pode ter menos heróis (os mortos não voltam), inclusive sem Odisseu ou Agamêmnon.
    const camp=options.campaign===true,validTeam=camp?(Number.isInteger(players)&&players>=1&&players<=5&&ids.length>=1&&ids.length<=5&&new Set(ids).size===ids.length&&ids.every(id=>HEROES.some(h=>h.id===id))&&owners.length===ids.length&&owners.every(n=>Number.isInteger(n)&&n>=1&&n<=players)&&new Set(owners).size===players):!(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players);
    if(!validTeam)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const legacy=options.legacy||{},revealed=[...BASE,'P3'];
    const heroes=ids.map((id,i)=>{const h={...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'A1',cargo:false,food:0,moves:0,known:startingAbilities(id,options)};const life=options.life?.[id];if(Number.isInteger(life))h.hp=Math.max(0,Math.min(HEROES.stats(h).maxHp,life));if(!h.hp)h.ap=0;h.startHp=h.hp;return h;});
    const store=Math.max(0,Math.min(99,Number.isInteger(options.campFood)?options.campFood:0))+(legacy.castaways==='rescued'?1:0);
    const s={version:VERSION,mission:MISSION,campaign:camp,route:'A',players,playerNames,round:1,phase:'heroes',result:null,reason:'',campFood:store,foodSetup:store>0&&heroes.some(h=>h.hp<HEROES.stats(h).maxHp),foodSpent:0,
      scrolls:[...new Set(options.scrolls||[])],legacy,campDamage:0,burned:0,delivered:0,required:0,built:true,supplies:{},reconned:false,reconProgress:0,reporter:null,pursuit:0,shipsBurned:0,commanderDown:false,retreated:0,criseida:'unseen',shepherds:'unseen',
      revealed:[...revealed],lastReveals:[],visited:revealed.filter(z=>z!=='C1'),alarm:0,alarmFired:[],combatZones:[],shipNoise:true,
      tokens:Object.fromEntries(Object.keys(TOKENS).map(zone=>[zone,{resolved:false,peeked:false}])),favor:Math.max(0,Math.min(FAVOR_MAX,1+(legacy.beggar==='zeus'?1:0)-(['abandoned','lost'].includes(legacy.castaways)?1:0))),invokedRound:0,
      encounter:null,personal:Object.fromEntries(ids.map(id=>[id,{progress:0,done:false}])),lastFeats:[],chronicle:null,
      guards:{},nextEnemy:1,heroes,enemies:[],log:[],outcome:null};
    // Os defensores fixos da muralha: só aparecem quando a peça é revelada.
    const post=(zone,type)=>{const e=TROOPS.create('e'+s.nextEnemy++,zone,type);e.hold=true;s.enemies.push(e);return e;};
    post('M1','guarda');post('M4','arqueiro');if(ids.length>=5)post('M4','arqueiro');
    // Desde o começo, patrulhas troianas descem para queimar os navios: alguém precisa guardar a frota. Uma por herói além de dois.
    for(let i=0;i<Math.max(1,ids.length-2);i++){const r=TROOPS.create('e'+s.nextEnemy++,['P2','C2','P2'][i],'lanceiro');r.raid=true;s.enemies.push(r);}
    // A costa da missão 1 já é conhecida, e Agamêmnon aponta a planície (P3). Quem tomou o mirante já viu também a torre de vigia.
    if(legacy.lookout===true)s.revealed.push('M4');
    if(legacy.lookout===false)s.enemies.push(TROOPS.create('e'+s.nextEnemy++,'P1','lanceiro'));
    if(legacy.beggar==='spy'){s.alarm=2;log(s,'O espião do círculo de pedras contou a Troia quantos somos: Alarme 2.');}
    log(s,'Com o acampamento de pé, Agamêmnon manda reconhecer o portão de Troia. Ninguém volta sem os outros.');
    return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function knownDistance(s,from,to){if(!isRevealed(s,from)||!isRevealed(s,to))return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)&&isRevealed(s,n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone,goal='A1'){return ZONES[zone].links.slice().sort((a,b)=>distance(a,goal)-distance(b,goal))[0];}
  // Tropas caçam o herói de pé mais próximo a até 3 peças; sem ninguém por perto, marcham para o acampamento.
  const SHIPS_MAX=3;
  function huntGoal(s,e){const prey=s.heroes.filter(h=>h.hp>0&&distance(e.zone,h.zone)<=3).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone))[0];return prey?prey.zone:'A1';}
  function intimidationZone(s,e){return ZONES[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(a,'M1')-distance(b,'M1'))[0];}
  function alarmMax(){return ALARM_MAX;}
  function nextAlarm(s){const steps=Object.keys(ALARM_STEPS).map(Number).filter(n=>!s.alarmFired.includes(n)).sort((a,b)=>a-b);if(!steps.length||s.commanderDown)return {at:ALARM_MAX,entries:[]};const at=steps[0];return {at,entries:alarmEntries(s,at)};}
  function waves(s){return nextAlarm(s).entries.map(([zone])=>zone);}
  function intent(e,s){if(e.stunned)return 'Atordoado: perderá esta ativação';{const shot=rangedTarget(s,e);if(shot&&!e.intimidated)return 'Atirar em '+heroName(shot.id)+(shot.zone!==e.zone?' em '+shot.zone:'');}if(e.hold&&e.post&&e.zone!==e.post&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return 'Voltar ao posto em '+e.post;if(e.hold&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return e.type==='guarda'?'Guardar o portão':'Vigiar do alto da torre';if(e.intimidated)return 'Intimidado: não poderá atacar nesta resposta';const lure=HEROES.taunt(s,e,distance,false);if(lure)return 'Priorizar Agamêmnon em '+lure.zone;if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';if(e.raid)return e.zone==='N1'?'Queimar um navio em N1':'Rumo aos navios: avançar para '+ZONES[nextStep(e.zone,'N1')].name;const goal=huntGoal(s,e);if(goal!=='A1')return 'Perseguir os gregos em '+goal;return e.zone==='A1'?'Atacar o acampamento':'Avançar para '+ZONES[nextStep(e.zone)].name;}
  function finish(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;if(s.encounter?.id!=='ability')s.encounter=null;
    if(result==='victory')s.outcome={completed:'reconhecimento',next:'Segurar a linha',campFood:Math.max(0,s.campFood-(s.shipsBurned||0)),revealedZones:[...s.revealed],scrolls:[...s.scrolls],commanders:{sarpedon:s.sarpedonWounds?'wounded':s.commanderDown?'dead':'alive'},legacy:{criseida:s.criseida,shepherds:s.shepherds,shipsBurned:s.shipsBurned||0,altarGold:!!s.altarGold,sarpedonWounds:s.sarpedonWounds||0},heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]}))};
    log(s,reason);}
  function defeat(s){if(s.result)return;if(s.campDamage>=3)finish(s,'defeat','Troia arrasou o acampamento enquanto os heróis estavam longe.');else if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram diante das muralhas.');}
  // Vitória: o relato e todos os heróis de pé de volta em A1. Quem ficou caído no campo morre (CAMPANHA.md).
  function victory(s){const up=s.heroes.filter(h=>h.hp>0),reporter=s.heroes.find(h=>h.id===s.reporter);if(s.result||!s.reconned||!reporter||reporter.hp<=0||!up.every(h=>h.zone==='A1'))return;if(up.length===s.heroes.length)feat(s,'agamemnon');const dead=s.heroes.filter(h=>!h.hp).map(h=>heroName(h.id));finish(s,'victory',dead.length?'O relato chegou ao acampamento, mas '+dead.join(' e ')+(dead.length>1?' ficaram':' ficou')+' na planície. Agamêmnon sabe agora o que espera os gregos diante do portão.':'Todos voltaram ao acampamento. Agamêmnon sabe agora o que espera os gregos diante do portão de Troia.');}
  function addAlarm(s,amount,reason){
    if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(ALARM_MAX,s.alarm+amount));if(s.alarm===before)return;
    log(s,'Alarme de Troia '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+ALARM_MAX+'): '+reason+'.');
    for(const step of Object.keys(ALARM_STEPS).map(Number).sort((a,b)=>a-b)){
      if(s.alarm<step||s.alarmFired.includes(step))continue;s.alarmFired.push(step);if(s.commanderDown)continue;
      const entries=alarmEntries(s,step);for(const [zone,type] of entries)spawn(s,zone,type);
      log(s,(step===18?'Troia em peso! ':step===15?'Sarpédon sai pelo portão com os seus lícios. ':'')+'Troia reage ao alarme '+step+': '+entries.map(([zone,type])=>TROOPS.types[type].short+' em '+zone).join(', ')+'.');
    }
    defeat(s);
  }
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  function feat(s,id,amount=1){
    const p=s.personal?.[id],def=PERSONAL[id],h=s.heroes.find(x=>x.id===id);if(!p||p.done||!def||!h||s.result)return;
    p.progress=Math.min(def.goal,p.progress+amount);if(p.progress<def.goal)return;p.done=true;s.lastFeats.push(id);addFavor(s,1,'o feito de '+heroName(id));const options=[0,1,2].filter(n=>!h.known.includes(n));if(options.length&&!s.encounter)s.encounter={id:'ability',hero:id,zone:h.zone,choices:options};else if(options.length)s.pendingAbility=id;
    log(s,'Feito de '+heroName(id)+': '+def.name+'. '+def.reward);
  }
  // Comida encontrada vira vida de quem a encontrou, até o máximo; o resto vai para o armazém (repõe vida na próxima missão).
  function eat(s,h,amount){const room=h&&h.hp>0?Math.max(0,HEROES.stats(h).maxHp-h.hp):0,gain=Math.min(room,amount),stored=amount-gain;if(gain)h.hp+=gain;s.campFood+=stored;
    return [gain?'+'+gain+' de vida para '+heroName(h.id):'',stored?'+'+stored+' comida no armazém':''].filter(Boolean).join(' e ');}
  function woundedAt(s,zone){return s.heroes.filter(h=>h.hp>0&&h.zone===zone).sort((a,b)=>(a.hp-HEROES.stats(a).maxHp)-(b.hp-HEROES.stats(b).maxHp))[0];}
  const CHRONICLE_CHECKS={
    saque:{check:s=>s.heroes.some(h=>h.hp>0&&h.zone==='A1'),success:s=>log(s,'Crônica: os saqueadores viram as lanças em A1 e sumiram.'),fail:s=>{if(s.campFood>0){s.campFood--;log(s,'Crônica: saqueadores levaram 1 comida do armazém.');}else log(s,'Crônica: os saqueadores reviraram o armazém vazio.');}},
    batedores:{check:s=>!s.enemies.some(e=>e.type==='explorador'&&isRevealed(s,e.zone)),success:s=>addAlarm(s,-1,'nenhum batedor troiano vigia a planície'),fail:s=>log(s,'Crônica: os cavaleiros continuam a rondar.')},
    torres:{check:s=>s.heroes.some(h=>h.hp>0&&['P3','P7'].includes(h.zone)),success:s=>addAlarm(s,-1,'os sinais das torres foram cegados'),fail:s=>addAlarm(s,1,'as torres trocaram sinais sobre os gregos')}
  };
  function resolveChronicle(s){const c=s.chronicle;if(!c||c.status!=='open'||s.result)return;const rule=CHRONICLE_CHECKS[c.id];const ok=c.favored||rule.check(s);c.status=ok?'success':'fail';s.chronicleResult={id:c.id,status:c.status};(ok?rule.success:rule.fail)(s);if(!ok&&!s.result)escalate(s,c.id);}
  // Pedido descumprido: Troia manda um contingente ligado à história. Uma tropa; duas com 5 heróis.
  const ESCALATION={"saque":["P2","explorador","Os saqueadores voltam em maior número"],"batedores":["P7","explorador","Os cavaleiros trazem outra patrulha"],"torres":["M4","arqueiro","As torres mandaram arqueiros para a muralha"]};
  function escalate(s,id){const e=ESCALATION[id];if(!e||s.commanderDown)return;const n=s.heroes.length>=5?2:1;for(let i=0;i<n;i++)spawn(s,e[0],e[1]);s.escalation=e[2];log(s,'Crônica: '+e[2]+' ('+n+' '+(TROOPS.types[e[1]].short)+' em '+e[0]+').');}
  function startChronicle(s){const entry=CHRONICLE[s.round];if(!entry||s.result){s.chronicle=null;return;}s.chronicle={round:s.round,id:entry.id,status:CHRONICLE_CHECKS[entry.id]?'open':'told'};log(s,'Crônica da rodada '+s.round+': '+entry.title+'.');}
  function enter(s,h,zone){
    h.zone=zone;
    if(s.visited.includes(zone))return;s.visited.push(zone);
    if(zone==='P3')addAlarm(s,1,'os gregos atravessam o campo aberto, à vista das torres');
    if(zone==='C1'&&s.criseida==='unseen'){s.criseida='met';s.encounter={id:'criseida',zone,hero:h.id};}
    if(zone==='B5'&&s.shepherds==='unseen'){s.shepherds='met';s.encounter={id:'shepherds',zone,hero:h.id};}
  }
  function dropCargo(){}
  function kill(s,e,damage,ignoreArmor=0){const armor=ignoreArmor===true?0:Math.max(0,(e.armor||0)-ignoreArmor);e.hp-=Math.max(0,damage-armor);
    // Sarpédon, filho de Zeus, não morre aqui: ferido até a metade, recua com os lícios, e Troia recua junto.
    if(e.type==='sarpedon'&&e.hp<=Math.ceil(TROOPS.types.sarpedon.hp/2)){e.hp=Math.max(1,e.hp);s.commanderDown=true;s.sarpedonWounds=TROOPS.types.sarpedon.hp-e.hp;s.retreated=s.enemies.length;s.enemies=[];s.lastFind={zone:e.zone,title:'Sarpédon recua',text:'O bronze grego abre o ombro de Sarpédon. Os lícios cercam o rei ferido e o carregam de volta ao portão, e Troia recua com eles. Ele voltará.'};log(s,'Sarpédon, ferido, recua com os lícios. As tropas troianas recuam para trás do portão.');return;}
    if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');
    if(e.type==='sarpedon'){s.commanderDown=true;s.retreated=s.enemies.length;s.enemies=[];log(s,'Com Sarpédon caído, as tropas troianas recuam para trás do portão.');}}}
  function strike(s,h,e,amount,options={}){
    const type=e.type;
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu');
    if(!s.enemies.includes(e)&&h.id==='aquiles'&&type==='guarda')feat(s,'aquiles');
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(e.hp>0&&!e.stunned&&!options.ranged&&!(TROOPS.types[e.type]?.range>0)){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true,distance});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function canMove(){return true;}
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true,distance});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+heroName(h.id)+'.');if(!h.hp)return false;}
    h.moves++;enter(s,h,target);return true;
  }
  function interactions(s,h){
    const list=[],foes=s.enemies.some(e=>e.zone===h.zone),add=(id,label,detail,available=true)=>list.push({id,label,detail,available:available&&!foes});
    if(!s.reconned&&h.zone==='M1')add('recon','Reconhecer o portão ('+s.reconProgress+'/2)','2 ações no total em M1, sem inimigos. Quem completar leva o relato e precisa voltar de pé a A1');
    const token=s.tokens[h.zone];
    if(token&&!token.resolved&&isRevealed(s,h.zone)&&tokenOf(s,h.zone).kind==='tower')add('tower','Tomar a torre de vigia ('+(token.progress||0)+'/2)','2 ações no total, sem inimigos; o barulho chama Troia (Alarme +2)');
    else if(token&&!token.resolved&&isRevealed(s,h.zone)){const noise=tokenOf(s,h.zone).kind==='clue'?'Observar não faz barulho.':'A busca faz barulho (Alarme +1).';add('explore','Investigar: '+tokenOf(s,h.zone).hint.toLocaleLowerCase('pt-BR'),token.peeked?'Atena revelou: '+foundPreview(s,h.zone)+' '+noise:'Ninguém sabe o que há ali. '+noise);}
    return list;
  }
  function foundPreview(s,zone){const t=tokenOf(s,zone);return (t.kind==='trail'&&s.scrolls.includes('rotas-1')?t.foundScroll:t.found).split('{hero}').join('quem investigar');}
  function tokenDetail(zone){const t=TOKENS[zone];if(t.kind==='food')return '+'+t.amount+' comida';if(t.kind==='tower')return 'A experiência da torre ou a planta das muralhas';return '';}
  function interaction(s,h){const list=interactions(s,h);return list.find(x=>x.available)||list[0]||{id:null,label:'Explorar',detail:'Nada para resolver aqui',available:false};}
  function resolveToken(s,h,def){let message='';const t=tokenOf(s,h.zone);s.tokens[h.zone].resolved=true;const zone=h.zone;let text=t.found;
    if(t.kind==='food')message='explorou '+t.name+': '+eat(s,h,t.amount);
    else if(t.kind==='trail'){if(s.scrolls.includes('rotas-1')){if(!s.scrolls.includes('rotas-2'))s.scrolls.push('rotas-2');text=t.foundScroll;message='seguiu a trilha da tabuinha (pergaminho Rotas da costa II)';}else message='explorou a trilha: '+eat(s,h,t.amount);}
    else if(t.kind==='clue')message='observou '+t.name.toLocaleLowerCase('pt-BR');
    for(const z of CLUES[zone]||[])reveal(s,z);
    s.lastFind={zone,title:t.hint,text:[text.split('{hero}').join(def.name),CLUE_TEXT[zone]||''].filter(Boolean).join(' ')};if(t.kind!=='clue')addAlarm(s,1,'o barulho da busca em '+zone+' chama atenção');return message;}
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Concluam a distribuição da vida antes da primeira ação.');
    if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(!h||h.hp<=0||(h.ap<=0&&action!=='rescue'))return fail('Escolha um herói de pé com ações disponíveis.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone),visible=e=>e&&isRevealed(s,e.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada.');if(!isRevealed(s,target))return fail('Essa peça ainda não foi descoberta: investiguem as fichas de exploração para encontrar o caminho.');const origin=h.zone;message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&visible(e)&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      const options=interactions(s,h),choice=target?options.find(x=>x.id===target):options.find(x=>x.available);
      if(foes().length)return fail('Elimine os inimigos nesta peça antes de interagir.');
      if(!choice||!choice.available)return fail('Não há nada para resolver aqui.');
      if(choice.id==='recon'){s.reconProgress++;if(s.reconProgress<2)message='começou a reconhecer o portão (1/2)';else{s.reconned=true;s.reporter=h.id;s.pursuit=Math.ceil(s.heroes.length/2);addAlarm(s,2,'os guardas viram gregos diante do portão');const raid=spawn(s,'P2','lanceiro');raid.raid=true;log(s,'Incursão: uma companhia sai de P2 rumo aos navios, para queimar a frota.');message='reconheceu o portão de Troia e leva o relato. Agora, de volta a A1';}}
      else if(choice.id==='explore'){if(h.id==='odisseu')feat(s,'odisseu');message=resolveToken(s,h,def);}
      else if(choice.id==='tower'){const token=s.tokens[h.zone];token.progress=(token.progress||0)+1;
        if(token.progress<2)message='começou a tomar a torre (1/2)';
        else{token.resolved=true;addAlarm(s,2,'a torre de vigia caiu em mãos gregas');s.encounter={id:'tower',zone:h.zone,hero:h.id};message='tomou a torre de vigia';}}
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível preparar habilidades com inimigos nesta peça.');if(!h.used.length)return fail('As habilidades já estão prontas. Vida só se recupera com comida encontrada.');h.used=[];message='preparou suas habilidades';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta peça.');if(h.hp<2)return fail('Socorrer transfere 1 de vida: quem socorre precisa ter ao menos 2.');h.hp--;a.hp=1;a.ap=1;if(h.id==='menelau')feat(s,'menelau');message='socorreu '+heroName(a.id)+', dando-lhe 1 da sua própria força';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(c&&h.known&&!h.known.includes(n))return fail('Este herói ainda não conhece esta habilidade.');if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target&&visible(e)),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,{piercing:c.piercing,stun:c.stun,breakArmor:c.breakArmor,ranged:c.type==='ranged'});}
      else if(c.type==='multiRanged'){
        const ids=String(target).split(',').filter(Boolean),targets=[...new Set(ids)].map(id=>s.enemies.find(enemy=>enemy.id===id&&visible(enemy)));
        if(!targets.length||targets.length>2||targets.some(enemy=>!enemy)||new Set(targets.map(enemy=>enemy.zone)).size!==1||distance(h.zone,targets[0].zone)>1)return fail('Escolha até dois inimigos diferentes, juntos nesta área ou em uma área vizinha.');
        for(const enemy of targets)strike(s,h,enemy,c.value,{piercing:true,ranged:true});
      }
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,0,{precision:true,piercing:true,ranged:true});}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma peça vizinha.');h.moves++;enter(s,h,e.zone);strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta peça.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;if(h.id==='menelau')feat(s,'menelau');}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);const steps=ally?knownDistance(s,h.zone,zone):Infinity;if(!ally||zone===h.zone||steps>c.value)return fail('Escolha um aliado nesta peça e um destino revelado a até duas áreas.');ally.moves++;enter(s,ally,zone);}
      else if(c.type==='sprint'){const steps=knownDistance(s,h.zone,target);if(target===h.zone||steps>2)return fail('Destino revelado a até duas peças.');h.moves++;if(steps===2){const mid=ZONES[h.zone].links.find(z=>isRevealed(s,z)&&ZONES[z].links.includes(target));enter(s,h,mid);}enter(s,h,target);}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta peça.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;kill(s,e,c.value);if(s.enemies.includes(e)){if(e.hold&&!e.post)e.post=origin;e.zone=zone;e.intimidated=true;e.hold=false;reveal(s,zone,'troia');log(s,TROOPS.label(e)+' sofreu '+c.value+' de dano, recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    if(action!=='rescue')h.ap=Math.max(0,h.ap-1);log(s,def.name+' '+message+'.');defeat(s);victory(s);return {ok:true,state:s};
  }
  function invoke(state,god,target){
    const s=clone(state),fail=error=>({ok:false,error,state}),g=GODS[god];
    if(!g)return fail('Deus desconhecido.');if(s.result||s.phase!=='heroes'||s.foodSetup)return fail('Não é possível invocar agora.');if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(s.invokedRound===s.round)return fail('Os deuses já foram invocados nesta rodada.');if(s.favor<g.cost)return fail(g.name+' exige '+g.cost+' de Favor.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;let message;
    if(god==='atena'){const tk=s.tokens[target];if(!tk||tk.resolved||tk.peeked||!isRevealed(s,target))return fail('Escolha uma ficha de exploração à vista.');tk.peeked=true;s.lastFind={zone:target,title:'Olhos de Atena',text:foundPreview(s,target)};message='Atena revelou o que há em '+target;}
    else if(god==='poseidon'){addAlarm(s,-2,'o mar revolto atrasa as tropas de Troia');message='o mar de Poseidon se agitou contra Troia';}
    else{const c=s.chronicle;if(!c||c.status!=='open'||c.favored)return fail('Não há pedido da crônica em aberto.');c.favored=true;message='Zeus enviou um presságio: o pedido da crônica está cumprido';}
    s.favor-=g.cost;s.invokedRound=s.round;log(s,g.title+': '+message+' (Favor '+s.favor+'/'+FAVOR_MAX+').');defeat(s);victory(s);return {ok:true,state:s};
  }
  function choose(state,choice){const r=chooseOne(state,choice);
    // Habilidade escolhida depois do fim da missão (feito cumprido na última ação): também segue para a campanha.
    if(r.ok&&r.state.outcome?.heroes)for(const oh of r.state.outcome.heroes){const h=r.state.heroes.find(x=>x.id===oh.id);if(h&&!h.patroclus)oh.known=[...h.known];}
    if(r.ok&&!r.state.encounter&&r.state.pendingAbility){const s=r.state,h=s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;const left=h?[0,1,2].filter(x=>!h.known.includes(x)):[];if(left.length)s.encounter={id:'ability',hero:h.id,zone:h.zone,choices:left};}return r;}
  function chooseOne(state,choice){
    const s=clone(state),fail=error=>({ok:false,error,state});if(!s.encounter)return fail('Não há encontro aberto.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;const enc=s.encounter,h=s.heroes.find(a=>a.id===enc.hero);
    if(enc.id==='criseida'){
      if(choice==='take'){s.encounter=null;s.criseida='taken';s.altarGold=true;const meal=eat(s,h&&h.hp>0?h:woundedAt(s,'C1'),3);s.lastFind={zone:'C1',title:'O prêmio do rei',text:'Os homens levam a moça e as taças do altar. Agamêmnon ergue o ouro diante dos reis, e o acampamento grita o nome dele. Criseida não chora. Olha para o templo como quem faz uma promessa. '+meal[0].toUpperCase()+meal.slice(1)+'. O ouro do altar engordará o armazém da próxima missão.'};const king=s.heroes.find(x=>x.id==='agamemnon'&&x.hp>0);const left=king?[0,1,2].filter(n=>!king.known.includes(n)):[];if(left.length){s.encounter={id:'ability',hero:'agamemnon',zone:king.zone,choices:left,reason:'criseida'};log(s,'Os reis aclamam o prêmio de Agamêmnon.');}log(s,'Criseida foi levada do santuário de Apolo.');return {ok:true,state:s};}
      if(choice==='respect'){s.encounter=null;s.criseida='respected';addFavor(s,1,'Apolo viu o santuário respeitado');s.lastFind={zone:'C1',title:'O santuário de Apolo',text:'Os heróis abaixam as lanças diante do altar. A moça os observa em silêncio enquanto eles se afastam. Agamêmnon não diz nada pelo resto do caminho. Ninguém saberá o que poderia ter sido. Mas Apolo viu: +1 de Favor.'};log(s,'O santuário de Apolo foi respeitado.');return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(enc.id==='shepherds'){
      if(choice==='pay'){if(s.campFood<1)return fail('O armazém do acampamento está vazio: não há comida para dividir.');s.campFood--;s.encounter=null;s.shepherds='allied';if(!s.scrolls.includes('pastores-1'))s.scrolls.push('pastores-1');s.lastFind={zone:'B5',title:'Os pastores do bosque',text:'Os pastores comem em silêncio e, ao final, o mais velho risca na casca de uma árvore as trilhas do bosque e o nome de quem as conhece. Pergaminho Favor dos pastores I.'};log(s,'Os pastores do bosque aceitaram a comida dos gregos.');return {ok:true,state:s};}
      if(choice==='leave'){s.encounter=null;s.shepherds='left';s.lastFind={zone:'B5',title:'Os pastores do bosque',text:'Os gregos seguem caminho. Entre as árvores, os pastores apagam o fogo e somem.'};log(s,'Os gregos deixaram os pastores para trás.');return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(enc.id==='tower'){
      if(choice==='plan'){s.encounter=null;if(!s.scrolls.includes('segredos-1'))s.scrolls.push('segredos-1');s.lastFind={zone:'M4',title:'A planta das muralhas',text:'Em vez de ensinar os homens, '+heroName(enc.hero)+' passa o tempo copiando numa tabuinha o traçado das muralhas, as torres e o portão. Pergaminho Segredos de Troia I.'};log(s,'A planta das muralhas foi copiada.');return {ok:true,state:s};}
      if(choice==='train'){const eligible=s.heroes.filter(a=>a.hp>0&&a.level<3).map(a=>a.id);if(eligible.length){s.encounter={id:'evolution',zone:'M4',choices:eligible};}else{s.encounter=null;s.lastFind={zone:'M4',title:'A torre de vigia',text:'Todos já estão no auge. A torre só lhes dá a vista.'};}return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(enc.id==='ability'){const n=Number(choice);if(!h||!enc.choices.includes(n))return fail('Escolham uma das habilidades ainda não aprendidas.');h.known.push(n);h.known.sort();s.encounter=null;s.lastLearn={hero:h.id,kind:'ability',card:n};log(s,heroName(h.id)+' aprendeu '+HEROES.find(d=>d.id===h.id).cards[n].name+'. Virem a carta no tabuleiro do herói.');const next=s.pendingAbility&&s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;if(next){const left=[0,1,2].filter(x=>!next.known.includes(x));if(left.length)s.encounter={id:'ability',hero:next.id,zone:next.zone,choices:left};}return {ok:true,state:s};}
    if(enc.id==='evolution'){const e=s.heroes.find(a=>a.id===choice&&enc.choices.includes(a.id)&&a.hp>0&&a.level<3);if(!e)return fail('Escolham um herói de pé abaixo de N3.');const before=HEROES.stats(e);e.level++;const after=HEROES.stats(e);e.ap+=Math.max(0,after.actions-before.actions);s.encounter=null;s.lastLearn={hero:e.id,kind:'evolution',level:e.level};log(s,'A equipe escolheu '+heroName(e.id)+' para receber a experiência da torre: evolução para N'+e.level+'.');return {ok:true,state:s};}
    return fail('Encontro desconhecido.');
  }
  // Preparação da missão: o armazém repõe a vida dos heróis (uma ficha de comida por ponto de vida).
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição indisponível.');
    if(delta===1){if(!s.campFood)return fail('O armazém está vazio.');if(h.hp>=HEROES.stats(h).maxHp)return fail('Este herói já está com a vida cheia.');h.hp++;s.campFood--;if(h.hp>0&&h.ap===0)h.ap=HEROES.stats(h).actions;}
    else{if(h.hp<=h.startHp)return fail('Só é possível devolver o que foi distribuído agora.');h.hp--;s.campFood++;if(!h.hp)h.ap=0;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Vida reposta com o armazém. Restam '+s.campFood+' comida(s) guardadas.');return {ok:true,state:s};}
  // Quem atira (arqueiros) acerta o herói de pé mais próximo dentro do alcance, sem sair do lugar; de longe, o tiro tira 1 a menos.
  function rangedTarget(s,e){const r=TROOPS.types[e.type]?.range||0;if(!r)return null;return s.heroes.filter(h=>h.hp>0&&distance(e.zone,h.zone)<=r&&isRevealed(s,h.zone)).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||a.hp-b.hp)[0]||null;}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes'||s.foodSetup)return s;s.lastAttacks=[];s.escalation=null;s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of [...s.enemies]){
      if(!s.enemies.some(a=>a.id===e.id))continue;
      if(e.stunned){e.stunned=false;log(s,TROOPS.label(e)+' perdeu a ativação por Atordoamento.');continue;}
      // Tropa de posto empurrada para fora volta ao posto, uma peça por fase, e retoma a guarda ao chegar.
      if(e.hold&&e.post&&e.zone!==e.post&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone)&&!rangedTarget(s,e)){e.intimidated=false;e.zone=nextStep(e.zone,e.post);reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' voltou para '+e.zone+(e.zone===e.post?', o seu posto.':', a caminho do posto em '+e.post+'.'));continue;}
      if(e.hold&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone)&&!rangedTarget(s,e))continue;
      const intimidated=!!e.intimidated;e.intimidated=false;
      const lure=HEROES.taunt(s,e,distance,false),shot=intimidated?null:rangedTarget(s,e);
      // A flecha entrega de onde veio: atirar de uma peça fora da mesa revela a peça.
      if(shot&&!isRevealed(s,e.zone))reveal(s,e.zone,'troia');
      if(lure&&lure.zone!==e.zone&&!shot&&!e.hold){e.zone=ZONES[e.zone].links.slice().sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para Agamêmnon em '+e.zone+'.');continue;}
      const guard=s.guards[e.zone]||0;
      const h=intimidated?null:shot||lure||s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const hp0=h.hp,damage=HEROES.damage(s,h,h.zone!==e.zone?Math.ceil((e.attack??2)/2):(e.attack??2),log,{distance});s.lastAttacks.push({enemy:e.id,hero:h.id,damage:hp0-h.hp,ranged:h.zone!==e.zone});log(s,heroName(h.id)+' sofreu '+damage+' de dano'+(h.zone!==e.zone?' à distância':'')+'.');if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&h.id!=='odisseu'&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2),ehp=e.hp;kill(s,e,rebound);{const hit=s.lastAttacks[s.lastAttacks.length-1];if(hit&&hit.enemy===e.id){hit.rebound=Math.max(0,ehp-Math.max(0,e.hp));hit.killed=!s.enemies.includes(e);}}log(s,'Rebote grego corpo a corpo: '+rebound+' de dano em '+TROOPS.label(e)+'.');if(!s.enemies.includes(e)&&h.id==='aquiles'&&e.type==='guarda')feat(s,'aquiles');}if(h.hp>0&&h.id==='ajax'&&WALLS.includes(h.zone))feat(s,'ajax');if(!h.hp)h.ap=0;}
      else if(e.raid&&e.zone==='N1'){if(guard){s.guards.N1--;log(s,'A proteção salvou os navios.');}else if((s.shipsBurned||0)<SHIPS_MAX){s.shipsBurned=(s.shipsBurned||0)+1;log(s,'Um navio queima em N1 ('+s.shipsBurned+'/'+SHIPS_MAX+'): a comida que ele guardava se perde.');}}
      else if(e.zone==='A1'){if(guard){s.guards.A1--;log(s,'A proteção absorveu o ataque ao acampamento.');}else{s.campDamage++;log(s,'Ataque ao acampamento: '+s.campDamage+'/3 danos.');}}
      else if(!e.hold){e.zone=nextStep(e.zone,e.raid?'N1':huntGoal(s,e));reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.pursuit&&!s.commanderDown){for(let i=0;i<s.pursuit;i++)spawn(s,'M1','lanceiro');log(s,'O portão se abre: '+s.pursuit+' companhia'+(s.pursuit>1?'s':'')+' de lanceiros sai atrás dos gregos.');s.pursuit=0;}
    victory(s);if(s.result)return s;
    resolveChronicle(s);if(s.result)return s;
    s.round++;s.combatZones=[];s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;h.moves=0;});
    addAlarm(s,s.reconned?2:1,s.reconned?'a cidade inteira está atrás dos gregos':'o tempo passa e Troia percebe os gregos na planície');
    const spotters=s.enemies.filter(e=>e.type==='explorador'&&s.heroes.some(h=>h.hp>0&&distance(e.zone,h.zone)<=1));if(spotters.length)addAlarm(s,1,'batedores avistaram os heróis e correram para relatar');
    startChronicle(s);
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!==MISSION||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||(s.campaign?s.heroes.length<1:s.heroes.length!==Math.max(3,s.players)))return false;
    if(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players)return false;
    if(!Array.isArray(s.revealed)||!s.revealed.includes('A1')||s.revealed.some(z=>!ZONES[z])||!Array.isArray(s.visited)||!Array.isArray(s.lastReveals))return false;
    if(!integer(s.alarm,0,ALARM_MAX)||!Array.isArray(s.alarmFired)||s.alarmFired.some(n=>!ALARM_STEPS[n]))return false;
    if((!s.campaign&&(!s.heroes.some(h=>h.id==='odisseu')||!s.heroes.some(h=>h.id==='agamemnon')))||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&Array.isArray(h.known)&&h.known.length>=1))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,99)||!integer(s.campDamage,0,3)||typeof s.reconned!=='boolean'||typeof s.commanderDown!=='boolean'||!Array.isArray(s.scrolls))return false;
    if(!['unseen','met','taken','respected'].includes(s.criseida)||!['unseen','met','allied','left'].includes(s.shepherds))return false;
    if(!s.tokens||Object.keys(s.tokens).sort().join()!==Object.keys(TOKENS).sort().join()||!integer(s.favor,0,FAVOR_MAX))return false;
    if(s.encounter!==null&&(!s.encounter||!['criseida','shepherds','tower','evolution','ability'].includes(s.encounter.id)))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&TROOPS.types[e.type]&&integer(e.hp,1,TROOPS.types[e.type].hp)))return false;
    if(!Number.isInteger(s.reconProgress))return false;if(s.result==='victory'&&(!s.reconned||s.outcome?.completed!==MISSION))return false;
    return Array.isArray(s.log)&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,MISSION,huntGoal,alarmMax,ALARM_MAX,PERSONAL,CHRONICLE,GODS,FAVOR_MAX,invoke,tokenOf,CLUES,ALARM_STEPS,FOOD_LIMIT,HEROES,TROOPS,TERRAINS,ZONES,TOKENS,REVEAL_TEXT,BEACHES,BASE,WALLS,newGame,distance,knownDistance,isRevealed,intent,waves,nextAlarm,interaction,interactions,tokenDetail,act,choose,allocateFood,finishFoodSetup,trojanTurn,validSave};
});
