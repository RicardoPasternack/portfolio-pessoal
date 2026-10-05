/* Regras de negocio compartilhadas pelo navegador e pela API. Sem acesso ao DOM. */
(function (global) {
    'use strict';
    function dataISO(valor) {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/.exec(valor || '');
        if (!m) throw Error('Data invalida: ' + valor);
        const [,d,mes,a,h='00',min='00'] = m;
        const date = new Date(Date.UTC(+a,+mes-1,+d));
        if (date.getUTCFullYear()!==+a || date.getUTCMonth()!==+mes-1 || date.getUTCDate()!==+d || +h>23 || +min>59) throw Error('Data inexistente: '+valor);
        return `${a}-${mes}-${d}`;
    }
    const quantidade = r => ['Prod 1','Prod 2','Prod 3'].reduce((s,k)=>s+r[k],0);
    const combina = (r,f) => ['Diretoria','Empresa','Regiao'].every(k=>!f[k] || r[k]===f[k]);
    function periodo(bases,mes) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw Error('Mes invalido.');
        const cortes = bases.backlog.map(r=>dataISO(r.Data_Corte));
        const corte = cortes.sort().at(-1);
        const [a,m] = mes.split('-').map(Number);
        const fimMes = new Date(Date.UTC(a,m,0)).toISOString().slice(0,10);
        return {inicio:mes+'-01',fim:corte && corte<fimMes?corte:fimMes,corte};
    }
    function calcular(bases,filtros) {
        const p = periodo(bases,filtros.mes);
        const incluir = r => combina(r,filtros);
        const acum = (nome,campo,limite,inclusivo) => bases[nome].filter(incluir).reduce((s,r)=> {
            const d=dataISO(r[campo]); return s+((inclusivo?d<=limite:d<limite)?quantidade(r):0);
        },0);
        const movimento = (nome,campo) => bases[nome].filter(incluir).filter(r=>{const d=dataISO(r[campo]);return d>=p.inicio&&d<=p.fim;}).reduce((s,r)=>s+quantidade(r),0);
        const brutas=movimento('vendas','Data_Ref');
        const cancelamentos=movimento('cancelamentos','Data_Cancelamento');
        const instalacoes=movimento('instalacoes','Data_Encerramento');
        const liquidas=brutas-cancelamentos;
        const inicial=acum('vendas','Data_Ref',p.inicio,false)-acum('cancelamentos','Data_Cancelamento',p.inicio,false)-acum('instalacoes','Data_Encerramento',p.inicio,false);
        const backlog=inicial+liquidas-instalacoes;
        const mesBR=filtros.mes.slice(5)+'/'+filtros.mes.slice(0,4);
        const metas=bases.metas.filter(incluir).filter(r=>r.Mes_Referencia===mesBR);
        const meta=metas.length?metas.reduce((s,r)=>s+r.Meta_Quantidade,0):null;
        const dias=Math.max(0,Math.round((Date.parse(p.fim)-Date.parse(p.inicio))/86400000)+1);
        const ritmo=dias?instalacoes/dias:0;
        return {...p,brutas,cancelamentos,instalacoes,liquidas,inicial,backlog,meta,
            atingimento:meta>0?liquidas/meta*100:null,saldo:liquidas-instalacoes,
            diasBacklog:backlog===0?0:ritmo>0?backlog/ritmo:null,dias,ritmo};
    }
    function serie(bases,filtros) {
        const p=periodo(bases,filtros.mes), dias=new Map();
        for(let t=Date.parse(p.inicio);t<=Date.parse(p.fim);t+=86400000) {const dia=new Date(t).toISOString().slice(0,10);dias.set(dia,{dia,liquidas:0,instalacoes:0});}
        for(const [nome,campo,saida,sinal] of [['vendas','Data_Ref','liquidas',1],['cancelamentos','Data_Cancelamento','liquidas',-1],['instalacoes','Data_Encerramento','instalacoes',1]]) {
            for(const r of bases[nome]) if(combina(r,filtros)) {const dia=dataISO(r[campo]); if(dias.has(dia)) dias.get(dia)[saida]+=sinal*quantidade(r);}
        }
        return [...dias.values()];
    }
    function opcoes(bases,filtros,campo) {
        return [...new Set(bases.vendas.filter(r=>combina(r,filtros)).map(r=>r[campo]))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    }
    const api={dataISO,quantidade,combina,periodo,calcular,serie,opcoes};
    if(typeof module!=='undefined'&&module.exports) module.exports=api; else global.ModeloPainel=api;
})(typeof globalThis!=='undefined'?globalThis:this);