const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../cooperativo/segurar.js');
const I=require('../cooperativo/ira.js');
const hero=(s,id)=>s.heroes.find(h=>h.id===id);
const hector=s=>s.enemies.find(e=>e.type==='heitor');
// Pátroclo em campo em Segurar a linha, com Heitor fora do portão.
function withPatroclus(){let s=S.newGame({heroes:['aquiles','odisseu','agamemnon'],legacy:{criseida:'taken'},levels:{aquiles:2},known:{aquiles:[0,2]}});
 s=S.choose(s,'briseida').state;s=S.choose(s,0).state;s.foodSetup=false;
 const h=S.TROOPS.create('e90','P2','heitor');h.hp=10;h.armor=0;s.enemies=[h];s.nextEnemy=91;s.heitorOut=true;s.revealed.push('P2','C2','P4','P7','M1');
 for(const a of s.heroes){a.zone='N1';a.hp=6;a.ap=2;}hero(s,'aquiles').zone='P2';return s;}
function act(G,s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}

test('Segurar a linha: Patroclus challenges Hector, who fights retreating toward the gate while the others keep playing',()=>{
 let s=withPatroclus();assert.ok(S.interactions(s,hero(s,'aquiles')).some(x=>x.id==='engage'&&x.available),'Pátroclo pode enfrentar Heitor na mesma peça');
 s=act(S,s,'aquiles','interact','engage');assert.ok(s.patroclus.engaged);
 assert.equal(S.act(s,'aquiles','move','N2').ok,false,'em duelo, Pátroclo não se afasta');
 s=act(S,s,'aquiles','attack','e90');assert.ok(s.patroclus.struck);
 s=act(S,s,'odisseu','move','N2');assert.ok(s.patroclus.engaged,'os outros jogam normalmente');
 const p0=hero(s,'aquiles').hp;s=S.trojanTurn(s);
 assert.ok(hero(s,'aquiles').hp<p0,'Heitor golpeia Pátroclo');assert.equal(hector(s).zone,'C2','recua uma peça para o portão');assert.equal(hero(s,'aquiles').zone,'C2','Pátroclo o segue');
});
test('a Greek standing where Hector would retreat holds him in place for another round',()=>{
 let s=withPatroclus();s=act(S,s,'aquiles','interact','engage');hero(s,'odisseu').zone='C2';s=S.trojanTurn(s);
 assert.equal(hector(s).zone,'P2','preso pelo grego em C2');assert.ok(s.patroclus.engaged);
});
test('in front of the walls Apollo strikes: Patroclus falls facing Hector, and the damage he dealt stays',()=>{
 let s=withPatroclus();hector(s).zone='P4';hero(s,'aquiles').zone='P4';s=act(S,s,'aquiles','interact','engage');s=act(S,s,'aquiles','attack','e90');
 const hp=hector(s).hp;s=S.trojanTurn(s);
 assert.ok(['fallen','avenged'].includes(s.patroclus.status),'Pátroclo caiu');assert.ok(s.patroclus.facing,'de frente para Heitor');assert.ok(s.patroclus.apollo);assert.equal(hector(s).hp,hp,'o dano fica em Heitor');assert.match(s.lastFind.text,/Apolo/);
});
test('if the Greeks wound Hector enough during the duel, he retreats and Patroclus survives the day',()=>{
 let s=withPatroclus();s=act(S,s,'aquiles','interact','engage');hector(s).hp=7;hero(s,'odisseu').zone='P2';s=act(S,s,'odisseu','attack','e90');
 assert.ok(s.commanderDown,'Heitor recua ferido');assert.equal(s.patroclus.engaged,false);assert.equal(s.patroclus.status,'active','Pátroclo vive');
});
test('A ira de Aquiles: at the walls the duel lasts one round; Hector cannot fall to Patroclus, and the chase resumes',()=>{
 let s=I.newGame({heroes:['aquiles','odisseu','agamemnon'],legacy:{patroclus:'alive',achillesSaved:{level:1,known:[0],onceUsed:[]}}});
 while(s.encounter)s=I.choose(s,s.encounter.id==='scales'?'ok':s.encounter.choices?s.encounter.choices[0]:'ok').state;
 const p=s.heroes.find(h=>h.patroclus);if(!p)return;s.revealed.push('P4');hector(s).zone='P4';s.chase.status='stopped';p.zone='P4';p.ap=2;p.hp=6;
 s=act(I,s,p.id,'interact','duel');assert.ok(s.patroclus.engaged);hector(s).hp=2;hector(s).armor=0;s=act(I,s,p.id,'attack',hector(s).id);assert.equal(hector(s).hp,1,'Apolo guarda Heitor para outro');
 s=I.trojanTurn(s);assert.ok(['fallen','avenged'].includes(s.patroclus.status));assert.ok(s.patroclus.facing);assert.equal(s.chase.status,'running');
});
