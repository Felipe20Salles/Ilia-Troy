(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));
  else root.TroyNight=factory(root.TroyHeroes,root.TroyTroops);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  // Missão 7 — A noite do cavalo (08/10/2026). Dois mapas com o mesmo Alarme (CAMPANHA.md):
  // dentro de Troia, só Odisseu sai do cavalo e abre o portão; fora, a frota volta de Tênedos em silêncio.
  // Vitória: portão aberto e um herói da frota de pé no portão (M1), sem inimigos. Em 18, Troia acorda. Não há limite de rodadas.
  // Decisões do usuário: só Odisseu entra no cavalo; cada corniso cortado no bosque de Apolo começa a noite com Alarme +2;
  // se Odisseu confiou em Helena, ela abre uma porta (a do Santuário, 12, que dá para fora junto à torre M2).
  // Sem limite de rodadas (10/10/2026): a noite só acaba quando Troia queima ou os gregos caem.
  const VERSION=1,MAX_ROUNDS=Infinity,FOOD_LIMIT=2,ALARM_MAX=18,MISSION='noite',INSIDE_ACTIONS=2;
  const TERRAINS={C:{art:'colina',name:'Colina'},P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'},M:{art:'portoes',name:'Muralha'}};
  const NAMES={A1:'Acampamento queimado',A2:'O canteiro vazio',C1:'Santuário de Apolo',P3:'Campo aberto',P7:'Trilha dos pinheiros',P4:'Diante das muralhas',B5:'Bosque dos pastores',M4:'Torre de vigia',M1:'Portão de Troia',
    M3:'Bosque sagrado de Apolo',M5:'Torre do leste',M2:'Torre do canto',B3:'Bosque fechado',B1:'Pinheiral',B4:'Carvalhos do Ida',P5:'Várzea',B2:'Bosque da enseada',N5:'Enseada escondida',
    '01':'Palácio','02':'Quartel','03':'Residências Nobres','04':'Templo','05':'Praça Central','06':'Anfiteatro','07':'Mercado','08':'Banhos Públicos','09':'Oficinas','10':'Bairro Popular · o portão','11':'Biblioteca','12':'Santuário','05A':'Aliados (oeste)','05B':'Aliados (leste)'};
  // Fora: o tabuleiro inteiro, sem N1 (a frota está diante do portão, M1). Dentro: a cidade. Os dois só se ligam pelo portão aberto.
  const OUTSIDE={A1:['A2','P1'],A2:['A1','P1','P6','C2','P2','N2'],P1:['A1','A2','P6','P3'],P6:['A2','P1','P3','P7','C2'],C2:['A2','P6','P7','P4','P2'],P2:['A2','C2','C1','P5','N2','N3','N4'],C1:['P2','B1','P5'],
    P5:['P2','C1','B1','B2'],B1:['C1','P5','B4','B3','B5'],B2:['P5','B4','N5'],B4:['B2','B1','B3'],B3:['B4','B1','B5','M5','M2'],B5:['M1','B1','B3','P4','M5'],P4:['C2','B5','P7','M1'],P7:['P6','C2','P4','P3','M4','M1'],
    P3:['P1','P6','P7','M3','M4'],M3:['P3','M4'],M4:['M3','P3','P7','M1'],M1:['B5','M4','P7','P4','M5'],M5:['M1','B5','B3','M2'],M2:['M5','B3'],N2:['A2','P2','N3'],N3:['N2','P2','N4'],N4:['N3','P2','N5'],N5:['N4','B2']};
  const CITY_LINKS={'01':['02','03','05','04'],'02':['01','04'],'03':['01','06','05'],'04':['02','05','07','01'],'05':['01','04','06','07','05A','05B'],'06':['03','05','08','05B'],'07':['04','05','05A','09','10'],'05A':['05','07','05B','10'],'05B':['05','05A','08','11'],'08':['06','05B','11','12'],'09':['07','10'],'10':['09','07','05A','11'],'11':['10','05B','08','12'],'12':['11','08']};
  const CITY=Object.keys(CITY_LINKS),HORSE='04',PALACE='01',GATE='10',POSTERN='12',OUT_GATE='M1',OUT_POSTERN='M2',FIRES=5;
  const ZONES={};
  for(const [id,links] of Object.entries({...OUTSIDE,...CITY_LINKS}))ZONES[id]={name:id+' · '+(NAMES[id]||TERRAINS[id[0]]?.name||id),terrain:CITY.includes(id)?'cidade':id[0],art:CITY.includes(id)?'cidade':TERRAINS[id[0]].art,links:[...links],city:CITY.includes(id)};
  for(const [id,z] of Object.entries(ZONES))for(const n of z.links)if(!ZONES[n].links.includes(id))ZONES[n].links.push(id);
  const BASE=Object.keys(OUTSIDE),WALLS=['P3','P7','P4','M4','M1','M3','M5','M2'];
  // Rondas da noite: cada vigia anda uma peça por fase de Troia (duas, depois que a cidade se alarma).
  const PATROLS={oeste:['02','04','07','09','10','05A','05','01'],leste:['03','06','08','12','11','05B','05','01'],praca:['05','07','05A','05B','08','06'],mercado:['07','09','10','05A']};
  // As torres veem as peças à volta enquanto o arqueiro do posto estiver vivo; sentinelas veem as peças vizinhas.
  const TOWERS={M4:{name:'Torre de vigia',sees:['P3','P7','M3','M1']},M5:{name:'Torre do leste',sees:['B5','P4','B3','M1']},M2:{name:'Torre do canto',sees:['B3','B4','M5']}};
  const FAVOR_MAX=6;
  const GODS={
    atena:{name:'Atena',cost:2,title:'Névoa de Atena',text:'Com o Paládio fora de Troia, Atena cobre os gregos de névoa. O Alarme cai 2.'},
    poseidon:{name:'Poseidon',cost:1,title:'Vento de Poseidon',text:'O herói escolhido ganha 1 ação nesta rodada (Odisseu, na cidade, a qualquer hora; a frota, depois que a cidade abrir).'},
    zeus:{name:'Zeus',cost:2,title:'Raio de Zeus',text:'Com a cidade aberta, um raio incendeia uma peça (menos o palácio), mesmo com troianos nela.'}
  };
  // Patamares do Alarme (os dois mapas). Em 15 sai Páris (se vivo) com o arco guiado por Apolo; em 18, Troia acorda.
  const ALARM_STEPS={4:[['05','vigia','praca']],7:[['02','vigia','oeste']],11:[],15:[],18:[]};
  function alarmEntries(s,step){if(step===18)return [];if(step===15)return s.paris&&!s.parisOut?[['01','paris','hunt']]:[['02','guarda','hunt'],['02','guarda','hunt']];return [...ALARM_STEPS[step],...(s.heroes.length>=4&&step===7?[['07','vigia','mercado']]:[])];}
  const PERSONAL={
    odisseu:{name:'O cavalo de Ítaca',goal:1,text:'Abra o portão de Troia por dentro.',reward:'Glória: a ideia e a noite foram dele.'},
    agamemnon:{name:'O rei incendeia Troia',goal:1,text:'Incendeie uma peça da cidade.',reward:'Glória: o rei de Micenas pôs fogo em Troia.'},
    aquiles:{name:'Antes da profecia',goal:2,text:'Derrote 2 tropas troianas.',reward:'Glória: a última glória de Aquiles.'},
    menelau:{name:'Por Helena',goal:1,text:'Entre na cidade pelo portão.',reward:'Glória: Menelau entra em Troia atrás de Helena.'},
    ajax:{name:'O escudo diante do portão',goal:2,text:'Resista de pé a 2 ataques.',reward:'Glória: o escudo de Ájax cobriu a frota.'}
  };
  const CHRONICLE={
    1:{id:'festa',effect:'Os vigias da cidade estão bêbados: não se movem nesta fase de Troia.',title:'A festa',text:'Troia arrastou o cavalo até o palácio e bebe à paz. Dentro do cavalo, no escuro, Odisseu espera a cidade dormir.'},
    2:{id:'laocoonte',effect:'Se Odisseu sabe quem vai desconfiar, Sínon tem a resposta pronta e nada acontece. Se não, o Alarme sobe 2.',title:'Laocoonte',text:'Laocoonte acorda a vizinhança: jura que ouviu bronze dentro do cavalo. Sínon chora e repete a sua mentira.'},
    3:{id:'sinal',effect:'+1 de Favor.',title:'O sinal de Sínon',text:'Do alto da muralha, Sínon acende a tocha. Diante do portão, a frota sabe que Odisseu saiu do cavalo.'},
    5:{id:'cassandra',effect:'Se Odisseu sabe quem vai desconfiar, ninguém escuta Cassandra. Se não, o Alarme sobe 2.',title:'Cassandra',text:'Cassandra corre pela praça gritando que a cidade vai queimar.'},
  };

  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  const isCity=zone=>CITY.includes(zone);
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function isRevealed(s,zone){return s.revealed.includes(zone);}
  function reveal(s,zone){if(!ZONES[zone]||isRevealed(s,zone))return false;s.revealed.push(zone);s.lastReveals.push(zone);return true;}
  // Na cidade, Troia corre para a rua sem vestir a armadura: 1 de vida e 1 de armadura a menos.
  function unarmored(e){e.hp=Math.max(1,e.hp-1);e.maxHp=e.hp;if(e.armor>0)e.armor--;e.unarmored=true;return e;}
  // A ordem dos reforços depois que a cidade abre: dois batedores, um arqueiro, um guarda, um lanceiro, e de novo.
  const WAVE=['explorador','explorador','arqueiro','guarda','lanceiro'];
  function nextTroop(s){const type=WAVE[(s.wave||0)%WAVE.length];s.wave=(s.wave||0)+1;return type;}
  function spawn(s,zone,type,patrol){const e=TROOPS.create('e'+s.nextEnemy++,zone,type);if(isCity(zone))unarmored(e);if(patrol==='hunt')e.hunt=true;else if(patrol){e.patrol=patrol;e.step=Math.max(0,PATROLS[patrol].indexOf(zone));}s.enemies.push(e);reveal(s,zone);return e;}
  function startingAbilities(id,options){const known=options.known?.[id];if(Array.isArray(known)&&known.length&&known.every(n=>Number.isInteger(n)&&n>=0&&n<=2))return [...new Set(known)].sort();if(!options.abilities)return [0,1,2];const n=options.abilities[id];if(!Number.isInteger(n)||n<0||n>2)throw Error('Escolham a habilidade inicial de cada herói.');return [n];}
  // Ligações que dependem da noite: o portão aberto liga 10 a M1; a porta de Helena liga 12 a M2.
  function links(s,zone){const l=[...ZONES[zone].links];if(s.gateOpen){if(zone===GATE)l.push(OUT_GATE);if(zone===OUT_GATE)l.push(GATE);}if(s.posternOpen){if(zone===POSTERN)l.push(OUT_POSTERN);if(zone===OUT_POSTERN)l.push(POSTERN);}return l;}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['odisseu','agamemnon','aquiles'],owners=options.owners??ids.map((_,i)=>i%players+1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    const camp=options.campaign===true,validTeam=camp?(Number.isInteger(players)&&players>=1&&players<=5&&ids.length>=2&&ids.length<=5&&new Set(ids).size===ids.length&&ids.every(id=>HEROES.some(h=>h.id===id))&&owners.length===ids.length&&owners.every(n=>Number.isInteger(n)&&n>=1&&n<=players)&&new Set(owners).size===players):!(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||!ids.includes('odisseu')||!ids.includes('agamemnon')||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players);
    if(!validTeam)throw Error(camp?'A noite do cavalo pede ao menos dois heróis: um no cavalo e um na frota.':'Odisseu e Agamêmnon são obrigatórios. Complete a equipe e atribua ao menos um herói a cada jogador.');
    const legacy=options.legacy||{},insider=ids.includes('odisseu')?'odisseu':ids[0];
    const heroes=ids.map((id,i)=>{const h={...HEROES.create(id,options.levels?.[id]??1),owner:owners[i],zone:id===insider?HORSE:OUT_GATE,cargo:false,food:0,moves:0,known:startingAbilities(id,options)};const life=options.life?.[id];if(Number.isInteger(life))h.hp=Math.max(0,Math.min(HEROES.stats(h).maxHp,life));
      if(id===insider){h.hp=Math.max(1,h.hp);h.inside=true;h.ap=INSIDE_ACTIONS;h.bonusActions=Math.max(0,INSIDE_ACTIONS-HEROES.stats(h).actions);}else h.ap=0;if(!h.hp)h.ap=0;h.startHp=h.hp;return h;});
    const discoveries=Array.isArray(options.discoveries)?options.discoveries:Array.isArray(legacy.discoveries)?legacy.discoveries:['forma'];
    const store=Math.max(0,Math.min(99,Number.isInteger(options.campFood)?options.campFood:0));
    const s={version:VERSION,mission:MISSION,commanders:{...(options.commanders||{})},campaign:camp,players,playerNames,round:1,phase:'heroes',result:null,reason:'',campFood:store,foodSetup:store>0&&heroes.some(h=>h.hp<HEROES.stats(h).maxHp),
      scrolls:[...new Set(options.scrolls||[])],legacy,insider,
      paladio:options.paladio??(legacy.paladio!==false),desconfia:options.desconfia??(legacy.laocoonte===true||discoveries.includes('desconfia')),helen:options.helen??(legacy.helen==='ally'),
      cornel:Number.isInteger(options.cornel)?options.cornel:(legacy.apolloPrice||0),heitor:options.heitor??(legacy.heitor==='escaped'),paris:options.paris??(options.commanders?.paris!=='dead'),
      gateOpen:false,gateProgress:0,burned:[],posternOpen:false,posternProgress:0,alert:false,noise:false,drunk:0,calm:0,glory:[],
      revealed:[...BASE,...CITY],tokens:{},supplies:{},lastReveals:[],visited:[],alarm:0,alarmFired:[],
      favor:Math.max(0,Math.min(FAVOR_MAX,Number.isInteger(options.favor)?options.favor:1)),invokedRound:0,
      encounter:null,personal:Object.fromEntries(ids.map(id=>[id,{progress:0,done:false}])),lastFeats:[],chronicle:null,
      guards:{},nextEnemy:1,heroes,enemies:[],log:[],outcome:null};
    // Dentro: os dois guardas do portão (só saem do posto se forem silenciados) e as rondas da noite.
    const post=(zone,type)=>{const e=TROOPS.create('e'+s.nextEnemy++,zone,type);e.hold=true;s.enemies.push(e);return e;};
    spawn(s,'07','vigia','oeste');spawn(s,'08','vigia','leste');spawn(s,'05','vigia','praca');
    // Fora não há ninguém (09/10/2026): Troia acredita que os gregos foram embora. A planície só se enche se a cidade acordar.
    log(s,heroName(insider)+' espera dentro do cavalo, no templo de Atena. A frota espera em silêncio diante do portão (M1).');
    if(s.cornel)addAlarm(s,2*s.cornel,'Apolo viu o corniso do bosque dele cortado: os olhos de Troia estão abertos');
    if(!s.paladio)addAlarm(s,3,'sem o Paládio roubado, Atena ainda vela pela cidade (e abrir o portão custa 3 ações)');
    startChronicle(s);
    return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function knownDistance(s,from,to){const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of links(s,at))if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone,goal){return ZONES[zone].links.slice().sort((a,b)=>distance(a,goal)-distance(b,goal))[0];}
  const gateCost=s=>s.paladio?2:3;
  const fleet=s=>s.heroes.filter(h=>!h.inside);
  const ashore=s=>fleet(s);
  const insiderHero=s=>s.heroes.find(h=>h.inside);
  function huntGoal(s,e){const prey=s.heroes.filter(h=>h.hp>0&&!isCity(h.zone)&&distance(e.zone,h.zone)<Infinity).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone))[0];return prey?prey.zone:OUT_GATE;}
  function intimidationZone(s,e){return ZONES[e.zone].links.slice().sort((a,b)=>Number(s.heroes.some(h=>h.hp>0&&h.zone===a))-Number(s.heroes.some(h=>h.hp>0&&h.zone===b))||distance(a,'M1')-distance(b,'M1'))[0];}
  function alarmMax(){return ALARM_MAX;}
  function nextAlarm(s){const steps=Object.keys(ALARM_STEPS).map(Number).filter(n=>!s.alarmFired.includes(n)).sort((a,b)=>a-b);if(!steps.length)return {at:ALARM_MAX,entries:[]};const at=steps[0];return {at,entries:alarmEntries(s,at)};}
  function waves(s){return nextAlarm(s).entries.map(([zone])=>zone);}
  // À noite, os arqueiros das torres vigiam sem atirar (atirar acordaria a cidade); atiram depois que a cidade se agita (Alarme 11).
  function rangedTarget(s,e){const r=TROOPS.types[e.type]?.range||0;if(!r||(e.hold&&!s.alert))return null;return s.heroes.filter(h=>h.hp>0&&distance(e.zone,h.zone)<=r).sort((a,b)=>distance(e.zone,a.zone)-distance(e.zone,b.zone)||a.hp-b.hp)[0]||null;}
  function patrolNext(s,e){const r=PATROLS[e.patrol];e.step=(e.step+1)%r.length;return r[e.step];}
  function intent(e,s){if(e.stunned)return 'Atordoado: perderá esta ativação';{const shot=rangedTarget(s,e);if(shot&&!e.intimidated)return 'Atirar em '+heroName(shot.id)+(shot.zone!==e.zone?' em '+shot.zone:'');}
    const here=s.heroes.some(h=>h.hp>0&&h.zone===e.zone);if(here)return isCity(e.zone)?'Gritar e atacar o grego':'Atacar um herói aqui';
    if(e.sentry)return 'Vigiar a planície: vê quem chegar ao lado';if(e.hold)return e.type==='guarda'?'Guardar o portão por dentro':'Vigiar do alto da torre';
    if(e.patrol)return 'Ronda: '+PATROLS[e.patrol][(e.step+1)%PATROLS[e.patrol].length];if(e.hunt)return 'Caçar '+heroName(s.insider)+' na cidade';
    const goal=huntGoal(s,e);return goal===e.zone?'Esperar':'Avançar para '+ZONES[nextStep(e.zone,goal)].name;}
  function finish(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;if(s.encounter?.id!=='ability')s.encounter=null;
    if(result==='victory')s.outcome={completed:MISSION,favor:s.favor,next:'Epílogo',campFood:s.campFood,revealedZones:[],scrolls:[...s.scrolls],commanders:s.heitorDead?{heitor:'dead'}:{},glory:[...s.glory],
      legacy:{troyFallen:true,burned:[...s.burned],gate:s.gateOpen?'gate':'postern',heitorSlayer:s.heitorSlayer||null},heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]}))};
    log(s,reason);}
  function defeat(s){if(s.result)return;const o=insiderHero(s),open=s.gateOpen||s.posternOpen;
    // Com o portão aberto, Troia acorda tarde demais: o Alarme cheio só manda o quartel inteiro para a rua.
    if(s.alarm>=ALARM_MAX&&!open)finish(s,'defeat','Troia acordou. Os sinos tocam, o portão fica trancado, e o cavalo vira uma armadilha para quem está nele.');
    else if(o&&!o.hp&&!open)finish(s,'defeat',heroName(o.id)+' caiu dentro da cidade. Sem ninguém para abrir o portão, a frota espera a aurora em vão.');
    else if(s.heroes.every(h=>!h.hp))finish(s,'defeat','Todos os gregos caíram dentro de Troia.');}
  // Vitória: com o portão aberto, os gregos incendeiam 3 peças da cidade.
  function victory(s){if(s.result||s.burned.length<FIRES)return;
    const dead=s.heroes.filter(h=>!h.hp).map(h=>heroName(h.id));finish(s,'victory','Troia queima. O fogo corre de '+s.burned.map(z=>NAMES[z]).join(', ').replace(/, ([^,]*)$/,' a $1')+', e a cidade que resistiu dez anos cai numa noite.'+(dead.length?' '+dead.join(' e ')+(dead.length>1?' não viram':' não viu')+' o fim.':''));}
  function addAlarm(s,amount,reason){
    if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(ALARM_MAX,s.alarm+amount));if(s.alarm===before)return;
    log(s,'Alarme de Troia '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+ALARM_MAX+'): '+reason+'.');
    for(const step of Object.keys(ALARM_STEPS).map(Number).sort((a,b)=>a-b)){
      if(s.alarm<step||s.alarmFired.includes(step))continue;s.alarmFired.push(step);
      if(step===18&&(s.gateOpen||s.posternOpen)){for(let i=0;i<Math.max(1,s.heroes.length-2);i++)spawn(s,'02','guarda','hunt');log(s,'Troia acorda tarde demais: os sinos tocam e a cidade corre para o portão.');continue;}
      if(step===11){s.alert=true;log(s,'A cidade se agita: as rondas andam duas peças por fase de Troia.');}
      const entries=alarmEntries(s,step);for(const [zone,type,patrol] of entries)spawn(s,zone,type,patrol);
      if(entries.length)log(s,(step===15&&s.paris?'Páris sai do palácio com o arco de Apolo. ':'')+'Troia reage ao alarme '+step+': '+entries.map(([zone,type])=>TROOPS.types[type].short+' em '+zone).join(', ')+'.');
    }
    defeat(s);
  }
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  // Feito da noite: +1 de Favor e Glória para o epílogo. Ainda ensina a habilidade que faltar.
  function feat(s,id,amount=1){
    const p=s.personal?.[id],def=PERSONAL[id],h=s.heroes.find(x=>x.id===id);if(!p||p.done||!def||!h||s.result)return;
    p.progress=Math.min(def.goal,p.progress+amount);if(p.progress<def.goal)return;p.done=true;s.lastFeats.push(id);if(!s.glory.includes(id))s.glory.push(id);addFavor(s,1,'o feito de '+heroName(id));const options=[0,1,2].filter(n=>!h.known.includes(n));if(options.length&&!s.encounter)s.encounter={id:'ability',hero:id,zone:h.zone,choices:options};else if(options.length)s.pendingAbility=id;
    // Sem habilidade nova para aprender (10/10/2026), o feito rende o Favor de sempre e 1 comida no armazém.
    else{s.campFood++;(s.featNote??={})[id]='Todas as habilidades já foram aprendidas: +1 de Favor e +1 comida no armazém.';log(s,heroName(id)+' já conhece todas as habilidades: +1 comida no armazém.');}
    log(s,'Feito de '+heroName(id)+': '+def.name+'. '+def.reward);
  }
  const towerWatching=s=>Object.entries(TOWERS).filter(([z])=>s.enemies.some(e=>e.zone===z&&e.hold&&e.type==='arqueiro'));
  const watchedZone=(s,z)=>towerWatching(s).some(([,t])=>t.sees.includes(z));
  const CHRONICLE_CHECKS={
    lua:{check:s=>!fleet(s).some(h=>h.hp>0&&watchedZone(s,h.zone)),success:s=>log(s,'Crônica: a lua não achou ninguém na planície.'),fail:s=>addAlarm(s,2,'a lua mostrou gregos na planície')}
  };
  const ESCALATION={lua:['M4','explorador','Uma torre manda batedores à planície']};
  function resolveChronicle(s){const c=s.chronicle;if(!c||c.status!=='open'||s.result)return;const rule=CHRONICLE_CHECKS[c.id];const ok=c.favored||rule.check(s);c.status=ok?'success':'fail';s.chronicleResult={id:c.id,status:c.status};(ok?rule.success:rule.fail)(s);if(!ok&&!s.result)escalate(s,c.id);}
  function escalate(s,id){const e=ESCALATION[id];if(!e)return;const n=s.heroes.length>=5?2:1;for(let i=0;i<n;i++)spawn(s,e[0],e[1]);s.escalation=e[2];log(s,'Crônica: '+e[2]+'.');}
  function chronicleEffect(s,id){if(s.result)return;const say=t=>log(s,'Crônica: '+t);
    if(id==='festa'){s.drunk=s.round;say('os vigias bebem e não fazem a ronda.');}
    else if(id==='laocoonte'||id==='cassandra'){if(s.desconfia)say('Sínon já tinha a resposta: ninguém escuta.');else addAlarm(s,3,id==='laocoonte'?'Laocoonte fez Troia duvidar do cavalo':'alguns escutaram Cassandra');}
    else if(id==='sinal')addFavor(s,1,'o sinal de Sínon');
    else if(id==='caes')spawn(s,'07','vigia','mercado');

    else if(id==='aurora')addAlarm(s,1,'o céu clareia');
  }
  function startChronicle(s){const entry=CHRONICLE[s.round];if(!entry||s.result){s.chronicle=null;return;}s.chronicle={round:s.round,id:entry.id,status:CHRONICLE_CHECKS[entry.id]?'open':'told'};if(s.chronicle.status==='told')chronicleEffect(s,entry.id);log(s,'Crônica da rodada '+s.round+': '+entry.title+'.');}
  function enter(s,h,zone){h.zone=zone;if(!s.visited.includes(zone))s.visited.push(zone);if(!h.inside&&isCity(zone))feat(s,'menelau');}
  function kill(s,e,damage,ignoreArmor=0,by){const armor=ignoreArmor===true?0:Math.max(0,(e.armor||0)-ignoreArmor);e.hp-=Math.max(0,damage-armor);
    if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,TROOPS.label(e)+' derrotado em '+e.zone+'.');
      if(e.type==='heitor'){s.heitorDead=true;s.heitorSlayer=by||null;s.lastFind={zone:e.zone,title:'Heitor cai diante do portão',text:'Heitor, que escapou uma vez, defende o portão até o fim. Cai na soleira da própria cidade.'+(by?' Foi '+heroName(by)+'.':'')};}}}
  function strike(s,h,e,amount,options={}){
    if(!isCity(h.zone))s.noise=true;
    if(options.precision)e.hp=1;else kill(s,e,amount,options.piercing||h.id==='odisseu',h.id);
    if(!s.enemies.includes(e)&&h.id==='aquiles')feat(s,'aquiles');
    if(e.hp>0&&options.breakArmor)e.armor=0;
    if(e.hp>0&&options.stun)e.stunned=true;
    if(s.enemies.includes(e)&&!e.stunned&&!options.ranged&&!(TROOPS.types[e.type]?.range>0)){const damage=HEROES.damage(s,h,Math.floor((e.attack??2)/2),log,{ignoreGuard:true,distance});log(s,'Rebote de '+TROOPS.label(e)+': '+damage+' de dano.');}
  }
  function canMove(){return true;}
  function moveHero(s,h,target){
    const attacker=s.enemies.filter(e=>e.zone===h.zone&&!e.stunned&&!e.hold).sort((a,b)=>(a.attack??2)-(b.attack??2)||a.hp-b.hp)[0];
    if(attacker){const origin=h.zone,amount=Math.floor((attacker.attack??2)/2),damage=HEROES.damage(s,h,amount,log,{ignoreArmor:true,distance});log(s,'Golpe de fuga em '+origin+': '+TROOPS.label(attacker)+' causou '+damage+' de dano em '+heroName(h.id)+'.');if(!h.hp)return false;}
    h.moves++;enter(s,h,target);return true;
  }
  // Dentro da cidade não há arco nem espada à vista: Odisseu silencia, um por um, com 1 ação cada (Alarme +1).
  function interactions(s,h){
    const list=[],foes=s.enemies.some(e=>e.zone===h.zone),add=(id,label,detail,available=true,fight=false)=>list.push({id,label,detail,available:available&&(fight||!foes)});
    if(isCity(h.zone)){
      if(h.zone===GATE&&!s.gateOpen)add('gate','Abrir o portão ('+s.gateProgress+'/'+gateCost(s)+')',s.paladio?'2 ações no total, sem inimigos na peça':'Sem o Paládio, Atena guarda a tranca: 3 ações no total');
      if((s.gateOpen||s.posternOpen)&&!s.burned.includes(h.zone)){const last=h.zone===PALACE,ready=last?s.burned.length>=FIRES-1:s.burned.length<FIRES-1;add('burn','Incendiar: '+NAMES[h.zone]+' ('+s.burned.length+'/'+FIRES+')',ready?'1 ação, sem troianos na peça':last?'O palácio de Príamo é o último a queimar: antes, '+(FIRES-1)+' peças da cidade':'Já são '+(FIRES-1)+' peças em chamas: agora só falta o palácio (01)',ready);}
    }
    return list;
  }
  function interaction(s,h){const list=interactions(s,h);return list.find(x=>x.available)||list[0]||{id:null,label:'Explorar',detail:'Nada para resolver aqui',available:false};}
  function tokenDetail(){return '';}
  function fleetWakes(s){for(const h of s.heroes)if(!h.inside&&h.hp>0&&!h.awake){h.awake=true;h.ap=HEROES.stats(h).actions;}}
  // O despertar de Troia: o quartel e os heróis troianos que sobreviveram à guerra saem para a rua.
  function trojansWake(s){const c=s.commanders||{},woke=[];
    if(s.paris&&!s.parisOut){s.parisOut=true;const p=spawn(s,PALACE,'paris','hunt');p.focus='aquiles';woke.push('Páris no Palácio (01)');}
    if(c.eneias!=='dead'){spawn(s,'05','eneias','hunt');woke.push('Enéias na Praça (05)');}
    return woke;}
  function openGate(s,h){s.gateOpen=true;s.openedRound=s.round;fleetWakes(s);feat(s,h.id==='odisseu'?'odisseu':h.id);addAlarm(s,3,'o portão range nas dobradiças');
    if(s.result)return;
    // O quartel acorda e caça os gregos; com Heitor vivo, ele corre para defender a entrada da cidade.
    spawn(s,'02',nextTroop(s),'hunt');
    if(s.heitor&&!s.heitorDead){spawn(s,GATE,'heitor');s.lastFind={zone:GATE,title:'Heitor no portão',text:'O portão se abre, e no Bairro Popular aparece Heitor, de lança na mão. Ele escapou uma vez. Agora defende a entrada da cidade. Na mesa: coloquem Heitor em 10.'};}
    else s.lastFind={zone:GATE,title:'O portão aberto',text:'As trancas caem uma por uma. O grande portão de Troia se abre para a planície escura, e a frota entra em silêncio. No quartel, alguém ouviu.'};
    const woke=trojansWake(s);if(woke.length)s.lastFind.text+=' Troia acorda: '+woke.join(', ')+'.'+(s.parisOut&&s.heroes.some(x=>x.id==='aquiles')?' Páris procura um só homem na noite: Aquiles.':'');
    s.lastFind.text+=' Na mesa: coloquem 2 guardas no Quartel (02)'+(woke.length?' e '+woke.join(', '):'')+'.';
    log(s,heroName(h.id)+' abriu o portão de Troia.');}
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(s.foodSetup)return fail('Concluam a distribuição da vida antes da primeira ação.');
    if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(!h||h.hp<=0||(h.ap<=0&&action!=='rescue'))return fail('Escolha um herói de pé com ações disponíveis.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone),inCity=isCity(h.zone);let message='';
    if(action==='move'){if(!links(s,h.zone).includes(target))return fail('Escolha uma região conectada.');const origin=h.zone;if(isCity(origin)&&!isCity(target)&&h.inside)return fail(heroName(h.id)+' fica dentro da cidade: o portão é dele.');message=moveHero(s,h,target)?'moveu para '+target:'tentou fugir de '+origin+', mas caiu antes de sair';}
    else if(action==='attack'){const e=s.enemies.find(e=>e.id===target&&distance(h.zone,e.zone)<=HEROES.stats(h).range);if(!e)return fail('Escolha um inimigo no alcance básico.');strike(s,h,e,HEROES.stats(h).attack,{ranged:h.id==='odisseu'||e.zone!==h.zone});message='atacou: '+HEROES.stats(h).attack+' de dano';}
    else if(action==='interact'){
      const options=interactions(s,h),choice=target?options.find(x=>x.id===target):options.find(x=>x.available);
      if(!choice||!choice.available)return fail(choice?.detail||'Não há nada para resolver aqui.');
      if(choice.id==='burn'){s.burned.push(h.zone);if(s.burned.length===2)s.fireWave=true;if(h.id==='agamemnon')feat(s,'agamemnon');addAlarm(s,1,'fogo em '+NAMES[h.zone]);s.lastFind={zone:h.zone,title:'Fogo em '+NAMES[h.zone],text:'As tochas sobem pelos telhados. '+(s.burned.length<FIRES-1?'Faltam '+(FIRES-s.burned.length)+' peças, e a última é o palácio de Príamo.':s.burned.length<FIRES?'Agora só falta o palácio de Príamo (01).':'O palácio de Príamo queima, e com ele Troia.')+(s.burned.length===2?' O clarão acorda a cidade inteira: mais tropas correm do quartel.':'')+' Na mesa: coloquem 1 ficha de fogo em '+h.zone+'.'};message='incendiou '+NAMES[h.zone];}
      else if(choice.id==='gate'){s.gateProgress++;if(s.gateProgress>=gateCost(s)){openGate(s,h);message='abriu o portão de Troia';}else message='soltou uma tranca do portão ('+s.gateProgress+'/'+gateCost(s)+')';}
      else if(choice.id==='postern'){s.posternProgress++;if(s.posternProgress>=2){s.posternOpen=true;s.openedRound=s.round;fleetWakes(s);addAlarm(s,1,'a porta do santuário range');s.lastFind={zone:POSTERN,title:'A porta de Helena',text:'Atrás do altar, a porta pequena que Helena deixou destrancada dá para fora da muralha, junto à torre do canto. Um herói da frota de pé em M2 basta.'};message='abriu a porta de Helena';}else message='mexeu na tranca da porta de Helena (1/2)';}
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível preparar habilidades com inimigos nesta peça.');if(!h.used.length)return fail('As habilidades já estão prontas. Vida só se recupera com comida encontrada.');h.used=[];message='preparou suas habilidades';
    }else if(action==='pray'){
      if(s.favor>=FAVOR_MAX)return fail('O Favor dos deuses já está no máximo.');if(h.ap>=2)h.ap--;else if(s.campFood>0)s.campFood--;else return fail('Com uma ação só, a prece pede 1 comida do armazém, e o armazém está vazio.');addFavor(s,1,'a prece de '+def.name);message='rezou aos deuses';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta peça.');if(a.slain)return fail('A flecha de Apolo não tem cura: Aquiles está morto.');if(h.hp<2)return fail('Socorrer transfere 1 de vida: quem socorre precisa ter ao menos 2.');h.hp--;a.hp=1;a.ap=1;message='socorreu '+heroName(a.id)+', dando-lhe 1 da sua própria força';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(c&&h.known&&!h.known.includes(n))return fail('Este herói ainda não conhece esta habilidade.');if(!c||c.passive||h.used.includes(n)||h.onceUsed.includes(n))return fail('Habilidade indisponível.');
      
      const e=s.enemies.find(e=>e.id===target),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');strike(s,h,e,c.value,{piercing:c.piercing,stun:c.stun,breakArmor:c.breakArmor,ranged:c.type==='ranged'});}
      else if(c.type==='multiRanged'){
        const ids=String(target).split(',').filter(Boolean),targets=[...new Set(ids)].map(id=>s.enemies.find(enemy=>enemy.id===id));
        if(!targets.length||targets.length>2||targets.some(enemy=>!enemy)||new Set(targets.map(enemy=>enemy.zone)).size!==1||distance(h.zone,targets[0].zone)>1)return fail('Escolha até dois inimigos diferentes, juntos nesta área ou em uma área vizinha.');
        for(const enemy of targets)strike(s,h,enemy,c.value,{piercing:true,ranged:true});
      }
      else if(c.type==='precision'){if(!e||distance(h.zone,e.zone)>1)return fail('Inimigo fora de alcance.');strike(s,h,e,0,{precision:true,piercing:true,ranged:true});}
      else if(c.type==='charge'){if(!e||!links(s,h.zone).includes(e.zone))return fail('Escolha um inimigo em uma peça vizinha.');h.moves++;enter(s,h,e.zone);strike(s,h,e,c.value);}
      else if(c.type==='heal'){if(h.hp===HEROES.stats(h).maxHp)return fail('Vida completa.');h.hp=Math.min(HEROES.stats(h).maxHp,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===HEROES.stats(a).maxHp)return fail('Escolha outro herói ferido nesta peça.');const fallen=a.hp===0;a.hp=Math.min(HEROES.stats(a).maxHp,a.hp+c.value);if(fallen)a.ap=1;}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);const steps=ally?knownDistance(s,h.zone,zone):Infinity;if(!ally||zone===h.zone||steps>c.value)return fail('Escolha um aliado nesta peça e um destino a até duas áreas.');ally.moves+=steps;enter(s,ally,zone);}
      else if(c.type==='sprint'){const steps=knownDistance(s,h.zone,target);if(target===h.zone||steps>2)return fail('Destino a até duas peças.');h.moves+=steps;if(steps===2){const mid=links(s,h.zone).find(z=>links(s,z).includes(target));enter(s,h,mid);}enter(s,h,target);}
      else if(c.type==='grantAction'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp<=0)return fail('Escolha outro herói de pé nesta área.');a.ap++;a.bonusActions++;}
      else if(c.type==='taunt'){h.tauntRound=s.round;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta peça.');a.used=[];}
      else if(c.type==='intimidate'){const zone=e&&e.zone===h.zone?intimidationZone(s,e):null;if(!zone)return fail('Escolha um inimigo nesta área que possa recuar.');s.noise=true;const origin=e.zone;kill(s,e,c.value,true,h.id);if(s.enemies.includes(e)){e.zone=zone;e.intimidated=true;e.hold=false;e.sentry=false;log(s,TROOPS.label(e)+' sofreu '+c.value+' de dano, recuou de '+origin+' para '+zone+' e não poderá atacar na próxima resposta.');}}
      else return fail('Habilidade desconhecida.');
      if(c.once)h.onceUsed.push(n);else h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    if(action!=='rescue')h.ap=Math.max(0,h.ap-1);log(s,def.name+' '+message+'.');defeat(s);victory(s);return {ok:true,state:s,message:def.name+' '+message};
  }
  function invoke(state,god,target,heroId){
    const s=clone(state),fail=error=>({ok:false,error,state}),g=GODS[god];
    if(!g)return fail('Deus desconhecido.');if(s.result||s.phase!=='heroes'||s.foodSetup)return fail('Não é possível invocar agora.');if(s.encounter)return fail('Resolvam o encontro antes de continuar.');
    if(s.invokedRound===s.round)return fail('Os deuses já foram invocados nesta rodada.');if(s.favor<g.cost)return fail(g.name+' exige '+g.cost+' de Favor.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;let message;
    if(god==='atena'){if(!s.paladio)return fail('Sem o Paládio roubado, Atena ainda está com Troia.');addAlarm(s,-2,'a névoa de Atena cobre os gregos');message='Atena cobriu os gregos de névoa';}
    else if(god==='poseidon'){const h=s.heroes.find(x=>x.id===(target||heroId)&&x.hp>0);if(!h)return fail('Escolham um herói de pé.');if(!h.inside&&!s.gateOpen&&!s.posternOpen)return fail('A frota só entra quando a cidade abrir.');h.ap++;h.bonusActions++;message=heroName(h.id)+' ganhou 1 ação com o vento de Poseidon';}
    else{const z=target;if(!s.gateOpen&&!s.posternOpen)return fail('O raio de Zeus só cai com a cidade aberta.');if(!isCity(z)||z===PALACE)return fail('Escolham uma peça da cidade, menos o palácio.');if(s.burned.includes(z))return fail('Esta peça já está em chamas.');if(s.burned.length>=FIRES-1)return fail('Só falta o palácio, e o palácio só queima pela mão dos gregos.');
      s.burned.push(z);if(s.burned.length===2)s.fireWave=true;addAlarm(s,1,'o raio de Zeus em '+NAMES[z]);s.lastFind={zone:z,title:'O raio de Zeus',text:'O céu se abre sobre Troia, e o raio de Zeus cai em '+NAMES[z]+'. O fogo sobe pelos telhados. Na mesa: coloquem 1 ficha de fogo em '+z+'.'};message='o raio de Zeus incendiou '+NAMES[z];}
    s.favor-=g.cost;s.invokedRound=s.round;log(s,g.title+': '+message+' (Favor '+s.favor+'/'+FAVOR_MAX+').');defeat(s);victory(s);return {ok:true,state:s};
  }
  function choose(state,choice){const r=chooseOne(state,choice);
    if(r.ok&&r.state.outcome?.heroes)for(const oh of r.state.outcome.heroes){const h=r.state.heroes.find(x=>x.id===oh.id);if(h)oh.known=[...h.known];}
    if(r.ok&&!r.state.encounter&&r.state.pendingAbility){const s=r.state,h=s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;const left=h?[0,1,2].filter(x=>!h.known.includes(x)):[];if(left.length)s.encounter={id:'ability',hero:h.id,zone:h.zone,choices:left};}return r;}
  function chooseOne(state,choice){
    const s=clone(state),fail=error=>({ok:false,error,state});if(!s.encounter)return fail('Não há encontro aberto.');
    s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;const enc=s.encounter,h=s.heroes.find(a=>a.id===enc.hero);
    if(enc.id==='ability'){const n=Number(choice);if(!h||!enc.choices.includes(n))return fail('Escolham uma das habilidades ainda não aprendidas.');h.known.push(n);h.known.sort();s.encounter=null;s.lastLearn={hero:h.id,kind:'ability',card:n};log(s,heroName(h.id)+' aprendeu '+HEROES.find(d=>d.id===h.id).cards[n].name+'. Virem a carta no tabuleiro do herói.');const next=s.pendingAbility&&s.heroes.find(a=>a.id===s.pendingAbility);s.pendingAbility=null;if(next){const left=[0,1,2].filter(x=>!next.known.includes(x));if(left.length)s.encounter={id:'ability',hero:next.id,zone:next.zone,choices:left};}return {ok:true,state:s};}
    return fail('Encontro desconhecido.');
  }
  function allocateFood(state,heroId,delta){
    const s=clone(state),h=s.heroes.find(hero=>hero.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição indisponível.');
    if(delta===1){if(!s.campFood)return fail('O armazém está vazio.');if(h.hp>=HEROES.stats(h).maxHp)return fail('Este herói já está com a vida cheia.');h.hp++;s.campFood--;if(h.hp>0&&h.ap===0)h.ap=h.inside?INSIDE_ACTIONS:HEROES.stats(h).actions;}
    else{if(h.hp<=h.startHp)return fail('Só é possível devolver o que foi distribuído agora.');h.hp--;s.campFood++;if(!h.hp)h.ap=0;}
    return {ok:true,state:s};
  }
  function finishFoodSetup(state){const s=clone(state);if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;log(s,'Vida reposta com o armazém. Restam '+s.campFood+' comida(s) guardadas.');return {ok:true,state:s};}
  // O caminho dentro da cidade (os caçadores do quartel vão atrás de quem abriu o portão).
  function cityDistance(from,to){const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of CITY_LINKS[at])if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function cityStep(from,to){const queue=[[from,null]],seen=new Set([from]);for(const [at,first] of queue){if(at===to)return first||from;for(const n of CITY_LINKS[at])if(!seen.has(n)){seen.add(n);queue.push([n,first||n]);}}return from;}
  function hit(s,e,h){const hp0=h.hp,damage=HEROES.damage(s,h,h.zone!==e.zone?Math.ceil((e.attack??2)/2):(e.attack??2),log,{distance});s.lastAttacks.push({enemy:e.id,hero:h.id,damage:hp0-h.hp,ranged:h.zone!==e.zone});log(s,heroName(h.id)+' sofreu '+damage+' de dano'+(h.zone!==e.zone?' à distância':'')+'.');
    if(h.hp>0&&(TROOPS.types[e.type]?.range||0)===0&&h.id!=='odisseu'&&e.zone===h.zone){const rebound=Math.floor(HEROES.stats(h).attack/2),ehp=e.hp;kill(s,e,rebound,0,h.id);const last=s.lastAttacks[s.lastAttacks.length-1];last.rebound=Math.max(0,ehp-Math.max(0,e.hp));last.killed=!s.enemies.includes(e);if(last.killed&&h.id==='aquiles')feat(s,'aquiles');}
    if(h.hp>0&&h.id==='ajax')feat(s,'ajax');if(!h.hp)h.ap=0;}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes'||s.foodSetup)return s;s.lastAttacks=[];s.escalation=null;s.lastReveals=[];s.lastFeats=[];s.lastLearn=null;s.lastFind=null;
    log(s,'Troia responde na rodada '+s.round+'.');
    // O que Troia vê: torres com arqueiro, sentinelas ao lado de um herói, o barulho de combate na planície.
    // Quanto maior a frota, mais difícil escondê-la: a torre conta cada herói que vê.
    for(const [z,t] of towerWatching(s)){const seen=ashore(s).filter(h=>h.hp>0&&t.sees.includes(h.zone));if(seen.length)addAlarm(s,seen.length,'a '+t.name.toLocaleLowerCase('pt-BR')+' viu '+(seen.length>1?seen.length+' grupos de gregos':'gregos')+' na planície');}
    for(const e of s.enemies.filter(e=>e.sentry))if(ashore(s).some(h=>h.hp>0&&distance(e.zone,h.zone)<=1))addAlarm(s,1,'a sentinela de '+e.zone+' viu gregos');
    if(s.noise){addAlarm(s,1,'o barulho de bronze na planície');s.noise=false;}
    if(s.result)return s;
    const o=insiderHero(s);let seenInside=false;
    for(const e of [...s.enemies]){
      if(!s.enemies.some(a=>a.id===e.id))continue;
      if(e.stunned){e.stunned=false;log(s,TROOPS.label(e)+' perdeu a ativação por Atordoamento.');continue;}
      const prey=e.focus==='aquiles'&&s.heroes.find(h=>h.id==='aquiles'&&h.hp>0&&(isCity(h.zone)||h.zone===OUT_GATE||h.zone===OUT_POSTERN));
      if(prey){if(knownDistance(s,e.zone,prey.zone)<=1){const hp0=prey.hp;HEROES.damage(s,prey,e.attack??3,log,{ignoreArmor:true,distance});s.lastAttacks.push({enemy:e.id,hero:prey.id,damage:hp0-prey.hp,ranged:prey.zone!==e.zone});log(s,'Páris atira em Aquiles com o arco de Apolo: '+(hp0-prey.hp)+' de dano.');
          if(!prey.hp){prey.ap=0;prey.slain=true;s.achillesSlain=true;s.lastFind={zone:prey.zone,title:'A flecha de Apolo',text:'No meio do fogo, Páris solta a corda, e Apolo guia a flecha. Ela acerta Aquiles no calcanhar, o único lugar onde a mãe o segurou quando o mergulhou no Estige. O maior dos gregos cai dentro da cidade que veio derrubar. Ninguém pode socorrê-lo.'};}
          defeat(s);if(s.result)return s;}
        else{const next=links(s,e.zone).slice().sort((a,b)=>knownDistance(s,a,prey.zone)-knownDistance(s,b,prey.zone))[0];if(next)e.zone=next;}
        continue;}
      if(isCity(e.zone)){
        // A batalha de sempre: intimidada não ataca; Provocação puxa o golpe; arqueiro atira a uma peça; quem está com um grego ataca.
        const intimidated=!!e.intimidated;e.intimidated=false;
        const range=TROOPS.types[e.type]?.range||0,reach=h=>h.hp>0&&isCity(h.zone)&&cityDistance(e.zone,h.zone)<=range;
        const taunt=s.heroes.find(h=>h.hp>0&&h.tauntRound===s.round&&cityDistance(e.zone,h.zone)<=2&&(h.zone===e.zone||reach(h)));
        const target=intimidated?null:taunt||s.heroes.filter(h=>h.hp>0&&h.zone===e.zone).sort((a,b)=>b.hp-a.hp)[0]||(range?s.heroes.filter(reach).sort((a,b)=>cityDistance(e.zone,a.zone)-cityDistance(e.zone,b.zone))[0]:null);
        if(target){if(!s.gateOpen&&!s.posternOpen)seenInside=true;const guard=s.guards[target.zone]||0;if(guard&&target.zone===e.zone){s.guards[target.zone]--;log(s,'A proteção aparou o golpe.');}else hit(s,e,target);defeat(s);if(s.result)return s;continue;}
        if(intimidated)log(s,TROOPS.label(e)+' recuou intimidada e não ataca nesta resposta.');
        if(e.hold)continue;
        const steps=s.alert?2:1;
        if(e.patrol){if(s.drunk===s.round||(s.calm===s.round&&e.patrol==='leste'))continue;for(let i=0;i<steps;i++){e.zone=patrolNext(s,e);if(s.heroes.some(h=>h.hp>0&&h.zone===e.zone))break;}}
        // Quem já estava numa peça em chamas, sem grego nela, apaga o fogo nesta fase; quem chega agora só apaga na próxima.
        else if(e.fire){if(s.burned.includes(e.zone)&&e.zone!==PALACE){s.burned=s.burned.filter(z=>z!==e.zone);log(s,TROOPS.label(e)+' apagou o fogo em '+NAMES[e.zone]+'.');(s.putOut||(s.putOut=[])).push(e.zone);continue;}
          const fires=s.burned.filter(z=>z!==PALACE);const goal=fires.sort((a,b)=>cityDistance(e.zone,a)-cityDistance(e.zone,b))[0]||s.heroes.filter(h=>h.hp>0&&isCity(h.zone)).sort((a,b)=>cityDistance(e.zone,a.zone)-cityDistance(e.zone,b.zone))[0]?.zone;if(goal)for(let i=0;i<steps&&e.zone!==goal;i++)e.zone=cityStep(e.zone,goal);}
        else if(e.hunt){const prey=s.heroes.filter(h=>h.hp>0&&isCity(h.zone)).sort((a,b)=>cityDistance(e.zone,a.zone)-cityDistance(e.zone,b.zone))[0];if(prey)for(let i=0;i<steps&&e.zone!==prey.zone;i++)e.zone=cityStep(e.zone,prey.zone);}
        continue;
      }
      const intimidated=!!e.intimidated;e.intimidated=false;
      const shot=intimidated?null:rangedTarget(s,e),guard=s.guards[e.zone]||0;
      const h=intimidated?null:shot||s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){if(guard&&h.zone===e.zone){s.guards[e.zone]--;log(s,'A proteção aparou o golpe.');}else hit(s,e,h);}
      else if(!e.hold&&!e.sentry){const goal=huntGoal(s,e);if(goal!==e.zone){e.zone=nextStep(e.zone,goal);log(s,TROOPS.label(e)+' avançou para '+e.zone+'.');}}
      defeat(s);if(s.result)return s;
    }
    if(seenInside)addAlarm(s,2,'um troiano viu um grego dentro da cidade');

    // Portão aberto: a cada duas rodadas, (heróis - 1) tropas saem do palácio de Príamo (01), a última peça a queimar.
    if((s.gateOpen||s.posternOpen)&&!(s.openedRound>=s.round)&&(s.round-(s.openedRound||0))%2===0&&!s.burned.includes(PALACE)){const n=Math.max(1,s.heroes.length-1);const sent=[];for(let i=0;i<n;i++){const e=spawn(s,PALACE,nextTroop(s));if(e.type==='arqueiro')e.hold=true;else e.fire=true;sent.push(TROOPS.types[e.type].short);}s.escalation='Saem do palácio (01): '+sent.join(', ')+'. Os arqueiros ficam; os outros correm para apagar o fogo';log(s,'Troia acorda: '+sent.join(', ')+' saem do palácio.');}
    if(s.putOut?.length){s.escalation=(s.escalation?s.escalation+'. ':'')+'Os troianos apagaram o fogo em '+s.putOut.map(z=>NAMES[z]+' ('+z+')').join(' e ')+': tirem a ficha de fogo';s.putOut=[];}
    if(s.fireWave){s.fireWave=false;const n=Math.max(1,Math.floor((s.heroes.length-1)/2));const sent=[];for(let i=0;i<n;i++){const e=spawn(s,'02',nextTroop(s),'hunt');if(e.type!=='arqueiro'){e.hunt=false;e.fire=true;}sent.push(TROOPS.types[e.type].short);}s.escalation=(s.escalation?s.escalation+'. ':'')+'O clarão do fogo acorda o quartel (02): '+sent.join(', ');log(s,'O fogo acorda a cidade: '+sent.join(', ')+'.');}
    s.guards={};
    victory(s);if(s.result)return s;
    resolveChronicle(s);if(s.result)return s;
    s.round++;const open=s.gateOpen||s.posternOpen;s.heroes.forEach(h=>{if(h.inside){h.ap=h.hp>0?INSIDE_ACTIONS:0;h.bonusActions=Math.max(0,INSIDE_ACTIONS-HEROES.stats(h).actions);}else{h.ap=h.hp>0&&open?HEROES.stats(h).actions:0;h.bonusActions=0;}h.tauntRound=0;h.moves=0;});
    startChronicle(s);
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!==MISSION||!integer(s.players,1,5)||!integer(s.round,1,Number.MAX_SAFE_INTEGER)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length<2)return false;
    if(!Array.isArray(s.playerNames)||s.playerNames.length!==s.players||s.heroes.filter(h=>h.inside).length!==1)return false;
    if(!integer(s.alarm,0,ALARM_MAX)||!Array.isArray(s.alarmFired)||s.alarmFired.some(n=>!ALARM_STEPS[n]))return false;
    if(!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&HEROES.valid(h,s.round)&&Array.isArray(h.known)&&h.known.length>=1))return false;
    if(typeof s.foodSetup!=='boolean'||!integer(s.campFood,0,99)||typeof s.gateOpen!=='boolean'||typeof s.posternOpen!=='boolean'||!integer(s.favor,0,FAVOR_MAX)||!Array.isArray(s.glory))return false;
    if(s.encounter!==null&&(!s.encounter||s.encounter.id!=='ability'))return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&TROOPS.types[e.type]&&integer(e.hp,1,TROOPS.types[e.type].hp)))return false;
    if(s.result==='victory'&&(!(s.gateOpen||s.posternOpen)||s.outcome?.completed!==MISSION))return false;if(!Array.isArray(s.burned))return false;
    return Array.isArray(s.log)&&typeof s.reason==='string';
  }
  return {PALACE,VERSION,MAX_ROUNDS,MISSION,INSIDE_ACTIONS,HORSE,GATE,POSTERN,OUT_GATE,OUT_POSTERN,FIRES,CITY,OUTSIDE:Object.keys(OUTSIDE),PATROLS,TOWERS,huntGoal,alarmMax,ALARM_MAX,PERSONAL,CHRONICLE,GODS,FAVOR_MAX,invoke,ALARM_STEPS,FOOD_LIMIT,HEROES,TROOPS,TERRAINS,ZONES,BASE,WALLS,
    newGame,distance,knownDistance,isRevealed,isCity,links,intent,waves,nextAlarm,interaction,interactions,tokenDetail,act,choose,allocateFood,finishFoodSetup,trojanTurn,validSave,canMove,gateCost,watchedZone,TOKENS:{},CLUES:{},REVEAL_TEXT:{}};
});
