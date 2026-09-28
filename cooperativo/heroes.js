(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyHeroes=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const heroes=[
 {id:'aquiles',name:'Aquiles',role:'Ataque',initial:'AQ',evolution:'N2: ataque 3. N3: ataque 4, vida 7 e Esquiva uma vez por rodada.',cards:[
 {name:'Golpe Poderoso',type:'attack',value:4,piercing:true,text:'Cause 4 de dano nesta área, ignorando toda a Armadura.'},
 {name:'Investida',type:'charge',value:2,text:'Mova para uma área vizinha com inimigos e cause 2 de dano a um deles.'},
 {name:'Fôlego de Guerreiro',type:'heal',value:3,text:'Recupere 3 de vida, até sua Vida máxima atual.'}]},
 {id:'ajax',name:'Ájax',role:'Proteção',initial:'AJ',evolution:'N2: Armadura 1. N3: Armadura 2 e vida 7.',cards:[
 {name:'Escudo de Bronze',type:'guard',value:3,text:'Bloqueie até 3 de dano nesta área na próxima fase troiana, inclusive ao acampamento.'},
 {name:'Golpe de Escudo',type:'attack',value:2,stun:true,text:'Cause 2 de dano nesta área e Atordoe: o inimigo perde sua próxima ativação troiana.'},
 {name:'Sobrevivente',type:'survivor',passive:true,once:true,text:'Passiva: uma vez por missão, ao ser derrotado, volte imediatamente com 1 de vida. Não custa ação e não pode ser recuperada.'}]},
 {id:'odisseu',name:'Odisseu',role:'Mobilidade',initial:'OD',evolution:'N2: ataque básico alcança uma área vizinha. N3: alcance básico de até duas áreas.',cards:[
 {name:'Precisão',type:'precision',once:true,piercing:true,text:'Uma vez por missão: deixe um inimigo nesta área ou vizinha com exatamente 1 de vida, ignorando Armadura. Não pode ser recuperada.'},
 {name:'Tiro Preciso',type:'ranged',value:2,piercing:true,text:'Cause 2 de dano nesta área ou vizinha, ignorando Armadura.'},
 {name:'Caminho Seguro',type:'sprint',value:2,text:'Mova até duas áreas usando 1 ação.'}]},
 {id:'menelau',name:'Menelau',role:'Resgate',initial:'ME',evolution:'N2: 3 ações por turno. N3: 3 ações, vida 8, ataque 3 e Armadura 1.',cards:[
 {name:'Contingente',type:'healAlly',value:2,text:'Recupere 2 de vida de outro herói nesta área, inclusive caído.'},
 {name:'Abrir Caminho',type:'guide',value:2,text:'Mova outro herói de pé nesta área até duas áreas; pode atravessar inimigos. Não gasta ação do aliado.'},
 {name:'Recobrando o Fôlego',type:'grantAction',value:1,text:'Conceda +1 ação neste turno a outro herói de pé nesta área.'}]},
 {id:'agamemnon',name:'Agamêmnon',role:'Comando',initial:'AG',evolution:'N2: vida 8. N3: vida 10.',cards:[
 {name:'Provocação',type:'taunt',text:'Até o fim da próxima resposta de Troia, inimigos a até duas áreas priorizam Agamêmnon. Durante o efeito, recebe Armadura 1.'},
 {name:'Reorganizar',type:'refresh',text:'Prepare as habilidades reutilizáveis de outro herói nesta área. Não concede ações nem recupera usos únicos por missão.'},
 {name:'Manter a Linha',type:'guard',value:3,text:'Bloqueie até 3 de dano nesta área na próxima resposta de Troia.'}]}
 ];
 function stats(h){const level=h.level??1;return {maxHp:h.id==='agamemnon'?(level===3?10:level===2?8:6):h.id==='menelau'&&level===3?8:['aquiles','ajax'].includes(h.id)&&level===3?7:6,attack:h.id==='aquiles'?level+1:h.id==='menelau'&&level===3?3:2,armor:h.id==='ajax'?level-1:h.id==='menelau'&&level===3?1:0,actions:h.id==='menelau'&&level>=2?3:2,range:h.id==='odisseu'?level-1:0};}
 function create(id,level=1){if(!heroes.some(h=>h.id===id)||!Number.isInteger(level)||level<1||level>3)throw Error('Nível do herói deve ser N1, N2 ou N3.');const h={id,level,used:[],onceUsed:[],bonusActions:0,dodgeRound:0,tauntRound:0};return {...h,hp:stats(h).maxHp,ap:stats(h).actions};}
 function ready(h){return h.used.length>0;}
 function armor(h,s){return stats(h).armor+(h.id==='agamemnon'&&h.tauntRound===s.round?1:0);}
 function damage(s,h,amount,log){let damage=Math.max(0,amount-armor(h,s));if(h.id==='aquiles'&&h.level===3&&h.dodgeRound!==s.round&&damage>0&&damage<=2){h.dodgeRound=s.round;log(s,'Aquiles usou Esquiva: ataque ignorado.');return 0;}const guard=s.guards[h.zone]||0;s.guards[h.zone]=Math.max(0,guard-damage);damage=Math.max(0,damage-guard);h.hp=Math.max(0,h.hp-damage);if(h.hp===0&&h.id==='ajax'&&!h.onceUsed.includes(2)){h.onceUsed.push(2);h.hp=1;log(s,'Sobrevivente: Ájax retornou com 1 de vida.');}if(h.hp===0)h.ap=0;return damage;}
 function taunt(s,e,distance,safeBase){return s.heroes.find(h=>h.id==='agamemnon'&&h.hp>0&&h.tauntRound===s.round&&(!safeBase||h.zone!=='A1')&&distance(e.zone,h.zone)<=2);}
 function valid(h,round){const d=heroes.find(x=>x.id===h.id),int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;if(!d||!int(h.level,1,3)||!int(h.hp,0,stats(h).maxHp)||!int(h.bonusActions,0,Number.MAX_SAFE_INTEGER-stats(h).actions)||!int(h.ap,0,stats(h).actions+h.bonusActions)||!int(h.dodgeRound,0,round)||!int(h.tauntRound,0,round))return false;return Array.isArray(h.used)&&new Set(h.used).size===h.used.length&&h.used.every(n=>int(n,0,2)&&!d.cards[n].once)&&Array.isArray(h.onceUsed)&&new Set(h.onceUsed).size===h.onceUsed.length&&h.onceUsed.every(n=>int(n,0,2)&&d.cards[n].once)&&(h.id==='aquiles'&&h.level===3||h.dodgeRound===0)&&(h.id==='agamemnon'||h.tauntRound===0);}
 Object.assign(heroes,{stats,create,ready,armor,damage,taunt,valid});return heroes;
});
