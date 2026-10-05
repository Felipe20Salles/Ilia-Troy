const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/landing.js');
const defaultHeroes=['aquiles','odisseu','agamemnon'];
const ALL=Object.keys(G.ZONES);
function ready(s){return s;}
const setup=(options={})=>ready(G.newGame({heroes:defaultHeroes,...options}));
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
function play(ids,players=ids.length,route='A',abilities){let s=ready(G.newGame({heroes:ids,players,route,abilities}));
 const doAct=(id,action,target)=>{const r=G.act(s,id,action,target);if(!r.ok)throw Error(id+' '+action+' '+target+': '+r.error);s=r.state;if(!G.validSave(s))throw Error('Invalid state after '+action);};
 for(let turn=0;turn<40&&!s.result;turn++){
  for(const id of ids)for(let i=0;i<3;i++){
   while(s.encounter){s=G.choose(s,s.encounter.id==='beggar'?'refuse':s.encounter.id==='ability'?s.encounter.choices[0]:s.encounter.id==='evolution'?s.encounter.choices[0]:s.encounter.id==='castaways'?'rescue':s.encounter.id==='tracks'?'follow':'ok').state;}
   const h=hero(s,id);if(s.result||!h.hp||!h.ap)break;
   const def=G.HEROES.find(d=>d.id===id),foe=s.enemies.find(e=>e.zone===h.zone);
   if(foe){const here=s.enemies.filter(e=>e.zone===h.zone),multi=def.cards.findIndex((c,n)=>c.type==='multiRanged'&&!h.used.includes(n)&&h.known.includes(n));if(multi>=0){doAct(id,'card:'+multi,here.slice(0,2).map(e=>e.id).join(','));continue;}const c=def.cards.findIndex((c,n)=>c.type==='attack'&&!h.used.includes(n)&&h.known.includes(n));doAct(id,c<0?'attack':'card:'+c,foe.id);continue;}
   const down=s.heroes.find(a=>a.zone===h.zone&&!a.hp);if(down&&h.hp>=3){doAct(id,'rescue',down.id);continue;}
   const opens=z=>(G.CLUES[z]||[]).some(x=>!G.isRevealed(s,x));
   const option=G.interactions(s,h).find(x=>x.available&&(['deliver','pickup','install','castaways'].includes(x.id)||(x.id==='explore'&&(opens(h.zone)||h.hp<=G.HEROES.stats(h).maxHp-2))));if(option){doAct(id,'interact',option.id);continue;}
   const scout=!h.cargo&&h.hp>=5&&!s.built&&s.delivered<s.required&&!s.enemies.some(x=>x.type!=='explorador'&&G.isRevealed(s,x.zone)&&G.distance(h.zone,x.zone)<=1)&&s.enemies.find(e=>e.type==='explorador'&&G.isRevealed(s,e.zone)&&G.ZONES[h.zone].links.includes(e.zone)&&s.enemies.filter(x=>x.zone===e.zone).length===1);
   if(scout){const charge=def.cards.findIndex((c,n)=>c.type==='charge'&&!h.used.includes(n)&&h.known.includes(n));doAct(id,charge>=0?'card:'+charge:'move',charge>=0?scout.id:scout.zone);continue;}
   const kd=(a,b)=>G.knownDistance(s,a,b);
   let goal='A1',lost=false;if(!h.cargo&&s.delivered<s.required){const supply=Object.keys(s.supplies).filter(k=>s.supplies[k]>0&&kd(h.zone,k)<Infinity).sort((a,b)=>kd(h.zone,a)-kd(h.zone,b));if(supply.length)goal=supply[0];else lost=s.delivered+s.heroes.filter(a=>a.cargo).length<s.required;}
   // Depois de instalar: caçar Enéias (se desceu) ou as tropas perto do acampamento.
   const campZones=['A1','P1','A2','N1'],eneias=s.enemies.find(e=>e.type==='eneias'),near=s.enemies.filter(e=>campZones.includes(e.zone)).sort((a,b)=>G.distance(h.zone,a.zone)-G.distance(h.zone,b.zone))[0];
   if(s.built&&!h.cargo)goal=eneias?eneias.zone:near?near.zone:'A1';
   // Um guardião em A1 quando Troia ameaça as caixas entregues.
   const raider=s.enemies.find(e=>!e.hold&&G.distance(e.zone,'A1')<=1);if(!h.cargo&&s.delivered>0&&raider&&!s.heroes.some(a=>a.id!==id&&a.hp>0&&a.zone==='A1')){const keeper=s.heroes.filter(a=>a.hp>=3&&!a.cargo).sort((a,b)=>G.distance(a.zone,'A1')-G.distance(b.zone,'A1'))[0];if(keeper&&keeper.id===id)goal='A1';}
   const threatened=!h.cargo&&s.heroes.find(x=>x.id!==h.id&&x.hp>0&&x.cargo&&s.enemies.some(e=>G.isRevealed(s,e.zone)&&G.distance(e.zone,x.zone)<=2));if(threatened)goal=threatened.zone;
   // Sem caminho conhecido até o objetivo: ir investigar a ficha mais próxima que abre território.
   if(lost||kd(h.zone,goal)===Infinity){const clue=s.revealed.filter(z=>s.tokens[z]&&!s.tokens[z].resolved&&opens(z)&&kd(h.zone,z)<Infinity).sort((a,b)=>kd(h.zone,a)-kd(h.zone,b))[0];if(clue)goal=clue;}
   if(goal!==h.zone&&kd(h.zone,goal)<Infinity&&(!h.cargo||h.moves===0)){const danger=z=>s.enemies.filter(e=>e.zone===z).length,links=G.ZONES[h.zone].links.filter(z=>G.isRevealed(s,z));const step=links.slice().sort((a,b)=>kd(a,goal)-kd(b,goal)||(h.cargo?danger(a)-danger(b):0))[0];const safer=h.cargo?links.filter(z=>kd(z,goal)<=kd(step,goal)+1&&kd(z,goal)<=kd(h.zone,goal)).sort((a,b)=>danger(a)-danger(b)||kd(a,goal)-kd(b,goal))[0]:step;doAct(id,'move',safer||step);continue;}
   if(h.used.length&&!s.enemies.some(e=>e.zone===h.zone)){doAct(id,'rest');continue;}
   const guard=def.cards.findIndex((c,n)=>c.type==='guard'&&!h.used.includes(n)&&h.known.includes(n));if(guard>=0&&h.zone==='A1'){doAct(id,'card:'+guard);continue;}break;
  }
  if(!s.result)s=G.trojanTurn(s);
  if(!G.validSave(s))throw Error('Invalid state after round');
 }
 return s;
}

