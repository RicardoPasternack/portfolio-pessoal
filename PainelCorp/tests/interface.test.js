// Testa a ligacao DOM/dados sem simular a aparencia de um navegador.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'Index.html'),'utf8');
class Elemento {
 constructor(){this.children=[];this.value='';this.textContent='';this.handlers={};this.hidden=false;this.style={setProperty(){},removeProperty(){}};}
 append(e){this.children.push(e);}replaceChildren(){this.children=[];}add(e){this.children.push(e);if(this.children.length===1)this.value=e.value;}setAttribute(){}addEventListener(n,f){this.handlers[n]=f;}click(){}
}
async function testar(api) {
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Elemento()]));const erros=[];
 const dados=Object.fromEntries(['vendas','cancelamentos','instalacoes','metas','backlog','dimensoes'].map(n=>[n,JSON.parse(fs.readFileSync(path.join(root,'dados',n+'.json'),'utf8'))]));
 const context={Intl,console:{error:e=>erros.push(e)},document:{getElementById:id=>{assert.ok(elements[id],id);return elements[id];},createElement:()=>new Elemento(),createElementNS:()=>new Elemento(),body:new Elemento()},Option:function(text,value){this.textContent=text;this.value=value;},ModeloPainel:require('../modelo'),fetch:async url=>{
  if(url==='./api/dados')return {ok:api,headers:{get:()=>api?'application/json':'text/html'},json:async()=>dados};
  return {ok:true,json:async()=>dados[path.basename(url,'.json')]};
 }};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8').replace(/carregarDados\(\);\s*$/,'globalThis.concluido=carregarDados();'),context);await context.concluido;
 assert.equal(erros.length,0);assert.equal(elements['vendas-liquidas'].textContent,'153');assert.equal(elements.backlog.textContent,'172');assert.equal(elements['linhas-regioes'].children.length,11);assert.equal(elements['linhas-dias'].children.length,10);
 elements.Diretoria.value='Dir.1';elements.Diretoria.handlers.change();assert.ok(elements['linhas-regioes'].children.length<11);
 elements.mes.value='2025-07';elements.mes.handlers.change();assert.equal(elements.meta.textContent,'—');
 console.log('PASS: interface por '+(api?'API':'JSON')+', cards, 11 regioes, grafico, filtro e meta ausente.');
}
(async()=>{await testar(true);await testar(false);})();
