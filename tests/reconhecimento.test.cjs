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
   const kd=(a,b)=>G.knownDistance(s,a,b),links=G.ZONES[h.zone].links.filter(z=>G.isRevealed(s,z)),opens=z=>(G.CLUES[z]||[]).some(x=>!G.isRevealed(s,x));
   if(s.reconned&&h.zone!=='A1'&&!(reporter&&!reporter.hp&&reporter.zone===h.zone&&h.hp>=2)){const danger=z=>s.enemies.filter(e=>e.zone===z).length;const step=links.slice().sort((a,b)=>kd(a,'A1')-kd(b,'A1')||danger(a)-danger(b))[0];doAct(id,'move',step);continue;}
   if(here.length){const foe=here.sort((a,b)=>a.hp-b.hp)[0];const c=def.cards.findIndex((c,n)=>['attack','intimidate'].includes(c.type)&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down&&h.hp>=2){doAct(id,'rescue',down.id);continue;}
   const option=G.interactions(s,h).find(x=>x.available&&(x.id==='recon'||(x.id==='explore'&&(opens(h.zone)||h.hp<=G.HEROES.stats(h).maxHp-2))));if(option){doAct(id,'interact',option.id);continue;}
   // Atira primeiro nos arqueiros ao alcance; antes do reconhecimento, os guerreiros calam a torre que atira na aproximação.
   const range=G.HEROES.stats(h).range,archers=s.enemies.filter(e=>e.type==='arqueiro'&&G.isRevealed(s,e.zone));
   const inRange=s.enemies.filter(e=>G.isRevealed(s,e.zone)&&G.distance(h.zone,e.zone)<=range).sort((a,b)=>(b.type==='arqueiro')-(a.type==='arqueiro')||a.hp-b.hp)[0];
   if(inRange&&range>=1){doAct(id,'attack',inRange.id);continue;}
   const tower=!s.reconned&&range===0&&h.hp>=4?archers.find(e=>G.distance(e.zone,'M1')<=1):null;
   let goal=s.reconned?(reporter&&!reporter.hp&&h.hp>=3?reporter.zone:'A1'):(tower?tower.zone:'M1');
   if(kd(h.zone,goal)===Infinity){const clue=s.revealed.filter(z=>s.tokens[z]&&!s.tokens[z].resolved&&opens(z)&&kd(h.zone,z)<Infinity).sort((a,b)=>kd(h.zone,a)-kd(h.zone,b))[0];if(clue)goal=clue;}
   if(goal!==h.zone&&kd(h.zone,goal)<Infinity){const step=links.slice().sort((a,b)=>kd(a,goal)-kd(b,goal))[0];doAct(id,'move',step);continue;}
   if(h.used.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('the mission starts at the camp with the territory of mission 1 and the walls hidden',()=>{
 const s=setup();assert.ok(G.validSave(s));assert.ok(s.heroes.every(h=>h.zone==='A1'));assert.ok(G.BASE.every(z=>s.revealed.includes(z)));assert.ok(s.revealed.includes('P3'),'Agamêmnon aponta a planície');assert.ok(G.WALLS.filter(z=>z!=='P3').every(z=>!s.revealed.includes(z)));assert.ok(s.enemies.some(e=>e.zone==='M1'&&e.type==='guarda'&&e.hold));
});
test('mission 1 consequences carry over: castaways, the old man, the lookout, life and the store',()=>{
 const s=setup({legacy:{castaways:'rescued',beggar:'zeus',lookout:true},campFood:2,life:{aquiles:2}});
 assert.equal(s.campFood,3);assert.equal(s.favor,2);assert.ok(s.revealed.includes('M4'),'do mirante já se via a torre');assert.equal(hero(s,'aquiles').hp,2);assert.ok(s.foodSetup);
 let a=G.allocateFood(s,'aquiles',1).state;assert.equal(hero(a,'aquiles').hp,3);assert.equal(a.campFood,2);assert.equal(G.allocateFood(s,'aquiles',-1).ok,false,'não se tira vida que já havia');
 const b=setup({legacy:{castaways:'lost',beggar:'spy',lookout:false}});assert.equal(b.favor,0);assert.equal(b.alarm,2);assert.ok(b.enemies.some(e=>e.zone==='P1'&&e.type==='lanceiro'&&!e.hold));
});
test('reconnaissance takes 2 actions at M1 clear of enemies; afterwards Troy chases and the alarm rises 2 per Trojan phase',()=>{
 let s=setup();s.revealed.push(...G.WALLS);s.enemies=[];hero(s,'odisseu').zone='M1';s=act(s,'odisseu','interact','recon');assert.equal(s.reconned,false);s=act(s,'odisseu','interact','recon');assert.ok(s.reconned);assert.equal(s.reporter,'odisseu');assert.equal(s.alarm,2);hero(s,'odisseu').zone='P1';s=G.trojanTurn(s);assert.equal(s.enemies.filter(e=>e.zone==='M1'&&e.type==='lanceiro').length,2,'os perseguidores saem do portão na fase de Troia');assert.ok(s.enemies.filter(e=>e.zone==='M1').length>=2);
 s.enemies=[];const a=s.alarm;s=G.trojanTurn(s);assert.equal(s.alarm,a+2);
});
test('the Greeks win when every standing hero is back in A1; whoever lies fallen in the field dies',()=>{
 let s=setup();s.revealed.push(...G.WALLS);s.enemies=[];hero(s,'odisseu').zone='M1';s=act(s,'odisseu','interact','recon');s=act(s,'odisseu','interact','recon');s.enemies=[];
 hero(s,'odisseu').zone='M4';s=G.trojanTurn(s);assert.equal(s.result,null,'Odisseu ainda está longe');
 hero(s,'odisseu').zone='A1';hero(s,'aquiles').hp=0;hero(s,'aquiles').zone='P4';s=G.trojanTurn(s);assert.equal(s.result,'victory','a vitória vem mesmo com uma perda');assert.equal(hero(s,'aquiles').zone,'P4','ninguém arrasta o caído');assert.match(s.reason,/Aquiles ficou na planície/);assert.equal(s.personal.agamemnon.done,false,'a volta não foi completa');
 let d=setup();d.revealed.push(...G.WALLS);d.enemies=[];hero(d,'odisseu').zone='M1';d=act(d,'odisseu','interact','recon');d=act(d,'odisseu','interact','recon');d.enemies=[];hero(d,'odisseu').hp=0;d=G.trojanTurn(d);assert.equal(d.result,null,'quem leva o relato precisa voltar de pé');assert.equal(s.outcome.completed,'reconhecimento');assert.ok(s.outcome.heroes.length===3);
});
test('Criseida, the shepherds and the tower are choices with hidden effects',()=>{
 let s=setup();s.revealed.push(...G.WALLS,'B5');s.enemies=[];hero(s,'aquiles').zone='P2';hero(s,'aquiles').hp=4;s=act(s,'aquiles','move','C1');assert.equal(s.encounter.id,'criseida');
 const t=G.choose(s,'take').state;assert.equal(t.criseida,'taken');assert.equal(hero(t,'aquiles').hp,6,'as oferendas viram vida');assert.equal(G.choose(s,'respect').state.criseida,'respected');
 let p=setup();p.revealed.push(...G.WALLS,'B5');p.enemies=[];hero(p,'odisseu').zone='P4';p.campFood=2;p=act(p,'odisseu','move','B5');assert.equal(p.encounter.id,'shepherds');p=G.choose(p,'pay').state;assert.equal(hero(p,'odisseu').hp,6,'a vida do herói não muda');assert.equal(p.campFood,1,'sai 1 comida do armazém');assert.ok(p.scrolls.includes('pastores-1'));
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
test('heroes only move between revealed pieces; the clues of P3, P7 and P4 open the way to the gate',()=>{
 let s=setup();s.enemies=[];hero(s,'odisseu').zone='P3';assert.equal(G.act(s,'odisseu','move','P7').ok,false,'P7 ainda não foi descoberta');
 const alarm=s.alarm;s=act(s,'odisseu','interact','explore');assert.deepEqual(s.lastReveals,['M4','P7']);assert.equal(s.alarm,alarm,'observar as torres não faz barulho');
 s=act(s,'odisseu','move','P7');s=G.trojanTurn(s);s.enemies=[];s=act(s,'odisseu','interact','explore');assert.ok(G.isRevealed(s,'M1')&&G.isRevealed(s,'P4'));assert.equal(s.personal.odisseu.done,true,'duas fichas investigadas');
 let r=setup({abilities:{aquiles:0,odisseu:2,agamemnon:0}});r.enemies=[];assert.equal(G.act(r,'odisseu','card:2','P7').ok,false,'Caminho Seguro só vai a peças reveladas');
});

test('fallen heroes die: they leave the campaign, and the next mission starts with the smaller team',()=>{
 const C=require('../cooperativo/campaign-state.js');
 const rec=C.record(null,{completed:'desembarque',campFood:1,heroes:[{id:'odisseu',owner:1,hp:3,level:1,known:[0]},{id:'agamemnon',owner:2,hp:0,level:1,known:[0]},{id:'aquiles',owner:3,hp:5,level:1,known:[0]}]},[],3,['Ana','Bia','Caio']);
 assert.deepEqual(rec.team.heroes,['odisseu','aquiles']);assert.ok(rec.fallen.includes('agamemnon'));assert.equal(rec.team.players,2);assert.deepEqual(rec.team.playerNames,['Ana','Caio']);assert.deepEqual(rec.team.owners,[1,2]);
 const s=G.newGame({campaign:true,players:rec.team.players,heroes:rec.team.heroes,owners:rec.team.owners,known:rec.team.known,life:rec.team.life});assert.ok(G.validSave(s));assert.equal(s.heroes.length,2);
});
test('an archer hidden in an unrevealed tower reveals the piece when it shoots',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1});const h=s.heroes.find(x=>x.id==='aquiles');h.zone='P3';
 const archer=s.enemies.find(e=>e.type==='arqueiro'&&e.zone==='M4');assert.ok(archer,'arqueiro na torre');assert.equal(s.revealed.includes('M4'),false);
 const hp=h.hp;s=G.trojanTurn(s);
 assert.ok(s.revealed.includes('M4'),'a torre aparece na mesa');assert.ok(s.lastReveals.includes('M4'));assert.ok(s.heroes.find(x=>x.id==='aquiles').hp<hp,'o tiro acerta');assert.ok(G.validSave(s));
});
test('reconnoitring the gate sends a raid from P2 to burn the ships; each burned ship is one food less for mission 3',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1});s.enemies=s.enemies.filter(e=>e.type!=='arqueiro');
 const h=s.heroes.find(x=>x.id==='odisseu');h.zone='M1';s.revealed.push('M1');s.enemies=s.enemies.filter(e=>e.zone!=='M1');
 let r=G.act(s,'odisseu','interact','recon');if(r.ok&&!r.state.reconned)r=G.act(r.state,'odisseu','interact','recon');assert.ok(r.ok,r.error);s=r.state;assert.ok(s.reconned);
 const raid=s.enemies.find(e=>e.raid);assert.ok(raid);assert.equal(raid.zone,'P2');assert.match(G.intent(raid,s),/navios/);
 s.heroes.forEach(x=>{x.zone=x.id==='odisseu'?'M1':'A1';});raid.zone='N1';s.campFood=4;
 s=G.trojanTurn(s);assert.equal(s.shipsBurned,1,'sem herói em N1, um navio queima');
 s.heroes.find(x=>x.id==='aquiles').zone='N1';const burned=s.shipsBurned;s=G.trojanTurn(s);assert.equal(s.shipsBurned,burned,'com herói em N1, os navios ficam');assert.ok(G.validSave(s));
});
test('respecting the sanctuary of Apollo earns the favor of the gods',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1});s.favor=1;const h=s.heroes.find(x=>x.id==='odisseu');h.zone='P2';s.enemies=s.enemies.filter(e=>e.zone!=='C1');
 let r=G.act(s,'odisseu','move','C1');assert.ok(r.ok,r.error);s=r.state;assert.equal(s.encounter?.id,'criseida');s=G.choose(s,'respect').state;assert.equal(s.criseida,'respected');assert.equal(s.favor,2,'+1 de Favor');
});
test('taking Criseida is the tempting choice: food, an ability for Agamemnon and the altar gold for mission 3; respecting gives 1 Favor',()=>{
 const atC1=()=>{let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1,abilities:{odisseu:0,agamemnon:0,aquiles:0}});s.favor=1;s.enemies=s.enemies.filter(e=>e.zone!=='C1');s.heroes.find(x=>x.id==='odisseu').zone='P2';const r=G.act(s,'odisseu','move','C1');assert.ok(r.ok,r.error);return r.state;};
 let t=G.choose(atC1(),'take').state;assert.equal(t.criseida,'taken');assert.equal(t.encounter?.id,'ability');assert.equal(t.encounter.hero,'agamemnon');assert.ok(t.altarGold);
 let r=G.choose(atC1(),'respect').state;assert.equal(r.favor,2,'+1 de Favor');
 const M3=require('../cooperativo/segurar.js');const s3=M3.newGame({heroes:['odisseu','agamemnon','aquiles'],campFood:1,legacy:{criseida:'taken',altarGold:true}});assert.equal(s3.campFood,3,'o ouro do altar vale +2 de comida');
});
