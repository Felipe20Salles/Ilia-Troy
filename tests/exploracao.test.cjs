const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/game.js');
function run(bits){let n=0,s=G.newGame(()=>bits[n++]);const trace=[];
 const step=(h,a,t)=>{const r=G.act(s,h,a,t);if(!r.ok)throw Error(r.error+' '+h+' '+a+' '+t);s=r.state;trace.push([s.round,h,a,t]);};
 function move(h,goal){const p=s.heroes.find(x=>x.id===h);if(p.zone===goal)return false;const next=G.ZONES[p.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];step(h,'move',next);return true;}
 for(let round=1;round<=G.MAX_ROUNDS&&!s.result;round++){
  for(const id of ['ajax','odisseu','aquiles'])for(let action=0;action<2;action++){
   const h=s.heroes.find(h=>h.id===id);if(s.result)break;if(h.hp===0||!h.ap)break;
   const e=s.enemies.find(e=>e.zone===h.zone);
   if(e){const card=G.HEROES.find(d=>d.id===id).cards.findIndex((c,i)=>c.type==='attack'&&!h.used.includes(i));step(id,card>=0?'card:'+card:'attack',e.id);continue;}
   if(s.tasks.length===3){if(move(id,'N1'))continue;if(s.heroes.every(h=>h.zone==='N1'&&h.hp>0)){step(id,'interact');break;}const shipEnemy=s.enemies.find(e=>e.zone==='N1');if(shipEnemy){step(id,'attack',shipEnemy.id);continue;}break;}
   const terrain=id==='ajax'?'A':id==='odisseu'?(!s.tasks.includes('C')?'C':'B'):null;
   if(terrain&&!s.tasks.includes(terrain)){
    const sites=G.ARTIFACTS[terrain].sites.filter(z=>!s.searched.includes(z));const goal=sites.sort((a,b)=>G.distance(h.zone,a)-G.distance(h.zone,b))[0];
    if(h.zone===goal)step(id,'interact');else move(id,goal);continue;
   }
   const goal=id==='ajax'?'P3':'A1';if(move(id,goal))continue;
   if(h.used.length||h.hp<6){step(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
 }
 return {result:s.result,round:s.round,damage:s.shipDamage,hp:s.heroes.map(h=>h.hp),trace};}

test('all eight hiding configurations can be won through legal actions',()=>{
 for(let i=0;i<8;i++){const r=run([i&1?.99:0,i&2?.99:0,i&4?.99:0]);assert.equal(r.result,'victory');assert.ok(r.round>4&&r.round<=G.MAX_ROUNDS);}
});
test('16 connected pieces use reciprocal borders and exactly two hill search sites',()=>{
 assert.equal(Object.keys(G.ZONES).length,16);assert.deepEqual(G.ARTIFACTS.C.sites,['C2','C3']);assert.equal(G.ZONES.C1.search,false);
 for(const [id,z] of Object.entries(G.ZONES)){assert.ok(Number.isFinite(G.distance(id,'N1')));for(const n of z.links){assert.ok(G.ZONES[n].links.includes(id));assert.equal(Math.abs(z.x-G.ZONES[n].x)+Math.abs(z.y-G.ZONES[n].y),1);}}
});
test('empty search spends one action, cannot repeat, and finds the fixed artifact at the other site',()=>{
 let s=G.newGame(()=>.99);s.enemies=[];s.heroes[0].zone='C2';let r=G.act(s,'aquiles','interact');assert.ok(r.ok);s=r.state;assert.equal(s.heroes[0].ap,1);assert.deepEqual(s.tasks,[]);assert.deepEqual(s.searched,['C2']);
 assert.equal(G.act(s,'aquiles','interact').ok,false);assert.equal(G.validSave(s),true);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(restored.hidden.C,'C3');restored.heroes[0].zone='C3';r=G.act(restored,'aquiles','interact');assert.ok(r.ok);assert.deepEqual(r.state.tasks,['C']);assert.equal(G.validSave(r.state),true);
});
test('no search on passage, with enemies, or after a terrain artifact is collected',()=>{
 let s=G.newGame(()=>0);s.heroes[0].zone='C1';assert.equal(G.act(s,'aquiles','interact').ok,false);s.heroes[0].zone='C2';s.enemies[0].zone='C2';assert.equal(G.act(s,'aquiles','interact').ok,false);s.enemies=[];s=G.act(s,'aquiles','interact').state;s.heroes[0].zone='C3';assert.equal(G.act(s,'aquiles','interact').ok,false);
});
test('saved searches and inventory must agree with legal hiding sites',()=>{
 const s=G.newGame();assert.ok(G.validSave(s));s.hidden.C='C1';assert.equal(G.validSave(s),false);const t=G.newGame();t.tasks=['C'];assert.equal(G.validSave(t),false);assert.equal(G.validSave({...G.newGame(),version:1}),false);
});
