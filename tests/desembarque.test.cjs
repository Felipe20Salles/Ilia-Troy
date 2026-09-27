const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/landing.js');
function play(ids,players=ids.length){let s=G.newGame({heroes:ids,players}),trace=[];
 const act=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(r.error);s=r.state;trace.push([s.round,id,action,target]);if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<G.MAX_ROUNDS&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<2;i++){
   const h=s.heroes.find(h=>h.id===id);if(s.result||!h.hp||!h.ap)break;
   const def=G.HEROES.find(d=>d.id===id),foe=s.enemies.find(e=>e.zone===h.zone);
   if(foe){const c=def.cards.findIndex((c,n)=>c.type==='attack'&&!h.used.includes(n));act(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down){act(id,'rescue',down.id);continue;}
   const interaction=G.interaction(s,h);if(interaction.available){act(id,'interact');continue;}
   if(h.hp<=3){act(id,'rest');continue;}
   let goal='A1';if(!h.cargo&&s.delivered<s.required){const supply=Object.keys(s.supplies).filter(k=>s.supplies[k]>0).sort((a,b)=>G.distance(h.zone,a)-G.distance(h.zone,b));if(supply.length)goal=supply[0];}
   if(goal!==h.zone){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];act(id,'move',step);continue;}
   const ranged=def.cards.findIndex((c,n)=>c.type==='ranged'&&!h.used.includes(n));const enemy=s.enemies.find(e=>G.distance(h.zone,e.zone)<=1);if(ranged>=0&&enemy){act(id,'card:'+ranged,enemy.id);continue;}
   const nearby=s.enemies.find(e=>G.distance(h.zone,e.zone)===1);if(s.built&&nearby&&s.heroes.filter(a=>a.zone==='A1'&&a.hp>0).length>1){act(id,'move',nearby.zone);continue;}
   if(h.used.length){act(id,'rest');continue;}
   const guard=def.cards.findIndex((c,n)=>c.type==='guard'&&!h.used.includes(n));if(guard>=0){act(id,'card:'+guard);continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return {s,trace};
}

test('every legal roster of 3, 4 or 5 heroes can finish by legal actions',()=>{
 const ids=G.HEROES.map(h=>h.id);
 for(let mask=0;mask<32;mask++){const team=ids.filter((_,i)=>mask&(1<<i));if(team.length<3)continue;const {s}=play(team);assert.equal(s.result,'victory',team.join(','));assert.ok(s.round<=10);assert.equal(s.delivered,team.length);assert.equal(s.outcome.next,'Diante das muralhas');}
});
test('solo and two player teams finish, ownership and setup validate',()=>{
 for(const players of [1,2]){const {s}=play(['menelau','agamemnon','odisseu'],players);assert.equal(s.result,'victory');assert.ok(G.validSave(s));}
 for(const options of [{players:0},{players:6},{players:5},{players:2,owners:[1,1,1]},{heroes:['ajax','ajax','aquiles']},{heroes:['ajax','aquiles','unknown']}])assert.throws(()=>G.newGame(options));
});
test('failed actions neither mutate state nor spend actions',()=>{
 const s=G.newGame(),before=JSON.stringify(s);assert.equal(G.act(s,'aquiles','move','P3').ok,false);assert.equal(G.act(s,'aquiles','attack','e1').ok,false);assert.equal(G.act(s,'aquiles','card:2').ok,false);assert.equal(JSON.stringify(s),before);
});
test('boxes are conserved across collection, carrying, delivery and save reload',()=>{
 let s=G.newGame();s=G.act(s,'aquiles','interact').state;assert.equal(s.heroes[0].cargo,true);assert.equal(s.supplies.N1,1);assert.equal(G.act(s,'aquiles','interact').ok,false);
 s.heroes[0].zone='A1';s=G.act(s,'aquiles','interact').state;assert.equal(s.delivered,1);assert.equal(s.heroes[0].cargo,false);assert.ok(G.validSave(JSON.parse(JSON.stringify(s))));
});
test('enemies block pickup, delivery and installation',()=>{
 let s=G.newGame();s.enemies[0].zone='N1';assert.equal(G.act(s,'aquiles','interact').ok,false);s.heroes[0].zone='A1';s.heroes[0].cargo=true;s.supplies.N1--;s.enemies[0].zone='A1';assert.equal(G.act(s,'aquiles','interact').ok,false);
});
test('falling drops cargo once and rescue gives no immediate actions',()=>{
 let s=G.newGame();s=G.act(s,'aquiles','interact').state;s.heroes[0].zone='N2';s.heroes[0].hp=1;s.enemies[0].zone='N2';s=G.trojanTurn(s);assert.equal(s.heroes[0].hp,0);assert.equal(s.heroes[0].cargo,false);assert.equal(s.supplies.N2,2);assert.ok(G.validSave(s));
 s.heroes[1].zone='N2';s=G.act(s,'ajax','rescue','aquiles').state;assert.equal(s.heroes[0].hp,2);assert.equal(s.heroes[0].ap,0);
});
test('installation requires all boxes and announces a scaled counterattack',()=>{
 for(const count of [3,4,5]){let s=G.newGame({players:count,heroes:G.HEROES.slice(0,count).map(h=>h.id)});s.heroes[0].zone='A1';assert.equal(G.act(s,s.heroes[0].id,'interact').ok,false);s.delivered=count;s.supplies={};s.enemies=[];s=G.act(s,s.heroes[0].id,'interact').state;assert.ok(s.built);assert.equal(s.enemies.length,Math.ceil(count/2));assert.equal(s.held,0);assert.ok(G.validSave(s));}
});
test('defense requires a standing hero and no enemies for consecutive responses',()=>{
 let s=G.newGame();s.delivered=s.required;s.supplies={};s.built=true;s.enemies=[];s.heroes[0].zone='A1';s=G.trojanTurn(s);assert.equal(s.held,1);s.heroes[0].zone='A2';s=G.trojanTurn(s);assert.equal(s.held,0);
 s.enemies=[];s.heroes[0].zone='A1';s=G.trojanTurn(s);assert.equal(s.held,1);s.enemies=[];s.round=10;s=G.trojanTurn(s);assert.equal(s.result,'victory');assert.deepEqual(G.trojanTurn(s),s);
});
test('arrival at camp prevents defense progress but does not sabotage immediately',()=>{
 let s=G.newGame();s.delivered=s.required;s.supplies={};s.built=true;s.heroes[0].zone='A1';s.enemies[0].zone='P1';s=G.trojanTurn(s);assert.equal(s.enemies[0].zone,'A1');assert.equal(s.held,0);assert.equal(s.campDamage,0);assert.equal(s.heroes[0].hp,6);
});
test('sabotage, incapacitation and timeout each cause defeat',()=>{
 let s=G.newGame();s.campDamage=2;s.enemies[0].zone='A1';assert.equal(G.trojanTurn(s).result,'defeat');
 s=G.newGame();s.round=10;s.enemies=[];assert.equal(G.trojanTurn(s).result,'defeat');
 s=G.newGame();s.heroes.forEach(h=>{h.hp=0;h.ap=0;});s.heroes[0].hp=1;s.enemies[0].zone='N1';assert.equal(G.trojanTurn(s).result,'defeat');
});
test('all fourteen active skills have a legal effect and spend one action',()=>{
 for(const def of G.HEROES)for(let i=0;i<3;i++){
  if(def.cards[i].passive)continue;
  let s=G.newGame({players:5,heroes:G.HEROES.map(h=>h.id)});const h=s.heroes.find(h=>h.id===def.id),ally=s.heroes.find(a=>a.id!==h.id);h.hp=3;s.enemies=[{id:'e1',hp:3,zone:'N2'}];let target;
  const type=def.cards[i].type;
  if(type==='attack'){h.zone='N2';target='e1';}else if(['charge','ranged','precision'].includes(type))target='e1';
  else if(type==='healAlly'){ally.hp=0;ally.ap=0;target=ally.id;}
  else if(type==='grantAction')target=ally.id;else if(type==='guide')target=ally.id+':P1';else if(type==='sprint')target='A1';else if(type==='refresh'){ally.used=[0,1];target=ally.id;}
  const r=G.act(s,h.id,'card:'+i,target);assert.ok(r.ok,def.name+' '+def.cards[i].name+': '+r.error);const after=r.state.heroes.find(a=>a.id===h.id);assert.equal(after.ap,1);assert.ok((def.cards[i].once?after.onceUsed:after.used).includes(i));assert.ok(G.validSave(r.state));
 }
});
test('Agamemnon prepares ally skills without adding actions or targeting himself',()=>{
 let s=G.newGame({players:5,heroes:G.HEROES.map(h=>h.id)});s.heroes[0].used=[0];s.heroes[0].ap=0;assert.equal(G.act(s,'agamemnon','card:1','agamemnon').ok,false);s=G.act(s,'agamemnon','card:1','aquiles').state;assert.deepEqual(s.heroes[0].used,[]);assert.equal(s.heroes[0].ap,0);assert.equal(G.act(s,'agamemnon','card:1','aquiles').ok,false);
});
test('save validation rejects missing boxes, duplicate owners and impossible board positions',()=>{
 const s=G.newGame();assert.ok(G.validSave(s));s.supplies.N1++;assert.equal(G.validSave(s),false);
 const t=G.newGame({players:3});t.heroes[0].owner=2;assert.equal(G.validSave(t),false);
 const u=G.newGame();u.heroes[0].zone='T1';assert.equal(G.validSave(u),false);
});
