/* Season BBPts prototype: browser-local data, not a secure shared database. */
(function(){
 const KEY='bb2027-results-v1';
 const body=document.getElementById('season-body');
 let filter='ALL';
 const pts=rank=>Math.max(0,110-10*rank);
 function data(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}}
 function metric(score,format){if(!score)return null;const a=format==='net'?score.gross:score.quotaPoints,b=format==='net'?score.handicap:score.quotaTarget;if(a===''||b===''||a==null||b==null||!Number.isFinite(Number(a))||!Number.isFinite(Number(b)))return null;return Number(a)-Number(b)}
 function formatFor(week,d){return d.format==='net'||d.format==='quota'?d.format:(Math.floor((Number(week)-1)/2)%2===0?'net':'quota')}
 function compute(){const league=readLeague(),weeks=data(),earned={};league.players.forEach(p=>earned[p.id]=[]);
 Object.entries(weeks).forEach(([week,d])=>{if(!d||!d.scores)return;const fmt=formatFor(week,d);
 for(const flight of ['A','B']){
 const rows=league.players.filter(p=>p.flight===flight).map(p=>({id:p.id,value:metric(d.scores[p.id],fmt)})).filter(r=>r.value!==null).sort((a,b)=>fmt==='net'?a.value-b.value:b.value-a.value);
 for(let i=0;i<rows.length;){let j=i+1;while(j<rows.length&&rows[j].value===rows[i].value)j++;let shared=0;for(let k=i;k<j;k++)shared+=pts(k+1);shared/=(j-i);for(let k=i;k<j;k++)earned[rows[k].id].push({week:Number(week),points:shared});i=j;}
 }});
 return league.players.map(p=>{const rounds=earned[p.id].sort((a,b)=>b.points-a.points),best=rounds.slice(0,8).reduce((s,r)=>s+r.points,0),all=rounds.reduce((s,r)=>s+r.points,0);return {...p,best,all,count:rounds.length}}).sort((a,b)=>b.best-a.best||b.all-a.all||a.name.localeCompare(b.name));}
 function render(){const standings=compute(),scored=standings.filter(p=>p.count>0),shown=standings.filter(p=>filter==='ALL'||p.flight===filter);document.getElementById('season-leader').textContent=scored[0]?.name||'—';document.getElementById('season-leader-points').textContent=scored.length?scored[0].best+' BBPts · best 8':'No results yet';document.getElementById('season-rounds').textContent=standings.reduce((s,p)=>s+p.count,0);
 let previous=null,place=0;body.innerHTML=shown.length?shown.map((p,i)=>{if(previous!==p.best)place=i+1;previous=p.best;return `<tr><td class="place ${place===1?'gold-medal':''}">${p.count?place:'—'}</td><td><strong>${escapeText(p.name)}</strong></td><td><span class="flight-tag">Flight ${escapeText(p.flight)}</span></td><td class="total">${p.count?p.best:'—'}</td><td class="rounds">${p.count}</td><td class="muted">${p.count?p.all:'—'}</td></tr>`}).join(''):'<tr><td colspan="6">No players assigned to this flight yet.</td></tr>';
 }
 document.querySelectorAll('[data-flight]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.flight;document.querySelectorAll('[data-flight]').forEach(b=>b.classList.toggle('active',b===button));render()}));window.addEventListener('storage',render);render();
})();
