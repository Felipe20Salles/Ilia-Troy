// Missão 5 · O Paládio (NARRATIVA-MISSAO-5.md). Odisseu sozinho na cidade de Troia, durante a trégua do velório de Heitor;
// os outros heróis ficam no acampamento, com uma tarefa por rodada. Cada rodada é um dia da trégua: são 11.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'),require('./troops.js'));else root.TroyPaladio=factory(root.TroyHeroes,root.TroyTroops);})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES,TROOPS){
  'use strict';
  const VERSION=1,MISSION='paladio',MAX_ROUNDS=11,ALARM_MAX=15,FAVOR_MAX=6,ODYSSEUS_ACTIONS=3;
  // O mapa da cidade (assets/mapa-cidade-noite.webp): doze peças com nome e as duas peças dos aliados (05A e 05B) no centro.
  const NAMES={'01':'Palácio','02':'Quartel','03':'Residências Nobres','04':'Templo','05':'Praça Central','06':'Anfiteatro','07':'Mercado','08':'Banhos Públicos','09':'Oficinas','10':'Bairro Popular','11':'Biblioteca','12':'Santuário','05A':'Aliados (oeste)','05B':'Aliados (leste)'};
  const CONNECTIONS={'01':['02','03','05','04'],'02':['01','04'],'03':['01','06','05'],'04':['02','05','07','01'],'05':['01','04','06','07','05A','05B','03'],'06':['03','05','08','05B'],'07':['04','05','05A','09','10'],'05A':['05','07','05B','10'],'05B':['05','05A','08','11','06'],'08':['06','05B','11','12'],'09':['07','10'],'10':['09','07','05A','11'],'11':['10','05B','08','12'],'12':['11','08']};
  const ZONES=Object.fromEntries(Object.entries(CONNECTIONS).map(([id,links])=>[id,{name:id+' · '+NAMES[id],links:[...links]}]));
  const TEANO_ROUND=7,START='10',TEMPLE='04',HELEN='03',GATE='10',PRIEST='12',ALMS='07',PYRE_ROUND=10;
  // O ponto de encontro com os gregos: a muralha do Santuário (12), do outro lado da cidade, longe do templo (07/10/2026).
  const WALLS=['12'];
  // Os bairros da cidade (08/10/2026): cada peça do mapa pesa conforme o que ela é. Um mendigo some na multidão do bairro
  // pobre e do mercado; no palácio, nas casas nobres e no quartel ele chama atenção só por estar ali.
  const DISTRICTS={'10':{kind:'multidao',text:'Bairro dos pobres: um mendigo é só mais um. Os guardas não reparam nele aqui.'},
    '07':{kind:'multidao',text:'Mercado cheio: um mendigo some entre as bancas. Os guardas não reparam nele aqui.'},
    '01':{kind:'nobre',cost:1,text:'Palácio de Príamo: um mendigo aqui chama atenção (Suspeita +1 ao entrar).'},
    '03':{kind:'nobre',cost:1,text:'Casas nobres: um mendigo aqui chama atenção (Suspeita +1 ao entrar).'},
    '02':{kind:'quartel',cost:2,text:'Quartel: soldados por toda parte (Suspeita +2 ao entrar).'},
    '04':{kind:'sagrado',text:'Templo de Atena: as sacerdotisas guardam a deusa.'},
    '12':{kind:'sagrado',text:'Santuário: o ponto de encontro com os gregos, junto à muralha.'}};
  // Rondas dos guardas: cada guarda anda uma peça por fase de Troia, em volta do seu trajeto.
  const PATROLS={oeste:['02','04','07','09','10','05A','05','01'],leste:['03','06','08','12','11','05B','05','01'],templo:['04'],portao:['10','11','05B','05A'],heitor:['01','05','05A','10','11','05B','05','04']};
  // A cidade de noite, na trégua do luto (10/10/2026): o que Odisseu vê em cada peça.
  const LORE={'01':'O palácio de Príamo, cinquenta quartos de pedra polida para cinquenta filhos. No salão, à luz das tochas, Heitor está deitado sobre um leito de bronze.',
    '02':'O quartel cheira a couro e a óleo de lança. Escudos empilhados contra o muro, e homens que dormem com a espada ao lado.',
    '03':'As casas dos nobres têm pátios com fontes e loureiros. Numa delas, a de Páris, uma lâmpada fica acesa até tarde.',
    '04':'O templo de Atena no alto da acrópole. Lá dentro, num nicho escuro, uma estátua pequena de madeira que caiu do céu: enquanto ela estiver aqui, Troia não cai.',
    '05':'A grande praça, com a fonte no meio. De dia, a cidade chora Heitor aqui; à noite, ficam as flores pisadas e as cinzas do incenso.',
    '06':'O anfiteatro vazio. Nos degraus, os velhos que viram a primeira guerra contam aos meninos como Héracles derrubou estas mesmas muralhas.',
    '07':'O mercado: figos, peixe salgado, lã tingida. Ninguém olha para mais um mendigo entre as bancas.',
    '08':'Os banhos públicos, quentes até de noite. Os soldados de folga falam demais quando estão na água.',
    '09':'As oficinas dos ferreiros e dos carpinteiros. Os martelos não param nem na trégua: Troia faz lanças para depois do luto.',
    '10':'O bairro pobre, colado ao portão Ceias. Casas de barro, cães magros, crianças que pedem pão a quem também pede.',
    '11':'A biblioteca dos sacerdotes guarda tabuinhas mais velhas que a cidade: os nomes dos reis e quem ergueu cada trecho da muralha.',
    '12':'O santuário de Apolo junto à muralha. Daqui se vê a planície e as fogueiras das naus. É aqui que os gregos podem esperar embaixo.',
    '05A':'Becos estreitos atrás da praça, onde os amigos de Odisseu se escondem quando ele precisa deles.',
    '05B':'Pátios fechados por muros baixos. Uma mulher deixa pão na janela para quem passa sem pedir nada.'};
  // As quatro descobertas de Odisseu (CENARIO-MISSAO-5.md): de onde vem o cavalo.
  const DISCOVERIES={forma:'A forma: Troia honra os cavalos como deuses e aceitaria um como presente sagrado.',motivo:'O motivo: o Paládio roubado; o cavalo será a oferenda a Atena para expiar o roubo.',medida:'A muralha de Éaco: o trecho que mãos mortais ergueram, o único que pode cair. O cavalo será maior que o portão, e Troia terá de abrir a muralha para recebê-lo.',desconfia:'Quem vai desconfiar: Laocoonte e Cassandra. A mentira contada aos troianos já tem resposta para eles.'};
  // Crônica de cada dia da trégua (NARRATIVA-MISSAO-5.md). A noite do resgate é a abertura da missão: Odisseu entra
  // pelo portão enquanto Príamo sai, passa a noite na casa de Helena, e o dia 1 é a aurora em que o corpo volta.
  // Depois, nove dias de lenha, a pira no décimo e o túmulo no décimo primeiro. Todas as crônicas têm efeito.
  const CHRONICLE={
    1:{id:'aurora',title:'A aurora',text:'Cassandra é a primeira a ver, do alto da cidadela: o carro de Príamo volta pela planície com o corpo do filho. Ela grita, e Troia inteira desce ao portão para chorar Heitor.',textOdysseus:'Heitor morreu ontem à noite, nos braços da mãe, com a flecha de Odisseu no ombro. Hoje o corpo está no salão do palácio, e a cidade inteira sobe para vê-lo.',effect:'A cidade inteira desce ao portão: hoje ninguém repara num mendigo no Bairro Popular (10) nem na Praça (05). No cortejo, Odisseu vê a forma do cavalo.'},
    2:{id:'lamentos',title:'Os três lamentos',text:'Andrômaca segura a cabeça do marido. Hécuba chora o filho mais amado. Por último fala Helena: "Nunca ouvi de ti uma palavra dura." E não olha para o mendigo no fundo da praça.',effect:'A cidade chora na Praça (05): hoje ali ninguém repara num mendigo.'},
    3:{id:'lenha',title:'A lenha do Ida',text:'Os carros sobem ao Ida com machados e mulas. Por nove dias, Troia vai cortar a lenha da maior pira que já se viu.',effect:'O guarda do portão sai com os carros por um dia: não se move nesta fase de Troia.'},
    4:{id:'planicie',title:'Os mortos da planície',text:'Na mesma planície, gregos e troianos recolhem os seus mortos. Ninguém ergue a lança. Só o choro se ouve dos dois lados.',effect:'Se ninguém no acampamento distrair Troia hoje, os guardas andam duas peças nesta fase de Troia.'},
    5:{id:'estranhos',title:'Estranhos na cidade',text:'Pastores, mercadores, aliados de longe: todos vêm ver o velório de Heitor. Os guardas começam a perguntar de onde vem cada rosto.',effect:'Um novo guarda começa a rondar a cidade a partir do Portão (10).'},
    6:{id:'muralha',title:'Andrômaca na muralha',text:'Andrômaca sobe à muralha com o menino nos braços e olha a planície vazia, onde ele caiu. Os guardas baixam os olhos para não vê-la chorar.',effect:'Os guardas da ronda oeste param para olhar a viúva: não se movem nesta fase de Troia.'},
    7:{id:'teano',title:'Teano',text:'Teano, a sacerdotisa de Atena, mulher de Antenor, atravessa a praça com a chave do templo presa ao cinto. Ela não sabe o que leva.',effect:'Helena cumpriu a palavra: a partir de hoje, o templo se abre para Odisseu. O guarda do templo sobe ao Palácio (01) com Teano e só volta à noite.'},
    8:{id:'laocoonte',title:'Laocoonte',text:'No altar de Poseidon, Laocoonte fala alto: "Não confiem nos gregos, nem quando trazem presentes." Muitos riem. Alguns não.',effect:'Laocoonte prega no Santuário (12): hoje escutar lá não aumenta a Suspeita.'},
    9:{id:'vespera',title:'A véspera',text:'A pira está pronta, alta como uma torre. Amanhã a cidade inteira sai pelos portões para o fogo, e o templo de Atena fica quase sozinho.',effect:'Os guardas se juntam no portão: o guarda do templo não se move, os outros andam duas peças.'},
    10:{id:'pira',title:'A pira',text:'Ao amanhecer, acendem a pira. Troia inteira está diante do fogo, e a fumaça sobe reta para o céu. Lá em cima, na acrópole, o templo de Atena está vazio.',effect:'O templo está vazio: pegar o Paládio não aumenta a Suspeita hoje, e o guarda do templo sai para a pira.'},
    11:{id:'tumulo',title:'O túmulo',text:'Recolhem os ossos brancos, envolvem em púrpura, guardam num cofre de ouro e erguem o túmulo de Heitor, o domador de cavalos. Amanhã, a guerra recomeça.',effect:'É o último dia da trégua: quem não sair da cidade até o fim dele fica preso quando a guerra recomeçar.'}};
  // Com Heitor vivo não há corpo, funeral nem trégua: a cidade está em guerra. No dia 10, a procissão das mulheres
  // ao templo de Atena (Ilíada, canto 6) abre o templo no lugar da pira.
  const WAR_CHRONICLE={
    1:{id:'fechada',title:'A cidade fechada',text:'As portas não se abrem. Heitor manda contar cada homem dentro das muralhas, e a cidade inteira dorme com uma sentinela na porta.',effect:'Heitor manda revistar os bairros: os guardas andam duas peças nesta fase de Troia.'},
    2:{id:'estabulos',title:'Os cavalos de Heitor',text:'Nos estábulos do palácio, os troianos escovam os cavalos de Heitor como se fossem filhos do rei e falam com eles baixinho.',effect:'Odisseu vê a forma do cavalo: uma cidade que ama assim os cavalos aceitaria um como presente sagrado.'},
    3:{id:'rondas',title:'Rondas dobradas',text:'Depois que Heitor escapou de Aquiles, ninguém em Troia dorme tranquilo. As rondas dobram, e os guardas trocam a senha duas vezes por noite.',effect:'Um novo guarda começa a rondar a cidade a partir do Portão (10).'},
    4:{id:'saida',title:'Heitor na planície',text:'Heitor sai com o exército ao amanhecer para atacar as naus. O carro dele passa pelo bairro pobre e as crianças correm atrás.',effect:'Heitor sai com o exército: ele não ronda a cidade nesta fase de Troia.'},
    5:{id:'feridos',title:'Os feridos',text:'À tarde, os feridos voltam pelo portão, carregados nos escudos. A praça vira um hospital de palha e gemidos.',effect:'Os feridos enchem a Praça (05): hoje ali ninguém repara num mendigo.'},
    6:{id:'muralha',title:'Andrômaca na muralha',text:'Andrômaca sobe à muralha com o menino e procura Heitor na poeira da planície. Os guardas param para olhar a mulher do príncipe.',effect:'Os guardas da ronda oeste param para olhar Andrômaca: não se movem nesta fase de Troia.'},
    7:{id:'teano',title:'Teano',text:'Teano, a sacerdotisa de Atena, mulher de Antenor, atravessa a praça com a chave do templo presa ao cinto. Ela não sabe o que leva.',effect:'Helena cumpriu a palavra: a partir de hoje, o templo se abre para Odisseu. O guarda do templo sobe ao Palácio (01) com Teano e só volta à noite.'},
    8:{id:'laocoonte',title:'Laocoonte',text:'No altar de Poseidon, Laocoonte fala alto: "Não confiem nos gregos, nem quando trazem presentes." Muitos riem. Alguns não.',effect:'Laocoonte prega no Santuário (12): hoje escutar lá não aumenta a Suspeita.'},
    9:{id:'conselho',title:'O conselho de Príamo',text:'No conselho de Príamo, o velho Antenor pede que devolvam Helena e acabem com a guerra. Páris se levanta e diz que não.',effect:'A cidade discute na Praça (05): hoje ali ninguém repara num mendigo.'},
    10:{id:'procissao',title:'A procissão de Atena',text:'Hécuba leva as mulheres de Troia ao templo de Atena com o manto mais bonito do palácio, para pedir à deusa que salve a cidade. As portas ficam abertas.',effect:'O templo se abre para a procissão: pegar o Paládio custa só 1 de Suspeita por ação hoje.'},
    11:{id:'ultima',title:'A última noite',text:'Heitor dobra a guarda nas ruas e nas muralhas. Amanhã ele volta a atacar as naus, e quer a cidade fechada como um punho.',effect:'Heitor dobra a guarda: os guardas andam duas peças nesta fase de Troia.'}};
  const chronicleFor=(s,round)=>(s.heitorAlive?WAR_CHRONICLE:CHRONICLE)[round];
  const TOKENS={
    [GATE]:{id:'medida',label:'Examinar a muralha junto ao portão',detail:'2 ações no total, sob os olhos da guarda (Suspeita +2)'},
    [PRIEST]:{id:'desconfia',label:'Escutar no santuário',detail:'O sacerdote fala com os fiéis (Suspeita +1)'},
    [ALMS]:{id:'esmola',label:'Mendigar no mercado',detail:'Pão e um canto para descansar'},
    [TEMPLE]:{id:'paladio',label:'Pegar o Paládio',detail:'2 ações no total'}};
  const GODS={atena:{name:'Atena',cost:2,title:'O disfarce de Atena',text:'Atena muda o rosto do mendigo diante dos guardas: a Suspeita cai 3.'}};
  const clone=s=>JSON.parse(JSON.stringify(s));
  const heroName=id=>HEROES.find(d=>d.id===id)?.name||id;
  const log=(s,t)=>{s.log.unshift(t);s.log=s.log.slice(0,60);};
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  const odysseus=s=>s.heroes.find(h=>h.id==='odisseu');
  const campHeroes=s=>s.heroes.filter(h=>h.id!=='odisseu'&&h.hp>0);
  const isRevealed=()=>true;
  function addAlarm(s,amount,reason){if(s.result||!amount)return;const before=s.alarm;s.alarm=Math.max(0,Math.min(ALARM_MAX,s.alarm+amount));if(s.alarm!==before)log(s,'Suspeita '+(amount>0?'+':'')+amount+' ('+s.alarm+'/'+ALARM_MAX+'): '+reason+'.');defeat(s);}
  function addFavor(s,amount,reason){if(s.result||!amount)return;const before=s.favor;s.favor=Math.max(0,Math.min(FAVOR_MAX,s.favor+amount));if(s.favor!==before)log(s,'Favor dos deuses '+(amount>0?'+':'')+amount+' ('+s.favor+'/'+FAVOR_MAX+'): '+reason+'.');}
  function guardsAt(s,zone){return s.enemies.filter(e=>e.zone===zone);}
  function spawnGuard(s,route,type='guarda'){const e=TROOPS.create('e'+s.nextEnemy++,PATROLS[route][0],type);e.route=route;e.step=0;e.noStats=true;s.enemies.push(e);return e;}

  function newGame(options={}){
    const ids=Array.isArray(options.heroes)&&options.heroes.length?[...options.heroes]:['odisseu','agamemnon','aquiles'];
    if(!ids.includes('odisseu'))throw Error('O Paládio é a missão de Odisseu: ele precisa estar na equipe.');
    if(ids.length<2||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id)))throw Error('Escolha Odisseu e ao menos mais um herói.');
    const players=Number.isInteger(options.players)?options.players:1,owners=options.owners||ids.map(()=>1);
    const playerNames=Array.from({length:players},(_,i)=>String(options.playerNames?.[i]||`Jogador ${i+1}`).trim().slice(0,30));
    const legacy=options.legacy||{},heitorAlive=legacy.heitor==='escaped';
    const heroes=ids.map((id,i)=>{const h={...HEROES.create(id,options.levels?.[id]??1),owner:owners[i]||1,zone:id==='odisseu'?HELEN:'A1',cargo:false,food:0,moves:0,away:id!=='odisseu',known:Array.isArray(options.known?.[id])&&options.known[id].length?[...options.known[id]]:[0,1,2]};
      const life=options.life?.[id];if(Number.isInteger(life))h.hp=Math.max(0,Math.min(HEROES.stats(h).maxHp,life));if(id==='odisseu'){h.hp=Math.max(1,h.hp);h.ap=ODYSSEUS_ACTIONS;h.bonusActions=ODYSSEUS_ACTIONS-HEROES.stats(h).actions;}else h.ap=0;h.startHp=h.hp;return h;});
    const s={version:VERSION,mission:MISSION,campaign:options.campaign===true,players,playerNames,round:1,phase:'heroes',result:null,reason:'',
      legacy,heitorAlive,slayer:legacy.heitorSlayer||null,scrolls:[...new Set(options.scrolls||[])],campFood:Math.max(0,Number.isInteger(options.campFood)?options.campFood:0),
      alarm:heitorAlive?4:0,crowdToday:[],favor:Math.max(0,Math.min(FAVOR_MAX,Number.isInteger(options.favor)?options.favor:1)),invokedRound:0,
      heroes,enemies:[],nextEnemy:1,camp:{},exitReady:0,discoveries:[],helen:'unseen',progress:{medida:0,paladio:0},paladio:false,alms:false,
      encounter:null,chronicle:null,lastFind:null,lastFeats:[],lastReveals:[],escalation:null,lastAttacks:[],personal:{odisseu:{progress:0,done:false}},log:[],outcome:null,revealed:Object.keys(ZONES),foodSetup:false,guards:{}};
    // Como nas outras missões: antes do dia 1, o armazém repõe a vida de quem chegou ferido (1 comida = 1 de vida).
    s.foodSetup=s.campFood>0&&heroes.some(h=>h.hp<HEROES.stats(h).maxHp);
    for(const r of ['oeste','leste','templo','portao'])spawnGuard(s,r);
    if(heitorAlive){spawnGuard(s,'oeste');s.enemies[s.enemies.length-1].step=4;s.enemies[s.enemies.length-1].zone=PATROLS.oeste[4];const h=spawnGuard(s,'heitor','heitor');h.noStats=true;}
    // O guarda da ronda leste começa nos Banhos (08), para que a casa de Helena (03) amanheça sem guarda.
    const east=s.enemies.find(e=>e.route==='leste');east.step=2;east.zone=PATROLS.leste[2];
    for(const h of campHeroes(s))s.camp[h.id]='distrair';
    log(s,heitorAlive?'Sem trégua: Odisseu entra numa Troia em guerra, vigiada por Heitor.':'Na noite do resgate, o portão se abre para o carro de Príamo. Na sombra dele, um mendigo entra em Troia.');
    // A noite: Odisseu passa a noite na casa de Helena; a cena e a escolha abrem a missão. O dia 1 é a aurora.
    s.helen='met';s.encounter={id:'helena',zone:HELEN,hero:'odisseu'};
    startChronicle(s);s.lastFind=null;
    return s;
  }

  // O que Odisseu pode fazer na peça onde está.
  function interactions(s,h){const list=[];if(!h||h.id!=='odisseu')return list;
    const add=(id,label,detail,available=true)=>list.push({id,label,detail,available});
    const t=TOKENS[h.zone];
    if(t){
      if(t.id==='helena'&&s.helen==='unseen')add('helena',t.label,t.detail);
      if(t.id==='medida'&&!s.discoveries.includes('medida'))add('medida',t.label+' ('+s.progress.medida+'/2)',t.detail);
      if(t.id==='desconfia'&&!s.discoveries.includes('desconfia'))add('desconfia',t.label,t.detail);
      if(t.id==='esmola'&&!s.alms)add('esmola',t.label,t.detail);
      if(t.id==='paladio'&&!s.paladio){const need=paladioNeed(s),open=templeOpen(s);add('paladio',t.label+' ('+s.progress.paladio+'/'+need+')',open?theftDetail(s):'O templo está guardado. Ele se abre no dia '+PYRE_ROUND+' ('+(s.heitorAlive?'a procissão de Atena':'a pira')+'), ou antes, a partir do dia '+TEANO_ROUND+', se Helena ajudar.',open);}
    }
    if(WALLS.includes(h.zone)&&s.paladio)add('sair',s.exitReady?'Descer a muralha':'Descer a muralha sem ninguém embaixo',s.exitReady?'Os gregos esperam no ponto de encontro · 1 ação':'Ninguém espera embaixo: 2 ações e Suspeita +3');
    return list;}
  // O templo fica guardado: só se abre no dia da pira, ou a partir do dia de Teano com a ajuda de Helena.
  function templeOpen(s){return s.round===PYRE_ROUND||s.round>PYRE_ROUND||(s.helen==='ally'&&s.round>=TEANO_ROUND);}
  // No dia da pira (ou da procissão) o templo está vazio: basta 1 ação, como com a porta aberta por Helena.
  function paladioNeed(s){return s.round===PYRE_ROUND||s.helen==='ally'?1:2;}
  function theftCost(s){if(s.round===PYRE_ROUND)return s.heitorAlive?1:0;return s.helen==='ally'?2:3;}
  function theftDetail(s){const c=theftCost(s);return (c?'Suspeita +'+c+' por ação':'O templo está vazio por causa da pira: sem Suspeita')+(s.helen==='ally'?' · Teano deixou a porta aberta':'');}
  // Multidão: o bairro pobre sempre (e o mercado, na trégua), mais a peça que a crônica do dia encher de gente.
  // Na multidão os guardas não reparam no mendigo; Heitor repara sempre, e ninguém esconde quem carrega o Paládio.
  function crowded(s,zone){if(s.paladio)return false;const base=s.heitorAlive?['10']:['10','07'];return base.includes(zone)||(s.crowdToday||[]).includes(zone);}
  function watched(s,zone){const g=guardsAt(s,zone);return g.filter(e=>e.type==='heitor').length*3+(crowded(s,zone)?0:g.filter(e=>e.type!=='heitor').length);}

  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(x=>x.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result)return fail('A missão terminou.');
    if(s.encounter)return fail('Resolvam a cena antes de continuar.');
    if(!h||h.id!=='odisseu')return fail('Só Odisseu está dentro da cidade. Os outros heróis escolhem a tarefa no acampamento.');
    if(h.hp<=0||h.ap<=0)return fail('Odisseu não tem mais ações hoje.');
    s.lastFind=null;s.lastFeats=[];let message='';
    // A Suspeita vem do que Odisseu faz e de onde ele está: agir debaixo dos olhos de um guarda (fora da multidão),
    // entrar onde um mendigo não deveria estar, e as ações arriscadas da missão.
    const eyes=()=>{const g=watched(s,h.zone);if(g)addAlarm(s,g,guardsAt(s,h.zone).some(e=>e.type==='heitor')?'Heitor olha o mendigo de perto':'um guarda viu o mendigo de perto');};
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma peça vizinha.');h.zone=target;message='foi para '+ZONES[target].name;const d=DISTRICTS[target];if(d?.cost)addAlarm(s,d.cost,'um mendigo em '+NAMES[target]+' chama atenção');eyes();}
    else if(action==='attack')return fail('Lutar quebra a trégua. Odisseu é um mendigo: não ergue a mão contra ninguém.');
    else if(action==='rest'){if(!h.used.length)return fail('As habilidades já estão prontas.');h.used=[];message='preparou suas habilidades';eyes();}
    else if(action==='pray'){if(s.favor>=FAVOR_MAX)return fail('O Favor dos deuses já está no máximo.');if(h.ap>=2)h.ap--;else if(s.campFood>0)s.campFood--;else return fail('Com uma ação só, a prece pede 1 comida do armazém, e o armazém está vazio.');addFavor(s,1,'a prece de Odisseu');message='rezou a Atena';}
    else if(action==='interact'){const choice=interactions(s,h).find(x=>x.id===target);if(!choice)return fail('Não há nada para fazer aqui.');if(!choice.available)return fail(choice.detail);
      if(choice.id==='helena'){s.helen='met';s.encounter={id:'helena',zone:h.zone,hero:h.id};message='bateu à porta dos fundos da casa de Páris';eyes();}
      else if(choice.id==='medida'){s.progress.medida++;addAlarm(s,1,'um mendigo parado mexendo nas pedras da muralha');eyes();if(s.progress.medida>=2){discover(s,'medida','A muralha de Éaco','Junto ao portão, Odisseu passa a mão nas pedras: aqui o trabalho é de homem, não de deus. Os velhos contam que Éaco ergueu este trecho ao lado de Poseidon e Apolo, e que é o único que pode cair. Se o cavalo for maior que o portão, Troia terá de abrir a muralha justamente aqui.');}message='examinou a muralha ('+Math.min(2,s.progress.medida)+'/2)';}
      else if(choice.id==='desconfia'){if(s.chronicle?.id!=='laocoonte')addAlarm(s,1,'um mendigo escuta perto demais do sacerdote');eyes();discover(s,'desconfia','Quem vai desconfiar','Laocoonte fala contra os gregos aos fiéis, e no fundo do santuário uma moça de olhos fixos repete que a cidade vai arder: Cassandra. Odisseu guarda os dois nomes. Na noite do cavalo, a mentira contada aos troianos já terá resposta para eles.');message='escutou no santuário';}
      else if(choice.id==='esmola'){s.alms=true;const max=HEROES.stats(h).maxHp,gain=Math.min(2,max-h.hp),stored=2-gain;h.hp+=gain;s.campFood+=stored;s.lastFind={zone:h.zone,title:'Pão de esmola',text:'Uma vendedora de figos dá ao mendigo um pão e um canto à sombra.'+(gain?' Odisseu recupera '+gain+' de vida.':'')+(stored?' O que sobra ele guarda para os gregos: +'+stored+' comida no armazém.':'')};message='mendigou no mercado';eyes();}
      else if(choice.id==='paladio'){const cost=theftCost(s);s.progress.paladio++;if(cost)addAlarm(s,cost,'alguém viu o mendigo no templo de Atena');if(s.result)return {ok:true,state:s};
        if(s.progress.paladio>=paladioNeed(s)){s.paladio=true;s.personal.odisseu.done=true;s.lastFeats.push('odisseu');s.enemies.filter(e=>e.route==='templo').forEach(e=>{e.alert=true;});
          discover(s,'motivo','O Paládio','No templo, um mendigo ergue nos braços uma estátua de madeira pequena e escura, mais velha do que Troia. Dizem que ela caiu do céu. Pesa menos do que ele esperava. Agora é sair da cidade: o ponto de encontro é a muralha do Santuário (12). Quando o roubo for descoberto, os guardas vão caçá-lo.');message='pegou o Paládio';}
        else message='entrou no templo de Atena ('+s.progress.paladio+'/'+paladioNeed(s)+')';}
      else if(choice.id==='sair'){if(!s.exitReady){if(h.ap<2)return fail('Sem ninguém embaixo, descer a muralha pede 2 ações.');h.ap--;addAlarm(s,3,'Odisseu desce a muralha sem ninguém para segurar a corda');if(s.result)return {ok:true,state:s};}
        h.ap=Math.max(0,h.ap-1);finish(s,'victory','Odisseu desce a muralha com o Paládio nos braços'+(s.exitReady?', e os gregos o recebem no ponto de encontro':'')+'. Troia acorda sem a sua deusa.');return {ok:true,state:s,message:'saiu de Troia com o Paládio'};}}
    else return fail('Ação indisponível na cidade.');
    h.ap=Math.max(0,h.ap-1);log(s,'Odisseu '+message+'.');return {ok:true,state:s,message};
  }
  function discover(s,id,title,text){if(!s.discoveries.includes(id))s.discoveries.push(id);s.lastFind={zone:odysseus(s)?.zone||START,title,text,discovery:DISCOVERIES[id]};log(s,'Descoberta: '+title+'.');}

  // Tarefa de um herói no acampamento, escolhida a cada dia.
  function campTask(state,heroId,task){const s=clone(state),h=s.heroes.find(x=>x.id===heroId);if(!h||h.id==='odisseu'||h.hp<=0)return {ok:false,error:'Escolha um herói de pé no acampamento.',state};if(!['distrair','saida'].includes(task))return {ok:false,error:'Tarefa inválida.',state};s.camp[heroId]=task;return {ok:true,state:s};}

  // Helena: a cena da noite e a escolha (o efeito só aparece depois).
  function choose(state,choice){const s=clone(state);if(!s.encounter)return {ok:false,error:'Não há cena aberta.',state};
    if(s.encounter.id==='helena'){const way={confiar:'verdade',seguir:'disfarce'}[choice]||choice;if(!['verdade','retorno','disfarce'].includes(way))return {ok:false,error:'Escolha inválida.',state};s.encounter=null;const o=odysseus(s),key='A chave do templo fica com Teano, a sacerdotisa de Atena, mulher de Antenor. Quando Teano passar pela praça com a chave (dia '+TEANO_ROUND+'), a porta do templo estará aberta para ele, e pegar o Paládio custará 1 ação a menos.';
      // Helena sempre acaba do lado de Odisseu (10/10/2026): o que muda é como ele a convence.
      s.helen='ally';s.helenWay=way;
      const told={verdade:['Helena banha Odisseu','Odisseu tira o capuz e conta tudo: quem é, por que veio, o que os gregos vão fazer. Helena não grita. Manda as servas embora, banha-o com as próprias mãos, unge-o com óleo e jura pelos deuses que não dirá a ninguém que ele esteve em Troia. "Meu coração já voltou para casa há muito tempo."'],
        retorno:['A promessa','"Menelau ainda espera por ti em Esparta." Helena fica muito tempo calada, com a lâmpada tremendo na mão. Pensa na filha que deixou, na casa do pai, no rio Eurotas. Depois responde só: "Teano."'],
        disfarce:['O mendigo','"Sou um escravo que fugiu das naus, senhora." Helena sorri. "Você nunca foi escravo de ninguém, filho de Laertes. Mas se veio disfarçado até a minha porta, veio pelo que eu penso." E ela mesma diz o nome: "Teano."']}[way];
      s.lastFind={zone:HELEN,title:told[0],text:told[1]+' '+key};log(s,'Helena se convenceu: vai ajudar Odisseu.');
      return {ok:true,state:s};}
    return {ok:false,error:'Cena desconhecida.',state};}

  function invoke(state,god){const s=clone(state),g=GODS[god];if(!g)return {ok:false,error:'Deus indisponível.',state};if(s.invokedRound===s.round)return {ok:false,error:'Só uma invocação por rodada.',state};if(s.favor<g.cost)return {ok:false,error:'Favor insuficiente.',state};
    s.favor-=g.cost;s.invokedRound=s.round;addAlarm(s,-3,'o disfarce de Atena');log(s,g.title+'.');return {ok:true,state:s,message:g.title};}

  function moveGuard(s,e,steps=1){const r=PATROLS[e.route];if(!r||r.length<2)return;for(let i=0;i<steps;i++){e.step=(e.step+1)%r.length;e.zone=r[e.step];}}
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.encounter)return s;const o=odysseus(s);s.lastFind=null;s.lastFeats=[];s.lastAttacks=[];s.escalation=null;
    const id=s.chronicle?.id;log(s,'Fim do dia '+s.round+'.');
    // O acampamento: quem distrai baixa a Suspeita; quem prepara a saída espera no ponto de encontro.
    const camp=campHeroes(s),distract=camp.filter(h=>s.camp[h.id]!=='saida'),prepare=camp.filter(h=>s.camp[h.id]==='saida');
    if(distract.length){const each=s.heitorAlive?1:1,total=Math.min(2,distract.length*each);if(s.heitorAlive)for(const h of distract){h.hp=Math.max(1,h.hp-1);}addAlarm(s,-total,s.heitorAlive?'um ataque falso ao acampamento troiano puxa os olhos de Heitor':'honras aos mortos na praia puxam os olhos de Troia para o acampamento');}
    s.exitReady=prepare.length;
    // O roubo é descoberto no fim do dia em que aconteceu: a Suspeita sobe 3 e, daí em diante, os guardas largam as rondas
    // e caçam Odisseu, uma peça por fase, pelo caminho mais curto até ele (07/10/2026).
    const back=s.enemies.filter(e=>e.route==='templo'&&e.away);back.forEach(e=>{e.zone=TEMPLE;delete e.away;});
    if(s.paladio&&!s.theftKnown){s.theftKnown=true;addAlarm(s,3,back.length?'o guarda do templo volta do palácio e encontra o nicho vazio':'o templo de Atena está vazio: o roubo foi descoberto');s.escalation=back.length?'O guarda do templo volta do palácio e vê que o Paládio sumiu: os guardas caçam o mendigo':'O roubo foi descoberto: os guardas caçam o mendigo';if(s.result)return s;}
    if(s.paladio){for(const e of s.enemies){const next=ZONES[e.zone].links.slice().sort((a,b)=>distance(a,o.zone)-distance(b,o.zone))[0];if(e.zone!==o.zone&&next)e.zone=next;}}
    // A cidade se move: cada guarda anda pela sua ronda. As crônicas do dia mudam o passo dos guardas.
    else{const fast=['vespera','fechada','ultima'].includes(id)||(id==='planicie'&&!distract.length);
      for(const e of s.enemies){if(e.route==='templo'){if(s.round===PYRE_ROUND-1){e.zone='05';}continue;}
        if(id==='lenha'&&e.route==='portao')continue;if(id==='muralha'&&e.route==='oeste')continue;if(id==='saida'&&e.type==='heitor')continue;
        moveGuard(s,e,fast?2:1);}}
    if(!s.paladio&&s.round+1===PYRE_ROUND)s.enemies.filter(e=>e.route==='templo').forEach(e=>{e.zone='05';});
    if(!s.paladio&&s.round===PYRE_ROUND)s.enemies.filter(e=>e.route==='templo').forEach(e=>{e.zone=TEMPLE;});
    // Ao fim do dia, quem dorme onde um guarda passa é notado (na multidão, não); Heitor nota sempre, e muito mais.
    const near=s.enemies.filter(e=>e.zone===o.zone&&!(id==='saida'&&e.type==='heitor')),seen=near.filter(e=>e.type==='heitor').length*3+near.filter(e=>e.type!=='heitor').length*(crowded(s,o.zone)?1:2);
    if(seen)addAlarm(s,seen,near.some(e=>e.type==='heitor')?'Heitor passa pelo mendigo e o olha duas vezes':'um guarda encontra o mendigo dormindo na rua');
    if(s.result)return s;
    if(s.round>=MAX_ROUNDS){finish(s,'defeat','A trégua acabou e Odisseu ainda está dentro de Troia. Ele foge ferido pela muralha, sem o Paládio.');return s;}
    s.round++;o.ap=ODYSSEUS_ACTIONS;o.bonusActions=ODYSSEUS_ACTIONS-HEROES.stats(o).actions;
    startChronicle(s);return s;}
  function startChronicle(s){const c=chronicleFor(s,s.round);s.crowdToday=[];if(!c){s.chronicle=null;return;}s.chronicle={round:s.round,id:c.id,status:'told'};log(s,'Dia '+s.round+': '+c.title+'.');
    // As crônicas mexem na cidade (multidões, rondas, guardas), não na Suspeita: ela só vem do que Odisseu faz.
    if(['aurora'].includes(c.id))s.crowdToday=['05','10'];
    if(['lamentos','feridos','conselho'].includes(c.id))s.crowdToday=['05'];
    if(c.id==='aurora'){discover(s,'forma','A forma','No cortejo, os cavalos de Heitor passam sem cavaleiro, enfeitados de luto, e os troianos tocam a crina deles como se tocassem o morto. Ouvem-se oferendas de cavalos a Poseidon, que ergueu as muralhas.');}
    else if(c.id==='estabulos')discover(s,'forma','A forma','Nos estábulos do palácio, Odisseu vê os troianos escovarem os cavalos de Heitor como se fossem filhos do rei. Uma cidade que ama assim os cavalos aceitaria um como presente sagrado.');
    if(c.id==='teano'&&!s.paladio)s.enemies.filter(e=>e.route==='templo').forEach(e=>{e.zone='01';e.away=true;});
    if(['estranhos','rondas'].includes(c.id)){const e=spawnGuard(s,'portao');e.step=0;s.escalation='Os guardas perguntam de onde vem cada estranho';}}

  function defeat(s){if(s.result)return;if(s.alarm>=ALARM_MAX)finish(s,'defeat','Um guarda reconhece Odisseu de Ítaca. Ele foge ferido pela muralha, sem o Paládio.');}
  function finish(s,result,reason){if(s.result)return;s.result=result;s.phase='end';s.reason=reason;s.encounter=null;const o=odysseus(s);if(result==='defeat'&&o)o.hp=1;
    s.outcome={completed:MISSION,favor:s.favor,next:'Construir o cavalo',campFood:s.campFood,revealedZones:[],scrolls:[...s.scrolls],commanders:{},legacy:{paladio:s.paladio&&result==='victory',discoveries:[...s.discoveries],helen:s.helen},glory:s.paladio&&result==='victory'?['odisseu']:[],
      heroes:s.heroes.map(h=>({id:h.id,owner:h.owner,hp:h.hp,level:h.level,known:[...h.known]}))};log(s,reason);}

  function intent(e,s){if(e.type==='heitor')return 'Ronda a cidade em guerra';const r=PATROLS[e.route];return e.away?'Volta ao templo à noite':r&&r.length>1?'Ronda até '+r[(e.step+1)%r.length]:'Guarda o templo';}
  function validSave(s){const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;return !!s&&s.version===VERSION&&s.mission===MISSION&&int(s.round,1,MAX_ROUNDS)&&int(s.alarm,0,ALARM_MAX)&&Array.isArray(s.heroes)&&s.heroes.some(h=>h.id==='odisseu')&&Array.isArray(s.enemies)&&s.enemies.every(e=>ZONES[e.zone])&&s.heroes.every(h=>h.id!=='odisseu'||ZONES[h.zone]);}

  function allocateFood(state,heroId,delta){
    const s=JSON.parse(JSON.stringify(state)),h=s.heroes.find(x=>x.id===heroId),fail=error=>({ok:false,error,state});
    if(!s.foodSetup||!h||![1,-1].includes(delta))return fail('Distribuição indisponível.');
    if(delta===1){if(!s.campFood)return fail('O armazém está vazio.');if(h.hp>=HEROES.stats(h).maxHp)return fail('Este herói já está com a vida cheia.');h.hp++;s.campFood--;}
    else{if(h.hp<=h.startHp)return fail('Só é possível devolver o que foi distribuído agora.');h.hp--;s.campFood++;}
    return {ok:true,state:s};}
  function finishFoodSetup(state){const s=JSON.parse(JSON.stringify(state));if(!s.foodSetup)return {ok:false,error:'A distribuição já foi encerrada.',state};s.foodSetup=false;return {ok:true,state:s};}
  return {LORE,allocateFood,finishFoodSetup,DISTRICTS,crowded,WAR_CHRONICLE,chronicleFor,TEANO_ROUND,templeOpen,VERSION,MISSION,MAX_ROUNDS,ALARM_MAX,FAVOR_MAX,PYRE_ROUND,NAMES,ZONES,CONNECTIONS,PATROLS,TOKENS,DISCOVERIES,CHRONICLE,GODS,HEROES,TROOPS,WALLS,TEMPLE,HELEN,GATE,PRIEST,START,
    newGame,act,choose,campTask,invoke,trojanTurn,interactions,intent,validSave,distance,isRevealed,paladioNeed,theftCost};
});
