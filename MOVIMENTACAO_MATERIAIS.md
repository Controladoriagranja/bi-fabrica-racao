Movimentação de Materiais com Valores

Fonte: relatório Agrosys wfr200d / wfr200r, menu 19214, módulo 18660.
Parâmetros: MP Utilizada (MP), Baixa MP (B), Inclui Núcleos = Não (no), sem filtro de ordem de produção. Um relatório por empresa/unidade e mês.

- Igaratinga: empresa 1, unidade 53, planta 3.
- Salomé: empresa 2, unidade 11, planta 5.

Tabela: fabrica_racao.movimentacao_materiais. Endpoint autenticado existente do portal: /api/portal/fabrica_racao/dados/movimentacao_materiais.

São preservadas linhas de detalhe, total e resumo por grupo, campos originais, período, processo, carga e fingerprint. O importador valida contexto e concilia uso, uso real, valor e reposição antes da transação. Substituição atômica somente do mês/contexto correspondente. Não aceita substituir um período por outro menor. Acesso SELECT segue a permissão do módulo Fábrica de Ração.

Tela: movimentacao-materiais.html. Parâmetros ano, mes e planta_codigo acompanham o link no Custo Direto e no seu Custo/kg. A pesquisa e ordenação são locais; a tabela tem rolagem vertical e cabeçalho fixo. Os totalizadores da tela são as linhas de total oficiais da origem, preservando custo médio, reposição e variação. Ao selecionar vários períodos ou fábricas, cada contexto mantém seu totalizador próprio. A pesquisa altera apenas os itens visíveis; os totais oficiais continuam referentes ao período completo.

Importante: Baixa MP é uma base diferente da alocação por produto do relatório de Custo Produção. Os valores não são forçados a coincidir. Outubro/2026 foi conciliado com cada relatório original.

Operação interna: movimentacao_materiais_banco.py e infra/movimentacao_materiais.py no extrator de Fábrica de Ração. Integrado à agenda diária existente. Mês corrente acumula de 1 até a data da coleta; no dia 1 também recoleta o mês anterior completo. Checkpoints por data evitam reutilizar um relatório parcial antigo. Contas automáticas 1–3; conta 4 da logística preservada.

Correção de parâmetros: todos os meses de 2026 são recoletados com vparlog1=no, usando checkpoints próprios em sem_nucleos. A tela aceita apenas registros com inclui_nucleos=false; relatórios antigos com Sim não são apresentados. O parser confirma os parâmetros pelo checkpoint do processo antes de importar.
