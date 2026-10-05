/* Indicadores históricos: funções puras, compartilháveis com uma futura API. */
(function (global) {
    'use strict';
    const M = typeof module !== 'undefined' && module.exports ? require('./modelo') : global.ModeloPainel;
    const produtos = ['Prod 1', 'Prod 2', 'Prod 3'];
    const soma = linhas => linhas.reduce((s, r) => s + M.quantidade(r), 0);
    const taxa = (n, d) => d > 0 ? n / d * 100 : null;
    const mesAnterior = (mes, n = 1) => {
        const [a, m] = mes.split('-').map(Number);
        return new Date(Date.UTC(a, m - 1 - n, 1)).toISOString().slice(0, 7);
    };
    const diasMes = mes => new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5), 0)).getUTCDate();
    const deslocar = (dia, n) => new Date(Date.parse(dia) + n * 86400000).toISOString().slice(0, 10);
    function pesoDU(dia,excecoes=[]) { const excecao=excecoes.find(e=>e.data===dia);if(excecao){if(!Number.isFinite(excecao.du)||excecao.du<0||excecao.du>1)throw Error('DU excepcional deve estar entre zero e um.');return excecao.du;}const semana = new Date(dia + 'T00:00:00Z').getUTCDay(); return semana === 0 ? 0.25 : semana === 6 ? 0.75 : 1; }
    function calendario(inicio, fim,excecoes=[]) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim) || !Number.isFinite(Date.parse(inicio)) || !Number.isFinite(Date.parse(fim)) || inicio > fim) throw Error('Informe um intervalo de datas válido.');
        if ((Date.parse(fim)-Date.parse(inicio))/86400000 > 3660) throw Error('Intervalo muito longo.');
        const dias=[];for(let dia=inicio;dia<=fim;dia=deslocar(dia,1))dias.push({dia,du:pesoDU(dia,excecoes)});return dias;
    }
    const totalDU = (inicio, fim,excecoes=[]) => calendario(inicio, fim,excecoes).reduce((s,d)=>s+d.du,0);
    function ultimasOcorrencias(b,f,fim){
        const primeira=b.vendas.map(r=>M.dataISO(r.Data_Ref)).sort()[0],excecoes=b.calendario?.excecoes||[];
        return Array.from({length:7},(_,indice)=>{
            const selecionadas=[],ignoradas=[];let dia=deslocar(fim,-((new Date(fim+'T00:00:00Z').getUTCDay()-indice+7)%7));
            while(dia>=primeira&&selecionadas.length<3){
                const e=excecoes.find(e=>e.data===dia),du=pesoDU(dia,excecoes);
                if(e&&(e.excluirComparacao!==false||du!==pesoDU(dia)))ignoradas.push({dia,motivo:e.motivo||'DU excepcional'});
                else {const r=intervalo(b,f,dia,dia);selecionadas.push({dia,du,liquidas:r.liquidas});}
                dia=deslocar(dia,-7);
            }
            const du=selecionadas.reduce((s,d)=>s+d.du,0),total=selecionadas.reduce((s,d)=>s+d.liquidas,0);
            return {indice,selecionadas,ignoradas,ultima:selecionadas[0]||null,mediaDU:du>0?total/du:null};
        });
    }
    function linhaTempo(b,f,inicio,fim) {
        const primeira=b.vendas.map(r=>M.dataISO(r.Data_Ref)).sort()[0];
        const corte=M.periodo(b,f.mes).corte;
        if(inicio<primeira||fim>corte)throw Error('Escolha datas dentro da cobertura da base.');
        const dias=calendario(inicio,fim,b.calendario?.excecoes).map(d=>({...d,brutas:0,cancelamentos:0,liquidas:0}));
        const mapa=new Map(dias.map(d=>[d.dia,d]));
        for(const [base,campo,valor] of [['vendas','Data_Ref','brutas'],['cancelamentos','Data_Cancelamento','cancelamentos']])for(const r of b[base]){const dia=M.dataISO(r[campo]);if(M.combina(r,f)&&mapa.has(dia))mapa.get(dia)[valor]+=M.quantidade(r);}
        dias.forEach(d=>d.liquidas=d.brutas-d.cancelamentos);
        const liquidas=dias.reduce((s,d)=>s+d.liquidas,0),du=dias.reduce((s,d)=>s+d.du,0);
        const porSemana=Array.from({length:7},(_,indice)=>{const lista=dias.filter(d=>new Date(d.dia+'T00:00:00Z').getUTCDay()===indice);const total=lista.reduce((s,d)=>s+d.liquidas,0),peso=lista.reduce((s,d)=>s+d.du,0);return {indice,dias:lista.length,liquidas:total,mediaDia:lista.length?total/lista.length:null,mediaDU:peso?total/peso:null};});
        const diaSemana=new Date(fim+'T00:00:00Z').getUTCDay();const segunda=deslocar(fim,-((diaSemana+6)%7));
        const semana=(de,ate)=>{if(de<primeira)return null;const r=intervalo(b,f,de,ate),peso=totalDU(de,ate,b.calendario?.excecoes);return {inicio:de,fim:ate,liquidas:r.liquidas,du:peso,mediaDU:peso>0?r.liquidas/peso:null};};
        return {inicio,fim,dias,du,liquidas,mediaDia:liquidas/dias.length,mediaDU:du>0?liquidas/du:null,porSemana,ultimas:ultimasOcorrencias(b,f,fim),semanaAtual:semana(segunda,fim),semanaAnterior:semana(deslocar(segunda,-7),deslocar(fim,-7))};
    }
    function projetarFimSemana(b,f,quinta) {
        if(new Date(quinta+'T00:00:00Z').getUTCDay()!==4)throw Error('Escolha uma quinta-feira para o corte da projeção.');
        const primeira=b.vendas.map(r=>M.dataISO(r.Data_Ref)).sort()[0];
        const inicio=[primeira,deslocar(quinta,-14)].sort().at(-1);
        const base=linhaTempo(b,f,inicio,quinta);
        const dias=[1,2,3].map(n=>{const dia=deslocar(quinta,n),du=pesoDU(dia,b.calendario?.excecoes);return {dia,du,projecao:base.mediaDU===null?null:base.mediaDU*du};});
        return {base,dias,total:base.mediaDU===null?null:dias.reduce((s,d)=>s+d.projecao,0)};
    }
    function intervalo(b, f, inicio, fim) {
        const selecionar = (nome, campo) => b[nome].filter(r => M.combina(r, f) && M.dataISO(r[campo]) >= inicio && M.dataISO(r[campo]) <= fim);
        const vendas = selecionar('vendas', 'Data_Ref');
        const cancelados = selecionar('cancelamentos', 'Data_Cancelamento');
        const instalados = selecionar('instalacoes', 'Data_Encerramento');
        return { vendas, cancelados, instalados, brutas: soma(vendas), cancelamentos: soma(cancelados), instalacoes: soma(instalados), liquidas: soma(vendas) - soma(cancelados) };
    }
    function analisar(b, f) {
        const resumo = M.calcular(b, f), { inicio, fim } = resumo;
        const atual = intervalo(b, f, inicio, fim);
        const parcial = resumo.dias < diasMes(f.mes);
        const anterior = mesAnterior(f.mes);
        const meses = [...new Set(b.vendas.map(r => M.dataISO(r.Data_Ref).slice(0, 7)))].sort();
        const diasComparados = Math.min(resumo.dias, diasMes(anterior));
        const fimAnterior = anterior + '-' + String(parcial ? diasComparados : diasMes(anterior)).padStart(2, '0');
        const comparavel = meses.includes(anterior);
        const passado = comparavel ? intervalo(b, f, anterior + '-01', fimAnterior) : null;
        // Em meses parciais com mais dias que o anterior, ambos usam o mesmo número de dias.
        const atualComparado = intervalo(b, f, inicio, parcial ? f.mes + '-' + String(diasComparados).padStart(2, '0') : fim);
        const ids = new Set(atual.vendas.map(r => r.ID_Pedido));
        const canceladosDaSafra = b.cancelamentos.filter(r => ids.has(r.ID_Pedido) && M.dataISO(r.Data_Cancelamento) <= fim);
        const taxaSafra = taxa(soma(canceladosDaSafra), atual.brutas);
        const motivos = new Map();
        atual.cancelados.forEach(r => {
            const motivo = r.Motivo_Cancelamento || 'Não informado';
            motivos.set(motivo, (motivos.get(motivo) || 0) + M.quantidade(r));
        });
        const encerrados = new Set([
            ...b.cancelamentos.filter(r => M.dataISO(r.Data_Cancelamento) <= fim),
            ...b.instalacoes.filter(r => M.dataISO(r.Data_Encerramento) <= fim)
        ].map(r => r.ID_Pedido));
        const pendentes = b.vendas.filter(r => M.combina(r, f) && M.dataISO(r.Data_Ref) <= fim && !encerrados.has(r.ID_Pedido));
        const faixas = [{ nome: 'Até 7 dias', quantidade: 0 }, { nome: '8 a 15 dias', quantidade: 0 }, { nome: '16 a 30 dias', quantidade: 0 }, { nome: 'Mais de 30 dias', quantidade: 0 }];
        let idadePonderada = 0;
        pendentes.forEach(r => {
            const idade = (Date.parse(fim) - Date.parse(M.dataISO(r.Data_Ref))) / 86400000, q = M.quantidade(r);
            faixas[idade <= 7 ? 0 : idade <= 15 ? 1 : idade <= 30 ? 2 : 3].quantidade += q;
            idadePonderada += idade * q;
        });
        const duracao = r => {
            if (!r.Data_Agendada || !r.Data_Encerramento) return null;
            const timestamp = v => Date.parse(M.dataISO(v) + 'T' + (v.split(' ')[1] || '00:00') + ':00Z');
            try { const minutos = (timestamp(r.Data_Encerramento) - timestamp(r.Data_Agendada)) / 60000; return Number.isFinite(minutos) && minutos >= 0 ? minutos : null; } catch { return null; }
        };
        const duracoes = atual.instalados.map(duracao), validas = duracoes.filter(v => v !== null);
        const diario = M.serie(b, f);
        let saldo = resumo.inicial;
        const semanas = [];
        diario.forEach((r, i) => {
            saldo += r.liquidas - r.instalacoes;
            r.backlog = saldo;
            if (i % 7 === 0) semanas.push({ nome: '', inicio: r.dia, fim: r.dia, dias: 0, liquidas: 0, instalacoes: 0 });
            const s = semanas.at(-1); s.fim = r.dia; s.dias++; s.liquidas += r.liquidas; s.instalacoes += r.instalacoes;
            s.nome = s.inicio.slice(8) + '–' + s.fim.slice(8);
        });
        const historico = meses.filter(m => m <= f.mes).map(m => ({ mes: m, ...M.calcular(b, { ...f, mes: m }) }));
        const janelas = [2, 3].map(n => {
            const lista = Array.from({ length: n }, (_, i) => mesAnterior(f.mes, i)).reverse();
            const disponivel = lista.every(m => meses.includes(m));
            const dados = disponivel ? intervalo(b, f, lista[0] + '-01', fim) : null;
            return { meses: n, inicio: lista[0], fim: f.mes, parcial, liquidas: dados?.liquidas ?? null };
        });
        const ranking = campo => M.opcoes(b, f, campo).map(codigo => {
            const filtro = { ...f, [campo]: codigo }, r = intervalo(b, filtro, inicio, fim);
            const pedidos = new Set(r.vendas.map(v => v.ID_Pedido));
            const perdas = soma(b.cancelamentos.filter(c => pedidos.has(c.ID_Pedido) && M.dataISO(c.Data_Cancelamento) <= fim));
            const previa = comparavel ? intervalo(b, filtro, anterior + '-01', fimAnterior).liquidas : null;
            const corrente = intervalo(b, filtro, inicio, parcial ? f.mes + '-' + String(diasComparados).padStart(2, '0') : fim).liquidas;
            return { codigo, brutas: r.brutas, liquidas: r.liquidas, cancelamentos: r.cancelamentos, taxa: taxa(perdas, r.brutas), anterior: previa, comparado: corrente, variacao: previa > 0 ? (corrente / previa - 1) * 100 : null };
        });
        return {
            resumo, atual, parcial, anterior, fimAnterior, passado, atualComparado,
            variacao: passado?.liquidas > 0 ? (atualComparado.liquidas / passado.liquidas - 1) * 100 : null,
            taxaSafra, retencao: taxaSafra === null ? null : 100 - taxaSafra,
            duObservados: totalDU(inicio,fim,b.calendario?.excecoes),
            duMes: totalDU(inicio,f.mes+'-'+diasMes(f.mes),b.calendario?.excecoes),
            projecao: parcial && totalDU(inicio,fim,b.calendario?.excecoes)>0 ? resumo.liquidas / totalDU(inicio,fim,b.calendario?.excecoes) * totalDU(inicio,f.mes+'-'+diasMes(f.mes),b.calendario?.excecoes) : null,
            faltaMeta: resumo.meta === null ? null : Math.max(0, resumo.meta - resumo.liquidas),
            mix: produtos.map((codigo, i) => ({ codigo, nome: ['Câmeras', 'Alarmes', 'Controle de Acesso'][i], quantidade: atual.vendas.reduce((s, r) => s + r[codigo], 0) })),
            motivos: [...motivos].map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade),
            faixas, idadeMedia: resumo.backlog > 0 ? idadePonderada / resumo.backlog : null,
            pendentes: soma(pendentes), reconciliado: soma(pendentes) === resumo.backlog,
            sla: taxa(validas.filter(v => v <= 120).length, validas.length),
            semPrazo: duracoes.length - validas.length, pedidosInstalados: duracoes.length,
            diario, semanas, historico, janelas, regioes: ranking('Regiao'), empresas: ranking('Empresa')
        };
    }
    // Fluxos são somados; backlog é o saldo no fim de cada data.
    function operacaoTemporal(b,f,inicio,fim,tipo){
        if(!['cancelamentos','instalacoes','backlog'].includes(tipo))throw Error('Indicador inválido.');
        const primeira=b.vendas.map(r=>M.dataISO(r.Data_Ref)).sort()[0],corte=M.periodo(b,f.mes).corte;
        if(inicio<primeira||fim>corte)throw Error('Escolha datas dentro da cobertura da base.');
        const excecoes=b.calendario?.excecoes||[];
        const acumulado=dia=>{const r=intervalo(b,f,primeira,dia);return r.liquidas-r.instalacoes;};
        const dias=calendario(inicio,fim,excecoes).map(d=>({...d,valor:tipo==='backlog'?acumulado(d.dia):intervalo(b,f,d.dia,d.dia)[tipo]}));
        const resumir=(de,ate)=>{if(de<primeira)return null;const r=intervalo(b,f,de,ate),du=totalDU(de,ate,excecoes);return {inicio:de,fim:ate,du,valor:tipo==='backlog'?acumulado(ate):r[tipo],mediaDU:du?r[tipo]/du:null};};
        const segunda=deslocar(fim,-((new Date(fim+'T00:00:00Z').getUTCDay()+6)%7));
        const atual=resumir(segunda,fim),anterior=resumir(deslocar(segunda,-7),deslocar(fim,-7));
        const proxInicio=deslocar(segunda,7),proxFim=deslocar(proxInicio,6),duProximo=totalDU(proxInicio,proxFim,excecoes);
        let projetado=null;
        if(atual&&atual.du){
            if(tipo==='backlog'){
                const r=intervalo(b,f,segunda,fim),duRestante=totalDU(deslocar(fim,1),proxFim,excecoes);
                projetado=Math.max(0,atual.valor+(r.liquidas-r.instalacoes)/atual.du*duRestante);
            }else projetado=atual.mediaDU*duProximo;
        }
        const medias=tipo==='backlog'?[]:Array.from({length:7},(_,indice)=>{
            const lista=[];let dia=deslocar(fim,-((new Date(fim+'T00:00:00Z').getUTCDay()-indice+7)%7));
            while(dia>=primeira&&lista.length<3){if(!excecoes.some(e=>e.data===dia))lista.push({dia,du:pesoDU(dia),valor:intervalo(b,f,dia,dia)[tipo]});dia=deslocar(dia,-7);}
            const du=lista.reduce((s,d)=>s+d.du,0);return {indice,ultima:lista[0]||null,mediaDU:du?lista.reduce((s,d)=>s+d.valor,0)/du:null};
        });
        return {dias,atual,anterior,medias,proxima:{inicio:proxInicio,fim:proxFim,du:duProximo,valor:projetado},resumo:resumir(inicio,fim)};
    }
    const prazoPedido = M.prazoPedido;
    const api = { analisar, intervalo, mesAnterior, diasMes, pesoDU, totalDU, deslocar, linhaTempo, projetarFimSemana, ultimasOcorrencias, operacaoTemporal, prazoPedido };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.AnaliticaPainel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
