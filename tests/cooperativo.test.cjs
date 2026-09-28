const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/game.js');
test('invalid actions do not spend actions or mutate the state',()=>{
 const s=G.newGame(),before=JSON.stringify(s);assert.equal(G.act(s,'aquiles','move','N1').ok,true);
 assert.equal(G.act(s,'aquiles','move','T1').ok,false);assert.equal(G.act(s,'aquiles','card:0','e2').ok,false);assert.equal(JSON.stringify(s),before);
});
test('basic attacks, ability exhaustion and recovery',()=>{
 let s=G.newGame();s.heroes[0].zone='P1';s.enemies[0].zone='P1';let r=G.act(s,'aquiles','card:0','e1');assert.equal(r.ok,true);s=r.state;
 assert.equal(s.enemies.length,0);assert.equal(G.act(s,'aquiles','card:0','e2').ok,false);s=G.act(s,'aquiles','rest').state;assert.deepEqual(s.heroes[0].used,[]);assert.equal(s.heroes[0].ap,0);
});
test('objectives require clear areas and final departure requires every hero',()=>{
 let s=G.newGame(()=>0);s.heroes[0].zone='C2';s.enemies[0].zone='C2';assert.equal(G.act(s,'aquiles','interact').ok,false);
 s.enemies=[];s=G.act(s,'aquiles','interact').state;assert.deepEqual(s.tasks,['C']);s.tasks=['C','B','A'];s.heroes[0].zone='N1';assert.equal(G.act(s,'aquiles','interact').ok,false);
 s.heroes.forEach(h=>h.zone='N1');s=G.act(s,'aquiles','interact').state;assert.equal(s.result,'victory');assert.deepEqual(G.trojanTurn(s),s);
});
test('enemy advances without attacking on the same activation',()=>{
 let s=G.newGame();s.heroes.forEach(h=>h.zone='N1');s.enemies[0].zone='A1';s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.id==='e1').zone,'N1');assert.equal(s.shipDamage,0);
});
test('enemy attacks are intercepted and guard absorbs damage',()=>{
 let s=G.newGame();s.heroes[1].zone='P1';s.enemies[0].zone='P1';s=G.act(s,'ajax','card:0').state;s=G.trojanTurn(s);assert.equal(s.heroes[1].hp,6);assert.deepEqual(s.guards,{});
});
test('all defeat conditions end the game',()=>{
 let s=G.newGame();s.shipDamage=2;s.enemies[0].zone='N1';assert.equal(G.trojanTurn(s).result,'defeat');
 s=G.newGame();s.round=G.MAX_ROUNDS;s.enemies=[];assert.equal(G.trojanTurn(s).result,'defeat');
 s=G.newGame();s.enemies[0].zone='P1';s.heroes.forEach(h=>{h.zone='P1';h.hp=0;});s.heroes[0].hp=1;assert.equal(G.trojanTurn(s).result,'defeat');
});
test('rescue revives without granting extra actions during that round',()=>{
 let s=G.newGame();s.heroes[1].hp=0;s.heroes[1].ap=0;s=G.act(s,'aquiles','rescue','ajax').state;assert.equal(s.heroes[1].hp,2);assert.equal(s.heroes[1].ap,0);
});
test('all nine abilities have valid effects and consume one action',()=>{
 for(const def of G.HEROES)for(let i=0;i<def.cards.length;i++){
  let s=G.newGame();const h=s.heroes.find(x=>x.id===def.id);h.hp=3;s.enemies[0].zone='A2';let target;
  switch(def.cards[i].type){
   case 'attack':h.zone='A2';target='e1';break;
   case 'charge':case 'ranged':target='e1';break;
   case 'healAlly':s.heroes[0].hp=0;target='aquiles';break;
   case 'guide':target='aquiles:N1';break;
   case 'sprint':target='P3';break;
  }
  const r=G.act(s,def.id,'card:'+i,target);assert.equal(r.ok,true,def.cards[i].name);assert.equal(r.state.heroes.find(x=>x.id===def.id).ap,1);assert.ok(r.state.heroes.find(x=>x.id===def.id).used.includes(i));
 }
});
test('save validation rejects broken state and accepts a played round',()=>{
 assert.equal(G.validSave(G.newGame()),true);assert.equal(G.validSave(G.trojanTurn(G.newGame())),true);assert.equal(G.validSave({version:1}),false);
 const s=G.newGame();s.heroes[0].zone='unknown';assert.equal(G.validSave(s),false);
});
