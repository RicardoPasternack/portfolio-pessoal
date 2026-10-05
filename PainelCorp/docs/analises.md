# Análises da operação

## O que foi implementado

A visão geral continua abrindo no último mês disponível. O Menu abre quatro telas próprias: vendas e metas, cancelamentos, instalações e backlog. Cada tela possui URL própria, embora compartilhe o mesmo HTML e renderizador. Período, diretoria, empresa e região viajam na URL e são restaurados ao voltar à visão geral.

`analitica.js` calcula os indicadores sem depender da tela. `analise.js` transforma os resultados em cartões, gráficos e tabelas. `modelo.js` continua como fonte dos totais já usados pela visão geral. Os arquivos originais não foram alterados.

## Definições

- Quantidade: soma de Prod 1, Prod 2 e Prod 3, em produtos, não pedidos.
- Vendas brutas: produtos com Data_Ref no período.
- Cancelamentos do período: produtos com Data_Cancelamento no período, inclusive de vendas anteriores.
- Vendas líquidas: brutas menos cancelamentos do período. Podem ser negativas.
- Taxa das vendas do mês: produtos cancelados até o corte cujos pedidos foram vendidos no período, divididos pelos produtos vendidos no período. A ligação usa ID_Pedido. Não confundir com cancelamentos do período divididos pelas vendas do período.
- Vendas mantidas: 100% menos a taxa acima. Não implica instalação ou recebimento financeiro. Coortes recentes tiveram menos tempo para cancelar; esta primeira versão não compara retenção entre coortes de idades diferentes.
- Atingimento: líquidas / meta mensal. Meta ausente é “—”, nunca zero. As metas são simuladas.
- Projeção: líquidas / DU observados × DU do mês. Disponível apenas em mês parcial. É extrapolação linear, não modelo de previsão, e não controla sazonalidade.
- SLA: pedidos com conclusão até 120 minutos após agendamento / pedidos com duração válida. Duração negativa ou ausente é excluída e contada separadamente. É uma métrica por pedido; os demais volumes são por produto.
- Backlog: saldo anterior + líquidas − instalações. Conferido também pelos IDs dos pedidos sem cancelamento ou instalação até o corte.
- Idade: dias corridos desde a venda até o corte; média ponderada pelos produtos pendentes.
- Dias de estoque: backlog / instalações médias por dia corrido. Zero ritmo com pendências resulta em “—”, não infinito nem zero. Supõe ausência de novas entradas.

## Comparações

Mês parcial é comparado com a mesma quantidade de dias do mês anterior (limitada ao menor mês). Meses encerrados são comparados integralmente. Se o anterior não existe, a variação fica indisponível. Se seu resultado for zero ou negativo, não mostramos crescimento percentual, embora os valores absolutos permaneçam visíveis.

As faixas semanais são dias 1–7, 8–14 etc. Não são semanas ISO. A última pode ter menos dias, por isso a tabela mostra média por dia.

Acumulados móveis de dois e três meses incluem o mês selecionado e identificam quando ele está parcial. Não equivalem a bimestres/trimestres civis fechados e não fabricam uma comparação com janelas anteriores sem cobertura. O histórico disponível vai de julho a outubro de 2025, com corte em 10 de outubro; não há dados atuais de 2026.

Rankings: top cinco regiões por volume; todas as três empresas. Taxas são apresentadas com o volume de vendas que forma o denominador.

## Verificação e execução

Com Node disponível, execute `node --test tests/*.test.js` dentro de PainelCorp. Os testes cobrem saldo por mês/região, cancelamento de venda antiga, corte temporal, SLA inválido, metas ausentes, recortes vazios, comparações e projeção.

`node servidor.js` serve a API local com SQLite e as telas. Em hospedagem estática, as mesmas telas leem os JSONs diretamente. GitHub Pages não executa Node. Nenhuma nova dependência foi adicionada.

## Próximas evoluções possíveis

Mais meses permitem comparação entre trimestres completos; uma taxa de cancelamento com janela fixa de maturação permite comparar safras sem viés de idade. Dados de vendedor, receita, custo e capacidade real serão necessários antes de indicadores financeiros ou rankings individuais. Esta versão não inventa esses campos.

