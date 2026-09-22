(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyHeroes=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
const HEROES = [
    {id:'aquiles',name:'Aquiles',role:'Ataque',initial:'AQ', cards:[
      {name:'Golpe poderoso',type:'attack',value:4,text:'Cause 4 de dano a um inimigo nesta área.'},
      {name:'Investida',type:'charge',value:2,text:'Mova para uma área vizinha com inimigos e cause 2 de dano a um deles.'},
      {name:'Fôlego de guerreiro',type:'heal',value:3,text:'Recupere 3 de vida. Não ultrapassa 6.'}]},
    {id:'ajax',name:'Ájax',role:'Proteção',initial:'AJ', cards:[
      {name:'Escudo de bronze',type:'guard',value:3,text:'Bloqueie até 3 de dano nesta área na próxima fase troiana, inclusive ao acampamento.'},
      {name:'Golpe de escudo',type:'attack',value:3,text:'Cause 3 de dano a um inimigo nesta área.'},
      {name:'Resgate',type:'healAlly',value:3,text:'Recupere 3 de vida de outro herói nesta área, mesmo caído.'}]},
    {id:'odisseu',name:'Odisseu',role:'Mobilidade',initial:'OD', cards:[
      {name:'Orientar',type:'guide',value:1,text:'Mova outro herói de pé, que esteja com você, para uma área vizinha. Ele não gasta ação.'},
      {name:'Tiro preciso',type:'ranged',value:2,text:'Cause 2 de dano a um inimigo nesta área ou em uma área vizinha.'},
      {name:'Caminho seguro',type:'sprint',value:2,text:'Mova até duas áreas gastando uma ação.'}]}
  ,
 {id:'menelau',name:'Menelau',role:'Resgate',initial:'ME',cards:[
  {name:'Irmão de armas',type:'healAlly',value:3,text:'Recupere 3 de vida de outro herói nesta casa, mesmo caído.'},
  {name:'Abrir caminho',type:'attack',value:3,text:'Cause 3 de dano a um inimigo nesta casa.'},
  {name:'Proteção fraterna',type:'guard',value:2,text:'Bloqueie até 2 de dano nesta casa na próxima resposta de Troia.'}]},
 {id:'agamemnon',name:'Agamêmnon',role:'Comando',initial:'AG',cards:[
  {name:'Ordem de marcha',type:'guide',value:1,text:'Mova outro herói de pé nesta casa para uma casa vizinha, sem gastar ação dele.'},
  {name:'Reorganizar',type:'refresh',value:1,text:'Prepare todas as habilidades de outro herói nesta casa. Não concede ações.'},
  {name:'Manter a linha',type:'guard',value:3,text:'Bloqueie até 3 de dano nesta casa na próxima resposta de Troia.'}]}
];
return HEROES;
});

