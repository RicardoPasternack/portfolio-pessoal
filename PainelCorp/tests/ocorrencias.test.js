const test=require('node:test'),assert=require('node:assert/strict'),A=require('../analitica');
const b=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog'].map(n=>[n,require('../dados/'+n+'.json')]));
test('últimas três segundas incluem atual e duas anteriores',()=>{
 const r=A.ultimasOcorrencias(b,{mes:'2025-08'},'2025-08-25')[1];assert.deepEqual(r.selecionadas.map(d=>d.dia),['2025-08-25','2025-08-18','2025-08-11']);
 assert.equal(r.mediaDU,r.selecionadas.reduce((s,d)=>s+d.liquidas,0)/3);
});
test('feriado ou quebra DU pula para semana anterior, nunca busca o futuro',()=>{
 const copia=structuredClone(b);copia.calendario={excecoes:[{data:'2025-08-18',du:0,motivo:'Feriado de teste'},{data:'2025-08-11',du:.5,motivo:'Operação reduzida'}]};
 const r=A.ultimasOcorrencias(copia,{mes:'2025-08'},'2025-08-25')[1];assert.deepEqual(r.selecionadas.map(d=>d.dia),['2025-08-25','2025-08-04','2025-07-28']);assert.equal(r.ignoradas.length,2);
 assert.equal(A.pesoDU('2025-08-18',copia.calendario.excecoes),0);
});
test('histórico insuficiente é amostra menor; dia zero continua válido',()=>{
 const r=A.ultimasOcorrencias(b,{mes:'2025-07',Regiao:'inexistente'},'2025-07-07')[1];assert.equal(r.selecionadas.length,1);assert.equal(r.mediaDU,0);
 assert.equal(A.ultimasOcorrencias(b,{mes:'2025-07'},'2025-07-01')[1].mediaDU,null);
});

test('feriado prevalece sobre sábado e domingo feriado sai da amostra',()=>{
 const calendario=require('../dados/calendario.json');
 assert.equal(A.pesoDU('2025-01-25',calendario.excecoes),.25);
 assert.equal(A.pesoDU('2025-03-03',calendario.excecoes),.25);
 assert.equal(A.pesoDU('2026-02-17',calendario.excecoes),.25);
 assert.equal(A.pesoDU('2025-07-09',calendario.excecoes),1);
 const r=A.ultimasOcorrencias({...b,calendario},{mes:'2025-09'},'2025-09-14')[0];
 assert.deepEqual(r.selecionadas.map(d=>d.dia),['2025-09-14','2025-08-31','2025-08-24']);
 assert.equal(r.ignoradas[0].dia,'2025-09-07');
 assert.equal(new Set(calendario.excecoes.map(e=>e.data)).size,calendario.excecoes.length);
});
