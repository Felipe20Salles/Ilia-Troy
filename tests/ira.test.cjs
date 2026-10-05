const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/ira.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const setup=(options={})=>G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô: fecha o caminho de Heitor e ataca; sem alvo, corre atrás dele.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<30&&!s.result;turn++){
  if(options.deifobo&&s.favor>=2&&!s.deifoboUsed&&s.round>=2){const r=G.invoke(s,'deifobo');if(r.ok)s=r.state;}
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='scales'?'ok':e.choices?e.choices[0]:'ok').state;}
   const h=hero(s,id);if(s.result||!h||!h.hp||!h.ap||h.away)break;
   const def=G.HEROES.find(d=>d.id===id),hec=s.enemies.find(e=>e.type==='heitor'),range=G.HEROES.stats(h).range;
   if(hec&&G.distance(h.zone,hec.zone)<=range){const c=def.cards.findIndex((c,n)=>['attack','ranged'].includes(c.type)&&!h.used.includes(n)&&h.known.includes(n)&&G.distance(h.zone,hec.zone)<=(c.type==='ranged'?1:0));doAct(id,c<0?'attack':'card:'+c,hec.id);continue;}
   const here=s.enemies.filter(e=>e.zone===h.zone&&e.type!=='heitor');if(here.length&&hec&&h.zone!==hec.zone){doAct(id,'attack',here.sort((a,b)=>a.hp-b.hp)[0].id);continue;}
   if(!hec)break;
   // fecha uma das saídas de Heitor que ainda esteja aberta; senão corre atrás dele
   const open=G.heitorOptions(s).filter(z=>z!=='M1'&&!s.heroes.some(a=>a.hp>0&&!a.away&&a.zone===z)),near=open.find(z=>G.distance(h.zone,z)<=1);
   const goal=near||hec.zone;
   if(goal!==h.zone){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];doAct(id,'move',step);continue;}
   if(h.used.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('Hector starts outside the walls, with the wounds Patroclus left, and runs one step per Trojan phase',()=>{
 let s=setup({legacy:{heitorWounds:3}});const hec=s.enemies.find(e=>e.type==='heitor');assert.equal(hec.zone,'P2');assert.equal(hec.hp,17);
 s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.type==='heitor').zone,'C2');
});
test('a hero standing where Hector would run makes him stop and fight',()=>{
 let s=setup();hero(s,'odisseu').zone='C2';s.revealed.push('C2');const hp=hero(s,'odisseu').hp;s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.type==='heitor').zone,'P2');assert.ok(hero(s,'odisseu').hp<hp);assert.ok(s.personal.odisseu.done,'o feito de Odisseu: P2 só tem uma saída para o portão');
});
test('Athena as Deiphobus stops Hector once',()=>{
 let s=setup({favor:4});s=G.invoke(s,'deifobo').state;s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.type==='heitor').zone,'P2');s.round++;s.invokedRound=0;assert.equal(G.invoke(s,'deifobo').ok,false);
});
test('Hector reaching the gate escapes; the mission is over but passes to the campaign',()=>{
 let s=setup();s.heroes.forEach(h=>h.zone='N4');for(let i=0;i<6&&!s.result;i++)s=G.trojanTurn(s);assert.equal(s.result,'defeat');assert.equal(s.outcome.legacy.heitor,'escaped');
});
test('killing Hector wins; the final blow of Achilles is his feat',()=>{
 let s=setup();const hec=s.enemies.find(e=>e.type==='heitor');hec.hp=1;hec.armor=0;hero(s,'aquiles').zone='P2';s=act(s,'aquiles','attack',hec.id);assert.equal(s.result,'victory');assert.equal(s.outcome.legacy.heitor,'dead');assert.ok(s.personal.aquiles.done);
});
test('the bot catches Hector in most rosters',()=>{
 const ids=['aquiles','ajax','odisseu','menelau','agamemnon'];let wins=0,games=0;
 for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];
  for(const deifobo of [false,true]){const s=play(team,{favor:3,deifobo});games++;if(s.result==='victory')wins++;}}
 assert.ok(wins/games>=.5&&wins/games<=.9,'vitórias do robô: '+wins+'/'+games);
});
test('Agamemnon leads the coalition: his feat is felling Hector with no hero down',()=>{
 let s=setup();const hec=s.enemies.find(e=>e.type==='heitor');hec.hp=1;hec.armor=0;hero(s,'aquiles').zone='P2';s=act(s,'aquiles','attack',hec.id);assert.ok(s.personal.agamemnon.done);
 let t=setup();const h2=t.enemies.find(e=>e.type==='heitor');h2.hp=1;h2.armor=0;hero(t,'aquiles').zone='P2';hero(t,'odisseu').hp=0;hero(t,'odisseu').ap=0;t=act(t,'aquiles','attack',h2.id);assert.equal(t.personal.agamemnon.done,false);
});
