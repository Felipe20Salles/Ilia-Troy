'use strict';
// Missão 5 · O Paládio: a tela da cidade. Odisseu sozinho em Troia; o acampamento escolhe uma tarefa por dia.
const G=window.TroyPaladio,M=window.TroyMesa,A=()=>window.TroyAudio;
const SAVE_KEY='ilia-paladio-v1';
const app=document.getElementById('app');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heroName=id=>G.HEROES.find(d=>d.id===id)?.name||id;
// Centro de cada peça no mapa da cidade (assets/mapa-cidade-noite.webp), em porcentagem.
const POS={'02':[17,16],'01':[45,14],'03':[80,15],'04':[18,36],'05':[49,37],'06':[81,36],'07':[19,58],'05A':[41,59],'05B':[59,59],'08':[83,57],'09':[17,80],'10':[38,78],'11':[65,79],'12':[85,79]};
let state=null,saved=null,campaign=null,dialogs=[],popZone=null,confirmEnd=false,completed=false;
let setup={companions:['agamemnon','aquiles'],heitor:'dead',slayer:'aquiles',patroclus:'dead'};
try{const c=JSON.parse(localStorage.getItem('ilia-campanha-v1'));if(c?.version===4&&c.team?.heroes?.length)campaign=c;}catch(e){}
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const p=JSON.parse(raw);if(G.validSave(p))saved=p;}}catch(e){}
const notice=t=>{const n=document.getElementById('notice');n.textContent=t;clearTimeout(notice.timer);notice.timer=setTimeout(()=>n.textContent='',6000);};
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saved=state;
  if(state.result&&state.outcome&&campaign&&!completed){let prior=null;try{prior=JSON.parse(localStorage.getItem('ilia-campanha-v1'));}catch(e){}localStorage.setItem('ilia-campanha-v1',JSON.stringify(window.TroyCampaign.record(prior,state.outcome,state.heroes,state.players,state.playerNames)));completed=true;}}catch(e){}}

// O legado que muda a noite: Heitor morto (e por quem) ou vivo; Pátroclo.
function legacy(){if(campaign)return campaign.legacy||{};return {heitor:setup.heitor==='dead'?'dead':'escaped',heitorSlayer:setup.heitor==='dead'?setup.slayer:null,patroclus:setup.patroclus};}
function story(){const l=legacy(),alive=l.heitor==='escaped',byOdysseus=l.heitorSlayer==='odisseu';
  if(alive)return [['A muralha à noite','Heitor escapou para dentro das muralhas. Não há trégua. Odisseu feriu o próprio rosto, vestiu os trapos de um escravo e sobe pela muralha na hora mais escura. Atena o leva até a porta dos fundos da casa de Páris.']];
  if(byOdysseus)return [['O portão','Ferido pela flecha de Odisseu, Heitor morreu dentro das muralhas. À noite, o portão se abre para os arautos que vão pedir trégua. Na sombra deles, um mendigo entra em Troia, e Atena o conduz até a porta dos fundos da casa de Páris.']];
  return [['O portão','O portão Ceias se abre inteiro para o carro de Príamo, carregado de ouro para o resgate do filho. Na sombra do carro, um mendigo entra em Troia. Hermes conduz o rei até a tenda de Aquiles; Atena conduz o mendigo até a porta dos fundos da casa de Páris.']];}
function tableSetup(s){const guards=s.enemies.map(e=>`${e.type==='heitor'?'Heitor':'Guarda'} em ${e.zone}`).join(', ');
  return {kind:'order',eyebrow:'Na mesa',title:'Montem a cidade',text:`Montem o mapa da cidade. Odisseu em ${G.HELEN} (${G.NAMES[G.HELEN]}), saindo da casa de Helena. ${guards}. Coloquem fichas de exploração em 04, 07, 10 e 12. Os outros heróis ficam no acampamento, fora do mapa.`};}
// Depois da noite na casa de Helena: a crônica do dia 1 (a aurora) e a montagem da mesa.
function openingDay(){const c=G.chronicleFor(state,1),forma=state.discoveries.includes('forma');
  return [tableSetup(state),{kind:'chronicle',eyebrow:'Dia 1 de '+G.MAX_ROUNDS,title:c.title,text:legacy().heitorSlayer==='odisseu'&&c.textOdysseus?c.textOdysseus:c.text},...(forma?[discoveryDialog(G.DISCOVERIES.forma)]:[]),{kind:'city',eyebrow:'Dia 1 de '+G.MAX_ROUNDS,title:'As ações do dia',effect:c.effect}];}

