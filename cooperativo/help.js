// Ajuda da partida: duas abas no mesmo diálogo, "Manual da missão" (o texto de cada missão) e "Como jogar",
// uma cola de consulta rápida com os ícones que aparecem na tela.
(function(){
  const I=()=>window.TroyMesa?.ICONS||{};
  const icon=(name,cls='')=>`<span class="how-icon ${cls}" aria-hidden="true">${I()[name]||''}</span>`;
  const step=(n,title,text,visual)=>`<li class="how-step"><span class="how-num">${n}</span><div class="how-visual">${visual}</div><div><b>${title}</b><p>${text}</p></div></li>`;
  const action=(name,title,text,cls='')=>`<li class="how-action">${icon(name,cls)}<div><b>${title}</b><p>${text}</p></div></li>`;
  function howTo(){return `
  <section class="how" aria-label="Como jogar">
    <h3 class="how-title">A rodada, em quatro gestos</h3>
    <ol class="how-steps">
      ${step(1,'Toque no herói','Na barra de baixo. Ele fica destacado, e as peças onde pode agir acendem no mapa.','<span class="how-avatar"></span>')}
      ${step(2,'Toque numa peça','Abre o menu da peça, só com o que esse herói pode fazer ali. Cada escolha custa 1 ação; cada herói tem 2 por rodada.',`<span class="how-piece">P2</span>`)}
      ${step(3,'Faça o mesmo na mesa','Mova a miniatura, vire a carta, tire ou ponha fichas. O app pede uma coisa de cada vez, num aviso no meio da tela: faça e toque em Ok.','<span class="how-ok">Ok</span>')}
      ${step(4,'Toque na ampulheta','Quando o grupo quiser, mesmo com ações sobrando. Troia responde: cada tropa age, um passo por vez, e chegam reforços e a crônica.','<span class="how-glass">⧗</span>')}
    </ol>
    <h3 class="how-title">O que se faz numa peça</h3>
    <ul class="how-actions">
      ${action('move','Mover','Para uma peça vizinha que já está na mesa. Sair de uma peça com inimigos custa um golpe de fuga.')}
      ${action('attack','Atacar','Um inimigo na mesma peça. Se ele sobrevive e ataca de volta na fase de Troia, o herói revida.','danger')}
      ${action('explore','Investigar','A ficha de exploração da peça, sem inimigos nela. Traz comida, pergaminhos, encontros e as pistas que abrem o mapa.')}
      ${action('ability','Habilidade','Uma carta para cima no tabuleiro do herói. Depois de usada, vira.')}
      ${action('recover','Preparar','Desvira as cartas usadas, numa peça sem inimigos. Não cura.')}
      ${action('laurel','Rezar','+1 de Favor por 2 ações. Com uma ação só, a prece custa a ação e 1 comida do armazém.','gold')}
      ${action('heart','Socorrer','Um aliado caído na mesma peça, sem gastar ação: passa 1 da sua vida a ele.','danger')}
    </ul>
    <h3 class="how-title">Uma costa que se revela</h3>
    <div class="how-reveal">
      <div class="how-chain"><span class="how-piece">N1</span><span class="how-arrow">${I().explore||'⌕'}</span><span class="how-piece new">A2</span><span class="how-piece new">N2</span></div>
      <p>Só se anda por peças que já estão na mesa. <b>Investigar</b> uma ficha revela as peças para onde a pista aponta. O app mostra cada peça nova sozinha, com o que se vê ali e onde encaixá-la, e depois a ficha que vai nela. O mapa do app só mostra o que já está na mesa.</p>
    </div>
    <h3 class="how-title">O que está na tela</h3>
    <ul class="how-legend">
      <li>${icon('food','food')}<div><b>Vida é comida</b><p>As fichas de comida no tabuleiro são os homens do herói. O dano tira fichas; achar comida devolve. Sem fichas, ele cai.</p></div></li>
      <li><span class="how-icon flame" aria-hidden="true">🔥</span><div><b>A chama de Troia</b><p>O Alarme. Toque nela para ver cada tropa e o que fará na próxima fase de Troia.</p></div></li>
      <li>${icon('amphora')}<div><b>Recursos</b><p>O armazém, o Favor e os deuses: uma invocação por rodada, sem gastar ação.</p></div></li>
      <li>${icon('laurel','gold')}<div><b>Feitos</b><p>O objetivo pessoal de cada herói e o progresso.</p></div></li>
      <li>${icon('crate')}<div><b>Caixas</b><p>Existem só no app: o mapa mostra onde estão e quem carrega.</p></div></li>
      <li>${icon('bolt','gold')}<div><b>Ações</b><p>As bolinhas ao lado de cada herói: quantas ações restam na rodada.</p></div></li>
    </ul>
    <p class="how-foot">Sem dados e sem sorte: o dano é sempre o número do ataque, menos a Armadura do alvo.</p>
  </section>`;}
  function mount(){
    const d=document.getElementById('rules');if(!d||d.dataset.how)return;d.dataset.how='1';
    const nav=d.querySelector('.manual-switch');
    const missionNodes=[...d.children].filter(n=>!n.classList.contains('dialog-head')&&!n.classList.contains('manual-switch'));
    const mission=document.createElement('div');mission.className='help-panel';mission.dataset.panel='mission';missionNodes.forEach(n=>mission.appendChild(n));
    const how=document.createElement('div');how.className='help-panel';how.dataset.panel='how';how.hidden=true;how.innerHTML=howTo();
    const tabs=document.createElement('nav');tabs.className='help-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Ajuda');
    tabs.innerHTML='<button role="tab" data-tab="mission" aria-selected="true">Manual da missão</button><button role="tab" data-tab="how" aria-selected="false">Como jogar</button>';
    if(nav)nav.replaceWith(tabs);else d.querySelector('.dialog-head').after(tabs);
    d.append(mission,how);
    const head=d.querySelector('.dialog-head h2');if(head){head.dataset.mission=head.textContent.replace(/^Manual da missão · /,'');head.textContent=head.dataset.mission;}
    tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;tabs.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-selected',x===b));d.querySelectorAll('.help-panel').forEach(p=>p.hidden=p.dataset.panel!==b.dataset.tab);});
    const btn=document.getElementById('rules-button');if(btn){btn.setAttribute('aria-label','Ajuda');btn.title='Ajuda';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
