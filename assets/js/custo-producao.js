/* Os indicadores mensais são calculados na view SQL; aqui apenas apresentação e diferença entre meses. */
(() => {
 'use strict';
 const E=id=>document.getElementById(id), endpoint='/api/portal/fabrica_racao/dados/custo_producao_mensal';
 const fields=[['ano','Ano'],['mes','Mês'],['planta_codigo','Fábrica']].map(([apiKey,label])=>({id:'cost_'+apiKey,apiKey,label,multi:true,search:true}));
 const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 let rows=[],request,version=0;
 const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
 const num=(v,d=2)=>v==null?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
 for(const field of fields){const host=text('div','','filter-field');host.append(text('span',field.label));const control=text('div','','checkbox-multiselect');control.id=field.id;host.append(control);E('costFilters').append(host);}
 class CostFilters extends FilterController{
  normalizeOptions(field,items){return items;}
  summary(state){if(state.options.length&&state.selected.size===state.options.length)return 'Todos';if(!state.selected.size)return 'Nenhum';return super.summary(state);}
  values(){const result=super.values();for(const field of fields){const state=this.getState(field);if(state.options.length&&!state.selected.size)result[field.apiKey]=['__nenhum__'];}return result;}
 }
 const filters=new CostFilters({fields,includeDependentRefresh:false,onChange:()=>render()});
 function options(){for(const field of fields){const found=new Map();for(const row of rows){const v=String(row[field.apiKey]);found.set(v,field.apiKey==='mes'?months[Number(v)-1]:field.apiKey==='planta_codigo'?row.planta:v);}
 const list=[...found].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR',{numeric:true}));
 filters.renderMultiOptions(field,list,list.map(x=>x.value));}}
 function render(){
  const selected=filters.values(),data=rows.filter(row=>fields.every(f=>!selected[f.apiKey]?.length||selected[f.apiKey].includes(String(row[f.apiKey]))));
  const out=E('costTables');out.replaceChildren();
  const plants=[...new Set(data.map(r=>r.planta_codigo))].sort((a,b)=>String(a).localeCompare(String(b)));
  for(const plant of plants){
   const records=data.filter(r=>r.planta_codigo===plant).sort((a,b)=>a.ano-b.ano||a.mes-b.mes);
   const section=text('section','','card cost-section');section.append(text('h2',records[0].planta));section.append(text('p','Gerencial · Base contábil · Produção em kg · Custos em R$'));
   const scroll=text('div','','cost-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Comparativo mensal de '+records[0].planta);
   const table=text('table','','cost-table'),head=document.createElement('thead'),top=document.createElement('tr'),bottom=document.createElement('tr');
   const title=text('th','Descrição');title.rowSpan=2;title.scope='col';top.append(title);
   for(const row of records){const th=text('th',String(row.mes).padStart(2,'0')+'/'+String(row.ano).slice(-2));th.colSpan=2;th.scope='colgroup';top.append(th);for(const label of ['Qtde / Valor','Custo / kg']){const th=text('th',label);th.scope='col';bottom.append(th);}}
   const variation=text('th','Variação');variation.rowSpan=2;variation.scope='col';top.append(variation);head.append(top,bottom);table.append(head);
   const body=document.createElement('tbody'),last=records.at(-1),previous=records.find(r=>r.ano*12+r.mes===last.ano*12+last.mes-1);
   const metrics=[['producao_kg','Produção Ração',null,0],['dias_producao','Dias de Produção',null,0],['producao_diaria','Produção Diária',null,0],['materia_prima','Custo Direto (Matéria Prima) 302','materia_prima_kg',2],['gastos_operacionais','Alocado Rateio (Gastos Operacionais) 301','gastos_operacionais_kg',2],['frete','Frete Rateio (Frete) 304 - RAÇÃO MT','frete_kg',2],['custo_total','Custo Total','custo_total_kg',2]];
   for(const [key,label,perKg,digits] of metrics){const tr=text('tr','',key==='custo_total'?'total':perKg?'':'quantity');tr.append(text('th',label));tr.firstChild.scope='row';
    for(const row of records){const td=text('td',num(row[key],digits));if(!perKg){td.colSpan=2;td.className='month-end';tr.append(td);}else tr.append(td,text('td',num(row[perKg]),'month-end'));}
    const field=perKg||key,delta=previous&&last[field]!=null&&previous[field]!=null?Number(last[field])-Number(previous[field]):null;
    const td=text('td',num(delta,perKg?2:digits),'variance');td.title=previous?'Último mês menos o mês anterior'+(perKg?' · R$/kg':''):'Sem mês anterior selecionado e disponível';
    if(delta)td.classList.add((perKg?delta>0:delta<0)?'adverse':'favorable');tr.append(td);body.append(tr);
   }
   table.append(body);scroll.append(table);section.append(scroll);out.append(section);
  }
  if(!data.length)out.append(text('div','Nenhum mês disponível para os filtros selecionados.','card cost-empty'));
  E('costStatus').textContent=rows.length?data.length+' registro(s) de fábrica/mês · somente meses importados · valores sem base aparecem como —.':'Ainda não há dados importados.';
 }
 async function load(){const id=++version;request?.abort();request=new AbortController();E('costReload').disabled=true;E('costStatus').textContent='Consultando produção e custos…';
  try{const result=[],ids=new Set();let count,pages=1;
   for(let page=1;page<=pages;page++){const p=await apiGet(endpoint,{pagina:page,tamanho:500},{signal:request.signal});
    if(p.esquema!=='fabrica_racao'||p.tabela!=='custo_producao_mensal'||!Array.isArray(p.dados)||p.pagina!==page||!Number.isSafeInteger(p.total)||p.total>10000||p.tamanho!==500||p.total_paginas!==Math.ceil(p.total/500))throw Error('Resposta incompatível da consulta de custos.');
    if(page===1){count=p.total;pages=p.total_paginas;}if(p.total!==count||p.total_paginas!==pages)throw Error('Os dados mudaram durante a consulta. Atualize novamente.');
    for(const row of p.dados){if(!row.chave_hash||ids.has(row.chave_hash))throw Error('Mês duplicado na consulta.');ids.add(row.chave_hash);result.push(row);}}
   if(result.length!==count)throw Error('Consulta incompleta. Atualize novamente.');if(id!==version)return;rows=result;options();render();
   const updated=rows.map(r=>r.importado_em).filter(Boolean).sort().at(-1);E('costUpdated').textContent=updated?formatarDataHoraBR(updated):'—';
  }catch(e){if(e.name!=='AbortError'&&id===version){rows=[];E('costTables').replaceChildren();E('costUpdated').textContent='—';E('costStatus').textContent=e.message;}}
  finally{if(id===version)E('costReload').disabled=false;}}
 E('costReload').onclick=load;E('costClear').onclick=()=>{options();render();};load();
})();
