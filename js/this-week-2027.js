/* Local browser-only league preview; no cross-device synchronization. */
const LEAGUE_KEY='bb2027-demo-v2',RESULT_KEY='bb2027-results-v1';
const el=id=>document.getElementById(id);
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const select=el('tw-week');weekOptions(select);
function render(){
 const league=readLeague(),results=load(RESULT_KEY,{});
 const w=Number(select.value||1),data=results[w]||{},format=data.format==='net'||data.format==='quota'?data.format:weeklyFormat(w);
 el('tw-format').textContent=format==='net'?'NET SCORE':'QUOTA';
 el('tw-rule').textContent=format==='net'?'Lowest net wins':'Highest quota differential wins';
 el('tw-description').textContent=format==='net'?'This week is a Net Score competition. Players compete within their fixed flights. The lowest net score ranks first, and BBPts are awarded automatically.':'This week is a Quota competition. Players compete within their fixed flights. The highest points-over-quota result ranks first, and BBPts are awarded automatically.';
 let total=0;
 for(const flight of ['A','B']){
 const players=weekRoster(league,flight,w);total+=players.length;
 el('tw-'+flight.toLowerCase()).textContent=players.length;
 el('tw-roster-'+flight.toLowerCase()).innerHTML=players.length?players.map(p=>'<li>'+safe(p.name)+'</li>').join(''):'<li class="tw-empty">No golfers checked in yet</li>';
 }
 el('tw-total').textContent=total;
}
const league=load(LEAGUE_KEY,{week:1});select.value=String(Math.min(regularCount(),Math.max(1,Number(league.week)||1)));select.addEventListener('change',render);window.addEventListener('storage',render);render();
