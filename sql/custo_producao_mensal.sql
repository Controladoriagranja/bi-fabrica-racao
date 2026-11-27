-- Uma linha por fábrica/mês. Totais por produto não se somam aos grupos/subgrupos.
CREATE OR REPLACE VIEW fabrica_racao.custo_producao_mensal AS
WITH custos AS (
 SELECT empresa_codigo, planta_codigo, max(planta) AS planta, ano, mes,
 max(producao_periodo) FILTER (WHERE quadro='movimentacao_e_custos_unitarios') AS producao_kg,
 max(custo_direto) FILTER (WHERE quadro='valores') AS materia_prima,
 max(alocado_por_rateio) FILTER (WHERE quadro='valores') AS gastos_operacionais,
 max(frete_rateio) FILTER (WHERE quadro='valores') AS frete,
 max(importado_em) AS atualizado_em
 FROM fabrica_racao.custo_producao
 WHERE secao='produto' AND tipo_linha='total' AND tipo_custo='G' AND base_preco='C' AND lista_gastos
 GROUP BY empresa_codigo,planta_codigo,ano,mes
), dias AS (
 SELECT planta_codigo,extract(year FROM data_referencia)::int AS ano,
 extract(month FROM data_referencia)::int AS mes,
 count(DISTINCT data_referencia) FILTER (WHERE valor>0) AS dias_producao,
 max(importado_em) AS atualizado_em
 FROM fabrica_racao.resumo_gerencial
 WHERE secao='Dados Produção' AND descricao='Produção' AND tipo_periodo='dia'
 AND empresa_consulta='1' AND unidade_consulta='1' AND turno='0'
 GROUP BY planta_codigo,extract(year FROM data_referencia),extract(month FROM data_referencia)
)
SELECT c.empresa_codigo,c.planta_codigo,c.planta,c.ano,c.mes,
 make_date(c.ano,c.mes,1) AS data_referencia,
 c.producao_kg,d.dias_producao,
 c.producao_kg/nullif(d.dias_producao,0) AS producao_diaria,
 c.materia_prima,c.gastos_operacionais,c.frete,
 c.materia_prima+c.gastos_operacionais+c.frete AS custo_total,
 c.materia_prima/nullif(c.producao_kg,0) AS materia_prima_kg,
 c.gastos_operacionais/nullif(c.producao_kg,0) AS gastos_operacionais_kg,
 c.frete/nullif(c.producao_kg,0) AS frete_kg,
 (c.materia_prima+c.gastos_operacionais+c.frete)/nullif(c.producao_kg,0) AS custo_total_kg,
 greatest(c.atualizado_em,d.atualizado_em) AS importado_em,
 c.empresa_codigo||'/'||c.planta_codigo||'/'||c.ano||'/'||c.mes AS chave_hash
FROM custos c LEFT JOIN dias d USING(planta_codigo,ano,mes);
GRANT SELECT ON fabrica_racao.custo_producao_mensal TO granjabiadmin;
