const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['data','metas','ranking'])vm.runInContext(fs.readFileSync(path.join(root,`assets/js/consumo-racao-${file}.js`),'utf8'),ctx);
const M=ctx.ConsumoRacaoMetas,R=ctx.ConsumoRacaoRanking;
const metas=Object.values(M.mapping).flat().map(code=>({code,date:'2026-01-01',value:1}));
const row=(codigo,galpao,birds,total,date='2026-11-01')=>({codigo,integrado:`Integrado ${codigo}`,galpao,qtde_aves:birds,consumo_total:total,data:date});
const rows=[row('A','1',10,60),row('A','2',90,405),row('B','1',20,110),row('A','3',0,100),row('A','4',20,null),row('C','1',10,50,'2025-01-01')];
const all=R.aggregate(rows,metas);
assert.equal(all.excluded,3);assert.equal(all.groups.length,2);
const a=all.groups.find(g=>g.key==='A'),b=all.groups.find(g=>g.key==='B');
assert.equal(a.actual,465);assert.equal(a.expected,500);assert.equal(a.birds,100);
assert.equal(a.kgPerBird,-.35);assert.equal(a.tonnes,-.035);assert.equal(b.kgPerBird,.5);
assert.notEqual(a.kgPerBird,(1-.5)/2); // ratio of sums, not simple average
const drill=R.aggregate(rows,metas,'A');assert.equal(drill.groups.length,2);assert.equal(drill.excluded,2);
assert.equal(drill.groups.find(g=>g.key==='1').actual,60); // B's same galpao must not enter A
assert.ok(Math.abs(drill.groups.reduce((s,g)=>s+g.tonnes,0)-a.tonnes)<1e-12);
assert.equal(R.aggregate(rows,[]).groups.length,0);
const newer=metas.concat(metas.map(m=>({...m,date:'2026-11-01',value:2})));
assert.equal(R.aggregate([row('D','1',10,100)],newer).groups[0].expected,100);
console.log('PASS: signed deviations, weighted base, tonnes, drilldown isolation, missing inputs and effective targets.');

// Exercise the real UI handlers with a minimal DOM/chart adapter, without network calls.
const events={},elements=new Map(),clicks={},zr={};let option;
function el(id){if(!elements.has(id))elements.set(id,{style:{},hidden:false,textContent:'',dataset:{},replaceChildren(...items){this.children=items;},setAttribute(){},contains(target){return target.inside===true;}});return elements.get(id);}
const measures=['perBird','total'].map(value=>({...el('measure-'+value),dataset:{rankingMeasure:value}}));
const sides=['above','below'].map(value=>({...el('side-'+value),dataset:{rankingSide:value}}));
el('feedRanking').querySelectorAll=selector=>selector.includes('measure')?measures:sides;
const chart={resize(){},clear(){option=null;},setOption(value){option=value;},off(){},on(name,fn){clicks[name]=fn;},getZr(){return {off(){},on(name,fn){zr[name]=fn;}};}};
Object.assign(ctx,{document:{body:{},getElementById:el,querySelector:()=>null,addEventListener:(name,fn)=>events[name]=fn},
  Option:function(label,value){this.label=label;this.value=value;},getComputedStyle:()=>({fontFamily:'sans-serif',getPropertyValue:()=> '#B36B00'}),
  matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},echarts:{init:()=>chart}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/consumo-racao-ranking.js'),'utf8'),ctx);
const supply=()=>events['feed:ranking-data']({detail:{rows,metas}});
const drillIntoB=()=>{clicks.click({componentType:'series',dataIndex:0});assert.equal(el('feedRankingBack').hidden,false);assert.match(el('feedRankingTitle').textContent,/galp/);};
supply();assert.equal(option.series[0].data[0].value,.5);drillIntoB();
el('feedRankingBack').onclick();assert.equal(el('feedRankingBack').hidden,true);
drillIntoB();events.click({target:{closest:()=>null}});assert.equal(el('feedRankingBack').hidden,true);
drillIntoB();measures[1].onclick();assert.equal(el('feedRankingBack').hidden,true);assert.equal(option.series[0].data[0].value,.01);
drillIntoB();zr.click({target:null});assert.equal(el('feedRankingBack').hidden,true);
sides[1].onclick();assert.equal(option.series[0].data[0].value,-.035);
clicks.click({componentType:'yAxis',value:option.yAxis.data[0]});assert.equal(el('feedRankingBack').hidden,false);
supply();assert.equal(el('feedRankingBack').hidden,true);
events['feed:ranking-data']({detail:{rows:[],metas:[]}});assert.equal(option,null);assert.equal(el('feedRankingEmpty').hidden,false);
console.log('PASS: chart drilldown, back, outside click, blank canvas, measure switch, side switch, filter reset and empty state.');
