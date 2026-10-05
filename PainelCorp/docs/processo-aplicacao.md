PROCESSOS DE UMA APLICAÇÃO
Da ideia à operação: decisões, arquitetura e evolução

OBJETIVO DESTE GUIA
Este documento explica como uma aplicação nasce, é construída, testada,
publicada e mantida. Não é só um manual do Painel Corporativo. O painel
aparece como exemplo para ligar os conceitos a algo concreto.
Não existe uma linguagem ou uma sequência rígida que sirva para todo projeto.
O processo tem retornos: um teste pode revelar uma decisão que precisa mudar.

MAPA GERAL
Ideia / problema
  -> Pessoas e contexto
  -> Resultado esperado e evidência de sucesso
  -> Requisitos e regras do negócio
  -> Escopo da primeira versão
  -> Dados e significado dos números
  -> Alternativas de arquitetura e tecnologia
  -> Protótipo de experiência
  -> Implementação em pequenas entregas
  -> Testes e revisão
  -> Publicação controlada
  -> Monitoramento e suporte
  -> Aprendizado, manutenção e nova versão
                      ^____________________________|

1. ANTES DO CÓDIGO: QUAL PROBLEMA RESOLVER?
Entrada: uma ideia, uma dificuldade ou uma oportunidade.
Perguntas: quem tem o problema? Como resolve hoje? Onde perde tempo ou erra?
Qual evidência mostrará que a solução melhorou algo? O que não precisamos fazer?
Saída: uma definição curta do problema e do resultado esperado.
Exemplo: consolidar vendas, cancelamentos e instalações sem somas manuais.
Não começar escolhendo React ou um banco: primeiro entender a necessidade.

2. QUEM USA E COMO USA?
Desenhar a jornada: abrir aplicação -> escolher período -> conferir total ->
filtrar empresa -> investigar região -> tomar uma decisão.
Listar ações, dúvidas, acessibilidade, dispositivos e permissões.
Separar públicos: quem consulta, quem importa dados e quem administra.
Saída: jornadas e telas necessárias, não só uma lista de botões.
No painel local atual há apenas consulta, sem contas e sem controle de acesso.

3. REQUISITOS E CRITÉRIOS DE ACEITE
Requisito funcional: o que o sistema faz.
Exemplo: filtrar os indicadores por diretoria, empresa e região.
Requisito de qualidade: como deve se comportar.
Exemplo: mostrar erro compreensível se a base não carregar; funcionar no celular.
Critério de aceite: uma condição verificável.
Exemplo: ao selecionar uma empresa, o total da tabela deve bater com os cartões.
Incluir cenários vazios, valores inválidos, carregamento e falhas.
Metas de desempenho dependem de volume e uso medidos; não inventar promessas.
Saída: comportamentos testáveis e uma lista do que fica para depois.

4. ESCOPO DA PRIMEIRA VERSÃO
Separar o essencial do desejável. Uma entrega pequena deve atravessar o fluxo:
entrada de dados -> regra -> saída útil ao usuário.
Exemplo inicial: ler vendas, calcular produtos e mostrar um cartão.
Depois acrescentar cancelamentos, filtros, gráficos e outros detalhes.
Não confundir protótipo local com sistema pronto para usuários externos.
Saída: sequência de entregas com utilidade, dependências e validação de cada uma.

5. ENTENDER E MODELAR OS DADOS
Antes de criar tabelas, definir a granularidade: o que uma linha representa?
Pedido não é produto. Um pedido pode conter mais de um produto.
Um evento de instalação não é a mesma coisa que uma venda.
Definir unidade, datas, chaves, campos obrigatórios e origem de cada informação.
Chave estável: identifica a mesma coisa em cargas diferentes.
ID da carga: identifica uma importação; não substitui o ID do pedido.
Nome de arquivo e posição da linha não são boas chaves permanentes do negócio.

FATO E DIMENSÃO
Fato: ocorrência ou medida, como vender uma unidade de um produto.
Dimensão: contexto, como produto, organização ou data.
Modelo estrela: uma fato aponta para dimensões. Não é uma árvore de decisão.
Hierarquia organizacional: diretoria -> empresa -> região, quando a relação
real permitir. Confirmar se nomes se repetem entre organizações.

                   DIMENSÃO DATA
                         |
