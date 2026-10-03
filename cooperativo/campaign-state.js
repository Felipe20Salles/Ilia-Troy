(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyCampaign=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function record(previous,outcome,heroes,players,playerNames=[]){
    const allowed=['desembarque','reconhecimento','segurar','muralhas','defesa'];
    const completed=Array.isArray(previous?.completed)?previous.completed.filter(x=>allowed.includes(x)):[];
    if(!allowed.includes(outcome?.completed))throw Error('Resultado de campanha inválido.');
    const safe=n=>Number.isInteger(n)&&n>=0&&n<=100?n:0;
    const resources={supplies:safe(previous?.resources?.supplies),horseMaterials:safe(previous?.resources?.horseMaterials),food:safe(previous?.resources?.food)};
    if(outcome.completed==='desembarque')resources.supplies=Math.max(resources.supplies,safe(outcome.supplies));
    if(Number.isInteger(outcome?.campFood))resources.food=safe(outcome.campFood);
    const survivors=heroes.filter(h=>h.hp>0),fallen=[...new Set([...(previous?.fallen||[]),...heroes.filter(h=>!h.hp).map(h=>h.id)])];
    const commanders={heitor:'alive',paris:'alive',eneias:'alive',sarpedon:'alive',...(previous?.commanders||{})};for(const [id,status]of Object.entries(outcome?.commanders||{}))commanders[id]=status==='dead'?'dead':'alive';
    const revealedZones=[...new Set([...(previous?.revealedZones||[]),...(outcome?.revealedZones||[])])];
    const activeOwners=[...new Set(survivors.map(h=>h.owner))].sort((a,b)=>a-b),activePlayers=Math.max(1,activeOwners.length);
    const owners=survivors.map(h=>Math.max(1,activeOwners.indexOf(h.owner)+1));
    const names=activeOwners.map((owner,i)=>String(playerNames[owner-1]||previous?.team?.playerNames?.[owner-1]||`Jogador ${i+1}`).trim().slice(0,30));
    // Versão 4: a equipe inteira segue (vida, níveis e habilidades passam de missão para missão), com os pergaminhos e as consequências.
    const roster=Array.isArray(outcome?.heroes)?outcome.heroes:null;
    const legacy={...(previous?.legacy||{}),...(outcome.completed==='desembarque'?{castaways:outcome.castawaysFate,beggar:outcome.beggarFate,lookout:!!outcome.lookoutTaken,burned:safe(outcome.burned)}:{}),...(outcome.legacy||{})};
    const scrolls=[...new Set([...(previous?.scrolls||[]),...(outcome?.scrolls||[])])];
    if(roster)return {version:4,completed:[...new Set([...completed,outcome.completed])],resources,fallen,commanders,revealedZones,scrolls,legacy,team:{players,playerNames:Array.from({length:players},(_,i)=>String(playerNames[i]||`Jogador ${i+1}`).trim().slice(0,30)),heroes:roster.map(h=>h.id),owners:roster.map(h=>h.owner),levels:Object.fromEntries(roster.map(h=>[h.id,h.level])),life:Object.fromEntries(roster.map(h=>[h.id,h.hp])),known:Object.fromEntries(roster.map(h=>[h.id,h.known]))}};
    return {version:3,completed:[...new Set([...completed,outcome.completed])],resources,intel:outcome.completed==='muralhas'?['M1']:(previous?.intel||[]),fallen,commanders,revealedZones,team:{players:activePlayers,playerNames:names,heroes:survivors.map(h=>h.id),owners,levels:Object.fromEntries(survivors.map(h=>[h.id,h.level??1])),food:Object.fromEntries(survivors.map(h=>[h.id,Math.max(0,Math.min(2,h.food??0))]))}};
  }
  return {record};
});
