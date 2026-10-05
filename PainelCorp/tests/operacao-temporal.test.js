const test=require('node:test'),assert=require('node:assert/strict'),A=require('../analitica');
const b=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog','calendario'].map(n=>[n,require('../dados/'+n+'.json')]));
test('fluxos operacionais conciliam totais e médias por DU',()=>{
 for(const tipo of ['cancelamentos','instalacoes']){
 const t=A.operacaoTemporal(b,{mes:'2025-10'},'2025-10-01','2025-10-10',tipo);
 assert.equal(t.dias.reduce((s,d)=>s+d.valor,0),A.intervalo(b,{},'2025-10-01','2025-10-10')[tipo]);
 assert.equal(t.proxima.valor,t.atual.mediaDU*t.proxima.du);
 assert.equal(t.medias[1].ultima.dia,'2025-10-06');
 assert.throws(()=>A.operacaoTemporal(b,{mes:'2025-10'},'2025-10-01','2025-10-11',tipo),/cobertura/);
 }
});
test('backlog usa saldo, não soma estoques, e projeta movimentos sem futuro',()=>{
 const t=A.operacaoTemporal(b,{mes:'2025-10'},'2025-10-01','2025-10-10','backlog');
 assert.equal(t.resumo.valor,172);assert.equal(t.dias.at(-1).valor,172);assert.equal(t.medias.length,0);
 const r=A.intervalo(b,{},t.atual.inicio,t.atual.fim);
 assert.equal(t.proxima.valor,Math.max(0,172+(r.liquidas-r.instalacoes)/t.atual.du*A.totalDU('2025-10-11',t.proxima.fim,b.calendario.excecoes)));
});
