/* Bogus Boys 2027 - official Supabase playoff viewer. Live Supabase playoff scoring. */
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
let editor=null;
function playoffTee(golferId,roundNumber){
 const first=editor.weeks.playoff.get(1);
 const original=editor.rounds.find(x=>x.week_id===first?.id&&x.golfer_id===golferId);
 if(roundNumber>1)return original?.tee_box||null;
 return original?.tee_box||editor.pendingTees?.get(golferId)||null;
}
function currentHcp(golferId,roundNumber){
 const engine=window.BBHandicap2027;
 if(!engine?.calculateLeagueHandicap)return null;
 const current=editor.weeks.playoff.get(roundNumber);
 if(!current)return null;
 const earlier=editor.chronology.filter(w=>w.status==='finalized'&&(
   w.week_type==='regular'||w.week_type==='playoff') &&
   (w.week_type==='regular'||w.week_number<roundNumber));
 const earlierIds=new Set(earlier.map(w=>w.id));
 const order=new Map(earlier.map((w,i)=>[w.id,i]));
 const history=editor.rounds.filter(r=>r.golfer_id===golferId&&r.finalized&&earlierIds.has(r.week_id))
  .sort((a,b)=>order.get(a.week_id)-order.get(b.week_id))
  .map(r=>({score:r.gross_score,rating:r.course_rating,slope:r.slope_rating}));
 const golfer=editor.golfers.find(g=>g.id===golferId);
 return engine.calculateLeagueHandicap(history,golfer?.starting_handicap).playingHandicap;
}
function scoreInput(p,week,roundNumber,existing){
 const hcp=existing?.handicap_used??currentHcp(p.id,roundNumber);
 const tee=playoffTee(p.id,roundNumber);
 const teeControl=roundNumber===1
  ? `<select data-playoff-tee="${esc(p.id)}" data-tee-week="${esc(week.id)}" aria-label="${esc(p.name)} tee" ${existing?.tee_box?'disabled':''}><option value="">Select tees</option>${['white','gold'].map(t=>`<option value="${t}" ${tee===t?'selected':''}>${t.toUpperCase()}</option>`).join('')}</select>`
  : `<span>${esc(tee?tee.toUpperCase():'Round 1 tee missing')}</span>`;
 return `<input type="number" min="9" max="100" step="1" style="width:70px" data-score-week="${esc(week.id)}" data-score-golfer="${esc(p.id)}" data-score-field="gross_score" value="${esc(existing?.gross_score??'')}" aria-label="${esc(p.name)} gross score"> <strong>HCP ${show(hcp)}</strong> ${teeControl}`;
}

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
   const canEdit=Boolean(editor?.commissioner&&week?.status==='open'&&unlocked);
   const scoreCell=p=>canEdit?scoreInput(p,week,r,rs.get(p.id)):show(p.net);
  $('round-'+r).innerHTML=unlocked?table(ranked.map((p,i)=>`<tr class="${complete&&i<cutoff?'advance':''}"><td>${i+1}</td><td><strong>${esc(p.name)}</strong>${complete&&i<cutoff?' <span class="qualifier">ADVANCES</span>':''}</td><td>${show(p.total-(p.award||0))}</td><td>${scoreCell(p)}</td><td>${show(p.place)}</td><td>${show(p.award)}</td><td class="gold-text">${show(p.total)}</td></tr>`),['RANK','GOLFER','POINTS IN',canEdit?'GROSS / AUTO HCP / TEE':'ROUND NET','FINISH','AWARDED','CUMULATIVE']):'<p class="empty-message">Waiting for the previous playoff round to be finalized.</p>';
  if(canEdit){
    $('round-'+r).insertAdjacentHTML('beforeend',`<p><button type="button" data-finalize-playoff="${esc(week.id)}" data-round="${r}" style="background:#ffb612;color:#111;border:0;border-radius:7px;padding:12px 18px;font-weight:800;cursor:pointer">FINALIZE ROUND ${r}</button></p>`);
  }
  $('round-'+r+'-status').textContent=!week?'Playoff week missing from Supabase':complete?`Finalized · Top ${Math.min(cutoff,eligible.length)} advance`:unlocked?'Awaiting official finalized scores — provisional values do not advance golfers':'Waiting for previous round';
  if(complete){finished++;eligible=ranked.slice(0,cutoff);}else eligible=[];
 }
 $('status').textContent=finished+' of 3 qualifying rounds finalized';
 const last=weeks.playoff.get(4),fr=new Map(rounds.filter(x=>x.week_id===last?.id).map(x=>[x.golfer_id,x]));
 const canEditFinal=Boolean(editor?.commissioner&&last?.status==='open'&&eligible.length);
  const finalists=eligible.map(p=>({...p,net:net(fr.get(p.id))})).sort((a,b)=>(a.net??Infinity)-(b.net??Infinity)||a.seed-b.seed);
 const complete=Boolean(last&&last.status==='finalized'&&finalists.length&&finalists.every(p=>fr.get(p.id)?.finalized&&p.net!==null));
 $('final').innerHTML=finalists.length?table(finalists.map((p,i)=>`<tr><td>${complete?i+1:'—'}</td><td><strong>${esc(p.name)}</strong></td><td>${canEditFinal?scoreInput(p,last,4,fr.get(p.id)):show(p.net)}</td></tr>`),['PLACE','FINALIST',canEditFinal?'GROSS / AUTO HCP / TEE':'CHAMPIONSHIP NET']):'<p class="empty-message">The Final Four will appear after Round 3 is finalized.</p>';
 if(canEditFinal){
   $('final').insertAdjacentHTML('beforeend',`<p><button type="button" data-finalize-playoff="${esc(last.id)}" data-round="4" style="background:#ffb612;color:#111;border:0;border-radius:7px;padding:12px 18px;font-weight:800;cursor:pointer">FINALIZE CHAMPIONSHIP</button></p>`);
 }
 const winners=complete?finalists.filter(p=>p.net===finalists[0].net):[];
 $('champion').textContent=!complete?'Championship awaits the Final Four':winners.length===1?'CHAMPION: '+winners[0].name:'TIED FOR CHAMPIONSHIP: '+winners.map(p=>p.name).join(' / ');
 $('champion-note').textContent=complete?'Official championship results — scores finalized and locked.':'Official Supabase playoff results. Scores become official when finalized.';
}
async function init(){
 if(!window.supabase?.createClient||!window.BB_SUPABASE_CONFIG)throw Error('Supabase configuration is missing');
 const db=window.supabase.createClient(window.BB_SUPABASE_CONFIG.url,window.BB_SUPABASE_CONFIG.publishableKey);
 const {data:leagues,error:e}=await db.from('leagues').select('id').eq('season',2027).eq('name','Bogus Boys').limit(1);if(e)throw e;if(!leagues?.length)throw Error('2027 league not found');
 const id=leagues[0].id;
  const {data:auth}=await db.auth.getUser();
  let commissioner=false;
  if(auth?.user){
    const {data:memberships,error:me}=await db.from('memberships').select('role').eq('league_id',id).eq('user_id',auth.user.id);
    if(me)throw me;
    commissioner=(memberships||[]).some(m=>m.role==='commissioner');
  }
  editor={db,commissioner,id};
  $('playoff-edit-status').textContent=commissioner?'COMMISSIONER: Select tees in Round 1, then enter gross scores. Handicaps calculate from earlier finalized rounds. Check scores before finalizing.':'VIEW ONLY: Commissioner sign-in required for score entry.';

 const [golfers,weekRows]=await Promise.all([all(db.from('golfers').select('id,display_name,flight,kind,active,starting_handicap').eq('league_id',id).order('id'),'Golfers'),all(db.from('weeks').select('id,week_type,week_number,status,scheduled_date').eq('league_id',id).order('id'),'Weeks')]);
 const regIds=new Set(weekRows.filter(w=>w.week_type==='regular'&&w.status==='finalized').map(w=>w.id));
 const playoff=new Map(weekRows.filter(w=>w.week_type==='playoff').map(w=>[w.week_number,w]));
 const ids=[...regIds,...[...playoff.values()].map(w=>w.id)];let rounds=[];
 for(let i=0;i<ids.length;i+=40){rounds.push(...await all(db.from('rounds').select('week_id,golfer_id,gross_score,handicap_used,bb_points,finalized,tee_box,course_rating,slope_rating').in('week_id',ids.slice(i,i+40)).order('week_id').order('golfer_id'),'Rounds'));}
 editor.golfers=golfers;editor.weeks={regIds,playoff};editor.rounds=rounds;
 editor.chronology=weekRows.filter(w=>w.week_type==='regular'||w.week_type==='playoff').sort((a,b)=>{
  // Regular-season weeks always precede playoffs; within each stage, use week number.
  const stage=w=>w.week_type==='regular'?0:1;
  return stage(a)-stage(b)||a.week_number-b.week_number;
 });
 const {data:tees,error:te}=await db.from('tee_ratings').select('tee_box,course_rating,slope_rating').eq('league_id',id);
 if(te)throw te;
 editor.tees=new Map((tees||[]).map(t=>[t.tee_box.toLowerCase(),t]));
 render(golfers,editor.weeks,rounds);
}

