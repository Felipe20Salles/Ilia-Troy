const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/cavalo.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const setup=(options={})=>{const s=G.newGame({heroes:['aquiles','odisseu','agamemnon'],...options});s.foodSetup=false;return s;};
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// Robô simples: corta madeira no bosque conhecido mais perto, arrasta até A2, trabalha no cavalo; luta com quem estiver na frente.
function play(ids,options={}){let s=G.newGame({heroes:ids,players:ids.length,...options});
 if(s.foodSetup){for(const h of s.heroes)while(s.campFood&&h.hp<G.HEROES.stats(h).maxHp)s=G.allocateFood(s,h.id,1).state;s=G.finishFoodSetup(s).state;}
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<20&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<4;i++){
   while(s.encounter){const e=s.encounter;s=G.choose(s,e.id==='grove'?(options.grove||'cut'):e.choices[0]).state;}
   const h=hero(s,id);if(s.result||!h.hp||!h.ap)break;
   const def=G.HEROES.find(d=>d.id===id),here=s.enemies.filter(e=>e.zone===h.zone);
   const kd=(a,b)=>G.knownDistance(s,a,b),links=G.ZONES[h.zone].links.filter(z=>G.isRevealed(s,z)),opens=z=>(G.CLUES[z]||[]).some(x=>!G.isRevealed(s,x));
   if(here.length){const foe=here.sort((a,b)=>a.hp-b.hp)[0];const c=def.cards.findIndex((c,n)=>['attack','intimidate'].includes(c.type)&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down&&h.hp>=2){doAct(id,'rescue',down.id);continue;}
   const options2=G.interactions(s,h).filter(x=>x.available),pick=id2=>options2.find(x=>x.id===id2);
   const choice=pick('deliver')||pick('work')||pick('meet-grove')||pick('cut')||pick('pickup')||(pick('explore')&&opens(h.zone)?pick('explore'):null)||pick('blind');
   if(choice){doAct(id,'interact',choice.id);continue;}
   const range=G.HEROES.stats(h).range,inRange=s.enemies.filter(e=>G.isRevealed(s,e.zone)&&G.distance(h.zone,e.zone)<=range&&e.zone!==h.zone).sort((a,b)=>a.hp-b.hp)[0];
   if(inRange&&range>=1&&!h.cargo){doAct(id,'attack',inRange.id);continue;}
   let goal=null;
   if(h.cargo)goal='A2';
   else{const sources=s.revealed.filter(z=>!s.enemies.some(e=>e.hold&&e.zone===z)).filter(z=>(z==='M3'?(s.grove==='unseen'||(s.grove==='cut'&&s.woodLeft.M3>0)):(s.woodLeft[z]||0)>0)||(s.piles[z]&&s.piles[z].tora+s.piles[z].corniso>0)).filter(z=>kd(h.zone,z)<Infinity);
    const clue=s.revealed.filter(z=>s.tokens[z]&&!s.tokens[z].resolved&&opens(z)&&kd(h.zone,z)<Infinity);
    const cover=z=>s.enemies.filter(e=>e.type==='arqueiro'&&G.distance(e.zone,z)<=1).length*2;
    // Um guerreiro de vida cheia vai cegar as torres que já estão na mesa.
    const tower=id===ids[2]&&h.hp>=4?Object.keys(G.TOWERS).find(z=>G.isRevealed(s,z)&&!s.blinded.includes(z)&&kd(h.zone,z)<Infinity):null;
    if(tower)goal=tower;else goal=[...sources,...clue].sort((a,b)=>kd(h.zone,a)+cover(a)-kd(h.zone,b)-cover(b))[0]||null;
    // Quem tem vida cala antes o arqueiro que cobre o bosque escolhido.
    const archer=goal&&!tower&&h.hp>=4&&G.HEROES.stats(h).range===0&&s.enemies.find(e=>e.type==='arqueiro'&&G.isRevealed(s,e.zone)&&G.distance(e.zone,goal)<=1);if(archer)goal=archer.zone;}
   if(goal&&goal!==h.zone&&G.canMove(h)){const danger=z=>s.enemies.filter(e=>e.zone===z||(e.hold&&G.TROOPS.types[e.type].range&&G.distance(e.zone,z)<=1)).length;const posted=z=>z!==goal&&!G.TOWERS[goal]&&!(s.enemies.some(e=>e.zone===z&&e.type==='arqueiro'))&&s.enemies.some(e=>e.hold&&e.zone===z);const step=links.filter(z=>!posted(z)).sort((a,b)=>kd(a,goal)-kd(b,goal)||danger(a)-danger(b))[0];if(!step)break;doAct(id,'move',step);continue;}
   if(h.used.length&&!here.length){doAct(id,'rest');continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}
module.exports={play};

test('the ships are gone: N1 is off the board, the heroes start at the camp and the new pieces are hidden',()=>{
 const s=setup();assert.ok(G.validSave(s));assert.ok(!G.ZONES.N1,'N1 saiu da mesa');assert.ok(s.heroes.every(h=>h.zone==='A1'));
 assert.ok(G.HIDDEN.every(z=>!s.revealed.includes(z)));assert.ok(G.BASE.every(z=>s.revealed.includes(z)));
 assert.ok(['M1','M4','M5','M2'].every(z=>s.enemies.some(e=>e.zone===z&&e.hold)),'portão e três torres guardados');
});
test('the Palladium discoveries each help in one point',()=>{
 assert.equal(setup({discoveries:['forma']}).stages,4,'a forma tira uma etapa');
 assert.equal(setup({discoveries:['medida']}).stages,5);
 assert.equal(G.newGame({heroes:['aquiles','odisseu','agamemnon','ajax','menelau'],players:5,owners:[1,2,3,4,5],discoveries:['medida']}).stages,6,'cinco heróis: o cavalo leva mais gente');
 assert.equal(setup({discoveries:[]}).stages,6,'sem nenhuma, uma etapa a mais');
 assert.equal(setup({discoveries:['motivo'],favor:1}).favor,3,'o Paládio: +2 de Favor');
 assert.equal(setup({discoveries:['motivo'],favor:1,legacy:{paladio:false}}).favor,1,'sem o Paládio de verdade, não');
 assert.equal(setup({discoveries:['medida']}).reworked,true,'com a medida, não há retrabalho');
 const fromCampaign=setup({legacy:{discoveries:['forma','medida','desconfia'],paladio:true}});assert.deepEqual(fromCampaign.discoveries,['forma','medida','desconfia']);
});
test('cutting, carrying (2 pieces per round) and delivering wood; working 2 times builds a stage',()=>{
 let s=setup({discoveries:['forma','medida']});s.enemies=[];const o=hero(s,'odisseu');o.zone='C2';
 s.revealed.push('B1');o.zone='B1';s=act(s,'odisseu','interact','cut');assert.equal(hero(s,'odisseu').cargo,'tora');assert.equal(s.woodLeft.B1,1);
 hero(s,'odisseu').ap=2;s=act(s,'odisseu','move','C1');s=act(s,'odisseu','move','P2');assert.equal(G.act(s,'odisseu','move','A2').ok,false,'quem arrasta anda só 2 peças');
 s.heroes.forEach(h=>{h.moves=0;h.ap=G.HEROES.stats(h).actions;});s=act(s,'odisseu','move','A2');s=act(s,'odisseu','interact','deliver');assert.equal(s.wood,1);
 hero(s,'odisseu').ap=2;s=act(s,'odisseu','interact','work');assert.equal(s.work,1);s=act(s,'agamemnon','move','A2');s=act(s,'agamemnon','interact','work');assert.equal(s.stage,1);assert.equal(s.wood,0);
 assert.equal(G.interactions(s,hero(s,'agamemnon')).find(x=>x.id==='work').available,false,'sem madeira, não há trabalho');
});
test('without Aeacus wall, the horse is redone once at stage 3, bigger',()=>{
 let s=setup({discoveries:['forma']});s.enemies=[];s.stage=2;s.wood=3;s.heroes.forEach(h=>h.zone='A2');
 s=act(s,'aquiles','interact','work');s=act(s,'aquiles','interact','work');assert.equal(s.stage,2,'a etapa 3 se desfaz');assert.equal(s.wood,2);assert.match(s.lastFind.title,/Pequeno demais/);
 s=act(s,'odisseu','interact','work');s=act(s,'odisseu','interact','work');assert.equal(s.stage,3,'a segunda vez fica');
});
test('the last stage wins the mission and records the horse for the night of the horse',()=>{
 let s=setup({discoveries:['forma','medida','desconfia']});s.enemies=[];s.stage=3;s.wood=1;s.cornel=1;s.apollo=1;s.grove='cut';s.heroes.forEach(h=>h.zone='A2');
 s=act(s,'aquiles','interact','work');s=act(s,'aquiles','interact','work');assert.equal(s.result,'victory');
 assert.equal(s.outcome.completed,'cavalo');assert.equal(s.outcome.legacy.apolloPrice,1);assert.equal(s.outcome.legacy.laocoonte,true);assert.equal(s.outcome.legacy.horse.cornel,1);
});
test('Apollo grove: deciding at M3 opens the cornel (worth 2), and every cut is counted in secret',()=>{
 let s=setup();s.enemies=[];s.revealed.push('M3');const a=hero(s,'aquiles');a.zone='M3';
 assert.ok(!G.interactions(s,a).some(x=>x.id==='cut'),'antes de decidir, não se corta');
 s=act(s,'aquiles','interact','meet-grove');assert.equal(s.encounter.id,'grove');s=G.choose(s,'cut').state;assert.equal(s.woodLeft.M3,2);
 hero(s,'aquiles').ap=3;s=act(s,'aquiles','interact','cut');assert.equal(hero(s,'aquiles').cargo,'corniso');assert.equal(s.apollo,1);
 hero(s,'aquiles').zone='A2';hero(s,'aquiles').ap=3;s=act(s,'aquiles','interact','deliver');assert.equal(s.wood,2,'corniso vale 2');assert.equal(s.cornel,1);
 let p=setup();p.enemies=[];p.revealed.push('M3');hero(p,'odisseu').zone='M3';p=act(p,'odisseu','interact','meet-grove');const f=p.favor;p=G.choose(p,'spare').state;assert.equal(p.favor,f+1);assert.ok(!G.interactions(p,hero(p,'odisseu')).some(x=>x.id==='cut'));
});
test('towers watch carriers until blinded; blinding takes 2 actions clear of enemies',()=>{
 let s=setup();s.enemies=[];const o=hero(s,'odisseu');o.zone='B5';o.cargo='tora';s.heroes.forEach(h=>h.ap=0);
 const a0=s.alarm;let t=G.trojanTurn(s);assert.deepEqual(t.seen,['M5']);assert.equal(t.alarm,a0+1,'a torre viu');assert.ok(t.revealed.includes('M5'),'a torre escondida se revela');
 s.revealed.push('M5');const a=hero(s,'aquiles');a.zone='M5';a.ap=3;s=act(s,'aquiles','interact','blind');s=act(s,'aquiles','interact','blind');assert.deepEqual(s.blinded,['M5']);
 s.heroes.forEach(h=>h.ap=0);t=G.trojanTurn(s);assert.deepEqual(t.seen,[]);
});
test('raids that reach A2 with nobody there burn progress; a fallen carrier drops the log',()=>{
 let s=setup();s.enemies=[G.TROOPS.create('e50','A2','lanceiro')];s.nextEnemy=51;s.round=5;s.stage=2;s.wood=1;s.work=1;s.heroes.forEach(h=>{h.ap=0;h.zone='A1';});
 s=G.trojanTurn(s);assert.equal(s.work,0);s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.wood,0);s.heroes.forEach(h=>h.ap=0);s=G.trojanTurn(s);assert.equal(s.stage,1);assert.equal(s.burnt,3);
 let d=setup();d.enemies=[G.TROOPS.create('e50','P2','lanceiro')];d.nextEnemy=51;const o=hero(d,'odisseu');o.zone='P2';o.cargo='tora';o.hp=1;d.heroes.forEach(h=>h.ap=0);
 d=G.trojanTurn(d);assert.equal(hero(d,'odisseu').hp,0);assert.equal(hero(d,'odisseu').cargo,false);assert.equal(d.piles.P2.tora,1);
});
test('alarm 18 means Troy found the horse; round 12 ends the wait',()=>{
 let s=setup();s.alarm=17;s.alarmFired=[4,7,11,15];s.heroes.forEach(h=>h.ap=0);hero(s,'aquiles').zone='B5';hero(s,'aquiles').cargo='tora';s=G.trojanTurn(s);assert.equal(s.result,'defeat');assert.match(s.reason,/descobriu o cavalo/);
 let t=setup();t.round=12;t.enemies=[];t.heroes.forEach(h=>h.ap=0);t=G.trojanTurn(t);assert.equal(t.result,'defeat');assert.match(t.reason,/Tênedos/);
 let u=setup({heitor:true});u.enemies=[];u.alarm=14;u.alarmFired=[4,7,11];u.heroes.forEach(h=>h.ap=0);hero(u,'aquiles').zone='B5';hero(u,'aquiles').cargo='tora';u=G.trojanTurn(u);assert.ok(u.enemies.some(e=>e.type==='heitor'),'com Heitor vivo, é ele quem sai');
});
test('the clues open the unrevealed pieces of the board',()=>{
 let s=setup();s.enemies=[];const o=hero(s,'odisseu');o.zone='C1';s=act(s,'odisseu','interact','explore');assert.ok(s.revealed.includes('P5')&&s.revealed.includes('B1'));
 o.zone;hero(s,'odisseu').zone='P3';s=act(s,'odisseu','interact','explore');assert.ok(s.revealed.includes('M3'));assert.equal(s.personal.odisseu.done,true);
});
test('the bot builds the horse with some rosters, not most (only the shape, the guaranteed discovery)',()=>{
 const ids=['aquiles','ajax','odisseu','menelau','agamemnon'];let wins=0,games=0;
 for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];
  for(const abilities of [undefined,Object.fromEntries(team.map(i=>[i,0]))]){const s=play(team,{abilities});games++;if(s.result==='victory')wins++;}}
 // Meta do Felipe (05/10/2026): no máximo 6 vitórias em 14 (43%), e ao menos 20%.
 assert.ok(wins/games>=.2&&wins/games<=6/14,'vitórias do robô: '+wins+'/'+games);
});
