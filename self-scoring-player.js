(async()=>{
 'use strict';
 const $=id=>document.getElementById(id),cfg=window.BB_SUPABASE_CONFIG||{};
 if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey)return;
 const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
 const say=s=>{$('self-score-player-status').textContent=s;};
 let golfer=null,weeks=[],loadVersion=0;
 async function init(){
  const {data:{user}}=await db.auth.getUser();if(!user)return;
  const {data:m,error:me}=await db.from('memberships').select('league_id').eq('user_id',user.id).limit(1);if(me)throw me;if(!m?.length)return;
  const {data:g,error:ge}=await db.from('golfers').select('id,active,kind').eq('league_id',m[0].league_id).eq('user_id',user.id).maybeSingle();if(ge)throw ge;
  golfer=g;if(!g?.active||g.kind!=='member'){say('Only linked, active league members can submit scores.');return;}
  const {data:w,error:we}=await db.from('weeks').select('id,status').eq('league_id',m[0].league_id);if(we)throw we;weeks=w||[];
  $('player-week').addEventListener('change',load);
  // The attendance dashboard fills the week dropdown asynchronously.
  // Re-read the selected week when its options arrive or are rebuilt.
  const weekSelect=$('player-week');
  const observer=new MutationObserver(()=>{if(weekSelect.options.length)load();});
  observer.observe(weekSelect,{childList:true});
  $('self-score-submit').addEventListener('click',save);
  await load();
 }
 async function load(){
  const version=++loadVersion;
  const id=$('player-week').value,w=weeks.find(x=>x.id===id);
  $('self-score-gross').value='';$('self-score-submit').disabled=true;$('self-score-gross').disabled=true;
  if(!w){say('Select a week.');return;}
  const [{data:permission,error:pe},{data:attendance,error:ae},{data:round,error:re}]=await Promise.all([
   db.from('week_self_scoring').select('enabled').eq('week_id',id).maybeSingle(),
   db.from('attendance_signups').select('response').eq('week_id',id).eq('golfer_id',golfer.id).maybeSingle(),
   db.from('rounds').select('gross_score,finalized').eq('week_id',id).eq('golfer_id',golfer.id).maybeSingle()
  ]);
  // Ignore an old response if the golfer switched weeks while it was loading.
  if(version!==loadVersion||$('player-week').value!==id)return;
  if(pe||ae||re){say('Could not load scoring: '+(pe||ae||re).message);return;}
  if(round?.gross_score!=null)$('self-score-gross').value=round.gross_score;
  if(w.status!=='open'){say('This week is closed for scoring. Saved score shown above, if available.');return;}
  if(!permission?.enabled){say('Golfer scoring is OFF. Saved score shown above, if available.');return;}
  if(attendance?.response!=='playing'){say('Mark yourself Playing before submitting a score.');return;}
  if(round?.finalized){say('Your score is finalized.');return;}
  $('self-score-submit').disabled=false;$('self-score-gross').disabled=false;
  say('Golfer score entry is ON. Enter your nine-hole gross score.');
 }
 async function save(){
  const id=$('player-week').value,n=Number($('self-score-gross').value);
  if(!Number.isInteger(n)||n<1||n>99){say('Enter a whole-number gross score from 1 to 99.');return;}
  $('self-score-submit').disabled=true;say('Saving…');
  const {error}=await db.rpc('bb_submit_own_score',{p_week_id:id,p_gross:n});
  if(error){say('Could not save: '+error.message);await load();return;}
  await load();
  if($('self-score-gross').value===String(n))say('Your gross score was saved!');
  else say('Score saved, but could not reload it yet. Refresh to verify.');
 }
 try{await init();}catch(e){say(e.message);}
})();
