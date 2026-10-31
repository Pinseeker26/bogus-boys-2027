/* LOCAL PROTOTYPE ONLY. No authentication, shared database, or trusted server validation. */
const RESULT_KEY='bb2027-results-v1';
const $=id=>document.getElementById(id);
const weekSelect=$('week-select');
weekOptions(weekSelect);
function allResults(){try{return JSON.parse(localStorage.getItem(RESULT_KEY))||{}}catch{return {}}}
function weekData(w){return allResults()[w]||{scores:{},money:[],locked:false,format:'auto'}}
function saveWeek(w,data){const all=allResults();all[w]=data;localStorage.setItem(RESULT_KEY,JSON.stringify(all))}
function getFormat(w,d){return d.format==='net'||d.format==='quota'?d.format:weeklyFormat(w)}
function num(v){return v===''||v===null||v===undefined?null:Number(v)}
function scoreFor(p,d,fmt){const s=d.scores[p.id]||{};if(fmt==='net'){const gross=num(s.gross),hcp=num(s.handicap??handicapForPlayer(p.id).playingHandicap);return gross===null||hcp===null?null:gross-hcp}const points=num(s.quotaPoints),target=num(s.quotaTarget??quotaForPlayer(p.id));return points===null||target===null?null:points-target}
// BBPts: tied players split the combined points for all finishing positions they occupy.
// Example: a two-way tie for 2nd shares (90 + 80) / 2 = 85 BBPts each.
function bbptsForRank(rank){return Math.max(0,110-10*rank)}
function rankFlight(people,d,fmt){
 const sorted=people.map(p=>({p,value:scoreFor(p,d,fmt)})).sort((a,b)=>a.value===null?1:b.value===null?-1:fmt==='net'?a.value-b.value:b.value-a.value);
 let i=0;
 while(i<sorted.length){
  if(sorted[i].value===null){sorted[i].rank=null;sorted[i].bbpts=null;i++;continue}
  let j=i+1;
  while(j<sorted.length&&sorted[j].value===sorted[i].value)j++;
  const total=Array.from({length:j-i},(_,offset)=>bbptsForRank(i+offset+1)).reduce((sum,pts)=>sum+pts,0);
  const sharedPoints=total/(j-i);
  for(let k=i;k<j;k++){sorted[k].rank=i+1;sorted[k].bbpts=sharedPoints}
  i=j;
 }
 return sorted;
}
function render(){
 const w=Number(weekSelect.value||1),d=weekData(w),fmt=getFormat(w,d),league=readLeague();
 $('format-override').value=d.format||'auto';$('format-label').textContent=fmt==='net'?'NET SCORE':'QUOTA';
 $('format-note').textContent=fmt==='net'?'Lowest net score leads':'Highest points over quota leads';
 const disabled=d.locked?'disabled':'';let total=0;
 for(const f of ['A','B']){
  const people=weekRoster(league,f,w);total+=people.length;const k=f.toLowerCase();
  $(k+'-count').textContent=people.length;$('flight-'+k+'-count').textContent=people.length+' golfers';
  $(k+'-head').innerHTML=fmt==='net'?'<tr><th>PLAYER</th><th>GROSS</th><th>HCP</th><th>NET</th><th>BBPts</th></tr>':'<tr><th>PLAYER</th><th>POINTS</th><th>QUOTA</th><th>+/-</th><th>BBPts</th></tr>';
  const ranked=rankFlight(people,d,fmt);
  $(k+'-body').innerHTML=ranked.length?ranked.map(({p,value,rank,bbpts})=>{
   const s=d.scores[p.id]||{},fields=fmt==='net'?['gross','handicap']:['quotaPoints','quotaTarget'];
   const scoreInputs=fields.map(field=>`<td><input ${disabled} type="number" step="0.1" inputmode="decimal" data-player="${escapeText(p.id)}" data-field="${field}" value="${s[field]??(field==='handicap'?handicapForPlayer(p.id).playingHandicap:field==='quotaTarget'?quotaForPlayer(p.id):'')??''}" aria-label="${escapeText(p.name)} ${field}"></td>`).join('');
   return `<tr><td class="player-cell"><span class="rank">${rank===null?'—':rank}</span>${escapeText(p.name)}</td>${scoreInputs}<td class="computed ${value!==null?'filled':''}">${value===null?'—':fmt==='net'?value:(value>0?'+':'')+value}</td><td class="computed ${bbpts!==null?'filled':''}" aria-label="Automatically calculated BBPts">${bbpts===null?'—':bbpts}</td></tr>`;
  }).join(''):'<tr><td colspan="5" class="empty-row">No checked-in golfers in this flight yet.</td></tr>';
 }
 $('total-count').textContent=total;$('status-label').textContent=d.locked?'LOCKED':'OPEN';
 $('status-sub').textContent=d.locked?'Results finalized':'Scores editable';
 $('lock-week').textContent=d.locked?'Unlock Week':'Finalize & Lock Week';
 $('format-override').disabled=d.locked;$('save-results').disabled=d.locked;$('add-money').disabled=d.locked;renderMoney(d);
}