document.addEventListener('change',async event=>{
 const teeSelect=event.target;
 if(teeSelect.matches('[data-playoff-tee]')){
  if(!editor?.commissioner)return;
  const selected=teeSelect.value.toLowerCase();
  if(!editor.tees.has(selected)){$('playoff-edit-status').textContent='Select white or gold tees.';return;}
  const week=editor.weeks.playoff.get(1);
  if(week?.status!=='open')return;
  const existing=editor.rounds.find(r=>r.week_id===week.id&&r.golfer_id===teeSelect.dataset.playoffTee);
  if(existing?.tee_box){$('playoff-edit-status').textContent='Round 1 tee is already saved; tee changes require commissioner database correction.';render(editor.golfers,editor.weeks,editor.rounds);return;}
  editor.pendingTees=editor.pendingTees||new Map();
  editor.pendingTees.set(teeSelect.dataset.playoffTee,selected);
  $('playoff-edit-status').textContent='Tee selected. Enter gross score to save the tee, rating, slope, and automatic handicap.';
  return;
 }

 const input=event.target;
 if(!input.matches('[data-score-week][data-score-golfer][data-score-field]')||!editor?.commissioner)return;
 const status=$('playoff-edit-status');
 const week=[...editor.weeks.playoff.values()].find(w=>w.id===input.dataset.scoreWeek);
 if(!week||week.status!=='open'){status.textContent='NOT SAVED: Week is locked.';return;}
 const field=input.dataset.scoreField,raw=input.value.trim(),value=raw===''?null:Number(raw);
  if(field!=='gross_score'){status.textContent='NOT SAVED: Only gross scores are editable.';return;}
  const roundNumber=week.week_number;
  const tee=playoffTee(input.dataset.scoreGolfer,roundNumber);
  const teeInfo=tee?editor.tees.get(tee.toLowerCase()):null;
  if(!teeInfo){status.textContent='NOT SAVED: Select valid Round 1 tees first.';return;}
  const hcp=currentHcp(input.dataset.scoreGolfer,roundNumber);
  if(hcp===null){status.textContent='NOT SAVED: Starting handicap or qualifying history is missing.';return;}
  const existingSnapshot=editor.rounds.find(r=>r.week_id===week.id&&r.golfer_id===input.dataset.scoreGolfer);
  if(existingSnapshot?.handicap_used!=null&&Number(existingSnapshot.handicap_used)!==hcp){
   status.textContent='NOT SAVED: Existing handicap snapshot differs. Review this test round before proceeding.';return;
  }
  const snapshot={handicap_used:hcp,tee_box:tee.toLowerCase(),course_rating:teeInfo.course_rating,slope_rating:teeInfo.slope_rating};
 if(value!==null&&(!Number.isFinite(value)||(field==='gross_score'&&(!Number.isInteger(value)||value<9||value>100))||(field==='handicap_used'&&(value< -20||value>40)))){
   status.textContent='NOT SAVED: Invalid score or handicap.';return;
 }
 input.disabled=true;status.textContent='Saving to Supabase…';
 try{
   const existing=editor.rounds.find(r=>r.week_id===week.id&&r.golfer_id===input.dataset.scoreGolfer);
   if(!existing&&value===null){status.textContent='Nothing to save.';return;}
   const q=existing
     ?editor.db.from('rounds').update({[field]:value,...(existing.handicap_used==null||!existing.tee_box?snapshot:{})}).eq('week_id',week.id).eq('golfer_id',input.dataset.scoreGolfer).eq('finalized',false)
     :editor.db.from('rounds').insert({week_id:week.id,golfer_id:input.dataset.scoreGolfer,[field]:value,...snapshot,finalized:false});
   const {data,error}=await q.select('week_id,golfer_id,gross_score,handicap_used,bb_points,finalized,tee_box,course_rating,slope_rating');
   if(error)throw error;
   if(!data?.length)throw Error('No row was saved. Check database permissions.');
   const saved=data[0],i=editor.rounds.findIndex(r=>r.week_id===saved.week_id&&r.golfer_id===saved.golfer_id);
   if(i>=0)editor.rounds[i]=saved;else editor.rounds.push(saved);
   render(editor.golfers,editor.weeks,editor.rounds);
   status.textContent='SAVED: '+(saved.gross_score??'—')+' gross / '+(saved.handicap_used??'—')+' handicap. Awaiting finalization.';
 }catch(err){
   input.disabled=false;
   status.textContent='NOT SAVED: '+err.message;
   console.error('Playoff score save failed:',err);
 }
 finally{input.disabled=false;}
});

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-finalize-playoff]');
  if(!button||!editor?.commissioner)return;
  const round=Number(button.dataset.round);
  const w=editor.weeks.playoff.get(round);
   const candidates=[...document.querySelectorAll(`[data-score-week="${w?.id}"][data-score-field="gross_score"]`)];
   if(candidates.some(el=>{const r=editor.rounds.find(x=>x.week_id===w.id&&x.golfer_id===el.dataset.scoreGolfer);return !r||r.gross_score==null||r.handicap_used==null||!r.tee_box||r.course_rating==null||r.slope_rating==null||r.tee_box!==playoffTee(el.dataset.scoreGolfer,round);})){ $('playoff-edit-status').textContent='NOT FINALIZED: Missing score, handicap, or matching tee data.';return;}
   if(!confirm(`Finalize Playoff Round ${round}? All qualifying golfers must have scores. This permanently locks the round. This cannot be undone from the website.`))return;
  button.disabled=true;
  const status=$('playoff-edit-status');
  status.textContent=`Finalizing playoff round ${round}…`;
  try{
    const {data,error}=await editor.db.rpc('bb_finalize_playoff_week',{p_week_id:button.dataset.finalizePlayoff});
    if(error)throw error;
    status.textContent=`ROUND ${round} FINALIZED: ${data} golfer(s). Refreshing…`;
    window.location.reload();
  }catch(err){
    status.textContent='FINALIZATION FAILED: '+err.message;
    button.disabled=false;
    console.error(err);
  }
});
init().catch(e=>{console.error(e);$('status').textContent='Unable to load live playoffs';$('seeds').textContent='Supabase error: '+e.message;});
})();
