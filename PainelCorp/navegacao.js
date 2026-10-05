/* Leva o mesmo recorte da visão geral às telas de análise. */
document.addEventListener('click',event=>{
    const link=event.target.closest('a[data-analise]');if(!link)return;
    const query=new URLSearchParams({tela:link.dataset.analise});
    for(const campo of ['mes','Diretoria','Empresa','Regiao']){const valor=document.getElementById(campo)?.value;if(valor)query.set(campo,valor);}
    link.href='analise.html?'+query;
});
