(async()=>{
'use strict';
const $=id=>document.getElementById(id);
const cfg=window.BB_SUPABASE_CONFIG||{};
if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey)return;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
let leagueId=null, golfers=[],weeks=[];
const note=(id,msg)=>$(id).textContent=msg;
const option=(value,label)=>{const e=document.createElement('option');e.value=value;e.textContent=label;return e;};
const cell=(tr,value)=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td);return td;};
async function setup(){
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data:m,error}=await db.from('memberships').select('league_id').eq('user_id',user.id).eq('role','commissioner').limit(1);
 if(error||!m?.length)return;leagueId=m[0].league_id;await refresh();
}
async function refresh(){
 try{
  const [g,w,a]=await Promise.all([
   db.from('golfers').select('id,display_name,kind,flight,user_id,active').eq('league_id',leagueId).order('display_name'),
   db.from('weeks').select('id,week_number,week_type,scheduled_date').eq('league_id',leagueId),
   db.from('guest_appearances').select('week_id,golfer_id').eq('league_id',leagueId)
  ]);
  for(const r of [g,w,a])if(r.error)throw r.error;
  golfers=g.data||[];weeks=w.data||[];
  const tbody=$('golfer-rows');tbody.replaceChildren();
  for(const golfer of golfers){
   const tr=document.createElement('tr');cell(tr,golfer.display_name);cell(tr,golfer.kind);cell(tr,golfer.flight||'—');cell(tr,golfer.user_id?'Linked':'Not linked');
   const td=document.createElement('td');const b=document.createElement('button');b.type='button';b.className='small-button';b.textContent=golfer.active?'Deactivate':'Reactivate';
   b.onclick=async()=>{const {error}=await db.from('golfers').update({active:!golfer.active}).eq('id',golfer.id).eq('league_id',leagueId);note('golfer-message',error?error.message:'Status updated.');if(!error)await refresh();};
   td.append(b);tr.append(td);tbody.append(tr);
  }
  $('guest-golfer').replaceChildren(option('','Choose a guest'));
  for(const g of golfers.filter(x=>x.kind==='guest'&&x.active))$('guest-golfer').append(option(g.id,g.display_name));
  $('guest-week').replaceChildren(option('','Choose a week'));
  const ordered=[...weeks].sort((a,b)=>(a.week_type==='playoff')-(b.week_type==='playoff')||a.week_number-b.week_number);
  for(const w of ordered)$('guest-week').append(option(w.id,`${w.week_type==='playoff'?'Playoff':'Regular'} ${w.week_number}${w.scheduled_date?' · '+w.scheduled_date:''}`));
  const box=$('guest-appearances');box.replaceChildren();
  for(const ap of a.data||[]){const g=golfers.find(x=>x.id===ap.golfer_id),w=weeks.find(x=>x.id===ap.week_id);if(!g||!w)continue;
   const line=document.createElement('div');line.style.margin='8px 0';line.append(document.createTextNode(`${g.display_name} — ${w.week_type} week ${w.week_number} · money holes only `));
   const b=document.createElement('button');b.type='button';b.className='small-button';b.textContent='Remove from week';b.onclick=async()=>{const {error}=await db.from('guest_appearances').delete().eq('week_id',w.id).eq('golfer_id',g.id);note('guest-message',error?error.message:'Guest removed from week.');if(!error)await refresh();};line.append(b);box.append(line);
  }
  if(!(a.data||[]).length)box.textContent='No guest appearances assigned yet.';
 }catch(e){note('golfer-message','Setup needed: run PHASE_7_SETUP.sql in Supabase first. '+e.message);}
}
$('golfer-kind').addEventListener('change',()=>{const guest=$('golfer-kind').value==='guest';$('golfer-flight').disabled=guest;if(guest)$('golfer-flight').value='';});
$('golfer-form').addEventListener('submit',async e=>{e.preventDefault();if(!leagueId)return;
 const name=$('golfer-name').value.trim(),kind=$('golfer-kind').value,flight=kind==='guest'?null:($('golfer-flight').value||null);
 if(name.length<2)return note('golfer-message','Enter a full name.');
 const {error}=await db.from('golfers').insert({league_id:leagueId,display_name:name,kind,flight});
 note('golfer-message',error?error.message:`Added ${name} to the online roster.`);if(!error){$('golfer-form').reset();$('golfer-flight').disabled=false;await refresh();}
});
$('guest-form').addEventListener('submit',async e=>{e.preventDefault();if(!leagueId)return;
 const {error}=await db.from('guest_appearances').insert({league_id:leagueId,golfer_id:$('guest-golfer').value,week_id:$('guest-week').value});
 note('guest-message',error?(error.code==='23505'?'This guest is already assigned to that week.':error.message):'Guest assigned to week (money holes only).');if(!error)await refresh();
});
await setup();
})();
