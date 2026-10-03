'use strict';
// Só as peças desta missão: o arquivo de território tem as peças de todas as missões.
function missionRegions(){return Object.fromEntries(Object.entries(window.TroyTerritory).filter(([id])=>G.ZONES[id]));}
const G = window.TroyHold;
const SAVE_KEY = 'ilia-segurar-v1';
let state = null, selected = 'odisseu', pending = null, confirmation = null, saved = null, storageOK = true, troopArrival = null, deathAlert = null, responseQueue = [], responseIndex = 0, exitText = '', revealAlert = [], featAlert = [], chronicleSeen = 0, storyAlert = null, findAlert = null, camera = null, cameraMode = 'hero', zoomBias = 1, missionOpen = false, troyOpen = false, storyOpen = false, godsOpen = false, cameraManual = false, drag = null, dragMoved = false;
let setup={players:1,playerNames:['Jogador 1'],heroes:['odisseu','agamemnon','aquiles'],owners:[1,1,1],levels:{},route:'A',abilities:{}};
let completed=false;try{completed=localStorage.getItem('ilia-campanha-segurar')==='complete';}catch(e){}
// A campanha (missão 1) traz a equipe, a vida, as habilidades, o armazém, os pergaminhos e as consequências.
let campaign=null;try{const c=JSON.parse(localStorage.getItem('ilia-campanha-v1'));if(c?.version===4&&c.team?.heroes?.includes('odisseu')&&c.team.heroes.includes('agamemnon'))campaign=c;}catch(e){}
if(campaign)setup={players:campaign.team.players,playerNames:campaign.team.playerNames,heroes:[...campaign.team.heroes],owners:[...campaign.team.owners],levels:campaign.team.levels,abilities:{}};
const storeFromCampaign=()=>campaign?(campaign.resources?.food||0):0;
const app = document.getElementById('app');
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try { const raw = localStorage.getItem(SAVE_KEY); if(raw){const parsed=JSON.parse(raw);if(G.validSave(parsed))saved=parsed;} } catch(e){storageOK=false;}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saved=state;if(state.result==='victory'){localStorage.setItem('ilia-campanha-segurar','complete');let prior=null;try{prior=JSON.parse(localStorage.getItem('ilia-campanha-v1'));}catch(e){}localStorage.setItem('ilia-campanha-v1',JSON.stringify(window.TroyCampaign.record(prior,state.outcome,state.heroes,state.players,state.playerNames)));completed=true;}}catch(e){storageOK=false;}}
let noticeTimer;
// Ordem de mesa para as fichas de comida (vida) que mudaram.
function lifeOrders(before,after){const parts=after.map(h=>{const b=before.find(x=>x.id===h.id);const d=h.hp-(b?.hp??h.hp),n=G.HEROES.find(x=>x.id===h.id).name;return d<0?`retirem ${-d} ficha${d<-1?'s':''} de ${n}`:d>0?`coloquem ${d} ficha${d>1?'s':''} em ${n}`:'';}).filter(Boolean);return parts.length?'Na mesa: '+parts.join('; ')+'.':'';}
function notice(text){document.getElementById('notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>document.getElementById('notice').textContent='',6000);}
function button(label,command,extra='',disabled=false,cls='action'){return `<button class="${cls}" data-command="${command}" ${extra} ${disabled?'disabled':''}>${label}</button>`;}
const known=zone=>G.isRevealed(state,zone);
const zoneName=zone=>G.ZONES[zone].name.replace(/^\S+\s·\s/,'');
function detectArrivals(before,after,reason){const prior=new Set(before.map(e=>e.id)),added=after.filter(e=>!prior.has(e.id));if(!added.length)return;const groups={};for(const e of added){const key=e.type+'|'+e.zone;(groups[key]??={type:e.type,zone:e.zone,count:0}).count++;}troopArrival={reason,groups:Object.values(groups)};}
function detectReveals(){if(state.lastReveals?.length)revealAlert=[...new Set([...revealAlert,...state.lastReveals])];if(state.lastFeats?.length)featAlert=[...new Set([...featAlert,...state.lastFeats])];}

// Resposta de Troia: só tropas que estavam ou passam a estar à vista na mesa.
function prepareTrojanResponse(before,after){responseQueue=before.enemies.filter(enemy=>{const moved=after.enemies.find(e=>e.id===enemy.id);return G.isRevealed(before,enemy.zone)||(moved&&G.isRevealed(after,moved.zone));}).map(enemy=>{const moved=after.enemies.find(e=>e.id===enemy.id),intent=G.intent(enemy,before),seen=G.isRevealed(before,enemy.zone);return {id:enemy.id,type:enemy.type,label:G.TROOPS.label(enemy),from:seen?enemy.zone:null,to:moved?.zone||null,intent:seen?intent:'Surgiu de território desconhecido'};});responseIndex=0;}
function responseHTML(){if(!responseQueue.length||responseIndex>=responseQueue.length||revealAlert.length)return '';const step=responseQueue[responseIndex],moved=step.to&&step.to!==step.from;const order=!step.from?`Coloquem a miniatura em ${step.to}`:moved?`Movam de ${step.from} para ${step.to}`:`Permanece em ${step.from}`;return `<div class="arrival-backdrop response-backdrop" role="alertdialog" aria-modal="true"><section class="arrival-card response-card"><p class="eyebrow">${TROY_STEPS.move} · tropa ${responseIndex+1} de ${responseQueue.length}</p><h2>${step.label}</h2><div class="response-order"><span class="enemy-miniature ${step.type}" aria-hidden="true"></span><div><b>${order}</b><p>${esc(step.intent)}</p></div></div>${button(responseIndex===responseQueue.length-1?'Resposta concluída':'Feito · próxima tropa','response-next','',false,'button')}</section></div>`;}
function arrivalHTML(){if(!troopArrival||revealAlert.length||responseIndex<responseQueue.length)return '';return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="arrival-title"><section class="arrival-card"><p class="eyebrow">${trojanPhase?TROY_STEPS.reinforce:'Pausem a partida · novas tropas'}</p><h2 id="arrival-title">${troopArrival.reason}</h2><div class="arrival-list">${troopArrival.groups.map(g=>`<article><span class="enemy-miniature ${g.type}" aria-hidden="true"></span><div><b>${g.count}× ${G.TROOPS.types[g.type].name}</b><strong>Peça ${g.zone}</strong><small>Age na próxima fase de Troia.</small></div></article>`).join('')}</div>${button('Posicionadas','dismiss-arrival','',false,'button')}</section></div>`;}
function detectFallen(before,after){const old=Object.fromEntries(before.map(h=>[h.id,h.hp]));const fallen=after.filter(h=>(old[h.id]??0)>0&&h.hp===0);if(fallen.length)deathAlert=fallen.map(h=>h.id);}
function deathHTML(){if(!deathAlert?.length)return '';const names=deathAlert.map(id=>G.HEROES.find(h=>h.id===id)?.name).filter(Boolean).join(' e ');return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true"><section class="arrival-card death-card"><p class="eyebrow">Contingente desbaratado</p><h2>${deathAlert.length>1?'Os contingentes de '+names+' foram desbaratados':'O contingente de '+names+' foi desbaratado'}</h2><p class="encounter-text">Os homens recuam em desordem.</p><p>Um aliado na mesma peça pode <b>Socorrer</b> sem gastar ação, passando 1 da própria vida.</p>${button('Continuar','dismiss-death','',false,'button')}</section></div>`;}
function foodSetupHTML(){if(!state?.foodSetup)return '';return `<div class="arrival-backdrop" role="dialog" aria-modal="true"><section class="arrival-card food-allocation"><p class="eyebrow">Antes da primeira ação</p><h2>Repor a vida com o armazém</h2><p>O armazém tem <b>${state.campFood} comida</b>. Cada ficha devolve 1 de vida a um herói, até o máximo. O que sobrar fica guardado para a missão seguinte.</p><div class="food-list">${state.heroes.map(h=>{const max=G.HEROES.stats(h).maxHp;return `<article><div><b>${G.HEROES.find(d=>d.id===h.id).name}</b><small>${esc(playerName(h.owner,state))}</small></div><div class="food-counter">${button('−','allocate-food',`data-id="${h.id}" data-delta="-1"`,h.hp<=h.startHp,'quiet')}<strong>${h.hp}/${max}</strong>${button('+','allocate-food',`data-id="${h.id}" data-delta="1"`,h.hp>=max||!state.campFood,'quiet')}</div></article>`;}).join('')}</div><p><b>Armazém: ${state.campFood}</b></p>${button('Concluir','food-finish','',false,'button')}</section></div>`;}
function exitConfirmHTML(){if(confirmation!=='exit')return '';return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true"><section class="arrival-card"><p class="eyebrow">Sair da missão</p><h2>O progresso desta missão será perdido</h2><p>Para abandonar a partida e preparar outra equipe, escreva <b>SAIR</b>.</p><label class="exit-confirm-label">Confirmação<input id="exit-confirm-input" autocomplete="off" value="${esc(exitText)}" placeholder="SAIR"></label><div class="actions-row">${button('Sair e apagar a missão','exit-confirm','',exitText!=='SAIR','button danger')}${button('Continuar na missão','cancel','',false,'quiet')}</div></section></div>`;}

// Mapa de referência: a arte da costa com névoa sobre o que ainda não está na mesa.
// A arte só aparece sob as peças reveladas; bordas suaves escondem a diferença entre o recorte e o desenho.
function landscape(visible,key,label=''){const r=missionRegions(),shapes=visible.filter(id=>r[id]).map(id=>`<polygon points="${r[id].polygon}"/>`).join('');return `<svg class="landscape" viewBox="0 0 1536 1024" preserveAspectRatio="none" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}><defs><filter id="soft-${key}" filterUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><feGaussianBlur stdDeviation="9"/></filter><mask id="reveal-${key}" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><rect width="1536" height="1024" fill="black"/><g filter="url(#soft-${key})"><g transform="scale(15.36 10.24)" fill="white" stroke="white" stroke-width="1.4" stroke-linejoin="round">${shapes}</g></g></mask></defs><image href="assets/tabuleiro-principal-final.webp" width="1536" height="1024" preserveAspectRatio="none" mask="url(#reveal-${key})"/></svg>`;}
function referenceMap(visible,highlight=[]){
  const r=missionRegions(),xs=[],ys=[];
  // Enquadra só o território revelado, com folga, mantendo a proporção do recorte (1,537).
  for(const id of visible.filter(id=>r[id]))for(const pair of r[id].polygon.split(' ')){const [x,y]=pair.split(',').map(Number);xs.push(x/100);ys.push(y/100);}
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),ratio=1.537/1.5;
  const k=Math.max(1,Math.min(4,Math.min(.8/Math.max(.05,x1-x0),.8/(ratio*Math.max(.05,y1-y0))))),cx=(x0+x1)/2,cy=(y0+y1)/2;
  const frame=`left:${(50-k*cx*100).toFixed(2)}%;top:${(50-k*cy*ratio*100).toFixed(2)}%;width:${(k*100).toFixed(2)}%;height:auto;max-width:none;min-width:0;aspect-ratio:3/2;margin:0`;
  return `<div class="reveal-map"><div class="mesa-natural natural-map" style="${frame}">${landscape(visible,'ref')}${highlight.filter(id=>r[id]).map(id=>`<span class="reveal-pin" style="left:${r[id].x}%;top:${r[id].y}%">${id}</span>`).join('')}</div></div>`;
}
// Revelação em dois passos: primeiro a cena (curta), depois só a instrução de mesa.
let revealPhase='story';
const encounterTokens=new Set();
function hiddenEncounter(){return false;}
// Tropas que outro aviso já vai anunciar (reforços ou resposta de Troia) não entram no aviso da peça: um de cada vez.
function announced(e){return responseQueue.slice(responseIndex).some(r=>r.id===e.id)||!!troopArrival?.groups.some(g=>g.zone===e.zone&&g.type===e.type);}
function placementOf(zone){
  const neighbours=G.ZONES[zone].links.filter(z=>known(z)&&!revealAlert.includes(z)),crates=state.supplies[zone]||0,token=(state.tokens[zone]&&!state.tokens[zone].resolved)||hiddenEncounter(zone),foes=state.enemies.filter(e=>e.zone===zone&&!announced(e));
  const troops=Object.values(foes.reduce((all,e)=>{(all[e.type]??={type:e.type,n:0}).n++;return all;},{}));
  const put=[crates?`${crates} caixa${crates>1?'s':''}`:'',token?'1 ficha de exploração':''].filter(Boolean);
  return {troops,where:neighbours.length?`Encaixem ${zone} junto a ${neighbours.join(' e ')}`:`Encaixem ${zone} conforme o mapa`,put};
}
function revealHTML(){
  if(!revealAlert.length||!state)return '';
  if(revealPhase==='story'){
    const scenes=revealAlert.map(zone=>`<article class="scene"><h2>${esc(zoneName(zone))}<span>${zone}</span></h2><p class="encounter-text">${esc(G.REVEAL_TEXT[zone]||'')}</p>${ORDERS[zone]?`<p class="chronicle-demand"><b>Nova ordem</b>${esc(ORDERS[zone])}</p>`:''}</article>`).join('');
    return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-label="Novo território"><section class="arrival-card scene-card"><p class="eyebrow">Novo território</p>${scenes}${button('Continuar','reveal-place','',false,'button')}</section></div>`;
  }
  const steps=revealAlert.map(zone=>{const p=placementOf(zone);return `<li><b>${p.where}.</b>${p.put.length?`<span>Coloquem nela: ${p.put.join(', ')}.</span>`:''}${p.troops.length?`<span>${p.put.length?'E também':'Coloquem nela'}:</span><div class="place-troops">${p.troops.map(t=>`<figure><span class="enemy-miniature ${t.type}" aria-hidden="true"></span><figcaption>${t.n}× ${G.TROOPS.types[t.type].name}</figcaption></figure>`).join('')}</div>`:''}</li>`;}).join('');
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="place-title"><section class="arrival-card place-card"><p class="eyebrow">Na mesa</p><ol class="place-steps" id="place-title">${steps}</ol>${referenceMap(state.revealed,revealAlert)}${button(revealAlert.length>1?'Peças encaixadas':'Peça encaixada','dismiss-reveal','',false,'button')}</section></div>`;
}
const ENCOUNTERS={
  crises:()=>{const council=state.encounter.council,labels={sacrifice:'Devolver Criseida com sacrifício a Apolo',briseida:'Devolver Criseida e tomar Briseida de Aquiles',refuse:'Recusar o resgate',intercede:'Pedir a um deus que interceda junto a Zeus (5 de Favor)'};return {title:council?'Conselho de guerra':'Crises pede a filha',text:council?'A peste não para. Os reis se reúnem em volta de Agamêmnon.':'O sacerdote de Apolo traz um resgate de ouro. Ele quer a filha.',detail:'',choices:G.crisesChoices(state).map(id=>[id,labels[id]]),disabled:state.favor<5?['intercede']:[]};},

  ability:()=>{const h=state.heroes.find(a=>a.id===state.encounter.hero),d=G.HEROES.find(x=>x.id===h.id);return {title:d.name+' aprende algo novo',text:'O feito de '+d.name+' correu entre os homens.',detail:'Virem a carta escolhida no tabuleiro do herói.',choices:state.encounter.choices.map(i=>[i,d.cards[i].name+(d.cards[i].passive?' · passiva':''),'Leiam a carta na mesa'])};},
  scales:()=>{const S=G.SCALES,pan=(name,side)=>name+': “'+side.motto+'” '+side.items.join(' ');return {title:S.title,text:S.text+' '+S.speech,detail:pan('Enfrentar Heitor',S.face)+' — '+pan('Afastar-se dele',S.flee)+' '+S.close+' (Pátroclo precisa cair na mesma peça de Heitor, depois de atacá-lo ao menos uma vez.)',choices:[['ok','A escolha é tua']]};},
  evolution:()=>({title:'A experiência da torre',text:'Lá do alto, os homens aprenderam como Troia se defende. Alguém vai levar essa experiência para a próxima batalha.',detail:'A equipe decide junta: qual herói recebe a experiência e passa para a próxima carta de evolução?',choices:state.encounter.choices.map(id=>{const h=state.heroes.find(a=>a.id===id);return [id,G.HEROES.find(d=>d.id===id).name+' → N'+(h.level+1)];})}),
};
const busy=()=>revealAlert.length||troopArrival||responseQueue.length||deathAlert?.length;
const ORDERS={};
// Ilustração no topo dos diálogos de encontro, crônica e história.
const SCENE_ART={crises:'cena-fogueiras'},CHRONICLE_ART={};
function sceneArt(name){return name?`<img class="scene-art" src="assets/identidade/${name}.webp" alt="" width="1100" height="619">`:'';}
function storyHTML(){
  if(!storyAlert||busy())return '';
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="story-title"><section class="arrival-card chronicle-card">${sceneArt(storyAlert.art)}<p class="eyebrow">${esc(storyAlert.eyebrow)}</p><h2 id="story-title">${esc(storyAlert.title)}</h2><p class="encounter-text">${esc(storyAlert.text)}</p>${storyAlert.order?`<p class="chronicle-demand"><b>Nova ordem</b>${esc(storyAlert.order)}</p>`:''}${button('Continuar','dismiss-story','',false,'button')}</section></div>`;
}
function findHTML(){
  if(!findAlert||busy())return '';
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="find-title"><section class="arrival-card chronicle-card"><p class="eyebrow">Descoberta em ${findAlert.zone}</p><h2 id="find-title">${esc(findAlert.title)}</h2><p class="encounter-text">${esc(findAlert.text)}</p>${button('Continuar','dismiss-find','',false,'button')}</section></div>`;
}
function detectStory(before){
  if(!before.heitorOut&&state.heitorOut)storyAlert={eyebrow:'O portão',title:'Heitor sai pelo portão',text:'O portão se abre e um homem vem à frente de todos, de elmo de crina, sem pressa. Heitor marcha direto para as tendas.',order:holdOrder()};
  if(state.lastFind)findAlert=state.lastFind;
}
const RESULT_TEXT={estacas:{success:'As estacas seguraram a primeira carga: Alarme −1.',fail:'Os troianos arrancaram as estacas: Alarme +1.'},batedores:{success:'Nenhum batedor mede a linha: Alarme −1.',fail:'Os batedores continuam a medir a linha.'},navios:{success:'A tocha foi apagada antes dos navios.',fail:'O fogo pegou numa tenda.'}};
// O que falta para vencer, de acordo com o Alarme.
function heitor(){return state.enemies.find(e=>e.type==='heitor');}
function holdOrder(){const away=state.heroes.some(h=>h.away),h=heitor();let o=state.heitorOut?`Heitor marcha para as tendas. Causem 4 de dano nele${h?` (faltam ${Math.max(0,h.hp-G.HEITOR_RETREAT)})`:''} e Troia recua com ele.`:'Segurem a linha: tropa nenhuma pode terminar a fase de Troia em A1 sem um herói de pé lá. Heitor sai no Alarme 11.';if(state.patroclus?.status==='active')o+=' Pátroclo luta no lugar de Aquiles: só a morte dele, de frente para Heitor, traz Aquiles de volta com a ira.';else if(away)o+=' Pátroclo caiu: Aquiles volta à guerra na próxima rodada, nos navios negros.';if(state.plagueActive)o+=' A peste continua: o Conselho de guerra, em A1, pode mudar a decisão.';return o;}
const reconOrder=holdOrder;
const campOrder=reconOrder;
// Trilha do Alarme com os patamares de reforço marcados.
const ALARM_MARKS={4:'Lanceiros',7:'Páris',11:'Heitor',15:'Reforços',18:'Em peso'};
function alarmTrack(){const max=G.alarmMax(state);return `<div class="alarm-track" role="img" aria-label="Alarme ${state.alarm} de ${max}"><div class="alarm-fill" style="width:${state.alarm/max*100}%"></div>${Object.entries(ALARM_MARKS).map(([n,label])=>`<span class="alarm-mark ${state.alarm>=n?'fired':''} ${n==11?'hero':''}" style="left:${n/max*100}%"><b>${n}</b><small>${label}</small></span>`).join('')}</div>`;}
// Ficha de progresso: o que falta para vencer e o que vem do Alarme, a cada crônica.
function progressHTML(){
  return `<div class="round-progress" aria-label="Progresso da missão"><span><b>${state.heitorOut?(heitor()?`${Math.max(0,heitor().hp-G.HEITOR_RETREAT)} de dano`:'Recuou'):'No portão'}</b>Heitor${state.heitorOut&&heitor()?' recua com mais':''}</span>${state.plagueActive?`<span class="urgent"><b>Ativa</b>peste de Apolo</span>`:''}<span class="${state.campDamage>=2?'urgent':''}"><b>${3-state.campDamage}/3</b>resistência das tendas</span></div>${alarmTrack()}`;}
// Ordens do comandante: lembram o que cada patamar do Alarme traz.
const COMMAND_WARNINGS=[null,
  {title:'Heitor se prepara',text:'No Alarme 11, Heitor sai pelo portão e marcha direto para as tendas. Com 4 de dano, ele recua, e Troia recua com ele. Guardem força para esse momento.'},
  {title:'Heitor está na planície',text:'Concentrem os golpes em Heitor. Mantenham alguém nas tendas: cada tropa que chega a A1 sem um herói lá queima o que resta delas.'},
  {title:'Troia em peso',text:'Troia joga tudo contra a linha. Agora é Heitor ou nada.'}];
let commandWarned=0;
function commandLevel(){if(!state||state.result||state.commanderDown)return 0;return state.alarm>=18?3:state.alarm>=11?2:state.alarm>=9?1:0;}
function commandHTML(){
  const level=commandLevel();if(level<=commandWarned||busy()||(state.chronicle?.round===state.round&&chronicleSeen<state.round))return '';
  const w=COMMAND_WARNINGS[level],owner=state.heroes.find(h=>h.id==='agamemnon')?.owner;
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="command-title"><section class="arrival-card command-card"><p class="eyebrow">Ordem do comandante${state.players>1&&owner?' · '+esc(playerName(owner,state)):''}</p><article><span class="mesa-avatar hero-agamemnon" aria-hidden="true"></span><div><h2 id="command-title">${w.title}</h2><p class="encounter-text">${w.text}</p></div></article>${button('Às ordens','dismiss-command','',false,'button')}</section></div>`;
}
function chronicleHTML(){
  const c=state?.chronicle;if(!c||c.round!==state.round||chronicleSeen>=state.round||busy()||state.result)return '';
  const entry=G.CHRONICLE[c.round],prev=state.chronicleResult&&RESULT_TEXT[state.chronicleResult.id]?.[state.chronicleResult.status];
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="chronicle-title"><section class="arrival-card chronicle-card">${sceneArt(CHRONICLE_ART[c.round])}<p class="eyebrow">${TROY_STEPS.chronicle} · rodada ${c.round}</p>${prev?`<p class="chronicle-prev">${esc(prev)}</p>`:''}<h2 id="chronicle-title">${esc(entry.title)}</h2><p class="encounter-text">${esc(entry.text)}</p>${entry.demand?`<p class="chronicle-demand"><b>Pedido</b>${esc(entry.demand)}</p>`:''}${button('Continuar','dismiss-chronicle','',false,'button')}</section></div>`;
}
function featHTML(){
  if(!featAlert.length||busy())return '';
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="feat-title"><section class="arrival-card feat-card"><p class="eyebrow">Feito pessoal</p>${featAlert.map(id=>{const p=G.PERSONAL[id];return `<article><span class="mesa-avatar hero-${id}" aria-hidden="true"></span><div><h2 id="feat-title">${esc(G.HEROES.find(h=>h.id===id).name)}: ${esc(p.name)}</h2><p>${esc(p.text)}</p><b>${esc(p.reward)}</b></div></article>`;}).join('')}${button('Continuar','dismiss-feat','',false,'button')}</section></div>`;
}
function encounterHTML(){
  if(!state?.encounter||busy()||featAlert.length||(state.encounter.id==='scales'&&(storyAlert||commandLevel()>commandWarned)))return '';
  const e=ENCOUNTERS[state.encounter.id]();
  if(e.choices.some(c=>c[2]))return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="encounter-title"><section class="arrival-card encounter-card"><p class="eyebrow">Novo aprendizado</p><h2 id="encounter-title">${esc(e.title)}</h2><p class="encounter-text">${esc(e.text)}</p>${e.detail?`<p>${esc(e.detail)}</p>`:''}<div class="confirm-choices">${e.choices.map(([id,label,detail])=>`<button class="pop-option card" data-command="encounter" data-choice="${id}">${M.ICONS.ability}<span><b>${esc(label)}</b><small>${esc(detail)}</small></span></button>`).join('')}</div></section></div>`;
  return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="encounter-title"><section class="arrival-card encounter-card">${sceneArt(SCENE_ART[state.encounter.id])}<p class="eyebrow">${state.encounter.id==='crises'?'O acampamento':'Encontro em '+state.encounter.zone}</p><h2 id="encounter-title">${e.title}</h2><p class="encounter-text">${esc(e.text)}</p>${e.detail?`<p>${esc(e.detail)}</p>`:''}${false&&encounterTokens.has(state.encounter.zone)?`<p class="encounter-token">Retirem a ficha de exploração de ${state.encounter.zone}.</p>`:''}<div class="actions-row stacked-choices">${e.choices.map(([id,label],i)=>button(label,'encounter',`data-choice="${id}"`,(e.disabled||[]).includes(id),i&&state.encounter.id!=='crises'?'quiet':state.encounter.id==='crises'?'quiet':'button')).join('')}</div></section></div>`;
}

let onboardingStep=0;
// A missão 2 não tem roteiros.



function freshExpedition(){commandWarned=0;return G.newGame({players:setup.players,playerNames:setup.playerNames,heroes:setup.heroes,owners:setup.owners,levels:setup.levels,abilities:campaign?undefined:setup.abilities,known:campaign?.team?.known,life:campaign?.team?.life,campFood:storeFromCampaign(),scrolls:campaign?.scrolls,legacy:campaign?.legacy,revealedZones:campaign?.revealedZones});}
function playerName(owner,source=setup){return source.playerNames?.[owner-1]||`Jogador ${owner}`;}
// A história da missão 1 em quadros: cada ilustração acompanha o seu parágrafo.
const STORY_ART='assets/';
function storyPanel(img,alt,text){return `<figure class="story-panel">${img?`<img src="${STORY_ART}${img}" alt="${alt}" loading="lazy" width="1280" height="720">`:''}<figcaption>${text}</figcaption></figure>`;}
const BOOK={eyebrow:'Missão 03 · Segurar a linha',teamTitle:'A equipe da campanha',storyTitle:'A noite das fogueiras'};
// A história: curta, uma frase por quadro.
function storySlides(){const taken=campaign?.legacy?.criseida==='taken';return [
 storyPanel('identidade/cena-fogueiras.webp','As fogueiras de Troia na planície','<p class="lead">Na noite depois do reconhecimento, mil fogueiras se acendem na planície. Heitor não vai esperar os gregos: ele vem até eles.</p>'),
 ...(taken?[storyPanel('','','<p class="encounter-text">Antes do amanhecer, um velho sacerdote desce a praia com um resgate de ouro. Ele não vem pelos gregos. Vem pela filha.</p>')]:[])];}
// Como se joga: só o que decide a partida.
function manualPages(){const legacy=legacyHTML();return [
 ...(legacy?[manualPage('','O que vocês trazem da missão 2',['Cada herói começa com a vida com que terminou a missão 2. Antes da primeira ação, o <b>armazém</b> repõe vida: 1 comida, 1 de vida.'],legacy)]:[]),
 manualPage('identidade/cena-acampamento-erguido.webp','O objetivo',['<b>Segurar a linha:</b> uma tropa que termina a fase de Troia em A1 sem um herói de pé lá causa 1 dano às tendas.','<b>Heitor</b> sai no Alarme 11 e marcha direto para as tendas. <b>Com 4 de dano, ele recua</b>, e Troia recua com ele.','<b>Perder:</b> todos os heróis caídos, ou 3 danos às tendas.']),
 manualPage('historia-m1/07-alarme-de-troia.webp','O Alarme de Troia',['A ofensiva não para: o Alarme sobe <b>2 a cada rodada</b>.'],staticAlarmTrack({4:'Lanceiros',7:'Páris',11:'Heitor',15:'Reforços',18:'Em peso'},11)),
 manualPage('','Os que atiram',['<b>Páris</b> atira a até 2 peças; os <b>arqueiros</b>, a 1 peça. Eles não precisam avançar.','De longe, o tiro tira <b>1 a menos</b>.','Arqueiros não devolvem golpe e não sofrem rebote.']),
 manualPage('','Os feitos de cada herói',featItems(),'<p class="manual-note">Cumprir o feito rende +1 Favor e Glória, guardada para o fim da campanha.</p>')];}
function mesaChecklist(){return ['Montem as peças que vocês já conhecem das missões anteriores.',`Coloquem as miniaturas de ${setup.heroes.map(id=>G.HEROES.find(h=>h.id===id).name).join(', ').replace(/, ([^,]*)$/,' e $1')} em <b>A1</b>.`,'Ponham no tabuleiro de cada herói as <b>fichas de comida</b> da vida que ele traz. O app pede o resto quando o armazém repuser.','Deixem as cartas de habilidade conhecidas para cima e as outras viradas.'];}
function setupMap(){return referenceMap(Object.keys(G.ZONES).filter(z=>!campaign?.revealedZones||campaign.revealedZones.includes(z)||['A1','N1','M1'].includes(z)),['A1']);}

function staticAlarmTrack(marks,heroAt){return `<div class="alarm-track" role="img" aria-label="Patamares do Alarme">${Object.entries(marks).map(([n,label])=>`<span class="alarm-mark ${n==heroAt?'hero':''}" style="left:${n/18*100}%"><b>${n}</b><small>${label}</small></span>`).join('')}</div>`;}
function manualPage(img,title,items,extra=''){return `<figure class="story-panel manual-page">${img?`<img src="${STORY_ART}${img}" alt="" loading="lazy" width="1280" height="720">`:''}<figcaption><h2>${title}</h2>${items.length?`<ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}${extra}</figcaption></figure>`;}
function featItems(){return setup.heroes.map(id=>`<b>${G.HEROES.find(h=>h.id===id).name} · ${G.PERSONAL[id].name}:</b> ${G.PERSONAL[id].text}`);}
function storyIntro(){return storySlides().join('')+manualPages().join('');}
// Preparação em livro: 1 a história, 2 o manual, 3 montar a mesa. As folhas viram para a frente e para trás.
const STORY_DELAY=2000;let storyStep=0,storySeen=0,storyTimer=null,manualStep=0,pageTurn='';
const bookPages=stage=>stage===1?storySlides():stage===2?manualPages():null;
function briefing(){document.body.classList.remove('game-active');
 const count=Math.max(3,setup.players),required=['odisseu','agamemnon'],names=(setup.playerNames||[]).map(n=>n.trim()),valid=(campaign||setup.heroes.every(id=>Number.isInteger(setup.abilities?.[id])))&&setup.heroes.length===count&&required.every(id=>setup.heroes.includes(id))&&new Set(setup.owners).size===setup.players&&names.length===setup.players&&names.every(Boolean)&&new Set(names.map(n=>n.toLocaleLowerCase('pt-BR'))).size===setup.players;
 const stage=Math.min(3,onboardingStep),titles=[campaign?BOOK.teamTitle:'Escolham seus heróis',BOOK.storyTitle,'Como se joga','Montem a mesa'];
 let content='',counter='';
 if(stage===0&&campaign)content=`<section class="team-setup"><p class="lead">A equipe que viu o portão de Troia segue junta, com a vida, os níveis e as habilidades que conquistou.</p><ul class="deployment-list hero-ships">${setup.heroes.map((id,i)=>{const d=G.HEROES.find(h=>h.id===id),life=campaign.team.life?.[id],known=campaign.team.known?.[id]||[];return `<li><img src="assets/identidade/heroi-${id}.webp" alt="${d.name}" width="960" height="540"><b>${d.name} · N${campaign.team.levels?.[id]||1}</b><small>Vida ${life??'cheia'} · ${known.map(n=>d.cards[n].name).join(', ')}</small><span>${esc(playerName(setup.owners[i]))}</span></li>`;}).join('')}</ul></section>${saved&&!saved.result?`<div class="resume-box"><p>Você tem uma missão salva na rodada ${saved.round}.</p>${button('Continuar missão salva','continue','',false,'button')}</div>`:''}`;
 else if(stage===0)content=`<section class="team-setup"><p class="onboard-warning">Não há uma missão 2 concluída neste navegador. Montem a equipe: todos começam com a vida cheia e o armazém vazio.</p><p><b>Odisseu e Agamêmnon conduzem a invasão e são obrigatórios.</b> Escolham os demais integrantes. As evoluções serão conquistadas durante a campanha.</p><label for="player-count">Quantas pessoas estão à mesa?</label><select id="player-count">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===setup.players?'selected':''}>${n} jogador${n>1?'es':''}</option>`).join('')}</select><fieldset class="player-names"><legend>Nomes dos jogadores</legend>${Array.from({length:setup.players},(_,i)=>`<label for="player-name-${i}">Jogador ${i+1}<input id="player-name-${i}" data-player-name="${i}" maxlength="30" value="${esc(setup.playerNames?.[i]||`Jogador ${i+1}`)}" autocomplete="off"></label>`).join('')}</fieldset><p>Escolha ${count} heróis · ${setup.heroes.length}/${count} selecionados. ${setup.players<3?'Distribuam os três heróis entre os participantes.':'Cada jogador controla um herói.'}</p><div class="hero-picker">${G.HEROES.map(h=>`<button class="hero-choice hero-${h.id} ${setup.heroes.includes(h.id)?'chosen':''}" data-command="toggle-hero" data-id="${h.id}" aria-pressed="${setup.heroes.includes(h.id)}" ${required.includes(h.id)?'disabled title="Herói obrigatório"':''}><span class="hero-portrait" aria-hidden="true"></span><b>${h.name}</b><small>${h.role}</small><span>${setup.heroes.includes(h.id)?'✓ Selecionado':'Selecionar'}</span></button>`).join('')}</div><div class="ownership">${setup.heroes.map((id,i)=>`<div><label for="owner-${id}">${G.HEROES.find(h=>h.id===id).name} · jogador</label><select id="owner-${id}" data-owner="${i}" ${setup.players===1?'disabled':''}>${Array.from({length:setup.players},(_,n)=>`<option value="${n+1}" ${setup.owners[i]===n+1?'selected':''}>${esc(playerName(n+1))}</option>`).join('')}</select></div>`).join('')}</div><section class="ability-setup"><h3>Habilidade inicial</h3><p>Cada herói começa com <b>uma</b> habilidade, escolhida pelo jogador. Leiam as cartas de habilidade de cada herói na mesa antes de escolher. As outras ficam viradas para baixo no tabuleiro e são aprendidas ao cumprir o feito pessoal e nos desafios da campanha.</p>${setup.heroes.map(id=>{const h=G.HEROES.find(x=>x.id===id);return `<fieldset class="ability-pick"><legend>${h.name}</legend><div>${h.cards.map((c,i)=>`<label class="${setup.abilities?.[id]===i?'chosen':''}"><input type="radio" name="ability-${id}" data-ability-hero="${id}" value="${i}" ${setup.abilities?.[id]===i?'checked':''}><b>${c.name}</b>${c.passive?'<small>passiva</small>':''}</label>`).join('')}</div></fieldset>`;}).join('')}</section>${!valid?'<p role="alert">Informe nomes diferentes, complete a equipe, atribua pelo menos um herói a cada jogador e escolha a habilidade inicial de cada herói.</p>':''}</section>${saved&&!saved.result?`<div class="resume-box"><p>Você tem uma missão salva na rodada ${saved.round}. Continuar preserva seus heróis e atributos.</p>${button('Continuar missão salva','continue','',false,'button')}</div>`:''}`;
 if(stage===1){const pages=storySlides();storyStep=Math.min(storyStep,pages.length-1);content=`<div class="story-slide">${pages[storyStep]}</div>`;counter=`${storyStep+1} de ${pages.length}`;}
 if(stage===2){const pages=manualPages();manualStep=Math.min(manualStep,pages.length-1);content=`<div class="story-slide">${pages[manualStep]}</div>`;counter=`${manualStep+1} de ${pages.length}`;}
 if(stage===3)content=`<div class="board-step"><div class="board-text"><ol class="setup-checklist">${mesaChecklist().map(i=>`<li>${i}</li>`).join('')}</ol>${saved&&!saved.result?'<p class="onboard-warning">Iniciar outra partida substituirá a missão salva. Vocês poderão confirmar antes.</p>':''}</div>${setupMap()}</div>`;
 app.innerHTML=`<section class="onboarding"><div class="onboard-banner"><p class="eyebrow">${BOOK.eyebrow}${counter?' · '+counter:''}</p><h1 id="onboard-title" tabindex="-1">${titles[stage]}</h1></div><div class="onboard-content book ${pageTurn?'turn-'+pageTurn:''}">${content}</div><nav class="onboard-actions" aria-label="Navegar pela preparação">${onboardingStep?button('← Retroceder','onboard-back','',false,'quiet'):''}${stage===3?button('Iniciar missão →','start','',false,'button'):button('Avançar →','onboard-next','',!valid,'button')}</nav><p class="saved-note">${storageOK?'O progresso da missão será salvo neste navegador.':'Armazenamento indisponível: mantenha esta página aberta.'}</p></section>${confirmation==='new'?newConfirm():''}`;
 pageTurn='';
 clearTimeout(storyTimer);if(stage===1&&storyStep>=storySeen){const next=app.querySelector('[data-command="onboard-next"]');if(next){next.disabled=true;next.classList.add('story-wait');storyTimer=setTimeout(()=>{storySeen=storyStep+1;next.disabled=false;next.classList.remove('story-wait');},STORY_DELAY);}}
}
// Há uma missão salva: oferecer voltar a ela, começar outra ou seguir na preparação.
// O que a missão 1 deixou (DILEMAS.md), mostrado sem números.
function legacyHTML(){const l=campaign?.legacy,sc=campaign?.scrolls||[];if(!campaign)return '';const lines=[l?.criseida==='taken'?'Criseida está no acampamento. O pai dela virá buscá-la.':l?.criseida==='respected'?'O santuário de Apolo foi respeitado.':'',sc.includes('rotas-2')?'A trilha da tabuinha liga P1 a P7 por dentro do bosque.':'',sc.includes('segredos-1')?'A planta das muralhas mostra o lado fraco do escudo de Heitor.':'',sc.includes('pastores-1')?'Os pastores do bosque mandaram comida ao armazém.':''].filter(Boolean);return lines.length?`<ul class="legacy-list">${lines.map(t=>`<li>${t}</li>`).join('')}</ul>`:'';}
function newConfirm(){const round=saved&&!saved.result?saved.round:null;return `<div class="arrival-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="new-title"><section class="arrival-card chronicle-card"><p class="eyebrow">Missão salva</p><h2 id="new-title">Há uma expedição em andamento</h2><p>${round?`A missão salva está na rodada ${round}. `:''}Começar uma nova missão apaga o progresso salvo neste navegador.</p><div class="confirm-choices">${round?button('Voltar à missão salva','continue','',false,'button'):''}${button('Começar uma nova missão','new-confirm','',false,'quiet danger-quiet')}${button('Voltar à preparação','cancel','',false,'quiet')}</div></section></div>`;}
function targets(action,h){
  const seen=state.enemies.filter(e=>known(e.zone));
  const stuck=h.cargo&&h.moves>0;
  if(action==='move')return stuck?[]:G.ZONES[h.zone].links.map(z=>[z,known(z)?G.ZONES[z].name:'o desconhecido (revela a peça)']);
  if(action==='attack')return seen.filter(e=>G.distance(h.zone,e.zone)<=G.HEROES.stats(h).range).map(e=>[e.id,`${G.TROOPS.label(e)} · ${e.hp}♥ · ATQ ${e.attack??2} · ARM ${e.armor??0}`]);
  if(action==='rescue')return state.heroes.filter(a=>a.hp===0&&a.zone===h.zone).map(a=>[a.id,G.HEROES.find(d=>d.id===a.id).name]);
  if(action.startsWith('card:')){
    const c=G.HEROES.find(d=>d.id===h.id).cards[Number(action.slice(5))];
    if(c.type==='multiRanged'){
      const groups=Object.values(seen.filter(e=>G.distance(h.zone,e.zone)<=1).reduce((all,e)=>{(all[e.zone]??=[]).push(e);return all;},{}));
      return groups.flatMap(group=>group.length===1?[[group[0].id,`${G.ZONES[group[0].zone].name} · ${G.TROOPS.label(group[0])}`]]:group.flatMap((enemy,i)=>group.slice(i+1).map(other=>[enemy.id+','+other.id,`${G.ZONES[enemy.zone].name} · ${G.TROOPS.label(enemy)} + ${G.TROOPS.label(other)}`])));
    }
    if(c.type==='intimidate')return seen.filter(e=>e.zone===h.zone).map(e=>[e.id,`${G.TROOPS.label(e)} · recuar e perder o próximo ataque`]);
    if(['attack','ranged','charge','precision'].includes(c.type))return seen.filter(e=>c.type==='charge'?G.distance(h.zone,e.zone)===1:G.distance(h.zone,e.zone)<=(['ranged','precision'].includes(c.type)?1:0)).map(e=>[e.id,`${G.TROOPS.label(e)} · ${G.ZONES[e.zone].name} · ${e.hp}♥`]);
    if(c.type==='refresh')return state.heroes.filter(a=>a.id!==h.id&&a.zone===h.zone&&a.hp>0&&a.used.length).map(a=>[a.id,G.HEROES.find(d=>d.id===a.id).name]);
    if(c.type==='healAlly')return state.heroes.filter(a=>a.id!==h.id&&a.zone===h.zone&&a.hp<G.HEROES.stats(a).maxHp).map(a=>[a.id,G.HEROES.find(d=>d.id===a.id).name]);
    if(c.type==='grantAction')return state.heroes.filter(a=>a.id!==h.id&&a.hp>0&&a.zone===h.zone).map(a=>[a.id,G.HEROES.find(d=>d.id===a.id).name]);
    if(c.type==='guide')return state.heroes.filter(a=>a.id!==h.id&&a.hp>0&&a.zone===h.zone&&!(a.cargo&&a.moves>0)).flatMap(a=>state.revealed.filter(z=>z!==h.zone&&G.knownDistance(state,h.zone,z)<=(a.cargo?1:c.value)).map(z=>[a.id+':'+z,G.HEROES.find(d=>d.id===a.id).name+' → '+G.ZONES[z].name]));
    if(c.type==='sprint')return Object.keys(G.ZONES).filter(z=>z!==h.zone&&G.distance(h.zone,z)<=(h.cargo?1:2)).map(z=>[z,known(z)?G.ZONES[z].name:'o desconhecido (revela)']);
  }return null;
}
function recentEvents(){return `<div class="event-log"><b>Últimos acontecimentos</b>${state.log.slice(0,4).map(msg=>`<p>${esc(msg)}</p>`).join('')}</div>`;}
const M=window.TroyMesa;
let popZone=null,focusEnemy=null,pingZone=null,pingTimer=null;
function ping(zone){pingZone=zone;clearTimeout(pingTimer);pingTimer=setTimeout(()=>{pingZone=null;app.querySelectorAll('.ping').forEach(el=>el.classList.remove('ping'));},1900);}
// O pedido da crônica aparece no mapa, nas peças onde ele se resolve.
const CHRONICLE_MARKS={estacas:{label:'Guardar as estacas',zones:()=>['A2']},batedores:{label:'Vigiar',zones:()=>state.enemies.filter(e=>e.type==='explorador').map(e=>e.zone)},navios:{label:'Proteger os navios',zones:()=>['N1']}};
function chronicleMark(id){const c=state.chronicle;if(!c||c.status!=='open'||c.favored)return '';const mark=CHRONICLE_MARKS[c.id];return mark&&mark.zones().includes(id)?`<small class="chronicle-chip" title="${esc(G.CHRONICLE[c.round].demand||'')}">${mark.label}</small>`:'';}
function mesaMap(byZone){
  const regions=missionRegions(),h=state.heroes.find(x=>x.id===selected),edges=[];
  const frontier=id=>!known(id)&&(G.ZONES[id].links.some(known)||(byZone[id]||[]).length>0);
  for(const [id,z] of Object.entries(G.ZONES))for(const next of z.links)if(id<next&&known(id)&&known(next)&&regions[id]&&regions[next]){const a=regions[id],b=regions[next];edges.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);}
  const zoneCls={},shapes=Object.entries(regions).filter(([id])=>known(id)||frontier(id)).map(([id,r])=>{const options=byZone[id]||[],cls=[id===h.zone?'current':'',options.some(o=>!o.disabled&&o.kind!=='god')?'actionable':'',options.some(o=>!o.disabled&&o.kind!=='god'&&o.target!=null&&String(o.target).split(',').some(t=>state.enemies.some(e=>e.id===t)))?'hostile':'',popZone===id?'open':'',pingZone===id?'ping':'',focusEnemy&&state.enemies.find(e=>e.id===focusEnemy)?.zone===id?'focus':'',known(id)?'':'unknown'].join(' ');zoneCls[id]=cls;return `<polygon class="zone-shape ${cls}" points="${r.polygon}" data-zone-shape="${id}"/>`;}).join('');
  const counters=Object.entries(regions).map(([id,r])=>{
    if(!known(id)){if(!frontier(id))return '';return `<button class="board-counters zone-anchor unknown-zone ${zoneCls[id]}" data-command="zone" data-zone="${id}" data-zone-anchor="${id}" style="left:${r.x}%;top:${r.y}%" aria-label="Território desconhecido"><span class="unknown-mark" aria-hidden="true">?</span></button>`;}
    const allies=state.heroes.filter(a=>a.zone===id),enemies=state.enemies.filter(e=>e.zone===id),options=byZone[id]||[];
    const crates=state.supplies[id]||0,token=state.tokens[id]&&!state.tokens[id].resolved;
    const chips=[id==='A1'?`<small>${state.built?'Acampamento instalado':'Clareira · acampamento'}</small>`:'',crates?`<small class="crate-chip">${M.ICONS.crate}${crates}</small>`:'',token?`<small class="token-chip" title="Ficha de exploração">${M.ICONS.explore}</small>`:'',id==='N4'&&state.patroclus?.status==='active'?`<small class="story-chip">Aquiles nos navios negros</small>`:'',chronicleMark(id)].join('');
    return `<button class="board-counters zone-anchor ${zoneCls[id]}" data-command="zone" data-zone="${id}" data-zone-anchor="${id}" style="left:${r.x}%;top:${r.y}%" aria-label="${G.ZONES[id].name}${options.length?`, ${options.length} opções`:''}">${chips?`<span class="zone-chips">${chips}</span>`:''}<span class="zone-beacon" aria-hidden="true"></span><span class="territory-tokens">${allies.map(a=>`<span class="unit-token greek-unit mesa-avatar hero-${a.id} ${a.id===selected?'selected':''} ${a.hp===0?'down':''}" data-hero="${a.id}" title="${G.HEROES.find(d=>d.id===a.id).name} · ${a.hp} de vida"><b>${a.hp}</b></span>`).join('')}${enemies.map(e=>`<span class="unit-token troop-art enemy-miniature ${e.type} ${G.TROOPS.types[e.type]?.hero?'trojan-hero-unit':'trojan-unit'} ${focusEnemy===e.id?'focused':''}" title="${G.TROOPS.label(e)} · ${e.hp} de vida"><span aria-hidden="true"></span><b>${e.hp}</b></span>`).join('')}</span>${state.guards[id]?`<small>🛡 ${state.guards[id]}</small>`:''}</button>`;
  }).join('');
  return `<div class="natural-map mesa-natural camera-map" style="${camera?`transform:translate(${camera.tx}px,${camera.ty}px) scale(${camera.k});--zoom:${camera.k}`:''}">${landscape(state.revealed,'map','Território do Desembarque: '+state.revealed.length+' peças reveladas')}<svg class="territory-overlay route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="territory-routes">${edges.join('')}</g></svg><svg class="zone-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${shapes}</svg>${counters}${state.built?'<div class="camp-miniatures" style="left:9%;top:62%" role="img" aria-label="Acampamento instalado"><span>⛺</span><span>⛺</span><span>⛺</span></div>':''}</div>`;
}
function missionHTML(){
  const camp=known('A1');
  const objective=reconOrder();
  const optional=[state.plagueActive?{label:'Peste de Apolo',current:true}:null,state.patroclus?.status==='active'?{label:'Pátroclo no lugar de Aquiles',current:true}:null,

    state.chronicle?.status==='open'?{label:'Crônica: '+G.CHRONICLE[state.chronicle.round].title,current:true}:null].filter(Boolean);
  const foes=state.enemies.filter(e=>known(e.zone)).length;
  return M.missionBlock({number:3,title:'Segurar a linha',phase:state.result?'':trojanPhase?'Fase de Troia':'Fase dos heróis · rodada '+state.round,objective,open:missionOpen,extra:`<button class="gods-toggle" data-command="toggle-gods" aria-expanded="${godsOpen}" title="Invocar os deuses">${M.ICONS.laurel}<span>Invocar</span></button><button class="troy-toggle" data-command="toggle-troy" aria-expanded="${troyOpen}">Troia${foes?` · ${foes}`:''}</button>${godsOpen?godsMenu():''}`,
    steps:[{label:state.heitorOut?(heitor()?`Ferir Heitor: faltam ${Math.max(0,heitor().hp-G.HEITOR_RETREAT)}`:'Heitor recuou'):'Segurar até Heitor',done:state.commanderDown,current:!state.commanderDown},...optional].filter(Boolean),
    alarm:{value:state.alarm,max:G.alarmMax(state),next:(()=>{const n=G.nextAlarm(state);return n.at>state.alarm&&n.at<G.alarmMax(state)?'próximo em '+n.at:n.at===G.alarmMax(state)&&state.alarm<n.at?'em peso no '+n.at:'';})()},resourcesOpen,
    resources:[{label:'Favor dos deuses',value:`${state.favor}<small>/${G.FAVOR_MAX}</small>`},{label:'Tendas',value:`${3-state.campDamage}<small>/3</small>`,alert:state.campDamage>=2},{label:'Armazém (comida)',value:state.campFood}]});
}
function resultHTML(){if(!state.result)return '';return `<section class="result mesa-result ${state.result}" role="status"><h2>${state.result==='victory'?'A linha segurou.':'A linha cedeu.'}</h2><p>${esc(state.reason)}</p>${state.result==='victory'?`<p>Para a missão seguinte: ${state.outcome.campFood} comida no armazém. As missões 4 a 6 ainda estão em preparação.</p>`:''}<div class="actions-row"><a class="button" href="../troia.html">Voltar à campanha</a></div></section>`;}
function troyHTML(){
  const step=G.nextAlarm(state),next=state.result?'':step.entries.length?`No Alarme ${step.at}, chegam reforços: ${Object.values(step.entries.reduce((all,[zone,type])=>{const key=type+zone;(all[key]??={zone,type,n:0}).n++;return all;},{})).map(g=>(g.n>1?g.n+'× ':'')+G.TROOPS.types[g.type].short+' em '+g.zone).join(', ')}.`:'';
  const seen={...state,enemies:state.enemies.filter(e=>known(e.zone))};
  return `<aside class="mesa-troy" aria-label="Tropas de Troia"><button class="troy-close" data-command="close-troy" aria-label="Fechar o painel de Troia">${M.ICONS.close}</button><h2>Troia</h2><p class="troy-sub">${state.result?'A missão terminou.':'O que cada tropa à vista fará na próxima resposta'}</p>${M.enemyPanel(G,seen,focusEnemy)}${state.result?'':alarmTrack()}${next?`<p class="troy-next">${next}</p>`:''}${recentEvents()}${button('Abandonar missão','setup','',false,'quiet troy-exit')}</aside>`;
}
function godOptions(byZone){
  if(state.result||state.foodSetup)return;
  const used=state.invokedRound===state.round,h=state.heroes.find(x=>x.id===selected);
  const add=(zone,god,target,title,extra={})=>{const g=G.GODS[god],poor=state.favor<g.cost;(byZone[zone]??=[]).push({action:'god:'+god,target,kind:'god',title,detail:g.cost+' de Favor · '+g.text,disabled:used||poor,reason:used?'Os deuses já foram invocados nesta rodada.':'Exige '+g.cost+' de Favor (vocês têm '+state.favor+').',...extra});};
  for(const zone of state.revealed){const tk=state.tokens[zone];if(tk&&!tk.resolved&&!tk.peeked)add(zone,'atena',zone,'Atena · revelar o que há aqui');}
}
function godsMenu(){
  const used=state.invokedRound===state.round,open=state.chronicle?.status==='open'&&!state.chronicle.favored;
  const row=(god,extraBlock='')=>{const g=G.GODS[god],block=used?'Os deuses já foram invocados nesta rodada.':state.favor<g.cost?`Exige ${g.cost} de Favor (vocês têm ${state.favor}).`:extraBlock;return `<button class="pop-option god" data-command="do" data-action="god:${god}" ${block?'disabled':''}>${M.ICONS.laurel}<span><b>${esc(g.name)} · ${esc(g.title)}</b><small>${esc(block||g.cost+' de Favor · '+g.text)}</small></span></button>`;};
  return `<div class="gods-menu" role="menu"><p class="pop-label">Favor ${state.favor}/${G.FAVOR_MAX} · uma invocação por rodada, sem gastar ação</p><div class="pop-group">${row('poseidon')}${row('zeus',open?'':'Não há pedido da crônica em aberto.')}</div><p class="gods-note">Atena aparece no menu da peça onde há uma ficha de exploração.</p></div>`;
}
function render(){if(trojanPhase&&state&&!busy()&&!(state.chronicle?.round===state.round&&chronicleSeen<state.round))trojanPhase=false;renderMesa();featSound();}
function renderMesa(){
  if(!state){document.body.classList.remove('mesa-mode');briefing();return;}document.body.classList.add('game-active','mesa-mode');
  const showRoutes=document.getElementById('show-routes')?.checked||false,h=state.heroes.find(x=>x.id===selected),byZone=M.zoneOptions(G,state,h,targets);godOptions(byZone);
  const actionsLeft=state.heroes.reduce((n,a)=>n+(a.hp>0?a.ap:0),0);
  const badges=a=>{const p=state.personal[a.id],def=G.PERSONAL[a.id];return `<small class="feat-line ${p.done?'done':''}" title="${esc(def.text)} Recompensa: ${esc(def.reward)}">${p.done?'✓ ':''}${esc(def.name)}${p.done||def.goal===1?'':` ${p.progress}/${def.goal}`}${a.patroclus?' · Pátroclo, com a armadura de Aquiles':a.away?' · nos navios negros':''}</small>`;};
  app.innerHTML=`${arrivalHTML()}${deathHTML()}${foodSetupHTML()}${exitConfirmHTML()}${responseHTML()}${storyOpen?`<div class="arrival-backdrop" role="dialog" aria-modal="true" aria-label="A história e as regras"><section class="arrival-card chronicle-card story-review"><p class="eyebrow">A história até aqui</p><div class="onboard-story">${storyIntro()}</div>${button('Voltar ao mapa','close-story','',false,'button')}</section></div>`:''}${revealHTML()}${findHTML()}${storyHTML()}${featHTML()}${encounterHTML()}${chronicleHTML()}${commandHTML()}<div class="mesa"><section class="mesa-board">${missionHTML()}<div class="mesa-map-wrap">${mesaMap(byZone)}<label class="route-chip"><input type="checkbox" id="show-routes"> Mostrar acessos</label><div class="camera-controls" aria-label="Câmera do mapa"><button data-command="zoom-out" aria-label="Afastar">−</button><button data-command="zoom-in" aria-label="Aproximar">+</button><button data-command="camera-all" aria-pressed="${cameraMode==='all'}">${cameraMode==='all'?'Seguir herói':'Ver tudo'}</button></div></div>${resultHTML()}</section>${troyHTML()}<footer class="mesa-heroes"><div class="hero-row" aria-label="Heróis">${M.heroStrip(G,state,selected,owner=>state.players>1?playerName(owner,state):'',badges)}</div><div class="mesa-end">${confirmation==='end'?`<div class="end-confirm" role="alertdialog"><p>Ainda há ${actionsLeft} ${actionsLeft===1?'ação disponível':'ações disponíveis'}. Encerrar descarta essas ações.</p>${button('Encerrar mesmo assim','end-confirm','',false,'button')}${button('Continuar jogando','cancel','',false,'quiet')}</div>`:''}${!state.result?`<button class="hourglass" data-command="end" aria-label="Encerrar rodada: Troia responde" title="Encerrar rodada">${M.ICONS.hourglass}</button>`:''}</div></footer></div>${popZone?M.popoverHTML(G,state,h,popZone,byZone[popZone]||[],{hidden:!known(popZone)}):''}${confirmation==='new'?newConfirm():''}`;
  document.getElementById('show-routes').checked=showRoutes;
  updateCamera();ambience();
  app.querySelector('.camera-map')?.addEventListener('transitionend',()=>M.placePopover(app));
  M.placePopover(app);
}
// Câmera: enquadra o herói selecionado e as peças ao redor (ou todo o território conhecido),
// deixando a faixa do bloco da missão livre no alto.
function cameraZones(){
  const regions=missionRegions(),visible=id=>regions[id]&&(known(id)||G.ZONES[id].links.some(known));
  if(cameraMode==='all')return Object.keys(regions).filter(visible);
  const enemy=focusEnemy&&state.enemies.find(e=>e.id===focusEnemy),center=enemy?enemy.zone:state.heroes.find(h=>h.id===selected).zone;
  return [center,...G.ZONES[center].links].filter(visible);
}
function updateCamera(){
  const wrap=app.querySelector('.mesa-map-wrap'),map=app.querySelector('.camera-map');if(!wrap||!map)return;
  if(cameraManual&&camera){applyCamera(map);return;}
  const W=wrap.clientWidth,H=wrap.clientHeight,top=12,bottom=56,availH=Math.max(120,H-top-bottom);
  const Wm=W,Hm=W/1.5,xs=[],ys=[];
  for(const id of cameraZones())for(const pair of window.TroyTerritory[id].polygon.split(' ')){const [x,y]=pair.split(',').map(Number);xs.push(x/100*Wm);ys.push(y/100*Hm);}
  if(!xs.length)return;
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),bw=Math.max(40,x1-x0),bh=Math.max(40,y1-y0);
  const k=Math.max(.9,Math.min(3.2,Math.min(W*.9/bw,availH*.9/bh)*zoomBias));
  const tx=W/2-k*(x0+x1)/2,ty=top+availH/2-k*(y0+y1)/2;
  camera={k,tx,ty};applyCamera(map);
}
function applyCamera(map=app.querySelector('.camera-map')){if(!map||!camera)return;map.style.transform=`translate(${camera.tx}px,${camera.ty}px) scale(${camera.k})`;map.style.setProperty('--zoom',camera.k);}
function zoomAt(px,py,factor){if(!camera)return;const k=Math.max(.6,Math.min(4,camera.k*factor)),f=k/camera.k;camera={k,tx:px-(px-camera.tx)*f,ty:py-(py-camera.ty)*f};cameraManual=true;popZone=null;app.querySelector('.mesa-pop')?.remove();applyCamera();}
function refocus(){cameraManual=false;zoomBias=1;}
function perform(action,target){const beforeCue=cueSnapshot(),beforeStory={heitorOut:state.heitorOut},actor=state.heroes.find(h=>h.id===selected),card=action.startsWith('card:')?G.HEROES.find(h=>h.id===selected).cards[Number(action.slice(5))]:null,before=state.enemies,beforeHeroes=state.heroes,god=action.startsWith('god:')?action.slice(4):null,result=god?G.invoke(state,god,target,selected):G.act(state,selected,action,target);if(!result.ok){notice(result.error);return;}state=result.state;detectReveals();detectStory(beforeStory);detectArrivals(before,state.enemies,'O movimento grego atraiu reforços');detectFallen(beforeHeroes,state.heroes);if(god)window.TroyAudio?.cue?.('deus-'+god);else if(action==='interact'&&['pickup','deliver'].includes(target))window.TroyAudio?.cue?.('caixa');else window.TroyAudio?.action(action,actor?.id,card);soundCues(beforeCue);refocus();pending=null;confirmation=null;persist();render();const life=lifeOrders(beforeHeroes,state.heroes);if(state.result){notice(state.reason);window.scrollTo({top:0,behavior:'smooth'});}else if(life)notice(life);}
function endRound(){trojanPhase=true;const beforeHeitor=state.heitorOut,beforeCue=cueSnapshot(),beforeState=JSON.parse(JSON.stringify(state)),before=state.enemies,beforeHeroes=state.heroes;state=G.trojanTurn(state);prepareTrojanResponse(beforeState,state);if(state.lastFind)findAlert=state.lastFind;if(!beforeHeitor&&state.heitorOut)storyAlert={eyebrow:'O portão',title:'Heitor sai pelo portão',text:'O portão se abre e um homem vem à frente de todos, de elmo de crina, sem pressa. Heitor marcha direto para as tendas.',order:holdOrder()};detectReveals();detectArrivals(before,state.enemies,'Reforços chegaram ao campo');detectFallen(beforeHeroes,state.heroes);if(responseQueue.length)window.TroyAudio?.trojan(responseQueue[0]);soundCues(beforeCue);refocus();refocus();pending=null;confirmation=null;persist();render();notice(state.result?state.reason:['Troia respondeu. Rodada '+state.round+' iniciada.',lifeOrders(beforeHeroes,state.heroes)].filter(Boolean).join(' '));if(state.result)window.scrollTo({top:0,behavior:'smooth'});}
function chooseEncounter(choice){const beforeCue=cueSnapshot(),beforeHeroes=state.heroes,before=state.enemies,result=G.choose(state,choice);if(!result.ok){notice(result.error);return;}state=result.state;learnStory();detectReveals();detectArrivals(before,state.enemies,'O espião chamou reforços');soundCues(beforeCue);persist();render();const life=lifeOrders(beforeHeroes,state.heroes);if(life)notice(life);}
function learnStory(){const l=state.lastLearn;if(!l)return;const d=G.HEROES.find(h=>h.id===l.hero);
  if(l.kind==='ability'){const c=d.cards[l.card];storyAlert={eyebrow:'Habilidade aprendida',title:d.name+' aprendeu '+c.name,text:'O que a habilidade faz está escrito na carta.',order:'Virem para cima a carta "'+c.name+'" no tabuleiro de '+d.name+'. A partir de agora ela aparece nas ações do herói.'};}
  else{storyAlert={eyebrow:'Evolução conquistada',title:d.name+' chega ao nível N'+l.level,text:'A experiência do mirante endurece '+d.name+' e os seus homens. O que muda está escrito na carta.',order:'Virem para cima a carta de evolução N'+l.level+' no tabuleiro de '+d.name+'. Os novos valores já valem nesta rodada.'};}}
function cueSnapshot(){return {built:state.built,reveal:revealAlert.length,arrival:troopArrival,death:deathAlert,feat:featAlert.length,find:findAlert,story:storyAlert,encounter:state.encounter,round:state.round};}
// Toca o som do momento mais marcante que acabou de acontecer.
let featCued=false,trojanPhase=false,resourcesOpen=false;
// Selo da fase de Troia nos avisos que ela abre, sempre na mesma ordem.
const TROY_STEPS={move:'Fase de Troia · 1 de 3 · Movimento e ataques',reinforce:'Fase de Troia · 2 de 3 · Reforços',chronicle:'Fase de Troia · 3 de 3 · Crônica'};
function featSound(){if(featAlert.length&&!featCued&&!busy()){featCued=true;window.TroyAudio?.cue?.('feito');}}
function soundCues(b){
  const A=window.TroyAudio;if(!A?.cue)return;
  // O som do feito toca quando o aviso do feito aparece na tela (featSound), não junto com os outros.
  const arrival=troopArrival&&troopArrival!==b.arrival;
  if(deathAlert&&deathAlert!==b.death)A.cue('queda');
  else if(state.built&&!b.built){A.cue('acampamento');if(arrival)setTimeout(()=>A.cue('troianos'),1600);}
  else if(state.encounter&&!b.encounter)A.cue('encontro');
  else if(arrival)A.cue('troianos');
  else if(findAlert&&findAlert!==b.find)A.cue('descoberta');
  else if(revealAlert.length>b.reveal)A.cue('revelar');
  else if(state.round>b.round&&state.chronicle?.round===state.round)A.cue('cronica');
}
function ambience(){const A=window.TroyAudio;if(!A?.setTension)return;if(!state||state.result){A.setTension(-1);A.setHeartbeat(false);return;}A.setTension(state.alarm>=12?2:state.alarm>=6?1:0);A.setHeartbeat(state.heroes.some(h=>h.hp>0&&h.hp<=2));}
function openZone(zone){popZone=popZone===zone?null:zone;pending=null;confirmation=null;render();}
function closeTroy(){if(!troyOpen)return false;troyOpen=false;document.body.classList.remove('troy-open');return true;}
app.addEventListener('click',event=>{
  if(dragMoved){dragMoved=false;event.stopPropagation();return;}
  // Gaveta de Troia aberta: um toque fora dela só fecha a gaveta.
  if(troyOpen&&!event.target.closest('.mesa-troy,.troy-toggle')){closeTroy();render();return;}
  if(godsOpen&&!event.target.closest('.gods-menu,.gods-toggle')){godsOpen=false;render();return;}
  const token=event.target.closest('.mesa-board [data-hero]');
  if(token&&token.dataset.hero!==selected){selected=token.dataset.hero;cameraMode='hero';refocus();focusEnemy=null;popZone=null;confirmation=null;ping(state.heroes.find(h=>h.id===selected).zone);render();return;}
  const shape=event.target.closest('[data-zone-shape]');if(shape){openZone(shape.dataset.zoneShape);return;}
  const b=event.target.closest('button[data-command]');if(!b||b.disabled)return;
  const c=b.dataset.command;
  if(c==='zone'){openZone(b.dataset.zone);return;}
  if(c==='close-pop'){popZone=null;render();return;}
  if(c==='do'){popZone=null;godsOpen=false;perform(b.dataset.action,b.dataset.target);return;}
  if(c==='focus-enemy'){if(closeTroy())focusEnemy=b.dataset.id;else focusEnemy=focusEnemy===b.dataset.id?null:b.dataset.id;cameraMode='hero';refocus();popZone=null;if(focusEnemy)ping(b.dataset.zone);render();return;}
  if(c==='reveal-place'){revealPhase='place';render();return;}
  if(c==='dismiss-reveal'){revealAlert=[];revealPhase='story';render();return;}
  if(c==='toggle-resources'){resourcesOpen=!resourcesOpen;render();return;}
  if(c==='dismiss-command'){commandWarned=commandLevel();render();return;}
  if(c==='dismiss-chronicle'){trojanPhase=false;chronicleSeen=state.round;render();return;}
  if(c==='dismiss-story'){storyAlert=null;render();return;}
  if(c==='toggle-mission'){missionOpen=!missionOpen;render();return;}
  if(c==='review-story'){storyOpen=true;missionOpen=false;render();return;}
  if(c==='close-story'){storyOpen=false;render();return;}
  if(c==='close-troy'){closeTroy();render();return;}
  if(c==='toggle-gods'){godsOpen=!godsOpen;popZone=null;render();return;}
  if(c==='toggle-troy'){troyOpen=!troyOpen;document.body.classList.toggle('troy-open',troyOpen);render();return;}
  if(c==='zoom-in'||c==='zoom-out'){const w=app.querySelector('.mesa-map-wrap');zoomAt(w.clientWidth/2,w.clientHeight/2,c==='zoom-in'?1.3:1/1.3);return;}
  if(c==='camera-all'){cameraMode=cameraMode==='all'?'hero':'all';refocus();popZone=null;render();return;}
  if(c==='dismiss-find'){findAlert=null;render();return;}
  if(c==='dismiss-feat'){featAlert=[];featCued=false;render();return;}
  if(c==='encounter'){chooseEncounter(b.dataset.choice);return;}
  if(c==='dismiss-arrival'){troopArrival=null;render();return;}
  if(c==='response-next'){responseIndex++;if(responseIndex>=responseQueue.length){responseQueue=[];responseIndex=0;if(troopArrival)window.TroyAudio?.effect('reveal');}else window.TroyAudio?.trojan(responseQueue[responseIndex]);render();return;}
  if(c==='dismiss-death'){deathAlert=null;render();return;}
  if(c==='allocate-food'){const result=G.allocateFood(state,b.dataset.id,Number(b.dataset.delta));if(!result.ok){notice(result.error);return;}state=result.state;persist();render();return;}
  if(c==='food-finish'){const result=G.finishFoodSetup(state);if(!result.ok){notice(result.error);return;}state=result.state;persist();render();return;}
  if(c==='onboard-next'||c==='onboard-back'){const fwd=c==='onboard-next',pages=bookPages(onboardingStep);pageTurn=fwd?'next':'back';
    if(onboardingStep===1&&pages){if(fwd&&storyStep<pages.length-1){storyStep++;briefing();return;}if(!fwd&&storyStep>0){storyStep--;briefing();return;}}
    if(onboardingStep===2&&pages){if(fwd&&manualStep<pages.length-1){manualStep++;briefing();return;}if(!fwd&&manualStep>0){manualStep--;briefing();return;}}
    onboardingStep=Math.max(0,Math.min(3,onboardingStep+(fwd?1:-1)));if(!fwd&&onboardingStep===1)storyStep=storySlides().length-1;if(!fwd&&onboardingStep===2)manualStep=manualPages().length-1;if(fwd&&onboardingStep===2)manualStep=0;briefing();document.getElementById('onboard-title').focus({preventScroll:true});return;}
  if(['start','new-confirm'].includes(c)){try{freshExpedition();}catch(e){notice(e.message);return;}}
  if(c==='start'){if((state&&!state.result)||(saved&&!saved.result)){confirmation='new';render();}else{state=freshExpedition();commandWarned=0;selected=state.heroes[0].id;revealAlert=[];persist();render();window.scrollTo(0,0);}}
  else if(c==='new-confirm'){state=freshExpedition();selected=state.heroes[0].id;pending=null;confirmation=null;revealAlert=[];persist();render();window.scrollTo(0,0);}
  else if(c==='continue'){confirmation=null;state=JSON.parse(JSON.stringify(saved));state.playerNames??=Array.from({length:state.players},(_,i)=>`Jogador ${i+1}`);chronicleSeen=state.round;selected=state.heroes[0].id;setup={players:state.players,playerNames:state.playerNames,heroes:state.heroes.map(h=>h.id),owners:state.heroes.map(h=>h.owner),levels:Object.fromEntries(state.heroes.map(h=>[h.id,h.level]))};render();}
  else if(c==='setup'){exitText='';confirmation='exit';render();setTimeout(()=>document.getElementById('exit-confirm-input')?.focus(),0);}
  else if(c==='exit-confirm'){if(exitText!=='SAIR')return;try{localStorage.removeItem(SAVE_KEY);}catch(e){}saved=null;onboardingStep=0;storyStep=0;storySeen=0;manualStep=0;commandWarned=0;state=null;pending=null;confirmation=null;exitText='';revealAlert=[];briefing();}
  else if(c==='toggle-hero'){const id=b.dataset.id;if(['odisseu','agamemnon'].includes(id)){notice('Odisseu e Agamêmnon são obrigatórios nesta campanha.');return;}const i=setup.heroes.indexOf(id);if(i>=0)setup.heroes.splice(i,1);else if(setup.heroes.length<Math.max(3,setup.players))setup.heroes.push(id);else{notice('Desmarque um herói antes de escolher outro.');return;}setup.owners=setup.heroes.map((_,i)=>i%setup.players+1);briefing();}
  else if(c==='hero'){selected=b.dataset.id;cameraMode='hero';refocus();focusEnemy=null;pending=null;confirmation=null;popZone=null;ping(state.heroes.find(h=>h.id===selected).zone);render();}
  else if(c==='cancel'){pending=null;confirmation=null;exitText='';render();}
  else if(c==='end'){if(state.heroes.some(h=>h.hp>0&&h.ap>0)){confirmation='end';pending=null;render();}else endRound();}
  else if(c==='end-confirm')endRound();
});
app.addEventListener('change',event=>{if(event.target.dataset.abilityHero){setup.abilities={...setup.abilities,[event.target.dataset.abilityHero]:Number(event.target.value)};briefing();}else if(event.target.id==='player-count'){setup.players=Number(event.target.value);setup.playerNames=Array.from({length:setup.players},(_,i)=>setup.playerNames?.[i]||`Jogador ${i+1}`);const count=Math.max(3,setup.players);for(const id of ['odisseu','agamemnon'])if(!setup.heroes.includes(id))setup.heroes.unshift(id);for(const h of G.HEROES)if(setup.heroes.length<count&&!setup.heroes.includes(h.id))setup.heroes.push(h.id);setup.heroes=setup.heroes.slice(0,count);setup.owners=setup.heroes.map((_,i)=>i%setup.players+1);briefing();}else if(event.target.dataset.playerName!==undefined){setup.playerNames[Number(event.target.dataset.playerName)]=event.target.value.trim();briefing();}else if(event.target.dataset.owner!==undefined){setup.owners[Number(event.target.dataset.owner)]=Number(event.target.value);briefing();}});
app.addEventListener('input',event=>{if(event.target.id==='exit-confirm-input'){exitText=event.target.value.toUpperCase();const confirmButton=app.querySelector('[data-command="exit-confirm"]');if(confirmButton)confirmButton.disabled=exitText!=='SAIR';}});
const rules=document.getElementById('rules');document.getElementById('rules-button').addEventListener('click',()=>rules.showModal());document.getElementById('close-rules').addEventListener('click',()=>rules.close());rules.addEventListener('click',e=>{if(e.target===rules){const r=rules.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)rules.close();}});
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||document.querySelector('dialog[open]'))return;if(closeTroy()){render();return;}if(popZone){popZone=null;render();}});
addEventListener('resize',()=>{updateCamera();M.placePopover(app);});
// Arrastar para mover o mapa; roda do mouse para aproximar no ponto do cursor.
app.addEventListener('pointerdown',event=>{
  const wrap=event.target.closest('.mesa-map-wrap');if(!wrap||!camera||event.button>0||event.target.closest('.camera-controls,.route-chip,.mesa-pop'))return;
  drag={x:event.clientX,y:event.clientY,tx:camera.tx,ty:camera.ty,id:event.pointerId};dragMoved=false;
});
app.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!dragMoved&&Math.hypot(dx,dy)<6)return;
  if(!dragMoved){dragMoved=true;cameraManual=true;popZone=null;app.querySelector('.mesa-pop')?.remove();const map=app.querySelector('.camera-map');if(map)map.style.transition='none';app.querySelector('.mesa-map-wrap')?.classList.add('dragging');}
  camera={...camera,tx:drag.tx+dx,ty:drag.ty+dy};applyCamera();
});
const endDrag=()=>{if(!drag)return;drag=null;const map=app.querySelector('.camera-map');if(map)map.style.transition='';app.querySelector('.mesa-map-wrap')?.classList.remove('dragging');if(dragMoved)setTimeout(()=>{dragMoved=false;},0);};
app.addEventListener('pointerup',endDrag);app.addEventListener('pointercancel',endDrag);
app.addEventListener('wheel',event=>{const wrap=event.target.closest('.mesa-map-wrap');if(!wrap||!camera)return;event.preventDefault();const r=wrap.getBoundingClientRect(),map=app.querySelector('.camera-map');if(map)map.style.transition='transform .12s ease-out';zoomAt(event.clientX-r.left,event.clientY-r.top,event.deltaY<0?1.15:1/1.15);},{passive:false});
render();
