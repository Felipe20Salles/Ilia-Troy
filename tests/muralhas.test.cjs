const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/muralhas.js');
function play(ids,players=ids.length){let s=G.newGame({heroes:ids,players}),trace=[];
 const act=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(r.error);s=r.state;trace.push([s.round,id,action,target]);if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<G.MAX_ROUNDS&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<2;i++){
   const h=s.heroes.find(h=>h.id===id);if(s.result||!h.hp||!h.ap)break;
   if(s.scouted.length===2&&h.zone!=='A1'&&!s.heroes.some(a=>a.zone===h.zone&&!a.hp)){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,'A1')-G.distance(b,'A1'))[0];act(id,'move',step);continue;}
   const def=G.HEROES.find(d=>d.id===id),foe=s.enemies.find(e=>e.zone===h.zone);
   if(foe){const c=def.cards.findIndex((c,n)=>c.type==='attack'&&!h.used.includes(n));act(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down){act(id,'rescue',down.id);continue;}
   const interaction=G.interaction(s,h);if(interaction.available){act(id,'interact');continue;}
   if(h.hp<=3&&h.food){act(id,'eat');continue;}
   let goal=s.scouted.length===2?'A1':['M1','M2'].filter(z=>!s.scouted.includes(z)).sort((a,b)=>G.distance(h.zone,a)-G.distance(h.zone,b))[0];
   if(goal!==h.zone){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];act(id,'move',step);continue;}
   const ranged=def.cards.findIndex((c,n)=>c.type==='ranged'&&!h.used.includes(n));const enemy=s.enemies.find(e=>G.distance(h.zone,e.zone)<=1);if(ranged>=0&&enemy){act(id,'card:'+ranged,enemy.id);continue;}
   if(h.used.length){act(id,'rest');continue;}
   const guard=def.cards.findIndex((c,n)=>c.type==='guard'&&!h.used.includes(n));if(guard>=0&&enemy){act(id,'card:'+guard);continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return {s,trace};
}

test('all legal rosters and solo/two-player teams win through legal actions',()=>{const ids=G.HEROES.map(h=>h.id);for(let mask=0;mask<32;mask++){const team=ids.filter((_,i)=>mask&(1<<i));if(team.length<3)continue;const {s}=play(team);assert.equal(s.result,'victory',team.join(',')+' '+s.reason);assert.equal(s.scouted.length,2);}for(const n of [1,2])assert.equal(play(ids.slice(0,3),n).s.result,'victory');});
 test('scouting triggers counterattack once and retreat requires whole team',()=>{let s=G.newGame();s.enemies=[];s.heroes[0].zone='M1';s=G.act(s,'aquiles','interact').state;assert.equal(G.act(s,'aquiles','interact').ok,false);s.heroes[0].zone='M2';s=G.act(s,'aquiles','interact').state;assert.equal(s.retreatDeadline,7);assert.equal(s.enemies.length,2);s.heroes[1].zone='A1';assert.equal(G.act(s,'ajax','interact').ok,false);s.heroes.forEach(h=>{h.zone='A1';h.ap=2});assert.equal(G.act(s,'ajax','interact').state.result,'victory');});
 test('ambush is immediate spawn without damage and persists across saves',()=>{let s=G.newGame();s.heroes[0].zone='C1';s=G.act(s,'aquiles','move','B1').state;assert.equal(s.ambush,true);assert.equal(s.enemies.filter(e=>e.zone==='B2').length,1);assert.equal(s.heroes[0].hp,6);s=JSON.parse(JSON.stringify(s));assert.ok(G.validSave(s));s.heroes[1].zone='C1';s=G.act(s,'ajax','move','B1').state;assert.equal(s.enemies.filter(e=>e.zone==='B2').length,1);});
 test('safe base excludes enemy movement and time runs out',()=>{let s=G.newGame();s.enemies[0].zone='P3';s=G.trojanTurn(s);assert.equal(s.enemies[0].zone,'P3');assert.ok(s.heroes.every(h=>h.hp===6));s.round=14;assert.equal(G.trojanTurn(s).result,'defeat');s=G.newGame();s.scouted=['M1','M2'];s.retreatDeadline=6;s.round=6;assert.equal(G.trojanTurn(s).result,'defeat');});
 test('campaign preserves progress and replay cannot farm supplies',()=>{const C=require('../cooperativo/campaign-state.js'),s=G.newGame();let p=C.record(null,{completed:'desembarque',supplies:3},s.heroes,1);p=C.record(p,{completed:'muralhas'},s.heroes,1);p=C.record(p,{completed:'desembarque',supplies:3},s.heroes,1);assert.deepEqual(p.completed,['desembarque','muralhas']);assert.equal(p.resources.supplies,3);assert.deepEqual(p.intel,['M1','M2']);});
