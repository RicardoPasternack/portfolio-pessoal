# Portfólio e painel demonstrativo

O portfólio apresenta projetos. PainelCorp demonstra acompanhamento de vendas e instalações de segurança eletrônica com dados simulados. As regiões exibidas pertencem à Grande São Paulo; códigos internos são permanentes, nomes vêm das dimensões.

Pedido é identificado por ID_Pedido. Produto é a unidade de volume dos indicadores: um pedido pode ter vários produtos. Movimento registra venda, cancelamento ou instalação na data correspondente. Backlog é o saldo de produtos pendentes. Meta é mensal e simulada. As bases disponíveis cobrem julho a outubro de 2025.

Regras detalhadas: `PainelCorp/docs/analises.md`. Fluxo da aplicação: CSV → preparação → JSON e banco local → API local ou JSON publicado → cálculos compartilhados → interface.

Preferência do usuário: interface concisa, explicações em documentação, ensino em pequenas etapas quando solicitado. A visão geral abre no último mês disponível e as análises possuem telas próprias.
