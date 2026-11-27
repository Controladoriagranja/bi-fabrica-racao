/* Base comum entre segmentos para que a pilha reconcilie com o total existente. */
window.ConsumoRacaoStacked = Object.freeze({
  periods(rows, grouping, metric) {
    const valid=rows.filter(row=>Number.isFinite(row.consumo_total)
      &&ConsumoRacaoData.phases.every(phase=>Number.isFinite(row[phase.key]))
      &&(metric==='total'||row.qtde_aves>0));
    return ConsumoRacaoData.evolution(valid,grouping).map(item=>({
      name:item.name,records:item.records,birds:item.birds,
      total:metric==='total'?item.total:item.perBird.value,
      values:item.phases.map(phase=>metric==='total'?phase.total:phase.perBird.value)
    }));
  }
});
