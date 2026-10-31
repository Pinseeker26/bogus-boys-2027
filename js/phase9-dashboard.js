(async()=>{
 'use strict';
 const $=id=>document.getElementById(id),cfg=window.BB_SUPABASE_CONFIG||{};
 const say=(s,bad=false)=>{const e=$('player-status');e.textContent=s;e.style.color=bad?'#ffb6a9':'#f5d779';};
 if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey){say('Configure Supabase first.',true);return;}
 const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
 let league=null,golfer=null;
 async function start(){
  try{
   const {data:{user}}=await db.auth.getUser();if(!user){say('Sign in first.');return;}
   const {data:m,error:me}=await db.from('memberships').select('league_id,role').eq('user_id',user.id).limit(1);if(me)throw me;
   if(!m?.length){const {data:r}=await db.rpc('my_player_registration');say(r?.[0]?.registration_status==='pending'?'Pending Commissioner approval.':'Not yet approved. Register and request approval.');return;}
   league=m[0].league_id;
   const {data:g,error:ge}=await db.from('golfers').select('id,display_name,flight,active').eq('league_id',league).eq('user_id',user.id).maybeSingle();if(ge)throw ge;
   if(!g){say('Your account has no linked golfer yet. Ask the Commissioner to link it.');return;}
   golfer=g;$('player-name').textContent=g.display_name;
   if(!g.active){say('Your golfer profile is inactive. Contact the Commissioner.');return;}
   $('player-content').hidden=false;await loadWeeks();
  }catch(e){say(e.message,true);}
 }
 async function loadWeeks(){
  const {data:w,error}=await db.from('weeks').select('id,week_number,week_type,scheduled_date,status').eq('league_id',league);
  if(error){say(error.message,true);return;}
  const select=$('player-week');select.replaceChildren();
  for(const week of (w||[]).sort((a,b)=>(a.week_type==='playoff')-(b.week_type==='playoff')||a.week_number-b.week_number)){
   const o=document.createElement('option');o.value=week.id;o.textContent=`${week.week_type==='playoff'?'Playoff':'Regular'} Week ${week.week_number}${week.scheduled_date?' · '+week.scheduled_date:''}${week.status!=='open'?' ('+week.status+')':''}`;o.disabled=week.status!=='open';select.append(o);
  }
  select.addEventListener('change',render);await render();
 }
 async function render(){
  const week=$('player-week').value;if(!week){say('No open weeks available.');return;}
  const {data,error}=await db.from('attendance_signups').select('response').eq('week_id',week).eq('golfer_id',golfer.id).maybeSingle();
  if(error){say(error.message,true);return;}
  $('player-response').textContent='Your response: '+(data?.response==='playing'?'Playing':data?.response==='not_playing'?'Not Playing':'No Response');say('Choose your attendance for this week.');
 }
 async function save(response){
  const week=$('player-week').value;if(!week)return;say('Saving…');
  const result=response?await db.from('attendance_signups').upsert({league_id:league,week_id:week,golfer_id:golfer.id,response},{onConflict:'week_id,golfer_id'}):await db.from('attendance_signups').delete().eq('week_id',week).eq('golfer_id',golfer.id);
  if(result.error){say('Could not save: '+result.error.message,true);return;}
  await render();say('Attendance saved!');
 }
 $('player-yes').onclick=()=>save('playing');$('player-no').onclick=()=>save('not_playing');$('player-clear').onclick=()=>save(null);
 await start();
})();
