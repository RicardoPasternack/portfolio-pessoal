const test=require('node:test'),assert=require('node:assert/strict'),M=require('../modelo');
const b=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog'].map(n=>[n,require('../dados/'+n+'.json')]));
test('cenário tem domingo mínimo e pico médio na segunda, preservando totais mensais',()=>{
 const esperados={'2025-07':[443,390,341,49],'2025-08':[451,416,353,112],'2025-09':[450,401,367,146],'2025-10':[171,153,127,172]};
 for(const [mes,valores] of Object.entries(esperados)){
  const r=M.calcular(b,{mes});assert.deepEqual([r.brutas,r.liquidas,r.instalacoes,r.backlog],valores);
  const dias=M.serie(b,{mes}),medias=Array.from({length:7},(_,i)=>{const lista=dias.filter(d=>new Date(d.dia).getUTCDay()===i);return lista.reduce((s,d)=>s+d.liquidas,0)/lista.length;});
  assert.equal(Math.min(...medias),medias[0]);assert.equal(Math.max(...medias),medias[1]);for(let i=1;i<6;i++)assert.ok(medias[i]>medias[i+1]);assert.ok(medias[6]>medias[0]);if(mes!=='2025-10')assert.ok(new Set(dias.filter(d=>new Date(d.dia).getUTCDay()===1).map(d=>d.liquidas)).size>1,'Segundas precisam variar');
 }
});
test('pedidos permanecem ligados e venda não sucede agendamento ou conclusão',()=>{
 const ids=new Map(b.vendas.map(r=>[r.ID_Pedido,r]));assert.equal(ids.size,1224);
 for(const r of b.vendas)for(const k of ['Data_Agendada','Data_Encerramento'])if(r[k])assert.ok(M.dataISO(r.Data_Ref)<=M.dataISO(r[k]));
 for(const nome of ['cancelamentos','instalacoes'])for(const r of b[nome])assert.equal(r.Data_Ref,ids.get(r.ID_Pedido).Data_Ref);
});
