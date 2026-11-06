/* Bogus Boys 2027 - official Supabase playoff viewer. Read-only until secure playoff finalization exists. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>x===null||x===undefined||x===''||!Number.isFinite(Number(x))?null:Number(x);
const show=x=>x==null?'—':Number.isInteger(x)?String(x):Number(x.toFixed(2)).toString();
const table=(rows,headers)=>`<div class="playoff-table-scroll"><table class="playoff-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}">No official results yet.</td></tr>`}</tbody></table></div>`;
const award=(rank,r)=>r===1?Math.max(0,540-20*rank):r===2?Math.max(0,1700-100*rank):[4800,4200,3600,3000,2400,1800,1200,600][rank-1]||0;
async function all(q,label){const rows=[];for(let i=0;;i+=1000){const {data,error}=await q.range(i,i+999);if(error)throw Error(label+': '+error.message);rows.push(...(data||[]));if(!data||data.length<1000)return rows;}}
function net(r){const gross=num(r?.gross_score),hcp=num(r?.handicap_used);return gross==null||hcp==null?null:gross-hcp;}
function place(players,r,rounds){const values=players.map(p=>({...p,net:net(rounds.get(p.id))})).filter(p=>p.net!==null).sort((a,b)=>a.net-b.net||a.seed-b.seed);
for(let i=0;i<values.length;){let j=i+1;while(j<values.length&&values[j].net===values[i].net)j++;const pts=Array.from({length:j-i},(_,k)=>award(i+k+1,r)).reduce((a,b)=>a+b,0)/(j-i);for(let k=i;k<j;k++){values[k].place=i+1;values[k].award=pts;}i=j;}return new Map(values.map(p=>[p.id,p]));}
function render(golfers,weeks,rounds){
 const earned=new Map();for(const round of rounds){if(round.week_id && weeks.regIds.has(round.week_id)&&round.finalized&&num(round.bb_points)!==null){const a=earned.get(round.golfer_id)||[];a.push(Number(round.bb_points));earned.set(round.golfer_id,a);}}
 const seeds=golfers.filter(g=>g.active&&g.kind!=='guest'&&['A','B'].includes(g.flight)).map(g=>{const a=(earned.get(g.id)||[]).sort((x,y)=>y-x);return {id:g.id,name:g.display_name,flight:g.flight,best:a.slice(0,8).reduce((x,y)=>x+y,0),all:a.reduce((x,y)=>x+y,0),count:a.length};}).sort((a,b)=>b.best-a.best||b.all-a.all||a.name.localeCompare(b.name)).map((g,i)=>({...g,seed:i+1,seedPts:1000-i*10,total:1000-i*10}));
 $('seed-count').textContent=seeds.length;
 $('seeds').innerHTML=table(seeds.map(p=>`<tr><td>${p.seed}</td><td><strong>${esc(p.name)}</strong></td><td>Flight ${esc(p.flight)}</td><td>${show(p.best)}</td><td class="gold-text">${show(p.seedPts)}</td></tr>`),['SEED','GOLFER','SEASON FLIGHT','BEST 8 BBPts','NEW SEED POINTS']);
 let eligible=seeds,finished=0;
 for(let r=1;r<=3;r++){
  const week=weeks.playoff.get(r),prior=weeks.playoff.get(r-1),unlocked=r===1||prior?.status==='finalized';
  const rs=new Map(rounds.filter(x=>x.week_id===week?.id).map(x=>[x.golfer_id,x]));
  const placed=place(eligible,r,rs);
  const ranked=eligible.map(p=>({...p,net:placed.get(p.id)?.net??null,place:placed.get(p.id)?.place??null,award:placed.get(p.id)?.award??null,total:p.total+(placed.get(p.id)?.award||0)})).sort((a,b)=>b.total-a.total||(a.net??Infinity)-(b.net??Infinity)||a.seed-b.seed);
  const complete=Boolean(week&&week.status==='finalized'&&eligible.length&&eligible.every(p=>rs.get(p.id)?.finalized&&net(rs.get(p.id))!==null));
  const cutoff=[0,16,8,4][r];
  $('round-'+r).innerHTML=unlocked?table(ranked.map((p,i)=>`<tr class="${complete&&i<cutoff?'advance':''}"><td>${i+1}</td><td><strong>${esc(p.name)}</strong>${complete&&i<cutoff?' <span class="qualifier">ADVANCES</span>':''}</td><td>${show(p.total-(p.award||0))}</td><td>${show(p.net)}</td><td>${show(p.place)}</td><td>${show(p.award)}</td><td class="gold-text">${show(p.total)}</td></tr>`),['RANK','GOLFER','POINTS IN','ROUND NET','FINISH','AWARDED','CUMULATIVE']):'<p class="empty-message">Waiting for the previous playoff round to be finalized.</p>';
  $('round-'+r+'-status').textContent=!week?'Playoff week missing from Supabase':complete?`Finalized · Top ${Math.min(cutoff,eligible.length)} advance`:unlocked?'Awaiting official finalized scores — provisional values do not advance golfers':'Waiting for previous round';
  if(complete){finished++;eligible=ranked.slice(0,cutoff);}else eligible=[];
 }
 $('status').textContent=finished+' of 3 qualifying rounds finalized';
 const last=weeks.playoff.get(4),fr=new Map(rounds.filter(x=>x.week_id===last?.id).map(x=>[x.golfer_id,x]));
 const finalists=eligible.map(p=>({...p,net:net(fr.get(p.id))})).sort((a,b)=>(a.net??Infinity)-(b.net??Infinity)||a.seed-b.seed);
 const complete=Boolean(last&&last.status==='finalized'&&finalists.length&&finalists.every(p=>fr.get(p.id)?.finalized&&p.net!==null));
 $('final').innerHTML=finalists.length?table(finalists.map((p,i)=>`<tr><td>${complete?i+1:'—'}</td><td><strong>${esc(p.name)}</strong></td><td>${show(p.net)}</td></tr>`),['PLACE','FINALIST','CHAMPIONSHIP NET']):'<p class="empty-message">The Final Four will appear after Round 3 is finalized.</p>';
 const winners=complete?finalists.filter(p=>p.net===finalists[0].net):[];
 $('champion').textContent=!complete?'Championship awaits the Final Four':winners.length===1?'CHAMPION: '+winners[0].name:'TIED FOR CHAMPIONSHIP: '+winners.map(p=>p.name).join(' / ');
 $('champion-note').textContent='Official Supabase results only. Playoff scoring and finalization must be implemented separately.';
}
async function init(){
 if(!window.supabase?.createClient||!window.BB_SUPABASE_CONFIG)throw Error('Supabase configuration is missing');
 const db=window.supabase.createClient(window.BB_SUPABASE_CONFIG.url,window.BB_SUPABASE_CONFIG.publishableKey);
 const {data:leagues,error:e}=await db.from('leagues').select('id').eq('season',2027).eq('name','Bogus Boys').limit(1);if(e)throw e;if(!leagues?.length)throw Error('2027 league not found');
 const id=leagues[0].id;
 const [golfers,weekRows]=await Promise.all([all(db.from('golfers').select('id,display_name,flight,kind,active').eq('league_id',id).order('id'),'Golfers'),all(db.from('weeks').select('id,week_type,week_number,status').eq('league_id',id).order('id'),'Weeks')]);
 const regIds=new Set(weekRows.filter(w=>w.week_type==='regular'&&w.status==='finalized').map(w=>w.id));
 const playoff=new Map(weekRows.filter(w=>w.week_type==='playoff').map(w=>[w.week_number,w]));
 const ids=[...regIds,...[...playoff.values()].map(w=>w.id)];let rounds=[];
 for(let i=0;i<ids.length;i+=40){rounds.push(...await all(db.from('rounds').select('week_id,golfer_id,gross_score,handicap_used,bb_points,finalized').in('week_id',ids.slice(i,i+40)).order('week_id').order('golfer_id'),'Rounds'));}
 render(golfers,{regIds,playoff},rounds);
}
init().catch(e=>{console.error(e);$('status').textContent='Unable to load live playoffs';$('seeds').textContent='Supabase error: '+e.message;});
})();
