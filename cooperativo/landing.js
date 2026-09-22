(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./heroes.js'));
  else root.TroyLanding=factory(root.TroyHeroes);
})(typeof globalThis!=='undefined'?globalThis:this,function(HEROES){
  'use strict';
  const VERSION=2,MAX_ROUNDS=10;
  const LAYOUT=[['P1','P2','B1'],['A2','A1','B2'],['N2','P3','N1']];
  const TERRAINS={P:{art:'planicie',name:'Planície'},B:{art:'bosque',name:'Bosque'},A:{art:'acampamento',name:'Acampamento'},N:{art:'navios',name:'Praia'}};
  const ZONES={};
  LAYOUT.forEach((row,y)=>row.forEach((id,x)=>{ZONES[id]={x,y,name:id+' · '+TERRAINS[id[0]].name,terrain:id[0],art:TERRAINS[id[0]].art,links:[]};}));
  const CONNECTIONS={P1:['A2','P2'],P2:['P1','P3','B1'],B1:['P2','B2'],A2:['P1','A1'],A1:['A2','P3','N2'],B2:['B1','P3','N1'],N2:['A1','P3'],P3:['P2','A1','B2','N2','N1'],N1:['P3','B2']};
  for(const [id,links] of Object.entries(CONNECTIONS))ZONES[id].links=links;
  const clone=s=>JSON.parse(JSON.stringify(s));
  function log(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,80);}
  function spawn(s,zone){s.enemies.push({id:'e'+s.nextEnemy++,zone,hp:3});}
  function newGame(options={}){
    const players=options.players??1,ids=options.heroes??['aquiles','ajax','odisseu'],owners=options.owners??ids.map((_,i)=>i%players+1);
    if(!Number.isInteger(players)||players<1||players>5||ids.length!==Math.max(3,players)||new Set(ids).size!==ids.length||ids.some(id=>!HEROES.some(h=>h.id===id))||owners.length!==ids.length||owners.some(n=>!Number.isInteger(n)||n<1||n>players)||new Set(owners).size!==players)throw Error('Escolha a quantidade de heróis indicada e atribua ao menos um a cada jogador.');
    const s={version:VERSION,mission:'desembarque',players,round:1,phase:'heroes',result:null,reason:'',campDamage:0,delivered:0,required:ids.length,built:false,held:0,supplies:{N1:Math.ceil(ids.length/2),N2:Math.floor(ids.length/2)},guards:{},nextEnemy:1,
      heroes:ids.map((id,i)=>({id,owner:owners[i],zone:'N1',hp:6,ap:2,used:[],cargo:false})),enemies:[],log:[],outcome:null};
    spawn(s,'P1');if(ids.length>=4)spawn(s,'B1');log(s,'Desembarque: levem '+s.required+' caixas das praias N1/N2 ao acampamento A1.');return s;
  }
  function distance(from,to){if(!ZONES[from]||!ZONES[to])return Infinity;const queue=[[from,0]],seen=new Set([from]);for(const [at,d] of queue){if(at===to)return d;for(const n of ZONES[at].links)if(!seen.has(n)){seen.add(n);queue.push([n,d+1]);}}return Infinity;}
  function nextStep(zone){return ZONES[zone].links.slice().sort((a,b)=>distance(a,'A1')-distance(b,'A1'))[0];}
  function waves(s,round){const zones=({3:['B1'],5:['P1'],7:['P2'],9:['B1']})[round]||[];return s.heroes.length===5&&round===5?[...zones,'B1']:zones;}
  function intent(e,s){if(s.heroes.some(h=>h.zone===e.zone&&h.hp>0))return 'Atacar um herói aqui';return e.zone==='A1'?'Sabotar o acampamento':'Avançar para '+ZONES[nextStep(e.zone)].name;}
  function finish(s,result,reason){s.result=result;s.phase='end';s.reason=reason;if(result==='victory')s.outcome={completed:'desembarque',next:'Diante das muralhas',supplies:s.required,horseMaterials:0};log(s,reason);}
  function defeat(s){if(s.campDamage>=3)finish(s,'defeat','O acampamento sofreu três danos. Os aqueus precisam refazer o desembarque.');else if(s.heroes.every(h=>h.hp===0))finish(s,'defeat','Todos os heróis caíram. A expedição precisa recuar.');}
  function kill(s,e,damage){e.hp-=damage;if(e.hp<=0){s.enemies=s.enemies.filter(a=>a.id!==e.id);log(s,'Grupo '+e.id.slice(1)+' derrotado em '+e.zone+'.');}}
  function interaction(s,h){
    if(h.cargo&&h.zone==='A1')return {label:'Entregar caixa',detail:'Abastecer o acampamento',available:true};
    if(!h.cargo&&(s.supplies[h.zone]||0)>0)return {label:'Carregar caixa',detail:'Leve uma caixa até A1',available:true};
    if(h.zone==='A1'&&s.delivered===s.required&&!s.built)return {label:'Instalar acampamento',detail:'Inicia o contra-ataque anunciado',available:true};
    return {label:s.built?'Defender A1':'Suprimentos',detail:s.built?'Resista a 2 respostas consecutivas':h.cargo?'Leve sua caixa até A1':'Caixas em N1 e N2',available:false};
  }
  function act(state,heroId,action,target){
    const s=clone(state),h=s.heroes.find(h=>h.id===heroId),fail=error=>({ok:false,error,state});
    if(s.result||s.phase!=='heroes')return fail('Esta missão já terminou.');
    if(!h||h.hp<=0||h.ap<=0)return fail('Escolha um herói de pé com ações disponíveis.');
    const def=HEROES.find(d=>d.id===h.id),foes=()=>s.enemies.filter(e=>e.zone===h.zone);let message='';
    if(action==='move'){if(!ZONES[h.zone].links.includes(target))return fail('Escolha uma região conectada pela linha dourada.');h.zone=target;message='moveu para '+target;}
    else if(action==='attack'){const e=foes().find(e=>e.id===target);if(!e)return fail('Escolha um inimigo nesta casa.');kill(s,e,2);message='atacou: 2 de dano';}
    else if(action==='interact'){
      if(foes().length)return fail('Elimine os inimigos nesta casa antes de interagir.');
      if(h.cargo&&h.zone==='A1'){h.cargo=false;s.delivered++;message='entregou uma caixa em A1 ('+s.delivered+'/'+s.required+')';}
      else if(!h.cargo&&(s.supplies[h.zone]||0)>0){s.supplies[h.zone]--;h.cargo=true;message='carregou uma caixa de '+h.zone;}
      else if(h.zone==='A1'&&s.delivered===s.required&&!s.built){s.built=true;s.held=0;for(let i=0;i<Math.ceil(s.heroes.length/2);i++)spawn(s,i%2?'B1':'P2');message='instalou o acampamento. Contra-ataque em P2/B1: defendam A1 por duas respostas consecutivas';}
      else return fail('Não há entrega, coleta ou instalação disponível aqui.');
    }else if(action==='rest'){
      if(foes().length)return fail('Não é possível recuperar com inimigos nesta casa.');if(!h.used.length&&h.hp===6)return fail('Vida e habilidades já estão completas.');h.used=[];h.hp=Math.min(6,h.hp+1);message='recuperou habilidades e 1 de vida';
    }else if(action==='rescue'){
      const a=s.heroes.find(a=>a.id===target&&a.zone===h.zone&&a.hp===0);if(!a)return fail('Escolha um aliado caído nesta casa.');a.hp=2;message='socorreu '+HEROES.find(d=>d.id===a.id).name;
    }else if(action.startsWith('card:')){
      const n=Number(action.slice(5)),c=def.cards[n];if(!c||h.used.includes(n))return fail('Habilidade indisponível.');
      const e=s.enemies.find(e=>e.id===target),a=s.heroes.find(a=>a.id===target);
      if(c.type==='attack'||c.type==='ranged'){if(!e||distance(h.zone,e.zone)>(c.type==='ranged'?1:0))return fail('Inimigo fora de alcance.');kill(s,e,c.value);}
      else if(c.type==='charge'){if(!e||!ZONES[h.zone].links.includes(e.zone))return fail('Escolha um inimigo em uma casa vizinha.');h.zone=e.zone;kill(s,e,c.value);}
      else if(c.type==='heal'){if(h.hp===6)return fail('Vida completa.');h.hp=Math.min(6,h.hp+c.value);}
      else if(c.type==='healAlly'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===6)return fail('Escolha outro herói ferido nesta casa.');a.hp=Math.min(6,a.hp+c.value);}
      else if(c.type==='guard')s.guards[h.zone]=(s.guards[h.zone]||0)+c.value;
      else if(c.type==='guide'){const [id,zone]=String(target).split(':');const ally=s.heroes.find(a=>a.id===id&&a.id!==h.id&&a.zone===h.zone&&a.hp>0);if(!ally||!ZONES[h.zone].links.includes(zone))return fail('Escolha um aliado nesta casa e um destino vizinho.');ally.zone=zone;}
      else if(c.type==='sprint'){if(target===h.zone||distance(h.zone,target)>2)return fail('Destino a até duas casas.');h.zone=target;}
      else if(c.type==='refresh'){if(!a||a.id===h.id||a.zone!==h.zone||a.hp===0||!a.used.length)return fail('Escolha outro herói de pé com habilidades esgotadas nesta casa.');a.used=[];}
      else return fail('Habilidade desconhecida.');
      h.used.push(n);message='usou '+c.name;
    }else return fail('Ação desconhecida.');
    h.ap--;log(s,def.name+' '+message+'.');return {ok:true,state:s};
  }
  function trojanTurn(state){
    const s=clone(state);if(s.result||s.phase!=='heroes')return s;
    log(s,'Troia responde na rodada '+s.round+'.');
    for(const e of s.enemies){
      const guard=s.guards[e.zone]||0;
      const h=s.heroes.filter(h=>h.zone===e.zone&&h.hp>0).sort((a,b)=>b.hp-a.hp)[0];
      if(h){const damage=Math.max(0,2-guard);s.guards[e.zone]=Math.max(0,guard-2);h.hp=Math.max(0,h.hp-damage);log(s,HEROES.find(d=>d.id===h.id).name+' sofreu '+damage+' de dano.');if(!h.hp){h.ap=0;if(h.cargo){s.supplies[h.zone]=(s.supplies[h.zone]||0)+1;h.cargo=false;log(s,'Uma caixa caiu em '+h.zone+' e pode ser recuperada.');}}}
      else if(e.zone==='A1'){if(guard){s.guards.A1--;log(s,'A proteção absorveu a sabotagem.');}else{s.campDamage++;log(s,'Acampamento sabotado: '+s.campDamage+'/3 danos.');}}
      else{e.zone=nextStep(e.zone);log(s,'Grupo '+e.id.slice(1)+' avançou para '+e.zone+'.');}
      defeat(s);if(s.result)return s;
    }
    s.guards={};
    if(s.built){const held=s.heroes.some(h=>h.zone==='A1'&&h.hp>0)&&!s.enemies.some(e=>e.zone==='A1');s.held=held?s.held+1:0;log(s,held?'Acampamento defendido: '+s.held+'/2 respostas consecutivas.':'Defesa interrompida: limpem A1 e mantenham um herói de pé lá.');if(s.held>=2){finish(s,'victory','O acampamento está seguro. Os aqueus têm uma base para avançar em direção às muralhas.');return s;}}
    if(s.round>=MAX_ROUNDS){finish(s,'defeat','O tempo acabou antes de consolidar o acampamento.');return s;}
    s.round++;for(const zone of waves(s,s.round))spawn(s,zone);s.heroes.forEach(h=>{h.ap=h.hp>0?2:0;});
    if(s.round===3)log(s,'Alerta: Troia reconheceu o desembarque. Chegou uma patrulha pelo bosque B1.');
    if(s.round===5)log(s,'A pressão aumenta. Uma nova patrulha entra pela planície.');
    return s;
  }
  function validSave(s){
    const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
    if(!s||s.version!==VERSION||s.mission!=='desembarque'||!integer(s.players,1,5)||!integer(s.round,1,MAX_ROUNDS)||!['heroes','end'].includes(s.phase)||![null,'victory','defeat'].includes(s.result)||(s.phase==='end')!==!!s.result||!Array.isArray(s.heroes)||s.heroes.length!==Math.max(3,s.players))return false;
    if(new Set(s.heroes.map(h=>h.id)).size!==s.heroes.length||new Set(s.heroes.map(h=>h.owner)).size!==s.players||!s.heroes.every(h=>HEROES.some(d=>d.id===h.id)&&ZONES[h.zone]&&integer(h.owner,1,s.players)&&integer(h.hp,0,6)&&integer(h.ap,0,2)&&(!h.hp?h.ap===0&&!h.cargo:true)&&typeof h.cargo==='boolean'&&Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>integer(n,0,2))))return false;
    if(s.required!==s.heroes.length||!integer(s.delivered,0,s.required)||!integer(s.campDamage,0,3)||typeof s.built!=='boolean'||(s.built&&s.delivered!==s.required)||!integer(s.held,0,2)||(!s.built&&s.held!==0)||!s.supplies||Object.entries(s.supplies).some(([id,n])=>!ZONES[id]||!integer(n,0,s.required)))return false;
    if(s.delivered+s.heroes.filter(h=>h.cargo).length+Object.values(s.supplies).reduce((n,x)=>n+x,0)!==s.required)return false;
    if(!Array.isArray(s.enemies)||new Set(s.enemies.map(e=>e.id)).size!==s.enemies.length||!s.enemies.every(e=>/^e\d+$/.test(e.id)&&ZONES[e.zone]&&integer(e.hp,1,3))||!Number.isInteger(s.nextEnemy)||s.nextEnemy<1||s.enemies.some(e=>Number(e.id.slice(1))>=s.nextEnemy)||!s.guards||Object.entries(s.guards).some(([id,n])=>!ZONES[id]||!integer(n,0,100)))return false;
    if(s.result==='victory'&&(!s.built||s.held!==2||s.campDamage>=3||s.outcome?.completed!=='desembarque'||s.outcome.supplies!==s.required||s.outcome.horseMaterials!==0))return false;
    return Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.reason==='string';
  }
  return {VERSION,MAX_ROUNDS,HEROES,LAYOUT,TERRAINS,ZONES,newGame,distance,intent,waves,interaction,act,trojanTurn,validSave};
});
