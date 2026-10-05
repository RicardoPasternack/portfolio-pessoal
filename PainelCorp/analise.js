'use strict';
const $ = id => document.getElementById(id);
const campos = ['mes','Diretoria','Empresa','Regiao'];
const telas = { vendas:'Vendas e Metas', cancelamentos:'Cancelamentos', instalacoes:'Instalações', backlog:'Backlog e Estoque' };
const consulta = new URLSearchParams(location.search);
const tela = Object.hasOwn(telas,consulta.get('tela')) ? consulta.get('tela') : 'vendas';
const numero = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
const fmt = v => v === null || v === undefined ? '—' : numero.format(v);
const fmtInteiro = v => v === null || v === undefined ? '—' : new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(v);
const fmtDU = v => new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(v);
const pct = v => v === null ? '—' : fmt(v)+'%';
const br = d => d.split('-').reverse().join('/');
let bases, dimensoes;
let intervaloTemporal=null;
const filtros = () => Object.fromEntries(campos.map(c=>[c,$(c).value]));
const nome = (campo,codigo) => dimensoes[campo]?.find(r=>r.codigo===codigo)?.nome || codigo;
const criar = (tag,texto,classe) => { const e=document.createElement(tag);if(texto!==undefined)e.textContent=texto;if(classe)e.className=classe;return e; };
function opcoes(c,lista,todas=false){const anterior=$(c).value;$(c).replaceChildren();if(todas)$(c).append(new Option('Todas',''));lista.forEach(v=>$(c).append(new Option(c==='mes'?v.slice(5)+'/'+v.slice(0,4):nome(c,v),v)));if(lista.includes(anterior))$(c).value=anterior;}
function atualizar(changed){
    if(changed==='Diretoria'){$('Empresa').value='';$('Regiao').value='';}if(changed==='Empresa')$('Regiao').value='';
    opcoes('Empresa',ModeloPainel.opcoes(bases,{Diretoria:$('Diretoria').value},'Empresa'),true);
    opcoes('Regiao',ModeloPainel.opcoes(bases,{Diretoria:$('Diretoria').value,Empresa:$('Empresa').value},'Regiao'),true);
}
function navegar(f){
    $('navegacao').replaceChildren();
    for(const [chave,titulo] of [['geral','Visão geral'],...Object.entries(telas)]){
        const q=new URLSearchParams(f);if(chave!=='geral')q.set('tela',chave);
        const a=criar('a',titulo);a.href=(chave==='geral'?'Index.html':'analise.html')+'?'+q;
        if(chave===tela)a.setAttribute('aria-current','page');$('navegacao').append(a);
    }
    const q=new URLSearchParams({...f,tela});history.replaceState(null,'','?'+q);
}
function bloco(grid,titulo,largo=false){const s=criar('section',undefined,'analise-bloco'+(largo?' analise-larga':''));s.append(criar('h2',titulo));grid.append(s);return s;}
function tabela(destino,titulos,linhas){const wrap=criar('div',undefined,'grafico-rolagem'),table=criar('table'),head=criar('thead'),tr=criar('tr');titulos.forEach(t=>{const th=criar('th',t);th.scope='col';tr.append(th);});head.append(tr);table.append(head);const body=criar('tbody');linhas.forEach(valores=>{const row=criar('tr');valores.forEach((v,i)=>{const cell=criar(i?'td':'th');if(v instanceof Node)cell.append(v);else cell.textContent=v;if(!i)cell.scope='row';row.append(cell);});body.append(row);});table.append(body);wrap.append(table);destino.append(wrap);}
function variacaoDU(d){
    if(!d.ultima||d.mediaDU===null)return criar('span','—');
    const atual=d.ultima.liquidas/d.ultima.du;
    if(d.mediaDU===0&&atual!==0){const e=criar('span','—');e.title='Média zero: percentual indefinido';return e;}
    const valor=d.mediaDU===0?0:(atual-d.mediaDU)/Math.abs(d.mediaDU)*100;
    const arredondado=Math.round(valor*10)/10;
    const sinal=arredondado>0?'alta':arredondado<0?'queda':'estavel';
    const e=criar('span',(sinal==='alta'?'▲ +':sinal==='queda'?'▼ ':'● ')+pct(arredondado===0?0:arredondado),'variacao-du '+sinal);
    e.setAttribute('aria-label',(sinal==='alta'?'Alta':sinal==='queda'?'Queda':'Estável')+': '+pct(Math.abs(arredondado))+' em relação à média por DU');
    return e;
}
function mixRadial(destino,linhas,rotulo='Instalações'){
    const total=linhas.reduce((s,r)=>s+r.quantidade,0);destino.classList.add('mix-compacto');
    if(!total){destino.append(criar('p','Sem produtos neste recorte.'));return;}
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),cores=['#238bd1','#36becb','#86ddeb'],max=Math.max(...linhas.map(r=>r.quantidade));
    svg.setAttribute('viewBox','0 0 260 240');svg.classList.add('mix-radial');svg.setAttribute('role','img');svg.setAttribute('aria-label','Mix de '+rotulo+': '+linhas.map(r=>r.nome+' '+pct(r.quantidade/total*100)).join(', '));
    const ponto=(r,a)=>[130+r*Math.cos(a*Math.PI/180),120+r*Math.sin(a*Math.PI/180)];
    linhas.forEach((r,i)=>{
        if(!r.quantidade)return;
        const raio=Math.sqrt(46*46+(108*108-46*46)*r.quantidade/max),a=-90+i*120+3,b=a+114;
        const p=ponto(raio,a),q=ponto(raio,b),u=ponto(46,b),v=ponto(46,a),path=document.createElementNS(ns,'path');
        path.setAttribute('d',`M ${p} A ${raio} ${raio} 0 0 1 ${q} L ${u} A 46 46 0 0 0 ${v} Z`);path.setAttribute('fill',cores[i]);path.classList.add('mix-fatia');
        const title=document.createElementNS(ns,'title');title.textContent=r.nome+': '+fmt(r.quantidade)+' produtos · '+pct(r.quantidade/total*100);path.append(title);svg.append(path);
        const pos=ponto((46+raio)/2,a+57),text=document.createElementNS(ns,'text');text.setAttribute('x',pos[0]);text.setAttribute('y',pos[1]);text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','middle');text.classList.add('mix-percentual');text.textContent=pct(r.quantidade/total*100);svg.append(text);
    });
    const centro=document.createElementNS(ns,'text');centro.setAttribute('x','130');centro.setAttribute('y','119');centro.setAttribute('text-anchor','middle');centro.classList.add('mix-total');centro.textContent=fmt(total);svg.append(centro);
    const label=document.createElementNS(ns,'text');label.setAttribute('x','130');label.setAttribute('y','137');label.setAttribute('text-anchor','middle');label.classList.add('mix-total-label');label.textContent=rotulo;svg.append(label);
    const legenda=criar('div',undefined,'mix-radial-legenda');linhas.forEach((r,i)=>{const item=criar('span',r.nome);item.style.setProperty('--cor',cores[i]);legenda.append(item);});destino.append(svg,legenda);
}
function barras(destino,linhas,escala=0){if(!linhas.length){destino.append(criar('p','Sem registros neste recorte.','nota'));return;}const max=Math.max(1,escala,...linhas.map(r=>Math.abs(r.quantidade)));linhas.forEach(r=>{const row=criar('div',undefined,'barra-linha'),track=criar('div',undefined,'barra-trilho'),fill=criar('div',undefined,'barra-preenchimento'+(r.quantidade<0?' barra-negativa':''));fill.style.width=Math.abs(r.quantidade)/max*100+'%';track.append(fill);row.append(criar('span',r.nome),track,criar('span',fmt(r.quantidade),'barra-valor'));destino.append(row);});}
function grafico(destino,linhas,chave,rotulo,mostrarTabela=true){
    if(!linhas.length)return;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 900 230');svg.setAttribute('role','img');svg.setAttribute('aria-label',rotulo+' por dia. Valores disponíveis na tabela abaixo.');
    const min=Math.min(0,...linhas.map(r=>r[chave])),max=Math.max(1,...linhas.map(r=>r[chave]));
    const x=i=>65+i*805/Math.max(1,linhas.length-1),y=v=>185-(v-min)/(max-min)*160;
    const el=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text)n.textContent=text;svg.append(n);return n;};
    const marcas=[...new Set(Array.from({length:5},(_,i)=>Math.round(min+(max-min)*i/4)))];
    for(const v of marcas){el('line',{x1:65,x2:870,y1:y(v),y2:y(v),stroke:'#294352'});el('text',{x:55,y:y(v)+4,fill:'#a3bdcb','text-anchor':'end','font-size':12},fmt(v));}
    el('path',{d:linhas.map((r,i)=>(i?'L':'M')+x(i)+' '+y(r[chave])).join(' '),fill:'none',stroke:'#67dbe9','stroke-width':3,'stroke-linejoin':'round'});
    linhas.forEach((r,i)=>{const dot=el('circle',{cx:x(i),cy:y(r[chave]),r:3,fill:'#8aeafa'});const title=document.createElementNS(ns,'title');title.textContent=br(r.dia)+': '+fmt(r[chave]);dot.append(title);if(i%Math.ceil(linhas.length/8)===0||i===linhas.length-1)el('text',{x:x(i),y:213,fill:'#a3bdcb','text-anchor':'middle','font-size':12},r.dia.slice(8)+'/'+r.dia.slice(5,7));});
    const wrap=criar('div',undefined,'grafico-rolagem');wrap.append(svg);destino.append(wrap);
    if(mostrarTabela){const details=criar('details');details.append(criar('summary','Ver valores diários'));tabela(details,['Dia',rotulo],linhas.map(r=>[br(r.dia),fmt(r[chave])]));destino.append(details);}
}
function painelTemporal(grid,f,resumo){
    const A=AnaliticaPainel,primeira=bases.vendas.map(v=>ModeloPainel.dataISO(v.Data_Ref)).sort()[0],corte=resumo.corte;
    const painel=bloco(grid,'Vendas líquidas · linha do tempo',true);
    const controles=criar('div',undefined,'calendario-controles');
    function dataInput(titulo,id,valor){const label=criar('label',titulo),input=criar('input');input.type='date';input.id=id;input.min=primeira;input.max=corte;input.value=valor;label.append(input);controles.append(label);return input;}
    const de=dataInput('De','tempo-inicio',intervaloTemporal?.inicio||[primeira,A.deslocar(resumo.fim,-14)].sort().at(-1));
    const ate=dataInput('Até','tempo-fim',intervaloTemporal?.fim||resumo.fim);
    const aplicar=criar('button','Aplicar período'),ultimos=criar('button','Últimos 15 dias');aplicar.type=ultimos.type='button';controles.append(aplicar,ultimos);painel.append(controles);

    const erro=criar('p');erro.setAttribute('role','status');painel.append(erro);const conteudo=criar('div');painel.append(conteudo);
    function desenhar(){try{
        const t=A.linhaTempo(bases,f,de.value,ate.value);intervaloTemporal={inicio:de.value,fim:ate.value};erro.textContent='';conteudo.replaceChildren();
        conteudo.append(criar('h3',br(t.inicio)+' a '+br(t.fim)));
        const metricas=criar('div',undefined,'resumo-du');for(const [nome,valor] of [['Vendas líquidas',fmt(t.liquidas)],['DU observados',fmtDU(t.du)],['Média por dia',fmt(t.mediaDia)],['Média por DU',fmt(t.mediaDU)]]){const e=criar('div');e.append(criar('small',nome),criar('strong',valor));metricas.append(e);}conteudo.append(metricas);
        // Rótulos completos distinguem a virada de mês dentro dos últimos 15 dias.
        grafico(conteudo,t.dias,'liquidas','Vendas líquidas',false);
        const detalhe=criar('details');detalhe.append(criar('summary','Detalhamento diário de DU'));const nomes=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        tabela(detalhe,['Data','Dia','Peso DU','Líquidas','Líquidas / DU'],t.dias.map(d=>[br(d.dia),nomes[new Date(d.dia+'T00:00:00Z').getUTCDay()],fmtDU(d.du),fmt(d.liquidas),fmt(d.du>0?d.liquidas/d.du:null)]));conteudo.append(detalhe);
        const comparacao=criar('div',undefined,'analise-grade');conteudo.append(comparacao);
        const semanas=bloco(comparacao,'Semana atual × anterior');
        tabela(semanas,['Período','Líquidas','DU','Média / DU'],[t.semanaAtual,t.semanaAnterior].map(s=>s?[br(s.inicio)+' — '+br(s.fim),fmt(s.liquidas),fmtDU(s.du),fmt(s.mediaDU)]:['Sem cobertura','—','—','—']));

        semanas.append(criar('h3','Projeção da próxima semana'));
        if(t.semanaAtual?.mediaDU!==null && t.semanaAtual){
            const inicio=A.deslocar(t.semanaAtual.inicio,7),fim=A.deslocar(inicio,6);
            const du=A.totalDU(inicio,fim,bases.calendario.excecoes);
            tabela(semanas,['Período','DU','Projetado'],[[br(inicio)+' — '+br(fim),fmtDU(du),fmtInteiro(t.semanaAtual.mediaDU*du)]]);
        }else semanas.append(criar('p','Sem histórico suficiente.','nota'));
        const dias=bloco(comparacao,'Média de venda');dias.classList.add('media-venda');tabela(dias,['Dia','Data','Líquidas','Média/DU','Variação'],[1,2,3,4,5,6,0].map(i=>{const d=t.ultimas[i];return [nomes[i],d.ultima?br(d.ultima.dia):'—',fmt(d.ultima?d.ultima.liquidas:null),fmt(d.mediaDU),variacaoDU(d)];}));
        const previsao=bloco(comparacao,'Projeção de sexta a domingo',true),label=criar('label','Quinta-feira de corte '),quinta=criar('input');quinta.type='date';quinta.min=primeira;quinta.max=corte;
        const semana=new Date(t.fim+'T00:00:00Z').getUTCDay();quinta.value=A.deslocar(t.fim,-((semana-4+7)%7));label.append(quinta);previsao.append(label);const saida=criar('div');previsao.append(saida);
        function projetar(){saida.replaceChildren();try{const p=A.projetarFimSemana(bases,f,quinta.value);saida.append(criar('p','Base: '+br(p.base.inicio)+' a '+br(p.base.fim)+' · '+fmtDU(p.base.du)+' DU · '+fmt(p.base.mediaDU)+' vendas líquidas / DU.','nota'));tabela(saida,['Data','Dia','DU','Estimativa'],p.dias.map(d=>[br(d.dia),nomes[new Date(d.dia+'T00:00:00Z').getUTCDay()],fmtDU(d.du),fmtInteiro(d.projecao)]));saida.append(criar('p','Total estimado: '+fmtInteiro(p.total)+' produtos · '+fmtDU(p.dias.reduce((s,d)=>s+d.du,0))+' DU.','nota'));}catch(e){saida.append(criar('p',e.message,'nota'));}}
        quinta.addEventListener('change',projetar);projetar();
    }catch(e){erro.textContent=e.message;}}
    aplicar.addEventListener('click',desenhar);ultimos.addEventListener('click',()=>{ate.value=resumo.fim;de.value=[primeira,A.deslocar(resumo.fim,-14)].sort().at(-1);desenhar();});desenhar();
}
function painelOperacional(grid,f,resumo,tipo){
    const A=AnaliticaPainel,M=ModeloPainel,rotulo={cancelamentos:'Cancelamentos',instalacoes:'Instalações',backlog:'Backlog'}[tipo];
    const primeira=bases.vendas.map(v=>M.dataISO(v.Data_Ref)).sort()[0];
    const painel=bloco(grid,rotulo+' · linha do tempo',true),controles=criar('div',undefined,'calendario-controles');
    const input=(nome,valor)=>{const l=criar('label',nome),e=criar('input');e.type='date';e.min=primeira;e.max=resumo.corte;e.value=valor;l.append(e);controles.append(l);return e;};
    const de=input('De',intervaloTemporal?.inicio||[primeira,A.deslocar(resumo.fim,-14)].sort().at(-1)),ate=input('Até',intervaloTemporal?.fim||resumo.fim);
    const aplicar=criar('button','Aplicar período'),reset=criar('button','Últimos 15 dias');controles.append(aplicar,reset);painel.append(controles);
    const erro=criar('p');erro.setAttribute('role','status');const area=criar('div');painel.append(erro,area);
    const nomes=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    function desenhar(){try{
        const t=A.operacaoTemporal(bases,f,de.value,ate.value,tipo);intervaloTemporal={inicio:de.value,fim:ate.value};erro.textContent='';area.replaceChildren();
        area.append(criar('h3',br(de.value)+' a '+br(ate.value)));
        const resumoDU=criar('div',undefined,'resumo-du');
        for(const [nome,valor] of (tipo==='backlog'?[['Saldo final',fmt(t.resumo.valor)]]:[[rotulo,fmt(t.resumo.valor)],['DU',fmtDU(t.resumo.du)],['Média/DU',fmt(t.resumo.mediaDU)]])){const e=criar('div');e.append(criar('small',nome),criar('strong',valor));resumoDU.append(e);}area.append(resumoDU);
        grafico(area,t.dias,'valor',rotulo,false);
        const detalhes=criar('details');detalhes.append(criar('summary',tipo==='backlog'?'Saldos diários':'Detalhamento diário de DU'));
        tabela(detalhes,tipo==='backlog'?['Data','Saldo']:['Data','DU',rotulo,'Média/DU'],t.dias.map(d=>tipo==='backlog'?[br(d.dia),fmt(d.valor)]:[br(d.dia),fmtDU(d.du),fmt(d.valor),fmt(d.du?d.valor/d.du:null)]));area.append(detalhes);
        const grade=criar('div',undefined,'analise-grade');area.append(grade);
        const semanas=bloco(grade,'Semana atual × anterior');if(tipo==='cancelamentos')semanas.classList.add('par-semanal');
        tabela(semanas,tipo==='backlog'?['Data de corte','Saldo']:['Período',rotulo,'DU','Média/DU'],[t.atual,t.anterior].map(v=>!v?(tipo==='backlog'?['Sem cobertura','—']:['Sem cobertura','—','—','—']):tipo==='backlog'?[br(v.fim),fmt(v.valor)]:[br(v.inicio)+' — '+br(v.fim),fmt(v.valor),fmtDU(v.du),fmt(v.mediaDU)]));
        semanas.append(criar('h3',tipo==='backlog'?'Saldo projetado · próxima semana':'Projeção da próxima semana'));
        tabela(semanas,['Período','DU','Projetado'],[[br(t.proxima.inicio)+' — '+br(t.proxima.fim),fmtDU(t.proxima.du),fmtInteiro(t.proxima.valor)]]);
        if(tipo!=='backlog'){
            const medias=bloco(grade,'Média de '+(tipo==='cancelamentos'?'cancelamento':'instalação'));medias.classList.add('media-venda');if(tipo==='cancelamentos')medias.classList.add('par-semanal');
            tabela(medias,['Dia','Data','Volume','Média/DU','Variação'],[1,2,3,4,5,6,0].map(i=>{const d=t.medias[i],v=variacaoDU({mediaDU:d.mediaDU,ultima:d.ultima?{...d.ultima,liquidas:d.ultima.valor}:null});if(tipo==='cancelamentos'){if(v.classList.contains('alta'))v.style.color='#ff8585';else if(v.classList.contains('queda'))v.style.color='#69e4a2';}return [nomes[i],d.ultima?br(d.ultima.dia):'—',fmt(d.ultima?.valor),fmt(d.mediaDU),v];}));
            const fimSemana=bloco(grade,'Projeção de sexta a domingo',true),l=criar('label','Quinta-feira de corte '),quinta=criar('input');quinta.type='date';quinta.min=primeira;quinta.max=resumo.corte;quinta.value=A.deslocar(ate.value,-((new Date(ate.value+'T00:00:00Z').getUTCDay()-4+7)%7));l.append(quinta);fimSemana.append(l);const resultado=criar('div');fimSemana.append(resultado);
            const projetar=()=>{resultado.replaceChildren();try{if(new Date(quinta.value+'T00:00:00Z').getUTCDay()!==4)throw Error('Escolha uma quinta-feira.');const base=A.operacaoTemporal(bases,f,[primeira,A.deslocar(quinta.value,-14)].sort().at(-1),quinta.value,tipo).resumo;tabela(resultado,['Data','DU','Projetado'],[1,2,3].map(n=>{const dia=A.deslocar(quinta.value,n),du=A.pesoDU(dia,bases.calendario.excecoes);return [br(dia),fmtDU(du),fmtInteiro(base.mediaDU===null?null:base.mediaDU*du)];}));}catch(e){resultado.append(criar('p',e.message));}};quinta.addEventListener('change',projetar);projetar();
        }else{
            const mov=bloco(grade,'Movimentação do período'),r=A.intervalo(bases,f,de.value,ate.value);
            tabela(mov,['Indicador','Produtos'],[['Entradas líquidas',fmt(r.liquidas)],['Instalações',fmt(r.instalacoes)],['Variação do saldo',fmt(r.liquidas-r.instalacoes)]]);
        }
    }catch(e){erro.textContent=e.message;}}
    aplicar.addEventListener('click',desenhar);reset.addEventListener('click',()=>{de.value=[primeira,A.deslocar(resumo.fim,-14)].sort().at(-1);ate.value=resumo.fim;desenhar();});desenhar();
}
function comparacaoOperacional(grid,f,a,tipo){
    const c=bloco(grid,'Comparação com o mês anterior');c.classList.add('comparacao-mensal');
    if(!a.passado){c.append(criar('p','Sem mês anterior disponível.'));return;}
    const valor=(de,ate)=>{const r=AnaliticaPainel.intervalo(bases,f,tipo==='backlog'?'0001-01-01':de,ate);return tipo==='backlog'?r.liquidas-r.instalacoes:r[tipo];};
    const inicio=f.mes+'-01',fim=a.parcial?f.mes+'-'+a.fimAnterior.slice(8):a.resumo.fim;
    barras(c,[{nome:br(a.anterior+'-01')+' — '+br(a.fimAnterior),quantidade:valor(a.anterior+'-01',a.fimAnterior)},{nome:br(inicio)+' — '+br(fim),quantidade:valor(inicio,fim)}]);
}