DIMENSÃO PRODUTO -- FATO MOVIMENTO -- PEDIDO -- DIMENSÃO ORGANIZAÇÃO
                         |
            quantidade e tipo do evento

No painel, uma linha de fato_movimento representa pedido + produto + tipo:
venda, cancelamento ou instalação. Há uma fato_meta separada por mês,
organização e produto. Nunca repetir a meta mensal em cada pedido e somá-la.
Somar snapshots de backlog de meses distintos também produz um número errado.
Para histórico de mudanças de empresa/região, uma versão maior precisaria
registrar a validade dessas dimensões; o exemplo atual usa organização fixa.

6. DEFINIR REGRAS ANTES DE ESCREVER FÓRMULAS
Vendas líquidas = vendas brutas - cancelamentos.
Saldo do período = vendas líquidas - instalações.
Backlog final = backlog inicial + saldo do período.
Atingimento = vendas líquidas / meta mensal * 100.
Dias para zerar backlog = backlog / média diária de instalações.
Meta inexistente e ritmo zero não significam zero por cento nem zero dias.
Distinguir análise de safra (pedidos que entraram num período) de fluxo
(eventos que aconteceram no período). Não misturar os dois silenciosamente.
Neste painel adotamos fluxo: cada evento usa sua própria data. O backlog
carrega o saldo anterior. A média usa dias corridos até o corte, inclusive zeros.
Dias para zerar pressupõe ritmo constante e ausência de novas entradas.

7. ESCOLHER A ARQUITETURA
Arquitetura é a divisão de responsabilidades e a forma como as partes conversam.
Perguntar: onde os dados são preparados? Quem guarda o histórico? Quem calcula?
Quem pode acessar? Como atualizar, recuperar uma falha e verificar um resultado?
Começar com a estrutura mais simples que atende o uso conhecido.

OPÇÃO A - SITE ESTÁTICO
Navegador -> arquivos JSON preparados anteriormente.
Boa para demonstração, dados públicos e publicação simples.
Não executa um servidor de banco nem protege dados privados por si só.

OPÇÃO B - APLICAÇÃO COM SERVIDOR
Navegador -> API -> banco de dados.
Permite consultas centralizadas, regras de acesso e atualização controlada.
Exige operação do servidor, implantação e tratamento de falhas.

OPÇÃO C - PROCESSAMENTO MAIOR
Arquivos/fontes -> fila ou agendador -> processamento -> banco analítico -> API.
Adotar somente quando volume, tempo e concorrência justificarem. Não começar
por vários serviços só para parecer escalável.

Separar três fluxos:
1) Escrita/importação: entrada -> validação -> persistência.
2) Leitura: filtro -> consulta -> cálculo -> apresentação.
3) Operação: logs, falhas, backup, monitoramento e atualização.

8. COMO ESCOLHER LINGUAGENS E FERRAMENTAS
Escolher por problema, experiência da equipe, ecossistema, infraestrutura,
manutenção, segurança e custo. Registrar motivo e alternativa rejeitada.

HTML: estrutura e significado do conteúdo da página.
CSS: layout, cores, tipografia, tamanhos e adaptação às telas.
JavaScript: interação e atualização dos dados no navegador.
Node.js: executa JavaScript fora do navegador; permite scripts e uma API.
JSON: formato de troca de dados; não é linguagem, banco nem API.
SQL: linguagem para consultar dados relacionais.
SQLite: banco em arquivo, útil neste protótipo local de pequeno porte.
PostgreSQL: possível evolução quando acesso concorrente, operação remota e
administração do banco justificarem a mudança; não instalado neste projeto.
Python: alternativa útil para processamento e ciência de dados. Não obrigatório
para gerar JSON, e adicioná-lo agora criaria outra linguagem a aprender.
React: biblioteca para interfaces por componentes. Pode ajudar quando a tela
cresce em interações e estados; não é necessário para uma foto de fundo.
TypeScript: acrescenta verificação de tipos ao desenvolvimento JavaScript;
pode ajudar a manter contratos maiores, mas exige ferramenta de compilação.

Decisão atual: HTML + CSS + JavaScript + Node + SQLite, mantendo JSON estático.
Motivo: aproveitar o aprendizado atual, poucas dependências e execução local.
Limite: não é um serviço público multiusuário nem uma prova de escalabilidade.

MODELO DE REGISTRO DE DECISÃO
Problema:
Opções consideradas:
Escolha e motivo:
Consequências e limitações:
Evidência/teste:
Quando revisar a decisão:

