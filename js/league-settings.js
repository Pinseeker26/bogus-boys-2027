/* Browser-only configuration. No real authentication or shared backend. */
const SETTINGS_KEY='bb2027-settings-v1';
const SETTINGS_DEFAULT={course:'To be announced',day:'To be announced',time:'',startDate:'',regularWeeks:20,attendanceDeadlineHours:0,weeklyDates:{},playoffDates:{},cancelledWeeks:[],closedWeeks:[],formatOverrides:{}};
function getSettings(){try{const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));return {...SETTINGS_DEFAULT,...(s&&typeof s==='object'?s:{})}}catch{return {...SETTINGS_DEFAULT}}}
function putSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}
function regularCount(s=getSettings()){return Math.max(1,Math.min(52,Number(s.regularWeeks)||20))}
function weeklyFormat(w,s=getSettings()){return s.formatOverrides?.[w]|| (Math.floor((Number(w)-1)/2)%2===0?'net':'quota')}
function weekOptions(select,includePlayoffs=false){const current=select.value;select.innerHTML='';const s=getSettings();for(let i=1;i<=regularCount(s);i++){const o=document.createElement('option');o.value=i;o.textContent='Week '+i+(s.weeklyDates?.[i]?' — '+s.weeklyDates[i]:'')+(s.cancelledWeeks?.includes(i)?' (Cancelled)':'');select.appendChild(o)}if(includePlayoffs){for(let i=1;i<=4;i++){const o=document.createElement('option');o.value='P'+i;o.textContent='Playoff Round '+i;select.appendChild(o)}}if([...select.options].some(o=>o.value===current))select.value=current;}
function weekIsClosed(w,s=getSettings()){return s.cancelledWeeks?.includes(Number(w))||s.closedWeeks?.includes(Number(w))}