function renderMoney(d){$('money-rows').innerHTML=d.money.length?d.money.map((m,i)=>`<div class="money-row"><label>CONTEST<input ${d.locked?'disabled':''} data-money="${i}" data-field="label" value="${escapeText(m.label||'')}" placeholder="Closest to the pin"></label><label>WINNER<select ${d.locked?'disabled':''} data-money="${i}" data-field="winner"><option value="">Select player</option>${readLeague().players.map(p=>`<option value="${escapeText(p.id)}" ${m.winner===p.id?'selected':''}>${escapeText(p.name)} · Flight ${escapeText(p.flight)}</option>`).join('')}</select></label><label>PAYOUT ($)<input ${d.locked?'disabled':''} type="number" min="0" step="0.01" data-money="${i}" data-field="payout" value="${escapeText(m.payout??'')}" placeholder="0"></label><button ${d.locked?'disabled':''} class="remove-money" data-remove-money="${i}" title="Remove contest" aria-label="Remove contest">×</button></div>`).join(''):'<p class="muted">No money holes recorded yet. Add contests for this week below.</p>'}
function persistField(e){const t=e.target,w=weekSelect.value,d=weekData(w);if(d.locked)return;if(t.dataset.player){const id=t.dataset.player;d.scores[id]||={};d.scores[id][t.dataset.field]=t.value;saveWeek(w,d);render()}else if(t.dataset.money!==undefined){const m=d.money[Number(t.dataset.money)];if(!m)return;m[t.dataset.field]=t.value;saveWeek(w,d)}}
$('a-body').addEventListener('change',persistField);$('b-body').addEventListener('change',persistField);$('money-rows').addEventListener('change',persistField);
$('money-rows').addEventListener('click',e=>{const i=e.target.dataset.removeMoney;if(i===undefined)return;const d=weekData(weekSelect.value);if(d.locked)return;d.money.splice(Number(i),1);saveWeek(weekSelect.value,d);render()});
$('add-money').addEventListener('click',()=>{const d=weekData(weekSelect.value);if(d.locked)return;d.money.push({label:'',winner:'',payout:''});saveWeek(weekSelect.value,d);render()});
$('format-override').addEventListener('change',e=>{const d=weekData(weekSelect.value);if(d.locked)return;d.format=e.target.value;saveWeek(weekSelect.value,d);render()});
$('save-results').addEventListener('click',()=>{$('save-message').textContent='Week '+weekSelect.value+' saved in this browser. This is not shared or backed up.'});
$('lock-week').addEventListener('click',()=>{const d=weekData(weekSelect.value);if(!confirm(d.locked?'Unlock this week for corrections?':'Finalize and lock this week?'))return;if(!d.locked){const league=readLeague();d.scores=d.scores||{};for(const p of league.players){if(weekAttendance(league,weekSelect.value)[p.id]!=='Playing')continue;d.scores[p.id]||={};if(d.scores[p.id].handicap==null&&handicapForPlayer(p.id).playingHandicap!==null)d.scores[p.id].handicap=handicapForPlayer(p.id).playingHandicap;if(d.scores[p.id].quotaTarget==null&&quotaForPlayer(p.id)!==null)d.scores[p.id].quotaTarget=quotaForPlayer(p.id)}}d.locked=!d.locked;saveWeek(weekSelect.value,d);render()});
weekSelect.addEventListener('change',()=>{$('save-message').textContent='';render()});
window.addEventListener('storage',render);render();