9. PROJETAR TELAS ANTES DE POLIR O VISUAL
Rascunhar a ordem das informações e o caminho de investigação.
Organizar títulos, filtros, cartões, tabelas e gráficos.
Cada elemento deve ter um propósito e uma unidade clara.
Testar largura pequena, teclado, contraste e ausência de dados.
Uma foto cinematográfica é uma escolha visual; não resolve a estrutura de dados.
Usar sobreposição escura e quadros legíveis. Considerar tamanho da imagem,
licença, texto alternativo quando necessário e movimento reduzido.
No exemplo atual o botão permite foto local, sem upload e sem persistência.

10. ORGANIZAR O CÓDIGO
Separar leitura de arquivos, validação, cálculos e apresentação.
Uma regra deve ter um local claro de manutenção.
Evitar copiar o mesmo cálculo em cartões, gráficos e API.
Nomes devem indicar intenção: calcularBacklog é mais claro que executarCoisa.
Comentários explicam motivos e regras; não substituem nomes compreensíveis.
Configurações sensíveis ficam no servidor, nunca no HTML ou JavaScript público.

11. IMPORTAÇÃO E TRANSFORMAÇÃO
Arquivo bruto -> ler texto -> interpretar separadores -> validar estrutura ->
converter tipos -> verificar identificadores -> conferir regras -> gravar saída.
CSV com pipe pode ter campos entre aspas. Separar por split simples serve
para exercícios controlados, mas não cobre todos os arquivos CSV.
Números vazios não devem virar zero sem uma regra. Datas inválidas não devem
ser aceitas silenciosamente. Guardar a origem para rastrear divergências.
Reexecutar a mesma carga não deve multiplicar os resultados (idempotência).
Em falha, preservar a última carga válida e comunicar o que ocorreu.

12. API E CONTRATOS
Uma API define como pedir e receber informações.
Contrato: endereço, método, filtros, resposta, erros e permissões.
Exemplo local: GET /api/resumo?mes=2025-10.
JSON é um formato possível da resposta; trocar CSV por JSON não elimina
validação e não torna o sistema automaticamente rápido.
Acesso ao banco fica atrás da API. O navegador nunca recebe a senha do banco.
Em produção: autenticação, autorização, limites, logs, HTTPS e política de dados.
A API atual aceita apenas leitura e escuta somente neste computador.

13. IMPLEMENTAÇÃO POR ETAPAS
Para cada alteração:
  a) explicar o objetivo;
  b) localizar o arquivo e a responsabilidade;
  c) mudar uma unidade compreensível;
  d) executar e observar;
  e) testar o comportamento esperado e uma falha;
  f) registrar o resultado e o que ainda falta.
Quando um conceito não estiver claro, usar um exemplo de uma linha antes
de repetir para toda a base. Concluir a funcionalidade antes do polimento.

14. TESTES E EVIDÊNCIAS
Teste de regra: soma, data, meta inexistente, backlog, ritmo zero.
Teste de integração: CSV -> JSON -> banco -> resposta da API.
Teste de interface: filtro atualiza cartões, tabela e gráfico no mesmo recorte.
Teste de regressão: uma mudança não altera um comportamento já conferido.
Teste de segurança: parâmetros inválidos, acesso a arquivos internos, permissões.
Teste de uso: alguém consegue realizar a tarefa sem precisar adivinhar?
Não dizer 'testado' sem dizer o que foi observado. Sintaxe válida não garante
cálculo certo; resposta HTTP válida não garante visual correto.

15. VERSIONAMENTO E ENTREGA
Git registra conjuntos coerentes de mudanças. Não precisa commit por linha.
Uma entrega deve explicar problema, resultado, verificação e limitações.
Revisar arquivos antes de publicar; não versionar segredos nem banco operacional.
Ter ambientes separados quando o produto crescer: desenvolvimento, teste,
homologação e produção. Não publicar automaticamente só por ter um repositório.
GitHub Pages pode servir HTML/CSS/JS/JSON; a API Node requer outra execução.

16. PUBLICAÇÃO E OPERAÇÃO
Antes de usuários externos: definir hospedagem, domínio, HTTPS, acessos,
configuração, backup, recuperação e responsável por incidentes.
Acompanhar falhas, atualização dos dados, tempos de resposta e experiência.
Ter rollback: retornar a uma versão anterior se a nova entrega falhar.
Testar restauração do backup, não apenas sua criação.
O fim do desenvolvimento de uma versão é o início da operação, não o fim
permanente da aplicação.

