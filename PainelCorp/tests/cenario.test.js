const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const cena={style:{}},camada={children:[],append(e){this.children.push(e);}},eventos={};
const pref={matches:false,addEventListener:(n,fn)=>eventos.pref=fn};
const root={scrollHeight:4000};const win={innerHeight:800,scrollY:0,matchMedia:()=>pref,addEventListener:(n,fn)=>eventos[n]=fn,requestAnimationFrame:fn=>fn()};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cenario.js'),'utf8'),{window:win,document:{querySelector:()=>cena,getElementById:()=>camada,createElement:()=>({style:{},children:[],append(e){this.children.push(e);}}),documentElement:root,body:{}}});
assert.equal(camada.children.length,25);const inicial=camada.children[0].textContent;
win.scrollY=1600;eventos.scroll();assert.notEqual(camada.children[0].textContent,inicial);
win.scrollY=3000;eventos.scroll();const antes=cena.style.transform;win.scrollY=3200;eventos.scroll();assert.equal(cena.style.opacity,'0');assert.equal(camada.children[24].style.opacity,'1');
const nucleo=camada.children[24].children[0];assert.equal(nucleo.style.opacity,'1');win.scrollY=0;eventos.scroll();assert.equal(nucleo.style.opacity,'0');assert.equal(cena.style.opacity,'1');pref.matches=true;eventos.pref();assert.equal(camada.children[0].textContent,inicial);assert.match(cena.style.transform,/scale\(1.03\)/);assert.equal(cena.style.opacity,'1');assert.equal(camada.children[24].style.opacity,'0');
console.log('PASS: 24 números decorativos, mudança na rolagem, zoom até final e movimento reduzido.');


