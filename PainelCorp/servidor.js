// Servidor local: escuta apenas neste computador, sem dependencias externas.
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');const modelo=require('./modelo');
const raiz=__dirname;
if(!fs.existsSync(path.join(raiz,'banco/painel.sqlite')))require('./scripts/carregar-banco').carregarBanco();
const db=new DatabaseSync(path.join(raiz,'banco/painel.sqlite'),{readOnly:true});
function bases(){return Object.fromEntries(db.prepare('SELECT nome,conteudo FROM bases_json').all().map(r=>[r.nome,JSON.parse(r.conteudo)]));}
const mime={'.png':'image/png','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const publicos=new Set(['Index.html','style.css','script.js','modelo.js','cenario.js','imagens/fundo-cinematografico.png','imagens/camera-camadas.png','imagens/cena-residencia.png','imagens/cena-central.png','imagens/cena-camera.png','imagens/camera-digital-azul.png','imagens/nucleo-seguranca.png']);
const server=http.createServer((req,res)=>{
    const enviar=(status,valor)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(valor));};
    try {
        const url=new URL(req.url,'http://localhost');
        if(req.method!=='GET')return enviar(405,{erro:'Metodo nao permitido.'});
        if(url.pathname==='/api/dados')return enviar(200,bases());
        if(url.pathname==='/api/resumo') {
            const f=Object.fromEntries(url.searchParams);
            if(!f.mes)return enviar(400,{erro:'Informe mes no formato AAAA-MM.'});
            try{return enviar(200,modelo.calcular(bases(),f));}catch(e){return enviar(400,{erro:e.message});}
        }
        let arquivo=decodeURIComponent(url.pathname).replace(/^\//,'')||'Index.html';
        if(!publicos.has(arquivo)&&!/^dados\/(vendas|cancelamentos|instalacoes|metas|backlog|dimensoes)\.json$/.test(arquivo))return enviar(404,{erro:'Arquivo nao encontrado.'});
        const destino=path.join(raiz,arquivo);if(!fs.existsSync(destino))return enviar(404,{erro:'Arquivo nao encontrado.'});
        res.writeHead(200,{'Content-Type':mime[path.extname(destino)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(destino).pipe(res);
    }catch(e){enviar(500,{erro:'Nao foi possivel atender a consulta.'});}
});
server.listen(Number(process.env.PORT||3333),'127.0.0.1',()=>console.log('Painel em http://127.0.0.1:'+(process.env.PORT||3333)));