17. EVOLUÇÃO E MACHINE LEARNING
Primeiro garantir dados confiáveis e métricas com regras explícitas.
Depois formular uma pergunta de previsão e uma medida de erro.
Separar treino e teste por tempo quando houver séries históricas.
Comparar com uma previsão simples antes de adotar modelos complexos.
Previsão não substitui o realizado. Mostrar ambos claramente separados.
Dados simulados servem para aprendizado, não comprovam desempenho real.
Árvore de decisão é um modelo de ML, diferente do esquema estrela do banco.
Nenhum modelo de ML foi treinado neste painel.

EXEMPLO CONCRETO: PAINEL CORPORATIVO

Fluxo implementado:
Coletas/*.csv
 -> scripts/preparar-vendas.js (valida, converte números, produz JSON)
 -> dados/*.json
 -> scripts/carregar-banco.js (carga transacional SQLite)
 -> banco/painel.sqlite (dimensões, pedidos, fatos e snapshots de entrega)
 -> servidor.js (/api/dados e /api/resumo)
 -> script.js (carregamento, filtros, atualização do DOM)
 -> modelo.js (contas compartilhadas)
 -> Index.html + style.css (estrutura e aparência)

Alternativa estática:
dados/*.json -> Live Server -> script.js -> tela.

O banco contém dim_organizacao, dim_produto, dim_data, pedidos,
fato_movimento, fato_meta e bases_json. A dimensão organização guarda a
combinação diretoria/empresa/região. bases_json é uma camada de compatibilidade
para esta demonstração: a API lê esse snapshot para manter o contrato do painel.
Os fatos relacionais já existem e são conferidos, mas a API de resumo ainda
calcula em JavaScript sobre os registros; futuras consultas volumosas devem
agregar no SQL com filtros e paginação. Não afirmar que isso já está otimizado.

DATAS E LIMITES DO EXEMPLO
Julho, agosto e setembro de 2025 fechados; outubro até dia 10.
As datas originais continuam em texto nos JSONs; o modelo valida e extrai a data
calendário, e o banco registra o dia ISO. Não há conversão de fuso horário.
O backlog inicial da simulação é zero antes de julho.
Os valores de metas existentes foram estimados sobre vendas brutas históricas;
no painel são objetivos simulados de vendas líquidas, explicitados na metodologia.
Julho não tem meta. Recalibrar as metas exige uma nova decisão de negócio.
Nenhum dado foi publicado nem enviado a terceiros.

COMO EXECUTAR (TERMINAL ABERTO NA PASTA PainelCorp)
Pré-requisito desta versão: Node.js 24 ou superior.
1. node scripts/carregar-banco.js
   Valida os CSVs, atualiza JSONs e reconstrói o banco derivado em transação.
2. node servidor.js
   Abre serviço local em http://127.0.0.1:3333.
3. Acesse esse endereço no navegador.
4. node tests/modelo.test.js
   Confere regras, séries, backlog e integridade relacional.
Para interromper o servidor: Ctrl+C no terminal dele.
Se modificar os CSVs, execute novamente a carga. Não há monitoramento automático.
Para usar só Live Server: gere os JSONs e abra Index.html com Live Server.

POR ONDE ESTUDAR
1. Coletas: identificar uma venda e seus produtos.
2. preparar-vendas.js: acompanhar leitura, validação e transformação.
3. dados/vendas.json: comparar uma linha de origem com seu objeto.
4. modelo.js: entender uma soma e depois o backlog.
5. carregar-banco.js: seguir pedido, dimensões e eventos.
6. servidor.js: seguir uma requisição e sua resposta.
7. script.js: seguir filtro -> cálculo -> elemento da tela.
8. style.css: modificar uma cor ou espaçamento e observar.

ESTADO DESTA VERSÃO
Implementados: preparação, JSON, banco local, API de leitura, indicadores,
filtros por mês e organização, tabelas, gráfico diário, tabela acessível do
gráfico e escolha de foto local. Testes executados são relatados no projeto.
Não implementados: autenticação, publicação em produção, carga automática,
concorrência de importações, previsão por ML e persistência da foto escolhida.
Este é um protótipo local funcional e uma base didática para evolução.