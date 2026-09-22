const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const G=require('../cooperativo/landing.js');
const regions=require('../cooperativo/territory.js');
test('every playable region has one mapped location and reciprocal reachable connections',()=>{
 assert.deepEqual(Object.keys(regions).sort(),Object.keys(G.ZONES).sort());
 for(const [id,r] of Object.entries(regions)){assert.ok(r.y<80);assert.ok(Number.isFinite(G.distance('N1',id)));assert.ok(r.polygon.split(' ').length>=6);for(const to of G.ZONES[id].links)assert.ok(G.ZONES[to].links.includes(id));}
 assert.ok(G.ZONES.P3.links.includes('N1'));assert.ok(G.ZONES.P3.links.includes('A1'));assert.ok(G.ZONES.P3.links.includes('B2'));
});
test('natural map uses supplied artwork and only displays removable tents after installation',()=>{
 const context={G,window:{TroyTerritory:regions}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../cooperativo/natural-map.js'),'utf8'),context);
 const s=G.newGame();const before=context.puzzleMap(s,'aquiles');assert.ok(before.includes('assets/territorio-troia.png'));assert.equal(before.includes('class="camp-miniatures"'),false);assert.ok(before.includes('MAR EGEU · INTRANSITÁVEL'));
 s.built=true;const after=context.puzzleMap(s,'aquiles');assert.ok(after.includes('class="camp-miniatures"'));
});
test('old square-map saves are not silently resumed under a changed geography',()=>{
 const s=G.newGame();assert.ok(G.validSave(s));s.version=1;assert.equal(G.validSave(s),false);
});
