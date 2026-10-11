const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../cooperativo/paladio.js');
const ody=s=>s.heroes.find(h=>h.id==='odisseu');
function act(s,id,action,target){const r=G.act(s,id,action,target);assert.ok(r.ok,r.error);assert.ok(G.validSave(r.state),'estado inválido após '+action);return r.state;}
// A noite na casa de Helena abre a missão: resolve a escolha e devolve o dia 1.
function fresh(options={},choice='seguir'){const s=G.newGame({heroes:['odisseu','agamemnon','aquiles'],...options});return G.choose(s,choice).state;}
// Robô: decide sobre Helena na abertura, escuta no santuário, espera o templo abrir longe dos guardas,
// pega o Paládio e corre para o Santuário (12). No acampamento, um herói prepara a saída e os outros distraem.
function play(ids,options={}){let s=G.newGame({heroes:ids,...options});
 for(const [i,h] of s.heroes.filter(h=>h.id!=='odisseu').entries())s=G.campTask(s,h.id,i===0&&options.prepare!==false?'saida':'distrair').state;
 const nextGuards=st=>st.enemies.map(e=>{const r=G.PATROLS[e.route];return r.length>1?r[(e.step+1)%r.length]:e.zone;});
 const stepTo=(st,from,goal)=>{const opts=G.ZONES[from].links.slice().sort((a,b)=>G.distance(a,goal)-G.distance(b,goal));const free=opts.filter(z=>!st.enemies.some(e=>e.zone===z));return (free.length&&G.distance(free[0],goal)<=G.distance(opts[0],goal)?free[0]:opts[0]);};
 for(let turn=0;turn<14&&!s.result;turn++){
  for(let i=0;i<6&&!s.result;i++){
   while(s.encounter)s=G.choose(s,options.trust===false?'seguir':'confiar').state;
   const o=ody(s);if(!o.ap)break;
   const here=G.interactions(s,o).map(x=>x.id);
   if(here.includes('sair')){const r=G.act(s,'odisseu','interact','sair');if(r.ok){s=r.state;break;}}
   const wantTheft=!s.paladio&&G.templeOpen(s);
   if(here.includes('paladio')&&wantTheft){s=act(s,'odisseu','interact','paladio');continue;}
   if(here.includes('desconfia')&&s.alarm<10){s=act(s,'odisseu','interact','desconfia');continue;}
   let goal=s.paladio?G.WALLS[0]:wantTheft?G.TEMPLE:!s.discoveries.includes('desconfia')?G.PRIEST:null;
   if(!goal){const risky=z=>s.enemies.some(e=>e.zone===z)||nextGuards(s).includes(z);if(!risky(o.zone)&&G.distance(o.zone,G.TEMPLE)<=3)break;const spot=Object.keys(G.ZONES).filter(z=>!risky(z)).sort((a,b)=>G.distance(o.zone,a)-G.distance(o.zone,b)||G.distance(a,G.TEMPLE)-G.distance(b,G.TEMPLE))[0];if(!spot||spot===o.zone)break;goal=spot;}
   if(o.zone===goal)break;
   s=act(s,'odisseu','move',stepTo(s,o.zone,goal));
  }
  if(!s.result)s=G.trojanTurn(s);
  assert.ok(G.validSave(s),'estado inválido após a fase de Troia');
 }
 return s;
}
module.exports={play};

