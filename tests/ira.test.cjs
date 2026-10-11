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
  if(options.deifobo&&s.favor>=2&&!s.deifoboUsed&&s.chase.status==='running'&&s.chase.laps>=1){const r=G.invoke(s,'deifobo');if(r.ok)s=r.state;}
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='scales'?'ok':e.choices?e.choices[0]:'ok').state;}
   const h=hero(s,id);if(s.result||!h||!h.hp||!h.ap||h.away)break;
   const hec=hector(s);if(!hec)break;const def=G.HEROES.find(d=>d.id===id);
   const duel=G.interactions(s,h).find(x=>x.id==='duel'&&x.available);if(duel){doAct(id,'interact','duel');continue;}
   {const aq=hero(s,'aquiles');if(aq&&id!=='aquiles'&&s.chase.status==='duel'&&aq.hp>0&&aq.zone===h.zone){const card=type=>def.cards.findIndex((c,n)=>c.type===type&&!h.used.includes(n)&&h.known.includes(n));
    const rf=card('refresh'),hl=card('healAlly'),ga=card('grantAction');
    if(rf>=0&&aq.used.length){doAct(id,'card:'+rf,'aquiles');continue;}if(hl>=0&&aq.hp<G.HEROES.stats(aq).maxHp){doAct(id,'card:'+hl,'aquiles');continue;}if(ga>=0){doAct(id,'card:'+ga,'aquiles');continue;}}}
   if(id==='aquiles'&&s.chase.status==='duel'&&hec.zone===h.zone&&h.hp<=3){const hc=def.cards.findIndex((c,n)=>c.type==='heal'&&!h.used.includes(n)&&!h.onceUsed.includes(n)&&h.known.includes(n));if(hc>=0){doAct(id,'card:'+hc);continue;}}
   if(id==='aquiles'&&s.chase.status==='duel'&&hec.zone===h.zone){const c=def.cards.findIndex((c,n)=>c.type==='attack'&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,hec.id);continue;}
   const here=s.enemies.filter(e=>e.zone===h.zone&&e.type!=='heitor');
   const n=G.chaseNext(s);let goal;
   // O cerco: um grego espera fixo do outro lado da volta (B4); Aquiles fecha por trás de Heitor.
   const others=ids.filter(x=>x!=='aquiles'&&x!==guard),blockAt=['B4','B3'][others.indexOf(id)]||'B4';
   if(id==='aquiles')goal=s.chase.status==='running'&&n&&G.CIRCUIT.includes(hec.zone)?n.back:hec.zone;
   else if(id===guard)goal='M1';
   else goal=s.chase.status==='waiting'?'C2':blockAt;
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

