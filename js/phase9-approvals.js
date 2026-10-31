(async()=>{
 'use strict';
 const $=id=>document.getElementById(id),cfg=window.BB_SUPABASE_CONFIG||{};
 if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey)return;
 const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
 const note=(s,bad=false)=>{const e=$('approval-status');e.textContent=s;e.style.color=bad?'#ffb6a9':'#f5d779';};
 let leagueId=null;
 async function load(){
  try{
   const {data:{user}}=await db.auth.getUser();if(!user)return;
   const {data:m,error:me}=await db.from('memberships').select('league_id').eq('user_id',user.id).eq('role','commissioner').limit(1);
   if(me)throw me;if(!m?.length)return;leagueId=m[0].league_id;
   const [r,g]=await Promise.all([db.rpc('pending_player_registrations',{p_league:leagueId}),db.from('golfers').select('id,display_name,flight').eq('league_id',leagueId).eq('kind','member').is('user_id',null).order('display_name')]);
   if(r.error)throw r.error;if(g.error)throw g.error;
   const body=$('approval-rows');body.replaceChildren();
   if(!r.data?.length){note('No pending registrations.');return;}
   for(const request of r.data){
    const tr=document.createElement('tr');
    const name=document.createElement('td');name.textContent=request.requested_name;tr.append(name);
    const target=document.createElement('td'),select=document.createElement('select');
    for(const [id,label] of [['','Create NEW active golfer'],...(g.data||[]).map(x=>[x.id,x.display_name+(x.flight?' · Flight '+x.flight:'')])]){const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);}target.append(select);tr.append(target);
    const flightTd=document.createElement('td'),flight=document.createElement('select');for(const [id,label] of [['','Unassigned'],['A','Flight A'],['B','Flight B']]){const o=document.createElement('option');o.value=id;o.textContent=label;flight.append(o);}flightTd.append(flight);tr.append(flightTd);
    select.addEventListener('change',()=>{flight.disabled=!!select.value;});
    const actions=document.createElement('td'),approve=document.createElement('button'),reject=document.createElement('button');
    approve.textContent='Approve';reject.textContent='Reject';approve.className=reject.className='small-button';
    approve.onclick=async()=>{
     const targetName=select.value?select.options[select.selectedIndex].text:'a NEW active golfer';
     if(!confirm(`Approve ${request.requested_name} and link to ${targetName}?`))return;
     approve.disabled=true;reject.disabled=true;
     const {error}=await db.rpc('approve_player_registration',{p_user:request.user_id,p_league:leagueId,p_golfer:select.value||null,p_flight:select.value?null:(flight.value||null)});
     if(error){note('Approval failed: '+error.message,true);approve.disabled=false;reject.disabled=false;return;}note('Approved '+request.requested_name+'.');await load();
    };
    reject.onclick=async()=>{if(!confirm('Reject registration for '+request.requested_name+'?'))return;const {error}=await db.rpc('reject_player_registration',{p_user:request.user_id,p_league:leagueId});if(error){note(error.message,true);return;}await load();};
    actions.append(approve,' ',reject);tr.append(actions);body.append(tr);
   }
   note(r.data.length+' pending registration(s). Match existing golfers carefully.');
  }catch(e){note('Approval setup needed: '+e.message,true);}
 }
 $('refresh-approvals').addEventListener('click',load);await load();
})();
