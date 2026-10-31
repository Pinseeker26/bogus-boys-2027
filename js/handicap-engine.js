/* Nine-hole Bogus Boys league handicap; not an official WHS index. */
const HANDICAP_HISTORY_KEY='bb2027-handicap-history-v1';
function handicapHistory(){try{return JSON.parse(localStorage.getItem(HANDICAP_HISTORY_KEY))||{}}catch{return {}}}
function saveHandicapHistory(d){localStorage.setItem(HANDICAP_HISTORY_KEY,JSON.stringify(d))}
function handicapCount(n){return n>=20?8:n>=12?3:n>=9?3:n>=8?2:n>=6?2:n>=3?1:0}
function handicapCourseConfigs(){try{return JSON.parse(localStorage.getItem('bb2027-course-ratings-v1'))||[]}catch{return []}}
function saveHandicapCourseConfigs(c){localStorage.setItem('bb2027-course-ratings-v1',JSON.stringify(c))}
function eligibleRound(r){const rating=Number(r.rating),slope=Number(r.slope),score=Number(r.score);return Number.isFinite(score)&&score>0&&Number.isFinite(rating)&&rating>0&&Number.isFinite(slope)&&slope>0}
function calculateLeagueHandicap(rounds){const recent=(rounds||[]).filter(eligibleRound).slice(-20),n=recent.length,k=handicapCount(n);if(!k)return {handicap:null,playingHandicap:null,quota:null,rounds:n,count:0};const diffs=recent.map(r=>(Number(r.score)-Number(r.rating))*113/Number(r.slope)).sort((a,b)=>a-b),avg=diffs.slice(0,k).reduce((a,b)=>a+b,0)/k;const handicap=Math.round(avg*100)/100,playingHandicap=Math.round(handicap);return {handicap,playingHandicap,quota:18-playingHandicap,rounds:n,count:k}}
function handicapForPlayer(id){return calculateLeagueHandicap(handicapHistory()[id]||[])}
function quotaForPlayer(id){return handicapForPlayer(id).quota}
