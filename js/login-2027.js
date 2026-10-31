(async function(){
  'use strict';
  const status=document.getElementById('auth-status');
  const form=document.getElementById('login-form');
  const signout=document.getElementById('signout');
  const account=document.getElementById('account');
  const cfg=window.BB_SUPABASE_CONFIG||{};
  const configured=/^https:\/\/[^\s]+\.supabase\.co\/?$/.test(cfg.url||'') && /^sb_publishable_/.test(cfg.publishableKey||'');
  const message=(text,error=false)=>{status.textContent=text;status.style.color=error?'#ffb6a9':'#f5d779';};
  if(!configured){message('Setup required: enter your project URL and publishable key in js/supabase-config.js.',true);form.hidden=true;return;}
  if(!window.supabase?.createClient){message('Unable to load Supabase. Check your internet connection.',true);form.hidden=true;return;}
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
  async function refresh(){
    const {data,error}=await client.auth.getUser();
    if(error || !data?.user){form.hidden=false;account.hidden=true;signout.hidden=true;message('Sign in with your Supabase account.');return;}
    form.hidden=true;account.hidden=false;signout.hidden=false;
    account.textContent='Signed in as '+(data.user.email||'user');
    const {data:membership,error:membershipError}=await client.from('memberships').select('role,display_name,league_id').eq('user_id',data.user.id).limit(1);
    if(membershipError){message('Signed in, but membership could not be checked: '+membershipError.message,true);return;}
    const record=membership?.[0];
    message(record ? 'League membership: '+record.role+'. Open your player dashboard or Commissioner HQ.' : 'Signed in. If you are a new golfer, request Commissioner approval on the registration page.');
    const link=document.getElementById('online-hq-link'); if(link)link.hidden=!record || record.role!=='commissioner';
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();message('Signing in…');
    const email=document.getElementById('email').value.trim();
    const password=document.getElementById('password').value;
    const {error}=await client.auth.signInWithPassword({email,password});
    document.getElementById('password').value='';
    if(error){message('Sign-in failed: '+error.message,true);return;}
    await refresh();
  });
  signout.addEventListener('click',async()=>{await client.auth.signOut();await refresh();});
  await refresh();
})();
