/* Interface: carrega dados, recebe filtros e atualiza a tela. As contas ficam em modelo.js. */
'use strict';
const $=id=>document.getElementById(id);
const inteiro=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
const decimal=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
let bases, fonte, fotoURL;
let dimensoes={};
const nomeDimensao=(campo,codigo)=>dimensoes[campo]?.find(item=>item.codigo===codigo)?.nome||codigo;
const ids=['mes','Diretoria','Empresa','Regiao'];
const filtros=()=>Object.fromEntries(ids.map(id=>[id,$(id).value]));
const exibir=(valor,percentual=false)=>valor===null?'—':(percentual?decimal:inteiro).format(valor)+(percentual?'%':'');
function preencherOpcoes(id,valores,rotulo) {
    const anterior=$(id).value;$(id).replaceChildren();
    if(rotulo)$(id).add(new Option(rotulo,''));
    for(const valor of valores)$(id).add(new Option(id==='mes'?valor.slice(5)+'/'+valor.slice(0,4):nomeDimensao(id,valor),valor));
    if(valores.includes(anterior))$(id).value=anterior;
}
function atualizarFiltros(origem) {
    if(origem==='Diretoria'){$('Empresa').value='';$('Regiao').value='';}
    if(origem==='Empresa')$('Regiao').value='';
    preencherOpcoes('Empresa',ModeloPainel.opcoes(bases,{Diretoria:$('Diretoria').value},'Empresa'),'Todas');
    preencherOpcoes('Regiao',ModeloPainel.opcoes(bases,{Diretoria:$('Diretoria').value,Empresa:$('Empresa').value},'Regiao'),'Todas');
}
function linhaTabela(tbody,nome,r) {
    const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=nome;tr.append(th);
    for(const [valor,percentual] of [[r.liquidas,false],[r.instalacoes,false],[r.atingimento,true]]) {
        const td=document.createElement('td');td.textContent=exibir(valor,percentual);tr.append(td);
    }
    const dias=document.createElement('td');
    dias.textContent=r.diasBacklog===null?'Sem instalações':decimal.format(r.diasBacklog)+' dias';
    tr.append(dias);
    tbody.append(tr);
}
function tabela(campo,id,f) {
    const corpo=$(id);corpo.replaceChildren();
    const nomes=ModeloPainel.opcoes(bases,f,campo);
    for(const nome of nomes)linhaTabela(corpo,nomeDimensao(campo,nome),ModeloPainel.calcular(bases,{...f,[campo]:nome}));
    if(!nomes.length) {const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='Nenhum resultado para este recorte.';tr.append(td);corpo.append(tr);}
}
function svgElemento(tag,atributos={},texto) {
    const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [k,v] of Object.entries(atributos))e.setAttribute(k,String(v));if(texto!==undefined)e.textContent=texto;return e;
}
function desenharGrafico(serie) {
    const area=$('grafico');area.replaceChildren();$('linhas-dias').replaceChildren();
    if(!serie.length){area.textContent='Sem dias disponíveis para este período.';return;}
    // Área e linha seguem a referência visual, mantendo os valores reais de cada dia.
    const largura=Math.max(760,serie.length*30+90), altura=320;
    const esquerda=54, direita=largura-22, topo=32, base=274;
    const valores=serie.flatMap(d=>[d.liquidas,d.instalacoes]);
    const minimo=Math.min(0,...valores), maximo=Math.max(1,...valores);
    const intervalo=(maximo-minimo)/4;
    const potencia=10**Math.floor(Math.log10(intervalo));
    const passo=Math.max(1,[1,2,5,10].find(n=>n*potencia>=intervalo)*potencia);
    const inicio=Math.floor(minimo/passo)*passo, fim=Math.ceil(maximo/passo)*passo;
    const espaco=(direita-esquerda)/serie.length;
    const x=i=>esquerda+espaco*(i+.5), y=v=>base-(v-inicio)/(fim-inicio)*(base-topo);
    const svg=svgElemento('svg',{viewBox:`0 0 ${largura} ${altura}`,role:'img','aria-labelledby':'descricao-grafico'});
    svg.append(svgElemento('title',{id:'descricao-grafico'},'Vendas líquidas em área azul e instalações em linha tracejada ciano, em produtos por dia. Valores completos na tabela abaixo.'));
    svg.append(svgElemento('text',{x:esquerda,y:15,class:'unidade-grafico'},'Produtos'));
    for(let valor=inicio;valor<=fim;valor+=passo){
        svg.append(svgElemento('line',{x1:esquerda,x2:direita,y1:y(valor),y2:y(valor),class:valor===0?'grade eixo-zero':'grade'}));
        svg.append(svgElemento('text',{x:esquerda-12,y:y(valor)+4,'text-anchor':'end'},inteiro.format(valor)));
    }
    const defs=svgElemento('defs');
    const gradiente=svgElemento('linearGradient',{id:'gradiente-vendas',x1:'0',y1:'0',x2:'0',y2:'1'});
    gradiente.append(svgElemento('stop',{offset:'0%','stop-color':'#168bff','stop-opacity':'.32'}));
    gradiente.append(svgElemento('stop',{offset:'100%','stop-color':'#168bff','stop-opacity':'.02'}));
    defs.append(gradiente);svg.append(defs);
    const pontos=serie.map((d,i)=>`${x(i)},${y(d.liquidas)}`).join(' ');
    svg.append(svgElemento('polygon',{points:`${x(0)},${y(0)} ${pontos} ${x(serie.length-1)},${y(0)}`,class:'area-liquidas'}));
    svg.append(svgElemento('polyline',{points:pontos,class:'linha linha-liquidas'}));
    svg.append(svgElemento('polyline',{points:serie.map((d,i)=>`${x(i)},${y(d.instalacoes)}`).join(' '),class:'linha linha-instalacoes'}));
    serie.forEach((d,i)=>{
        const data=d.dia.slice(8)+'/'+d.dia.slice(5,7);
        const rotulo=`${data}: ${inteiro.format(d.liquidas)} vendas líquidas; ${inteiro.format(d.instalacoes)} instalações`;
        const grupo=svgElemento('g',{class:'dia-grafico',tabindex:'0','aria-label':rotulo});
        grupo.append(svgElemento('title',{},rotulo));
        grupo.append(svgElemento('rect',{x:x(i)-espaco/2+1,y:topo,width:Math.max(1,espaco-2),height:base-topo,class:'faixa-dia'}));
        grupo.append(svgElemento('line',{x1:x(i),x2:x(i),y1:topo,y2:base,class:'cursor-dia'}));
        grupo.append(svgElemento('circle',{cx:x(i),cy:y(d.liquidas),r:serie.length===1?4:3,class:'ponto-liquidas'}));
        grupo.append(svgElemento('circle',{cx:x(i),cy:y(d.instalacoes),r:serie.length===1?4:3,class:'ponto-instalacoes'}));
        const tooltip=svgElemento('g',{class:'tooltip-grafico','aria-hidden':'true'});
        const tx=Math.min(direita-172,Math.max(esquerda,x(i)-86));
        tooltip.append(svgElemento('rect',{x:tx,y:topo+8,width:172,height:73,rx:8}));
        tooltip.append(svgElemento('text',{x:tx+12,y:topo+28,class:'tooltip-data'},data));
        tooltip.append(svgElemento('text',{x:tx+12,y:topo+48},`Líquidas: ${inteiro.format(d.liquidas)}`));
        tooltip.append(svgElemento('text',{x:tx+12,y:topo+67},`Instalações: ${inteiro.format(d.instalacoes)}`));
        grupo.append(tooltip);svg.append(grupo);
        // Menos rótulos em meses longos, preservando o primeiro e o último dia.
        const salto=serie.length>20?3:serie.length>12?2:1;
        if(i===0||i===serie.length-1||(i%salto===0&&i<serie.length-2))svg.append(svgElemento('text',{x:x(i),y:base+26,'text-anchor':'middle'},data));
        const tr=document.createElement('tr');
        for(const [j,v] of [data,d.liquidas,d.instalacoes].entries()){
            const td=document.createElement(j?'td':'th');if(!j)td.scope='row';td.textContent=v;tr.append(td);
        }
        $('linhas-dias').append(tr);
    });
    area.setAttribute('tabindex','0');
    area.setAttribute('role','region');
    area.setAttribute('aria-label','Gráfico diário. Em telas pequenas, role horizontalmente para ver todos os dias.');
    area.append(svg);
}