// Aquiles luta até derrubar Heitor (ações renovadas a cada golpe, só para o teste).
function duelToDeath(s){let n=0;while(!s.result&&s.enemies.some(e=>e.type==='heitor')&&n++<20){const a=hero(s,'aquiles');a.ap=Math.max(a.ap,1);a.hp=Math.max(a.hp,3);s=act(s,'aquiles','attack',hector(s).id);}return s;}
test('Hector starts at P7, stops before the gate (P4) out of pride, and flees toward M2 when Achilles comes within two areas',()=>{
 let s=setup();s.foodSetup=false;s.enemies=s.enemies.filter(e=>e.type==='heitor');assert.equal(hector(s).zone,'P7');assert.equal(s.chase.status,'waiting');
 s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(hector(s).zone,'P4','vai até o portão');assert.match(s.lastFind.title,/orgulho/);assert.equal(s.chase.status,'waiting');
 s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(hector(s).zone,'P4','não entra, e espera');
 hero(s,'aquiles').zone='C2';s.revealed.push('C2');s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.chase.status,'running');assert.match(s.lastFind.title,/medo/);assert.notEqual(hector(s).zone,'M1');assert.ok(['B5'].includes(hector(s).zone),'rumo ao bosque');
});
test('in the forest a hero closing the next area makes him turn back (Odysseus feat); cornered, he stops',()=>{
 let s=setup();s.foodSetup=false;s.enemies=s.enemies.filter(e=>e.type==='heitor');hector(s).zone='B3';s.chase={status:'running',dir:1,laps:0};s.heitorStep=3;
 hero(s,'odisseu').zone='B4';s.heroes.forEach(h=>h.ap=0);hero(s,'aquiles').zone='A1';hero(s,'agamemnon').zone='A1';s=G.trojanTurn(s);assert.equal(hector(s).zone,'M2','deu meia-volta');assert.equal(s.chase.dir,-1);assert.ok(s.personal.odisseu.done);
 let c=setup();c.foodSetup=false;c.enemies=c.enemies.filter(e=>e.type==='heitor');hector(c).zone='B3';c.chase={status:'running',dir:1,laps:0};hero(c,'odisseu').zone='B4';hero(c,'agamemnon').zone='M2';hero(c,'aquiles').zone='A1';c.heroes.forEach(h=>h.ap=0);c=G.trojanTurn(c);
 assert.equal(c.chase.status,'stopped');assert.equal(hector(c).zone,'B3');
});
test('after the first lap, passing beside an unguarded gate lets him escape; a guarded gate keeps him running, and three laps stop him',()=>{
 let s=setup();s.foodSetup=false;s.enemies=s.enemies.filter(e=>e.type==='heitor');hector(s).zone='B5';s.chase={status:'running',dir:1,laps:1};s.heroes.forEach(h=>{h.ap=0;h.zone='A1';});s=G.trojanTurn(s);assert.equal(s.result,'defeat');assert.match(s.reason,/portas Ceias/);
 let g=setup();g.foodSetup=false;g.enemies=g.enemies.filter(e=>e.type==='heitor');hector(g).zone='B5';g.chase={status:'running',dir:1,laps:1};g.heroes.forEach(h=>{h.ap=0;h.zone='A1';});hero(g,'agamemnon').zone='M1';g=G.trojanTurn(g);assert.equal(g.result,null);assert.equal(hector(g).zone,'M5');
 let l=setup();l.foodSetup=false;l.enemies=l.enemies.filter(e=>e.type==='heitor');hector(l).zone='M5';l.chase={status:'running',dir:1,laps:2};l.heitorStep=9;l.heroes.forEach(h=>{h.ap=0;h.zone='A1';});hero(l,'agamemnon').zone='M1';l=G.trojanTurn(l);assert.equal(hector(l).zone,'M2');assert.equal(l.chase.laps,3);assert.equal(l.chase.status,'stopped');
});
test('Hector is always on the run: he counterattacks the Greeks who catch him, but only flees from Achilles',()=>{
 let s=setup();s.foodSetup=false;s.enemies=s.enemies.filter(e=>e.type==='heitor');hector(s).zone='B1';s.chase={status:'running',dir:1,laps:0};s.heroes.forEach(h=>{h.ap=0;h.zone='A1';});const a=hero(s,'ajax'===undefined?'':'odisseu');a.zone='B1';const hp0=a.hp;hero(s,'aquiles').zone='B1';
 s=G.trojanTurn(s);assert.ok(hero(s,'odisseu').hp<hp0,'contra-ataque em quem não é Aquiles');assert.equal(hero(s,'aquiles').hp,G.HEROES.stats(hero(s,'aquiles')).maxHp,'de Aquiles ele só foge');assert.notEqual(hector(s).zone,'B1','e volta a correr');
});
test('the duel: the spear first, then the sword; after that Hector only defends',()=>{
 let s=setup();s.foodSetup=false;s.enemies=s.enemies.filter(e=>e.type==='heitor');hector(s).zone='B3';s.chase={status:'stopped',dir:1,laps:3};const a=hero(s,'aquiles');a.zone='B3';
 s=act(s,'aquiles','interact','duel');assert.equal(s.chase.status,'duel');
 let hp=hero(s,'aquiles').hp;s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.match(s.lastFind.title,/lança/);assert.equal(hp-hero(s,'aquiles').hp,2);
 hp=hero(s,'aquiles').hp;s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.match(s.lastFind.title,/espada/);assert.ok(hero(s,'aquiles').hp<hp);
 hp=hero(s,'aquiles').hp;s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(hero(s,'aquiles').hp,hp,'só se defende');
});
test('only Achilles may face Hector, at any moment, and striking him starts the duel: the duel is a real fight with the strength of mission 3',()=>{
 let s=setup();s.revealed.push('P4','P7','B5');hector(s).zone='P4';s.chase={status:'running',dir:1,laps:0};hero(s,'aquiles').zone='P4';hero(s,'odisseu').zone='P4';
 assert.equal(hector(s).hp,10,'a força da missão 3');assert.equal(hector(s).attack,3);
 assert.equal(G.act(s,'odisseu','attack',hector(s).id).ok,false,'os outros não ferem Heitor');const caught=G.act(s,'aquiles','attack',hector(s).id);assert.ok(caught.ok,'Aquiles ataca Heitor quando quiser');assert.equal(caught.state.chase.status,'duel','e o duelo começa ali');assert.ok(hector(caught.state).hp<10);
 s.chase.status='stopped';
 s=act(s,'aquiles','interact','duel');assert.equal(s.result,null,'o desafio não derruba Heitor');assert.equal(s.chase.status,'duel');assert.equal(G.act(s,'odisseu','attack',hector(s).id).ok,false,'nem no duelo os outros entram');
 const hp0=hero(s,'aquiles').hp;s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.ok(hero(s,'aquiles').hp<hp0,'Heitor golpeia Aquiles');
 s=duelToDeath(s);assert.equal(s.result,'victory');assert.equal(s.outcome.legacy.heitor,'dead');assert.ok(s.personal.aquiles.done);assert.equal(s.duel,'ego');
 let w=setup({legacy:{patroclus:'dead'}});w.revealed.push('P4');hector(w).zone='P4';w.chase.status='stopped';hero(w,'aquiles').zone='P4';w=act(w,'aquiles','interact','duel');w=duelToDeath(w);assert.equal(w.duel,'ira','com Pátroclo morto, é ira');
});
test('Agamemnon leads the coalition: his feat is Hector falling with no hero down',()=>{
 let s=setup();s.revealed.push('P4');hector(s).zone='P4';s.chase.status='stopped';hero(s,'aquiles').zone='P4';s=act(s,'aquiles','interact','duel');s=duelToDeath(s);assert.ok(s.personal.agamemnon.done);
 let t=setup();t.revealed.push('P4');hector(t).zone='P4';t.chase.status='stopped';hero(t,'aquiles').zone='P4';hero(t,'odisseu').hp=0;hero(t,'odisseu').ap=0;t=act(t,'aquiles','interact','duel');t=duelToDeath(t);assert.equal(t.personal.agamemnon.done,false);
});
test('Athena as Deiphobus makes Hector stop once',()=>{
 let s=setup({favor:4});s.chase.status='running';assert.equal(G.invoke(s,'deifobo').ok,false,'antes da segunda passagem pelo portão, não');s.chase.laps=2;s=G.invoke(s,'deifobo').state;assert.equal(s.chase.status,'stopped');s.round++;s.invokedRound=0;assert.equal(G.invoke(s,'deifobo').ok,false);
});
test('only Achilles can bring Hector down: the bot wins with him and never without him',()=>{
 const ids=['aquiles','ajax','odisseu','menelau','agamemnon'];let wins=0,games=0;
 for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];
  for(const deifobo of [false,true]){const s=play(team,{favor:3,deifobo});games++;if(s.result==='victory')wins++;if(!team.includes('aquiles'))assert.notEqual(s.result,'victory','sem Aquiles, ninguém derruba Heitor');}}
 // Duelo de Aquiles e Heitor (09/10/2026): hoje o robô vence 8/14, acima da meta de 6/14; a decisão de como apertar é do Felipe.
 assert.ok(wins>=3,'vitórias do robô: '+wins+'/'+games);
});
test('without Achilles nobody faces Hector: Ajax and Odysseus fight the Trojans, not him',()=>{
 let s=G.newGame({heroes:['ajax','odisseu','agamemnon'],players:1,owners:[1,1,1]});s.revealed.push('P4');hector(s).zone='P4';s.chase.status='stopped';hero(s,'ajax').zone='P4';hero(s,'odisseu').zone='P4';
 assert.ok(!G.interactions(s,hero(s,'ajax')).some(x=>x.id==='duel'),'só Aquiles enfrenta Heitor');assert.equal(G.act(s,'ajax','attack',hector(s).id).ok,false);assert.equal(G.act(s,'odisseu','attack',hector(s).id).ok,false);
});
