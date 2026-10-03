'use strict';
// Interface de mesa compartilhada: mapa como centro, heróis em avatares e Troia na lateral.
(function(){
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const svg=(path,size=18)=>`<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false">${path}</svg>`;
 const ICONS={
  heart:svg('<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/>'),
  bolt:svg('<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z" fill="currentColor"/>'),
  food:svg('<path d="M12 7.5c-1-2.6-2.6-3.6-4.4-3.4M12 7.5c2.2-1.8 5.6-1.2 6.9 1.7 1.5 3.4-.4 9.6-3.6 10.7-1.5.5-2.3-.3-3.3-.3s-1.8.8-3.3.3C5.5 18.8 3.6 12.6 5.1 9.2 6.4 6.3 9.8 5.7 12 7.5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'),
  crate:svg('<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z M4 7.5 12 11l8-3.5 M12 11v9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'),
  move:svg('<path d="M4 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  attack:svg('<path d="M5 19 19 5m-4 0h4v4M5 5l14 14m-4 0h4v-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'),
  explore:svg('<circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
  recover:svg('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
  ability:svg('<path d="m12 3 2.3 6.1L20.5 12l-6.2 2.9L12 21l-2.3-6.1L3.5 12l6.2-2.9z" fill="currentColor"/>'),
  hourglass:'<svg class="icon hourglass-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="hg-wood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f3d38b"/><stop offset=".55" stop-color="#b8853d"/><stop offset="1" stop-color="#6e4a1f"/></linearGradient><linearGradient id="hg-glass" x1="0" x2="1"><stop offset="0" stop-color="#cfe7ec" stop-opacity=".18"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".42"/><stop offset="1" stop-color="#cfe7ec" stop-opacity=".12"/></linearGradient><linearGradient id="hg-sand" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe29a"/><stop offset="1" stop-color="#d79a3c"/></linearGradient></defs><path d="M20 10h24c0 11-9.5 15.5-9.5 22S44 43 44 54H20c0-11 9.5-15.5 9.5-22S20 21 20 10z" fill="url(#hg-glass)" stroke="#e9f4f5" stroke-opacity=".55" stroke-width="1.2"/><path d="M23.6 15h16.8c-1.2 5.6-6.4 9.2-8.4 13.2-2-4-7.2-7.6-8.4-13.2z" fill="url(#hg-sand)"/><path d="M32 30v19" stroke="#ffd98a" stroke-width="1.1" stroke-dasharray="1.6 1.4"/><path d="M22.6 52c1.5-6.5 5.4-8.6 9.4-8.6s7.9 2.1 9.4 8.6z" fill="url(#hg-sand)"/><path d="M24 13.5c.4 3 1.6 5.4 3.4 7.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round" fill="none"/><rect x="13" y="5" width="38" height="6" rx="2" fill="url(#hg-wood)" stroke="#4a3112" stroke-width=".8"/><rect x="13" y="53" width="38" height="6" rx="2" fill="url(#hg-wood)" stroke="#4a3112" stroke-width=".8"/><rect x="15" y="11" width="3.2" height="42" rx="1.4" fill="url(#hg-wood)"/><rect x="45.8" y="11" width="3.2" height="42" rx="1.4" fill="url(#hg-wood)"/><circle cx="16.6" cy="8" r="1.1" fill="#5b3c15"/><circle cx="47.4" cy="8" r="1.1" fill="#5b3c15"/><circle cx="16.6" cy="56" r="1.1" fill="#5b3c15"/><circle cx="47.4" cy="56" r="1.1" fill="#5b3c15"/></svg>',
  laurel:svg('<path d="M12 20V9M12 9c-1.5-2.5-4-3.5-6-3 .2 2.6 2.6 4.4 6 3zM12 9c1.5-2.5 4-3.5 6-3-.2 2.6-2.6 4.4-6 3zM12 14c-2-1.8-4.6-2.2-6.5-1.2.8 2.3 3.6 3.2 6.5 1.2zM12 14c2-1.8 4.6-2.2 6.5-1.2-.8 2.3-3.6 3.2-6.5 1.2z" fill="currentColor" stroke="currentColor" stroke-width=".6" stroke-linejoin="round"/>'),
  amphora:svg('<path d="M9 3h6M10 3v2.5c-3 1.3-4.5 3.8-4.5 7 0 3.6 2.2 6.3 4.3 7.5h4.4c2.1-1.2 4.3-3.9 4.3-7.5 0-3.2-1.5-5.7-4.5-7V3M7.5 6.5C5.5 6.2 4.5 7.6 5 9.5M16.5 6.5c2-.3 3 1.1 2.5 3M6.5 12.5h11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',22),
  close:svg('<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',16)
 };
 const KIND_ICON={move:'move',attack:'attack',interact:'explore',rest:'recover',rescue:'recover',card:'ability',god:'laurel'};

 // Converte o alvo devolvido pelas regras na peça onde a ação acontece.
 function zoneOf(G,s,h,id){if(id==null)return h.zone;id=String(id);if(G.ZONES[id])return id;if(id.includes(':'))return id.split(':')[1];const enemy=s.enemies.find(e=>e.id===id.split(',')[0]);if(enemy)return enemy.zone;const ally=s.heroes.find(a=>a.id===id);return ally?ally.zone:h.zone;}

 // Todas as ações do herói, agrupadas pela peça do mapa onde serão resolvidas.
 function zoneOptions(G,s,h,targets){
  const byZone={},d=G.HEROES.find(x=>x.id===h.id),foes=s.enemies.some(e=>e.zone===h.zone),stats=G.HEROES.stats(h);
  const add=(zone,option)=>(byZone[zone]??=[]).push(option);
  const name=id=>G.HEROES.find(x=>x.id===id)?.name||id;
  const enemyName=id=>String(id).split(',').map(part=>{const e=s.enemies.find(x=>x.id===part);return e?`${G.TROOPS.label(e)} (${e.hp}♥)`:part;}).join(' + ');
  for(const [zone,label] of targets('move',h)||[])add(zone,{action:'move',target:zone,kind:'move',title:'Mover para '+label,detail:'1 ação'});
  for(const [id] of targets('attack',h)||[])add(zoneOf(G,s,h,id),{action:'attack',target:id,kind:'attack',title:'Atacar '+enemyName(id),detail:stats.attack+' de dano · 1 ação'});
  for(const [id] of targets('rescue',h)||[])add(h.zone,{action:'rescue',target:id,kind:'rescue',title:'Socorrer '+name(id),detail:'Sem ação · transfere 1 da sua vida',disabled:h.hp<2,reason:'Com 1 de vida não há o que transferir'});
  if(G.interactions){for(const x of G.interactions(s,h))add(h.zone,{action:'interact',target:x.id,kind:'interact',title:x.label,detail:x.detail+' · 1 ação',disabled:!x.available,reason:foes?'Há inimigos nesta peça':x.detail});}
  else{const interaction=G.interaction(s,h);if(interaction.available)add(h.zone,{action:'interact',kind:'interact',title:interaction.label,detail:interaction.detail+' · 1 ação',disabled:foes,reason:'Há inimigos nesta peça'});}
  if(h.used.length)add(h.zone,{action:'rest',kind:'rest',title:'Preparar habilidades',detail:'Desvirar as cartas usadas · 1 ação',disabled:foes,reason:'Há inimigos nesta peça'});
  d.cards.forEach((card,i)=>{
   if(card.passive||h.onceUsed.includes(i)||(h.known&&!h.known.includes(i)))return;
   const action='card:'+i,used=h.used.includes(i),list=targets(action,h);
   const base={action,kind:'card',card:card.name,disabled:used,reason:'Usada: desvire com Preparar habilidades'};
   if(list===null){if(card.type==='heal'&&h.hp>=stats.maxHp)return;add(h.zone,{...base,title:card.name,detail:'1 ação'});return;}
   for(const [id,label] of list){
    const title=card.type==='guide'?`${card.name} · ${label}`:['attack','ranged','charge','precision','multiRanged','intimidate'].includes(card.type)?`${card.name} · ${enemyName(id)}`:card.type==='sprint'?`${card.name} até ${label}`:`${card.name} · ${label}`;
    add(zoneOf(G,s,h,id),{...base,target:id,title,detail:'1 ação'});
   }
  });
  return byZone;
 }

 function popoverHTML(G,s,h,zone,options,{hidden=false}={}){
  const units=hidden?'':[...s.heroes.filter(a=>a.zone===zone).map(a=>`<li class="${a.hp?'':'down'}">${esc(G.HEROES.find(x=>x.id===a.id).name)} <span>${a.hp}♥</span></li>`),...s.enemies.filter(e=>e.zone===zone).map(e=>`<li class="foe">${esc(G.TROOPS.label(e))} <span>${e.hp}♥ · ATQ ${e.attack} · ARM ${e.armor}</span></li>`)].join('');
  const list=(items)=>items.map(o=>`<button class="pop-option ${o.kind}" data-command="do" data-action="${esc(o.action)}" ${o.target!=null?`data-target="${esc(o.target)}"`:''} ${o.disabled?'disabled':''}>${ICONS[KIND_ICON[o.kind]]}<span><b>${esc(o.title)}</b><small>${esc(o.disabled?o.reason:o.detail)}</small></span></button>`).join('');
  const actions=options.filter(o=>o.kind!=='card'&&o.kind!=='god'),cards=options.filter(o=>o.kind==='card'),gods=options.filter(o=>o.kind==='god');
  const blocked=!h.hp?'Herói caído: precisa ser socorrido.':!h.ap?'Sem ações nesta rodada.':s.result?'A missão terminou.':'';
  const heroName=G.HEROES.find(x=>x.id===h.id).name;
  const place=hidden?'Território desconhecido':G.ZONES[zone].name.replace(/^\S+\s·\s/,'');
  return `<div class="mesa-pop" role="dialog" aria-label="${esc(place)}" data-anchor="${zone}"><header><div><b>${hidden?'?':zone}</b><span>${esc(place)}</span></div><button class="pop-close" data-command="close-pop" aria-label="Fechar">${ICONS.close}</button></header>${units?`<ul class="pop-units">${units}</ul>`:''}${blocked?`<p class="pop-empty">${blocked}</p>`:options.length?`${actions.length?`<div class="pop-group">${list(actions)}</div>`:''}${cards.length?`<p class="pop-label">Habilidades de ${esc(heroName)}</p><div class="pop-group">${list(cards)}</div>`:''}`:`<p class="pop-empty">${esc(heroName)} não tem ações nesta peça.</p>`}${gods.length&&!s.result?`<p class="pop-label">Favor dos deuses · não gasta ação</p><div class="pop-group">${list(gods)}</div>`:''}</div>`;
 }

 // Posiciona o menu ao lado da peça clicada, sem sair da tela.
 function placePopover(root){
  const pop=root.querySelector('.mesa-pop');if(!pop)return;
  const anchor=root.querySelector(`[data-zone-anchor="${pop.dataset.anchor}"]`);if(!anchor){pop.remove();return;}
  const a=anchor.getBoundingClientRect(),p=pop.getBoundingClientRect(),gap=14,vw=innerWidth,vh=innerHeight;
  let left=a.right+gap;if(left+p.width>vw-12)left=a.left-gap-p.width;left=Math.max(12,Math.min(left,vw-p.width-12));
  let top=a.top+a.height/2-p.height/2;top=Math.max(12,Math.min(top,vh-p.height-12));
  pop.style.left=left+'px';pop.style.top=top+'px';pop.classList.add('placed');
 }

 function heroStrip(G,s,selected,playerName,badges=()=>''){
  const ready=a=>a.hp>0&&a.ap>0?0:1;return s.heroes.map((a,i)=>[a,i]).sort(([a,i],[b,j])=>ready(a)-ready(b)||i-j).map(([a])=>{const d=G.HEROES.find(x=>x.id===a.id),st=G.HEROES.stats(a),max=st.actions+a.bonusActions;
   const pips=Array.from({length:max},(_,i)=>`<i class="${i<a.ap?'on':''}"></i>`).join('');
   return `<button class="mesa-hero ${a.id===selected?'active':''} ${a.hp?'':'down'} ${a.hp&&!a.ap?'spent':''}" data-command="hero" data-id="${a.id}" aria-pressed="${a.id===selected}" aria-label="${esc(d.name)}, ${a.hp} de ${st.maxHp} de vida, ${a.ap} ações, em ${a.zone}"><span class="mesa-avatar hero-${a.id}" aria-hidden="true"><em>N${a.level}</em></span><span class="mesa-hero-id"><b>${esc(d.name)}</b><small>${[d.contingent,playerName(a.owner),a.zone].filter(Boolean).map(esc).join(' · ')}${a.cargo?' · '+ICONS.crate:''}</small>${badges(a)}</span><span class="mesa-hero-stats"><span class="stat hp" title="Vida: fichas de comida no tabuleiro do herói">${ICONS.food}<b>${a.hp}</b><small>/${st.maxHp}</small></span><span class="stat ap" title="Ações">${ICONS.bolt}<span class="pips">${pips}</span></span></span></button>`;}).join('');
 }

 function enemyPanel(G,s,focus){
  if(!s.enemies.length)return '<p class="troy-empty">Nenhuma tropa troiana em campo.</p>';
  return `<ul class="troy-list">${s.enemies.map(e=>{const t=G.TROOPS.types[e.type],pct=Math.max(0,Math.min(100,e.hp/t.hp*100));
   return `<li><button class="troy-unit ${focus===e.id?'active':''} ${t.hero?'commander':''}" data-command="focus-enemy" data-id="${e.id}" data-zone="${e.zone}"><span class="troy-thumb enemy-miniature ${e.type}" aria-hidden="true"></span><span class="troy-info"><b>${esc(G.TROOPS.label(e))}</b><span class="troy-meta"><span class="zone-chip">${e.zone}</span>ATQ ${e.attack} · ARM ${e.armor}</span><span class="hpbar" role="img" aria-label="${e.hp} de ${t.hp} de vida"><span style="width:${pct}%"></span></span><small>${esc(G.intent(e,s))}</small></span><span class="troy-hp">${e.hp}<small>/${t.hp}</small></span></button></li>`;}).join('')}</ul>`;
 }

 // Barra da missão em uma linha: título, ordem atual e números. O objetivo completo abre num toque.
 function missionBlock({number,title,objective,stats,steps,open=false,extra='',phase='',alarm=null,resources=null,resourcesOpen=false}){
  const current=steps?.find(st=>st.current)||null;
  const hud=alarm?`<div class="mission-hud"><span class="alarm-flame" data-heat="${alarm.value>=15?3:alarm.value>=11?2:alarm.value>=6?1:0}" title="Alarme de Troia"><svg viewBox="0 0 24 28" aria-hidden="true"><g class="flame"><path class="f-out" d="M12 1c1 4.5 6.5 7.2 6.5 13.5A6.5 6.5 0 0 1 12 27a6.5 6.5 0 0 1-6.5-6.5c0-3.4 1.8-5.2 3-6.8.3 2 1.2 3 2.3 3.4C10 12 10.8 6 12 1z"/><path class="f-in" d="M12 13c.6 2.4 3.3 3.7 3.3 6.9A3.3 3.3 0 0 1 12 23.2a3.3 3.3 0 0 1-3.3-3.3c0-2.3 1.9-3.7 3.3-6.9z"/></g></svg>${alarm.value}<small>/${alarm.max}</small>${alarm.next?`<span class="next">${esc(alarm.next)}</span>`:''}</span><button class="res-toggle" data-command="toggle-resources" aria-expanded="${resourcesOpen}" title="Recursos gregos">${ICONS.amphora}<span class="res-label">Recursos</span>${(resources||[]).some(r=>r.alert)?'<span class="warn" aria-label="atenção"></span>':''}</button>${resourcesOpen?`<div class="res-panel" role="dialog" aria-label="Recursos gregos"><dl>${(resources||[]).map(r=>`<div class="${r.alert?'alert':''}"><dt>${esc(r.label)}</dt><dd>${r.value}</dd></div>`).join('')}</dl></div>`:''}</div>`:'';
  
  const track=steps?.length?`<ol class="mission-track">${steps.map(st=>`<li class="${st.done?'done':''} ${st.current?'current':''}">${esc(st.label)}</li>`).join('')}</ol>`:'';
  return `<section class="mission-card ${open?'open':''}" aria-label="Missão ${number}"><button class="mission-title" data-command="toggle-mission" aria-expanded="${open}"><span class="mission-num">Missão ${number}</span><b>${esc(title)}</b>${phase?`<span class="phase-seal">${esc(phase)}</span>`:''}${current?`<em>${esc(current.label)}</em>`:''}<i aria-hidden="true">${open?'▴':'▾'}</i></button>${alarm?hud:`<dl class="mission-stats">${(stats||[]).map(st=>`<div class="${st.alert?'alert':''}"><dt>${esc(st.label)}</dt><dd>${st.value}</dd></div>`).join('')}</dl>`}${extra}${open?`<div class="mission-drop"><p class="mission-goal">${esc(objective)}</p>${track}<button class="quiet review-story" data-command="review-story">Rever a história e as regras</button></div>`:''}</section>`;
 }

 window.TroyMesa={ICONS,esc,zoneOf,zoneOptions,popoverHTML,placePopover,heroStrip,enemyPanel,missionBlock};
})();