function renderizar(){
    const f=filtros(),a=AnaliticaPainel.analisar(bases,f),r=a.resumo; navegar(f);
    $('titulo').textContent=telas[tela];document.title=telas[tela]+' · RP';
    const abrangencia=['Diretoria','Empresa','Regiao'].filter(c=>f[c]).map(c=>nome(c,f[c])).join(' · ')||'Grande São Paulo';
    $('status').textContent=abrangencia+' · '+br(r.inicio)+' a '+br(r.fim)+(a.parcial?' · Período parcial':'')+' · Quantidades em produtos';
    $('resultados').replaceChildren();const cards=criar('div',undefined,'lista-indicadores'),grid=criar('div',undefined,'analise-grade');$('resultados').append(cards,grid);
    const card=(titulo,valor,nota)=>{const e=criar('article',undefined,'indicador');e.append(criar('h3',titulo),criar('p',valor,'valor-indicador'+(valor.length>18?' valor-textual':'')),criar('small',nota));cards.append(e);};
    if(tela==='vendas'){
        card('Vendas brutas',fmt(r.brutas),'Produtos vendidos');card('Vendas líquidas',fmt(r.liquidas),'Brutas − cancelamentos do período');card('Atingimento da meta',pct(r.atingimento),'Meta mensal: '+fmt(r.meta));card(a.parcial?'Projeção de fechamento':'Fechamento realizado',fmtInteiro(a.parcial?a.projecao:r.liquidas),a.parcial?'Estimativa ponderada por DU; não é garantia':'Vendas líquidas do mês encerrado');
        const comp=bloco(grid,'Comparação com o mês anterior');
        if(a.passado){
            comp.classList.add('comparacao-mensal');
            const fimAtual=a.parcial?f.mes+'-'+String(Math.min(r.dias,AnaliticaPainel.diasMes(a.anterior))).padStart(2,'0'):r.fim;
            barras(comp,[{nome:br(a.anterior+'-01')+' — '+br(a.fimAnterior),quantidade:a.passado.liquidas},{nome:br(r.inicio)+' — '+br(fimAtual),quantidade:a.atualComparado.liquidas}]);
            comp.append(criar('p','Variação: '+pct(a.variacao),'nota'));
        }else comp.append(criar('p','Sem mês anterior disponível.','nota'));
        mixRadial(bloco(grid,'Mix de vendas'),a.mix,'Vendas brutas');
        painelTemporal(grid,f,r);
        const coluna=criar('div',undefined,'analise-pilha');grid.append(coluna);
        barras(bloco(coluna,'Top 5 regiões · vendas líquidas'),[...a.regioes].sort((x,y)=>y.liquidas-x.liquidas).slice(0,5).map(v=>({nome:nome('Regiao',v.codigo),quantidade:v.liquidas})));
        const perfil=bloco(coluna,'Perfil dos pedidos');const pedidos=a.atual.vendas.filter(v=>ModeloPainel.quantidade(v)>0).length;
        tabela(perfil,['Indicador','Valor'],[['Pedidos com produtos',fmt(pedidos)],['Produtos por pedido',fmt(pedidos?r.brutas/pedidos:null)],['Vendas mantidas',pct(a.retencao)]]);

        const crescimento=bloco(grid,'Variação por região');tabela(crescimento,['Região','Anterior','Atual','Variação'],[...a.regioes].sort((x,y)=>(y.variacao??-Infinity)-(x.variacao??-Infinity)).map(v=>[nome('Regiao',v.codigo),fmt(v.anterior),fmt(v.comparado),pct(v.variacao)]));
        grid.append(coluna); // Pilha compacta à direita da variação regional.
    } else if(tela==='cancelamentos'){
        card('Cancelamentos',fmt(r.cancelamentos),'Ocorridos no período');card('Taxa das vendas do mês',pct(a.taxaSafra),'Canceladas até o corte / brutas do mês');card('Motivos registrados',fmt(a.motivos.length),'No período selecionado');card('Principal motivo',a.motivos[0]?.nome||'—',fmt(a.motivos[0]?.quantidade)+' produtos');
        comparacaoOperacional(grid,f,a,'cancelamentos');mixRadial(bloco(grid,'Mix de cancelamentos'),['Prod 1','Prod 2','Prod 3'].map((codigo,i)=>({nome:['Câmeras','Alarmes','Controle de Acesso'][i],quantidade:a.atual.cancelados.reduce((s,v)=>s+(Number(v[codigo])||0),0)})),'Cancelamentos');
        const porDia=a.diario.map(d=>({...d,cancelamentos:a.atual.cancelados.filter(c=>ModeloPainel.dataISO(c.Data_Cancelamento)===d.dia).reduce((s,c)=>s+ModeloPainel.quantidade(c),0)}));
        const agrupar=lista=>{const m=new Map();for(const v of lista){const motivo=v.Motivo_Cancelamento||'Não informado';m.set(motivo,(m.get(motivo)||0)+ModeloPainel.quantidade(v));}return m;};
        const antes=agrupar(a.passado?.cancelados||[]),agora=agrupar(a.atualComparado.cancelados);
        const motivos=[...new Set([...antes.keys(),...agora.keys()])].sort((x,y)=>(agora.get(y)||0)-(agora.get(x)||0)||x.localeCompare(y,'pt-BR'));
        const escala=Math.max(1,...antes.values(),...agora.values());
        const anterior=bloco(grid,'Motivos · mês anterior'),atual=bloco(grid,'Motivos · mês atual');anterior.classList.add('par-motivos');atual.classList.add('par-motivos');
        if(a.passado){anterior.append(criar('p',br(a.anterior+'-01')+' — '+br(a.fimAnterior),'nota'));barras(anterior,motivos.map(nome=>({nome,quantidade:antes.get(nome)||0})),escala);}else anterior.append(criar('p','Sem mês anterior disponível.'));
        atual.append(criar('p',br(r.inicio)+' — '+br(a.parcial?f.mes+'-'+a.fimAnterior.slice(8):r.fim),'nota'));barras(atual,motivos.map(nome=>({nome,quantidade:agora.get(nome)||0})),escala);
        painelOperacional(grid,f,r,'cancelamentos');
        barras(bloco(grid,'Cancelamentos em faixas de 7 dias',true),a.semanas.map(v=>({nome:br(v.inicio)+' — '+br(v.fim),quantidade:porDia.filter(d=>d.dia>=v.inicio&&d.dia<=v.fim).reduce((n,d)=>n+d.cancelamentos,0)})));
        const topCancelamentos=bloco(grid,'Top 5 regiões · volume cancelado');topCancelamentos.classList.add('par-cancelamentos');barras(topCancelamentos,[...a.regioes].sort((x,y)=>y.cancelamentos-x.cancelamentos).slice(0,5).map(v=>({nome:nome('Regiao',v.codigo),quantidade:v.cancelamentos})));
        const reducoes=bloco(grid,'Maiores reduções de cancelamento');reducoes.classList.add('par-cancelamentos');
        if(!a.passado)reducoes.append(criar('p','Sem mês anterior disponível.'));
        else {
            const fimAtual=a.parcial?f.mes+'-'+a.fimAnterior.slice(8):r.fim;
            const lista=a.regioes.map(v=>{const filtro={...f,Regiao:v.codigo},antes=AnaliticaPainel.intervalo(bases,filtro,a.anterior+'-01',a.fimAnterior).cancelamentos,agora=AnaliticaPainel.intervalo(bases,filtro,r.inicio,fimAtual).cancelamentos;return {nome:nome('Regiao',v.codigo),antes,agora,reducao:antes-agora};}).filter(v=>v.reducao>0).sort((a,b)=>b.reducao-a.reducao||a.nome.localeCompare(b.nome,'pt-BR')).slice(0,5);
            if(lista.length)tabela(reducoes,['Região','Anterior','Atual','Redução'],lista.map(v=>[v.nome,fmt(v.antes),fmt(v.agora),fmt(v.reducao)]));
            else reducoes.append(criar('p','Nenhuma região reduziu os cancelamentos neste recorte.'));
        }

        const taxas=bloco(grid,'Taxa por região · vendas do mês',true);tabela(taxas,['Região','Brutas','Taxa'],[...a.regioes].sort((x,y)=>(y.taxa??-1)-(x.taxa??-1)).map(v=>[nome('Regiao',v.codigo),fmt(v.brutas),pct(v.taxa)]));
    } else if(tela==='instalacoes'){
        card('Produtos instalados',fmt(r.instalacoes),'Concluídos no período');card('Ritmo diário',fmt(r.ritmo),'Produtos por dia corrido');card('Pedidos instalados',fmt(a.pedidosInstalados),'Cada pedido contado uma vez');card('Prazo de até 2 horas',pct(a.sla),'Pedidos com duração válida');
        comparacaoOperacional(grid,f,a,'instalacoes');
        mixRadial(bloco(grid,'Mix de instalações'),['Prod 1','Prod 2','Prod 3'].map((codigo,i)=>({nome:['Câmeras','Alarmes','Controle de Acesso'][i],quantidade:a.atual.instalados.reduce((s,v)=>s+(Number(v[codigo])||0),0)})));
        painelOperacional(grid,f,r,'instalacoes');
        barras(bloco(grid,'Instalações em faixas de 7 dias'),a.semanas.map(v=>({nome:br(v.inicio)+' — '+br(v.fim),quantidade:v.instalacoes})));
        const p=bloco(grid,'Capacidade e pendências');tabela(p,['Indicador','Valor'],[['Dias de estoque',fmt(r.diasBacklog)],['Backlog',fmt(r.backlog)]]);
    } else {
        card('Backlog',fmt(r.backlog),'Produtos pendentes até o corte');card('Dias de estoque',fmt(r.diasBacklog),'Pedido até instalação');card('Variação no período',fmt(r.saldo),'Positivo aumenta a fila');card('Espera dos pendentes',fmt(a.idadeMedia)+' dias','Pedidos ainda não instalados');
        comparacaoOperacional(grid,f,a,'backlog');
        const encerrados=new Set([...bases.cancelamentos.filter(v=>ModeloPainel.dataISO(v.Data_Cancelamento)<=r.fim),...bases.instalacoes.filter(v=>ModeloPainel.dataISO(v.Data_Encerramento)<=r.fim)].map(v=>v.ID_Pedido));
        const pendentes=bases.vendas.filter(v=>ModeloPainel.combina(v,f)&&ModeloPainel.dataISO(v.Data_Ref)<=r.fim&&!encerrados.has(v.ID_Pedido));
        mixRadial(bloco(grid,'Mix do backlog'),['Prod 1','Prod 2','Prod 3'].map((codigo,i)=>({nome:['Câmeras','Alarmes','Controle de Acesso'][i],quantidade:pendentes.reduce((s,v)=>s+(Number(v[codigo])||0),0)})),'Pendentes');
        painelOperacional(grid,f,r,'backlog');
        const idade=bloco(grid,'Idade das pendências');idade.classList.add('par-backlog');barras(idade,a.faixas);
        const c=bloco(grid,'Conciliação do saldo');c.classList.add('par-backlog');tabela(c,['Movimento','Produtos'],[['Saldo inicial',fmt(r.inicial)],['Vendas líquidas',fmt(r.liquidas)],['Instalações',fmt(r.instalacoes)],['Saldo final',fmt(r.backlog)]]);c.append(criar('p',a.reconciliado?'Saldo conferido com os pedidos pendentes.':'Divergência entre saldo e pedidos: revisar vínculos.','nota'));
    }
    if(tela==='instalacoes'||tela==='backlog'){
        const regioes=a.regioes.map(v=>({nome:nome('Regiao',v.codigo),quantidade:ModeloPainel.calcular(bases,{...f,Regiao:v.codigo})[tela]}));
        barras(bloco(grid,tela==='instalacoes'?'Top 5 regiões · instalações':'Top 5 regiões · pendências'),regioes.sort((a,b)=>b.quantidade-a.quantidade).slice(0,5));
        if(tela==='instalacoes')barras(bloco(grid,'5 regiões · menor volume instalado'),[...regioes].sort((a,b)=>a.quantidade-b.quantidade||a.nome.localeCompare(b.nome,'pt-BR')).slice(0,5));
        else {
            const prazos=a.regioes.map(v=>({nome:nome('Regiao',v.codigo),...AnaliticaPainel.prazoPedido(bases,{...f,Regiao:v.codigo},r.inicio,r.fim)})).filter(v=>v.dias!==null).sort((a,b)=>b.dias-a.dias);
            const quadro=bloco(grid,'Dias de estoque');
            tabela(quadro,['Região','Prazo médio (dias)'],prazos.map(v=>[v.nome,fmt(v.dias)]));
            if(!prazos.length)quadro.append(criar('p','Sem pedidos concluídos no período.'));

        }

    }
    const hist=bloco(grid,tela==='vendas'?'Histórico de vendas e metas':'Histórico mensal',true);
    const rotuloMes=h=>h.mes+(h.dias<AnaliticaPainel.diasMes(h.mes)?' · parcial':'');
    if(tela==='vendas'){
        const visual=criar('div',undefined,'historico-visual'),comparacao=criar('div'),pizza=criar('div',undefined,'meta-pizza');

        const max=Math.max(1,...a.historico.flatMap(h=>[h.liquidas,h.meta||0]));
        for(const h of a.historico){const row=criar('div',undefined,'historico-barras');row.append(criar('span',rotuloMes(h)));const dupla=criar('div');for(const [valor,classe,rotulo] of [[h.liquidas,'realizado','Líquidas'],[h.meta,'meta','Meta']]){const bar=criar('div',rotulo+': '+fmt(valor),classe);bar.style.width=Math.max(0,valor||0)/max*100+'%';dupla.append(bar);}row.append(dupla);comparacao.append(row);}
        const atingido=r.meta>0?Math.min(100,Math.max(0,r.atingimento)):0;
        const anel=criar('div',undefined,'anel-meta');anel.style.setProperty('--atingido',atingido+'%');anel.setAttribute('role','img');anel.setAttribute('aria-label','Atingimento da meta: '+pct(r.atingimento));anel.append(criar('strong',pct(r.atingimento)));pizza.append(criar('h3','Meta do mês selecionado'),anel,criar('p',r.meta===null?'Meta indisponível':r.liquidas>r.meta?'Acima da meta: '+fmt(r.liquidas-r.meta):'Faltam '+fmt(Math.max(0,r.meta-r.liquidas))+' produtos','nota'));
        visual.append(comparacao,pizza);hist.append(visual);
        tabela(hist,['Mês','Vendas brutas','Vendas líquidas','Meta','Atingimento'],a.historico.map(h=>[rotuloMes(h),fmt(h.brutas),fmt(h.liquidas),fmt(h.meta),pct(h.atingimento)]));
    }
    else {barras(hist,a.historico.map(h=>({nome:rotuloMes(h),quantidade:h[tela]})));if(tela==='backlog')tabela(hist,['Mês','Backlog','Dias de estoque'],a.historico.map(h=>[rotuloMes(h),fmt(h.backlog),fmt(h.diasBacklog)]));}
    const empresas=bloco(grid,'Empresas',true);
    if(tela==='vendas'){tabela(empresas,['Empresa','Vendas brutas','Vendas líquidas','Efetivação das vendas'],a.empresas.map(v=>[nome('Empresa',v.codigo),fmt(v.brutas),fmt(v.liquidas),pct(v.brutas>0?v.liquidas/v.brutas*100:null)]));}
    else if(tela==='cancelamentos')tabela(empresas,['Empresa','Cancelamentos','Taxa das vendas do mês'],a.empresas.map(v=>[nome('Empresa',v.codigo),fmt(v.cancelamentos),pct(v.taxa)]));else tabela(empresas,['Empresa',tela==='instalacoes'?'Instalações':'Backlog','Dias de estoque'],a.empresas.map(v=>{const m=ModeloPainel.calcular(bases,{...f,Empresa:v.codigo});return [nome('Empresa',v.codigo),fmt(m[tela]),fmt(m.diasBacklog)];}));
}
async function json(url){const r=await fetch(url);if(!r.ok)throw Error('Não foi possível carregar os dados.');return r.json();}
async function carregar(){try{
    $('tentar').hidden=true;if(location.protocol==='file:')throw Error('Abra pelo site publicado ou Live Server.');
    if(['localhost','127.0.0.1'].includes(location.hostname)){try{bases=await json('./api/dados');}catch{}}
    if(!bases){const nomes=['vendas','cancelamentos','instalacoes','metas','backlog'];bases=Object.fromEntries(await Promise.all(nomes.map(async n=>[n,await json('./dados/'+n+'.json')])));}
    dimensoes=await json('./dados/dimensoes.json');bases.calendario=await json('./dados/calendario.json');
    const meses=[...new Set(bases.vendas.map(r=>ModeloPainel.dataISO(r.Data_Ref).slice(0,7)))].sort();opcoes('mes',meses);$('mes').value=meses.includes(consulta.get('mes'))?consulta.get('mes'):meses.at(-1);
    opcoes('Diretoria',ModeloPainel.opcoes(bases,{},'Diretoria'),true);
    for(const campo of campos.slice(1)){if([...$(campo).options].some(o=>o.value===consulta.get(campo)))$(campo).value=consulta.get(campo);atualizar();}
    campos.forEach(c=>$(c).disabled=false);$('limpar').disabled=false;renderizar();
}catch(e){$('status').textContent=e.message;$('tentar').hidden=false;}}
campos.forEach(c=>$(c).addEventListener('change',()=>{if(c==='mes')intervaloTemporal=null;atualizar(c);renderizar();}));
$('limpar').addEventListener('click',()=>{campos.slice(1).forEach(c=>$(c).value='');atualizar();renderizar();});$('tentar').addEventListener('click',carregar);carregar();
