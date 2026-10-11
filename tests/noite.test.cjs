const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/noite.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const setup=(options={})=>{const s=G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});s.foodSetup=false;return s;};
const ashore=s=>{s.heroes.forEach(h=>{if(h.atSea){h.atSea=false;h.ap=G.HEROES.stats(h).actions;}});return s;};
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô simples, com as ações de sempre: Odisseu luta com quem estiver na peça e abre o portão; a frota espera em M1,
// entra quando o portão abre, luta e incendeia as peças por onde passa.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<40&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<5;i++){
   while(s.encounter)s=G.choose(s,s.encounter.choices[0]).state;
   const h=hero(s,id);if(s.result||!h.hp||!h.ap)break;
   const def=G.HEROES.find(d=>d.id===id),here=s.enemies.filter(e=>e.zone===h.zone);
   const fire=G.interactions(s,h).find(x=>x.id==='burn'&&x.available);if(fire){doAct(id,'interact','burn');continue;}
   // Como um jogador: cura quem está mal, protege a peça e intimida antes de trocar golpes.
   const ready=type=>def.cards.findIndex((c,n)=>c.type===type&&h.known.includes(n)&&!h.used.includes(n)&&!h.onceUsed.includes(n));
   const max=G.HEROES.stats(h).maxHp;
   if(ready('heal')>=0&&h.hp<=max/2){doAct(id,'card:'+ready('heal'));continue;}
   const hurt=s.heroes.filter(a=>a.id!==id&&a.zone===h.zone&&a.hp>0&&a.hp<=G.HEROES.stats(a).maxHp/2)[0];if(hurt&&ready('healAlly')>=0){doAct(id,'card:'+ready('healAlly'),hurt.id);continue;}
   if(here.length&&ready('guard')>=0&&!s.guards[h.zone]){doAct(id,'card:'+ready('guard'));continue;}
   if(here.length&&ready('intimidate')>=0){const big=here.slice().sort((a,b)=>(b.attack??2)-(a.attack??2))[0];const r=G.act(s,id,'card:'+ready('intimidate'),big.id);if(r.ok){s=r.state;continue;}}
   // Só vale lutar com quem o golpe fere; contra armadura grossa, segue para o fogo.
   const hurtable=here.filter(e=>(e.armor||0)<G.HEROES.stats(h).attack+(id==='aquiles'?2:0)||id==='odisseu');
   if(hurtable.length&&!(s.gateOpen&&G.interactions(s,h).some(x=>x.id==='burn')===false&&here.length>hurtable.length)){const foe=hurtable.sort((a,b)=>a.hp-b.hp)[0];const c=def.cards.findIndex((c,n)=>['attack'].includes(c.type)&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp&&!a.slain);if(down&&h.hp>=2){doAct(id,'rescue',down.id);continue;}
   const pick=G.interactions(s,h).find(x=>x.available);if(pick){doAct(id,'interact',pick.id);continue;}
   const open=s.gateOpen||s.posternOpen;
   // Aberta a cidade, todos seguem juntos o caminho do fogo até o palácio: 10, 07, 04, 05 e, por último, 01.
   const goal=open?['10','07','04','05','01'].find(z=>!s.burned.includes(z)):h.inside?G.GATE:G.OUT_GATE;
   if(!goal||goal===h.zone){if(h.used.length){doAct(id,'rest');continue;}break;}
   const danger=z=>s.enemies.filter(e=>e.zone===z).length;
   const step=G.links(s,h.zone).filter(z=>h.inside?G.isCity(z):true).sort((a,b)=>G.knownDistance(s,a,goal)-G.knownDistance(s,b,goal)||danger(a)-danger(b))[0];if(!step)break;doAct(id,'move',step);continue;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('only Odysseus is in the horse, in the temple of Athena, with 2 actions; the fleet waits at the gate (M1) without actions',()=>{
 const s=setup();assert.ok(G.validSave(s));assert.equal(G.HORSE,'04');assert.equal(hero(s,'odisseu').zone,G.HORSE);assert.ok(hero(s,'odisseu').inside);assert.equal(hero(s,'odisseu').ap,2);
 assert.ok(['aquiles','agamemnon'].every(id=>hero(s,id).ap===0),'a frota não age antes do portão');
 assert.ok(['aquiles','agamemnon'].every(id=>hero(s,id).zone==='M1'),'a frota espera diante do portão');assert.ok(!G.ZONES.N1,'N1 segue fora da mesa');
 assert.equal(G.distance('M1','10'),Infinity,'cidade e planície só se ligam pelo portão aberto');
});
test('the campaign weighs in: Apollo +2 per cornel, no Palladium means 3 actions at the gate, Helen opens a door',()=>{
 assert.equal(setup({cornel:2}).alarm,4);assert.equal(setup().alarm,0);
 assert.equal(G.gateCost(setup({paladio:false})),3);assert.equal(G.gateCost(setup()),2);
 const legacy=setup({legacy:{apolloPrice:1,paladio:true,helen:'ally',laocoonte:true,heitor:'escaped'}});assert.equal(legacy.alarm,2);assert.ok(legacy.helen&&legacy.desconfia&&legacy.heitor);
 assert.ok(!G.interactions(setup({helen:true}),{...hero(setup({helen:true}),'odisseu'),zone:G.POSTERN}).some(x=>x.id==='postern'),'a porta de Helena saiu: só o portão abre a cidade');
});
test('inside the city Odysseus uses the same actions as always: he fights whoever is in the piece, and the gate needs it clear',()=>{
 let s=setup();const o=hero(s,'odisseu');o.zone=G.GATE;s.enemies.find(e=>e.zone==='07').zone=G.GATE;const g=s.enemies.find(e=>e.zone===G.GATE);
 assert.equal(G.interactions(s,o).find(x=>x.id==='gate').available,false,'há vigias no portão');
 s=act(s,'odisseu','attack',g.id);assert.ok(s.enemies.find(e=>e.id===g.id)?.hp<3||!s.enemies.some(e=>e.id===g.id),'o ataque de sempre');
});
test('opening the gate wakes the fleet and Troy (Paris, Aeneas, the barracks); five fires win, and the fifth is the palace',()=>{
 let s=setup();s.enemies=s.enemies.filter(e=>e.zone!==G.GATE);hero(s,'odisseu').zone=G.GATE;
 s=act(s,'odisseu','interact','gate');s=act(s,'odisseu','interact','gate');assert.ok(s.gateOpen);assert.equal(s.personal.odisseu.done,true);assert.ok(s.glory.includes('odisseu'));
 assert.ok(hero(s,'agamemnon').ap>0,'a frota entra na mesma rodada');assert.ok(s.enemies.some(e=>e.type==='paris'&&e.focus==='aquiles'));assert.ok(s.enemies.some(e=>e.type==='eneias'));assert.ok(G.links(s,'M1').includes(G.GATE));
 s.enemies=[];const o=hero(s,'odisseu');o.zone=G.PALACE;o.ap=2;assert.equal(G.interactions(s,o).find(x=>x.id==='burn').available,false,'o palácio queima por último');
 for(const z of ['10','07','09','04']){const h=hero(s,'odisseu');h.zone=z;h.ap=2;s=act(s,'odisseu','interact','burn');}
 assert.equal(s.result,null);const last=hero(s,'odisseu');last.zone=G.PALACE;last.ap=2;s=act(s,'odisseu','interact','burn');
 assert.equal(s.result,'victory');assert.deepEqual(s.outcome.legacy.burned,['10','07','09','04','01']);
});
test('every two rounds with the city open, heroes - 1 troops leave the palace; fire at 2 brings more; Zeus burns a piece',()=>{
 let s=setup();s.gateOpen=true;s.openedRound=-1;s.enemies=[];s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.enemies.filter(e=>e.zone===G.PALACE).length,2);
 let f=setup();f.gateOpen=true;f.openedRound=-1;f.enemies=[];f.burned=['10'];const o=hero(f,'odisseu');o.zone='07';f=act(f,'odisseu','interact','burn');f.heroes.forEach(h=>h.ap=0);f=G.trojanTurn(f);assert.equal(f.enemies.filter(e=>e.zone===G.PALACE).length,2);assert.equal(f.enemies.filter(e=>e.zone==='02').length,1,'o clarão do fogo');
 let w=setup();w.gateOpen=true;w.openedRound=0;w.enemies=[];for(let i=0;i<10;i++){w.heroes.forEach(h=>{h.ap=0;h.zone='M1';});w=G.trojanTurn(w);}assert.ok(w.enemies.filter(e=>e.hold).every(e=>e.type==='arqueiro')&&w.enemies.some(e=>e.hold),'só os arqueiros ficam no palácio');assert.ok(['explorador','guarda','lanceiro'].every(x=>w.enemies.some(e=>e.type===x)),'tropas variadas');
 const g=w.enemies.find(e=>e.type==='guarda');assert.equal(g.hp,G.TROOPS.types.guarda.hp-1);assert.equal(g.armor,G.TROOPS.types.guarda.armor-1,'sem armadura no desespero');
 let z=setup();z.gateOpen=true;z.favor=3;const zz=G.TROOPS.create('e90','07','guarda');z.enemies.push(zz);const zr=G.invoke(z,'zeus','07');assert.ok(zr.ok);assert.deepEqual(zr.state.burned,['07'],'o raio cai mesmo com troianos');assert.equal(G.invoke(z,'zeus','01').ok,false,'o palácio não');
 let x=setup();x.gateOpen=true;x.enemies=[];x.burned=['07'];const ff=G.TROOPS.create('f1','07','guarda');ff.fire=true;x.enemies.push(ff);x.heroes.forEach(h=>{h.ap=0;h.zone='M1';});x=G.trojanTurn(x);assert.deepEqual(x.burned,[],'quem estava na peça em chamas apaga o fogo');
});
test('Paris hunts Achilles with the bow of Apollo; Achilles slain cannot be rescued',()=>{
 let s=setup();s.gateOpen=true;s.enemies=[];const a=hero(s,'aquiles');a.zone='05';a.hp=2;s.enemies.push({...G.TROOPS.create('p1','04','paris'),focus:'aquiles',hunt:true});s.heroes.forEach(h=>h.ap=0);
 s=G.trojanTurn(s);assert.equal(hero(s,'aquiles').hp,0);assert.ok(hero(s,'aquiles').slain);assert.match(s.lastFind.title,/Apolo/);
 const ag=hero(s,'agamemnon');ag.zone='05';ag.ap=2;assert.equal(G.act(s,'agamemnon','rescue','aquiles').ok,false);
});
test('with Hector alive, he appears at the gate (10) when it opens and can die there',()=>{
 let s=setup({heitor:true});s.enemies=s.enemies.filter(e=>e.zone!==G.GATE);hero(s,'odisseu').zone=G.GATE;s=act(s,'odisseu','interact','gate');s=act(s,'odisseu','interact','gate');
 const hec=s.enemies.find(e=>e.type==='heitor');assert.equal(hec.zone,G.GATE);
 assert.equal(G.interactions(s,hero(s,'odisseu')).find(x=>x.id==='burn').available,false,'com troianos na peça, não se incendeia');
 hec.hp=1;hec.armor=0;const aq=hero(s,'aquiles');aq.zone=G.GATE;aq.ap=2;s=act(s,'aquiles','attack',hec.id);assert.ok(s.heitorDead);assert.equal(s.heitorSlayer,'aquiles');
});
test('Troy believes the Greeks left: nobody watches the plain; inside, a watchman in Odysseus piece shouts',()=>{
 let s=ashore(setup({desconfia:true}));assert.ok(!s.enemies.some(e=>!G.isCity(e.zone)),'fora não há ninguém');hero(s,'agamemnon').zone='P3';s.heroes.forEach(h=>h.ap=0);
 let t=G.trojanTurn(s);assert.equal(t.alarm,0,'a planície está vazia');
 let n=setup({desconfia:true});n.enemies=[];const w=G.TROOPS.create('e70',G.HORSE,'vigia');w.patrol='oeste';w.step=1;n.enemies.push(w);n.nextEnemy=71;n.heroes.forEach(h=>h.ap=0);n.round=2;n.chronicle=null;
 t=G.trojanTurn(n);assert.equal(t.alarm,2);assert.ok(hero(t,'odisseu').hp<hero(n,'odisseu').hp);
});
test('the chronicles: without knowing who would distrust, Laocoon and Cassandra cost alarm; the festival keeps the watch still',()=>{
 let s=setup({desconfia:false});s.enemies=[];s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.round,2);assert.equal(s.chronicle.id,'laocoonte');assert.equal(s.alarm,3);
 let d=setup({desconfia:true});d.enemies=[];d.heroes.forEach(h=>h.ap=0);d=G.trojanTurn(d);assert.equal(d.alarm,0);
 let f=setup();const v=f.enemies.find(e=>e.patrol==='oeste'),z=v.zone;f.heroes.forEach(h=>h.ap=0);f=G.trojanTurn(f);assert.equal(f.enemies.find(e=>e.id===v.id).zone,z,'bêbados na festa');
});
test('defeat: alarm 18, or Odysseus falls in the city; there is no round limit',()=>{
 let s=ashore(setup());s.alarm=17;s.alarmFired=[4,7,11,15];hero(s,'agamemnon').zone='P3';s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.result,'defeat');assert.match(s.reason,/acordou/);
 let t=setup();t.round=40;t.enemies=[];t.chronicle=null;t.heroes.forEach(h=>h.ap=0);t=G.trojanTurn(t);assert.equal(t.result,null,'sem aurora');assert.equal(t.round,41);
 let o=setup();hero(o,'odisseu').hp=1;hero(o,'odisseu').zone='07';o.heroes.forEach(h=>h.ap=0);o.chronicle=null;o.round=2;o=G.trojanTurn(o);assert.equal(o.result,'defeat');assert.match(o.reason,/caiu dentro da cidade/);
});
// A última missão: na campanha, os heróis chegam aqui no nível 3 (10 de vida).
const LEVELS=team=>Object.fromEntries(team.map(id=>[id,3]));
test('the campaign decides the night: the bot wins only with enough of the Palladium, Laocoon and Apollo on its side',()=>{
 // Só Odisseu age na cidade: o que muda a noite é a herança da campanha (o Paládio, quem vai desconfiar, o corniso de Apolo).
 let wins=0,games=0;
 for(const paladio of [true,false])for(const desconfia of [true,false])for(const cornel of [0,1,2])for(const team of [['odisseu','agamemnon','aquiles'],['odisseu','agamemnon','ajax','menelau']]){const s=play(team,{paladio,desconfia,cornel,levels:LEVELS(team)});games++;if(s.result==='victory')wins++;}
 assert.ok(wins/games>=.2&&wins/games<=6/14,'vitórias do robô: '+wins+'/'+games);
 assert.equal(play(['odisseu','agamemnon','ajax','menelau'],{paladio:true,desconfia:true,cornel:0,levels:LEVELS(['odisseu','agamemnon','ajax','menelau'])}).result,'victory','com tudo a favor, a noite é dos gregos');
 assert.equal(play(['odisseu','agamemnon','aquiles'],{paladio:false,desconfia:false,cornel:2,levels:LEVELS(['odisseu','agamemnon','aquiles'])}).result,'defeat','com tudo contra, Troia acorda');
});