## Ajustes da tela de vendas
Mix exibe Câmeras, Alarmes e Controle de Acesso, preservando Prod 1/2/3 internamente. Top 5 e Perfil dos pedidos formam uma pilha compacta ao lado da variação regional. Perfil conta somente pedidos com quantidade positiva; produtos por pedido usa brutas / esses pedidos. Histórico de vendas contém brutas, líquidas, meta e atingimento. Empresas mostra efetivação = líquidas / brutas do período, distinta da retenção por safra; cancelamentos antigos podem reduzir essa razão. Exemplo: 71 brutas e 66 líquidas resultam em 92,96% de efetivação e 7,04% de diferença, não 7% de conversão.

## Cobertura de metas e fechamento
Julho de 2025 possui 33 metas iniciais simuladas, total450, rateadas proporcionalmente a agosto pelo método dos maiores restos. Substitui o preenchimento provisório de471; demais meses preservados. Não é meta histórica observada. A cobertura passa a julho–outubro2025 (132 registros). CSV, JSON e SQLite foram sincronizados. Histórico mostra barras de líquidas/meta e rosca do mês selecionado; excedente aparece em texto para não distorcer a rosca. Meses fechados mostram Fechamento realizado com líquidas; mês parcial mostra Projeção de fechamento. Backup anterior do CSV foi guardado na pasta temporária do sistema.

## Calendário operacional DU
Peso definido pelo usuário: segunda a sexta1, sábado0,75, domingo0,25; feriados e Carnaval valem0,25, conforme dados/calendario.json. A linha do tempo abre com últimos15dias até o corte do mês selecionado e aceita intervalo próprio dentro da cobertura da base. Exibe datas com mês, total líquido, dias ponderados, média por dia e por DU. O calendário só altera esse quadro; os cartões mensais mantêm seu filtro.
Comparação semanal: segunda-feira até o dia final escolhido versus mesmos dias da semana anterior; ausência de cobertura é indicada. Perfil por dia da semana inclui dias sem movimento como zero. Projeção sexta/sábado/domingo usa até15dias encerrados na quinta escolhida, sem consultar dados posteriores, e multiplica a média por DU por1/0,75/0,25. Quinta futura ou fora da base não é aceita. Não há previsão meteorológica, sazonal ou de machine learning.
Meta inicial450 é um parâmetro de cenário escolhido, não uma inferência de junho. Script scripts/definir-meta-inicial.js reproduz o rateio sem alterar outros meses.

## Perfil semanal da base simulada
A pedido do usuário, redistribuídas as datas de entrada de143pedidos dentro do mês. Perfil relativo alvo: domingo0,20; segunda1; terça1,08; quarta1,30; quinta1,10; sexta1; sábado0,625. Esses fatores simulam sazonalidade e NÃO substituem pesosDU. O ajuste minimiza desvios de volume líquido e respeita datas de agendamento/conclusão. Pedidos cancelados não são redistribuídos. IDs, produtos, organizações, totais por mês/região, datas de cancelamento/instalação e metas foram preservados. Data_Ref foi sincronizada nos registros instalados e idades dos snapshots recalculadas.
Script scripts/redistribuir-cenario-semanal.js faz prévia; --aplicar grava e cria backup. Isso não é um procedimento de correção de dados reais: apenas cenário demonstrativo explicitamente solicitado. Em agosto, médias seg15,25 ter16,5 qua20 qui16,75 sex15,6 sáb9,8 dom3. Variações locais por região/pedido podem permanecer devido a volumes inteiros e restrições temporais.

## Revisão vigente do perfil semanal (substitui o pico na quarta)
Usuário corrigiu o requisito: pico na segunda com queda até domingo e variação aleatória entre semanas. Perfilv2: dom0,2 seg1,5 ter1,28 qua1,08 qui0,91 sex0,76 sáb0,5. Fator semanal sorteado0,8–1,2 e ruído diário0,94–1,06 (domingo0,6–1,4), reprodutíveis por semente/data. Não significa volumes únicos: coincidências inteiras são possíveis, mas não se replica uma semana fixa. Aplicação redistribuiu95pedidos adicionais; totais mensais preservados. Detalhamento diário por DU é agora a única tabela da linha do tempo. PesosDU permanecem1/0,75/0,25.


