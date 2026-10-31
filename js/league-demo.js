/* Local demonstration only. Not a secure or shared league backend. */
const KEY='bb2027-demo-v2';
const DEFAULT={week:1,players:[{id:'demo-1',name:'Sample Player A',flight:'A'},{id:'demo-2',name:'Sample Player B',flight:'B'}],attendance:{}};
function readLeague(){
 try{
  const d=JSON.parse(localStorage.getItem(KEY));
  if(d&&Array.isArray(d.players)){
   if(!d.attendanceByWeek||typeof d.attendanceByWeek!=='object'){
    // Migrate old single attendance list to Week 1 ONLY, not every week.
    d.attendanceByWeek={'1':{...(d.attendance||{})}};
    localStorage.setItem(KEY,JSON.stringify(d));
   }
   d.attendance=d.attendance||{};
   return d;
  }
 }catch(e){}
 return {...structuredClone(DEFAULT),attendanceByWeek:{}};
}
function weekAttendance(d,w){return (d.attendanceByWeek||{})[String(w)]||{}}
function setWeekAttendance(d,w,id,status){
 d.attendanceByWeek=d.attendanceByWeek||{};
 d.attendanceByWeek[String(w)]=d.attendanceByWeek[String(w)]||{};
 d.attendanceByWeek[String(w)][id]=status;
}
function weekRoster(d,flight,w){const a=weekAttendance(d,w);return d.players.filter(p=>p.flight===flight&&a[p.id]==='Playing').sort((x,y)=>x.name.localeCompare(y.name));}
function saveLeague(d){localStorage.setItem(KEY,JSON.stringify(d));}
function roster(d,flight){return d.players.filter(p=>p.flight===flight&&weekAttendance(d,d.week||1)[p.id]==='Playing').sort((a,b)=>a.name.localeCompare(b.name));}
function escapeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
