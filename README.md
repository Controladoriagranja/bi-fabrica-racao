# BI Fábrica de Ração

Relatório com uma tela: **Consumo Médio de Ração**, disponível em `index.html`.
Importado do `bi-zootecnico`, preservando filtros, cálculos, metas, gráficos e detalhamento. O projeto de origem foi preservado.

## Dados e acesso

Reutiliza a sessão da Central (`sessionStorage.granjabi_auth_token`) e o Worker configurado em `assets/js/config.js`. Não inclui credenciais nem backend.

- Consumo: `/api/portal/fabrica_racao/dados/consumo_medio_racao`
- Metas: `/api/portal/fabrica_racao/dados/metas`

O acesso real deve ser validado pela Central na origem autorizada. Localmente, `?demo=1` em localhost ativa exclusivamente dados sintéticos, sinalizados na tela, sem fallback automático em produção.

## Verificação local

```powershell
node tests/consumo-racao-model.cjs
node tests/consumo-racao-metas.cjs
python -m http.server 8080
```

Abra `http://localhost:8080/?demo=1` para demonstração. O endereço `consumo-medio-racao.html` encaminha para a p?gina principal, preservando parâmetros e fragmento.

Publicação e cadastro na Central não foram realizados nesta importação.
