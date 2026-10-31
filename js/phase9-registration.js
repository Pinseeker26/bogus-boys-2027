(async()=>{
 'use strict';
 const $=id=>document.getElementById(id), cfg=window.BB_SUPABASE_CONFIG||{};
 const say=(s,bad=false)=>{const e=$('registration-status');e.textContent=s;e.style.color=bad?'#ffb6a9':'#f5d779';};
 if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey){say('Configure js/supabase-config.js first.',true);return;}
 const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
 async function check(){
  const {data:{user}}=await db.auth.getUser();
  if(!user){say('Register below, then confirm your email.');return;}
  $('registration-form').hidden=true;$('registration-submit').hidden=false;
  const {data:m}=await db.from('memberships').select('role').eq('user_id',user.id).limit(1);
  if(m?.length){say('Account approved. Sign in to your player dashboard.');$('registration-submit').hidden=true;return;}
  const {data:r,error}=await db.rpc('my_player_registration');
  if(error){say('Phase 9 database setup required: '+error.message,true);return;}
  const status=r?.[0]?.registration_status;
  if(status==='pending'){say('Your request is pending Commissioner approval.');$('registration-submit').hidden=true;}
  else if(status==='rejected'){say('This request was not approved. Contact the Commissioner.');$('registration-submit').hidden=true;}
  else say('Email confirmed? Submit your name for Commissioner approval.');
 }
 $('registration-form').addEventListener('submit',async e=>{
  e.preventDefault();say('Creating account…');
  const name=$('reg-first').value.trim()+' '+$('reg-last').value.trim();
  const email=$('reg-email').value.trim(),password=$('reg-password').value;
  const {data,error}=await db.auth.signUp({email,password,options:{data:{requested_name:name}}});
  $('reg-password').value='';
  if(error){say(error.message,true);return;}
  if(data.session){$('registration-submit').hidden=false;say('Account created. Submit your name for approval.');}
  else say('Check your email for a confirmation link. Then return here and sign in.');
 });
 $('registration-submit').addEventListener('click',async()=>{
  say('Submitting request…');
  const {data:{user}}=await db.auth.getUser();
  if(!user){say('Please sign in first using Clubhouse Sign In.',true);return;}
  const name=user.user_metadata?.requested_name;
  if(!name){say('Name missing from registration. Contact the Commissioner.',true);return;}
  const {data,error}=await db.rpc('submit_player_registration',{p_name:name});
  if(error){say(error.message,true);return;}
  say(data==='already_member'?'You already have league access.':'Registration submitted. Waiting for Commissioner approval.');
  await check();
 });
 await check();
})();
