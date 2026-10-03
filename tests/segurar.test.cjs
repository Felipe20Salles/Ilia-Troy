const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/segurar.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const setup=(options={})=>G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô: segura a linha perto das tendas, ataca quem chega e vai atrás de Heitor quando ele desce.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<40&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='crises'?(e.council?'sacrifice':G.crisesChoices(s).includes(options.crises||'sacrifice')?options.crises||'sacrifice':'sacrifice'):e.id==='scales'?'ok':e.choices[0]).state;}
   const h=hero(s,id);if(s.result||!h.hp||!h.ap||h.away)break;
   const def=G.HEROES.find(d=>d.id===id),here=s.enemies.filter(e=>e.zone===h.zone);
   if(here.length){const foe=here.sort((a,b)=>(b.type==='heitor')-(a.type==='heitor')||a.hp-b.hp)[0];const c=def.cards.findIndex((c,n)=>c.type==='attack'&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const reach=s.enemies.filter(e=>G.distance(h.zone,e.zone)<=G.HEROES.stats(h).range);if(reach.length){doAct(id,'attack',reach.sort((a,b)=>a.hp-b.hp)[0].id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp&&!a.away);if(down&&h.hp>=3){doAct(id,'rescue',down.id);continue;}
   const option=G.interactions(s,h).find(x=>x.available&&((x.id==='council'&&s.plague>=2)||(x.id==='explore'&&h.hp<=G.HEROES.stats(h).maxHp-2)));if(option){doAct(id,'interact',option.id);continue;}
   let goal='A1';
   if(id!=='agamemnon'){const heitor=s.enemies.find(e=>e.type==='heitor'&&G.distance(e.zone,'A1')<=2);const threat=heitor||s.enemies.filter(e=>e.zone==='A1').sort((a,b)=>a.hp-b.hp)[0];goal=threat&&threat.zone==='A1'||threat?.type==='heitor'?threat.zone:'A1';}
   if(goal!==h.zone){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];doAct(id,'move',step);continue;}
   if(h.used.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('the mission starts at the camp; Crises only comes if Criseida was taken',()=>{
 const s=setup();assert.ok(G.validSave(s));assert.equal(s.encounter,null);assert.ok(s.heroes.every(h=>h.zone==='A1'));
 const c=setup({legacy:{criseida:'taken'}});assert.equal(c.encounter.id,'crises');assert.deepEqual(G.crisesChoices(c),['sacrifice','briseida','refuse','intercede']);
 const n=G.newGame({heroes:['ajax','odisseu','agamemnon'],legacy:{criseida:'taken'}});assert.ok(!G.crisesChoices(n).includes('briseida'),'sem Aquiles não há Briseida');
});
test('returning Criseida with sacrifice costs 2 food, and the king pays what the store lacks',()=>{
 let s=setup({legacy:{criseida:'taken'},campFood:0});const king=hero(s,'agamemnon').hp;s=G.choose(s,'sacrifice').state;assert.equal(s.criseida,'returned');assert.equal(hero(s,'agamemnon').hp,king-2);assert.equal(s.plagueActive,false);
});
const briseida=()=>{const s=setup({legacy:{criseida:'taken'},levels:{aquiles:2},known:{aquiles:[0,2]}});return G.choose(s,'briseida').state;};
test('taking Briseida puts Patroclus in Achilles place: initial strength and a single ability',()=>{
 const s=briseida(),p=hero(s,'aquiles');assert.ok(p.patroclus);assert.equal(p.away,false);assert.equal(p.level,1);assert.deepEqual(p.known,[0],'a habilidade inicial de Aquiles');assert.equal(p.hp,G.HEROES.stats(p).maxHp);assert.equal(G.label(s,p),'Pátroclo');assert.equal(s.patroclus.status,'active');assert.ok(G.validSave(s));
 const n=setup({legacy:{criseida:'taken'}});assert.equal(G.choose(n,'sacrifice').state.patroclus.status,'none','sem Briseida, Pátroclo não entra');
});
test('the embassy of Odysseus or Ajax always fails',()=>{
 let s=briseida();s.enemies=[];hero(s,'odisseu').zone='N4';s=act(s,'odisseu','interact','embassy');s=act(s,'odisseu','interact','embassy');
 assert.ok(hero(s,'aquiles').patroclus,'Pátroclo continua no lugar de Aquiles');assert.match(s.lastFind.text,/falhou/);assert.equal(G.interactions(s,hero(s,'odisseu')).some(x=>x.id==='embassy'),false);
});
test('Zeus weighs Patroclus and Hector when Hector comes out of the gate',()=>{
 let s=briseida();s.enemies=[];s.alarm=9;s.alarmFired=[4,7];s=G.trojanTurn(s);assert.ok(s.enemies.some(e=>e.type==='heitor'));assert.equal(s.encounter.id,'scales');assert.equal(G.act(s,'odisseu','rest').ok,false,'a cena pausa a partida');
 s=G.choose(s,'ok').state;assert.equal(s.encounter,null);assert.ok(G.SCALES.face.items.length===4&&G.SCALES.flee.items.length===2);
 let e=setup();e.enemies=[];e.alarm=9;e.alarmFired=[4,7];e=G.trojanTurn(e);assert.equal(e.encounter,null,'sem Pátroclo, não há balança');assert.match(e.lastFind.text,/maior guerreiro/,'o duelo de egos');
});
test('Patroclus falling face to Hector earns the four rewards; Achilles returns next round with everything',()=>{
 let s=briseida();s.encounter=null;const hec=G.TROOPS.create('e90','A1','heitor');s.enemies=[hec,G.TROOPS.create('e91','N4','lanceiro')];s.nextEnemy=92;const p=hero(s,'aquiles');
 const favor=s.favor;s=act(s,'aquiles','attack','e90');assert.ok(s.patroclus.struck);const dealt=s.patroclus.dealt;assert.ok(dealt>0);
 hero(s,'aquiles').hp=1;hero(s,'odisseu').zone='N1';hero(s,'agamemnon').zone='N1';s=G.trojanTurn(s);
 assert.equal(s.patroclus.status,'avenged');assert.equal(s.patroclus.facing,true);assert.equal(s.favor,Math.min(G.FAVOR_MAX,favor+2));assert.ok(s.glory.includes('patroclo'));
 const a=hero(s,'aquiles');assert.equal(a.patroclus,false);assert.equal(a.away,false);assert.equal(a.level,2);assert.deepEqual(a.known,[0,2]);assert.equal(a.zone,'N4');assert.equal(a.hp,G.HEROES.stats(a).maxHp);
 const spear=s.enemies.find(e=>e.id==='e91');assert.ok(spear.intimidated,'os troianos perto fogem da ira');assert.ok(G.validSave(s));
});
test('Patroclus has no rescue; falling far from Hector brings Achilles back without rewards',()=>{
 let s=briseida();s.enemies=[G.TROOPS.create('e90','A1','lanceiro')];s.nextEnemy=91;hero(s,'aquiles').hp=1;hero(s,'odisseu').zone='N1';hero(s,'agamemnon').zone='N1';const favor=s.favor;
 s=G.trojanTurn(s);assert.equal(s.patroclus.facing,false);assert.equal(s.favor,favor);assert.ok(!s.glory.includes('patroclo'));assert.equal(hero(s,'aquiles').away,false,'Aquiles voltou na rodada seguinte');
 assert.equal(G.act(s,'odisseu','rescue','aquiles').ok,false,'sem socorro');
});
test('if Patroclus survives, Achilles never comes back and the outcome records it',()=>{
 let s=briseida();const hec=G.TROOPS.create('e90','A1','heitor');hec.hp=7;hec.armor=0;s.enemies=[hec];s.nextEnemy=91;s=act(s,'odisseu','attack','e90');
 assert.equal(s.result,'victory');assert.equal(s.outcome.legacy.patroclus,'alive');assert.equal(s.outcome.legacy.duel,'ira');assert.match(s.reason,/braços cruzados/);
});
test('from mission 3 on, feats give Favor and Glory, not abilities',()=>{
 let s=setup({abilities:{aquiles:0,odisseu:0,agamemnon:0}});const hec=G.TROOPS.create('e90','A1','heitor');hec.armor=0;s.enemies=[hec];s.nextEnemy=91;const favor=s.favor;
 s=act(s,'aquiles','attack','e90');assert.ok(s.personal.aquiles.done);assert.equal(s.encounter,null,'sem nova habilidade');assert.ok(s.glory.includes('aquiles'));assert.equal(s.favor,favor+1);
});
test('refusing brings the plague in a growing cycle of life, Favor and food, until the council changes course',()=>{
 let s=setup({legacy:{criseida:'taken'},campFood:0});s=G.choose(s,'refuse').state;assert.ok(s.plagueActive);
 const hp=s.heroes.map(h=>h.hp);s=G.trojanTurn(s);assert.deepEqual(s.heroes.map(h=>h.hp),hp.map(x=>x-1),'1º: vida');
 s.favor=3;s=G.trojanTurn(s);assert.equal(s.favor,2,'2º: Favor');
 s.campFood=5;s=G.trojanTurn(s);assert.equal(s.campFood,4,'3º: comida');
 const h2=s.heroes.map(h=>h.hp);s=G.trojanTurn(s);assert.deepEqual(s.heroes.map(h=>h.hp),h2.map(x=>Math.max(0,x-2)),'o castigo cresce no 2º ciclo');
 s.enemies=[];s.heroes.forEach(h=>{h.hp=5;h.ap=2;});s=act(s,'agamemnon','interact','council');assert.equal(s.encounter.id,'crises');assert.ok(!G.crisesChoices(s).includes('refuse'));s=G.choose(s,'sacrifice').state;assert.equal(s.plagueActive,false);
});
test('Criseida in the camp delays the first reinforcement; Paris shoots from afar',()=>{
 let s=setup({legacy:{criseida:'taken'}});s=G.choose(s,'intercede').ok?s:G.choose(s,'refuse').state;s.plagueActive=false;s.alarm=3;s=G.trojanTurn(s);assert.ok(s.alarmFired.includes(4));assert.equal(s.enemies.length,0,'Troia hesita');
 let p=setup();p.enemies=[G.TROOPS.create('e90','P1','paris')];p.nextEnemy=91;const hp=hero(p,'odisseu').hp;p=G.trojanTurn(p);assert.ok(p.heroes.some(h=>h.hp<6),'Páris atira em quem está a até 2 peças');assert.equal(p.enemies[0].zone,'P1','quem atira não avança');
});
test('wounding Hector by 4 makes him and every Trojan retreat: victory',()=>{
 let s=setup();const hec=G.TROOPS.create('e90','A1','heitor');hec.hp=7;hec.armor=0;s.enemies=[hec,G.TROOPS.create('e91','P1','lanceiro')];s.nextEnemy=92;s.revealed.push('P1');
 s=act(s,'aquiles','attack','e90');assert.equal(s.result,'victory');assert.equal(s.enemies.length,0);assert.ok(s.personal.aquiles.done);
});
test('the Trojans burn the tents when no hero stands in A1',()=>{
 let s=setup();s.heroes.forEach(h=>h.zone='N1');s.enemies=[G.TROOPS.create('e90','A1','lanceiro')];s.nextEnemy=91;s=G.trojanTurn(s);assert.equal(s.campDamage,1);
});
test('the bot holds the line in most rosters and choices',()=>{
 const extras=['aquiles','ajax','menelau'];let wins=0,games=0;
 for(let mask=1;mask<8;mask++){const team=['odisseu','agamemnon',...extras.filter((_,i)=>mask&(1<<i))];
  for(const crises of ['none','sacrifice','briseida']){const s=play(team,crises==='none'?{}:{legacy:{criseida:'taken'},crises});games++;if(s.result==='victory')wins++;}}
 assert.ok(wins/games>=.6,'vitórias do robô: '+wins+'/'+games);
});
