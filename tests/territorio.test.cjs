const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const G=require('../cooperativo/landing.js');
const regions=require('../cooperativo/territory.js');
test('every playable region has one mapped location and reciprocal reachable connections',()=>{
 assert.ok(Object.keys(G.ZONES).every(id=>regions[id]),'toda peça da missão tem contorno');
 for(const [id,r] of Object.entries(regions).filter(([id])=>G.ZONES[id])){assert.ok(r.y<90);assert.ok(Number.isFinite(G.distance('N1',id)));assert.ok(r.polygon.split(' ').length>=6);for(const to of G.ZONES[id].links)assert.ok(G.ZONES[to].links.includes(id));}
 assert.deepEqual(Object.keys(G.ZONES).sort(),['N1','N2','N3','N4','A1','A2','P1','P2','P6','C2','C1'].sort());assert.ok(G.ZONES.C2.links.includes('P6'));assert.ok(G.ZONES.N4.links.includes('N3'));
});
test('natural map uses the exact mission-one piece mask and only displays removable tents after installation',()=>{
 const context={G,window:{TroyTerritory:regions,TroyBoardSilhouettes:{landing:'M0 0 Z'}}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../cooperativo/natural-map.js'),'utf8'),context);
 const s=G.newGame();const before=context.puzzleMap(s,'aquiles');assert.ok(before.includes('assets/setup/stage-5.png'));assert.equal(before.includes('class="camp-miniatures"'),false);assert.ok(before.includes('a água é intransitável'));
 s.built=true;const after=context.puzzleMap(s,'aquiles');assert.ok(after.includes('class="camp-miniatures"'));
});
test('old square-map saves are not silently resumed under a changed geography',()=>{
 const s=G.newGame();assert.ok(G.validSave(s));s.version=1;assert.equal(G.validSave(s),false);
});
