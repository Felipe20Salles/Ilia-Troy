'use strict';
// Só as peças desta missão: o arquivo de território tem as peças de todas as missões.
function missionRegions(){return Object.fromEntries(Object.entries(window.TroyTerritory).filter(([id])=>G.ZONES[id]));}
function puzzleMap(s,selected){
  const regions=missionRegions(),hero=s.heroes.find(h=>h.id===selected),edges=[];
  for(const [id,z] of Object.entries(G.ZONES))for(const next of z.links)if(id<next){const a=regions[id],b=regions[next];edges.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);}
  return `<section class="map-panel natural-panel" aria-label="Território do Desembarque"><div class="section-label"><span>COSTA DA TRÓADE</span><span>10 PEÇAS · MISSÃO 1</span></div><label class="route-switch"><input type="checkbox" id="show-routes"> Mostrar acessos permitidos</label><details class="map-controls"><summary>Como ler este território</summary><p>Somente as peças desta missão estão expostas. As linhas douradas mostram as conexões permitidas: 1 movimento por região. Água, rochedos e espaços sem contorno não são casas. C2 faz parte desta missão.</p></details><div class="puzzle-scroll" tabindex="0" aria-label="Mapa panorâmico; deslize para explorar"><div class="natural-map" style="aspect-ratio:3/2;min-width:820px;overflow:hidden;margin-top:-13%"><svg class="landscape" viewBox="0 0 1536 1024" preserveAspectRatio="none" role="img" aria-label="Recorte da missão 1 do tabuleiro principal final"><image href="assets/setup/stage-5.png?v=3" width="1536" height="1024" preserveAspectRatio="none"/></svg><svg class="territory-overlay route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="territory-routes">${edges.join('')}</g></svg>${Object.entries(regions).map(([id,r])=>{
    const allies=s.heroes.filter(h=>h.zone===id),enemies=s.enemies.filter(e=>e.zone===id);
    const status=id==='A1'?(s.built?'Acampamento instalado':'Clareira · construir'):(s.supplies[id]||0)?'▣':'';
    return `<div class="board-counters ${id===hero.zone?'selected':''}" style="left:${r.x}%;top:${r.y}%" aria-label="${G.ZONES[id].name}">${id!=='A1'&&s.supplies[id]>0?'<span class="exploration-token" role="img" aria-label="Ficha de exploração">⌕</span>':status?`<small>${status}</small>`:''}<div class="territory-tokens">${allies.map(h=>`<span class="unit-token greek-unit ${h.hp===0?'down':''}" title="${G.HEROES.find(d=>d.id===h.id).name} · ${h.hp} de vida"><span aria-hidden="true">♙</span><b>${h.hp}</b></span>`).join('')}${enemies.map(e=>`<span class="unit-token ${G.TROOPS.types[e.type]?.hero?'trojan-hero-unit':'trojan-unit'} troop-${e.type}" title="${G.TROOPS.label(e)} · ${e.hp} de vida"><span aria-hidden="true">${G.TROOPS.types[e.type]?.hero?'♛':'♟'}</span><b>${e.hp}</b></span>`).join('')}</div>${s.guards[id]?`<small>🛡 ${s.guards[id]}</small>`:''}</div>`;
  }).join('')}${s.built?'<div class="camp-miniatures" style="left:9%;top:62%" role="img" aria-label="Três tendas construídas, representadas por marcadores removíveis"><span>⛺</span><span>⛺</span><span>⛺</span></div>':''}</div></div><div class="map-note"><b>N1–N4: use a faixa de areia; a água é intransitável.</b> As linhas douradas correspondem às opções de Mover. A arte já contém tendas; o marcador de instalação indica quando a base está pronta.</div></section>`;
}

// Mapa leve (11/10/2026): a máscara borrada das peças reveladas era redesenhada pelo navegador a cada clique e a cada
// quadro do zoom da câmera, o que travava notebooks mais fracos. Agora ela é desenhada uma vez por conjunto de peças
// num canvas e vira uma imagem comum; enquanto a imagem não fica pronta (ou se o navegador não sabe borrar no canvas),
// o desenho antigo em SVG continua valendo.
(function(){
  const cache=new Map(),pending=new Set();let board=null,boardReady=null;
  const canBlur=(()=>{try{const c=document.createElement('canvas').getContext('2d');c.filter='blur(2px)';return c.filter==='blur(2px)';}catch(e){return false;}})();
  function loadBoard(){if(boardReady)return boardReady;boardReady=new Promise((ok,fail)=>{const im=new Image();im.onload=()=>{board=im;ok(im);};im.onerror=fail;im.src='assets/tabuleiro-principal-final.webp';});return boardReady;}
  function paint(ids){const W=1536,H=1024,regions=window.TroyTerritory||{};
    const mask=document.createElement('canvas');mask.width=W;mask.height=H;const m=mask.getContext('2d');
    m.filter='blur(9px)';m.fillStyle='#fff';m.strokeStyle='#fff';m.lineJoin='round';m.lineWidth=1.4*12.8;
    for(const id of ids){const r=regions[id];if(!r)continue;const pts=r.polygon.split(' ').map(p=>p.split(',').map(Number));m.beginPath();pts.forEach(([x,y],i)=>i?m.lineTo(x*15.36,y*10.24):m.moveTo(x*15.36,y*10.24));m.closePath();m.fill();m.stroke();}
    const out=document.createElement('canvas');out.width=W;out.height=H;const g=out.getContext('2d');
    g.drawImage(board,0,0,W,H);g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);
    return new Promise(ok=>out.toBlob(b=>ok(b?URL.createObjectURL(b):null),'image/webp',.88));}
  window.fastLandscape=function(visible,svg,label){
    if(!canBlur)return svg;const ids=[...new Set(visible)].sort(),key=ids.join(',');
    if(cache.get(key))return `<img class="landscape" src="${cache.get(key)}" alt="${label||''}" ${label?'':'aria-hidden="true"'} draggable="false">`;
    if(!pending.has(key)){pending.add(key);loadBoard().then(()=>paint(ids)).then(url=>{if(url){cache.set(key,url);if(typeof render==='function')requestAnimationFrame(()=>render());}}).catch(()=>{});}
    return svg;};
})();
