// Banco derivado: os CSVs continuam sendo a fonte. Node 24 ou superior.
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {prepararTudo}=require('./preparar-vendas');
const {dataISO}=require('../modelo');
const raiz=path.join(__dirname,'..');
function carregarBanco() {
    const bases=prepararTudo();
    fs.mkdirSync(path.join(raiz,'banco'),{recursive:true});
    const db=new DatabaseSync(path.join(raiz,'banco','painel.sqlite'));
    db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS dim_organizacao(id INTEGER PRIMARY KEY,diretoria TEXT NOT NULL,empresa TEXT NOT NULL,regiao TEXT NOT NULL,UNIQUE(diretoria,empresa,regiao));
      CREATE TABLE IF NOT EXISTS dim_produto(id INTEGER PRIMARY KEY,nome TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS dim_data(dia TEXT PRIMARY KEY,mes TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS pedidos(id TEXT PRIMARY KEY,organizacao_id INTEGER NOT NULL REFERENCES dim_organizacao(id));
      CREATE TABLE IF NOT EXISTS fato_movimento(pedido_id TEXT REFERENCES pedidos(id),produto_id INTEGER REFERENCES dim_produto(id),tipo TEXT CHECK(tipo IN ('venda','cancelamento','instalacao')),dia TEXT REFERENCES dim_data(dia),quantidade INTEGER NOT NULL CHECK(quantidade>0),PRIMARY KEY(pedido_id,produto_id,tipo));
      CREATE TABLE IF NOT EXISTS fato_meta(organizacao_id INTEGER REFERENCES dim_organizacao(id),produto_id INTEGER REFERENCES dim_produto(id),mes TEXT,quantidade REAL NOT NULL,PRIMARY KEY(organizacao_id,produto_id,mes));
      CREATE TABLE IF NOT EXISTS bases_json(nome TEXT PRIMARY KEY,conteudo TEXT NOT NULL);`);
    db.exec('BEGIN');
    try {
        db.exec('DELETE FROM fato_movimento; DELETE FROM fato_meta; DELETE FROM pedidos; DELETE FROM dim_data; DELETE FROM dim_produto; DELETE FROM dim_organizacao; DELETE FROM bases_json;');
        const orgInsert=db.prepare('INSERT OR IGNORE INTO dim_organizacao(diretoria,empresa,regiao) VALUES(?,?,?)');
        const orgFind=db.prepare('SELECT id FROM dim_organizacao WHERE diretoria=? AND empresa=? AND regiao=?');
        const org=r=>{orgInsert.run(r.Diretoria,r.Empresa,r.Regiao);return orgFind.get(r.Diretoria,r.Empresa,r.Regiao).id;};
        for(let i=1;i<=3;i++)db.prepare('INSERT INTO dim_produto VALUES(?,?)').run(i,'Prod '+i);
        for(const r of bases.vendas)db.prepare('INSERT INTO pedidos VALUES(?,?)').run(r.ID_Pedido,org(r));
        const fato=db.prepare('INSERT INTO fato_movimento VALUES(?,?,?,?,?)');
        for(const [nome,tipo,campo] of [['vendas','venda','Data_Ref'],['cancelamentos','cancelamento','Data_Cancelamento'],['instalacoes','instalacao','Data_Encerramento']]) {
            for(const r of bases[nome]) {
                const dia=dataISO(r[campo]);
                db.prepare('INSERT OR IGNORE INTO dim_data VALUES(?,?)').run(dia,dia.slice(0,7));
                for(let i=1;i<=3;i++)if(r['Prod '+i]>0)fato.run(r.ID_Pedido,i,tipo,dia,r['Prod '+i]);
            }
        }
        for(const r of bases.metas) {
            const produto=Number(r.Produto.replace('Prod ',''));
            const mes=r.Mes_Referencia.slice(3)+'-'+r.Mes_Referencia.slice(0,2);
            db.prepare('INSERT INTO fato_meta VALUES(?,?,?,?)').run(org(r),produto,mes,r.Meta_Quantidade);
        }
        // Snapshot de entrega preserva os campos didaticos das cinco bases.
        for(const [nome,registros] of Object.entries(bases))db.prepare('INSERT INTO bases_json VALUES(?,?)').run(nome,JSON.stringify(registros));
        db.exec('COMMIT');
        console.log('Banco atualizado. Pedidos:',bases.vendas.length);
    } catch(erro) { db.exec('ROLLBACK');throw erro; } finally { db.close(); }
}
if(require.main===module)carregarBanco();
module.exports={carregarBanco};