(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TroyFinalBoard=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const points={M3:[18,14],M4:[29,14],M1:[49,13],M5:[67,14],M2:[80,14],P3:[17,30],P7:[33,31],P4:[48,31],B5:[64,31],B3:[81,30],P1:[12,47],P6:[23,47],C2:[34,50],C1:[54,49],B1:[75,49],B4:[92,49],A1:[9,65],A2:[23,67],P2:[48,67],P5:[70,67],B2:[88,66],N1:[8,73],N2:[29,80],N3:[48,81],N4:[70,80],N5:[88,78]};
 const links={A1:['A2','P1'],A2:['A1','P1','P6','C2','P2'],P1:['A1','A2','P6','P3'],P6:['A2','P1','P3','P7','C2'],C2:['A2','P6','P7','P4','P2'],P2:['A2','C2','C1','P5'],C1:['P2','B1','P5'],P5:['P2','C1','B1','B2'],B1:['C1','P5','B2','B4','B3','B5'],B2:['P5','B1','B4'],B4:['B2','B1','B3'],B3:['B4','B1','B5','M5','M2'],B5:['B1','B3','P4','M5'],P4:['C2','B5','B3','P7','M1','M5'],P7:['P6','C2','P4','P3','M4','M1'],P3:['P1','P6','P7','M3','M4'],M3:['P3','M4'],M4:['M3','P3','P7','M1'],M1:['M4','P7','P4','M5'],M5:['M1','P4','B5','B3','M2'],M2:['M5','B3']};
 // Links follow playable contacts; the strip B5 separates P4 from B3.
 links.P4=links.P4.filter(id=>id!=='B3');
 const city=[['01','Palácio'],['02','Quartel'],['03','Residências Nobres'],['04','Templo'],['05','Praça Central'],['06','Anfiteatro'],['07','Mercado'],['08','Banhos Públicos'],['09','Oficinas'],['10','Bairro Popular'],['11','Biblioteca'],['12','Santuário']];
 return {points,links,city};
});