test('the night of the ransom opens the mission: Odysseus is at Helen\'s house, chooses, and day 1 is the dawn',()=>{
 const n=G.newGame({heroes:['odisseu','agamemnon','aquiles']});assert.ok(G.validSave(n));assert.equal(ody(n).zone,G.HELEN);assert.equal(n.encounter.id,'helena');assert.equal(n.round,1);assert.equal(n.chronicle.id,'aurora');assert.ok(n.discoveries.includes('forma'));
 assert.equal(G.act(n,'odisseu','move','01').ok,false,'primeiro a escolha sobre Helena');
 const s=G.choose(n,'confiar').state;assert.equal(s.helen,'ally');assert.equal(ody(s).ap,3);
 assert.ok(!s.enemies.some(e=>e.zone===G.HELEN),'a casa de Helena amanhece sem guarda');
 assert.equal(G.act(s,'agamemnon','move','09').ok,false,'só Odisseu age na cidade');
 assert.equal(G.act(s,'odisseu','attack','e1').ok,false,'lutar quebra a trégua');
});
test('every day has a chronicle with an effect, in the truce and in the city at war',()=>{
 for(let r=1;r<=G.MAX_ROUNDS;r++){assert.ok(G.CHRONICLE[r]?.effect,'trégua, dia '+r);assert.ok(G.WAR_CHRONICLE[r]?.effect,'guerra, dia '+r);}
 const w=fresh({legacy:{heitor:'escaped'}});assert.equal(w.chronicle.id,'fechada');assert.ok(!w.discoveries.includes('forma'));const t=G.trojanTurn(w);assert.equal(t.chronicle.id,'estabulos');assert.ok(t.discoveries.includes('forma'));
});
test('the temple opens on day 7 if Helen helps, or on day 10 (the pyre, or the procession with Hector alive)',()=>{
 let s=fresh({},'confiar');s.enemies=[];ody(s).zone=G.TEMPLE;assert.equal(G.act(s,'odisseu','interact','paladio').ok,false,'antes de Teano, guardado');
 s.round=G.TEANO_ROUND;const a=s.alarm;s=act(s,'odisseu','interact','paladio');assert.ok(s.paladio);assert.equal(s.alarm,a+2);
 let p=fresh();p.enemies=[];p.round=G.PYRE_ROUND;ody(p).zone=G.TEMPLE;const b=p.alarm;p=act(p,'odisseu','interact','paladio');assert.ok(p.paladio);assert.equal(p.alarm,b,'dia da pira: sem Suspeita');
 let w=fresh({legacy:{heitor:'escaped'}});w.enemies=[];w.round=G.PYRE_ROUND;ody(w).zone=G.TEMPLE;const c=w.alarm;w=act(w,'odisseu','interact','paladio');assert.equal(w.alarm,c+1,'a procissão: 1 por ação');
});
test('once the theft is discovered, Suspicion rises 3 and the guards hunt Odysseus',()=>{
 let s=fresh();s.paladio=true;ody(s).zone='09';const far=s.enemies.map(e=>G.distance(e.zone,'09'));const a=s.alarm;s=G.trojanTurn(s);
 assert.ok(s.theftKnown);assert.ok(s.alarm>=a+3);s.enemies.forEach((e,i)=>assert.ok(G.distance(e.zone,'09')===Math.max(0,far[i]-1),'cada guarda chega uma peça mais perto'));
});
test('the only way out is the wall of the Sanctuary (12); without anyone below it costs 2 actions and Suspicion',()=>{
 let s=fresh();s.enemies=[];s.paladio=true;ody(s).zone='09';assert.ok(!G.interactions(s,ody(s)).some(x=>x.id==='sair'),'as Oficinas não são saída');
 ody(s).zone='12';s.exitReady=1;s=act(s,'odisseu','interact','sair');assert.equal(s.result,'victory');assert.equal(s.outcome.legacy.paladio,true);
 let t=fresh();t.enemies=[];t.paladio=true;ody(t).zone='12';t.exitReady=0;const a=t.alarm;t=act(t,'odisseu','interact','sair');assert.equal(t.result,'victory');assert.equal(t.alarm,a+3);
});
test('discovered at Suspicion 18 or still inside after the eleventh day: Odysseus flees wounded without the Palladium',()=>{
 let s=fresh();s.alarm=14;ody(s).zone='10';s.enemies=[];s=act(s,'odisseu','interact','medida');assert.equal(s.result,'defeat');assert.equal(ody(s).hp,1);assert.equal(s.outcome.legacy.paladio,false);
 let t=fresh();t.round=G.MAX_ROUNDS;t.enemies=[];t=G.trojanTurn(t);assert.equal(t.result,'defeat');
});
test('the camp distracts Troy or prepares the way out; with Hector alive the city is at war',()=>{
 let p=fresh();p=G.campTask(p,'agamemnon','saida').state;p.enemies=[];p=G.trojanTurn(p);assert.equal(p.exitReady,1);
 const w=fresh({legacy:{heitor:'escaped'}});assert.ok(w.heitorAlive);assert.ok(w.enemies.some(e=>e.type==='heitor'));
});
test('the bot steals the Palladium in some but not most rosters and stories',()=>{
 const others=['agamemnon','aquiles','ajax','menelau'];let wins=0,games=0;
 for(let mask=1;mask<16;mask++){const team=['odisseu',...others.filter((_,i)=>mask&(1<<i))];
  for(const legacy of [{},{heitor:'escaped'}]){const s=play(team,{legacy,trust:team.length%2===0});games++;if(s.result==='victory')wins++;}}
 // Meta do Felipe (05/10/2026): no máximo 6 vitórias em 14 (43%).
 assert.ok(wins/games>=.2&&wins/games<=6/14,'vitórias do robô: '+wins+'/'+games);
});
