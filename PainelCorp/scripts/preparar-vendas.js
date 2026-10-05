// Execute com Node.js. Prepara todas as bases; nunca recria IDs pela posicao.
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.join(__dirname, '..');
const arquivos = {
    vendas: '0 Entrada/VENDAS - BRUTO.csv',
    cancelamentos: '1 Cancelamentos/CANCELAMENTOS.csv',
    instalacoes: '2 Instalacoes/INSTALACOES.csv',
    metas: '3 Metas/METAS.csv',
    backlog: '4 Backlog/BACKLOG.csv'
};
const numericos = new Set(['Prod 1','Prod 2','Prod 3','Combo','Duracao_Minutos',
    'Media_Mensal_Base','Margem_Percentual','Meta_Quantidade','Backlog_Inicial',
    'Vendas_Brutas_Periodo','Cancelamentos_Periodo','Vendas_Liquidas_Periodo',
    'Instalacoes_Periodo','Backlog_Final','Media_Dias_Em_Aberto','Maior_Idade_Dias']);

// Leitor pipe com suporte a campos entre aspas, inclusive quebras internas.
function lerPipe(texto) {
    const linhas = []; let linha = [], campo = '', aspas = false;
    texto = texto.replace(/^\uFEFF/, '');
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (c === '"') {
            if (aspas && texto[i+1] === '"') { campo += '"'; i++; }
            else aspas = !aspas;
        } else if (!aspas && c === '|') { linha.push(campo); campo = ''; }
        else if (!aspas && (c === '\n' || c === '\r')) {
            if (c === '\r' && texto[i+1] === '\n') i++;
            linha.push(campo); if (linha.some(v => v !== '')) linhas.push(linha);
            linha = []; campo = '';
        } else campo += c;
    }
    if (aspas) throw Error('Campo com aspas nao fechadas.');
    linha.push(campo); if (linha.some(v => v !== '')) linhas.push(linha);
    return linhas;
}

function prepararBase(nome, arquivo) {
    const linhas = lerPipe(fs.readFileSync(path.join(raiz, 'Coletas', arquivo), 'utf8'));
    const campos = linhas.shift();
    if (!campos || campos.some(c => !c) || new Set(campos).size !== campos.length)
        throw Error(`${nome}: cabecalho vazio ou repetido.`);
    const obrigatorios = ['Diretoria','Empresa','Regiao'];
    if (['vendas','cancelamentos','instalacoes'].includes(nome))
        obrigatorios.push('ID_Pedido','Data_Ref','Prod 1','Prod 2','Prod 3');
    if (nome === 'metas') obrigatorios.push('Mes_Referencia','Produto','Meta_Quantidade');
    if (nome === 'backlog') obrigatorios.push('Data_Corte','Produto','Backlog_Final');
    for (const c of obrigatorios) if (!campos.includes(c)) throw Error(`${nome}: falta ${c}.`);
    return linhas.map((valores, indice) => {
        if (valores.length !== campos.length) throw Error(`${nome}: colunas inconsistentes no registro ${indice+1}.`);
        const registro = {};
        campos.forEach((c,i) => {
            const valor = valores[i];
            if (numericos.has(c)) {
                if (!/^\d+(?:[.,]\d+)?$/.test(valor)) throw Error(`${nome}: numero invalido em ${c}, registro ${indice+1}.`);
                registro[c] = Number(valor.replace(',', '.'));
                if (['Prod 1','Prod 2','Prod 3','Combo'].includes(c) && ![0,1].includes(registro[c]))
                    throw Error(`${nome}: produto fora de 0/1.`);
            } else registro[c] = valor;
        });
        for (const c of obrigatorios) if (registro[c] === '') throw Error(`${nome}: ${c} vazio.`);
        return registro;
    });
}

function validarVinculos(bases) {
    const pedidos = new Map();
    for (const venda of bases.vendas) {
        if (pedidos.has(venda.ID_Pedido)) throw Error('ID_Pedido repetido em vendas.');
        pedidos.set(venda.ID_Pedido, venda);
    }
    const eventos = new Set();
    for (const nome of ['cancelamentos','instalacoes']) {
        for (const registro of bases[nome]) {
            const venda = pedidos.get(registro.ID_Pedido);
            if (!venda) throw Error(`${nome}: pedido sem venda correspondente.`);
            if (eventos.has(registro.ID_Pedido)) throw Error('Pedido repetido ou simultaneamente cancelado e instalado.');
            eventos.add(registro.ID_Pedido);
            if (registro.ID_Origem !== registro.ID_Pedido) throw Error('ID_Origem divergente.');
            for (const c of ['Data_Ref','Diretoria','Empresa','Regiao','Prod 1','Prod 2','Prod 3'])
                if (registro[c] !== venda[c]) throw Error(`${nome}: divergencia em ${c}.`);
        }
    }
    for (const r of bases.backlog) {
        if (r.Vendas_Liquidas_Periodo !== r.Vendas_Brutas_Periodo-r.Cancelamentos_Periodo ||
            r.Backlog_Final !== r.Backlog_Inicial+r.Vendas_Liquidas_Periodo-r.Instalacoes_Periodo)
            throw Error('Saldo inconsistente na base de backlog.');
    }
}

function prepararTudo() {
    const bases = {};
    for (const [nome,arquivo] of Object.entries(arquivos)) bases[nome] = prepararBase(nome,arquivo);
    validarVinculos(bases);
    // So grava depois de validar todas as bases. Datas permanecem como na origem.
    const destino = path.join(raiz, 'dados');
    fs.mkdirSync(destino,{recursive:true});
    for (const [nome,registros] of Object.entries(bases)) {
        fs.writeFileSync(path.join(destino,`${nome}.json`),JSON.stringify(registros,null,2)+'\n','utf8');
        console.log(`${nome}: ${registros.length} registros preparados.`);
    }
    return bases;
}
if (require.main === module) {
    try { prepararTudo(); } catch (erro) { console.error(erro.message); process.exitCode=1; }
}
module.exports = {lerPipe, validarVinculos, prepararTudo};