// Câmera e números decorativos: não representam indicadores nem dados reais.
(() => {
    const cena=document.querySelector('.cinema-cena');
    const camada=document.getElementById('numeros-cenario');
    if(!cena||!camada)return;
    const reduzido=window.matchMedia('(prefers-reduced-motion: reduce)');
    const numeros=Array.from({length:24},(_,i)=>{
        const item=document.createElement('span');item.className='numero-cenario';
        item.style.left=((i*37+7)%96)+'%';item.style.top=((i*23+9)%94)+'%';
        item.style.fontSize=(12+(i%4)*5)+'px';camada.append(item);return item;
    });
    const tunel=document.createElement('div');tunel.className='tunel-optico';
    camada.append(tunel);
    const nucleo=document.createElement('img');nucleo.className='nucleo-seguranca';
    nucleo.src='imagens/nucleo-seguranca.png';nucleo.alt='';tunel.append(nucleo);
    const aneis=Array.from({length:12},()=>{const anel=document.createElement('i');tunel.append(anel);return anel;});
    let pendente=false;
    function atualizar(){
        const altura=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
        const p=reduzido.matches?0:Math.max(0,Math.min(1,window.scrollY/altura));
        const limitar=v=>Math.max(0,Math.min(1,v));
        const entrada=limitar((p-.1)/.65);
        const largura=window.innerWidth||1200;
        const alturaTela=window.innerHeight;
        // Centro da lente no ativo original. Compensa o recorte causado por object-fit:cover.
        const proporcao=Math.max(largura/1672,alturaTela/941);
        const posicao=largura<=600?.6:.5;
        const lenteX=1672*.67*proporcao+(largura-1672*proporcao)*posicao;
        const lenteY=941*.49*proporcao+(alturaTela-941*proporcao)*.5;
        cena.style.transformOrigin=`${lenteX}px ${lenteY}px`;
        cena.style.transform=`translate(${(largura/2-lenteX)*entrada}px,${(alturaTela/2-lenteY)*entrada}px) scale(${1.03+entrada*entrada*7})`;
        const interior=reduzido.matches?0:limitar((p-.57)/.18);
        cena.style.opacity=String(1-interior);
        tunel.style.opacity=String(interior);
        // A mesma posição de rolagem produz o mesmo estado nos dois sentidos.
        const revelacao=limitar((p-.65)/.3);
        nucleo.style.clipPath=`circle(${revelacao*80}vmax at 50% 50%)`;
        nucleo.style.transform=`scale(${1.5-revelacao*.5})`;
        nucleo.style.opacity=String(revelacao);
        aneis.forEach((anel,i)=>{
            const fase=(i/aneis.length+p*1.4)%1;
            const escala=.08+fase*fase*4;
            anel.style.transform=`translate(-50%,-50%) scale(${escala}) rotate(${i*11+p*35}deg)`;
            anel.style.opacity=String(Math.sin(fase*Math.PI)*.5*(1-revelacao));
        });
        numeros.forEach((item,i)=>{
            const passo=Math.floor(p*180);
            const codigo=((i+1)*7919+passo*137)%1000000;
            item.textContent=String(codigo).padStart(6,'0').replace(/(\d{3})(\d{3})/,'$1.$2');
            const profundidade=1+(i%4)*.3;
            item.style.transform=`translate(${(i%2?1:-1)*p*95*profundidade}px,${-p*110*profundidade}px) scale(${1+p*.2*profundidade})`;
        });
        pendente=false;
    }
    function agendar(){if(!pendente){pendente=true;window.requestAnimationFrame(atualizar);}}
    window.addEventListener('scroll',agendar,{passive:true});window.addEventListener('resize',agendar);
    reduzido.addEventListener('change',agendar);
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(agendar).observe(document.body);
    atualizar();
})();


