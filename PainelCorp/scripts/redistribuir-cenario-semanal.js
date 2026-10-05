/* Exclusivo da base simulada. Redistribui entradas dentro do mesmo mês.
   Preserva pedidos, produtos, organizações, cancelamentos e conclusões.
   Execute sem argumentos para conferir; --aplicar grava com backup. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {lerPipe}=require('./preparar-vendas'),M=require('../modelo');
const raiz=path.join(__dirname,'..');
const caminhos={vendas:'0 Entrada/VENDAS - BRUTO.csv',cancelamentos:'1 Cancelamentos/CANCELAMENTOS.csv',instalacoes:'2 Instalacoes/INSTALACOES.csv',backlog:'4 Backlog/BACKLOG.csv'};
function ler(nome){const arquivo=path.join(raiz,'Coletas',caminhos[nome]);const linhas=lerPipe(fs.readFileSync(arquivo,'utf8'));const cabecalho=linhas.shift();return {arquivo,cabecalho,registros:linhas.map(l=>Object.fromEntries(cabecalho.map((c,i)=>[c,l[i]])))};}
const bases=Object.fromEntries(Object.keys(caminhos).map(n=>[n,ler(n)]));
const quantidade=r=>['Prod 1','Prod 2','Prod 3'].reduce((s,k)=>s+Number(r[k]),0);
const perfil=[.2,1.5,1.28,1.08,.91,.76,.5]; // dom, seg, ter, qua, qui, sex, sáb; não são pesos DU.
// Sorteio reproduzível por data: não muda toda vez que o usuário abre a tela.
const aleatorio=chave=>require('node:crypto').createHash('sha256').update('cenario-semanal-v2:'+chave).digest().readUInt32BE(0)/4294967296;
const vendas=bases.vendas.registros,cancelados=new Set(bases.cancelamentos.registros.map(r=>r.ID_Pedido));
const dataOriginal=new Map(vendas.map(r=>[r.ID_Pedido,r.Data_Ref]));
const cortes=bases.backlog.registros.map(r=>M.dataISO(r.Data_Corte)).sort();
const meses=[...new Set(vendas.map(r=>M.dataISO(r.Data_Ref).slice(0,7)))].sort();
const relatorio=[];
for(const mes of meses){
 const dias=[];const fim=cortes.filter(d=>d.startsWith(mes)).at(-1);if(!fim)throw Error('Corte ausente: '+mes);
 for(let t=Date.parse(mes+'-01');t<=Date.parse(fim);t+=86400000){const dia=new Date(t).toISOString().slice(0,10),semana=new Date(t).getUTCDay();const segunda=new Date(t-((semana+6)%7)*86400000).toISOString().slice(0,10);const fatorSemana=.8+.4*aleatorio(segunda);const ruido=semana===0?.6+.8*aleatorio(dia+':dia'):.94+.12*aleatorio(dia+':dia');dias.push({dia,peso:perfil[semana]*fatorSemana*ruido,valor:0});}
 const mapa=new Map(dias.map(d=>[d.dia,d]));
 for(const r of vendas)if(mapa.has(M.dataISO(r.Data_Ref)))mapa.get(M.dataISO(r.Data_Ref)).valor+=quantidade(r);
 for(const r of bases.cancelamentos.registros)if(mapa.has(M.dataISO(r.Data_Cancelamento)))mapa.get(M.dataISO(r.Data_Cancelamento)).valor-=quantidade(r);
 const total=dias.reduce((s,d)=>s+d.valor,0),pesos=dias.reduce((s,d)=>s+d.peso,0);
 dias.forEach(d=>d.alvo=total*d.peso/pesos);
 const candidatos=vendas.filter(r=>M.dataISO(r.Data_Ref).startsWith(mes)&&!cancelados.has(r.ID_Pedido)&&quantidade(r)>0).map(r=>({r,q:quantidade(r),limite:[fim,...['Data_Agendada','Data_Encerramento'].filter(k=>r[k]).map(k=>M.dataISO(r[k]))].sort()[0]}));
 // Cada transferência precisa reduzir o erro quadrático e respeitar a cronologia.
 for(let passo=0;passo<5000;passo++){
  let melhor=null;
  for(const c of candidatos){const origem=mapa.get(M.dataISO(c.r.Data_Ref));if(origem.valor<=origem.alvo)continue;
   for(const destino of dias){if(destino===origem||destino.dia>c.limite)continue;
    const wo=new Date(origem.dia).getUTCDay()===0?5:1,wd=new Date(destino.dia).getUTCDay()===0?5:1;
    const ganho=wo*(2*c.q*(origem.valor-origem.alvo)-c.q*c.q)-wd*(2*c.q*(destino.valor-destino.alvo)+c.q*c.q);
    if(ganho>0.000001&&(!melhor||ganho>melhor.ganho))melhor={c,origem,destino,ganho};
   }
  }
  if(!melhor)break;
  const {c,origem,destino}=melhor;origem.valor-=c.q;destino.valor+=c.q;c.r.Data_Ref=destino.dia.split('-').reverse().join('/')+' 00:00';
 }
 relatorio.push({mes,liquidas:total,medias:['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map((nome,i)=>{const lista=dias.filter(d=>new Date(d.dia).getUTCDay()===i);return nome+': '+(lista.reduce((s,d)=>s+d.valor,0)/lista.length).toFixed(2)}).join(' | ')});
}
const porId=new Map(vendas.map(r=>[r.ID_Pedido,r]));
for(const nome of ['cancelamentos','instalacoes'])for(const r of bases[nome].registros)r.Data_Ref=porId.get(r.ID_Pedido).Data_Ref;
// Idades dos snapshots precisam acompanhar as novas datas; volumes mensais não mudam.
for(const r of bases.backlog.registros){const corte=M.dataISO(r.Data_Corte);const encerrados=new Set([...bases.cancelamentos.registros.filter(x=>M.dataISO(x.Data_Cancelamento)<=corte),...bases.instalacoes.registros.filter(x=>M.dataISO(x.Data_Encerramento)<=corte)].map(x=>x.ID_Pedido));
 const lista=vendas.filter(v=>['Diretoria','Empresa','Regiao'].every(k=>v[k]===r[k])&&Number(v[r.Produto])>0&&M.dataISO(v.Data_Ref)<=corte&&!encerrados.has(v.ID_Pedido));
 if(lista.length!==Number(r.Backlog_Final))throw Error('Mudança indevida de saldo.');
 const idades=lista.map(v=>(Date.parse(corte)-Date.parse(M.dataISO(v.Data_Ref)))/86400000);
 r.Media_Dias_Em_Aberto=(idades.length?idades.reduce((s,v)=>s+v,0)/idades.length:0).toFixed(2).replace('.',',');r.Maior_Idade_Dias=String(Math.max(0,...idades));
}
for(const r of vendas){if(M.dataISO(r.Data_Ref).slice(0,7)!==M.dataISO(dataOriginal.get(r.ID_Pedido)).slice(0,7))throw Error('Mudança indevida de mês.');for(const k of ['Data_Agendada','Data_Encerramento'])if(r[k]&&M.dataISO(r.Data_Ref)>M.dataISO(r[k]))throw Error('Venda posterior ao evento.');}
console.table(relatorio);console.log('Pedidos redistribuídos:',vendas.filter(r=>r.Data_Ref!==dataOriginal.get(r.ID_Pedido)).length);
if(process.argv.includes('--aplicar')){
 const backup=fs.mkdtempSync(path.join(os.tmpdir(),'painelcorp-perfil-semanal-'));
 for(const [nome,b] of Object.entries(bases)){fs.copyFileSync(b.arquivo,path.join(backup,nome+'.csv'));const campo=v=>/[|"\r\n]/.test(String(v))?'"'+String(v).replaceAll('"','""')+'"':v;fs.writeFileSync(b.arquivo,'\uFEFF'+[b.cabecalho.join('|'),...b.registros.map(r=>b.cabecalho.map(k=>campo(r[k])).join('|'))].join('\r\n')+'\r\n');}
 console.log('Backup:',backup);
}
