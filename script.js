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