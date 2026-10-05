/* Leva o mesmo recorte da visão geral às telas de análise. */
document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-analise]');if(!link)return;
    const query=new URLSearchParams({tela:link.dataset.analise});
    for(const campo of ['mes','Diretoria','Empresa','Regiao']){const valor=document.getElementById(campo)?.value;if(valor)query.set(campo,valor);}
    link.href='analise.html?'+query;
});

// Calendário compartilhado: mantém o campo de data acessível e oferece a seleção visual.
(()=>{
    let aberto;
    function fechar(){if(aberto){aberto.painel.remove();aberto.botao.setAttribute('aria-expanded','false');aberto=null;}}
    function preparar(){document.querySelectorAll('input[type="date"]').forEach(input=>{
        if(input.dataset.calendario)return;input.dataset.calendario='sim';
        const grupo=document.createElement('span');grupo.className='data-seletor';input.before(grupo);grupo.append(input);
        const botao=document.createElement('button');botao.type='button';botao.textContent='▦';botao.setAttribute('aria-label','Abrir calendário: '+(input.parentElement.parentElement.textContent.trim()||'Data'));botao.setAttribute('aria-expanded','false');grupo.append(botao);
        botao.addEventListener('click',()=>{
            if(aberto?.botao===botao){fechar();return;}fechar();
            const painel=document.createElement('div');painel.className='calendario-popup';painel.setAttribute('role','dialog');painel.setAttribute('aria-label','Selecionar data');grupo.append(painel);aberto={painel,botao};botao.setAttribute('aria-expanded','true');
            let mes=new Date((input.value||input.max||new Date().toISOString().slice(0,10)).slice(0,7)+'-01T12:00:00Z');
            function desenhar(){
                painel.replaceChildren();const topo=document.createElement('div');topo.className='calendario-topo';
                for(const [texto,passo] of [['‹',-1],['›',1]]){const b=document.createElement('button');b.type='button';b.textContent=texto;b.setAttribute('aria-label',passo<0?'Mês anterior':'Próximo mês');b.onclick=()=>{mes.setUTCMonth(mes.getUTCMonth()+passo);desenhar();};topo.append(b);}
                const titulo=document.createElement('strong');titulo.textContent=mes.toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});topo.insertBefore(titulo,topo.lastChild);painel.append(topo);
                const grade=document.createElement('div');grade.className='calendario-dias';painel.append(grade);
                for(const nome of ['D','S','T','Q','Q','S','S']){const e=document.createElement('span');e.textContent=nome;grade.append(e);}
                for(let n=0;n<mes.getUTCDay();n++)grade.append(document.createElement('span'));
                const quantidade=new Date(Date.UTC(mes.getUTCFullYear(),mes.getUTCMonth()+1,0)).getUTCDate();
                for(let n=1;n<=quantidade;n++){const valor=mes.toISOString().slice(0,7)+'-'+String(n).padStart(2,'0'),b=document.createElement('button');b.type='button';b.textContent=n;b.disabled=Boolean((input.min&&valor<input.min)||(input.max&&valor>input.max));b.setAttribute('aria-label',valor.split('-').reverse().join('/'));b.setAttribute('aria-pressed',String(valor===input.value));b.onclick=()=>{input.value=valor;input.dispatchEvent(new Event('change',{bubbles:true}));fechar();input.focus();};grade.append(b);}
            }desenhar();painel.querySelector('button').focus();
        });
    });}
    document.addEventListener('click',e=>{if(aberto&&!e.target.closest('.data-seletor'))fechar();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&aberto){const b=aberto.botao;fechar();b.focus();}});
    new MutationObserver(preparar).observe(document.body,{childList:true,subtree:true});preparar();
})();
