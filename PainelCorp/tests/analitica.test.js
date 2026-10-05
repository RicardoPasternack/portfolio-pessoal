const test=require('node:test');const assert=require('node:assert/strict');const A=require('../analitica');
const bases=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog'].map(n=>[n,require('../dados/'+n+'.json')]));
test('outubro parcial: reconciliação, comparação justa, projeção e agregações',()=>{
 const a=A.analisar(bases,{mes:'2025-10'});
 assert.equal(a.resumo.liquidas,153);assert.equal(a.pendentes,172);assert.equal(a.reconciliado,true);
 assert.equal(a.fimAnterior,'2025-09-10');assert.equal(a.projecao,153/a.duObservados*a.duMes);
 assert.equal(a.faixas.reduce((s,r)=>s+r.quantidade,0),172);
 assert.equal(a.diario.at(-1).backlog,172);assert.equal(a.semanas.reduce((s,r)=>s+r.liquidas,0),153);
 assert.equal(a.regioes.reduce((s,r)=>s+r.liquidas,0),153);
 assert.equal(a.motivos.reduce((s,r)=>s+r.quantidade,0),18);
 assert.equal(a.mix.reduce((s,r)=>s+r.quantidade,0),171);
 assert.equal(a.janelas[0].liquidas,554);assert.equal(a.janelas[1].liquidas,970);
});
test('meses encerrados, histórico insuficiente e filtro vazio',()=>{
 const jul=A.analisar(bases,{mes:'2025-07'});assert.equal(jul.passado,null);assert.equal(jul.projecao,null);assert.equal(jul.janelas[0].liquidas,null);
 const ago=A.analisar(bases,{mes:'2025-08'});assert.equal(ago.fimAnterior,'2025-07-31');
 const vazio=A.analisar(bases,{mes:'2025-10',Regiao:'inexistente'});assert.equal(vazio.taxaSafra,null);assert.equal(vazio.sla,null);assert.equal(vazio.idadeMedia,null);assert.equal(vazio.pendentes,0);
});
test('cancelamento de venda anterior não contamina a taxa da safra atual',()=>{
 const r=(id,data)=>({ID_Pedido:id,Data_Ref:data,Diretoria:'D',Empresa:'E',Regiao:'R','Prod 1':1,'Prod 2':0,'Prod 3':0});
 const antigo=r('antigo','01/09/2025 00:00'),novo=r('novo','01/10/2025 00:00');
 const b={vendas:[antigo,novo],cancelamentos:[{...antigo,Data_Cancelamento:'02/10/2025 00:00'}],instalacoes:[],metas:[],backlog:[{Data_Corte:'10/10/2025'}]};
 const a=A.analisar(b,{mes:'2025-10'});assert.equal(a.resumo.cancelamentos,1);assert.equal(a.taxaSafra,0);assert.equal(a.pendentes,1);assert.equal(a.reconciliado,true);
 b.cancelamentos.push({...novo,Data_Cancelamento:'11/10/2025 00:00'});assert.equal(A.analisar(b,{mes:'2025-10'}).pendentes,1);
});
test('SLA conta pedidos; duração negativa não vira atendimento no prazo',()=>{
 const b=structuredClone(bases);const original=b.instalacoes.find(r=>r.Data_Encerramento.includes('/10/2025'));
 b.instalacoes=[{...original,Data_Agendada:'10/10/2025 12:00',Data_Encerramento:'10/10/2025 11:00'},{...original,Data_Agendada:'10/10/2025 09:00',Data_Encerramento:'10/10/2025 11:00'}];
 const a=A.analisar(b,{mes:'2025-10'});assert.equal(a.semPrazo,1);assert.equal(a.sla,100);assert.equal(a.pedidosInstalados,2);
});
test('todos os meses e regiões conciliam pedidos e saldo',()=>{
 for(const mes of ['2025-07','2025-08','2025-09','2025-10'])for(const Regiao of ['',...new Set(bases.vendas.map(r=>r.Regiao))])assert.equal(A.analisar(bases,{mes,Regiao}).reconciliado,true,mes+' '+Regiao);
});
