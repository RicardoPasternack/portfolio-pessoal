# Telas de análise com cálculo compartilhado

Status: adotada.

Decisão: preservar a visão geral e servir quatro telas por uma página comum, selecionadas por URL. Filtros acompanham a navegação. Funções puras em analitica.js usam o mesmo modelo dos totais existentes.

Motivo: permitir aprofundamento por assunto mantendo compatibilidade com GitHub Pages e API local, sem introduzir framework ou duplicar o modelo de negócio.

Alternativas: quatro HTMLs duplicariam a estrutura; uma aplicação com roteador adicionaria dependências sem necessidade nesta etapa. A API hospedada permanece uma evolução independente; não se deve chamar localhost a partir do site público.

Consequência: as telas compartilham marcação e carregamento, mas têm URLs e conteúdo próprios. Futuras alterações dos cálculos precisam continuar testadas para ambos os modos de distribuição dos dados.
