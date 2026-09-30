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