function renderizar() {
    const f=filtros();const r=ModeloPainel.calcular(bases,f);
    const valores={meta:r.meta,'vendas-brutas':r.brutas,cancelamentos:r.cancelamentos,backlog:r.backlog,'vendas-liquidas':r.liquidas,instalacoes:r.instalacoes};
    for(const [id,valor] of Object.entries(valores))$(id).textContent=exibir(valor);
    $('meta-atingida').textContent=exibir(r.atingimento,true);
    $('progresso').value=Math.max(0,Math.min(100,r.atingimento||0));
    $('dias-estoque').textContent=r.diasBacklog===null?'Sem instalações':decimal.format(r.diasBacklog)+' dias';
    const dataBR=s=>s.split('-').reverse().join('/');
    $('periodo-resumo').textContent=dataBR(r.inicio)+' — '+dataBR(r.fim);
    tabela('Regiao','linhas-regioes',f);tabela('Empresa','linhas-empresas',f);
    const abrangencia=['Diretoria','Empresa','Regiao'].filter(campo=>f[campo]).map(campo=>nomeDimensao(campo,f[campo])).join(' · ')||'Grande São Paulo';
    $('total-regioes').replaceChildren();linhaTabela($('total-regioes'),abrangencia,r);
    $('abrangencia-grafico').textContent=`${abrangencia} · ${exibir(r.liquidas)} vendas líquidas · ${exibir(r.instalacoes)} instalações`;
    desenharGrafico(ModeloPainel.serie(bases,f));
    $('status').className='';$('status').textContent=`Dados até ${dataBR(r.corte)}. Filtros aplicados a todos os indicadores.`;
    if(!r.brutas&&!r.cancelamentos&&!r.instalacoes)$('status').textContent+=' Sem movimentação neste período.';
}
async function lerJSON(caminho) {
    let resposta;
    try { resposta=await fetch(caminho); }
    catch { throw Error('Não foi possível acessar '+caminho+'. Confira a conexão e abra o painel pelo site publicado ou Live Server.'); }
    if(!resposta.ok)throw Error('Arquivo indisponível: '+caminho+' (HTTP '+resposta.status+').');
    return resposta.json();
}
async function carregarDados() {
    try {
        $('status').className='';$('status').textContent='Carregando as bases…';$('tentar').hidden=true;
        // API local quando disponivel; Live Server e hospedagem estatica usam os JSONs.
        if(typeof location!=='undefined'&&location.protocol==='file:')throw Error('O painel foi aberto como arquivo. Use o link publicado no portfólio ou Open with Live Server.');
        let resposta;
        const local=typeof location==='undefined'||['localhost','127.0.0.1'].includes(location.hostname);
        if(local){try {resposta=await fetch('./api/dados');}catch {}}
        if(resposta?.ok&&resposta.headers.get('content-type')?.includes('application/json')){bases=await resposta.json();fonte='API local · SQLite';}
        else {
            const nomes=['vendas','cancelamentos','instalacoes','metas','backlog'];
            const registros=await Promise.all(nomes.map(nome=>lerJSON(`./dados/${nome}.json`)));
            bases=Object.fromEntries(nomes.map((nome,i)=>[nome,registros[i]]));fonte='Dados publicados · JSON';
        }
        for(const nome of ['vendas','cancelamentos','instalacoes','metas','backlog'])if(!Array.isArray(bases[nome]))throw Error('Base ausente: '+nome);
        if(!bases.vendas.length||!bases.backlog.length)throw Error('A base de vendas ou as datas de corte estão vazias.');
        dimensoes=await lerJSON('./dados/dimensoes.json');
        const meses=[...new Set(bases.vendas.map(r=>ModeloPainel.dataISO(r.Data_Ref).slice(0,7)))].sort();
        preencherOpcoes('mes',meses);$('mes').value=meses.at(-1);
        preencherOpcoes('Diretoria',ModeloPainel.opcoes(bases,{},'Diretoria'),'Todas');atualizarFiltros();
        // Restaura o recorte ao voltar de uma tela de análise.
        if(typeof location!=='undefined'&&location.search){
            const parametros=new URLSearchParams(location.search);
            for(const campo of ids){const valor=parametros.get(campo);if(valor&&Array.from($(campo).options).some(o=>o.value===valor))$(campo).value=valor;atualizarFiltros();}
        }
        for(const id of [...ids,'limpar'])$(id).disabled=false;
        $('fonte').textContent=fonte;renderizar();
    }catch(erro){$('status').className='erro';$('status').textContent='Não foi possível abrir o painel. '+erro.message+' Abra pelo servidor local ou Live Server.';$('fonte').textContent='Dados indisponíveis';$('tentar').hidden=false;console.error(erro);}
}
for(const id of ids)$(id).addEventListener('change',()=>{atualizarFiltros(id);renderizar();});
$('limpar').addEventListener('click',()=>{for(const id of ids.slice(1))$(id).value='';atualizarFiltros();renderizar();});
$('tentar').addEventListener('click',carregarDados);
// Foto local: URL temporaria. Nao ha upload nem envio para a API.
$('trocar-fundo').addEventListener('click',()=>$('foto-fundo').click());
$('foto-fundo').addEventListener('change',()=>{
    const arquivo=$('foto-fundo').files[0];if(!arquivo)return;
    if(!['image/jpeg','image/png','image/webp'].includes(arquivo.type)||arquivo.size>10*1024*1024){$('status').textContent='Escolha uma imagem JPG, PNG ou WebP de até 10 MB.';return;}
    const imagem=new Image();const url=URL.createObjectURL(arquivo);
    imagem.onload=()=>{if(fotoURL)URL.revokeObjectURL(fotoURL);fotoURL=url;document.body.classList.add('foto-personalizada');document.body.style.setProperty('--foto',`url("${url}")`);$('remover-fundo').hidden=false;};
    imagem.onerror=()=>{URL.revokeObjectURL(url);$('status').textContent='Não foi possível abrir essa imagem.';};imagem.src=url;
});
$('remover-fundo').addEventListener('click',()=>{if(fotoURL)URL.revokeObjectURL(fotoURL);fotoURL=null;document.body.classList.remove('foto-personalizada');document.body.style.removeProperty('--foto');$('foto-fundo').value='';$('remover-fundo').hidden=true;});
// Recolhe apenas a visualização; os dados continuam acompanhando os filtros.
$('alternar-regioes').addEventListener('click',()=>{
    const tabela=$('tabela-regioes');
    tabela.hidden=!tabela.hidden;
    $('alternar-regioes').setAttribute('aria-expanded',String(!tabela.hidden));
    $('alternar-regioes').textContent=tabela.hidden?'Mostrar regiões':'Ocultar regiões';
});
carregarDados();