## Últimas três ocorrências válidas e feriados
A tabela busca até três datas do mesmo dia da semana, incluindo a última até o fim selecionado, sem dados futuros. Pode buscar antes do intervalo de quinze dias. Feriados e DU excepcional são pulados; dias normais sem venda continuam como zero. Mostra última data, seu volume, média por DU, quantidade de ocorrências e datas usadas/ignoradas. Média = soma das líquidas / soma dos pesos das ocorrências válidas. Amostra menor é explicitada.
Calendário operacional cadastrado para 2025 e 2026: nacionais fixos, Paixão de Cristo, Corpus Christi, segunda e terça de Carnaval e aniversário de São Paulo (25/01). Feriado prevalece sobre qualquer dia: 0,25 DU. Demais dias: seg–sex1, sábado0,75, domingo0,25. Exceções aplicadas a toda a operação por regra do cenário; não representam abrangência jurídica municipal. Carnaval/Corpus são exceções operacionais, independentemente da classificação legal. Não incluídos 9/07, emendas, vésperas e quarta de Cinzas. Cadastrar novos anos antes de ampliar a cobertura dos dados.
Fontes de datas: https://clic.prefeitura.sp.gov.br/calendario-2025 ; https://www.gov.br/cade/pt-br/assuntos/noticias/funcionamento-do-cade-durante-o-carnaval-2026 ; https://www2.camara.leg.br/legin/int/portar/2025/portaria-11-1-dezembro-2025-798422-publicacaooriginal-177242-cd-1secm.html
As exceções afetam DU na linha do tempo, comparações e projeções; não alteram os volumes simulados já gravados. A projeção de fim de semana continua usando a produtividade dos quinze dias até quinta; a média das três ocorrências é um indicador separado.
Cabeçalhos simplificados: Dia da semana, Data, Média de vendas líquidas por DU, Vendas líquidas nessa data. Última coluna é volume bruto de normalização (líquidas reais), não líquidas/DU. Removida coluna Amostra; datas disponíveis permanecem no detalhamento.
Revisão visual: Dia | Data | Líquidas | Média/DU | Variação. Percentual = (líquidas da última data / DU − média/DU) / abs(média/DU) × 100. Alta verde, queda vermelha, estabilidade amarela (arredondamento de 1 decimal); média zero com valor não zero fica indefinida. Média inclui última ocorrência, conforme requisito. Ícones e texto acessível complementam cor.
Quadro renomeado Média de venda; removidos textos auxiliares e detalhamento de datas da interface por preferência do usuário. Tabela com largura adaptável sem rolagem lateral; regras de cálculo permanecem documentadas aqui.
Tela de vendas: removidos os quadros Evolução em faixas de 7 dias e Acumulados móveis por solicitação do usuário.
Comparação mensal de vendas agora usa duas barras horizontais com datas e valores, mesma escala e percentual de variação. Recorte parcial equivalente preservado.
Projeção próxima semana inserida sob comparação semanal: média líquida/DU da semana atual até fim selecionado × DU da próxima segunda a domingo, incluindo feriados. Datas e DU exibidos; não usa vendas futuras nem compara total parcial como semana completa.

## Padrão nas telas operacionais
Cancelamentos e instalações receberam comparação mensal em barras, calendário de últimos15dias, comparativo semanal, três ocorrências válidas por dia, projeção próxima semana e sexta–domingo com corte na quinta e DU. Faixas de7dias são barras, conforme pedido específico para essas telas. Cancelamentos mantém motivos e taxa por safra e mostra mix de produtos; alta de cancelamentos é vermelha, redução verde. Instalações preserva prazo e capacidade. Históricos e empresas têm apenas métricas pertinentes.
Backlog usa saldo diário, não soma de saldos nem backlog dividido por DU. Próxima semana projeta saldo a partir do corte usando (entradas líquidas − instalações)/DU da semana atual, multiplicado pelos DU restantes até o domingo seguinte; resultado limitado a zero. É cenário de ritmo constante, não previsão estatística. Mantidas idade, conciliação e ranking de pendências. Nenhum dado de origem alterado.
Validação:20 testes passaram, incluindo conciliação de fluxos, pesoDU, limite de cobertura, saldo final e projeção; navegação local entre as3telas verificada. Sem publicação nesta etapa.

## Definição vigente de Dias de estoque
Por escolha do usuário, o nome Dias de estoque significa prazo médio entre Data_Ref do pedido e Data_Encerramento da instalação. Média aritmética por pedido concluído no período, dias corridos fracionários; deduplica ID e exclui datas inválidas/negativas. Sem conclusão válida é nulo. Modelo compartilhado em modelo.js padroniza visão geral, regiões, empresas, histórico e análise. A antiga cobertura backlog/ritmo permanece apenas como diasParaZerar. Idade dos pendentes é outro indicador e foi renomeada Espera dos pendentes. Datas da base simulada possuem pedidos à meia-noite; interpretação depende dessa precisão de origem.