test('the bot wins most legal rosters of 3, 4 or 5 heroes on both routes',()=>{let wins=0,games=0;
 const ids=G.HEROES.map(h=>h.id);
 for(const route of ['A','B'])for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];const s=play(team,team.length,route);games++;if(s.result!=='victory')continue;wins++;assert.equal(s.delivered,team.length);assert.equal(s.outcome.next,'Diante das muralhas');assert.equal(s.outcome.supplies,s.delivered-s.burned);assert.ok(s.outcome.revealedZones.includes('A1'));}
 // Com o posto de A1 e a exploração por indícios (03/10/2026), a missão ficou mais difícil de propósito: o teste de mesa a achou fácil.
 // Desde 04/10/2026 a queda de Enéias não limpa o mapa (só a guarda dele recua): mais difícil ainda.
 assert.ok(wins/games>=.5,'vitórias do robô: '+wins+'/'+games);
});
test('solo and two player teams finish, ownership and setup validate',()=>{
 for(const players of [1,2]){const s=play(['menelau','agamemnon','odisseu'],players);assert.ok(['victory','defeat'].includes(s.result));assert.ok(G.validSave(s));}
 for(const options of [{players:0},{players:6},{players:5},{players:2,owners:[1,1,1]},{heroes:['ajax','ajax','aquiles']},{heroes:['ajax','aquiles','unknown']}])assert.throws(()=>G.newGame(options));
});
test('player names persist with the expedition and remain valid in saved games',()=>{
 const s=G.newGame({players:2,playerNames:['Felipe','Ana'],heroes:['odisseu','agamemnon','aquiles'],owners:[1,2,1]});
 assert.deepEqual(s.playerNames,['Felipe','Ana']);assert.ok(G.validSave(s));
 const invalid=structuredClone(s);invalid.playerNames=['Felipe',''];assert.equal(G.validSave(invalid),false);
});
test('the expedition starts with only N1, every hero there and the cargo spread along the beaches',()=>{
 const s=setup();assert.deepEqual(s.revealed,['N1']);assert.ok(s.heroes.every(h=>h.zone==='N1'));assert.deepEqual(s.supplies,{N1:1,N3:1,N4:1});assert.equal(s.enemies.length,1,'o mirante de P1 começa vazio');assert.equal(s.enemies[0].zone,'A1');assert.ok(s.enemies[0].hold&&s.enemies[0].watch,'a vigia fica parada em A1');assert.equal(G.isRevealed(s,'A1'),false);assert.equal(s.post.status,'hidden');
 assert.deepEqual(setup({route:'B'}).supplies,{N1:1,N2:1,N4:1});
 const five=G.newGame({players:5,heroes:G.HEROES.map(h=>h.id)});assert.deepEqual(five.supplies,{N1:2,N2:1,N3:1,N4:1});for(const zone of Object.keys(five.supplies))assert.ok(G.BEACHES.includes(zone));
});
test('failed actions neither mutate state nor spend actions',()=>{
 const s=setup(),before=JSON.stringify(s);assert.equal(G.act(s,'aquiles','move','P2').ok,false);assert.equal(G.act(s,'aquiles','attack','e1').ok,false);assert.equal(G.act(s,'aquiles','card:2').ok,false);assert.equal(JSON.stringify(s),before);
});
test('heroes only move between revealed pieces; investigating a clue reveals where it points',()=>{
 let s=setup();assert.equal(G.act(s,'aquiles','card:1','e1').ok,false,'inimigo escondido não é alvo');assert.equal(G.act(s,'aquiles','move','A2').ok,false,'não se anda para o desconhecido');
 const alarm=s.alarm;s=act(s,'aquiles','interact','explore');assert.deepEqual(s.lastReveals,['A2','N2']);assert.equal(s.alarm,alarm,'seguir as pegadas não faz barulho');assert.match(s.lastFind.text,/pegadas/);
 s=act(s,'aquiles','move','A2');assert.equal(hero(s,'aquiles').zone,'A2');assert.equal(G.isRevealed(s,'A1'),false,'A1 só aparece com a busca em A2');
});
test('a carried crate allows only one movement per round, but fighting and interacting stay free',()=>{
 let s=setup();s.revealed.push('A1','A2');s=act(s,'aquiles','interact','pickup');s=act(s,'aquiles','move','A1');assert.equal(G.act(s,'aquiles','move','N1').ok,false);
 hero(s,'aquiles').ap=1;s.enemies[0].zone='A1';s=act(s,'aquiles','attack','e1');assert.equal(hero(s,'aquiles').ap,0);
 s=G.trojanTurn(s);if(!s.result){s.enemies=[];s=act(s,'aquiles','move','N1');assert.equal(hero(s,'aquiles').moves,1);}
 let t=setup();t.revealed.push('A1','A2');t=act(t,'odisseu','interact','pickup');t=act(t,'aquiles','move','A1');t=act(t,'aquiles','move','A2');t.revealed.push('P2');t.visited.push('P2');assert.equal(G.act(t,'odisseu','card:2','P2').ok,false,'com caixa, Caminho Seguro só cobre uma peça');
});
test('the alarm rises with time, scouts and the ship, and its steps bring reinforcements up to Troy in force',()=>{
 let s=setup();s.enemies=[];s=G.trojanTurn(s);assert.equal(s.alarm,1);
 s.revealed.push('A1','P1');s.heroes.forEach(h=>h.zone='A1');s.visited.push('A1');s.enemies=[G.TROOPS.create('e9','A1','lanceiro')];s.nextEnemy=10;
 s.enemies.push(G.TROOPS.create('e8','A1','explorador'));s=G.trojanTurn(s);assert.equal(s.alarm,3,'tempo e um batedor que avistou os heróis');s.enemies=[];s=G.trojanTurn(s);assert.ok(s.alarmFired.includes(4));assert.ok(s.enemies.some(e=>e.zone==='C2'));assert.ok(G.isRevealed(s,'C2'),'tropas revelam a peça onde surgem');
 let ship=setup();ship.revealed.push('N2','N3','N4');ship.visited.push('N2','N3');hero(ship,'aquiles').zone='N3';ship=act(ship,'aquiles','move','N4');assert.equal(ship.alarm,1);
 let end=setup();end.enemies=[];end.alarm=G.ALARM_MAX-1;end.alarmFired=[4,7,11,15];end=G.trojanTurn(end);assert.equal(end.result,null,'o Alarme 18 não derrota sozinho');assert.equal(end.enemies.filter(e=>e.type==='lanceiro'&&!e.hold).length,end.heroes.length-1);assert.equal(end.enemies.filter(e=>e.type==='arqueiro').length,1);
 let en=setup();en.enemies=[];en.alarm=14;en.alarmFired=[4,7,11];en=G.trojanTurn(en);const ene=en.enemies.find(e=>e.type==='eneias');assert.ok(ene);assert.equal(ene.hp,7);assert.equal(ene.attack,2);assert.equal(ene.armor,1);
});
test('castaways need two actions before the alarm limit, reward food and reveal the cargo beaches',()=>{
 let s=setup();s.revealed.push('N2','N3');s.visited.push('N2');hero(s,'aquiles').zone='N2';s=act(s,'aquiles','move','N3');assert.equal(s.encounter.id,'castaways');assert.equal(G.act(s,'odisseu','move','A1').ok,false,'o encontro pausa a partida');
 s=G.choose(s,'rescue').state;s.enemies=[];const food=s.campFood;s=act(s,'aquiles','interact','castaways');assert.equal(s.castaways.progress,1);hero(s,'odisseu').zone='N3';s=act(s,'odisseu','interact','castaways');assert.equal(s.castaways.status,'rescued');assert.equal(s.campFood,food+1);assert.ok(G.isRevealed(s,'N4'));
 let lost=setup();lost.enemies=[];lost.alarm=G.CASTAWAY_LIMIT-1;lost=G.trojanTurn(lost);assert.equal(lost.castaways.status,'lost');
});
test('the beggar is Zeus: giving him bread earns 2 Favor and calms the alarm at once; refusing makes him a spy',()=>{
 const atC1=()=>{let s=setup();s.revealed.push('A1','A2','P2','C1');s.visited.push('A1','A2','P2');s.enemies=[];hero(s,'odisseu').zone='P2';s=act(s,'odisseu','move','C1');assert.equal(s.encounter.id,'beggar');return s;};
 let refused=G.choose(atC1(),'refuse').state;assert.equal(refused.beggar.status,'spy');assert.equal(refused.alarm,2);assert.ok(refused.enemies.some(e=>e.zone==='C1'&&e.type==='lanceiro'));
 let s=atC1();s.alarm=4;s.favor=1;const hp=hero(s,'odisseu').hp;s=G.choose(s,'accept').state;
 assert.equal(s.beggar.status,'zeus','sem escolta: ele recebe o pão e some');assert.equal(s.favor,3,'+2 de Favor');assert.equal(s.alarm,3,'Alarme −1');assert.equal(hero(s,'odisseu').hp,hp-1,'quem dá o pão perde 1 de vida');assert.match(s.lastFind.text,/Zeus/);
});
test('exploration food heals whoever found it and the surplus goes to the store; the patrol tablet is a scroll; the lookout is a two-action challenge whose evolution the team assigns',()=>{
 let s=setup();s.revealed=[...ALL];s.visited=[...ALL];s.enemies=[];
 hero(s,'aquiles').zone='A2';hero(s,'aquiles').hp=5;const food=s.campFood,noise=s.alarm;s=act(s,'aquiles','interact','explore');assert.equal(hero(s,'aquiles').hp,6,'a comida vira força de quem a encontrou');assert.equal(s.campFood,food+1,'o que passa do máximo vai para o armazém');assert.equal(s.alarm,noise+1,'toda busca faz barulho');assert.equal(G.act(s,'aquiles','interact','explore').ok,false);
 hero(s,'odisseu').zone='P2';s.alarm=3;s=act(s,'odisseu','interact','explore');assert.equal(s.alarm,4,'a tabuinha não tem efeito agora; a busca faz barulho');assert.deepEqual(s.scrolls,['rotas-1'],'pergaminho Rotas da costa I');assert.equal(G.HEROES.stats(hero(s,'odisseu')).attack,2,'nenhum bônus de atributo fora das evoluções');
 hero(s,'agamemnon').zone='P1';const alarm=s.alarm;s=act(s,'agamemnon','interact','lookout');assert.equal(s.encounter,null);s=act(s,'agamemnon','interact','lookout');assert.equal(s.encounter.id,'evolution');assert.equal(s.alarm,alarm+1);assert.equal(G.act(s,'aquiles','move','N1').ok,false,'a escolha pausa a partida');assert.equal(G.choose(s,'nobody').ok,false);s=G.choose(s,'aquiles').state;assert.equal(hero(s,'aquiles').level,2,'a equipe escolhe quem evolui');assert.equal(hero(s,'agamemnon').level,1);assert.ok(G.validSave(s));
});
test('boxes are conserved across collection, carrying, delivery and save reload',()=>{
 let s=setup();s=act(s,'aquiles','interact','pickup');assert.equal(hero(s,'aquiles').cargo,true);assert.equal(s.supplies.N1,0);assert.equal(G.act(s,'aquiles','interact','pickup').ok,false);
 s.revealed.push('A1');s.enemies=[];s=act(s,'aquiles','move','A1');hero(s,'aquiles').ap=1;s=act(s,'aquiles','interact','deliver');assert.equal(s.delivered,1);assert.ok(G.validSave(JSON.parse(JSON.stringify(s))));
});
test('falling drops cargo; rescue costs no action and transfers 1 life from the rescuer',()=>{
 let s=setup();s=act(s,'aquiles','interact','pickup');s.revealed.push('N2');s.visited.push('N2');const aquiles=hero(s,'aquiles');aquiles.zone='N2';aquiles.hp=1;s.enemies[0].zone='N2';s=G.trojanTurn(s);assert.equal(hero(s,'aquiles').hp,0);assert.equal(hero(s,'aquiles').cargo,false);assert.equal(s.supplies.N2,1);assert.ok(G.validSave(s));
 hero(s,'odisseu').zone='N2';const ap=hero(s,'odisseu').ap;s=act(s,'odisseu','rescue','aquiles');assert.equal(hero(s,'aquiles').hp,1);assert.equal(hero(s,'aquiles').ap,1);assert.equal(hero(s,'odisseu').hp,5);assert.equal(hero(s,'odisseu').ap,ap,'socorrer não gasta ação');
 hero(s,'odisseu').hp=1;hero(s,'aquiles').hp=0;assert.equal(G.act(s,'odisseu','rescue','aquiles').ok,false,'com 1 de vida não há o que transferir');
 let r=setup();r.heroes.forEach(h=>h.hp=4);r.heroes[0].used=[0];assert.equal(G.act(r,r.heroes[1].id,'rest').ok,false,'recuperar não cura');r=act(r,r.heroes[0].id,'rest');assert.equal(r.heroes[0].hp,4);assert.deepEqual(r.heroes[0].used,[]);
});
test('installation requires all boxes and brings no extra counterattack',()=>{
 const rosters={3:['odisseu','agamemnon','aquiles'],4:['odisseu','agamemnon','aquiles','ajax'],5:['odisseu','agamemnon','aquiles','ajax','menelau']};
 for(const count of [3,4,5]){let s=ready(G.newGame({players:count,heroes:rosters[count]}));s.revealed.push('A1');s.heroes[0].zone='A1';assert.equal(G.act(s,s.heroes[0].id,'interact','install').ok,false);s.delivered=count;s.supplies={};s.enemies=[];s.enemies=[G.TROOPS.create('e90','P1','lanceiro')];s.nextEnemy=91;s=act(s,s.heroes[0].id,'interact','install');assert.ok(s.built);assert.equal(s.enemies.length,1);assert.equal(s.result,null,'há tropa perto do acampamento');}
});
test('the Greeks win by clearing the camp surroundings, or by killing Aeneas once he has come',()=>{
 let s=setup();s.revealed.push('A1','A2','P1');s.delivered=s.required;s.supplies={};s.heroes[0].zone='A1';s.enemies=[G.TROOPS.create('e90','P6','lanceiro')];s.nextEnemy=91;
 s=act(s,s.heroes[0].id,'interact','install');assert.equal(s.result,'victory','tropas longe do acampamento não contam');
 let g=setup();g.revealed.push('A1','A2','P1');g.delivered=g.required;g.supplies={};g.heroes[0].zone='A1';const post=G.TROOPS.create('e90','P1','lanceiro');post.hold=true;g.enemies=[post];g.nextEnemy=91;g=act(g,g.heroes[0].id,'interact','install');assert.equal(g.result,'victory','a guarnição do mirante não ameaça as tendas');
 let e=setup();e.revealed.push('A1','A2','P1');e.delivered=e.required;e.supplies={};e.built=true;e.alarm=15;e.alarmFired=[4,7,11,15];const ene=Object.assign(G.TROOPS.create('e90','A1','eneias'),{hp:1,attack:2,armor:0});e.enemies=[ene,G.TROOPS.create('e91','N4','lanceiro')];e.nextEnemy=92;hero(e,'aquiles').zone='A1';
 e=act(e,'aquiles','attack','e90');assert.equal(e.result,'victory','sem Enéias e sem troianos perto das tendas');assert.equal(e.enemies.length,1,'a tropa longe da guarda não recua');
});
test('Troy attacks the camp: a standing hero shields it, otherwise it takes damage and loses a crate',()=>{
 let s=setup();s.revealed.push('A1');s.post.status='taken';s.delivered=2;s.supplies.N1=0;s.supplies={N3:1};s.heroes.forEach(h=>h.zone='N1');s.enemies=[G.TROOPS.create('e90','A1','explorador')];s.nextEnemy=91;
 s=G.trojanTurn(s);assert.equal(s.campDamage,1);assert.equal(s.burned,1);
 let d=setup();d.revealed.push('A1');d.post.status='taken';d.enemies=[G.TROOPS.create('e90','A1','explorador')];d.nextEnemy=91;hero(d,'agamemnon').zone='A1';d=G.trojanTurn(d);assert.equal(d.campDamage,0,'o guardião luta no lugar das tendas');
});
test('sabotage and incapacitation cause defeat',()=>{
 let s=setup();s.revealed.push('A1');s.post.status='taken';s.campDamage=2;s.enemies=[G.TROOPS.create('e90','A1','explorador')];s.nextEnemy=91;assert.equal(G.trojanTurn(s).result,'defeat');
 s=setup();s.heroes.forEach(h=>{h.hp=0;h.ap=0;});s.heroes[0].hp=1;s.enemies[0].zone='N1';assert.equal(G.trojanTurn(s).result,'defeat');
});
test('all fourteen active skills have a legal effect and spend one action',()=>{
 for(const def of G.HEROES)for(let i=0;i<3;i++){
  if(def.cards[i].passive)continue;
  let s=ready(G.newGame({players:5,heroes:G.HEROES.map(h=>h.id)}));s.revealed=[...ALL];s.visited=[...ALL];const h=hero(s,def.id),ally=s.heroes.find(a=>a.id!==h.id);h.hp=3;s.enemies=[{id:'e1',type:'explorador',hp:3,attack:2,armor:0,zone:'N2'}];s.nextEnemy=2;let target;
  const type=def.cards[i].type;
  if(['attack','multiRanged'].includes(type)){h.zone='N2';target='e1';}else if(['charge','ranged','precision'].includes(type))target='e1';
  else if(type==='intimidate'){h.zone='N2';target='e1';}
  else if(type==='healAlly'){ally.hp=0;ally.ap=0;target=ally.id;}
  else if(type==='grantAction')target=ally.id;else if(type==='guide')target=ally.id+':P1';else if(type==='sprint')target='A1';else if(type==='refresh'){ally.used=[0,1];target=ally.id;}
  const r=G.act(s,h.id,'card:'+i,target);assert.ok(r.ok,def.name+' '+def.cards[i].name+': '+r.error);const after=hero(r.state,h.id);assert.equal(after.ap,1);assert.ok((def.cards[i].once?after.onceUsed:after.used).includes(i));assert.ok(G.validSave(r.state));
 }
});
test('Agamemnon prepares ally skills without adding actions or targeting himself',()=>{
 let s=ready(G.newGame({players:5,heroes:G.HEROES.map(h=>h.id)}));s.heroes[0].used=[0];s.heroes[0].ap=0;assert.equal(G.act(s,'agamemnon','card:1','agamemnon').ok,false);s=act(s,'agamemnon','card:1','aquiles');assert.deepEqual(s.heroes[0].used,[]);assert.equal(s.heroes[0].ap,0);assert.equal(G.act(s,'agamemnon','card:1','aquiles').ok,false);
});
test('save validation rejects missing boxes, duplicate owners, hidden positions and stale versions',()=>{
 const s=setup();assert.ok(G.validSave(s));const extra=structuredClone(s);extra.supplies.N1++;assert.equal(G.validSave(extra),false);
 const t=G.newGame({players:3});t.heroes[0].owner=2;assert.equal(G.validSave(t),false);
 const u=setup();u.heroes[0].zone='P2';assert.equal(G.validSave(u),false,'herói em peça não revelada');
 const v=setup();v.version=7;assert.equal(G.validSave(v),false);
});
test('the chronicle follows the moments of the mission: a request comes from the moment that explains it, breathers only in quiet rounds',()=>{
 let s=setup();s.enemies=[];s=G.trojanTurn(s);assert.deepEqual([s.chronicle.id,s.chronicle.status],['corvo','told'],'rodada calma: uma cena curta');
 s.revealed.push('A2');s.visited.push('A2');hero(s,'odisseu').zone='A2';s=act(s,'odisseu','interact','explore');assert.equal(s.post.status,'found');s.enemies=s.enemies.filter(e=>!e.relief);
 s=G.trojanTurn(s);assert.deepEqual([s.chronicle.id,s.chronicle.status],['sinal','open'],'o posto achado acende a fumaça');
 const ignored=G.trojanTurn(structuredClone(s));assert.equal(ignored.chronicleResult.status,'fail');
 s.revealed.push('P6');s.visited.push('P6');hero(s,'odisseu').zone='P6';const watched=G.trojanTurn(s);assert.equal(watched.chronicleResult.status,'success');
 let busy=setup();busy.enemies=[];busy.moments=['caixa'];busy=G.trojanTurn(busy);assert.equal(busy.chronicle,null,'rodada com momento: a crônica fica calada');assert.ok(G.validSave(busy));
 let r=setup();r.enemies=[];hero(r,'aquiles').used=[0];r=G.trojanTurn(r);assert.deepEqual(hero(r,'aquiles').used,[0],'a crônica não prepara habilidades');assert.ok(G.validSave(r));
});
test('each hero starts with the chosen ability and every personal feat teaches another one',()=>{
 const start={aquiles:0,odisseu:1,agamemnon:0,menelau:0,ajax:1};
 assert.throws(()=>G.newGame({heroes:defaultHeroes,abilities:{aquiles:0}}),/habilidade inicial/);
 let k=setup({abilities:start});assert.deepEqual(hero(k,'aquiles').known,[0]);k.revealed=[...ALL];k.visited=[...ALL];k.enemies=[G.TROOPS.create('e8','N1','explorador')];k.nextEnemy=9;
 assert.equal(G.act(k,'aquiles','card:2').ok,false,'habilidade ainda não aprendida');
 k.enemies[0].hp=1;k=act(k,'aquiles','attack','e8');k.enemies=[G.TROOPS.create('e9','N1','explorador')];k.nextEnemy=10;k.enemies[0].hp=1;const alarm=k.alarm,favor=k.favor;k=act(k,'aquiles','attack','e9');
 assert.equal(k.personal.aquiles.done,true);assert.equal(k.encounter.id,'ability');assert.deepEqual(k.encounter.choices,[1,2]);assert.equal(k.alarm,alarm,'o feito não mexe no Alarme');assert.equal(k.favor,favor+1);
 assert.equal(G.act(k,'odisseu','move','A1').ok,false,'a escolha pausa a partida');assert.equal(G.choose(k,0).ok,false);k=G.choose(k,2).state;assert.deepEqual(hero(k,'aquiles').known,[0,2]);assert.ok(G.validSave(k));
 let o=setup({abilities:start});o.enemies=[];o=act(o,'odisseu','interact','explore');o=act(o,'odisseu','move','A2');o=G.trojanTurn(o);o.enemies=[];o=act(o,'odisseu','interact','explore');o=act(o,'odisseu','move','N2');o=G.trojanTurn(o);o.enemies=[];assert.equal(o.encounter,null);o=act(o,'odisseu','interact','explore');assert.equal(o.encounter.id,'ability','três fichas investigadas');o=G.choose(o,0).state;assert.deepEqual(hero(o,'odisseu').known,[0,1]);
 let g=setup({abilities:start});g.revealed.push('A1');g.heroes.forEach(h=>h.zone='A1');g.delivered=g.required;g.supplies={};g.enemies=[];g=act(g,'agamemnon','interact','install');assert.equal(g.encounter.id,'ability');assert.equal(g.encounter.hero,'agamemnon');
 let m=ready(G.newGame({heroes:['odisseu','agamemnon','menelau'],abilities:start}));m.enemies=[];hero(m,'odisseu').hp=0;hero(m,'odisseu').ap=0;m=act(m,'menelau','rescue','odisseu');assert.equal(m.encounter.hero,'menelau');
 let a=ready(G.newGame({heroes:['odisseu','agamemnon','ajax'],abilities:start}));a.revealed.push('A1');a.visited.push('A1');hero(a,'ajax').zone='A1';for(let i=0;i<3;i++){a.enemies=[G.TROOPS.create('e'+(9+i),'A1','explorador')];a.nextEnemy=10+i;a.enemies[0].attack=1;hero(a,'ajax').hp=6;a=G.trojanTurn(a);if(a.encounter)break;}
 assert.equal(a.personal.ajax.done,true);assert.equal(a.encounter.hero,'ajax');
 let sv=setup({abilities:{...start,aquiles:0}});const aj=ready(G.newGame({heroes:['odisseu','agamemnon','ajax'],abilities:start}));const x=hero(aj,'ajax');x.hp=1;G.HEROES.damage(aj,x,5,()=>{});assert.equal(x.hp,0,'Sobrevivente só age se o Ájax já o aprendeu');
});
test('favor rises with honor, falls with impiety and pays for one divine invocation per round',()=>{
 let s=setup();assert.equal(s.favor,1);s.revealed=[...ALL];s.visited=[...ALL];s.enemies=[];
 hero(s,'aquiles').zone='A2';let r=G.invoke(s,'atena','A2');assert.ok(r.ok,r.error);s=r.state;assert.equal(s.favor,0);assert.equal(s.tokens.A2.peeked,true);assert.match(G.interactions(s,hero(s,'aquiles')).find(x=>x.id==='explore').detail,/Atena revelou/);
 assert.equal(G.invoke(s,'hera','aquiles').ok,false,'Hera não existe mais');s.favor=6;assert.equal(G.invoke(s,'poseidon').ok,false,'uma invocação por rodada');
 s=G.trojanTurn(s);s.enemies=[];s.alarm=5;const fav=s.favor;s=G.invoke(s,'poseidon').state;assert.equal(s.alarm,3);assert.equal(s.favor,fav-2);
 s.chronicleQueue.push('sinal');s=G.trojanTurn(s);s.enemies=[];assert.equal(s.chronicle.id,'sinal');s=G.invoke(s,'zeus').state;assert.equal(s.chronicle.favored,true);const calm=s.alarm;s=G.trojanTurn(s);assert.equal(s.chronicleResult.status,'success');assert.equal(s.alarm,calm+1,'só o tempo: o sinal foi abafado pelo presságio');assert.ok(G.validSave(s));
 let refused=setup();refused.revealed.push('A1','A2','P2','C1');refused.visited.push('A1','A2','P2');refused.enemies=[];hero(refused,'odisseu').zone='P2';refused=act(refused,'odisseu','move','C1');refused=G.choose(refused,'refuse').state;assert.equal(refused.favor,0);
});
test('route B hides danger behind the same clues: a snake in the wreckage and an ambush on the trail',()=>{
 let s=setup({route:'B'});s.revealed=[...ALL];s.visited=[...ALL];s.enemies=[];
 hero(s,'aquiles').zone='N2';s=act(s,'aquiles','interact','explore');assert.equal(hero(s,'aquiles').hp,4);assert.match(s.lastFind.text,/víbora/);
 hero(s,'odisseu').zone='P6';s=act(s,'odisseu','interact','explore');assert.equal(s.encounter.id,'tracks','as pegadas pedem uma decisão');s=G.choose(s,'follow').state;assert.ok(s.enemies.some(e=>e.zone==='P6'&&e.type==='lanceiro'));
 let a=setup();a.revealed=[...ALL];a.visited=[...ALL];a.enemies=[];hero(a,'odisseu').zone='P6';const food=a.campFood;a=act(a,'odisseu','interact','explore');a=G.choose(a,'follow').state;assert.equal(a.campFood,food+2,'odisseu estava cheio: a comida vai para o armazém');assert.equal(a.favor,1,'o Favor só vem dos feitos');
 assert.equal(G.tokenOf(a,'N2').hint,G.tokenOf({route:'B'},'N2').hint,'a pista não denuncia o perigo');
});

