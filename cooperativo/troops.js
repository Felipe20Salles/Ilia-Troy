(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyTroops=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const types={heitor:{name:'Heitor',short:'Heitor',hp:10,attack:3,armor:1,range:0,hero:true},paris:{name:'Páris',short:'Páris',hp:6,attack:3,armor:0,range:2,hero:true},eneias:{name:'Enéias',short:'Enéias',hp:7,attack:2,armor:1,range:0,hero:true},sarpedon:{name:'Sarpedon',short:'Sarpedon',hp:8,attack:3,armor:1,range:0,hero:true},explorador:{name:'Grupo de exploradores',short:'Exploradores',hp:4,attack:2,armor:0,range:0},lanceiro:{name:'Companhia de lanceiros',short:'Lanceiros',hp:5,attack:3,armor:1,range:0},guarda:{name:'Guarda do portão',short:'Guarda',hp:7,attack:2,armor:2,range:0},arqueiro:{name:'Tropa de arqueiros',short:'Arqueiros',hp:4,attack:3,armor:0,range:1}};
 function create(id,zone,type){const d=types[type];if(!d)throw Error('Tropa desconhecida');return {id,zone,type,hp:d.hp,attack:d.attack,armor:d.armor};}
 function label(e){return (types[e.type]||types.explorador).name;}
 return {types,create,label};
});
