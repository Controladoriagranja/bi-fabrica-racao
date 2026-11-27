# BI Fábrica de Ração

Relatórios: **Consumo Médio de Ração**, em `index.html`, e **Custo Produção**, em `custo-producao.html`.
Importado do `bi-zootecnico`, preservando filtros, cálculos, metas, gráficos e detalhamento. O projeto de origem foi preservado.

## Dados e acesso

Reutiliza a sessão da Central (`sessionStorage.granjabi_auth_token`) e o Worker configurado em `assets/js/config.js`. Não inclui credenciais nem backend.

- Consumo: `/api/portal/fabrica_racao/dados/consumo_medio_racao`
- Metas: `/api/portal/fabrica_racao/dados/metas`
- Custo Produção: `/api/portal/fabrica_racao/dados/custo_producao_mensal`

## Custo Produção

View de leitura definida em `sql/custo_producao_mensal.sql`, sobre as tabelas `custo_producao` e `resumo_gerencial`. A consulta conserva a autorização do módulo Fábrica de Ração na Central/Worker. Uma linha por fábrica/mês, gerencial/base contábil; usa os totais de alocação por produto, sem duplicar grupos/subgrupos. Dias são datas distintas com produção positiva; ausência não é zero.

Produção diária = produção mensal em kg / dias com produção. Cada custo por kg = custo / produção mensal, conforme a referência de outubro/2026. Custo total = matéria-prima + rateio operacional + rateio de frete; outros componentes do ERP não entram nessa definição. Variação compara os dois últimos meses consecutivos selecionados, sem arredondamento intermediário. Só são mostrados meses importados; outubro/2026 é o recorte inicial.

O acesso real deve ser validado pela Central na origem autorizada. Localmente, `?demo=1` em localhost ativa exclusivamente dados sintéticos, sinalizados na tela, sem fallback automático em produção.

## Verificação local

```powershell
node tests/consumo-racao-model.cjs
node tests/consumo-racao-metas.cjs
python -m http.server 8080
```

Abra `http://localhost:8080/?demo=1` para demonstração. O endereço `consumo-medio-racao.html` encaminha para a p?gina principal, preservando parâmetros e fragmento.

Publicação e cadastro na Central não foram realizados nesta importação.