test('Troy hunts crate carriers, garrisons the lookout and the beggar does not wait forever',()=>{
 let s=setup();s.revealed=[...ALL];s.visited=[...ALL];s.enemies=[G.TROOPS.create('e9','P2','lanceiro')];s.nextEnemy=10;hero(s,'aquiles').zone='N3';hero(s,'aquiles').cargo=true;s.supplies.N1--;
 assert.equal(G.huntGoal(s,s.enemies[0]),'N3');assert.match(G.intent(s.enemies[0],s),/Caçar/);s=G.trojanTurn(s);assert.equal(s.enemies[0].zone,'N3','a tropa vai atrás de quem carrega');
 let g=setup();g.enemies=[];g.alarm=7;g=G.trojanTurn(g);const post=g.enemies.find(e=>e.zone==='P1');assert.ok(post&&post.hold,'Troia guarnece o mirante');g=G.trojanTurn(g);assert.equal(g.enemies.find(e=>e.id===post.id).zone,'P1','a guarnição não sai do posto');
});
test('starting with a single chosen ability, the bot still wins most rosters',()=>{let wins=0,games=0;
 const abilities={aquiles:0,ajax:1,odisseu:1,menelau:0,agamemnon:2},ids=G.HEROES.map(h=>h.id);
 for(const route of ['A','B'])for(let mask=0;mask<32;mask++){const picked=ids.filter((_,i)=>mask&(1<<i));if(picked.length<3||!picked.includes('odisseu')||!picked.includes('agamemnon'))continue;const team=['odisseu','agamemnon',...picked.filter(id=>!['odisseu','agamemnon'].includes(id))];const s=play(team,team.length,route,abilities);games++;if(s.result==='victory')wins++;}
 assert.ok(wins/games>=.45,'vitórias do robô: '+wins+'/'+games);
});

