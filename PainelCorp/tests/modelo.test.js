const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');const M=require('../modelo');
const nomes=['vendas','cancelamentos','instalacoes','metas','backlog'];
const bases=Object.fromEntries(nomes.map(n=>[n,JSON.parse(fs.readFileSync(path.join(root,'dados',n+'.json'),'utf8'))]));
assert.throws(()=>M.dataISO('31/02/2025 00:00'));
const results=[];
for(const mes of ['2025-07','2025-08','2025-09','2025-10']) {
 const r=M.calcular(bases,{mes});
 const saldo=bases.backlog.filter(b=>M.dataISO(b.Data_Corte).slice(0,7)===mes).reduce((s,b)=>s+b.Backlog_Final,0);
 assert.equal(r.backlog,saldo,'Reconciliacao backlog '+mes);
 const serie=M.serie(bases,{mes});assert.equal(serie.reduce((s,d)=>s+d.liquidas,0),r.liquidas);assert.equal(serie.reduce((s,d)=>s+d.instalacoes,0),r.instalacoes);
 const porRegiao=M.opcoes(bases,{},'Regiao').map(Regiao=>M.calcular(bases,{mes,Regiao}));assert.equal(porRegiao.reduce((s,r)=>s+r.brutas,0),r.brutas);assert.equal(porRegiao.reduce((s,r)=>s+r.backlog,0),r.backlog);
 results.push({mes,brutas:r.brutas,liquidas:r.liquidas,instalacoes:r.instalacoes,backlog:r.backlog,meta:r.meta,dias:r.dias});
}
assert.equal(M.calcular(bases,{mes:'2025-07'}).meta,null);
assert.equal(M.calcular(bases,{mes:'2025-10'}).dias,10);
const vazio=M.calcular(bases,{mes:'2025-10',Empresa:'inexistente'});assert.equal(vazio.brutas,0);assert.equal(vazio.atingimento,null);assert.equal(vazio.diasBacklog,0);
const semInst=structuredClone(bases);semInst.instalacoes=[];assert.equal(M.calcular(semInst,{mes:'2025-10'}).diasBacklog,null);
const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(path.join(root,'banco','painel.sqlite'),{readOnly:true});
assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
for(const [tipo,nome] of [['venda','vendas'],['cancelamento','cancelamentos'],['instalacao','instalacoes']])assert.equal(db.prepare('SELECT SUM(quantidade) AS total FROM fato_movimento WHERE tipo=?').get(tipo).total,bases[nome].reduce((s,r)=>s+M.quantidade(r),0));
db.close();console.table(results);console.log('PASS: saldos mensais, agregacoes, series, vazio, meta ausente, ritmo zero, datas e integridade SQLite.');