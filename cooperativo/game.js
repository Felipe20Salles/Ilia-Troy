(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TroyCoop = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const VERSION = 2, MAX_ROUNDS = 16;
  const LAYOUT = [['T1','T2','C2','C3'],['P1','P2','C1','B4'],['A2','P3','B1','B3'],['A1','N1','N2','B2']];
  const TERRAINS = {T:{art:'portoes',name:'Portões'},P:{art:'planicie',name:'Planície'},C:{art:'colina',name:'Colina'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ARTIFACTS = {A:{name:'Mantimentos',sites:['A1','A2']},B:{name:'Cordas da frota',sites:['B2','B4']},C:{name:'Tocha de sinalização',sites:['C2','C3']}};
  const ZONES = {};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{const terrain=TERRAINS[id[0]];ZONES[id]={name:id+' · '+terrain.name,terrain:id[0],art:terrain.art,x,y,links:[],search:!!ARTIFACTS[id[0]]?.sites.includes(id)};}));
  for(const [id,z] of Object.entries(ZONES))for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const n=LAYOUT[z.y+dy]?.[z.x+dx];if(n)z.links.push(n);}
  const HEROES = [
    {id:'aquiles',name:'Aquiles',role:'Ataque',initial:'AQ', cards:[
      {name:'Golpe poderoso',type:'attack',value:4,text:'Cause 4 de dano a um inimigo nesta área.'},
      {name:'Investida',type:'charge',value:2,text:'Mova para uma área vizinha com inimigos e cause 2 de dano a um deles.'},
      {name:'Fôlego de guerreiro',type:'heal',value:3,text:'Recupere 3 de vida. Não ultrapassa 6.'}]},
    {id:'ajax',name:'Ájax',role:'Proteção',initial:'AJ', cards:[
      {name:'Escudo de bronze',type:'guard',value:3,text:'Bloqueie até 3 de dano nesta área na próxima fase troiana, inclusive aos navios.'},
      {name:'Golpe de escudo',type:'attack',value:3,text:'Cause 3 de dano a um inimigo nesta área.'},
      {name:'Resgate',type:'healAlly',value:3,text:'Recupere 3 de vida de outro herói nesta área, mesmo caído.'}]},
    {id:'odisseu',name:'Odisseu',role:'Mobilidade',initial:'OD', cards:[
      {name:'Orientar',type:'guide',value:1,text:'Mova outro herói de pé, que esteja com você, para uma área vizinha. Ele não gasta ação.'},
      {name:'Tiro preciso',type:'ranged',value:2,text:'Cause 2 de dano a um inimigo nesta área ou em uma área vizinha.'},
      {name:'Caminho seguro',type:'sprint',value:2,text:'Mova até duas áreas gastando uma ação.'}]}
  ];
  const WAVES = {4:['T1'],7:['T2'],10:['T1'],13:['T2'],15:['T1','T2']};
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,40);}
  function enemy(s,zone){s.enemies.push({id:'e'+s.nextEnemy++,zone,hp:3});}
  function newGame(random=Math.random){
    const s={version:VERSION,round:1,phase:'heroes',result:null,reason:'',shipDamage:0,tasks:[],searched:[],hidden:Object.fromEntries(Object.entries(ARTIFACTS).map(([id,a])=>[id,a.sites[Math.min(a.sites.length-1,Math.floor(random()*a.sites.length))]])),guards:{},nextEnemy:1,
      heroes:HEROES.map(h=>({id:h.id,zone:'A1',hp:6,ap:2,used:[]})),enemies:[],log:[]};
    enemy(s,'T1');log(s,'Expedição iniciada. Investiguem os pontos de busca, encontrem os três artefatos e retornem a N1.');return s;
  }
  function distance(from,to){
    const q=[[from,0]], seen=new Set([from]);
    for(const [at,d] of q){if(at===to)return d;for(const n of ZONES[at].links){if(!seen.has(n)){seen.add(n);q.push([n,d+1]);}}}return Infinity;
  }
  function nextStep(zone){return [...ZONES[zone].links].sort((a,b)=>distance(a,'N1')-distance(b,'N1'))[0];}
  function intent(e,s){
    if(e.zone==='N1')return 'Incendiar os navios';
    if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';
    return 'Avançar para '+ZONES[nextStep(e.zone)].name;
  }
  function kill(s,e,damage){e.hp-=damage;if(e.hp<=0){s.enemies=s.enemies.filter(x=>x.id!==e.id);log(s,'Grupo troiano derrotado em '+ZONES[e.zone].name+'.');}}
  function end(s,result,reason){s.result=result;s.reason=reason;s.phase='end';log(s,reason);}
  function checkDefeat(s){if(s.shipDamage>=3)end(s,'defeat','Os navios foram incendiados. A retirada fracassou.');else if(s.heroes.every(h=>h.hp===0))end(s,'defeat','Todos os heróis caíram. A expedição precisa recuar.');}
  function act(state,heroId,action,target){
    const s=JSON.parse(JSON.stringify(state)),h=s.heroes.find(x=>x.id===heroId);
    const fail=msg=>({ok:false,error:msg,state});
    if(s.phase!=='heroes'||s.result)return fail('Esta partida já terminou.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const foes=()=>s.enemies.filter(e=>e.zone===h.zone);
    const def=HEROES.find(x=>x.id===h.id);let message='';
    if(action==='move'){
      if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma área conectada.');h.zone=target;message='moveu para '+ZONES[target].name;
    }else if(action==='attack'){
      const e=foes().find(e=>e.id===target);if(!e)return fail('Escolha um inimigo nesta área.');kill(s,e,2);message='atacou: 2 de dano';
    }else if(action==='interact'){
      if(foes().length)return fail('Derrote os inimigos nesta área antes de interagir.');
      if(ZONES[h.zone].search){
        const terrain=ZONES[h.zone].terrain;
        if(s.tasks.includes(terrain))return fail('O artefato deste terreno já foi encontrado.');
        if(s.searched.includes(h.zone))return fail('Este local já foi investigado.');
        s.searched.push(h.zone);
        if(s.hidden[terrain]===h.zone){s.tasks.push(terrain);message='encontrou '+ARTIFACTS[terrain].name+' em '+h.zone;}
        else message='investigou '+h.zone+': local vazio. Procurem no outro ponto deste terreno';
      }
      else if(h.zone==='N1'){
        if(s.tasks.length!==3)return fail('Encontre os três artefatos antes de partir.');
        if(!s.heroes.every(x=>x.zone==='N1'&&x.hp>0))return fail('Todos os heróis precisam estar de pé e reunidos nos navios.');
        h.ap--;end(s,'victory','Todos a bordo! Os heróis recuperaram os três artefatos e salvaram a frota.');return {ok:true,state:s};
      }else return fail('Esta casa não possui ponto de busca.');
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar habilidades com inimigos nesta área.');
      if(!h.used.length&&h.hp===6)return fail('Sua vida e suas habilidades já estão completas.');h.used=[];h.hp=Math.min(6,h.hp+1);message='recuperou as habilidades e 1 de vida';
    }else if(action==='rescue'){
      const ally=s.heroes.find(x=>x.id===target&&x.zone===h.zone&&x.hp===0);if(!ally)return fail('Escolha um herói caído nesta área.');ally.hp=2;ally.ap=1;message='socorreu '+HEROES.find(x=>x.id===ally.id).name+' com 1 ação disponível';
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),card=def.cards[n];if(!card||h.used.includes(n))return fail('Esta habilidade não está disponível.');
      const e=s.enemies.find(x=>x.id===target),ally=s.heroes.find(x=>x.id===target);
      if(card.type==='attack'||card.type==='ranged'){
        if(!e||distance(h.zone,e.zone)>(card.type==='ranged'?1:0))return fail('Escolha um inimigo ao alcance.');kill(s,e,card.value);
      }else if(card.type==='charge'){
        if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma área vizinha.');h.zone=e.zone;kill(s,e,card.value);
      }else if(card.type==='heal'){
        if(h.hp===6)return fail('Sua vida já está completa.');h.hp=Math.min(6,h.hp+card.value);
      }else if(card.type==='healAlly'){
        if(!ally||ally.id===h.id||ally.zone!==h.zone||ally.hp===6)return fail('Escolha outro herói ferido nesta área.');const fallen=ally.hp===0;ally.hp=Math.min(6,ally.hp+card.value);if(fallen)ally.ap=1;
      }else if(card.type==='guard'){s.guards[h.zone]=(s.guards[h.zone]||0)+card.value;}
      else if(card.type==='guide'){
        const [id,zone]=String(target).split(':');const a=s.heroes.find(x=>x.id===id&&x.id!==h.id&&x.hp>0&&x.zone===h.zone);
        if(!a||!ZONES[h.zone].links.includes(zone))return fail('Escolha um aliado nesta área e um destino vizinho.');a.zone=zone;
      }else if(card.type==='sprint'){
        if(!ZONES[target]||target===h.zone||distance(h.zone,target)>2)return fail('Escolha um destino a até duas áreas.');h.zone=target;
      }
      h.used.push(n);message='usou '+card.name;
    }else return fail('Ação desconhecida.');
    h.ap--;log(s,def.name+' '+message+'.');return {ok:true,state:s};
  }
  function trojanTurn(state){
    const s=JSON.parse(JSON.stringify(state));if(s.phase!=='heroes'||s.result)return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of s.enemies){
      const protection=s.guards[e.zone]||0;
      if(e.zone==='N1'){
        if(protection>0){s.guards[e.zone]--;log(s,'O escudo protegeu os navios.');}
        else{s.shipDamage++;log(s,'Um grupo incendiou os navios: '+s.shipDamage+'/3 danos.');}
      }else{
        const h=s.heroes.filter(x=>x.zone===e.zone&&x.hp>0).sort((a,b)=>b.hp-a.hp)[0];
        if(h){const damage=Math.max(0,2-protection);s.guards[e.zone]=Math.max(0,protection-2);h.hp=Math.max(0,h.hp-damage);if(h.hp===0)h.ap=0;log(s,HEROES.find(x=>x.id===h.id).name+' sofreu '+damage+' de dano'+(h.hp===0?' e caiu':'')+'.');}
        else{e.zone=nextStep(e.zone);log(s,'Troianos avançaram para '+ZONES[e.zone].name+'.');}
      }
      checkDefeat(s);if(s.result)return s;
    }
    s.guards={};if(s.round===MAX_ROUNDS){end(s,'defeat','O tempo acabou. A força principal de Troia alcançou a praia.');return s;}
    s.round++;for(const zone of WAVES[s.round]||[])enemy(s,zone);
    s.heroes.forEach(h=>{h.ap=h.hp>0?2:0;});log(s,'Rodada '+s.round+': chegaram '+(WAVES[s.round]||[]).length+' grupo(s) troiano(s).');return s;
  }
  function validSave(s){
    return !!(s&&s.version===VERSION&&Number.isInteger(s.round)&&s.round>=1&&s.round<=MAX_ROUNDS&&['heroes','end'].includes(s.phase)&&
      [null,'victory','defeat'].includes(s.result)&&((s.phase==='end')===!!s.result)&&Number.isInteger(s.shipDamage)&&s.shipDamage>=0&&s.shipDamage<=3&&
      Array.isArray(s.heroes)&&s.heroes.length===3&&HEROES.every(d=>s.heroes.filter(h=>h.id===d.id).length===1)&&
      s.heroes.every(h=>ZONES[h.zone]&&Number.isInteger(h.hp)&&h.hp>=0&&h.hp<=6&&Number.isInteger(h.ap)&&h.ap>=0&&h.ap<=2&&Array.isArray(h.used)&&h.used.every(n=>[0,1,2].includes(n)))&&
      Array.isArray(s.enemies)&&s.enemies.every(e=>typeof e.id==='string'&&ZONES[e.zone]&&Number.isInteger(e.hp)&&e.hp>0&&e.hp<=3)&&
      Array.isArray(s.tasks)&&new Set(s.tasks).size===s.tasks.length&&s.tasks.every(t=>ARTIFACTS[t])&&
      s.hidden&&Object.keys(s.hidden).length===3&&Object.entries(ARTIFACTS).every(([id,a])=>a.sites.includes(s.hidden[id]))&&
      Array.isArray(s.searched)&&new Set(s.searched).size===s.searched.length&&s.searched.every(id=>ZONES[id]?.search)&&
      Object.keys(ARTIFACTS).every(id=>s.tasks.includes(id)===s.searched.includes(s.hidden[id]))&&
      Number.isInteger(s.nextEnemy)&&s.nextEnemy>0&&s.guards&&Object.entries(s.guards).every(([k,v])=>ZONES[k]&&Number.isInteger(v)&&v>=0)&&
      Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string');
  }
  return {VERSION,MAX_ROUNDS,LAYOUT,TERRAINS,ARTIFACTS,ZONES,HEROES,WAVES,newGame,act,trojanTurn,intent,distance,validSave};
});
