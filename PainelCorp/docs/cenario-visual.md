# Cenário de segurança residencial

Técnica: três fotografias geradas com a ferramenta integrada image_gen, animadas por escala, deslocamento e fusão conforme a rolagem. Não é vídeo contínuo nem navegação 3D.

Percurso: rua/casa/jardim -> central de monitoramento -> câmera no jardim. O progresso usa a altura total rolável e se atualiza quando filtros/recolhimento mudam a página. Sem bloqueio de rolagem. Movimento reduzido mantém a primeira fotografia estática.

Ativos locais: imagens/cena-residencia.png, imagens/cena-central.png e imagens/cena-camera.png. Fontes originais preservadas na pasta generated_images do Codex. Geração integrada, sem nomes de empresas ou imagens privadas.

Direção dos prompts: fotografia cinematográfica realista horizontal, residência contemporânea em concreto e madeira na Grande São Paulo, jardim tropical, entardecer azul e luzes quentes, sem pessoas/marcas/textos. Segunda cena: central com monitores mostrando casa, jardim e rua. Terceira: close de câmera de segurança instalada no jardim. Consistência visual aproximada entre imagens, não reconstrução espacial da mesma casa.

Validação: testes de interface API/JSON passaram. Teste cenario.test.js cobre início, fusões, movimento até último pixel, altura variável e movimento reduzido. Navegador integrado falhou ao conectar; aparência desktop/mobile não confirmada visualmente.

## Revisão: referência enviada pelo usuário
A sequência anterior foi substituída por uma única câmera digital azul (imagens/camera-digital-azul.png). Edição pela ferramenta integrada image_gen da terceira referência: tons vermelhos/laranjas convertidos em azul/ciano, expansão horizontal, números removidos da imagem para camada HTML animada. Os 24 números decorativos mudam com progresso de rolagem e deslocam-se em planos diferentes; não são métricas do painel. Zoom contínuo até fim. Reduced-motion congela. Teste cenario.test.js atualizado para esse comportamento.
