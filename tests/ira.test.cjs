const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/ira.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const hector=s=>s.enemies.find(e=>e.type==='heitor');
const setup=(options={})=>G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô: um herói guarda o portão, os outros fecham o caminho à frente de Heitor, e Aquiles o persegue e o desafia quando ele para.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 const step=(h,goal)=>G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];
 const guard=ids.find(id=>id==='agamemnon')||ids.find(id=>id!=='aquiles');
 for(let turn=0;turn<40&&!s.result;turn++){
  if(options.deifobo&&s.favor>=2&&!s.deifoboUsed&&s.chase.status==='running'&&s.round>=3){const r=G.invoke(s,'deifobo');if(r.ok)s=r.state;}
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='scales'?'ok':e.choices?e.choices[0]:'ok').state;}
   const h=hero(s,id);if(s.result||!h||!h.hp||!h.ap||h.away)break;
   const hec=hector(s);if(!hec)break;
   const duel=G.interactions(s,h).find(x=>x.id==='duel'&&x.available);if(duel){doAct(id,'interact','duel');continue;}
   const here=s.enemies.filter(e=>e.zone===h.zone&&e.type!=='heitor');
   let goal;const chaser=G.championId(s),gateHeld=s.heroes.some(x=>x.id===guard&&x.hp>0&&x.zone==='M1');
   if(id===chaser)goal=hec.zone;
   else if(id===guard)goal='M1';
   else{const n=G.chaseNext(s);goal=gateHeld&&n&&n.ahead!=='M1'?n.ahead:'M1';}
   if(here.length&&(goal===h.zone||id!=='aquiles')){doAct(id,'attack',here.sort((a,b)=>a.hp-b.hp)[0].id);continue;}
   if(goal!==h.zone){doAct(id,'move',step(h,goal));continue;}
   if(h.used.length&&!here.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('Hector waits outside the Scaean gate and flees around the walls when Achilles comes within two areas',()=>{
 let s=setup();assert.equal(hector(s).zone,'M1');assert.equal(s.chase.status,'waiting');
 s=G.trojanTurn(s);assert.equal(s.chase.status,'waiting','Aquiles longe: ele espera');
 hero(s,'aquiles').zone='P4';s.revealed.push('P4','P7','B5');s=G.trojanTurn(s);assert.equal(s.chase.status,'running');assert.ok(G.CIRCUIT.includes(hector(s).zone));assert.notEqual(hector(s).zone,'M1');
});
test('Hector never attacks; a hero closing the next area makes him turn back, and Odysseus doing it is his feat',()=>{
 let s=setup();s.revealed.push('P4','P7','B5');hector(s).zone='B5';s.chase={status:'running',dir:1,laps:0};hero(s,'odisseu').zone='P4';hero(s,'agamemnon').zone='M1';
 const hp=s.heroes.map(h=>h.hp);s=G.trojanTurn(s);assert.equal(hector(s).zone,'M1','meia-volta pelo portão');assert.equal(s.chase.dir,-1);assert.ok(s.personal.odisseu.done);
 assert.ok(s.heroes.every((h,i)=>h.hp===hp[i]),'Heitor não fere ninguém');
});
test('passing an unguarded gate lets Hector escape; a guarded gate counts a lap, and after three he stops',()=>{
 let s=setup();s.revealed.push('P4','P7','B5');hector(s).zone='P7';s.chase={status:'running',dir:1,laps:0};s.heroes.forEach(h=>h.zone='N1');
 const out=G.trojanTurn(s);assert.equal(out.result,'defeat');assert.equal(out.outcome.legacy.heitor,'escaped');
 hero(s,'agamemnon').zone='M1';s.chase.laps=2;s=G.trojanTurn(s);assert.equal(s.result,null);assert.equal(s.chase.laps,3);assert.equal(s.chase.status,'stopped');
});
test('cornered between two closed areas, Hector stops and waits for the duel',()=>{
 let s=setup();s.revealed.push('P4','P7','B5');hector(s).zone='P4';s.chase={status:'running',dir:1,laps:0};hero(s,'odisseu').zone='P7';hero(s,'agamemnon').zone='B5';
 s=G.trojanTurn(s);assert.equal(s.chase.status,'stopped');assert.equal(hector(s).zone,'P4');
});
test('only Achilles may face Hector, and only once he has stopped: the duel ends the mission',()=>{
 let s=setup();s.revealed.push('P4','P7','B5');hector(s).zone='P4';s.chase={status:'running',dir:1,laps:0};hero(s,'aquiles').zone='P4';hero(s,'odisseu').zone='P4';
 assert.equal(G.act(s,'odisseu','attack',hector(s).id).ok,false,'os outros não ferem Heitor');assert.equal(G.act(s,'aquiles','attack',hector(s).id).ok,false,'em fuga, nem Aquiles');
 s.chase.status='stopped';s=act(s,'aquiles','interact','duel');assert.equal(s.result,'victory');assert.equal(s.outcome.legacy.heitor,'dead');assert.ok(s.personal.aquiles.done);assert.equal(s.duel,'ego');
 let w=setup({legacy:{patroclus:'dead'}});w.revealed.push('P4');hector(w).zone='P4';w.chase.status='stopped';hero(w,'aquiles').zone='P4';w=act(w,'aquiles','interact','duel');assert.equal(w.duel,'ira','com Pátroclo morto, é ira');
});
test('Agamemnon leads the coalition: his feat is Hector falling with no hero down',()=>{
 let s=setup();s.revealed.push('P4');hector(s).zone='P4';s.chase.status='stopped';hero(s,'aquiles').zone='P4';s=act(s,'aquiles','interact','duel');assert.ok(s.personal.agamemnon.done);
 let t=setup();t.revealed.push('P4');hector(t).zone='P4';t.chase.status='stopped';hero(t,'aquiles').zone='P4';hero(t,'odisseu').hp=0;hero(t,'odisseu').ap=0;t=act(t,'aquiles','interact','duel');assert.equal(t.personal.agamemnon.done,false);
});
test('Athena as Deiphobus makes Hector stop once',()=>{
 let s=setup({favor:4});s.chase.status='running';assert.equal(G.invoke(s,'deifobo').ok,false,'antes da segunda passagem pelo portão, não');s.chase.laps=2;s=G.invoke(s,'deifobo').state;assert.equal(s.chase.status,'stopped');s.round++;s.invokedRound=0;assert.equal(G.invoke(s,'deifobo').ok,false);
});
test('the bot brings Hector down in most rosters',()=>{
 const ids=['aquiles','ajax','odisseu','menelau','agamemnon'];let wins=0,games=0;
 for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];
  for(const deifobo of [false,true]){const s=play(team,{favor:3,deifobo});games++;if(s.result==='victory')wins++;}}
 // Meta do Felipe (05/10/2026): no máximo 6 vitórias em 14 (43%).
 assert.ok(wins/games>=.2&&wins/games<=6/14,'vitórias do robô: '+wins+'/'+games);
});
test('without Achilles, Ajax faces Hector; without both, Odysseus wounds him to death and he dies inside the walls',()=>{
 for(const [team,who] of [[['ajax','odisseu','agamemnon'],'ajax'],[['menelau','odisseu','agamemnon'],'odisseu']]){
  let s=G.newGame({heroes:team,players:1,owners:[1,1,1]});assert.equal(G.championId(s),who);s.revealed.push('P4');hector(s).zone='P4';s.chase.status='stopped';
  const other=team.find(id=>id!==who);hero(s,who).zone='P4';hero(s,other).zone='P4';
  assert.ok(!G.interactions(s,hero(s,other)).some(x=>x.id==='duel'),'só o campeão enfrenta Heitor');
  s=act(s,who,'interact','duel');assert.equal(s.result,'victory');assert.equal(s.duel,who);assert.equal(s.outcome.legacy.heitorSlayer,who);
  if(who==='odisseu')assert.match(s.reason,/dentro das muralhas/);}
});
