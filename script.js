const botaoDetalhes = document.querySelector("#alternar-detalhes");
const detalhesProjeto = document.querySelector("#detalhes-projeto");

function alternarDetalhes()
{
    if (detalhesProjeto.hidden === true)
    {
        detalhesProjeto.hidden = false;
        botaoDetalhes.textContent = "Ocultar detalhes";
        botaoDetalhes.setAttribute("aria-expanded", "true");
    }
    else
    {
        detalhesProjeto.hidden = true;
        botaoDetalhes.textContent = "Mostrar detalhes";
        botaoDetalhes.setAttribute("aria-expanded", "false");
    }
}

botaoDetalhes.addEventListener("click", alternarDetalhes);

const anoAtual = document.querySelector("#ano-atual");

anoAtual.textContent = new Date().getFullYear();

const botaoTema = document.querySelector("#alternar-tema");

const temaSalvo = localStorage.getItem("tema");

if (temaSalvo === "claro")
{
    document.body.classList.add("tema-claro");
    botaoTema.textContent = "Tema escuro";
    botaoTema.setAttribute("aria-pressed", "true");
}

function alternarTema()
{
    const temaClaroAtivo = document.body.classList.toggle("tema-claro");

    if (temaClaroAtivo === true)
    {
        botaoTema.textContent = "Tema escuro";
        botaoTema.setAttribute("aria-pressed", "true");
        localStorage.setItem("tema", "claro");
    }
    else
    {
        botaoTema.textContent = "Tema claro";
        botaoTema.setAttribute("aria-pressed", "false");
        localStorage.setItem("tema", "escuro");
    }
}

botaoTema.addEventListener("click", alternarTema);

const linksNavegacao = document.querySelectorAll('nav a[href^="#"]');
const secoesNavegacao = document.querySelectorAll("main section[id]");

function atualizarLinkAtivo()
{
    let idSecaoAtual = "inicio";

    secoesNavegacao.forEach(function (secao)
    {
        const limiteSecao = secao.offsetTop - 160;

        if (window.scrollY >= limiteSecao)
        {
            idSecaoAtual = secao.id;
        }
    });

    linksNavegacao.forEach(function (link)
    {
        const linkRepresentaSecao =
            link.getAttribute("href") === "#" + idSecaoAtual;

        if (linkRepresentaSecao === true)
        {
            link.setAttribute("aria-current", "location");
        }
        else
        {
            link.removeAttribute("aria-current");
        }
    });
}

window.addEventListener("scroll", atualizarLinkAtivo);

atualizarLinkAtivo();

const botaoVoltarTopo = document.querySelector("#voltar-topo");

function atualizarBotaoVoltarTopo()
{
    botaoVoltarTopo.hidden = window.scrollY < 400;
}

window.addEventListener("scroll", atualizarBotaoVoltarTopo);

atualizarBotaoVoltarTopo();

const botoesFiltroProjetos =
    document.querySelectorAll(".filtro-projeto");

const cartoesProjetos =
    document.querySelectorAll(".projeto");

function filtrarProjetos(evento)
{
    const filtroSelecionado =
        evento.currentTarget.dataset.filtro;

    botoesFiltroProjetos.forEach(function (botao)
    {
        const botaoSelecionado =
            botao === evento.currentTarget;

        botao.setAttribute(
            "aria-pressed",
            botaoSelecionado
        );
    });

    cartoesProjetos.forEach(function (cartao)
    {
        const mostrarCartao =
            filtroSelecionado === "todos" ||
            cartao.dataset.status === filtroSelecionado;

        cartao.hidden = mostrarCartao === false;
    });
}

botoesFiltroProjetos.forEach(function (botao)
{
    botao.addEventListener("click", filtrarProjetos);
});