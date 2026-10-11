(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyHorse=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  // Missão 6 — Construir o cavalo (08/10/2026). A frota partiu para trás de Tênedos (a peça N1 sai da mesa).
  // Os que ficaram cortam madeira nos bosques do leste e no bosque sagrado de Apolo (M3), arrastam as toras até o
  // canteiro em A2 e montam o cavalo, por etapas, antes que Troia descubra o que se faz na praia.
  // As descobertas do Paládio ajudam: a forma (uma etapa a menos), a muralha de Éaco (sem retrabalho), o motivo (+2 de Favor),
  // quem vai desconfiar (segue para a noite do cavalo). Sem nenhuma, o cavalo pede uma etapa a mais.
  const VERSION=1,MAX_ROUNDS=12,FOOD_LIMIT=2,ALARM_MAX=18,MISSION='cavalo',WORK=2,CARRY_MOVES=2,SITE='A2';
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'},M:{art:'portoes',name:'Muralha'}};
  const NAMES={A1:'Acampamento',A2:'O canteiro do cavalo',C1:'Santuário de Apolo',P3:'Campo aberto',P7:'Trilha dos pinheiros',P4:'Diante das muralhas',B5:'Bosque dos pastores',M4:'Torre de vigia',M1:'Portão de Troia',
    M3:'Bosque sagrado de Apolo',M5:'Torre do leste',M2:'Torre do canto',B3:'Bosque fechado',B1:'Pinheiral',B4:'Carvalhos do Ida',P5:'Várzea',B2:'Bosque da enseada',N5:'Enseada escondida'};
  // O tabuleiro inteiro (final-board.js), sem N1: os navios partiram.
  const CONNECTIONS={A1:['A2','P1'],A2:['A1','P1','P6','C2','P2','N2'],P1:['A1','A2','P6','P3'],P6:['A2','P1','P3','P7','C2'],C2:['A2','P6','P7','P4','P2'],P2:['A2','C2','C1','P5','N2','N3','N4'],C1:['P2','B1','P5'],
    P5:['P2','C1','B1','B2'],B1:['C1','P5','B4','B3','B5'],B2:['P5','B4','N5'],B4:['B2','B1','B3'],B3:['B4','B1','B5','M5','M2'],B5:['M1','B1','B3','P4','M5'],P4:['C2','B5','P7','M1'],P7:['P6','C2','P4','P3','M4','M1'],
    P3:['P1','P6','P7','M3','M4'],M3:['P3','M4'],M4:['M3','P3','P7','M1'],M1:['B5','M4','P7','P4','M5'],M5:['M1','B5','B3','M2'],M2:['M5','B3'],N2:['A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2','N5'],N5:['N4','B2']};
  const ZONES={};
  for(const [id,links] of Object.entries(CONNECTIONS))ZONES[id]={name:id+' · '+(NAMES[id]||TERRAINS[id[0]].name),terrain:id[0],art:TERRAINS[id[0]].art,links:[...links]};
  for(const [id,z] of Object.entries(ZONES))for(const n of z.links)if(!ZONES[n].links.includes(id))ZONES[n].links.push(id);
  const BASE=['A1','A2','P1','P6','C2','C1','P2','N2','N3','N4','P3','P7','P4','B5','M4','M1'],WALLS=['P3','P7','P4','M4','M1','M3','M5','M2'];
  const HIDDEN=['M3','M5','M2','B3','B1','B4','P5','B2','N5'];
  // Madeira de cada bosque. O corniso do bosque de Apolo (M3) só se corta depois de decidir no bosque; cada tora dele vale 2.
  const WOOD={B5:1,B1:2,B4:2,B3:2,B2:2,N5:1};
  const WOOD_TEXT={B5:'Lenha dos pastores',B1:'Pinheiros altos',B4:'Carvalhos',B3:'Freixos',B2:'Pinheiros da enseada',N5:'Tábuas do navio encalhado',M3:'Corniso de Apolo'};
  // As torres vigiam: quem arrasta madeira nas peças que elas veem faz o Alarme subir. Cegar uma torre: 2 ações nela, sem inimigos.
  const TOWERS={M5:{name:'Torre do leste',sees:['B5','B3','P4','B1']},M2:{name:'Torre do canto',sees:['B3','B4','B1','B2']}};
  const TOKENS={
    P3:{kind:'clue',name:'Loureiros a oeste',hint:'Árvores coladas à muralha',found:'Do campo aberto, {hero} vê a oeste um bosque de loureiros e cornisos encostado na muralha. Os pastores dizem que ninguém corta árvore ali: é de Apolo. O corniso é a madeira mais dura que existe.'},
    C1:{kind:'clue',name:'A várzea do leste',hint:'Fumaça para o leste',found:'Do alto do santuário, {hero} vê a leste uma várzea verde e, depois dela, um pinheiral de troncos retos. Madeira para o cavalo.'},
    B5:{kind:'clue',name:'O bosque fechado',hint:'Uma trilha de lenhadores',found:'Uma trilha de lenhadores sai do bosque dos pastores para o leste. Ela leva a outro bosque, mais fechado, e passa à sombra de uma torre na muralha.'},
    P5:{kind:'food',amount:2,name:'Horta abandonada',hint:'Cercas caídas na várzea',found:'Uma horta de camponeses que fugiram da guerra. {hero} colhe o que restou. +2 comida. Da cerca se vê um bosque descendo até o mar.'},
    B1:{kind:'clue',name:'Os carvalhos',hint:'Machados velhos num tronco',found:'Machados troianos esquecidos num tronco cortado. Mais adiante, na encosta do Ida, carvalhos velhos.'},
    B3:{kind:'clue',name:'A torre do canto',hint:'Uma luz no alto',found:'Do bosque fechado, {hero} vê uma segunda torre, no canto da muralha. Lá em cima, alguém olha para o bosque.'},
    B2:{kind:'clue',name:'A enseada',hint:'Barulho de ondas',found:'O bosque desce até uma enseada escondida. Um navio grego encalhado apodrece na areia, desde o desembarque.'}
  };
  const CLUES={P3:['M3'],C1:['P5','B1'],B5:['B3','M5'],P5:['B2'],B1:['B4'],B3:['M2'],B2:['N5']};
  const tokenOf=(s,zone)=>TOKENS[zone];
  const REVEAL_TEXT={
    M3:'O bosque sagrado de Apolo: loureiros e cornisos colados à muralha. No meio, um altar de pedra.',
    M5:'A torre do leste. Arqueiros andam lá em cima e veem os bosques.',
    M2:'A torre do canto da muralha, a mais alta. Dela se vê até o Ida.',
    B3:'Um bosque fechado de freixos, à sombra das torres.',
    B1:'Um pinheiral de troncos retos e altos.',
    B4:'Carvalhos velhos na encosta do Ida.',
    P5:'Uma várzea verde, com cercas caídas.',
    B2:'Um bosque de pinheiros que desce até o mar.',
    N5:'Uma enseada escondida. Um navio grego encalhado apodrece na areia.'
  };
  const FAVOR_MAX=6;
  const GODS={
    atena:{name:'Atena',cost:1,title:'Olhos de Atena',text:'Revela o que há numa ficha de exploração antes de investigá-la.'},
    poseidon:{name:'Poseidon',cost:2,title:'Mar revolto',text:'O mar se agita e atrasa as tropas de Troia. O Alarme cai 2.'},
    zeus:{name:'Zeus',cost:2,title:'Presságio de Zeus',text:'O pedido da crônica desta rodada conta como cumprido.'}
  };
  const DISCOVERY_TEXT={forma:'A forma: o cavalo tem uma etapa a menos.',medida:'A muralha de Éaco: Epeu faz o cavalo maior que o portão desde o começo, sem precisar refazê-lo.',motivo:'O motivo: com o Paládio, Atena dá +2 de Favor.',desconfia:'Quem vai desconfiar: Odisseu já sabe quem falará contra o cavalo na noite dele.'};
  // Patamares do Alarme. Em 15 sai um comandante (Heitor, se vivo; senão Enéias). Em 18, Troia descobre o cavalo.
  const ALARM_STEPS={4:[['P4','explorador']],7:[['M1','lanceiro','raid']],11:[['M1','lanceiro','raid']],15:[],18:[]};
  function commander(s){return s.heitor?'heitor':'eneias';}
  function alarmEntries(s,step){if(step===18)return [];if(step===15)return [['M1',commander(s)],...(s.heroes.length>=4?[['M1','lanceiro','raid']]:[])];return [...ALARM_STEPS[step],...(s.heroes.length>=4&&step===7?[['P4','explorador']]:[])];}
  const PERSONAL={
    odisseu:{name:'O desenho do cavalo',goal:2,text:'Investigue 2 fichas de exploração.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    agamemnon:{name:'O rei no canteiro',goal:2,text:'Trabalhe 2 vezes no cavalo.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    aquiles:{name:'Nenhum volta para contar',goal:2,text:'Derrote 2 tropas troianas.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    menelau:{name:'Madeira para o cavalo',goal:2,text:'Entregue 2 toras no canteiro (A2).',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    ajax:{name:'O muro do canteiro',goal:2,text:'Resista de pé a 2 ataques no canteiro (A2).',reward:'Aprende uma nova habilidade, à escolha do jogador.'}
  };
  const CHRONICLE={
    1:{id:'frota',effect:'Os que partiram deixaram o que sobrou: +1 comida no armazém.',title:'A frota parte',text:'Os navios somem atrás de Tênedos. Na praia ficam as cinzas do acampamento e os que vão construir o cavalo.'},
    2:{id:'epeu',effect:'Se houver madeira em A2, o cavalo ganha 1 de trabalho.',title:'Epeu',text:'Epeu, que nunca foi bom de lança, desenha o cavalo na areia com uma vara.'},
    3:{id:'machados',title:'O eco dos machados',text:'O eco dos machados sobe até as muralhas.',demand:'Tenham um herói de pé em P4 na próxima resposta de Troia, vigiando a estrada do portão: o Alarme cai 1. Se não, sobe 1.'},
    4:{id:'pastores',effect:'Se os pastores do bosque são amigos, trazem 1 madeira para A2. Se não, contam a Troia: Alarme +1.',title:'Os pastores',text:'Os pastores do bosque observam o vaivém das toras.'},
    5:{id:'sinais',title:'Sinais nas torres',text:'As torres trocam sinais com espelhos de bronze.',demand:'Tenham uma torre cegada (M5 ou M2) na próxima resposta de Troia, ou o Alarme sobe 2.'},
    6:{id:'chuva',effect:'Quem carrega madeira tem 1 ação a menos nesta rodada.',title:'Chuva no Ida',text:'A chuva do Ida encharca as toras e o caminho.'},
    7:{id:'sinon',effect:'+1 de Favor.',title:'Sínon',text:'Sínon aceita ficar para trás e mentir a Troia quando o cavalo estiver pronto.'},
    8:{id:'patrulha',effect:'Um grupo de batedores sai do portão (M1) rumo ao canteiro.',title:'Patrulha no portão',text:'O portão se abre ao meio-dia. Troia quer ver a praia de perto.'},
    9:{id:'sacrificio',effect:'O Alarme sobe 1.',title:'Sacrifício em Troia',text:'Os sacerdotes de Troia sacrificam a Apolo. A fumaça sobe reta.'},
    10:{id:'portao',title:'Batedores na praia',text:'Batedores troianos rondam a praia vazia.',demand:'Mantenham um herói de pé em A2 até a próxima resposta de Troia, ou eles contam as toras: Alarme +2.'},
    11:{id:'vespera',effect:'As cartas usadas se desviram.',title:'A véspera',text:'A última noite antes de a frota voltar. Ninguém dorme.'},
    12:{id:'ultima',effect:'O Alarme sobe 1.',title:'O último dia',text:'Amanhã, ou o cavalo está na praia, ou a frota volta para nada.'}
  };
  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function isRevealed(s,zone){return s.revealed.includes(zone);}
  function reveal(s,zone,by='heroi'){if(!ZONES[zone]||isRevealed(s,zone))return false;s.revealed.push(zone);s.lastReveals.push(zone);log(s,(by==='troia'?'Tropas troianas surgiram em '+zone+'. ':'Nova peça: ')+'posicionem '+ZONES[zone].name+' na mesa.');return true;}
  function spawn(s,zone,type='explorador',raid){const e=TROOPS.create('e'+s.nextEnemy++,zone,type);if(raid)e.raid=true;s.enemies.push(e);reveal(s,zone,'troia');return e;}
  function startingAbilities(id,options){const known=options.known?.[id];if(Array.isArray(known)&&known.length&&known.every(n=>Number.isInteger(n)&&n>=0&&n<=2))return [...new Set(known)].sort();if(!options.abilities)return [0,1,2];const n=options.abilities[id];if(!Number.isInteger(n)||n<0||n>2)throw Error('Escolham a habilidade inicial de cada herói.');return [n];}
  // Etapas do cavalo: 6; a forma tira uma; sem nenhuma descoberta, uma a mais.
  function stagesFor(discoveries,team=3){return 5-(discoveries.includes('forma')?1:0)+(discoveries.length?0:1)+(team>=5?1:0);}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    const camp=options.campaign===true,validTeam=camp?(Number.isInteger(players)&&players>=1&&players<=5&&ids.length>=1&&ids.length<=5&&new Set(ids).size===ids.length&&ids.every(id=>HEROES.some(h=>h.id===id))&&owners.length===ids.length&&owners.every(n=>Number.isInteger(n)&&n>=1&&n<=players)&&new Set(owners).size===players):!(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players);
    if(!validTeam)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const legacy=options.legacy||{};
    const discoveries=[...new Set((Array.isArray(options.discoveries)?options.discoveries:Array.isArray(legacy.discoveries)?legacy.discoveries:['forma']).filter(d=>DISCOVERY_TEXT[d]))];
    const heroes=ids.map((id,i)=>{const h={...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'A1',cargo:false,food:0,moves:0,known:startingAbilities(id,options)};const life=options.life?.[id];if(Number.isInteger(life))h.hp=Math.max(0,Math.min(HEROES.stats(h).maxHp,life));if(!h.hp)h.ap=0;h.startHp=h.hp;return h;});
    const store=Math.max(0,Math.min(99,Number.isInteger(options.campFood)?options.campFood:0));
    const motivo=discoveries.includes('motivo')&&legacy.paladio!==false;
    const s={version:VERSION,mission:MISSION,campaign:camp,players,playerNames,round:1,phase:'heroes',result:null,reason:'',campFood:store,foodSetup:store>0&&heroes.some(h=>h.hp<HEROES.stats(h).maxHp),
      scrolls:[...new Set(options.scrolls||[])],legacy,discoveries,heitor:options.heitor===true,stages:stagesFor(discoveries,ids.length),stage:0,work:0,wood:0,reworked:discoveries.includes('medida'),burnt:0,cornel:0,apollo:0,grove:'unseen',
      woodLeft:{...WOOD},piles:{},blinded:[],blindProgress:{},seen:[],
      revealed:[...BASE],lastReveals:[],visited:[...BASE],alarm:0,alarmFired:[],
      tokens:Object.fromEntries(Object.keys(TOKENS).map(zone=>[zone,{resolved:false,peeked:false}])),favor:Math.max(0,Math.min(FAVOR_MAX,(Number.isInteger(options.favor)?options.favor:1)+(motivo?2:0))),invokedRound:0,
      encounter:null,personal:Object.fromEntries(ids.map(id=>[id,{progress:0,done:false}])),lastFeats:[],chronicle:null,
      guards:{},nextEnemy:1,heroes,enemies:[],log:[],outcome:null};
    // Os postos de Troia: o guarda do portão e os arqueiros das três torres (só aparecem quando a peça é revelada).
    const post=(zone,type)=>{const e=TROOPS.create('e'+s.nextEnemy++,zone,type);e.hold=true;s.enemies.push(e);return e;};
    post('M1','guarda');post('M4','arqueiro');post('M5','arqueiro');post('M2','arqueiro');
    // Uma patrulha de batedores ronda diante das muralhas.
    s.enemies.push(TROOPS.create('e'+s.nextEnemy++,'P4','explorador'));
    if(motivo)log(s,'O Paládio está no acampamento: Atena dá +2 de Favor.');
    log(s,'A frota partiu para trás de Tênedos. O cavalo terá '+s.stages+' etapas.');
    startChronicle(s);
    return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function knownDistance(s,from,to){if(!isRevealed(s,from)||!isRevealed(s,to))return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)&&isRevealed(s,n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone,goal=SITE){return ZONES[zone].links.slice().sort((a,b)=>distance(a,goal)-distance(b,goal))[0];}
  // Tropas caçam quem arrasta madeira a até 3 peças, depois qualquer herói a até 2; sem ninguém, descem para o canteiro.
  function huntGoal(s,e){const up=s.heroes.filter(h=>h.hp>0),near=(list,r)=>list.filter(h=>distance(e.zone,h.zone)<=r).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone))[0];const prey=near(up.filter(h=>h.cargo),3)||near(up,2);return prey?prey.zone:SITE;}
  function intimidationZone(s,e){return ZONES[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(a,'M1')-distance(b,'M1'))[0];}
  function alarmMax(){return ALARM_MAX;}
  function nextAlarm(s){const steps=Object.keys(ALARM_STEPS).map(Number).filter(n=>!s.alarmFired.includes(n)).sort((a,b)=>a-b);if(!steps.length)return {at:ALARM_MAX,entries:[]};const at=steps[0];return {at,entries:alarmEntries(s,at)};}
  function waves(s){return nextAlarm(s).entries.map(([zone])=>zone);}
  function rangedTarget(s,e){const r=TROOPS.types[e.type]?.range||0;if(!r)return null;return s.heroes.filter(h=>h.hp>0&&distance(e.zone,h.zone)<=r&&isRevealed(s,h.zone)).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||a.hp-b.hp)[0]||null;}
  function intent(e,s){if(e.stunned)return 'Atordoado: perderá esta ativação';{const shot=rangedTarget(s,e);if(shot&&!e.intimidated)return 'Atirar em '+heroName(shot.id)+(shot.zone!==e.zone?' em '+shot.zone:'');}if(e.hold&&e.post&&e.zone!==e.post&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return 'Voltar ao posto em '+e.post;if(e.hold&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return e.type==='guarda'?'Guardar o portão':'Vigiar do alto da torre';if(e.intimidated)return 'Intimidado: não poderá atacar nesta resposta';const lure=HEROES.taunt(s,e,distance,false);if(lure)return 'Priorizar Agamêmnon em '+lure.zone;if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';if(e.zone===SITE)return 'Queimar o cavalo em A2';const goal=e.raid?SITE:huntGoal(s,e);if(goal!==SITE)return 'Perseguir os gregos em '+goal;return 'Rumo ao canteiro: avançar para '+ZONES[nextStep(e.zone)].name;}
  function finish(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;if(s.encounter?.id!=='ability')s.encounter=null;
    if(result==='victory')s.outcome={completed:MISSION,favor:s.favor,next:'A noite do cavalo',campFood:s.campFood,revealedZones:[...s.revealed],scrolls:[...s.scrolls],commanders:{},
      legacy:{horse:{stages:s.stages,cornel:s.cornel,burnt:s.burnt},apolloPrice:s.apollo,grove:s.grove,laocoonte:s.discoveries.includes('desconfia')},heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]}))};
    log(s,reason);}
  // Quem cai larga a tora onde está: outro herói pode carregá-la.
  function dropFallen(s){for(const h of s.heroes)if(!h.hp&&h.cargo){const p=s.piles[h.zone]??={tora:0,corniso:0};p[h.cargo]++;log(s,heroName(h.id)+' caiu e largou '+(h.cargo==='corniso'?'o corniso':'a tora')+' em '+h.zone+'.');h.cargo=false;}}
  function defeat(s){dropFallen(s);if(s.result)return;if(s.alarm>=ALARM_MAX)finish(s,'defeat','Troia descobriu o cavalo na praia. Sem a surpresa, o plano de Odisseu acabou.');else if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram longe do cavalo.');}
  // Vitória: a última etapa do cavalo. Quem ficou caído no campo morre (CAMPANHA.md).
  function victory(s){if(s.result||s.stage<s.stages)return;const dead=s.heroes.filter(h=>!h.hp).map(h=>heroName(h.id));finish(s,'victory','O cavalo está de pé na praia, maior do que qualquer navio.'+(dead.length?' Mas '+dead.join(' e ')+(dead.length>1?' ficaram':' ficou')+' no caminho.':'')+' Os gregos queimam o acampamento e embarcam. Fica Sínon, e o cavalo.');}
  function addAlarm(s,amount,reason){
    if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(ALARM_MAX,s.alarm+amount));if(s.alarm===before)return;
    log(s,'Alarme de Troia '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+ALARM_MAX+'): '+reason+'.');
    for(const step of Object.keys(ALARM_STEPS).map(Number).sort((a,b)=>a-b)){
      if(s.alarm<step||s.alarmFired.includes(step))continue;s.alarmFired.push(step);
      const entries=alarmEntries(s,step);for(const [zone,type,raid] of entries)spawn(s,zone,type,raid==='raid');
      if(entries.length)log(s,(step===15?(s.heitor?'Heitor':'Enéias')+' sai pelo portão. ':'')+'Troia reage ao alarme '+step+': '+entries.map(([zone,type])=>TROOPS.types[type].short+' em '+zone).join(', ')+'.');
    }
    defeat(s);
  }
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  function feat(s,id,amount=1){
    const p=s.personal?.[id],def=PERSONAL[id],h=s.heroes.find(x=>x.id===id);if(!p||p.done||!def||!h||s.result)return;
    p.progress=Math.min(def.goal,p.progress+amount);if(p.progress<def.goal)return;p.done=true;s.lastFeats.push(id);addFavor(s,1,'o feito de '+heroName(id));const options=[0,1,2].filter(n=>!h.known.includes(n));if(options.length&&!s.encounter)s.encounter={id:'ability',hero:id,zone:h.zone,choices:options};else if(options.length)s.pendingAbility=id;
    // Sem habilidade nova para aprender (10/10/2026), o feito rende o Favor de sempre e 1 comida no armazém.
    else{s.campFood++;(s.featNote??={})[id]='Todas as habilidades já foram aprendidas: +1 de Favor e +1 comida no armazém.';log(s,heroName(id)+' já conhece todas as habilidades: +1 comida no armazém.');}
    log(s,'Feito de '+heroName(id)+': '+def.name+'. '+def.reward);
  }
  function eat(s,h,amount){const room=h&&h.hp>0?Math.max(0,HEROES.stats(h).maxHp-h.hp):0,gain=Math.min(room,amount),stored=amount-gain;if(gain)h.hp+=gain;s.campFood+=stored;
    const meal=[gain?'+'+gain+' de vida para '+heroName(h.id):'',stored?'+'+stored+' comida no armazém'+(gain?'':' (a vida já estava cheia)'):''].filter(Boolean).join(' e ');s.lastMeal=meal;return meal;}
  // O cavalo perde progresso: primeiro o trabalho da etapa, depois a madeira, depois uma etapa pronta.
  function burn(s,why){if(s.work>0){s.work=0;log(s,why+': o trabalho da etapa se perdeu.');}else if(s.wood>0){s.wood--;log(s,why+': 1 madeira queimada.');}else if(s.stage>0){s.stage--;log(s,why+': uma etapa do cavalo foi destruída ('+s.stage+'/'+s.stages+').');}else{log(s,why+', mas não havia o que queimar.');return;}s.burnt++;}
  function addWork(s){s.work++;if(s.work<WORK)return false;s.work=0;s.wood--;s.stage++;
    // Sem saber da muralha de Éaco: no meio do cavalo, Epeu percebe que ele cabe no portão, e o refaz maior.
    if(!s.reworked&&s.stage===3){s.reworked=true;s.stage--;s.lastFind={zone:SITE,title:'Pequeno demais',text:'Epeu mede o pescoço do cavalo e para: do jeito que está, ele passa pelo portão de Troia. Os troianos o levariam sem abrir a muralha. Desmontam o pescoço para fazê-lo maior.'};log(s,'O cavalo caberia no portão: a etapa 3 precisa ser refeita, maior.');return true;}
    log(s,'Etapa '+s.stage+' de '+s.stages+' do cavalo pronta.');return true;}
  const CHRONICLE_CHECKS={
    machados:{check:s=>s.heroes.some(h=>h.hp>0&&h.zone==='P4'),success:s=>addAlarm(s,-1,'a estrada do portão foi vigiada'),fail:s=>addAlarm(s,1,'Troia ouviu os machados')},
    sinais:{check:s=>s.blinded.length>0,success:s=>log(s,'Crônica: uma torre cega não passa sinais.'),fail:s=>addAlarm(s,2,'as torres trocaram sinais sobre a praia')},
    portao:{check:s=>s.heroes.some(h=>h.hp>0&&h.zone===SITE),success:s=>log(s,'Crônica: os batedores viram lanças em A2 e voltaram.'),fail:s=>addAlarm(s,2,'os batedores contaram as toras na praia')}
  };
  const ESCALATION={machados:['P4','explorador','Troia manda batedores à estrada'],portao:['P2','lanceiro','Os batedores voltam com lanceiros']};
  function resolveChronicle(s){const c=s.chronicle;if(!c||c.status!=='open'||s.result)return;const rule=CHRONICLE_CHECKS[c.id];const ok=c.favored||rule.check(s);c.status=ok?'success':'fail';s.chronicleResult={id:c.id,status:c.status};(ok?rule.success:rule.fail)(s);if(!ok&&!s.result)escalate(s,c.id);}
  function escalate(s,id){const e=ESCALATION[id];if(!e)return;const n=s.heroes.length>=5?2:1;for(let i=0;i<n;i++)spawn(s,e[0],e[1],e[1]==='lanceiro');s.escalation=e[2];log(s,'Crônica: '+e[2]+' ('+n+' '+TROOPS.types[e[1]].short+' em '+e[0]+').');}
  function chronicleEffect(s,id){if(s.result)return;const alive=s.heroes.filter(h=>h.hp>0),say=t=>log(s,'Crônica: '+t);
    if(id==='frota'){s.campFood++;say('+1 comida no armazém.');}
    else if(id==='epeu'){if(s.wood>0){addWork(s);say('Epeu adianta o trabalho do cavalo.');victory(s);}else say('Epeu espera a madeira.');}
    else if(id==='pastores'){if(s.legacy.shepherds==='allied'){s.wood++;say('os pastores trazem 1 madeira para A2.');}else addAlarm(s,1,'os pastores contaram a Troia o vaivém das toras');}
    else if(id==='chuva'){for(const h of alive)if(h.cargo&&h.ap>0){h.ap--;say(heroName(h.id)+' tem 1 ação a menos.');}}
    else if(id==='sinon')addFavor(s,1,'a coragem de Sínon');
    else if(id==='patrulha')spawn(s,'M1','explorador',true);
    else if(id==='sacrificio'||id==='ultima')addAlarm(s,1,'crônica '+CHRONICLE[s.round].title.toLocaleLowerCase('pt-BR'));
    else if(id==='vespera'){for(const h of alive)h.used=[];say('as cartas usadas se desviram.');}
  }
  function startChronicle(s){const entry=CHRONICLE[s.round];if(!entry||s.result){s.chronicle=null;return;}s.chronicle={round:s.round,id:entry.id,status:CHRONICLE_CHECKS[entry.id]?'open':'told'};if(s.chronicle.status==='told')chronicleEffect(s,entry.id);log(s,'Crônica da rodada '+s.round+': '+entry.title+'.');}
  function enter(s,h,zone){h.zone=zone;if(!s.visited.includes(zone))s.visited.push(zone);}
  function escortOf(s,e){return s.enemies.filter(a=>a!==e&&!a.hold&&!TROOPS.types[a.type]?.hero).sort((p,q)=>distance(p.zone,e.zone)-distance(q.zone,e.zone))[0]||null;}
  function kill(s,e,damage,ignoreArmor=0){const armor=ignoreArmor===true?0:Math.max(0,(e.armor||0)-ignoreArmor);e.hp-=Math.max(0,damage-armor);
    // O comandante ferido até a metade recua, levado por uma tropa.
    if(TROOPS.types[e.type]?.hero&&e.hp<=Math.ceil(TROOPS.types[e.type].hp/2)){const esc=escortOf(s,e);s.enemies=s.enemies.filter(a=>a!==e&&a!==esc);s.commanderDown=true;s.lastFind={zone:e.zone,title:TROOPS.types[e.type].name+' recua',text:'Ferido, '+TROOPS.types[e.type].name+' volta para a cidade'+(esc?', levado por uma '+TROOPS.label(esc).toLocaleLowerCase('pt-BR')+'. Na mesa: retirem as duas miniaturas de '+e.zone+(esc.zone!==e.zone?' e '+esc.zone:'')+'.':'.')};log(s,TROOPS.types[e.type].name+' recua ferido.');return;}
    if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');}}
  function strike(s,h,e,amount,options={}){
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu');
    if(!s.enemies.includes(e)&&h.id==='aquiles')feat(s,'aquiles');
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(s.enemies.includes(e)&&!e.stunned&&!options.ranged&&!(TROOPS.types[e.type]?.range>0)){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true,distance});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function canMove(h,steps=1){return !h.cargo||h.moves+steps<=CARRY_MOVES;}
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true,distance});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+heroName(h.id)+'.');if(!h.hp)return false;}
    h.moves++;enter(s,h,target);return true;
  }
  const pile=(s,zone)=>{const p=s.piles[zone];return p?p.tora+p.corniso:0;};
  function interactions(s,h){
    const list=[],foes=s.enemies.some(e=>e.zone===h.zone),add=(id,label,detail,available=true)=>list.push({id,label,detail,available:available&&!foes});
    if(h.zone==='M3'&&s.grove==='unseen')add('meet-grove','Investigar: o altar entre os loureiros','Um bosque que ninguém corta.');
    const left=h.zone==='M3'?(s.grove==='cut'?s.woodLeft.M3||0:0):s.woodLeft[h.zone]||0;
    if(left&&isRevealed(s,h.zone))add('cut',(h.zone==='M3'?'Cortar corniso':'Cortar madeira')+' ('+left+' restante'+(left>1?'s':'')+')',h.cargo?'Entreguem primeiro a tora que carregam':h.zone==='M3'?'Uma tora de corniso vale 2 de madeira · quem carrega anda até 2 peças por rodada':'Uma tora · quem carrega anda até 2 peças por rodada',!h.cargo);
    if(!h.cargo&&pile(s,h.zone))add('pickup','Carregar a tora largada','Uma tora caída aqui');
    if(h.cargo&&h.zone===SITE)add('deliver','Entregar '+(h.cargo==='corniso'?'o corniso':'a tora'),h.cargo==='corniso'?'+2 de madeira no canteiro':'+1 de madeira no canteiro');
    if(h.zone===SITE)add('work','Trabalhar no cavalo (etapa '+Math.min(s.stage+1,s.stages)+' · '+s.work+'/'+WORK+')',s.wood?'2 trabalhos por etapa · cada etapa gasta 1 madeira':'Falta madeira em A2',s.wood>0);
    if(TOWERS[h.zone]&&!s.blinded.includes(h.zone))add('blind','Cegar a '+TOWERS[h.zone].name.toLocaleLowerCase('pt-BR')+' ('+(s.blindProgress[h.zone]||0)+'/2)','2 ações no total, sem inimigos; o barulho chama Troia (Alarme +1)');
    const token=s.tokens[h.zone];
    if(token&&!token.resolved&&isRevealed(s,h.zone)){const noise=tokenOf(s,h.zone).kind==='clue'?'Observar não faz barulho.':'A busca faz barulho (Alarme +1).';add('explore','Investigar: '+tokenOf(s,h.zone).hint.toLocaleLowerCase('pt-BR'),token.peeked?'Atena revelou: '+foundPreview(s,h.zone)+' '+noise:'Ninguém sabe o que há ali. '+noise);}
    return list;
  }
  function foundPreview(s,zone){return tokenOf(s,zone).found.split('{hero}').join('quem investigar');}
  function tokenDetail(zone){const t=TOKENS[zone];return t.kind==='food'?'+'+t.amount+' comida':'';}
  function interaction(s,h){const list=interactions(s,h);return list.find(x=>x.available)||list[0]||{id:null,label:'Explorar',detail:'Nada para resolver aqui',available:false};}
  function resolveToken(s,h,def){const t=tokenOf(s,h.zone),zone=h.zone;s.tokens[zone].resolved=true;let message='observou '+t.name.toLocaleLowerCase('pt-BR');
    if(t.kind==='food')message='explorou '+t.name.toLocaleLowerCase('pt-BR')+': '+eat(s,h,t.amount);
    for(const z of CLUES[zone]||[])reveal(s,z);
    s.lastFind={zone,title:t.hint,text:t.found.split('{hero}').join(def.name)};if(s.lastMeal){s.lastFind.text+=' '+s.lastMeal.charAt(0).toUpperCase()+s.lastMeal.slice(1)+'.';s.lastMeal=null;}if(t.kind!=='clue')addAlarm(s,1,'o barulho da busca em '+zone+' chama atenção');return message;}
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Concluam a distribuição da vida antes da primeira ação.');
    if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(!h||h.hp<=0||(h.ap<=0&&action!=='rescue'))return fail('Escolha um herói de pé com ações disponíveis.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone),visible=e=>e&&isRevealed(s,e.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada.');if(!isRevealed(s,target))return fail('Essa peça ainda não foi descoberta: investiguem as fichas de exploração para encontrar o caminho.');if(!canMove(h))return fail('Quem arrasta uma tora anda no máximo 2 peças por rodada.');const origin=h.zone;message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&visible(e)&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      const options=interactions(s,h),choice=target?options.find(x=>x.id===target):options.find(x=>x.available);
      if(foes().length)return fail('Elimine os inimigos nesta peça antes de interagir.');
      if(!choice||!choice.available)return fail(choice?.detail||'Não há nada para resolver aqui.');
      if(choice.id==='meet-grove'){s.grove='met';s.encounter={id:'grove',zone:h.zone,hero:h.id};message='entrou no bosque sagrado de Apolo';}
      else if(choice.id==='cut'){if(h.zone==='M3'){s.woodLeft.M3--;s.apollo++;h.cargo='corniso';message='cortou um tronco de corniso';}else{s.woodLeft[h.zone]--;h.cargo='tora';message='cortou uma tora em '+h.zone;}}
      else if(choice.id==='pickup'){const p=s.piles[h.zone],kind=p.corniso?'corniso':'tora';p[kind]--;if(!p.tora&&!p.corniso)delete s.piles[h.zone];h.cargo=kind;message='carregou a tora largada';}
      else if(choice.id==='deliver'){const n=h.cargo==='corniso'?2:1;if(h.cargo==='corniso')s.cornel++;s.wood+=n;h.cargo=false;if(h.id==='menelau')feat(s,'menelau');message='entregou madeira no canteiro (+'+n+')';}
      else if(choice.id==='work'){if(h.id==='agamemnon')feat(s,'agamemnon');message=addWork(s)?'terminou uma etapa do cavalo':'trabalhou no cavalo';}
      else if(choice.id==='blind'){s.blindProgress[h.zone]=(s.blindProgress[h.zone]||0)+1;if(s.blindProgress[h.zone]<2)message='começou a cegar a torre (1/2)';else{s.blinded.push(h.zone);addAlarm(s,1,'uma torre ficou em silêncio');s.lastFind={zone:h.zone,title:TOWERS[h.zone].name+' cega',text:'Os homens de '+def.name+' quebram os espelhos de bronze e derrubam o braseiro de sinais. Dali, Troia não vê mais os bosques. Na mesa: virem a ficha da torre.'};message='cegou a '+TOWERS[h.zone].name.toLocaleLowerCase('pt-BR');}}
      else if(choice.id==='explore'){if(h.id==='odisseu')feat(s,'odisseu');message=resolveToken(s,h,def);}
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível preparar habilidades com inimigos nesta peça.');if(!h.used.length)return fail('As habilidades já estão prontas. Vida só se recupera com comida encontrada.');h.used=[];message='preparou suas habilidades';
    }else if(action==='pray'){
      if(s.favor>=FAVOR_MAX)return fail('O Favor dos deuses já está no máximo.');if(h.ap>=2)h.ap--;else if(s.campFood>0)s.campFood--;else return fail('Com uma ação só, a prece pede 1 comida do armazém, e o armazém está vazio.');addFavor(s,1,'a prece de '+def.name);message='rezou aos deuses';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta peça.');if(h.hp<2)return fail('Socorrer transfere 1 de vida: quem socorre precisa ter ao menos 2.');h.hp--;a.hp=1;a.ap=1;message='socorreu '+heroName(a.id)+', dando-lhe 1 da sua própria força';
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
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma peça vizinha.');if(!canMove(h))return fail('Quem arrasta uma tora anda no máximo 2 peças por rodada.');h.moves++;enter(s,h,e.zone);strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta peça.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);const steps=ally?knownDistance(s,h.zone,zone):Infinity;if(!ally||zone===h.zone||steps>c.value)return fail('Escolha um aliado nesta peça e um destino revelado a até duas áreas.');if(!canMove(ally,steps))return fail('Quem arrasta uma tora anda no máximo 2 peças por rodada.');ally.moves+=steps;enter(s,ally,zone);}
      else if(c.type==='sprint'){const steps=knownDistance(s,h.zone,target);if(target===h.zone||steps>2)return fail('Destino revelado a até duas peças.');if(!canMove(h,steps))return fail('Quem arrasta uma tora anda no máximo 2 peças por rodada.');h.moves+=steps;if(steps===2){const mid=ZONES[h.zone].links.find(z=>isRevealed(s,z)&&ZONES[z].links.includes(target));enter(s,h,mid);}enter(s,h,target);}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta peça.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;kill(s,e,c.value,true);if(s.enemies.includes(e)){if(e.hold&&!e.post)e.post=origin;e.zone=zone;e.intimidated=true;e.hold=false;reveal(s,zone,'troia');log(s,TROOPS.label(e)+' sofreu '+c.value+' de dano, recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    if(action!=='rescue')h.ap=Math.max(0,h.ap-1);log(s,def.name+' '+message+'.');defeat(s);victory(s);return {ok:true,state:s,message:def.name+' '+message};
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
    if(r.ok&&r.state.outcome?.heroes)for(const oh of r.state.outcome.heroes){const h=r.state.heroes.find(x=>x.id===oh.id);if(h)oh.known=[...h.known];}
    if(r.ok&&!r.state.encounter&&r.state.pendingAbility){const s=r.state,h=s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;const left=h?[0,1,2].filter(x=>!h.known.includes(x)):[];if(left.length)s.encounter={id:'ability',hero:h.id,zone:h.zone,choices:left};}return r;}
  function chooseOne(state,choice){
    const s=clone(state),fail=error=>({ok:false,error,state});if(!s.encounter)return fail('Não há encontro aberto.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;const enc=s.encounter,h=s.heroes.find(a=>a.id===enc.hero);
    if(enc.id==='grove'){
      // O preço de Apolo fica escondido: cada corniso cortado é contado e cobrado na noite do cavalo.
      if(choice==='cut'){s.encounter=null;s.grove='cut';s.woodLeft.M3=2;s.lastFind={zone:'M3',title:'O corniso de Apolo',text:'Os machados entram no corniso, e a madeira é tão dura que solta faísca. Um cavalo de corniso não racha e anda mais depressa: cada tronco vale 2 de madeira. Ninguém fala alto no bosque. No alto do loureiro, um corvo branco observa.'};log(s,'Os gregos decidiram cortar o bosque sagrado de Apolo.');return {ok:true,state:s};}
      if(choice==='spare'){s.encounter=null;s.grove='spared';addFavor(s,1,'o bosque de Apolo foi poupado');s.lastFind={zone:'M3',title:'O bosque de Apolo',text:'Os homens deixam um pouco de vinho no altar e saem de costas. O corniso fica de pé. +1 de Favor.'};log(s,'O bosque sagrado de Apolo foi poupado.');return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(enc.id==='ability'){const n=Number(choice);if(!h||!enc.choices.includes(n))return fail('Escolham uma das habilidades ainda não aprendidas.');h.known.push(n);h.known.sort();s.encounter=null;s.lastLearn={hero:h.id,kind:'ability',card:n};log(s,heroName(h.id)+' aprendeu '+HEROES.find(d=>d.id===h.id).cards[n].name+'. Virem a carta no tabuleiro do herói.');const next=s.pendingAbility&&s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;if(next){const left=[0,1,2].filter(x=>!next.known.includes(x));if(left.length)s.encounter={id:'ability',hero:next.id,zone:next.zone,choices:left};}return {ok:true,state:s};}
    return fail('Encontro desconhecido.');
  }
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição indisponível.');
    if(delta===1){if(!s.campFood)return fail('O armazém está vazio.');if(h.hp>=HEROES.stats(h).maxHp)return fail('Este herói já está com a vida cheia.');h.hp++;s.campFood--;if(h.hp>0&&h.ap===0)h.ap=HEROES.stats(h).actions;}
    else{if(h.hp<=h.startHp)return fail('Só é possível devolver o que foi distribuído agora.');h.hp--;s.campFood++;if(!h.hp)h.ap=0;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Vida reposta com o armazém. Restam '+s.campFood+' comida(s) guardadas.');return {ok:true,state:s};}
  // Torres que veem alguém arrastando madeira (fim da fase dos heróis).
  function towerSightings(s){return Object.entries(TOWERS).filter(([id,t])=>!s.blinded.includes(id)&&s.heroes.some(h=>h.hp>0&&h.cargo&&t.sees.includes(h.zone))).map(([id])=>id);}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes'||s.foodSetup)return s;s.lastAttacks=[];s.escalation=null;s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    log(s,'Troia responde na rodada '+s.round+'.');
    s.seen=towerSightings(s);for(const id of s.seen){const n=1;if(!isRevealed(s,id)){reveal(s,id,'troia');s.lastFind={zone:id,title:'Um brilho de bronze',text:'Um espelho de bronze pisca no alto da muralha: a '+TOWERS[id].name.toLocaleLowerCase('pt-BR')+' viu as toras. Cegá-la custa 2 ações lá em cima, sem arqueiros na peça.'};}addAlarm(s,n,'a '+TOWERS[id].name.toLocaleLowerCase('pt-BR')+' viu toras arrastadas');}if(s.result)return s;
    for(const e of [...s.enemies]){
      if(!s.enemies.some(a=>a.id===e.id))continue;
      if(e.stunned){e.stunned=false;log(s,TROOPS.label(e)+' perdeu a ativação por Atordoamento.');continue;}
      if(e.hold&&e.post&&e.zone!==e.post&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone)&&!rangedTarget(s,e)){e.intimidated=false;e.zone=nextStep(e.zone,e.post);reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' voltou para '+e.zone+(e.zone===e.post?', o seu posto.':', a caminho do posto em '+e.post+'.'));continue;}
      if(e.hold&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone)&&!rangedTarget(s,e))continue;
      const intimidated=!!e.intimidated;e.intimidated=false;
      const lure=HEROES.taunt(s,e,distance,false),shot=intimidated?null:rangedTarget(s,e);
      if(shot&&!isRevealed(s,e.zone))reveal(s,e.zone,'troia');
      if(lure&&lure.zone!==e.zone&&!shot&&!e.hold){e.zone=ZONES[e.zone].links.slice().sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para Agamêmnon em '+e.zone+'.');continue;}
      const guard=s.guards[e.zone]||0;
      const reach=lure&&(lure.zone===e.zone||((TROOPS.types[e.type]?.range||0)>0&&distance(e.zone,lure.zone)<=TROOPS.types[e.type].range))?lure:null;
      const h=intimidated?null:shot||reach||s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const hp0=h.hp,damage=HEROES.damage(s,h,h.zone!==e.zone?Math.ceil((e.attack??2)/2):(e.attack??2),log,{distance});s.lastAttacks.push({enemy:e.id,hero:h.id,damage:hp0-h.hp,ranged:h.zone!==e.zone});log(s,heroName(h.id)+' sofreu '+damage+' de dano'+(h.zone!==e.zone?' à distância':'')+'.');
        if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&h.id!=='odisseu'&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2),ehp=e.hp;kill(s,e,rebound);const hit=s.lastAttacks[s.lastAttacks.length-1];if(hit&&hit.enemy===e.id){hit.rebound=Math.max(0,ehp-Math.max(0,e.hp));hit.killed=!s.enemies.includes(e);}log(s,'Rebote grego corpo a corpo: '+rebound+' de dano em '+TROOPS.label(e)+'.');if(!s.enemies.includes(e)&&h.id==='aquiles')feat(s,'aquiles');}
        if(h.hp>0&&h.id==='ajax'&&h.zone===SITE)feat(s,'ajax');if(!h.hp)h.ap=0;}
      else if(e.zone===SITE&&!e.hold){if(guard){s.guards[SITE]--;log(s,'A proteção salvou o cavalo.');}else burn(s,TROOPS.label(e)+' ataca o canteiro');}
      else if(!e.hold){e.zone=nextStep(e.zone,e.raid?SITE:huntGoal(s,e));reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    victory(s);if(s.result)return s;
    resolveChronicle(s);if(s.result)return s;
    if(s.round>=MAX_ROUNDS){finish(s,'defeat','A frota não pode esperar mais atrás de Tênedos. O cavalo ficou pela metade na praia.');return s;}
    s.round++;s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;h.moves=0;});
    // Sem subida automática: o Alarme vem só do que Troia vê (torres, batedores, barulho) e das crônicas.
    // Batedores só contam a Troia o que importa: alguém arrastando madeira a uma peça deles.
    const spotters=s.enemies.filter(e=>e.type==='explorador'&&s.heroes.some(h=>h.hp>0&&h.cargo&&distance(e.zone,h.zone)<=1));if(spotters.length)addAlarm(s,1,'batedores viram toras arrastadas e correram para relatar');
    startChronicle(s);
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!==MISSION||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||(s.campaign?s.heroes.length<1:s.heroes.length!==Math.max(3,s.players)))return false;
    if(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players)return false;
    if(!Array.isArray(s.revealed)||!s.revealed.includes('A2')||s.revealed.some(z=>!ZONES[z])||!Array.isArray(s.lastReveals))return false;
    if(!integer(s.alarm,0,ALARM_MAX)||!Array.isArray(s.alarmFired)||s.alarmFired.some(n=>!ALARM_STEPS[n]))return false;
    if(!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&[false,'tora','corniso'].includes(h.cargo)&&Array.isArray(h.known)&&h.known.length>=1))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,99)||!integer(s.stages,4,8)||!integer(s.stage,0,s.stages)||!integer(s.work,0,WORK-1)||!integer(s.wood,0,99)||!Array.isArray(s.discoveries)||!Array.isArray(s.blinded)||!s.woodLeft||!s.piles)return false;
    if(!['unseen','met','cut','spared'].includes(s.grove)||!s.tokens||Object.keys(s.tokens).sort().join()!==Object.keys(TOKENS).sort().join()||!integer(s.favor,0,FAVOR_MAX))return false;
    if(s.encounter!==null&&(!s.encounter||!['grove','ability'].includes(s.encounter.id)))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&TROOPS.types[e.type]&&integer(e.hp,1,TROOPS.types[e.type].hp)))return false;
    if(s.result==='victory'&&(s.stage<s.stages||s.outcome?.completed!==MISSION))return false;
    return Array.isArray(s.log)&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,MISSION,SITE,WORK,CARRY_MOVES,huntGoal,alarmMax,ALARM_MAX,PERSONAL,CHRONICLE,GODS,FAVOR_MAX,invoke,tokenOf,CLUES,ALARM_STEPS,FOOD_LIMIT,HEROES,TROOPS,TERRAINS,ZONES,TOKENS,REVEAL_TEXT,BASE,HIDDEN,WALLS,WOOD,WOOD_TEXT,TOWERS,DISCOVERY_TEXT,stagesFor,towerSightings,
    newGame,distance,knownDistance,isRevealed,intent,waves,nextAlarm,interaction,interactions,tokenDetail,act,choose,allocateFood,finishFoodSetup,trojanTurn,validSave,canMove};
});