test('the trail and the castaways each offer two hidden-outcome choices',()=>{
 let s=setup();s.revealed=[...ALL];s.visited=[...ALL];s.enemies=[];s.alarm=4;hero(s,'odisseu').zone='P6';s=act(s,'odisseu','interact','explore');const before=s.alarm;s=G.choose(s,'erase').state;
 assert.equal(s.alarm,before-1,'apagar os rastros acalma Troia');assert.equal(s.tokens.P6.resolved,true);assert.equal(s.enemies.length,0);assert.equal(G.choose(s,'follow').ok,false);
 let c=setup();c.revealed.push('N2','N3');c.visited.push('N2');c.enemies=[];hero(c,'aquiles').zone='N2';c=act(c,'aquiles','move','N3');const food=c.campFood;c=G.choose(c,'cargo').state;
 assert.equal(c.castaways.status,'abandoned');assert.equal(c.campFood,food+1);assert.equal(G.interactions(c,hero(c,'aquiles')).some(x=>x.id==='castaways'),false,'não há mais quem resgatar');assert.ok(G.validSave(c));
});

test('charge and the two-area dash still work after a hero carrying a crate has moved, the dash covering one area only',()=>{
  const find=type=>{for(const d of G.HEROES){const i=d.cards.findIndex(c=>c.type===type);if(i>=0)return [d.id,i];}};
  for(const type of ['charge','sprint']){
    const [id,n]=find(type),others=['odisseu','agamemnon',id==='aquiles'?'ajax':'aquiles'].filter(x=>x!==id),s=setup({heroes:[id,...others].slice(0,3).concat(id==='odisseu'||id==='agamemnon'?['aquiles']:[]).filter((x,i,a)=>a.indexOf(x)===i)});
    const h=hero(s,id);h.known=[0,1,2];h.cargo=true;h.moves=1;s.supplies.N1=Math.max(0,s.supplies.N1-1);
    for(const z of ALL)if(!s.revealed.includes(z))s.revealed.push(z);
    if(type==='charge'){const e={...G.TROOPS.create('e99','N2','explorador')};s.enemies.push(e);const r=G.act(s,id,'card:'+n,'e99');assert.ok(r.ok,r.error);assert.equal(hero(r.state,id).zone,'N2');}
    else{const far=ALL.find(z=>G.knownDistance(s,'N1',z)===2),near=G.ZONES.N1.links[0];assert.equal(G.act(s,id,'card:'+n,far).ok,false);const r=G.act(s,id,'card:'+n,near);assert.ok(r.ok,r.error);assert.equal(hero(r.state,id).zone,near);}
  }
});

