// Cenário autorizado: julho começa com 450 produtos, rateados como agosto.
// Não usa resultados de junho inexistentes nem altera as metas seguintes.
const fs=require('node:fs'),path=require('node:path');
const arquivo=path.join(__dirname,'../Coletas/3 Metas/METAS.csv');
const linhas=fs.readFileSync(arquivo,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
const cabecalho=linhas[0].split('|'),idx=cabecalho.indexOf('Meta_Quantidade');
const originais=linhas.slice(1).map(l=>l.split('|'));
const referencia=originais.filter(r=>r[0]==='08/2025');
if(referencia.length!==33)throw Error('Rateio de agosto incompleto.');
const total=referencia.reduce((s,r)=>s+Number(r[idx]),0);
const rateio=referencia.map((r,i)=>({r,i,exato:Number(r[idx])/total*450}));
rateio.forEach(x=>x.valor=Math.floor(x.exato));
const faltam=450-rateio.reduce((s,x)=>s+x.valor,0);
[...rateio].sort((a,b)=>(b.exato-b.valor)-(a.exato-a.valor)||a.i-b.i).slice(0,faltam).forEach(x=>x.valor++);
const novas=rateio.map(x=>{const r=[...x.r];r[0]='07/2025';r[idx]=String(x.valor);r[cabecalho.indexOf('Periodo_Base')]='Meta inicial de cenario; rateio proporcional a 08/2025';r[cabecalho.indexOf('Media_Mensal_Base')]='';r[cabecalho.indexOf('Margem_Percentual')]='';return r;});
// Campos numéricos vazios não são aceitos pelo preparador; zero indica que não se aplica média/margem.
novas.forEach(r=>{r[cabecalho.indexOf('Media_Mensal_Base')]='0';r[cabecalho.indexOf('Margem_Percentual')]='0';});
fs.writeFileSync(arquivo,'\uFEFF'+[cabecalho,...novas,...originais.filter(r=>r[0]!=='07/2025')].map(r=>r.join('|')).join('\r\n')+'\r\n');
console.log('Meta inicial simulada: 450 produtos; demais meses preservados.');
