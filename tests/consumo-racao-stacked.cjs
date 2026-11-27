const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['data','stacked'])vm.runInContext(fs.readFileSync(path.join(__dirname,`../assets/js/consumo-racao-${file}.js`),'utf8'),ctx);
const keys=ctx.ConsumoRacaoData.phases.map(p=>p.key);
function row(date,birds,values){const r={data:date,qtde_aves:birds};keys.forEach((key,i)=>r[key]=values[i]);r.consumo_total=values.some(v=>v===null)?null:values.reduce((s,v)=>s+v,0);return r;}
const rows=[row('2026-11-02',10,[2,10,20,18]),row('2026-11-03',90,[18,90,180,162]),row('2026-11-03',20,[4,null,40,36]),row('2026-11-09',0,[1,2,3,4])];
const S=ctx.ConsumoRacaoStacked;
const weekly=S.periods(rows,'semana','perBird');assert.equal(weekly.length,1);assert.equal(weekly[0].name,'2026-11-02');
assert.equal(weekly[0].total,5);assert.equal(weekly[0].birds,100);assert.equal(weekly[0].records,2);
assert.deepEqual(Array.from(weekly[0].values),[.2,1,2,1.8]);
assert.equal(weekly[0].values.reduce((s,v)=>s+v,0),weekly[0].total);
const totals=S.periods(rows,'mes','total');assert.equal(totals.length,1);assert.equal(totals[0].total,510);assert.equal(totals[0].records,3);
assert.equal(totals[0].values.reduce((s,v)=>s+v,0),totals[0].total);
assert.equal(S.periods(rows,'dia','perBird').length,2);
assert.equal(S.periods([],'dia','total').length,0);
assert.equal(S.periods([row('2026-11-02',10,[0,0,0,0])],'dia','perBird')[0].total,0);
console.log('PASS: day/week/month, weighted ratios, matching stack/total, missing phases, zero birds and actual zero.');