test('feeding the old man costs 1 life of whoever gives the bread, and someone must be able to spare it',()=>{
 let w=setup();w.revealed.push('A1','A2','P2','C1');w.visited.push('A1','A2','P2');w.enemies=[];hero(w,'odisseu').zone='P2';w=act(w,'odisseu','move','C1');hero(w,'odisseu').hp=1;assert.equal(G.choose(w,'accept').ok,false,'com 1 de vida, ninguém pode dividir o pão');
});

test('archers neither strike back nor suffer the Greek rebound; Odysseus, an archer, gives none either',()=>{
 let s=setup();s.revealed.push('A1');s.enemies=[G.TROOPS.create('e90','N1','arqueiro')];s.nextEnemy=91;const aq=hero(s,'aquiles').hp;
 s=act(s,'aquiles','attack','e90');assert.equal(hero(s,'aquiles').hp,aq,'o arqueiro não devolve golpe');
 let t=setup();t.enemies=[G.TROOPS.create('e90','N1','arqueiro')];t.nextEnemy=91;t.heroes.forEach(h=>h.zone='A1');hero(t,'aquiles').zone='N1';t=G.trojanTurn(t);assert.equal(t.enemies[0].hp,G.TROOPS.types.arqueiro.hp,'o arqueiro não sofre rebote');
 let o=setup();o.revealed.push('A1');o.enemies=[G.TROOPS.create('e90','N1','lanceiro')];o.nextEnemy=91;o.heroes.forEach(h=>h.zone='A1');hero(o,'odisseu').zone='N1';o=G.trojanTurn(o);assert.equal(o.enemies[0].hp,G.TROOPS.types.lanceiro.hp,'Odisseu não devolve golpe');
 let l=setup();l.revealed.push('A1');l.enemies=[G.TROOPS.create('e90','N1','explorador')];l.nextEnemy=91;l.heroes.forEach(h=>h.zone='A1');hero(l,'aquiles').zone='N1';l=G.trojanTurn(l);assert.ok(l.enemies[0].hp<G.TROOPS.types.explorador.hp,'os demais heróis devolvem golpe');
});

