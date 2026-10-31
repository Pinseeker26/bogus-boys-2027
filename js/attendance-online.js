(async()=>{
'use strict';
const $=id=>document.getElementById(id), cfg=window.BB_SUPABASE_CONFIG||{};
if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey)return;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
let leagueId=null, weeks=[], golfers=[], signups=[];
const message=(s,bad=false)=>{const e=$('attendance-message');e.textContent=s;e.style.color=bad?'#ffb6a9':'#f5d779';};
function option(value,label){const e=document.createElement('option');e.value=value;e.textContent=label;return e;}
async function init(){
 try{
  const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)return;
  const {data:m,error}=await db.from('memberships').select('league_id').eq('user_id',user.id).eq('role','commissioner').limit(1);
  if(error)throw error;if(!m?.length)return;leagueId=m[0].league_id;
  await refresh();
 }catch(e){message('Attendance could not load: '+e.message,true);}
}
async function refresh(){
 const [w,g]=await Promise.all([
  db.from('weeks').select('id,week_number,week_type,scheduled_date').eq('league_id',leagueId),
  db.from('golfers').select('id,display_name,flight,kind,active').eq('league_id',leagueId).eq('kind','member').eq('active',true).order('display_name')
 ]);
 if(w.error)throw w.error;if(g.error)throw g.error;
 weeks=(w.data||[]).sort((a,b)=>(a.week_type==='playoff')-(b.week_type==='playoff')||a.week_number-b.week_number);
 golfers=g.data||[];
 const select=$('attendance-week'),previous=select.value;select.replaceChildren();
 for(const week of weeks)select.append(option(week.id,`${week.week_type==='playoff'?'Playoff':'Regular'} Week ${week.week_number}${week.scheduled_date?' · '+week.scheduled_date:''}`));
 if(weeks.some(w=>w.id===previous))select.value=previous;
 await render();
}
async function render(){
 const weekId=$('attendance-week').value,body=$('attendance-rows');body.replaceChildren();
 if(!weekId){message('Add a week in the schedule to begin.');return;}
 const {data,error}=await db.from('attendance_signups').select('golfer_id,response').eq('league_id',leagueId).eq('week_id',weekId);
 if(error){message('Attendance setup needed: run PHASE_8_SETUP.sql and expose attendance_signups in Data API. '+error.message,true);return;}
 signups=data||[];const map=new Map(signups.map(x=>[x.golfer_id,x.response]));
 let playing=0,notPlaying=0;
 for(const golfer of golfers){
  const response=map.get(golfer.id)||'';if(response==='playing')playing++;if(response==='not_playing')notPlaying++;
  const tr=document.createElement('tr');
  for(const v of [golfer.display_name,golfer.flight||'—',response==='playing'?'Playing':response==='not_playing'?'Not Playing':'No Response']){
   const td=document.createElement('td');td.textContent=v;tr.append(td);
  }
  const td=document.createElement('td'),sel=document.createElement('select');sel.setAttribute('aria-label','Attendance for '+golfer.display_name);
  for(const [value,label] of [['','No Response'],['playing','Playing'],['not_playing','Not Playing']])sel.append(option(value,label));
  sel.value=response;sel.style.cssText='background:#292929;color:white;border:1px solid #777;border-radius:6px;padding:8px;';
  sel.addEventListener('change',async()=>{
   const chosen=sel.value;sel.disabled=true;message('Saving '+golfer.display_name+'…');
   try{
    const result=chosen?await db.from('attendance_signups').upsert({league_id:leagueId,week_id:weekId,golfer_id:golfer.id,response:chosen},{onConflict:'week_id,golfer_id'}):await db.from('attendance_signups').delete().eq('league_id',leagueId).eq('week_id',weekId).eq('golfer_id',golfer.id);
    if(result.error)throw result.error;await render();message('Saved '+golfer.display_name+' — '+(chosen||'No Response')+'.');
   }catch(e){sel.value=response;message('Could not save: '+e.message,true);}finally{sel.disabled=false;}
  });td.append(sel);tr.append(td);body.append(tr);
 }
 $('attendance-playing').textContent=String(playing);
 $('attendance-not-playing').textContent=String(notPlaying);
 $('attendance-no-response').textContent=String(golfers.length-playing-notPlaying);
 if(!golfers.length)message('No active regular golfers. Add one in Player Roster & Guests.');
 else message('Attendance loaded. Changes save immediately to Supabase.');
}
$('attendance-week').addEventListener('change',render);
await init();
})();
