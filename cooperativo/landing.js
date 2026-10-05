(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyLanding=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  // Missão 1 com revelação do mapa: só N1 começa na mesa; o Alarme de Troia substitui o limite de rodadas.
  const VERSION=12,MAX_ROUNDS=60,FOOD_LIMIT=2,ALARM_MAX=18,CASTAWAY_LIMIT=8;
  const LAYOUT=[['P1','P6','C2','C1'],['A1','A2','P2'],['N1','N2','N3','N4']];
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};}));
  ZONES.C1.name='C1 · Círculo de pedras';
  const CONNECTIONS={"P1":["P6","A1","A2"],"P6":["P1","A2","C2"],"C2":["P6","A2","P2"],"C1":["P2"],"A1":["P1","A2","N1"],"A2":["A1","P1","P6","C2","P2","N1","N2"],"P2":["A2","C2","C1","N2","N3","N4"],"N1":["A1","A2","N2"],"N2":["N1","A2","P2","N3"],"N3":["N2","P2","N4"],"N4":["N3","P2"]};
  for(const [id,links] of Object.entries(CONNECTIONS))ZONES[id].links=links.filter(next=>ZONES[next]);
  const BEACHES=['N1','N2','N3','N4'];
  const CRATES={A:{3:{N1:1,N3:1,N4:1},4:{N1:1,N2:1,N3:1,N4:1},5:{N1:2,N2:1,N3:1,N4:1}},B:{3:{N1:1,N2:1,N4:1},4:{N1:1,N2:1,N3:1,N4:1},5:{N1:2,N2:1,N3:1,N4:1}}};
  // Fichas de exploração: a pista não revela o que há ali; o achado só aparece depois de explorar.
  const TOKENS={
    N1:{kind:'clue',name:'Pegadas na areia',hint:'Pegadas na areia molhada',found:'Na areia molhada, entre as marcas dos remadores, há pegadas de sandálias que não são gregas. Umas sobem as dunas, rumo à praia alta; outras seguem a arrebentação, para o leste, onde destroços boiam junto às rochas.'},
    A2:{kind:'food',amount:2,name:'Barris de água doce',hint:'Barris rolados na areia alta',found:'Atrás das dunas, um abrigo de lona rasgada e barris de água doce: um posto troiano temporário, largado às pressas. Ainda há brasas sob a areia. Da clareira acima sobe uma fumaça fina: há outro posto ali, e o vigia já viu os navios. +2 comida.'},
    N2:{kind:'food',amount:2,name:'Destroços',hint:'Destroços entre as rochas',found:'Entre as tábuas partidas, sacos de grão ainda secos. Os soldados os carregam em silêncio, passando pelos corpos dos remadores. +2 comida.'},
    P2:{kind:'scroll',scroll:'rotas-1',name:'Tabuinha das patrulhas',hint:'Algo brilha na relva',found:'Um carro troiano tombado e, ao lado, o corpo de um mensageiro. Na tabuinha de cera, as rotas das patrulhas e uma trilha entre os pinheiros, rumo às muralhas. Os homens de {hero} guardam a tabuinha: pergaminho Rotas da costa I. O que ela ensina só servirá mais adiante.'},
    N3:{kind:'food',amount:2,name:'Peixe seco',hint:'Redes penduradas nos rochedos',found:'Pescadores troianos fugiram às pressas: as redes ainda guardam peixe seco ao sol. +2 comida.'},
    C2:{kind:'food',amount:2,name:'Cabras no alto',hint:'Sinos de cabras na encosta',found:'Um pequeno rebanho troiano pasta sem pastor na encosta. Os homens descem com duas cabras nos ombros. +2 comida.'},
    P1:{kind:'evolution',name:'Mirante troiano',hint:'O posto de vigia entre as rochas',found:'Lá em cima se vê toda a costa e as rotas de Troia. Conquistar o mirante custa esforço, mas a experiência ficará com o herói que a equipe escolher.'},
    P6:{kind:'cache',amount:2,name:'Esconderijo na trilha',hint:'Pegadas frescas na trilha',found:'As pegadas levam a um esconderijo de pastores: queijo e odres de vinho. Os homens comem pela primeira vez em dois dias. +2 comida.'}
  };
  // No roteiro B, duas fichas guardam perigo em vez de recompensa.
  const ROUTE_TOKENS={B:{
    N2:{kind:'wound',amount:2,name:'Serpente nos destroços',hint:'Destroços entre as rochas',found:'Uma víbora se esconde entre as tábuas. Homens de {hero} caem envenenados antes que alguém a mate: {hero} sofre 2 de dano.'},
    P6:{kind:'ambush',name:'Emboscada na trilha',hint:'Pegadas frescas na trilha',found:'As pegadas eram uma isca. Uma companhia de lanceiros salta de trás das rochas: ela agirá na próxima resposta de Troia.'}
  }};
  const tokenOf=(s,zone)=>ROUTE_TOKENS[s.route]?.[zone]||TOKENS[zone];
  // Exploração por missão: só se anda por peças reveladas. Investigar uma ficha revela as peças para onde a pista aponta.
  const CLUES={N1:['A2','N2'],A2:['A1'],N2:['N3','P2'],N3:['N4'],P2:['C2','C1'],C2:['P6'],P6:['P1']};
  const CLUE_TEXT={
    N2:'Do alto das rochas, os homens avistam os rochedos batidos pelas ondas, a leste, e uma planície aberta subindo para o interior.',
    N3:'Para além dos rochedos, numa enseada, aparece o casco de um navio tombado.',
    P2:'A tabuinha e o terreno contam o resto: uma colina rochosa ao norte e, mais adiante, um círculo de pedras antigas.',
    C2:'Do alto da colina, uma trilha estreita desce entre os arbustos.',
    P6:'A trilha continua até um bosque de rochas e pinheiros, onde se vê um posto de vigia vazio: a sentinela saiu na troca de turno.'
  };
  // O posto de vigia de A1: a vigia fica parada; quando o posto é descoberto, a rendição desce a colina pela trilha e pelo mirante.
  const RELIEF_PATH=['C2','P6','P1','A1'];
  // Favor dos Deuses: sobe com atos de honra, cai com atos ímpios; gasto para invocar um deus por rodada.
  const FAVOR_MAX=6;
  const GODS={
    atena:{name:'Atena',cost:1,title:'Olhos de Atena',text:'Revela o que há numa ficha de exploração antes de investigá-la.'},
    poseidon:{name:'Poseidon',cost:2,title:'Mar revolto',text:'O mar se agita e atrasa as tropas de Troia na costa. O Alarme cai 2.'},
    zeus:{name:'Zeus',cost:2,title:'Presságio de Zeus',text:'O pedido da crônica desta rodada conta como cumprido.'}
  };
  const SHIP='N4',CASTAWAYS={A:'N3',B:'N4'},BEGGAR='C1';
  // Patamares do Alarme: cada um traz tropas. Em 15 desce Enéias (derrotá-lo faz Troia recuar); em 18, Troia em peso.
  const ALARM_STEPS={4:[['C2','explorador']],7:[['P2','explorador']],11:[['P6','lanceiro']],15:[['P6','eneias']],18:[]};
  const ALARM_BONUS={7:[['P2','lanceiro']],15:[['P6','lanceiro']]};
  const ENEIAS={},CAMP_ZONES=['A1','P1','A2','N1'];
  function alarmEntries(s,step){if(step===15&&s.eneiasDown){const gates=['P6','C2','P2'],list=[];for(let i=0;i<Math.max(3,s.heroes.length);i++)list.push([gates[i%3],'lanceiro']);return list;}if(step===18){const gates=['P1','C2','P2'],list=[];for(let i=0;i<s.heroes.length-1;i++)list.push([gates[i%3],'lanceiro']);list.push(['C2','arqueiro']);return list;}return [...ALARM_STEPS[step],...(s.heroes.length>=4?ALARM_BONUS[step]||[]:[])];}
  const REVEAL_TEXT={
    A1:'Uma clareira protegida do vento, acima da praia. Uma fogueira, uma tenda de couro e um vigia troiano de olho na frota: é o posto que vigia a praia.',
    A2:'A praia alta, firme o bastante para as tendas. Barris trazidos pela maré se acumulam junto às dunas.',
    N2:'Rochas negras e destroços do navio desgarrado. Entre as tábuas, corpos de remadores que não chegaram à terra.',
    N3:'Rochedos batidos pelas ondas. O mar aqui não perdoa quem cai nele.',
    N4:'Na enseada, o casco do navio de carga está encalhado, tombado de lado.',
    P1:'Um bosque de rochas e pinheiros. No alto, um posto de vigia troiano, vazio por ora.',
    P2:'Uma planície aberta, sem abrigo. Qualquer contingente aqui será visto das colinas.',
    P6:'Uma trilha estreita sobe para o interior, entre arbustos espinhosos.',
    C2:'Uma colina rochosa domina a costa. Daqui se vê a fumaça de Troia no horizonte.',
    C1:'No alto, um círculo de pedras antigas, mais velho que a própria Troia.'
  };
  // Objetivos pessoais: cada herói tem um feito próprio na missão, com uma recompensa pequena.
  const PERSONAL={
    aquiles:{name:'Glória',goal:2,text:'Derrote 2 tropas troianas.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    odisseu:{name:'Batedor da frota',goal:3,text:'Investigue 3 fichas de exploração.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    agamemnon:{name:'Senhor do acampamento',goal:1,text:'Esteja em A1 quando o acampamento for instalado.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    menelau:{name:'Irmão de armas',goal:1,text:'Socorra ou cure um aliado, ou ajude a resgatar os náufragos.',reward:'Aprende uma nova habilidade, à escolha do jogador.'},
    ajax:{name:'Muralha dos aqueus',goal:3,text:'Resista de pé a 3 ataques troianos.',reward:'Aprende uma nova habilidade, à escolha do jogador.'}
  };
  // Crônica: segue os momentos da missão, não as rodadas. Um pedido nasce do momento que o explica;
  // as cenas de respiro só aparecem em rodadas sem nenhum momento.
  const CHRONICLE={
    sinal:{title:'Fumaça nas colinas',text:'Do posto de A1 sobe uma coluna de fumaça, e nas colinas outros vigias respondem, de fogo em fogo, chamando os homens de Troia.',demand:'Até a próxima resposta de Troia, mantenham um herói de pé em P1, P6 ou C2 para abafar o sinal.'},
    agua:{title:'Barris da frota',text:'Com a primeira caixa no alto, os remadores descem barris de água doce dos navios. Alguém precisa recebê-los na praia.',demand:'Se um herói estiver de pé em N1 na próxima resposta de Troia, o armazém recebe +1 comida.'},
    batedores:{title:'Olhos na mata',text:'Os batedores que desceram da colina contam os navios. Se voltarem à cidade, Troia saberá quantos somos.',demand:'Se nenhum batedor troiano estiver à vista ao fim da próxima resposta, o Alarme cai 1.'},
    fogueiras:{title:'Fogueiras ao longe',text:'A carga está toda no alto e o dia termina. Nas muralhas distantes, fogueiras se acendem uma a uma: Troia sabe que estamos aqui.',demand:'Se o acampamento estiver instalado ao fim da próxima resposta, a frota se tranquiliza: Alarme −1. Se não, a escuridão favorece os batedores: Alarme +1.'},
    corvo:{title:'Um corvo no mastro',text:'Um corvo pousa no mastro do navio de Agamêmnon. Entre os soldados corre o murmúrio de maus presságios; alguns já falam em voltar para casa.'},
    chuva:{title:'Chuva fria',text:'Uma chuva fria encharca a costa. A madeira das caixas incha, e os homens que as carregam praguejam baixo.'},
    remadores:{title:'O canto dos remadores',text:'Dos navios, os remadores entoam o canto da travessia. Na praia, os soldados param por um instante e erguem a cabeça.'},
    mensageiro:{title:'Um mensageiro do rei',text:'"O rei quer o acampamento seguro antes do amanhecer", diz o mensageiro, ofegante. "Os homens não aguentam outra noite na praia."'},
    nevoa:{title:'Névoa marinha',text:'Uma névoa espessa sobe do mar. Os sentinelas mal enxergam a própria lança; cada ruído pode ser o inimigo.'},
    madrugada:{title:'Madrugada',text:'O céu clareia sobre o mar. Os mortos da noite são enrolados em mantos. Quem ainda resiste, resiste por todos.'}
  };
  const MOMENT_CHRONICLE={posto:'sinal',entrega:'agua',alarme4:'batedores',carga:'fogueiras'},BREATHERS=['corvo','chuva','remadores','mensageiro','nevoa','madrugada'];
  function moment(s,id){s.moments.push(id);const c=MOMENT_CHRONICLE[id];if(c&&!s.told.includes(c)&&!s.chronicleQueue.includes(c))s.chronicleQueue.push(c);}
  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone,type='explorador'){const e=TROOPS.create('e'+s.nextEnemy++,zone,type);s.enemies.push(e);reveal(s,zone,'troia');return e;}
  function isRevealed(s,zone){return s.revealed.includes(zone);}
  function reveal(s,zone,by='heroi'){if(!ZONES[zone]||isRevealed(s,zone))return false;s.revealed.push(zone);s.lastReveals.push(zone);log(s,(by==='troia'?'Tropas troianas surgiram em '+zone+'. ':'Nova peça: ')+'posicionem '+ZONES[zone].name+' na mesa.');if(zone==='A1'&&s.post?.status==='hidden')postFound(s);return true;}
  // O posto aparece junto com A1: a vigia já viu os gregos, e a rendição começa a descer a colina.
  function postFound(s){s.post.status='found';moment(s,'posto');const e=spawn(s,RELIEF_PATH[0],'explorador');e.relief=true;log(s,'Há um posto de vigia troiano em A1. Um batedor desce a colina para render a vigia: tomem o posto antes que ele chegue.');}
  function postTaken(s){if(s.post.status!=='found'||s.enemies.some(e=>e.watch))return;s.post.status='taken';moment(s,'tomado');for(const e of s.enemies)if(e.relief)e.relief=false;s.lastFind={zone:'A1',title:'O posto é nosso',text:'A vigia cai junto à fogueira. Agamêmnon sobe à clareira, olha a praia e a frota lá embaixo e crava a lança no chão: "Aqui será o acampamento. Tragam as caixas."'};log(s,'O posto de A1 foi tomado. Ali será o acampamento: levem as caixas para A1.');}
  function revealClues(s,zone){for(const z of CLUES[zone]||[])reveal(s,z);}
  function startingAbilities(id,choices){if(!choices)return [0,1,2];const n=choices[id];if(!Number.isInteger(n)||n<0||n>2)throw Error('Escolham a habilidade inicial de cada herói.');return [n];}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const route=options.route==='B'?'B':'A';
    const s={version:VERSION,mission:'desembarque',route,players,playerNames,round:1,phase:'heroes',result:null,reason:'',foodSetup:false,campFood:0,scrolls:[],foodSpent:0,burned:0,eneiasDown:false,retreated:0,campDamage:0,delivered:0,required:ids.length,built:false,
      supplies:{...CRATES[route][ids.length]},revealed:['N1'],lastReveals:[],visited:['N1'],alarm:0,alarmFired:[],combatZones:[],shipNoise:false,
      tokens:Object.fromEntries(Object.keys(TOKENS).map(zone=>[zone,{resolved:false,peeked:false}])),favor:1,invokedRound:0,
      castaways:{zone:CASTAWAYS[route],status:'unseen',progress:0},beggar:{status:'unseen',zone:BEGGAR,escort:null},post:{status:'hidden'},encounter:null,moments:[],chronicleQueue:[],told:[],
      personal:Object.fromEntries(ids.map(id=>[id,{progress:0,done:false}])),lastFeats:[],chronicle:null,
      guards:{},nextEnemy:1,heroes:ids.map((id,i)=>({...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:'N1',cargo:false,food:0,moves:0,known:startingAbilities(id,options.abilities)})),enemies:[],log:[],outcome:null};
    // O mirante de P1 começa vazio (troca de turno); a vigia da praia fica parada em A1, escondida até a peça aparecer.
    s.enemies.push(Object.assign(TROOPS.create('e'+s.nextEnemy++,'A1','explorador'),{hold:true,watch:true}));
    log(s,'A frota ancorou em N1, com milhares de homens a bordo. Um navio de carga se desgarrou na travessia, e parte dos mantimentos se perdeu ao longo da costa.');return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  // Distância só por peças já reveladas: usada pelos heróis para habilidades de deslocamento.
  function knownDistance(s,from,to){if(!isRevealed(s,from)||!isRevealed(s,to))return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)&&isRevealed(s,n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone,goal='A1'){return ZONES[zone].links.slice().sort((a,b)=>distance(a,goal)-distance(b,goal))[0];}
  function reliefStep(e){const i=RELIEF_PATH.indexOf(e.zone);return i>=0&&i<RELIEF_PATH.length-1?RELIEF_PATH[i+1]:nextStep(e.zone);}
  // A rendição chega a A1: se o posto ainda é troiano, Troia fica sabendo e o batedor fica de vigia.
  function reliefArrives(s,e){e.relief=false;if(s.post.status!=='found'||!s.enemies.some(x=>x.watch&&x.id!==e.id))return;e.hold=true;e.watch=true;log(s,'A rendição chegou ao posto de A1 antes dos gregos e fica de vigia.');addAlarm(s,2,'a rendição encontrou o posto de A1 ainda troiano');}
  // Tropas caçam quem carrega caixa a até duas peças; senão marcham para o acampamento.
  function huntGoal(s,e){const carrier=s.heroes.filter(h=>h.hp>0&&h.cargo&&distance(e.zone,h.zone)<=2).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone))[0];return carrier?carrier.zone:'A1';}
  function intimidationZone(s,e){return ZONES[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(b,'A1')-distance(a,'A1'))[0];}
  // Expedições de 5 heróis têm 5 caixas a buscar: Troia demora um pouco mais a descer em peso.
  function alarmMax(s){return ALARM_MAX;}
  function nextAlarm(s){const steps=Object.keys(ALARM_STEPS).map(Number).filter(n=>!s.alarmFired.includes(n)).sort((a,b)=>a-b);if(!steps.length)return {at:alarmMax(s),entries:[]};const at=steps[0];return {at,entries:alarmEntries(s,at)};}
  function waves(s){return nextAlarm(s).entries.map(([zone])=>zone);}
  function intent(e,s){if(e.stunned)return 'Atordoado: perderá esta ativação';{const shot=rangedTarget(s,e);if(shot&&!e.intimidated)return 'Atirar em '+heroName(shot.id)+(shot.zone!==e.zone?' em '+shot.zone:'');}if(e.hold&&e.post&&e.zone!==e.post&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return 'Voltar ao posto em '+e.post;if(e.hold&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return e.watch?'Vigiar a praia':'Guarnecer o posto de vigia';if(e.relief&&!s.heroes.some(h=>h.hp>0&&h.zone===e.zone))return 'Render a vigia em A1: avançar para '+ZONES[reliefStep(e)].name;if(e.intimidated)return 'Intimidado: não poderá atacar nesta resposta';const lure=HEROES.taunt(s,e,distance,false);if(lure)return 'Priorizar Agamêmnon em '+lure.zone;if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';const goal=huntGoal(s,e);if(goal!=='A1')return 'Caçar quem carrega a caixa em '+goal;return e.zone==='A1'?(s.post.status==='taken'?'Atacar o acampamento':'Defender o posto de A1'):'Avançar para '+ZONES[nextStep(e.zone)].name;}
  function finish(s,result,reason){finishCore(s,result,reason);if(s.outcome)s.outcome.legacy={...(s.outcome.legacy||{}),lost:Object.fromEntries(s.heroes.filter(h=>h.lost).map(h=>[h.id,true]))};}
  function finishCore(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;if(s.encounter?.id!=='ability')s.encounter=null;if(result==='victory')s.outcome={completed:'desembarque',next:'Diante das muralhas',supplies:s.delivered-s.burned,burned:s.burned,eneias:s.eneiasDown,horseMaterials:0,campFood:s.campFood,revealedZones:[...s.revealed],castaways:s.castaways.status==='rescued',castawaysFate:s.castaways.status,beggarFate:s.beggar.status,lookoutTaken:!!s.tokens.P1.resolved,scrolls:[...s.scrolls],heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]})),blessing:s.beggar.status==='zeus'};log(s,reason);}
  function defeat(s){if(s.result)return;if(s.campDamage>=3)finish(s,'defeat','Troia arrasou o acampamento. Os gregos precisam refazer o desembarque.');else if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram. A expedição precisa recuar.');}
  // Vitória: acampamento instalado e, antes de Enéias, nenhuma tropa em A1 e vizinhas; depois dele, Enéias derrotado.
  function victory(s){if(s.result||!s.built)return;
    if(s.enemies.some(e=>e.type==='eneias'))return;
    if(!s.enemies.some(e=>CAMP_ZONES.includes(e.zone)&&!e.hold))finish(s,'victory',s.eneiasDown?'Enéias caiu e os troianos que voltaram foram rechaçados. O acampamento está firme na costa.':'Nenhum troiano resta perto das tendas. O acampamento está firme na costa.');}
  function addAlarm(s,amount,reason){
    if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(alarmMax(s),s.alarm+amount));if(s.alarm===before)return;
    log(s,'Alarme de Troia '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+alarmMax(s)+'): '+reason+'.');
    for(const step of Object.keys(ALARM_STEPS).map(Number).sort((a,b)=>a-b)){
      if(s.alarm<step||s.alarmFired.includes(step))continue;s.alarmFired.push(step);
      moment(s,'alarme'+step);const entries=alarmEntries(s,step);
      for(const [zone,type] of entries){const e=spawn(s,zone,type);if(type==='eneias')Object.assign(e,ENEIAS);}
      log(s,(step===18?'Troia em peso! ':step===15?(s.eneiasDown?'Os lanceiros troianos voltam à carga. ':'Enéias desce com a sua guarda. '):'')+'Troia reage ao alarme '+step+': '+entries.map(([zone,type])=>TROOPS.types[type].short+' em '+zone).join(', ')+'.');
    }
    if(s.alarmFired.includes(7)&&!s.tokens.P1.resolved&&!s.garrison&&!s.eneiasDown){s.garrison=true;spawn(s,'P1','lanceiro').hold=true;log(s,'Troia guarnece o posto de vigia de P1 com uma companhia de lanceiros.');}
    if(s.alarm>=10&&s.beggar.status==='met'){spy(s,'O velho cansou de esperar pelo pão prometido.');}
    if(s.alarm>=CASTAWAY_LIMIT&&['unseen','met'].includes(s.castaways.status)){s.castaways.status='lost';log(s,'A maré subiu. Os náufragos de '+s.castaways.zone+' foram levados pelo mar.');}
    defeat(s);
  }
  function spy(s,reason){const zone=s.heroes.find(h=>h.id===s.beggar.escort)?.zone||s.beggar.zone;s.beggar.status='spy';s.beggar.escort=null;s.beggar.zone=zone;log(s,reason+' O velho era um espião troiano: "Troia saberá quantos vocês são."');spawn(s,zone,'lanceiro');addAlarm(s,2,'o espião do círculo de pedras');}
  // O velho recebe o pão e desaparece; o trovão revela que era Zeus.
  function blessing(s,h){s.beggar.status='zeus';s.beggar.escort=null;s.lastFind={zone:s.beggar.zone,title:'O trovão em céu limpo',text:(h?heroName(h.id)+' traz pão do acampamento para o velho. ':'')+'Ele come devagar, agradece e se levanta. Quando os homens se viram, não há ninguém entre as pedras. Um trovão rola no céu sem nuvens, e os veteranos se entreolham: era Zeus, e ele foi bem recebido. +2 de Favor; o Alarme cai 1.'};log(s,'O velho era Zeus. Os gregos honraram a hospitalidade.');addFavor(s,2,'Zeus foi bem recebido');addAlarm(s,-1,'a bênção de Zeus acalma a costa');}
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  function feat(s,id,amount=1){
    const p=s.personal?.[id],def=PERSONAL[id],h=s.heroes.find(x=>x.id===id);if(!p||p.done||!def||!h||s.result)return;
    p.progress=Math.min(def.goal,p.progress+amount);if(p.progress<def.goal)return;p.done=true;s.lastFeats.push(id);addFavor(s,1,'o feito de '+heroName(id));const options=[0,1,2].filter(n=>!h.known.includes(n));if(options.length&&!s.encounter)s.encounter={id:'ability',hero:id,zone:h.zone,choices:options};else if(options.length)s.pendingAbility=id;
    log(s,'Feito de '+heroName(id)+': '+def.name+'. '+def.reward);
      }
  const CHRONICLE_CHECKS={
    sinal:{check:s=>s.heroes.some(h=>h.hp>0&&['P1','P6','C2'].includes(h.zone)),success:s=>log(s,'Crônica: o sinal de fumaça foi abafado antes de se espalhar.'),fail:s=>addAlarm(s,1,'o sinal de fumaça se espalhou pelas colinas')},
    agua:{check:s=>s.heroes.some(h=>h.hp>0&&h.zone==='N1'),success:s=>{log(s,'Crônica: os barris de água chegaram: '+eat(s,woundedAt(s,'N1'),1)+'.');},fail:s=>log(s,'Crônica: ninguém buscou os barris; eles voltaram aos navios.')},
    batedores:{check:s=>!s.enemies.some(e=>e.type==='explorador'&&isRevealed(s,e.zone)),success:s=>addAlarm(s,-1,'nenhum batedor troiano vigia a costa'),fail:s=>log(s,'Crônica: batedores troianos continuam à espreita.')},
    fogueiras:{check:s=>s.built,success:s=>addAlarm(s,-1,'o acampamento aceso tranquiliza a frota'),fail:s=>addAlarm(s,1,'a escuridão favorece os batedores')}
  };
  function resolveChronicle(s){const c=s.chronicle;if(!c||c.status!=='open'||s.result)return;const rule=CHRONICLE_CHECKS[c.id];const ok=c.favored||rule.check(s);c.status=ok?'success':'fail';s.chronicleResult={id:c.id,status:c.status};(ok?rule.success:rule.fail)(s);if(!ok&&!s.result)escalate(s,c.id);}
  // Pedido descumprido: Troia manda um contingente ligado à história. Uma tropa; duas com 5 heróis.
  const ESCALATION={"sinal":["P2","explorador","Os vigias das colinas viram a fumaça e mandaram batedores"],"fogueiras":["P2","lanceiro","Na escuridão, uma companhia troiana se aproxima das tendas"]};
  function escalate(s,id){const e=ESCALATION[id];if(!e||s.commanderDown)return;const n=s.heroes.length>=5?2:1;for(let i=0;i<n;i++)spawn(s,e[0],e[1]);s.escalation=e[2];if(!s.nexusDone)loseItem(s,'odisseu',e[0],'Na noite, batedores troianos entram no acampamento e levam o arco de Odisseu.');log(s,'Crônica: '+e[2]+' ('+n+' '+(TROOPS.types[e[1]].short)+' em '+e[0]+').');}
  function startChronicle(s){
    const quiet=!s.moments.length;s.moments=[];if(s.result){s.chronicle=null;return;}
    const id=s.chronicleQueue.shift()||(quiet?BREATHERS.find(b=>!s.told.includes(b)):null);if(!id){s.chronicle=null;return;}
    const entry=CHRONICLE[id];s.told.push(id);s.chronicle={round:s.round,id,status:CHRONICLE_CHECKS[id]?'open':'told'};
    log(s,'Crônica da rodada '+s.round+': '+entry.title+'.');
    
  }
  // Entrada de um herói numa peça: revela, dispara encontros e o barulho do navio.
  function enter(s,h,zone){
    h.zone=zone;
    if(s.beggar.status==='escort'&&s.beggar.escort===h.id){s.beggar.zone=zone;if(zone==='A1'&&!s.built)blessing(s);}
    if(s.visited.includes(zone))return;s.visited.push(zone);
    if(zone===SHIP&&!s.shipNoise){s.shipNoise=true;addAlarm(s,1,'o casco do navio encalhado range com a chegada dos heróis');}
    if(zone===s.castaways.zone&&s.castaways.status==='unseen'){s.castaways.status='met';moment(s,'naufragos');s.encounter={id:'castaways',zone};}
    if(zone===BEGGAR&&s.beggar.status==='unseen'){s.beggar.status='met';moment(s,'velho');s.encounter={id:'beggar',zone};}
  }
  function dropCargo(s,h){if(h.cargo){s.supplies[h.zone]=(s.supplies[h.zone]||0)+1;h.cargo=false;log(s,'Uma caixa caiu em '+h.zone+' e pode ser recuperada.');}if(s.beggar.status==='escort'&&s.beggar.escort===h.id){s.beggar.status='waiting';s.beggar.escort=null;s.beggar.zone=h.zone;log(s,'O velho ficou em '+h.zone+' esperando outra escolta.');}}
  function kill(s,e,damage,ignoreArmor=0){const armor=ignoreArmor===true?0:Math.max(0,(e.armor||0)-ignoreArmor);e.hp-=Math.max(0,damage-armor);if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');if(e.watch)postTaken(s);if(e.type==='eneias'){s.eneiasDown=true;const guard=s.enemies.filter(a=>!a.watch&&distance(a.zone,e.zone)<=1);s.retreated=guard.length;s.enemies=s.enemies.filter(a=>!guard.includes(a));s.alarmFired=s.alarmFired.filter(n=>n!==15);log(s,'Enéias caiu. A guarda dele recua com o corpo para a cidade'+(guard.length?' ('+guard.length+' tropa'+(guard.length>1?'s':'')+')':'')+', mas Troia não desiste.');addAlarm(s,-7,'Enéias caiu');postTaken(s);}}}
  function strike(s,h,e,amount,options={}){
    const zone=e.zone;
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu');
    if(!s.enemies.includes(e)&&h.id==='aquiles')feat(s,'aquiles');
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(e.hp>0&&!e.stunned&&!options.ranged&&!(TROOPS.types[e.type]?.range>0)){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true,distance});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');if(!h.hp)dropCargo(s,h);}
  }
  function canMove(h,steps=1){return !h.cargo||(h.moves===0&&steps<=1);}
  // Investida e Corrida são façanhas: valem mesmo depois de mover com a caixa, mas carregando só cobrem uma área.
  function canDash(h,steps=1){return !h.cargo||steps<=1;}
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true,distance});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+heroName(h.id)+'.');if(!h.hp){dropCargo(s,h);return false;}}
    h.moves++;enter(s,h,target);return true;
  }
  // Todas as interações possíveis na peça do herói (a ação Explorar).
  function interactions(s,h){
    const lostHere=s.heroes.find(o=>o.lost&&o.lost.zone===h.zone);
    const list=[],foes=s.enemies.some(e=>e.zone===h.zone),add=(id,label,detail,available=true)=>list.push({id,label,detail,available:available&&!foes});if(lostHere)add('recover','Recuperar '+lostHere.lost.item,'Devolver a '+heroName(lostHere.id)+' · sem inimigos na peça');
    if(h.cargo&&h.zone==='A1')add('deliver','Entregar caixa','Abastecer o acampamento');
    if(!h.cargo&&(s.supplies[h.zone]||0)>0)add('pickup','Carregar caixa','Quem carrega só se move uma vez por rodada');
    if(h.zone==='A1'&&s.delivered===s.required&&!s.built)add('install','Instalar acampamento','Inicia o contra-ataque troiano');
    const token=s.tokens[h.zone];if(token&&!token.resolved&&isRevealed(s,h.zone)&&tokenOf(s,h.zone).kind==='evolution')add('lookout','Escalar o posto de vigia ('+(token.progress||0)+'/2)',token.peeked?'Atena revelou: '+foundPreview(s,h.zone):'2 ações no total, sem inimigos; o barulho chama Troia');
    else if(token&&!token.resolved&&isRevealed(s,h.zone)){const quiet=tokenOf(s,h.zone).kind==='clue',noise=quiet?'Seguir a pista não faz barulho.':'A busca faz barulho (Alarme +1).';add('explore','Investigar: '+tokenOf(s,h.zone).hint.toLocaleLowerCase('pt-BR'),token.peeked?'Atena revelou: '+foundPreview(s,h.zone)+' '+noise:'Ninguém sabe o que há ali. '+noise);}
    if(h.zone===s.castaways.zone&&s.castaways.status==='met')add('castaways','Resgatar náufragos',`${s.castaways.progress}/2 ações · antes do Alarme ${CASTAWAY_LIMIT}`);
    if(h.zone===s.beggar.zone&&s.beggar.status==='met')add('feed','Dar pão ao velho','Custa 1 comida do armazém',s.campFood>0);
    if(h.zone===s.beggar.zone&&s.beggar.status==='waiting')add('escort','Escoltar o velho','Leve-o até o fogo de A1');
    return list;
  }
  function foundPreview(s,zone){return tokenOf(s,zone).found.split('{hero}').join('quem investigar').replace('N{level}','o próximo nível');}
  function tokenDetail(zone,h){const t=TOKENS[zone];if(t.kind==='food')return '+'+t.amount+' comida no armazém';if(t.kind==='scroll')return 'Um pergaminho para a campanha';if(t.kind==='evolution')return h&&h.level>=3?'Nível máximo: +1 comida no armazém':'Evolução imediata para o próximo nível';return '';}
  function interaction(s,h){const list=interactions(s,h);return list.find(x=>x.available)||list[0]||{id:null,label:'Explorar',detail:h.cargo?'Leve sua caixa até A1':'Nada para resolver aqui',available:false};}
  // Comida encontrada vira força de quem a encontrou, até a vida máxima; o que sobra vai para o armazém (repõe vida na próxima missão).
  function eat(s,h,amount){const room=h&&h.hp>0?Math.max(0,HEROES.stats(h).maxHp-h.hp):0,gain=Math.min(room,amount),stored=amount-gain;if(gain)h.hp+=gain;s.campFood+=stored;
    return [gain?'+'+gain+' de vida para '+heroName(h.id):'',stored?'+'+stored+' comida no armazém':''].filter(Boolean).join(' e ');}
  function woundedAt(s,zone){return s.heroes.filter(h=>h.hp>0&&h.zone===zone).sort((a,b)=>(a.hp-HEROES.stats(a).maxHp)-(b.hp-HEROES.stats(b).maxHp))[0];}
  // Resolve uma ficha de exploração para o herói h (o achado aparece só depois).
  function resolveToken(s,h,def){let message='';const t=tokenOf(s,h.zone);s.tokens[h.zone].resolved=true;const zone=h.zone;
        if(t.kind==='food'){message='explorou '+t.name+': '+eat(s,h,t.amount);}
        else if(t.kind==='cache'){message='encontrou um '+t.name.toLocaleLowerCase('pt-BR')+': '+eat(s,h,t.amount);}
        else if(t.kind==='wound'){const dealt=HEROES.damage(s,h,t.amount,log,{ignoreArmor:true,distance});if(!h.hp)dropCargo(s,h);message='foi ferido por uma serpente nos destroços ('+dealt+' de dano)';}
        else if(t.kind==='ambush'){spawn(s,zone,'lanceiro');message='caiu numa emboscada na trilha';}
        else if(t.kind==='scroll'){if(!s.scrolls.includes(t.scroll))s.scrolls.push(t.scroll);message='encontrou a '+t.name.toLocaleLowerCase('pt-BR')+' (pergaminho Rotas da costa I)';}
        else if(t.kind==='clue'){message='seguiu as '+t.name.toLocaleLowerCase('pt-BR');}
        revealClues(s,zone);const text=[t.found.split('{hero}').join(def.name),CLUE_TEXT[zone]||''].filter(Boolean).join(' ');s.lastFind={zone,title:t.hint,text};if(t.kind!=='clue')addAlarm(s,1,'o barulho da busca em '+zone+' chama atenção');return message;}
  // Eventos nexo: um herói perde o equipamento, e as cartas que dependem dele ficam viradas até alguém recuperá-lo.
  // Ájax perde duas (as duas precisam do escudo); os outros, uma. O objeto não recuperado segue perdido na missão seguinte.
  const NEXUS={
    odisseu:{item:'o arco de Ítaca',cards:[0],lost:'Disparo Duplo funciona com qualquer arco; a Precisão, não: só o arco dele tem a calibração que a mão conhece.',found:'Odisseu testa a corda do arco como fez diante dos pretendentes, e sorri. A Precisão volta.'},
    ajax:{item:'o escudo de Ájax',cards:[0,1],lost:'Sem o escudo de sete couros, Ájax não tem o Escudo de Bronze nem o Golpe de Escudo.',found:'Ájax ergue de novo o escudo de sete couros. O Escudo de Bronze e o Golpe de Escudo voltam.'},
    aquiles:{item:'as sandálias de Aquiles',cards:[1],lost:'Descalço sobre as pedras, Aquiles não consegue a Investida.',found:'Aquiles amarra as sandálias. A Investida volta.'},
    agamemnon:{item:'o cetro de Agamêmnon',cards:[2],lost:'Sem o cetro, os troianos não temem o rei: Agamêmnon perde a Intimidação.',found:'O cetro volta às mãos do rei. A Intimidação volta.'}};
  function loseItem(s,id,zone,why){const h=s.heroes.find(x=>x.id===id&&x.hp>0&&!x.away&&!x.patroclus),n=NEXUS[id];if(!h||!n||h.lost||!n.cards.some(c=>h.known.includes(c)))return false;
    h.lost={item:n.item,cards:[...n.cards],zone};s.nexusDone=true;const names=n.cards.map(c=>HEROES.find(d=>d.id===id).cards[c].name).join(' e ');
    s.lastFind={zone,title:'Perderam '+n.item,text:why+' '+n.lost+' Na mesa: virem para baixo '+names+' e coloquem 1 ficha de exploração em '+zone+': é onde '+n.item+' está.'};log(s,heroName(id)+' perdeu '+n.item+'. Recuperem-no em '+zone+'.');return true;}
  function recoverItem(s,h,owner){const n=NEXUS[owner.id];owner.lost=null;s.lastFind={zone:h.zone,title:'Recuperaram '+n.item,text:(h.id===owner.id?'':heroName(h.id)+' devolve '+n.item+'. ')+n.found+' Na mesa: retirem a ficha de '+h.zone+' e virem a carta para cima.'};log(s,heroName(h.id)+' recuperou '+n.item+'.');}
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Conclua a distribuição inicial de alimentos antes da primeira ação.');
    if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(!h||h.hp<=0||(h.ap<=0&&action!=='rescue'))return fail('Escolha um herói de pé com ações disponíveis.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone),visible=e=>e&&isRevealed(s,e.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada.');if(!isRevealed(s,target))return fail('Essa peça ainda não foi descoberta: investiguem as fichas de exploração para encontrar o caminho.');if(!canMove(h))return fail('Carregando uma caixa, o herói só se move uma vez por rodada.');const origin=h.zone;message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&visible(e)&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      const options=interactions(s,h),choice=target?options.find(x=>x.id===target):options.find(x=>x.available);
      if(choice?.id==='recover'&&choice.available){const owner=s.heroes.find(o=>o.lost&&o.lost.zone===h.zone);recoverItem(s,h,owner);h.ap--;h.lastAction='interact';return {ok:true,state:s,message:heroName(h.id)+' recuperou '+NEXUS[owner.id].item};}
      if(foes().length)return fail('Elimine os inimigos nesta peça antes de interagir.');
      if(!choice||!choice.available)return fail(choice?.id==='feed'?'O armazém do acampamento está vazio: não há pão para dar.':'Não há nada para resolver aqui.');
      if(choice.id==='deliver'){h.cargo=false;s.delivered++;moment(s,s.delivered===s.required?'carga':s.delivered===1?'entrega':'caixa');message='entregou uma caixa em A1 ('+s.delivered+'/'+s.required+')';}
      else if(choice.id==='pickup'){s.supplies[h.zone]--;h.cargo=true;message='carregou uma caixa de '+h.zone;}
      else if(choice.id==='install'){s.built=true;moment(s,'acampamento');message='instalou o acampamento';const king=s.heroes.find(a=>a.id==='agamemnon'&&a.hp>0&&a.zone==='A1');if(king)feat(s,'agamemnon');if(['met','waiting','escort'].includes(s.beggar.status))spy(s,'O acampamento foi erguido sem honrar o pedido do velho.');}
      else if(choice.id==='explore'){if(h.id==='odisseu')feat(s,'odisseu');if(h.zone==='P6'){s.encounter={id:'tracks',zone:'P6',hero:h.id};message='encontrou pegadas frescas na trilha';}else message=resolveToken(s,h,def);}
      else if(choice.id==='lookout'){const token=s.tokens[h.zone];token.progress=(token.progress||0)+1;
        if(token.progress<2)message='começou a escalar o posto de vigia (1/2)';
        else{token.resolved=true;addAlarm(s,1,'os troianos avistam gregos no mirante');const eligible=s.heroes.filter(a=>a.hp>0&&a.level<3).map(a=>a.id);
          if(eligible.length){moment(s,'mirante');s.encounter={id:'evolution',zone:h.zone,choices:eligible};message='conquistou o mirante troiano';}
          else{message='conquistou o mirante; todos já estão no nível máximo ('+eat(s,h,1)+')';}}}
      else if(choice.id==='castaways'){if(h.id==='menelau')feat(s,'menelau');s.castaways.progress++;if(s.castaways.progress>=2){s.castaways.status='rescued';const meal=eat(s,h,1);addFavor(s,2,'os deuses viram o resgate dos náufragos');const found=BEACHES.filter(z=>(s.supplies[z]||0)>0&&!isRevealed(s,z));for(const z of found)reveal(s,z);message='resgatou os náufragos: '+meal+'; os deuses viram (+2 de Favor)'+(found.length?'. Eles indicaram onde a carga caiu: '+found.join(', '):'');}else message='começou o resgate dos náufragos (1/2)';}
      else if(choice.id==='feed'){s.campFood--;s.foodSpent++;blessing(s,h);message='deu pão do armazém ao velho';}
      else if(choice.id==='escort'){s.beggar.status='escort';s.beggar.escort=h.id;message='passou a escoltar o velho';if(h.zone==='A1'&&!s.built)blessing(s);}
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta peça.');if(!h.used.length)return fail('As habilidades já estão prontas. Vida só se recupera com comida encontrada.');h.used=[];message='preparou suas habilidades';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta peça.');if(h.hp<2)return fail('Socorrer transfere 1 de vida: quem socorre precisa ter ao menos 2.');h.hp--;a.hp=1;a.ap=1;if(h.id==='menelau')feat(s,'menelau');message='socorreu '+heroName(a.id)+', dando-lhe 1 da sua própria força';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(c&&h.known&&!h.known.includes(n))return fail('Este herói ainda não conhece esta habilidade.');if(h.lost?.cards?.includes(n))return fail('Sem '+h.lost.item+', '+def.name+' não pode usar '+c.name+'. Recuperem-no em '+h.lost.zone+'.');if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
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
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);const steps=ally?knownDistance(s,h.zone,zone):Infinity;if(!ally||zone===h.zone||steps>c.value)return fail('Escolha um aliado nesta peça e um destino revelado a até duas áreas.');if(!canMove(ally,steps))return fail('Quem carrega caixa só se move uma área, uma vez por rodada.');ally.moves++;enter(s,ally,zone);}
      else if(c.type==='sprint'){const steps=knownDistance(s,h.zone,target);if(target===h.zone||steps>2)return fail('Destino revelado a até duas peças.');if(!canDash(h,steps))return fail('Carregando uma caixa, a Corrida cobre só uma área.');h.moves++;if(steps===2){const mid=ZONES[h.zone].links.find(z=>isRevealed(s,z)&&ZONES[z].links.includes(target));enter(s,h,mid);}enter(s,h,target);}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta peça.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');const origin=e.zone;kill(s,e,c.value);if(s.enemies.includes(e)){if(e.hold&&!e.post)e.post=origin;e.zone=zone;e.intimidated=true;reveal(s,zone,'troia');log(s,TROOPS.label(e)+' sofreu '+c.value+' de dano, recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    if(action!=='rescue')h.ap=Math.max(0,h.ap-1);log(s,def.name+' '+message+'.');defeat(s);victory(s);return {ok:true,state:s};
  }
  function invoke(state,god,target,heroId){
    const s=clone(state),fail=error=>({ok:false,error,state}),g=GODS[god];
    if(!g)return fail('Deus desconhecido.');if(s.result||s.phase!=='heroes'||s.foodSetup)return fail('Não é possível invocar agora.');if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(s.invokedRound===s.round)return fail('Os deuses já foram invocados nesta rodada.');if(s.favor<g.cost)return fail(g.name+' exige '+g.cost+' de Favor.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;let message;
    if(god==='atena'){const tk=s.tokens[target];if(!tk||tk.resolved||tk.peeked||!isRevealed(s,target))return fail('Escolha uma ficha de exploração à vista.');tk.peeked=true;s.lastFind={zone:target,title:'Olhos de Atena',text:foundPreview(s,target)};message='Atena revelou o que há em '+target;}
    else if(god==='poseidon'){addAlarm(s,-2,'o mar revolto atrasa as tropas de Troia');message='o mar de Poseidon se agitou contra Troia';}
    else{const c=s.chronicle;if(!c||c.status!=='open'||c.favored)return fail('Não há pedido da crônica em aberto.');c.favored=true;message='Zeus enviou um presságio: o pedido da crônica está cumprido';}
    s.favor-=g.cost;s.invokedRound=s.round;log(s,g.title+': '+message+' (Favor '+s.favor+'/'+FAVOR_MAX+').');defeat(s);victory(s);return {ok:true,state:s};
  }
  // Escolhas dos encontros (caixas de diálogo).
  // Depois de qualquer encontro, abre a escolha de habilidade que ficou na fila.
  function choose(state,choice){const r=chooseOne(state,choice);
    // Habilidade escolhida depois do fim da missão (feito cumprido na última ação): também segue para a campanha.
    if(r.ok&&r.state.outcome?.heroes)for(const oh of r.state.outcome.heroes){const h=r.state.heroes.find(x=>x.id===oh.id);if(h&&!h.patroclus)oh.known=[...h.known];}
    if(r.ok&&!r.state.encounter&&r.state.pendingAbility){const s=r.state,h=s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;const left=h?[0,1,2].filter(x=>!h.known.includes(x)):[];if(left.length)s.encounter={id:'ability',hero:h.id,zone:h.zone,choices:left};}return r;}
  function chooseOne(state,choice){
    const s=clone(state),fail=error=>({ok:false,error,state});if(!s.encounter)return fail('Não há encontro aberto.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;
    if(s.encounter.id==='castaways'){
      if(choice==='rescue'){s.encounter=null;log(s,'Os heróis decidem salvar os náufragos de '+s.castaways.zone+': resgatar custa 2 ações antes do Alarme '+CASTAWAY_LIMIT+'.');return {ok:true,state:s};}
      if(choice==='cargo'){s.encounter=null;s.castaways.status='abandoned';const meal=eat(s,woundedAt(s,s.castaways.zone),1);s.lastFind={zone:s.castaways.zone,title:'Só a carga',text:'Os homens puxam os fardos que boiam entre as pedras. Os gritos dos remadores somem sob as ondas, e os soldados que viram tudo não dizem nada. '+meal[0].toUpperCase()+meal.slice(1)+'.'};log(s,'A carga dos náufragos foi salva; os homens, não.');return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(s.encounter.id==='tracks'){const h=s.heroes.find(a=>a.id===s.encounter.hero),def=HEROES.find(d=>d.id===h.id);
      if(choice==='follow'){s.encounter=null;const message=resolveToken(s,h,def);log(s,def.name+' '+message+'.');return {ok:true,state:s};}
      if(choice==='erase'){s.encounter=null;s.tokens.P6.resolved=true;revealClues(s,'P6');s.lastFind={zone:'P6',title:'Rastros apagados',text:'Os homens desfazem as pegadas e espalham folhas sobre a trilha. O que quer que houvesse adiante fica para trás, mas nenhum troiano saberá que os gregos passaram por ali.'};addAlarm(s,-1,'os rastros na trilha foram apagados');return {ok:true,state:s};}
      return fail('Escolha inválida.');}
    if(s.encounter.id==='ability'){const h=s.heroes.find(a=>a.id===s.encounter.hero),n=Number(choice);if(!h||!s.encounter.choices.includes(n))return fail('Escolham uma das habilidades ainda não aprendidas.');h.known.push(n);h.known.sort();s.encounter=null;s.lastLearn={hero:h.id,kind:'ability',card:n};log(s,heroName(h.id)+' aprendeu '+HEROES.find(d=>d.id===h.id).cards[n].name+'. Virem a carta no tabuleiro do herói.');const next=s.pendingAbility&&s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;if(next){const left=[0,1,2].filter(x=>!next.known.includes(x));if(left.length)s.encounter={id:'ability',hero:next.id,zone:next.zone,choices:left};}return {ok:true,state:s};}
    if(s.encounter.id==='evolution'){const h=s.heroes.find(a=>a.id===choice&&s.encounter.choices.includes(a.id)&&a.hp>0&&a.level<3);if(!h)return fail('Escolham um herói de pé abaixo de N3.');const before=HEROES.stats(h);h.level++;const after=HEROES.stats(h);h.ap+=Math.max(0,after.actions-before.actions);s.encounter=null;s.lastLearn={hero:h.id,kind:'evolution',level:h.level};log(s,'A equipe escolheu '+heroName(h.id)+' para receber a experiência do mirante: evolução para N'+h.level+'.');return {ok:true,state:s};}
    if(s.encounter.id==='beggar'){if(choice==='accept'){if(s.campFood<1)return fail('O armazém do acampamento está vazio: não há pão para dar.');const h=s.heroes.find(a=>a.zone===s.beggar.zone&&a.hp>0);s.encounter=null;s.campFood--;s.foodSpent++;blessing(s,h);return {ok:true,state:s};}if(choice==='refuse'){s.encounter=null;addFavor(s,-1,'os heróis negaram hospitalidade');spy(s,'Os heróis mandaram o velho embora.');return {ok:true,state:s};}return fail('Escolha inválida.');}
    return fail('Encontro desconhecido.');
  }
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição inicial indisponível.');
    if(delta===1){if(!s.campFood)return fail('Não há mais alimentos para distribuir.');if(h.food>=FOOD_LIMIT)return fail('Este herói já carrega o limite de 2 comidas.');h.food++;s.campFood--;}
    else{if(!h.food)return fail('Este herói não possui comida para devolver.');h.food--;s.campFood++;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Distribuição inicial concluída. '+s.campFood+' comida(s) permaneceram no armazém.');return {ok:true,state:s};}
  // Quem atira (arqueiros) acerta o herói de pé mais próximo dentro do alcance, sem sair do lugar; de longe, o tiro tira 1 a menos.
  function rangedTarget(s,e){const r=TROOPS.types[e.type]?.range||0;if(!r)return null;return s.heroes.filter(h=>h.hp>0&&distance(e.zone,h.zone)<=r&&isRevealed(s,h.zone)).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||a.hp-b.hp)[0]||null;}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;s.chronicleResult=null;s.lastAttacks=[];s.escalation=null;s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
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
      if(lure&&lure.zone!==e.zone&&!shot){e.zone=ZONES[e.zone].links.slice().sort((a,b)=>distance(a,lure.zone)-distance(b,lure.zone))[0];reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para Agamêmnon em '+e.zone+'.');continue;}
      const guard=s.guards[e.zone]||0;
      const h=intimidated?null:shot||lure||s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const hp0=h.hp,damage=HEROES.damage(s,h,h.zone!==e.zone?Math.ceil((e.attack??2)/2):(e.attack??2),log,{distance});s.lastAttacks.push({enemy:e.id,hero:h.id,damage:hp0-h.hp,ranged:h.zone!==e.zone});log(s,heroName(h.id)+' sofreu '+damage+' de dano'+(h.zone!==e.zone?' à distância':'')+'.');if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&h.id!=='odisseu'&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2),ehp=e.hp;kill(s,e,rebound);{const hit=s.lastAttacks[s.lastAttacks.length-1];if(hit&&hit.enemy===e.id){hit.rebound=Math.max(0,ehp-Math.max(0,e.hp));hit.killed=!s.enemies.includes(e);}}log(s,'Rebote grego corpo a corpo: '+rebound+' de dano em '+TROOPS.label(e)+'.');if(!s.enemies.includes(e)&&h.id==='aquiles')feat(s,'aquiles');}if(h.hp>0&&h.id==='ajax')feat(s,'ajax');if(!h.hp){h.ap=0;dropCargo(s,h);}}
      else if(e.relief){e.zone=reliefStep(e);reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' desceu para '+e.zone+' para render a vigia.');if(e.zone==='A1')reliefArrives(s,e);}
      else if(e.zone==='A1'&&s.post.status!=='taken'){}
      else if(e.zone==='A1'){if(guard){s.guards.A1--;log(s,'A proteção absorveu o ataque ao acampamento.');}else{s.campDamage++;const burn=s.delivered-s.burned>0;if(burn)s.burned++;log(s,'Ataque ao acampamento: '+s.campDamage+'/3 danos'+(burn?', e uma caixa foi queimada':'')+'.');}}
      else{e.zone=nextStep(e.zone,huntGoal(s,e));reveal(s,e.zone,'troia');log(s,TROOPS.label(e)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    victory(s);if(s.result)return s;
    resolveChronicle(s);if(s.result)return s;
    s.round++;s.combatZones=[];s.heroes.forEach(h=>{h.ap=h.hp>0?HEROES.stats(h).actions:0;h.bonusActions=0;h.tauntRound=0;h.moves=0;});
    addAlarm(s,1,'o tempo passa e Troia percebe o desembarque');
    const spotters=s.enemies.filter(e=>e.type==='explorador'&&!e.watch&&s.heroes.some(h=>h.hp>0&&distance(e.zone,h.zone)<=1));if(spotters.length)addAlarm(s,1,spotters.length>1?'batedores avistaram os heróis e correram para relatar':'um batedor avistou os heróis e correu para relatar');
    startChronicle(s);
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max,zones=Object.keys(ZONES);
    if(!s||s.version!==VERSION||s.mission!=='desembarque'||!['A','B'].includes(s.route)||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(s.playerNames!==undefined&&(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players||s.playerNames.some(n=>typeof n!=='string'||!n.trim()||n.length>30)))return false;
    if(!Array.isArray(s.revealed)||!s.revealed.includes('N1')||new Set(s.revealed).size!==s.revealed.length||s.revealed.some(z=>!ZONES[z])||!Array.isArray(s.lastReveals)||!Array.isArray(s.visited)||s.visited.some(z=>!s.revealed.includes(z))||!Array.isArray(s.combatZones)||typeof s.shipNoise!=='boolean')return false;
    if(!integer(s.alarm,0,alarmMax(s))||!Array.isArray(s.alarmFired)||s.alarmFired.some(n=>!ALARM_STEPS[n]))return false;
    if(!s.heroes.some(h=>h.id==='odisseu')||!s.heroes.some(h=>h.id==='agamemnon')||new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&s.revealed.includes(h.zone)&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&integer(h.moves,0,10)&&Array.isArray(h.known)&&h.known.length>=1&&new Set(h.known).size===h.known.length&&h.known.every(n=>integer(n,0,2))))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,99)||!integer(s.foodSpent,0,99)||s.heroes.some(h=>!integer(h.food,0,FOOD_LIMIT))||s.foodSetup&&s.foodSpent!==0)return false;
    if(s.required!==s.heroes.length||!integer(s.delivered,0,s.required)||!integer(s.campDamage,0,3)||typeof s.built!=='boolean'||(s.built&&s.delivered!==s.required)||!integer(s.burned,0,s.delivered)||typeof s.eneiasDown!=='boolean'||!integer(s.retreated,0,99)||!s.supplies||Object.entries(s.supplies).some(([id,n])=>!BEACHES.includes(id)&&!s.revealed.includes(id)||!ZONES[id]||!integer(n,0,s.required)))return false;
    if(s.delivered+s.heroes.filter(h=>h.cargo).length+Object.values(s.supplies).reduce((n,x)=>n+x,0)!==s.required)return false;
    if(!s.tokens||Object.keys(s.tokens).sort().join()!==Object.keys(TOKENS).sort().join()||Object.values(s.tokens).some(t=>typeof t.resolved!=='boolean'||typeof t.peeked!=='boolean'||(t.progress!==undefined&&!integer(t.progress,0,2))))return false;
    if(!Array.isArray(s.scrolls)||!integer(s.favor,0,FAVOR_MAX)||!integer(s.invokedRound,0,s.round))return false;
    if(!s.castaways||s.castaways.zone!==CASTAWAYS[s.route]||!['unseen','met','rescued','lost','abandoned'].includes(s.castaways.status)||!integer(s.castaways.progress,0,2))return false;
    if(!s.post||!['hidden','found','taken'].includes(s.post.status)||s.post.status!=='hidden'&&!isRevealed(s,'A1'))return false;
    if(!s.beggar||!['unseen','met','waiting','escort','zeus','spy'].includes(s.beggar.status)||!ZONES[s.beggar.zone]||(s.beggar.status==='escort')!==!!s.beggar.escort||(s.beggar.escort&&!s.heroes.some(h=>h.id===s.beggar.escort)))return false;
    if(!s.personal||Object.keys(s.personal).sort().join()!==s.heroes.map(h=>h.id).sort().join()||Object.entries(s.personal).some(([id,p])=>typeof p.done!=='boolean'||!integer(p.progress,0,PERSONAL[id].goal)||p.done!==(p.progress>=PERSONAL[id].goal))||!Array.isArray(s.lastFeats))return false;
    if(!Array.isArray(s.moments)||!Array.isArray(s.chronicleQueue)||s.chronicleQueue.some(id=>!CHRONICLE[id])||!Array.isArray(s.told)||s.told.some(id=>!CHRONICLE[id]))return false;
    if(s.chronicle!==null&&(!s.chronicle||!CHRONICLE[s.chronicle.id]||!['open','told','success','fail'].includes(s.chronicle.status)))return false;
    if(s.encounter!==null&&(!s.encounter||(s.encounter.id==='evolution'&&!Array.isArray(s.encounter.choices))||!['castaways','beggar','evolution','ability','tracks'].includes(s.encounter.id)))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&(e.type===undefined||TROOPS.types[e.type])&&integer(e.hp,1,e.type?TROOPS.types[e.type].hp:3)&&(e.armor===undefined||integer(e.armor,0,100))&&(e.attack===undefined||integer(e.attack,0,100))&&(e.stunned===undefined||typeof e.stunned==='boolean')&&(e.intimidated===undefined||typeof e.intimidated==='boolean'))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(!s.built||s.campDamage>=3||s.outcome?.completed!=='desembarque'||s.outcome.supplies!==s.delivered-s.burned||s.outcome.horseMaterials!==0))return false;
    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string'&&zones.length>0;
  }
  return {VERSION,MAX_ROUNDS,huntGoal,alarmMax,ALARM_MAX,CASTAWAY_LIMIT,PERSONAL,CHRONICLE,GODS,FAVOR_MAX,invoke,tokenOf,CLUES,RELIEF_PATH,ALARM_STEPS,FOOD_LIMIT,HEROES,TROOPS,LAYOUT,TERRAINS,ZONES,TOKENS,REVEAL_TEXT,BEACHES,newGame,distance,knownDistance,isRevealed,intent,waves,nextAlarm,interaction,interactions,tokenDetail,act,choose,allocateFood,finishFoodSetup,trojanTurn,validSave};
});