test('Safe Path moves Odysseus up to two revealed pieces, never into the unknown',()=>{
 let s=setup({abilities:{aquiles:0,odisseu:2,agamemnon:0}});s.enemies=[];
 assert.equal(G.act(s,'odisseu','card:2','A2').ok,false,'peça ainda não revelada');
 s.revealed.push('A2','P6','C2');s=act(s,'odisseu','card:2','P6');assert.equal(hero(s,'odisseu').zone,'P6');
 assert.equal(G.act(s,'odisseu','card:2','P1').ok,false,'P1 continua escondido');
});
test('searching the high beach reveals the post in A1; the relief walks down by the trail and the lookout',()=>{
 let s=setup();s.revealed.push('A2');hero(s,'aquiles').zone='A2';
 s=act(s,'aquiles','interact','explore');assert.ok(G.isRevealed(s,'A1'));assert.equal(s.post.status,'found');assert.match(s.lastFind.text,/posto/);
 const relief=s.enemies.find(e=>e.relief);assert.equal(relief.zone,'C2','a rendição aparece descendo a colina');assert.ok(G.isRevealed(s,'C2'));
 s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.id===relief.id).zone,'P6');s=G.trojanTurn(s);assert.equal(s.enemies.find(e=>e.id===relief.id).zone,'P1');
 const before=s.alarm;s=G.trojanTurn(s);const arrived=s.enemies.find(e=>e.id===relief.id);assert.equal(arrived.zone,'A1');assert.ok(arrived.watch&&arrived.hold,'a rendição fica no posto');assert.ok(s.alarm>=before+3,'tempo e o posto ainda troiano: Alarme +2');
 assert.equal(s.enemies.filter(e=>e.zone==='A1').length,2);assert.equal(s.campDamage,0,'a vigia não ataca as tendas');assert.ok(G.validSave(s));
});
test('taking the post before the relief arrives makes A1 the camp, and the relief becomes a common scout',()=>{
 let s=setup();s.revealed.push('A2');hero(s,'aquiles').zone='A2';s=act(s,'aquiles','interact','explore');
 const watch=s.enemies.find(e=>e.watch);watch.hp=1;hero(s,'aquiles').zone='A1';s=act(s,'aquiles','attack',watch.id);
 assert.equal(s.post.status,'taken');assert.match(s.lastFind.text,/acampamento/);assert.ok(!s.enemies.some(e=>e.relief),'a rendição vira um batedor comum');
 const crate=setup();crate.revealed.push('A1');crate.enemies=[];hero(crate,'odisseu').zone='A1';hero(crate,'odisseu').cargo=true;crate.supplies.N1--;assert.ok(G.interactions(crate,hero(crate,'odisseu')).some(x=>x.id==='deliver'&&x.available));
});
test('before the post is taken, Trojans reaching A1 reinforce it instead of attacking tents',()=>{
 let s=setup();s.revealed.push('A1','A2');s.enemies.push(G.TROOPS.create('e90','A1','lanceiro'));s.nextEnemy=91;s=G.trojanTurn(s);assert.equal(s.campDamage,0);assert.match(G.intent(s.enemies.find(e=>e.id==='e90'),s),/posto/);
});
test('the standing watch in A1 does not raise the alarm when it sees the heroes',()=>{
 let s=setup();s.revealed.push('A2','A1');hero(s,'aquiles').zone='A2';const alarm=s.alarm;s=G.trojanTurn(s);assert.equal(s.alarm,alarm+1,'só o tempo');
});
test('an ability learned with the feat that ends the mission still reaches the campaign',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1,abilities:{odisseu:0,agamemnon:0,aquiles:0}});
 s.revealed.push('A2','A1');s.post.status='taken';s.enemies=[];s.delivered=s.required;s.supplies={};s.heroes.forEach(h=>h.zone='A1');
 let r=G.act(s,'agamemnon','interact','install');assert.ok(r.ok);assert.equal(r.state.result,'victory');assert.equal(r.state.encounter.id,'ability','a escolha aparece mesmo com a missão vencida');
 const c=G.choose(r.state,1);assert.ok(c.ok);const rec=require('../cooperativo/campaign-state.js').record(null,c.state.outcome,c.state.heroes,1,['A']);assert.deepEqual(rec.team.known.agamemnon,[0,1]);
});
test('Aeneas falling takes only his guard back; the alarm drops 7 and at 15 spearmen come down in his place',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1,abilities:{odisseu:0,agamemnon:0,aquiles:0}});
 s.revealed.push('A2','A1','P1','P6','C2','P2');s.alarm=16;s.alarmFired=[4,7,11,15];
 const ene=Object.assign(G.TROOPS.create('e90','P6','eneias'),{hp:1,armor:0});s.enemies=[ene,G.TROOPS.create('e91','P6','lanceiro'),G.TROOPS.create('e92','P1','lanceiro'),G.TROOPS.create('e93','N4','lanceiro')];s.nextEnemy=94;
 s.heroes.find(h=>h.id==='aquiles').zone='P6';const r=G.act(s,'aquiles','attack','e90');assert.ok(r.ok,r.error);s=r.state;
 assert.ok(s.eneiasDown);assert.deepEqual(s.enemies.map(e=>e.id),['e93'],'a guarda a até 1 peça recua; a tropa distante fica');assert.equal(s.alarm,9);assert.equal(s.result,null,'sem acampamento, a missão continua');
 s.alarm=14;s.enemies=[];s=G.trojanTurn(s);assert.ok(s.alarm>=15);assert.ok(s.enemies.filter(e=>e.type==='lanceiro').length>=3,'lanceiros no lugar de Enéias');assert.ok(!s.enemies.some(e=>e.type==='eneias'));assert.ok(G.validSave(s));
});
test('rescuing the castaways earns the favor of the gods',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1,abilities:{odisseu:0,agamemnon:0,aquiles:0}});const z=s.castaways.zone;s.revealed.push('A2','N2',z);s.castaways.status='met';s.enemies=[];s.favor=1;
 s.heroes.forEach(h=>h.zone=z);for(const id of ['odisseu','agamemnon']){const r=G.act(s,id,'interact','castaways');assert.ok(r.ok,r.error);s=r.state;}
 assert.equal(s.castaways.status,'rescued');assert.equal(s.favor,3,'+2 de Favor');
});
test('a garrison pushed off its post by Intimidation walks back to it instead of idling',()=>{
 let s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],players:1,abilities:{odisseu:0,agamemnon:2,aquiles:0}});
 s.revealed.push('A2','A1','P1','P6');s.enemies=[Object.assign(G.TROOPS.create('e9','P1','lanceiro'),{hold:true})];s.nextEnemy=10;s.heroes.find(h=>h.id==='agamemnon').zone='P1';
 const r=G.act(s,'agamemnon','card:2','e9');assert.ok(r.ok,r.error);s=r.state;const e=s.enemies[0];assert.notEqual(e.zone,'P1');assert.equal(e.post,'P1');assert.match(G.intent(e,s),/posto/);
 s.heroes.forEach(h=>h.zone='N1');for(let i=0;i<3&&s.enemies[0].zone!=='P1';i++)s=G.trojanTurn(s);assert.equal(s.enemies[0].zone,'P1','voltou ao posto');assert.ok(s.enemies[0].hold);assert.ok(G.validSave(s));
});
