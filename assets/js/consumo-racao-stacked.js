/* Base comum entre segmentos para que a pilha reconcilie com o total existente. */
window.ConsumoRacaoStacked = Object.freeze({
  visibleCount(width, metric, count) {
    // Reserve enough horizontal room for actual labels, especially large kg totals.
    const slot=metric==='total'?190:145;
    return Math.max(1,Math.min(count,Math.floor(Math.max(0,width-48)/slot)));
  },
  layout(periods) {
    const positive=periods.map(item=>item.total).filter(value=>value>0);
    const min=positive.length?Math.min(...positive):0, max=positive.length?Math.max(...positive):0;
    return periods.map(item=>{
      // Schematic heights: preserve ordering with a restrained range, never a numeric axis.
      const height=item.total>0?(max>min?.8+.2*(item.total-min)/(max-min):1):0;
      return {...item,height,blocks:ConsumoRacaoData.phases.map(()=>height/ConsumoRacaoData.phases.length)};
    });
  },
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
