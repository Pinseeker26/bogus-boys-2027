(async()=>{
'use strict';
const el=id=>document.getElementById(id);
const status=(s,bad=false)=>{el('online-status').textContent=s;el('online-status').style.color=bad?'#ffb6a9':'#f5d779';};
const cfg=window.BB_SUPABASE_CONFIG||{};
if(!/^https:\/\/[^\s]+\.supabase\.co\/?$/.test(cfg.url||'')||!/^sb_publishable_/.test(cfg.publishableKey||'')){status('Connection settings missing. Fill in js/supabase-config.js first.',true);return;}
if(!window.supabase?.createClient){status('Supabase library could not load. Check your connection.',true);return;}
const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
let leagueId=null;
const fields=['week_number','week_type','scheduled_date','format','status'];
function resetForm(){el('week-form').reset();el('week-id').value='';el('week-type').value='regular';el('week-format').value='net';el('week-status').value='open';el('week-save').textContent='Add week';el('week-cancel').hidden=true;el('week-message').textContent='';}
function msg(s,bad=false){el('week-message').textContent=s;el('week-message').style.color=bad?'#ffb6a9':'#f5d779';}
async function load(){
 el('online-content').hidden=true;leagueId=null;
 try{
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user){status('Please sign in first using Clubhouse Sign In.',true);return;}
  const {data:members,error:memberError}=await client.from('memberships').select('league_id,role,display_name').eq('user_id',user.id).eq('role','commissioner').limit(1);
  if(memberError)throw memberError;
  if(!members?.length){status('Access denied: this account is not registered as a league commissioner.',true);return;}
  const membership=members[0];leagueId=membership.league_id;
  const [leagueResult,rosterResult,weeksResult]=await Promise.all([
   client.from('leagues').select('name,season').eq('id',leagueId).single(),
   client.from('memberships').select('display_name,role,flight').eq('league_id',leagueId).order('display_name'),
   client.from('weeks').select('id,week_number,week_type,scheduled_date,format,status').eq('league_id',leagueId).order('week_number')
  ]);
  for(const result of [leagueResult,rosterResult,weeksResult])if(result.error)throw result.error;
  el('who').textContent=`Signed in: ${membership.display_name} · Commissioner`;
  el('league-name').textContent=leagueResult.data.name;
  el('league-season').textContent=String(leagueResult.data.season);
  el('member-count').textContent=String(rosterResult.data.length);
  el('week-count').textContent=String(weeksResult.data.length);
  const roster=el('online-roster');roster.replaceChildren();
  if(!rosterResult.data.length){roster.textContent='No league members yet.';}else{
   const ul=document.createElement('ul');
   for(const m of rosterResult.data){const li=document.createElement('li');li.textContent=`${m.display_name} — ${m.role}${m.flight?' · Flight '+m.flight:''}`;ul.appendChild(li);}
   roster.appendChild(ul);
  }
  const tbody=el('schedule-rows');tbody.replaceChildren();
  if(!weeksResult.data.length){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=6;td.textContent='No weeks scheduled yet. Add your first week below.';tr.appendChild(td);tbody.appendChild(tr);}
  const sortedWeeks=[...weeksResult.data].sort((a,b)=>(a.week_type==='playoff'?1:0)-(b.week_type==='playoff'?1:0)||a.week_number-b.week_number);
  for(const w of sortedWeeks){
   const tr=document.createElement('tr');
   for(const value of [w.week_type==='playoff'?'Playoff':'Regular',String(w.week_number),w.scheduled_date||'Not set',w.format||'Not set',w.status]){const td=document.createElement('td');td.textContent=value;tr.appendChild(td);}
   const td=document.createElement('td');const btn=document.createElement('button');btn.type='button';btn.textContent='Edit';btn.className='small-button';btn.addEventListener('click',()=>{
    el('week-id').value=w.id;el('week-number').value=String(w.week_number);el('week-type').value=w.week_type;el('week-date').value=w.scheduled_date||'';el('week-format').value=w.format||'net';el('week-status').value=w.status;el('week-save').textContent='Save changes';el('week-cancel').hidden=false;msg('Editing '+w.week_type+' week '+w.week_number);el('week-form').scrollIntoView({behavior:'smooth',block:'center'});
   });td.appendChild(btn);tr.appendChild(td);tbody.appendChild(tr);
  }
  el('online-content').hidden=false;
  status('Connected. Commissioner membership verified; live league records loaded.');
 }catch(e){status('Could not load league data: '+(e.message||'Unknown error'),true);}
}
el('build-season').addEventListener('click',async()=>{
 if(!leagueId)return;
 const button=el('build-season'),message=el('build-message');
 button.disabled=true;message.textContent='Checking existing weeks…';
 try{
  const {data:existing,error:readError}=await client.from('weeks').select('week_type,week_number').eq('league_id',leagueId);
  if(readError)throw readError;
  const found=new Set((existing||[]).map(w=>w.week_type+':'+w.week_number));
  const wanted=[];
  for(let n=1;n<=16;n++)wanted.push({league_id:leagueId,week_type:'regular',week_number:n,scheduled_date:null,format:(Math.floor((n-1)/2)%2===0?'net':'quota'),status:'open'});
  for(let n=1;n<=4;n++)wanted.push({league_id:leagueId,week_type:'playoff',week_number:n,scheduled_date:null,format:n===4?'low_net':'net',status:'open'});
  const missing=wanted.filter(w=>!found.has(w.week_type+':'+w.week_number));
  if(!missing.length){message.textContent='All 20 weeks already exist. No changes made.';return;}
  if(!window.confirm('Add '+missing.length+' missing weeks to the LIVE Supabase schedule? Existing weeks will not be changed. Dates will be blank.')){message.textContent='Cancelled. No changes made.';return;}
  message.textContent='Adding '+missing.length+' weeks…';
  const {error:writeError}=await client.from('weeks').insert(missing);
  if(writeError)throw writeError;
  await load();message.textContent='Added '+missing.length+' weeks. Existing weeks were preserved.';
 }catch(e){message.textContent='Could not build schedule: '+(e.message||'Unknown error');}
 finally{button.disabled=false;}
});
el('remove-extra').addEventListener('click',async()=>{
 if(!leagueId)return;
 const button=el('remove-extra'),message=el('remove-message');
 button.disabled=true;message.textContent='Checking extra weeks and linked records…';
 try{
  const {data:extras,error}=await client.from('weeks').select('id,week_number,week_type').eq('league_id',leagueId).eq('week_type','regular').gte('week_number',17).lte('week_number',20);
  if(error)throw error;
  if(!extras?.length){message.textContent='No extra regular-season Weeks 17–20 found. Nothing deleted.';return;}
  const ids=extras.map(w=>w.id);
  // Fail closed if we cannot inspect either dependency table.
  for(const table of ['attendance','rounds']){
   const result=await client.from(table).select('week_id',{count:'exact',head:true}).in('week_id',ids);
   if(result.error)throw new Error('Cannot verify '+table+' dependencies: '+result.error.message+'. No weeks deleted.');
   if(result.count>0)throw new Error('Weeks 17–20 have '+result.count+' linked '+table+' records. No weeks deleted; review them in Supabase first.');
  }
  const numbers=extras.map(w=>w.week_number).sort((a,b)=>a-b).join(', ');
  const answer=window.prompt('LIVE DATABASE CHANGE: Delete regular-season week(s) '+numbers+'? This cannot be undone. Type DELETE to confirm.');
  if(answer!=='DELETE'){message.textContent='Cancelled. No weeks deleted.';return;}
  const result=await client.from('weeks').delete().eq('league_id',leagueId).eq('week_type','regular').gte('week_number',17).lte('week_number',20).select('id');
  if(result.error)throw result.error;
  if((result.data||[]).length!==extras.length)throw new Error('Deletion count did not match expected weeks. Refresh and check database before trying again.');
  await load();message.textContent='Removed '+result.data.length+' extra regular-season weeks from Supabase.';
 }catch(e){message.textContent='No safe cleanup confirmed: '+(e.message||'Unknown error');}
 finally{button.disabled=false;}
});
el('refresh-online').addEventListener('click',load);
el('week-cancel').addEventListener('click',resetForm);
el('week-form').addEventListener('submit',async(event)=>{
 event.preventDefault();if(!leagueId){msg('Please sign in as Commissioner first.',true);return;}
 const week_number=Number(el('week-number').value),week_type=el('week-type').value,scheduled_date=el('week-date').value||null,format=el('week-format').value,statusValue=el('week-status').value;
 if(!Number.isInteger(week_number)||week_number<1||week_number>52){msg('Week number must be between 1 and 52.',true);return;}
 if(week_type==='playoff'&&week_number>4){msg('Playoff week must be 1 through 4.',true);return;}
 if(week_type==='regular'&&format==='low_net'){msg('Low net is reserved for playoff weeks.',true);return;}
 const payload={week_number,week_type,scheduled_date,format,status:statusValue};
 const id=el('week-id').value;
 el('week-save').disabled=true;msg('Saving to Supabase…');
 try{
  let query=id?client.from('weeks').update(payload).eq('id',id).eq('league_id',leagueId):client.from('weeks').insert({...payload,league_id:leagueId});
  const {error}=await query.select('id');if(error)throw error;
  resetForm();await load();msg('Week saved to Supabase.');
 }catch(e){msg('Could not save: '+(e.code==='23505'?'That week number already exists for this week type.':e.message||'Unknown error'),true);}
 finally{el('week-save').disabled=false;}
});
resetForm();await load();
})();