function start(){const l=legacy(),team=campaign?campaign.team:null;
  const heroes=team?[...team.heroes]:['odisseu',...setup.companions];
  state=G.newGame({heroes,players:team?.players||1,owners:team?team.owners:heroes.map(()=>1),playerNames:team?.playerNames,levels:team?.levels,life:team?.life,known:team?.known,campaign:!!campaign,legacy:l,scrolls:campaign?.scrolls,campFood:campaign?.resources?.food||0,favor:campaign?.resources?.favor});
  completed=false;dialogs=[...story().map(([t,x],i,all)=>({kind:'story',eyebrow:`A noite do resgate · ${i+1} de ${all.length}`,title:t,text:x})),...helenScene()];popZone=null;persist();render();}

// Diálogos: um de cada vez, todos do mesmo tamanho, com o som do momento quando aparecem.
// O Paládio é silencioso (08/10/2026): um mendigo sozinho na cidade. Só as descobertas e o encontro com Helena têm som.
const SOUND={story:null,chronicle:null,discovery:null,victory:'descoberta',find:'descoberta',helena:'encontro',city:null,order:null};
let lastShown=null;
function foodHTML(){if(!state?.foodSetup)return '';return `<div class="order-backdrop" role="dialog" aria-modal="true" aria-labelledby="food-title"><section class="order-card"><p class="order-step">Antes do dia 1</p><h2 id="food-title">Repor a vida com o armazém</h2><p class="order-tale">O armazém tem ${state.campFood} comida. Cada ficha devolve 1 de vida a um herói, até o máximo. O que sobrar fica guardado.</p><ul class="dlg-list food-alloc">${state.heroes.map(h=>{const max=G.HEROES.stats(h).maxHp;return `<li><b>${esc(heroName(h.id))}</b> <span>${h.hp}/${max}</span> <button class="quiet" data-command="food" data-id="${h.id}" data-delta="-1" ${h.hp<=h.startHp?'disabled':''}>−</button><button class="quiet" data-command="food" data-id="${h.id}" data-delta="1" ${h.hp>=max||!state.campFood?'disabled':''}>+</button></li>`;}).join('')}</ul><div class="actions-row"><button class="button" data-command="food-done">Concluir</button></div></section></div>`;}
function dialogHTML(){if(state?.foodSetup)return foodHTML();const d=dialogs[0];if(!d)return '';if(d!==lastShown){lastShown=d;const snd=d.sound||SOUND[d.kind];if(snd)setTimeout(()=>A()?.cue?.(snd),150);}
  const body=(d.voices||[]).map(v=>`<div class="voice ${v.where}"><b>${esc(v.label)}</b><p>${esc(v.text)}</p></div>`).join('')+(d.list?`${d.listTitle?`<p class="dlg-list-title">${esc(d.listTitle)}</p>`:''}<ul class="dlg-list">${d.list.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'');
  const actions=d.choices?d.choices.map(([id,label,quote])=>quote?`<button class="dlg-choice" data-command="choose" data-choice="${id}"><b>${esc(label)}</b><span>${esc(quote)}</span></button>`:`<button class="button" data-command="choose" data-choice="${id}">${esc(label)}</button>`).join(''):`<button class="button" data-command="next">${dialogs.length>1?'Continuar':'Ok'}</button>`;
  return `<div class="order-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title"><section class="order-card"><p class="order-step">${esc(d.eyebrow||'')}</p><h2 id="dlg-title">${esc(d.title)}</h2>${d.text?`<p class="order-tale">${esc(d.text)}</p>`:''}${d.effect?`<p class="chronicle-demand"><b>Efeito</b> ${esc(d.effect)}</p>`:''}${body}<div class="actions-row">${actions}</div></section></div>`;}

// A cena de Helena, entrelaçada com a de Aquiles e Príamo na tenda (NARRATIVA-MISSAO-5.md, ato II).
function helenScene(){const H=(label,text)=>({where:'house',label,text});
  return [{kind:'helena',eyebrow:'A noite · a casa de Páris',title:'Helena',voices:[
    H('A porta dos fundos','Um mendigo bate três vezes. Quem abre não é uma serva: é a mulher mais bonita do mundo, com uma lâmpada na mão.'),
    H('Helena','Ela ergue a lâmpada até o rosto inchado de pancadas e fica muito tempo olhando. "Eu conheço esses ombros. Ninguém em Troia anda assim. Você é o filho de Laertes."')],
    choices:[['verdade','Contar a verdade','"Sou Odisseu. E vim pela deusa do templo."'],['retorno','Prometer a volta','"Menelau ainda te espera em Esparta. Quando Troia cair, quem abrir a porta certa vai ser lembrado."'],['disfarce','Manter o disfarce','"Sou um escravo que fugiu das naus, senhora."']]}];}
// O que acontece longe de Odisseu, contado ao longo dos dias (o contexto chega com o jogo, não antes dele).
// A tenda de Aquiles, na mesma noite em que Odisseu está com Helena (Ilíada, canto 24). Vem antes da aurora do dia 1.
function tentScene(){const l=legacy();if(l.heitor==='escaped'||l.heitorSlayer==='odisseu')return [];const T=(label,text)=>({where:'tent',label,text});
  return [{kind:'story',eyebrow:'A mesma noite · a tenda de Aquiles',title:'Príamo e Aquiles',voices:[
    T('Príamo','De joelhos, o velho beija as mãos que mataram seu filho. "Lembra-te de teu pai, Aquiles. Fiz o que nenhum mortal fez: levei à boca a mão do homem que matou meu filho."'),
    T('Aquiles','Os dois choram juntos, o velho por Heitor, Aquiles pelo pai'+(l.patroclus==='dead'?' e por Pátroclo':'')+'. "Quantos dias queres para os funerais? Durante esse tempo, eu mesmo seguro o exército."'),
    T('Príamo','"Nove dias para chorá-lo, o décimo para a pira, o décimo primeiro para o túmulo." Antes da aurora, Hermes acorda o rei e o tira do acampamento.')]}];}
// O que acontece longe de Odisseu, ao longo dos dias, sempre depois da noite do resgate.
function dayVoices(day){const l=legacy(),T=(label,text)=>({where:'tent',label,text}),patroclus=l.patroclus==='dead';
  if(day===6)return [T('No acampamento grego',patroclus?'Os jogos fúnebres de Pátroclo seguem na praia. Ájax procura Odisseu para a luta e não o encontra.':'Na praia, os gregos contam os dias de trégua. Ájax procura Odisseu e não o encontra. Agamêmnon manda não perguntar.')];
  return null;}

// Depois de cada ação ou fase de Troia: o que a mesa precisa ver, na ordem.
function discoveryDialog(text){const i=text.indexOf(': ');return {kind:'discovery',eyebrow:'Descoberta',title:i>0?text.slice(0,i):'Descoberta',text:i>0?text.slice(i+2):text};}
function afterChange(before){if(state.lastFind){dialogs.push({kind:'find',eyebrow:'Em '+state.lastFind.zone,title:state.lastFind.title,text:state.lastFind.text});if(state.lastFind.discovery)dialogs.push(discoveryDialog(state.lastFind.discovery));}
  if(state.encounter?.id==='helena'&&!before?.encounter)dialogs.push(...helenScene());
  if(state.result&&!before?.result){if(state.result==='victory')dialogs.push({kind:'victory',eyebrow:'Vitória',title:'O Paládio está fora de Troia',text:state.reason});else A()?.cue?.('queda');}}
function perform(action,target){const before=state,r=G.act(state,'odisseu',action,target);if(!r.ok){notice(r.error);return;}state=r.state;popZone=null;
  M?.storeToast?.(before,state);afterChange(before);persist();render();}
function endDay(){const before=state;state=G.trojanTurn(state);confirmEnd=false;popZone=null;
  const moves=state.enemies.map(e=>{const b=before.enemies.find(x=>x.id===e.id);const who=e.type==='heitor'?'Heitor':'Guarda';return !b?`Um novo guarda começa a ronda em ${e.zone}.`:b.zone!==e.zone?`${who}: de ${b.zone} para ${e.zone}.`:null;}).filter(Boolean);
  const d=state.alarm-before.alarm;
  // Um aviso só por dia: a crônica do novo dia, com o que a cidade fez de noite (guardas e Suspeita) embaixo.
  const c=state.chronicle&&state.chronicle.round===state.round&&!state.result?G.chronicleFor(state,state.round):null;
  const night=[...moves,'Suspeita '+(d>=0?'+':'')+d+' (agora '+state.alarm+' de '+G.ALARM_MAX+').',...(state.exitReady?['Há gregos no ponto de encontro sob a muralha.']:[])];
  if(c)dialogs.push({kind:'chronicle',eyebrow:'Dia '+state.round+' de '+G.MAX_ROUNDS,title:c.title,text:c.text,voices:dayVoices(state.round)},{kind:'city',eyebrow:'Dia '+state.round+' de '+G.MAX_ROUNDS,title:'As ações do dia',effect:c.effect,listTitle:moves.length?'De noite, movam as miniaturas:':'De noite, os guardas ficaram onde estavam.',list:night});
  else if(!state.result)dialogs.push({kind:'city',eyebrow:'Fim do dia '+before.round,title:'A cidade se move',list:night});
  afterChange(before);persist();render();}

function setupHTML(){const others=G.HEROES.filter(h=>h.id!=='odisseu');
  const camp=campaign?`<p>Equipe da campanha: ${campaign.team.heroes.map(heroName).map(esc).join(', ')}.</p>${campaign.team.heroes.includes('odisseu')?'':'<p><b>Odisseu caiu na campanha.</b> Esta missão precisa dele; use o teste avulso abaixo.</p>'}`:'';
  const resume=saved&&!saved.result?`<div class="row"><button class="button" data-command="resume">Continuar a noite (dia ${saved.round})</button><button class="quiet" data-command="restart">Recomeçar</button></div>`:'';
  const canCampaign=campaign&&campaign.team.heroes.includes('odisseu');
  return `<section class="setup"><p class="pal-day">Missão 5</p><h1>O Paládio</h1><p class="lede">Na mesma noite, dois homens atravessam o portão de Troia em sentidos opostos: um rei sai para pedir o corpo do filho, e um mendigo entra para roubar a deusa da cidade.</p>${resume}${camp}
   ${canCampaign?`<button class="button" data-command="start-campaign">Começar com a equipe da campanha</button>`:''}
   ${canCampaign?'<details><summary>Teste avulso (fora da campanha)</summary>':''}<fieldset><legend>Teste avulso</legend><p>Escolha quem fica no acampamento e como terminou A ira de Aquiles.</p>
    <div class="row">${others.map(h=>`<label><input type="checkbox" id="c-${h.id}" data-command="companion" data-id="${h.id}" ${setup.companions.includes(h.id)?'checked':''}> ${esc(h.name)}</label>`).join('')}</div>
    <div class="row"><label><input type="radio" name="heitor" id="h-aquiles" data-command="legacy" data-v="dead:aquiles" ${setup.heitor==='dead'&&setup.slayer==='aquiles'?'checked':''}> Heitor morto por Aquiles</label><label><input type="radio" name="heitor" id="h-odisseu" data-command="legacy" data-v="dead:odisseu" ${setup.heitor==='dead'&&setup.slayer==='odisseu'?'checked':''}> Morto pela flecha de Odisseu</label><label><input type="radio" name="heitor" id="h-vivo" data-command="legacy" data-v="escaped" ${setup.heitor==='escaped'?'checked':''}> Heitor escapou</label></div>
    <div class="row"><label><input type="radio" name="patroclo" id="p-morto" data-command="patroclus" data-v="dead" ${setup.patroclus==='dead'?'checked':''}> Pátroclo morreu</label><label><input type="radio" name="patroclo" id="p-vivo" data-command="patroclus" data-v="alive" ${setup.patroclus==='alive'?'checked':''}> Pátroclo vive</label></div>
    <button class="button" data-command="start-test" ${setup.companions.length?'':'disabled'}>Começar o teste</button></fieldset>${canCampaign?'</details>':''}</section>`;}

function popHTML(){if(!popZone)return '';const o=state.heroes.find(h=>h.id==='odisseu'),here=o.zone===popZone,adj=G.ZONES[o.zone].links.includes(popZone),[x,y]=POS[popZone];
  const d=G.DISTRICTS[popZone],crowd=G.crowded(state,popZone),foes=state.enemies.filter(e=>e.zone===popZone),risk=[d?.cost?'Suspeita +'+d.cost+' ao entrar':'',foes.some(e=>e.type==='heitor')?'Heitor está aqui: Suspeita +3':foes.length&&!crowd?'Guarda aqui: Suspeita +'+foes.length:''].filter(Boolean).join(' · ');
  const opts=[];if(adj)opts.push({cmd:'do',action:'move',target:popZone,title:'Ir para '+popZone+' · '+G.NAMES[popZone],detail:(risk?risk+' · ':'')+'1 ação'});
  if(here){for(const it of G.interactions(state,o))opts.push({cmd:'do',action:'interact',target:it.id,title:it.label,detail:it.detail,disabled:!it.available});
    if(state.favor<G.FAVOR_MAX){const one=o.ap<2;opts.push({cmd:'do',action:'pray',title:'Rezar a Atena',detail:one?'+1 de Favor · 1 ação e 1 comida do armazém':'+1 de Favor · 2 ações',disabled:one&&!state.campFood});}
    if(o.used?.length)opts.push({cmd:'do',action:'rest',title:'Preparar habilidades',detail:'Desvirar as cartas usadas · 1 ação'});}
  const units=state.enemies.filter(e=>e.zone===popZone).map(e=>`<li>${e.type==='heitor'?'Heitor':'Guarda'} · ${esc(G.intent(e,state))}</li>`).join('');
  const blocked=!o.ap?'Odisseu não tem mais ações hoje.':state.result?'A missão terminou.':'';
  const left=x>60?`right:${100-x+4}%`:`left:${x+4}%`,top=`top:${Math.min(y,62)}%`;
  return `<div class="pal-pop" style="${left};${top}" role="dialog" aria-label="${esc(G.NAMES[popZone])}"><header><b>${popZone} · ${esc(G.NAMES[popZone])}</b><button class="quiet" data-command="close-pop" aria-label="Fechar">✕</button></header>${G.LORE?.[popZone]?`<p class="lore">${esc(G.LORE[popZone])}</p>`:''}${crowd&&!d?.kind?'<p class="district crowd">Hoje há multidão aqui: os guardas não reparam no mendigo.</p>':d?`<p class="district ${d.kind}">${esc(d.text)}${crowd&&d.kind!=='multidao'?' Hoje há multidão aqui.':''}</p>`:''}${units?`<ul class="units">${units}</ul>`:''}${blocked?`<p>${blocked}</p>`:opts.length?opts.map(op=>`<button class="opt" data-command="${op.cmd}" data-action="${op.action}" ${op.target?`data-target="${op.target}"`:''} ${op.disabled?'disabled':''}><b>${esc(op.title)}</b><small>${esc(op.detail)}</small></button>`).join(''):`<p>Odisseu não chega aqui com um passo. Peças vizinhas a ${o.zone} acendem em dourado.</p>`}</div>`;}

function gameHTML(){const s=state,o=s.heroes.find(h=>h.id==='odisseu'),camp=s.heroes.filter(h=>h.id!=='odisseu');
  const reach=new Set(o.ap&&!s.result?G.ZONES[o.zone].links:[]);
  const zones=Object.entries(POS).map(([id,[x,y]])=>{const foes=s.enemies.filter(e=>e.zone===id),token=G.interactions({...s,heroes:s.heroes.map(h=>h.id==='odisseu'?{...h,zone:id}:h)},{...o,zone:id}).some(i=>i.id!=='sair');
    return `<button class="city-zone ${id===o.zone?'here':''} ${reach.has(id)?'reach':''} ${G.crowded(s,id)?'crowd':''} ${G.DISTRICTS[id]?.cost?'risky':''}" style="left:${x}%;top:${y}%" data-command="zone" data-zone="${id}" aria-label="${id} ${esc(G.NAMES[id])}${id===o.zone?', Odisseu está aqui':''}${foes.length?', '+foes.length+' guarda(s)':''}"><span class="zid">${id}</span><span class="units">${id===o.zone?'<span class="mesa-avatar hero-odisseu" aria-hidden="true"></span>':''}${foes.map(e=>`<span class="enemy-miniature ${e.type==='heitor'?'heitor':'guarda'}" title="${e.type==='heitor'?'Heitor':'Guarda'}" aria-hidden="true"></span>`).join('')}${token?`<span class="token" title="Há algo a fazer aqui">${M.ICONS.explore}</span>`:''}</span></button>`;}).join('');
  const pips=Array.from({length:3},(_,i)=>`<i class="${i<o.ap?'on':''}"></i>`).join('');
  const campHTML=camp.map(h=>`<div class="camp-hero"><span class="mesa-avatar hero-${h.id}" aria-hidden="true"></span><div><b>${esc(heroName(h.id))}</b><p>${h.hp>0?h.hp+' de vida':'caído'}</p></div>${h.hp>0?`<div class="tasks" role="group" aria-label="Tarefa de ${esc(heroName(h.id))}"><button class="task" data-command="task" data-id="${h.id}" data-task="distrair" aria-pressed="${s.camp[h.id]!=='saida'}">Distrair Troia</button><button class="task" data-command="task" data-id="${h.id}" data-task="saida" aria-pressed="${s.camp[h.id]==='saida'}">Preparar a saída</button></div>`:''}</div>`).join('');
  const disc=['forma','motivo','medida','desconfia'].map(k=>`<li class="${s.discoveries.includes(k)?'done':''}">${esc(G.DISCOVERIES[k].split(':')[0])}</li>`).join('');
  const hot=s.alarm>=14;
  const end=confirmEnd?`<div class="actions-row"><button class="button" data-command="end-confirm">Encerrar o dia mesmo assim</button><button class="quiet" data-command="end-cancel">Continuar jogando</button></div>`:`<button class="end-day" data-command="end" ${s.result?'disabled':''}>Encerrar o dia ${s.round}</button>`;
  return `<div class="pal"><section class="pal-bar"><div><p class="pal-day">Dia ${s.round} de ${G.MAX_ROUNDS}${s.heitorAlive?' · sem trégua':''}</p><h1>O Paládio</h1></div>
    <div class="pal-stats"><div class="pal-stat ${hot?'hot':''}"><small>Suspeita</small><b>${s.alarm}/${G.ALARM_MAX}</b><span class="suspicion"><i style="width:${s.alarm/G.ALARM_MAX*100}%"></i></span></div>
    <div class="pal-stat ${s.paladio?'good':''}"><small>Paládio</small><b>${s.paladio?'Com Odisseu':G.templeOpen(s)?'Templo aberto':'Guardado'}</b></div>
    <div class="pal-stat"><small>Favor</small><b>${s.favor}/${G.FAVOR_MAX}</b></div>
    <div class="pal-stat"><small>Armazém</small><b>${s.campFood}</b></div>
    ${s.favor>=G.GODS.atena.cost&&s.invokedRound!==s.round&&!s.result?`<button class="quiet" data-command="atena" title="${esc(G.GODS.atena.text)}">Atena (${G.GODS.atena.cost} Favor): Suspeita −3</button>`:''}</div></section>
   <div class="pal-main"><div class="city-scroll"><div class="city"><img src="assets/mapa-cidade-noite.webp" alt="Mapa da cidade de Troia, com catorze peças">${zones}${popHTML()}</div></div>
    <aside class="pal-side"><section class="pal-card"><div class="ody"><span class="mesa-avatar hero-odisseu" aria-hidden="true"></span><div><b>Odisseu</b><p>Em ${o.zone} · ${esc(G.NAMES[o.zone])} · ${o.hp} de vida</p><span class="pips" aria-label="${o.ap} ações">${pips}</span></div></div>${end}</section>
     <section class="pal-card"><h2>No acampamento</h2><p>Uma tarefa por herói, a cada dia. Distrair baixa a Suspeita (até 2 por dia${s.heitorAlive?'; sem trégua, é um ataque falso que custa 1 de vida':''}). Preparar a saída deixa alguém sob a muralha para a fuga.</p>${campHTML}</section>
     <section class="pal-card"><h2>Os segredos de Troia</h2><ul class="discoveries">${disc}</ul></section>
     <p class="pal-legend"><span><i style="border-color:#7fa9b8"></i>Multidão: os guardas não reparam no mendigo</span><span><i style="border-color:#c45a3c"></i>Bairro nobre ou quartel: entrar sobe a Suspeita</span></p></aside></div></div>`;}

function resultHTML(){const s=state,win=s.result==='victory';return `<section class="setup"><p class="pal-day">${win?'Vitória':'Derrota'}</p><h1>${win?'O Paládio está fora de Troia':'Odisseu fugiu sem o Paládio'}</h1><p class="lede">${esc(s.reason)}</p><ul class="discoveries">${['forma','motivo','medida','desconfia'].map(k=>`<li class="${s.discoveries.includes(k)?'done':''}">${esc(G.DISCOVERIES[k])}</li>`).join('')}</ul><div class="row"><a class="button" href="cavalo.html">Seguir para Construir o cavalo</a><a class="button quiet" href="campanha.html">Ver a campanha</a><button class="quiet" data-command="restart">Jogar de novo</button></div></section>`;}

function render(){document.body.classList.toggle('game-active',!!state&&!state.result);
  if(!state){app.innerHTML=setupHTML();return;}
  const prevScroll=app.querySelector('.city-scroll')?.scrollLeft;
  app.innerHTML=(state.result&&!dialogs.length?resultHTML():gameHTML())+dialogHTML();
  // Tela pequena: o mapa tem um tamanho mínimo legível e rola para o lado; na primeira vez, centraliza em Odisseu.
  const wrap=app.querySelector('.city-scroll');if(wrap&&wrap.scrollWidth>wrap.clientWidth){if(prevScroll!=null)wrap.scrollLeft=prevScroll;else{const o=state.heroes.find(h=>h.id==='odisseu'),x=(POS[o.zone]?.[0]||50)/100*wrap.scrollWidth;wrap.scrollLeft=Math.max(0,x-wrap.clientWidth/2);}}
  const A_=A();if(A_?.setTension){if(state.result)A_.setTension(-1);else A_.setTension(state.alarm>=12?2:state.alarm>=6?1:0);}}

app.addEventListener('click',ev=>{const b=ev.target.closest('[data-command]');if(!b)return;const c=b.dataset.command;
  if(c==='companion'){const id=b.dataset.id;setup.companions=b.checked?[...new Set([...setup.companions,id])]:setup.companions.filter(x=>x!==id);render();return;}
  if(c==='legacy'){const [h,slayer]=b.dataset.v.split(':');setup.heitor=h;if(slayer)setup.slayer=slayer;return;}
  if(c==='patroclus'){setup.patroclus=b.dataset.v;return;}
  if(c==='start-test'){campaign=null;start();return;}
  if(c==='start-campaign'){start();return;}
  if(c==='food'){const r=G.allocateFood(state,b.dataset.id,Number(b.dataset.delta));if(!r.ok){notice(r.error);return;}state=r.state;persist();render();return;}
  if(c==='food-done'){const r=G.finishFoodSetup(state);if(r.ok){state=r.state;persist();render();}return;}
  if(c==='resume'){state=saved;render();return;}
  if(c==='restart'){state=null;saved=null;dialogs=[];try{localStorage.removeItem(SAVE_KEY);}catch(e){}render();return;}
  if(!state)return;
  if(c==='next'){dialogs.shift();render();return;}
  if(c==='choose'){const r=G.choose(state,b.dataset.choice);if(!r.ok){notice(r.error);return;}dialogs.shift();const before=state;state=r.state;afterChange(before);if(before.encounter?.id==='helena'&&state.round===1)dialogs.push(...tentScene(),...openingDay());persist();render();return;}
  if(dialogs.length)return;
  if(c==='zone'){popZone=popZone===b.dataset.zone?null:b.dataset.zone;render();return;}
  if(c==='close-pop'){popZone=null;render();return;}
  if(c==='do'){perform(b.dataset.action,b.dataset.target);return;}
  if(c==='task'){const r=G.campTask(state,b.dataset.id,b.dataset.task);if(r.ok){state=r.state;persist();render();}return;}
  if(c==='atena'){const r=G.invoke(state,'atena');if(!r.ok){notice(r.error);return;}const before=state;state=r.state;A()?.cue?.('deus-atena');M?.storeToast?.(before,state);persist();render();notice(G.GODS.atena.text);return;}
  if(c==='end'){if(state.heroes.find(h=>h.id==='odisseu').ap>0){confirmEnd=true;render();}else endDay();return;}
  if(c==='end-confirm'){endDay();return;}
  if(c==='end-cancel'){confirmEnd=false;render();return;}
});
const rules=document.getElementById('rules');document.getElementById('rules-button')?.addEventListener('click',()=>rules.showModal());document.getElementById('close-rules')?.addEventListener('click',()=>rules.close());
render();
