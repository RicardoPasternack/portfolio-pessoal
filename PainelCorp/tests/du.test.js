const test=require('node:test'),assert=require('node:assert/strict'),A=require('../analitica');
const bases=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog'].map(n=>[n,require('../dados/'+n+'.json')]));
test('pesos exatos e fim de semana com 2 DU',()=>{
 assert.equal(A.pesoDU('2025-10-06'),1);assert.equal(A.pesoDU('2025-10-11'),.75);assert.equal(A.pesoDU('2025-10-12'),.25);
 assert.equal(A.totalDU('2025-10-10','2025-10-12'),2);assert.equal(A.totalDU('2025-10-06','2025-10-12'),6);
 const a=A.analisar(bases,{mes:'2025-10'});assert.equal(a.duObservados,9);assert.equal(a.duMes,27);assert.equal(a.projecao,459);
});
test('15 dias cruzam meses; média por DU e comparação usam cobertura correta',()=>{
 const t=A.linhaTempo(bases,{mes:'2025-10'},'2025-09-26','2025-10-10');assert.equal(t.dias.length,15);assert.equal(t.dias[0].dia,'2025-09-26');
 assert.equal(t.semanaAtual.inicio,'2025-10-06');assert.equal(t.semanaAnterior.inicio,'2025-09-29');assert.equal(t.semanaAnterior.fim,'2025-10-03');
 assert.equal(t.mediaDU,t.liquidas/t.du);
 assert.throws(()=>A.linhaTempo(bases,{mes:'2025-10'},'2025-10-01','2025-10-11'),/cobertura/);
});
test('projeção usa apenas até quinta, nunca sexta já observada',()=>{
 const f={mes:'2025-10'},p=A.projetarFimSemana(bases,f,'2025-10-09');assert.equal(p.base.fim,'2025-10-09');assert.equal(p.dias[0].dia,'2025-10-10');assert.equal(p.total,p.base.mediaDU*2);
 assert.deepEqual(p.dias.map(d=>d.du),[1,.75,.25]);
 const copia=structuredClone(bases);copia.vendas.push({...copia.vendas[0],Data_Ref:'10/10/2025 00:00','Prod 1':999999});
 assert.deepEqual(A.projetarFimSemana(copia,f,'2025-10-09'),p);
 assert.throws(()=>A.projetarFimSemana(bases,f,'2025-10-10'),/quinta/);
});
test('mesma produtividade de mil por DU projeta 1000,750,250',()=>{
 const vendas=A.linhaTempo(bases,{mes:'2025-10'},'2025-09-25','2025-10-09').dias.map((d,i)=>({ID_Pedido:String(i),Data_Ref:d.dia.split('-').reverse().join('/')+' 00:00','Prod 1':d.du*1000,'Prod 2':0,'Prod 3':0}));
 const b={vendas,cancelamentos:[],instalacoes:[],metas:[],backlog:[{Data_Corte:'10/10/2025'}]};
 assert.deepEqual(A.projetarFimSemana(b,{mes:'2025-10'},'2025-10-09').dias.map(d=>d.projecao),[1000,750,250]);
});
