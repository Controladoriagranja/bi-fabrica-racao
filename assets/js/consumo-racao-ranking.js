/* Ranking de consumo total versus as mesmas metas vigentes da tela. */
window.ConsumoRacaoRanking = (() => {
  'use strict';
  function aggregate(rows, metas, integrated = null) {
    const groups = new Map();
    let excluded = 0;
    for (const row of rows) {
      if (integrated !== null && row.codigo !== integrated) continue;
      const goal = ConsumoRacaoMetas.find(metas, 'consumo_total', row.data);
      if (!Number.isFinite(row.consumo_total) || !(row.qtde_aves > 0) || goal === null) { excluded++; continue; }
      const key = integrated === null ? row.codigo : (row.galpao || 'Não informado');
      if (!groups.has(key)) groups.set(key, {key, label: integrated === null ? `${row.codigo} - ${row.integrado || 'Não informado'}` : `Galpão ${key}`, birds:0, actual:0, expected:0, records:0});
      const item = groups.get(key);
      item.birds += row.qtde_aves; item.actual += row.consumo_total;
      item.expected += goal * row.qtde_aves; item.records++;
    }
    return {excluded, groups:[...groups.values()].map(item => ({...item,
      kgPerBird:(item.actual-item.expected)/item.birds, tonnes:(item.actual-item.expected)/1000,
      comparison:ConsumoRacaoMetas.compare(item.actual/item.birds,item.expected/item.birds)
    }))};
  }
  return Object.freeze({aggregate});
})();

(() => {
  'use strict';
  if(typeof document==='undefined')return;
  const E=id=>document.getElementById(id), host=E('feedRanking'), chartHost=E('feedRankingChart');
  let rows=[], metas=[], integrated=null, measure='perBird', side='above', chart=null, shown=[];
  const num=(v,d=3)=>v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
  function reset(){integrated=null;draw();}
  function draw(){
    const result=ConsumoRacaoRanking.aggregate(rows,metas,integrated);
    const field=measure==='perBird'?'kgPerBird':'tonnes', unit=measure==='perBird'?'kg/ave':'t';
    shown=result.groups.filter(item=>side==='above'?item[field]>0:item[field]<0)
      .sort((a,b)=>Math.abs(b[field])-Math.abs(a[field])||a.label.localeCompare(b.label,'pt-BR'));
    E('feedRankingTitle').textContent=integrated===null?'Ranking de desvios por integrado':`Desvios por galpão · ${rows.find(row=>row.codigo===integrated)?.integrado || integrated}`;
    E('feedRankingBack').hidden=integrated===null;
    E('feedRankingStatus').textContent=`${shown.length} ${integrated===null?'integrados':'galpões'} ${side==='above'?'acima':'abaixo'} da meta · ${unit}${result.excluded?` · ${result.excluded} registros sem consumo completo, aves válidas ou meta vigente`:''}`;
    E('feedRankingEmpty').hidden=shown.length>0;
    E('feedRankingEmpty').textContent=!metas.length?'Metas indisponíveis para calcular o ranking.':'Nenhum desvio nesta seleção.';
    const picker=E('feedRankingPicker');picker.hidden=integrated!==null||!shown.length;
    picker.replaceChildren(new Option('Detalhar integrado…',''),...shown.map(item=>new Option(item.label,item.key)));
    if(!shown.length){chart?.clear();return;}
    chartHost.style.height=`${Math.max(300,shown.length*38+65)}px`;
    const style=getComputedStyle(document.body), color=name=>style.getPropertyValue(name).trim();
    chart??=echarts.init(chartHost);chart.resize();
    chart.setOption({animationDuration:160,textStyle:{fontFamily:style.fontFamily},
      grid:{left:12,right:90,top:18,bottom:30,containLabel:true},
      tooltip:{trigger:'item',renderMode:'richText',confine:true,backgroundColor:color('--card'),borderColor:color('--border'),textStyle:{color:color('--foreground')},
        formatter:p=>{const item=shown[p.dataIndex];return `${item.label}\nDesvio: ${num(item.kgPerBird)} kg/ave · ${num(item.tonnes)} t\nRealizado: ${num(item.actual/item.birds)} kg/ave\nMeta ponderada: ${num(item.expected/item.birds)} kg/ave\nAves: ${num(item.birds,0)} · Registros: ${item.records}`;}},
      xAxis:{type:'value',name:unit,axisLabel:{color:color('--foreground'),fontSize:12},splitLine:{lineStyle:{color:color('--border')}}},
      yAxis:{type:'category',inverse:true,triggerEvent:true,data:shown.map(item=>item.label),axisLabel:{color:color('--foreground'),fontSize:13,width:matchMedia('(max-width:767px)').matches?115:260,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false}},
      series:[{type:'bar',barMaxWidth:24,label:{show:true,position:side==='above'?'right':'left',color:color('--foreground'),formatter:p=>num(p.value)},
        data:shown.map(item=>({value:item[field],itemStyle:{color:color('--feed-'+item.comparison.tier+'-text')}}))}]
    },true);
    chart.off('click');chart.on('click',event=>{
      if(integrated!==null)return;
      const item=event.componentType==='yAxis'?shown.find(item=>item.label===event.value):shown[event.dataIndex];
      if(item){integrated=item.key;draw();}
    });
    chart.getZr().off('click');chart.getZr().on('click',event=>{if(!event.target&&integrated!==null)reset();});
  }
  E('feedRankingPicker').onchange=event=>{if(event.target.value){integrated=event.target.value;draw();}};
  E('feedRankingBack').onclick=reset;
  host.querySelectorAll('[data-ranking-measure]').forEach(button=>button.onclick=()=>{
    measure=button.dataset.rankingMeasure;integrated=null;
    host.querySelectorAll('[data-ranking-measure]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));draw();
  });
  host.querySelectorAll('[data-ranking-side]').forEach(button=>button.onclick=()=>{
    side=button.dataset.rankingSide;integrated=null;
    host.querySelectorAll('[data-ranking-side]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));draw();
  });
  document.addEventListener('click',event=>{if(integrated!==null&&(!host.contains(event.target)||event.target.closest('[data-feed-metric],[data-feed-period]')))reset();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('.if-dialog[open]')&&integrated!==null)reset();});
  document.addEventListener('feed:ranking-data',event=>{rows=event.detail.rows;metas=event.detail.metas;integrated=null;draw();});
  document.addEventListener('dashboard:theme-changed',draw);
  new ResizeObserver(()=>{chart?.resize();}).observe(host);
})();
