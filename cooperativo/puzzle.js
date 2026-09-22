'use strict';
// Shared edge geometry makes neighbouring pieces complementary.
function puzzleEdge(x,y,dx,dy,bump){
  const shape=[[0,0],[36,0],[39,2],[36,7],[37,11],[42,14],[50,15],[58,14],[63,11],[64,7],[61,2],[64,0],[100,0]];
  return shape.map(([a,b])=>[x+dx*a-dy*b*bump,y+dy*a+dx*b*bump]);
}
function puzzlePoints(x,y){
  const top=puzzleEdge(x*100,y*100,1,0,y===0?0:(x+y)%2?1:-1);
  const right=puzzleEdge((x+1)*100,y*100,0,1,x===3?0:(x+y)%2?1:-1);
  const bottom=puzzleEdge(x*100,(y+1)*100,1,0,y===3?0:(x+y+1)%2?1:-1).reverse();
  const left=puzzleEdge(x*100,y*100,0,1,x===0?0:(x+y-1)%2?1:-1).reverse();
  return [...top,...right,...bottom,...left].map(p=>p.join(',')).join(' ');
}
function puzzleMap(s,selected){
  const zones=Object.entries(G.ZONES),hero=s.heroes.find(h=>h.id===selected);
  const bounds=Object.fromEntries(Object.keys(G.TERRAINS).map(t=>{const group=zones.filter(([id,z])=>z.terrain===t).map(([,z])=>z);const x=Math.min(...group.map(z=>z.x)),y=Math.min(...group.map(z=>z.y));return [t,{x,y,w:Math.max(...group.map(z=>z.x))-x+1,h:Math.max(...group.map(z=>z.y))-y+1}];}));
  const svg=`<svg class="puzzle-art" viewBox="-2 -2 404 404" aria-hidden="true"><defs>${zones.map(([id,z])=>`<clipPath id="piece-${id}"><polygon points="${puzzlePoints(z.x,z.y)}"/></clipPath>`).join('')}</defs>${zones.map(([id,z])=>{const b=bounds[z.terrain];return `<image href="assets/terrain/${z.art}.png" x="${b.x*100-16}" y="${b.y*100-16}" width="${b.w*100+32}" height="${b.h*100+32}" preserveAspectRatio="xMidYMid slice" clip-path="url(#piece-${id})"/><polygon points="${puzzlePoints(z.x,z.y)}" fill="none" stroke="#352d1d" stroke-width="2"/>`;}).join('')}${zones.filter(([id])=>id===hero.zone).map(([id,z])=>`<polygon points="${puzzlePoints(z.x,z.y)}" fill="#ffe0a015" stroke="#ffe0a0" stroke-width="2.5"/>`).join('')}</svg>`;
  return `<section class="map-panel" aria-label="Mapa da expedição"><div class="section-label"><span>ARREDORES DE TROIA</span><span>16 PEÇAS · EXPLORAÇÃO</span></div><div class="puzzle-scroll" tabindex="0" aria-label="Tabuleiro: deslize horizontalmente em telas pequenas"><div class="puzzle-map">${svg}${zones.map(([id,z])=>{
    const done=s.tasks.includes(z.terrain),searched=s.searched.includes(id),found=searched&&s.hidden[z.terrain]===id;
    const status=id==='N1'?'⚓ Embarque':z.search?(found?'✓ Encontrado':searched?'× Vazio':done?'✓ Busca encerrada':'⌕ Investigar'):'Passagem';
    return `<div class="puzzle-cell ${id===hero.zone?'selected':''}" style="left:${z.x*25}%;top:${z.y*25}%" aria-label="${z.name}: ${status}"><div class="piece-label"><b>${id}</b><span>${G.TERRAINS[z.terrain].name}</span></div><div class="piece-tokens">${s.heroes.filter(h=>h.zone===id).map(h=>`<span class="token ${h.hp===0?'down':''}" title="${G.HEROES.find(d=>d.id===h.id).name}">${G.HEROES.find(d=>d.id===h.id).initial} ${h.hp}♥</span>`).join('')}${s.enemies.filter(e=>e.zone===id).map(e=>`<span class="token enemy">Tr${e.id.slice(1)} ${e.hp}♥</span>`).join('')}</div><small class="piece-status ${found?'found':''}">${status}${s.guards[id]?' · 🛡 '+s.guards[id]:''}</small></div>`;
  }).join('')}</div></div><div class="map-note"><b>Uma peça = uma casa = 1 ação de movimento.</b> Mova apenas entre bordas compartilhadas, nunca na diagonal. ⌕ indica busca; investigar custa 1 ação e exige uma casa sem inimigos. No celular, deslize o tabuleiro para os lados.</div><div class="artifact-list">${Object.entries(G.ARTIFACTS).map(([id,a])=>`<div class="${s.tasks.includes(id)?'task-done':''}"><b>${s.tasks.includes(id)?'✓':'◇'} ${a.name}</b><small>${s.tasks.includes(id)?'Guardado pela equipe':a.sites.join(' ou ')}</small></div>`).join('')}</div></section>`;
}
