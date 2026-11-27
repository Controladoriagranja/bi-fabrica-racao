(() => {
 'use strict';
 const E=id=>document.getElementById(id),query=new URLSearchParams(location.search),months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 const fields=[['ano','Ano'],['mes','Mês'],['planta_codigo','Fábrica']].map(([apiKey,label])=>({id:'material_'+apiKey,apiKey,label,multi:true,search:true}));
 const columns=[['codigo','Material',0],['descricao','Descrição',0],['uso_kg','Uso (kg)',2],['uso_real_kg','Uso real (kg)',2],['percentual_uso','Uso (%)',2],['custo_medio','Custo médio (R$/kg)',4],['valor','Valor (R$)',2],['percentual_valor','Valor (%)',2],['custo_reposicao_unitario','Reposição (R$/kg)',4],['custo_reposicao','Custo reposição (R$)',2],['variacao_percentual','Variação (%)',2]];
 let rows=[],sort='valor',direction=-1,request;
 const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
 const num=(v,d=2)=>v==null?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
 for(const f of fields){const host=text('div','','filter-field');host.append(text('span',f.label));const control=text('div','','checkbox-multiselect');control.id=f.id;host.append(control);E('costFilters').append(host);}
 class MaterialsFilters extends FilterController{
  normalizeOptions(field,items){return items;}
  summary(s){return s.options.length&&s.selected.size===s.options.length?'Todos':!s.selected.size?'Nenhum':super.summary(s);}
  values(){const out=super.values();for(const f of fields){const s=this.getState(f);if(s.options.length&&!s.selected.size)out[f.apiKey]=['__nenhum__'];}return out;}
 }
 const filters=new MaterialsFilters({fields,includeDependentRefresh:false,onChange:render});
 function options(preserve=false,initial=false){for(const f of fields){const s=filters.getState(f),old=[...s.selected],all=s.selected.size===s.options.length;
  const map=new Map();for(const r of rows)map.set(String(r[f.apiKey]),f.apiKey==='mes'?months[Number(r.mes)-1]:f.apiKey==='planta_codigo'?r.planta:String(r.ano));
  // O período do link permanece selecionável enquanto o histórico é importado.
  if(initial&&query.has(f.apiKey)&&!map.has(query.get(f.apiKey)))map.set(query.get(f.apiKey),f.apiKey==='mes'?months[Number(query.get(f.apiKey))-1]:f.apiKey==='planta_codigo'?(query.get(f.apiKey)==='5'?'Fabrica Racao Salome':'Fabrica Racao Igaratinga'):query.get(f.apiKey));
  const list=[...map].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR',{numeric:true}));
  filters.renderMultiOptions(f,list,initial&&query.has(f.apiKey)?[query.get(f.apiKey)]:preserve&&!all?old:list.map(x=>x.value));}}
 function render(){
  const selected=filters.values(),data=rows.filter(r=>fields.every(f=>!selected[f.apiKey]?.length||selected[f.apiKey].includes(String(r[f.apiKey])))),search=E('materialSearch').value.trim().toLocaleLowerCase('pt-BR');
  const details=data.filter(r=>r.tipo_linha==='detalhe'&&(!search||(r.codigo+' '+r.descricao).toLocaleLowerCase('pt-BR').includes(search)));
  details.sort((a,b)=>{const x=a[sort],y=b[sort];if(x==null)return y==null?0:1;if(y==null)return -1;return direction*(sort==='codigo'||sort==='descricao'?String(x).localeCompare(String(y),'pt-BR',{numeric:true}):Number(x)-Number(y));});
  E('materialHeaders').replaceChildren();for(const [key,label]of columns){const th=text('th','');th.scope='col';th.setAttribute('aria-sort',sort===key?(direction===1?'ascending':'descending'):'none');const button=text('button',label+' '+(sort===key?(direction===1?'↑':'↓'):'↕'));button.type='button';button.onclick=()=>{direction=sort===key?-direction:key==='codigo'||key==='descricao'?1:-1;sort=key;render();};th.append(button);E('materialHeaders').append(th);}
  const body=E('materialRows');body.replaceChildren();
  const contexts=new Set(details.map(r=>r.planta_codigo+'/'+r.ano+'/'+r.mes));
  const multiple=contexts.size>1;
  for(const r of details){const tr=document.createElement('tr');for(const [key,,digits]of columns){const td=text('td',key==='codigo'||key==='descricao'?r[key]||'—':num(r[key],digits),key==='descricao'?'material-name':'');if(key==='descricao'&&multiple)td.append(text('small',' · '+r.planta+' · '+String(r.mes).padStart(2,'0')+'/'+r.ano));tr.append(td);}body.append(tr);}
  if(details.length){const tr=text('tr','','total');for(const [key,,digits]of columns){let value='';if(key==='descricao')value=search?'Total dos materiais filtrados':'Total';if(['uso_kg','uso_real_kg','valor','custo_reposicao'].includes(key))value=num(details.reduce((sum,r)=>sum+Number(r[key]||0),0),digits);tr.append(text('td',value));}body.append(tr);}
  else{const td=text('td','Nenhum material disponível para este período. Se o histórico ainda estiver em importação, atualize novamente.');td.colSpan=columns.length;const tr=text('tr','');tr.append(td);body.append(tr);}
  const plants=[...new Set(data.map(r=>r.planta))],periods=[...new Set(data.map(r=>String(r.mes).padStart(2,'0')+'/'+r.ano))];
  E('materialTitle').textContent='Materiais utilizados'+(plants.length===1?' · '+plants[0]:'')+(periods.length===1?' · '+periods[0]:'');
  E('materialCount').textContent=details.length+' material(is) · Ordene clicando nos títulos das colunas.';
  E('costStatus').textContent='MP Utilizada · Baixa MP · Inclui Núcleos: Não · '+periods.length+' período(s) no recorte.';
 }
 async function load(initial=false){request?.abort();request=new AbortController();E('costReload').disabled=true;E('costStatus').textContent='Consultando materiais…';try{
  const result=[],ids=new Set();let pages=1,total;
  for(let page=1;page<=pages;page++){const p=await apiGet('/api/portal/fabrica_racao/dados/movimentacao_materiais',{pagina:page,tamanho:500},{signal:request.signal});
   if(p.esquema!=='fabrica_racao'||p.tabela!=='movimentacao_materiais'||!Array.isArray(p.dados)||p.pagina!==page||!Number.isSafeInteger(p.total)||p.total>100000||p.tamanho!==500||p.total_paginas!==Math.ceil(p.total/500))throw Error('Resposta incompatível da consulta de materiais.');
   if(page===1){total=p.total;pages=p.total_paginas;}if(total!==p.total)throw Error('Os dados mudaram durante a consulta. Atualize novamente.');
   for(const r of p.dados){if(!r.chave_hash||ids.has(r.chave_hash))throw Error('Registro duplicado na consulta.');ids.add(r.chave_hash);result.push(r);}}
  if(result.length!==total)throw Error('Consulta incompleta. Atualize novamente.');rows=result.filter(r=>r.inclui_nucleos===false);options(!initial,initial);render();
  E('costUpdated').textContent=rows.map(r=>r.importado_em).filter(Boolean).sort().at(-1)?formatarDataHoraBR(rows.map(r=>r.importado_em).filter(Boolean).sort().at(-1)):'—';
 }catch(e){if(e.name!=='AbortError')E('costStatus').textContent=e.message;}finally{E('costReload').disabled=false;}}
 E('materialSearch').oninput=render;E('costReload').onclick=()=>load();E('costClear').onclick=()=>{E('materialSearch').value='';options();render();};
 const back=new URL('custo-producao.html',location.href);for(const f of fields)if(query.has(f.apiKey))back.searchParams.set(f.apiKey,query.get(f.apiKey));E('materialsBack').href=back.href;
 load(true);
})();
