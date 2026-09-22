(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyCampaign=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function record(previous,outcome,heroes,players){
    const allowed=['desembarque','muralhas'];
    const completed=Array.isArray(previous?.completed)?previous.completed.filter(x=>allowed.includes(x)):[];
    if(!allowed.includes(outcome?.completed))throw Error('Resultado de campanha inválido.');
    const safe=n=>Number.isInteger(n)&&n>=0&&n<=100?n:0;
    const resources={supplies:safe(previous?.resources?.supplies),horseMaterials:safe(previous?.resources?.horseMaterials)};
    if(outcome.completed==='desembarque')resources.supplies=Math.max(resources.supplies,safe(outcome.supplies));
    return {version:1,completed:[...new Set([...completed,outcome.completed])],resources,intel:outcome.completed==='muralhas'?['M1','M2']:(previous?.intel||[]),team:{players,heroes:heroes.map(h=>h.id),owners:heroes.map(h=>h.owner)}};
  }
  return {record};
});
