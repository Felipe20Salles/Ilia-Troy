// A cidade de Troia como uma grade 3×3 encaixada acima do portão (09/10/2026): um tabuleiro só com o mapa principal.
// Na mesa, é um tabuleiro pequeno, como de xadrez, posto acima das muralhas. Muralha oeste liga a M4, Portão a M1, Santuário a M5.
// Coordenadas em % do tabuleiro principal (x da largura, y da altura); y negativo fica acima do mapa.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else{root.TroyGrade=factory();if(root.TroyTerritory)root.TroyTerritory={...root.TroyTerritory,...root.TroyGrade.TERRITORY};}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const IDS=['T1','T2','T3','T4','T5','T6','T7','T8','T9'];
  const NAMES={T1:'Palácio de Príamo',T2:'Templo de Atena',T3:'Quartel',T4:'Casa de Helena',T5:'Praça',T6:'Mercado',T7:'Muralha oeste',T8:'Portão Ceias',T9:'Santuário'};
  // Vizinhas na grade: só para os lados (como a torre no xadrez, uma casa por vez).
  const LINKS={T1:['T2','T4'],T2:['T1','T3','T5'],T3:['T2','T6'],T4:['T1','T5','T7'],T5:['T2','T4','T6','T8'],T6:['T3','T5','T9'],T7:['T4','T8'],T8:['T5','T7','T9'],T9:['T6','T8']};
  // Onde a grade encosta no mapa de fora. Cada missão decide quais dessas passagens estão abertas.
  const EXTERNAL={T7:'M4',T8:'M1',T9:'M5'};
  // A grade cobre de M4 a M5 (x 24 a 70) e encosta no alto das muralhas.
  const W=15.3,H=12,X0=24,Y0=-32,GAP=0.3;
  const TERRITORY={};IDS.forEach((id,i)=>{const c=i%3,r=Math.floor(i/3),x0=X0+c*W,y0=Y0+r*H,x1=x0+W-GAP,y1=y0+H-GAP;
    TERRITORY[id]={x:+(x0+W/2).toFixed(2),y:+(y0+H/2).toFixed(2),polygon:`${x0.toFixed(2)},${y0.toFixed(2)} ${x1.toFixed(2)},${y0.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)} ${x0.toFixed(2)},${y1.toFixed(2)}`,grid:true};});
  const isGrid=id=>IDS.includes(id);
  // O fundo da cidade no mapa: a arte noturna recortada no tamanho da grade, com o nome de cada casa.
  function backdrop(){const x=X0-0.4,y=Y0-0.4,w=3*W+0.6,h=3*H+0.6;
    return `<div class="troia-grade" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%" aria-hidden="true">${IDS.map((id,i)=>`<span class="troia-casa" style="grid-column:${i%3+1};grid-row:${Math.floor(i/3)+1}"><small>${id} · ${NAMES[id]}</small></span>`).join('')}</div>`;}
  return {IDS,NAMES,LINKS,EXTERNAL,TERRITORY,isGrid,backdrop};
});
