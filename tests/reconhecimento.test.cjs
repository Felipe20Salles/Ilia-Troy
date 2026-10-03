const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/reconhecimento.js');
const ALL=Object.keys(G.ZONES);
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const setup=(options={})=>G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô simples: vai ao portão, reconhece e volta; luta com quem estiver na frente.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<40&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='criseida'?(options.criseida||'respect'):e.id==='shepherds'?'leave':e.id==='tower'?'train':e.choices[0]).state;}
   const h=hero(s,id);if(s.result||!h.hp||!h.ap)break;
   const def=G.HEROES.find(d=>d.id===id),here=s.enemies.filter(e=>e.zone===h.zone&&G.isRevealed(s,e.zone));
   const reporter=s.heroes.find(a=>a.id===s.reporter);
   if(s.reconned&&h.zone!=='A1'&&!(reporter&&!reporter.hp&&reporter.zone===h.zone&&h.hp>=2)){const danger=z=>s.enemies.filter(e=>e.zone===z).length;const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,'A1')-G.distance(b,'A1')||danger(a)-danger(b))[0];doAct(id,'move',step);continue;}
   if(here.length){const foe=here.sort((a,b)=>a.hp-b.hp)[0];const c=def.cards.findIndex((c,n)=>['attack','intimidate'].includes(c.type)&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down&&h.hp>=2){doAct(id,'rescue',down.id);continue;}
   const option=G.interactions(s,h).find(x=>x.available&&(x.id==='recon'||(x.id==='explore'&&h.hp<=G.HEROES.stats(h).maxHp-2)));if(option){doAct(id,'interact',option.id);continue;}
   let goal=s.reconned?(reporter&&!reporter.hp&&h.hp>=3?reporter.zone:'A1'):'M1';
   if(goal!==h.zone){const step=G.ZONES[h.zone].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal))[0];doAct(id,'move',step);continue;}
   if(h.used.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('the mission starts at the camp with the territory of mission 1 and the walls hidden',()=>{
 const s=setup();assert.ok(G.validSave(s));assert.ok(s.heroes.every(h=>h.zone==='A1'));assert.ok(G.BASE.every(z=>s.revealed.includes(z)));assert.ok(G.WALLS.every(z=>!s.revealed.includes(z)));assert.ok(s.enemies.some(e=>e.zone==='M1'&&e.type==='guarda'&&e.hold));
});
test('mission 1 consequences carry over: castaways, the old man, the lookout, life and the store',()=>{
 const s=setup({legacy:{castaways:'rescued',beggar:'zeus',lookout:true},campFood:2,life:{aquiles:2}});
 assert.equal(s.campFood,3);assert.equal(s.favor,2);assert.ok(s.revealed.includes('P3'));assert.equal(hero(s,'aquiles').hp,2);assert.ok(s.foodSetup);
 let a=G.allocateFood(s,'aquiles',1).state;assert.equal(hero(a,'aquiles').hp,3);assert.equal(a.campFood,2);assert.equal(G.allocateFood(s,'aquiles',-1).ok,false,'não se tira vida que já havia');
 const b=setup({legacy:{castaways:'lost',beggar:'spy',lookout:false}});assert.equal(b.favor,0);assert.equal(b.alarm,2);assert.ok(b.enemies.some(e=>e.zone==='P1'&&e.type==='lanceiro'&&!e.hold));
});
test('reconnaissance takes 2 actions at M1 clear of enemies; afterwards Troy chases and the alarm rises 2 per Trojan phase',()=>{
 let s=setup();s.revealed.push(...G.WALLS);s.enemies=[];hero(s,'odisseu').zone='M1';s=act(s,'odisseu','interact','recon');assert.equal(s.reconned,false);s=act(s,'odisseu','interact','recon');assert.ok(s.reconned);assert.equal(s.reporter,'odisseu');assert.equal(s.alarm,2);hero(s,'odisseu').zone='P1';s=G.trojanTurn(s);assert.equal(s.enemies.filter(e=>e.zone==='M1'&&e.type==='lanceiro').length,2,'os perseguidores saem do portão na fase de Troia');assert.ok(s.enemies.filter(e=>e.zone==='M1').length>=2);
 s.enemies=[];const a=s.alarm;s=G.trojanTurn(s);assert.equal(s.alarm,a+2);
});
test('the Greeks win when every standing hero is back in A1 after the reconnaissance',()=>{
 let s=setup();s.revealed.push(...G.WALLS);s.enemies=[];hero(s,'odisseu').zone='M1';s=act(s,'odisseu','interact','recon');s=act(s,'odisseu','interact','recon');s.enemies=[];
 hero(s,'odisseu').zone='M4';s=G.trojanTurn(s);assert.equal(s.result,null,'Odisseu ainda está longe');
 hero(s,'odisseu').zone='A1';hero(s,'aquiles').hp=0;hero(s,'aquiles').zone='P4';s=G.trojanTurn(s);assert.equal(s.result,'victory','os caídos são arrastados pelos seus homens');assert.equal(hero(s,'aquiles').zone,'A1');assert.equal(s.personal.agamemnon.done,false,'a volta não foi completa');
 let d=setup();d.revealed.push(...G.WALLS);d.enemies=[];hero(d,'odisseu').zone='M1';d=act(d,'odisseu','interact','recon');d=act(d,'odisseu','interact','recon');d.enemies=[];hero(d,'odisseu').hp=0;d=G.trojanTurn(d);assert.equal(d.result,null,'quem leva o relato precisa voltar de pé');assert.equal(s.outcome.completed,'reconhecimento');assert.ok(s.outcome.heroes.length===3);
});
test('Criseida, the shepherds and the tower are choices with hidden effects',()=>{
 let s=setup();s.revealed.push(...G.WALLS,'B5');s.enemies=[];hero(s,'aquiles').zone='P2';hero(s,'aquiles').hp=4;s=act(s,'aquiles','move','C1');assert.equal(s.encounter.id,'criseida');
 const t=G.choose(s,'take').state;assert.equal(t.criseida,'taken');assert.equal(hero(t,'aquiles').hp,6,'as oferendas viram vida');assert.equal(G.choose(s,'respect').state.criseida,'respected');
 let p=setup();p.revealed.push(...G.WALLS);p.enemies=[];hero(p,'odisseu').zone='P4';p=act(p,'odisseu','move','B5');assert.equal(p.encounter.id,'shepherds');p=G.choose(p,'pay').state;assert.equal(hero(p,'odisseu').hp,5);assert.ok(p.scrolls.includes('pastores-1'));
 let w=setup();w.revealed.push(...G.WALLS);w.enemies=[];hero(w,'agamemnon').zone='M4';w=act(w,'agamemnon','interact','tower');w=act(w,'agamemnon','interact','tower');assert.equal(w.encounter.id,'tower');assert.equal(w.alarm,2);
 const plan=G.choose(w,'plan').state;assert.ok(plan.scrolls.includes('segredos-1'));const train=G.choose(w,'train').state;assert.equal(train.encounter.id,'evolution');
});
test('the trail of P7 gives Coast Routes II only to those who brought the tablet',()=>{
 let s=setup({scrolls:['rotas-1']});s.revealed.push(...G.WALLS);s.enemies=[];hero(s,'odisseu').zone='P7';s=act(s,'odisseu','interact','explore');assert.ok(s.scrolls.includes('rotas-2'));
 let n=setup();n.revealed.push(...G.WALLS);n.enemies=[];hero(n,'odisseu').zone='P7';n=act(n,'odisseu','interact','explore');assert.ok(!n.scrolls.includes('rotas-2'));
});
test('Sarpedon comes at alarm 15 and his fall makes Troy retreat',()=>{
 let s=setup();s.enemies=[];s.alarm=14;s.alarmFired=[4,7,11];s=G.trojanTurn(s);const sar=s.enemies.find(e=>e.type==='sarpedon');assert.ok(sar);
 sar.zone='A1';sar.hp=1;sar.armor=0;s.revealed.push('M1');s=act(s,'aquiles','attack',sar.id);assert.ok(s.commanderDown);assert.equal(s.enemies.length,0);
});
test('the bot completes most rosters',()=>{
 const ids=['aquiles','ajax','odisseu','menelau','agamemnon'];let wins=0,games=0;
 for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];
  for(const abilities of [undefined,Object.fromEntries(team.map(i=>[i,0]))]){const s=play(team,{abilities});games++;if(s.result==='victory')wins++;}}
 assert.ok(wins/games>=.6,'vitórias do robô: '+wins+'/'+games);
});
