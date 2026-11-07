(async()=>{'use strict';
const $=id=>document.getElementById(id),cfg=window.BB_SUPABASE_CONFIG||{};
const say=(s,bad=false)=>{$('message').textContent=s;$('message').className=bad?'error':''};
if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey){say('Supabase connection unavailable.',true);return}
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);let leagueId,commissioner=false,golfers=[],weeks=[],attendance=[],payments=[],selfId=null;
const dollars=c=>'$'+(c/100).toFixed(2),row=(tag,txt)=>{const x=document.createElement(tag);x.textContent=txt;return x};
async function get(q){const r=await q;if(r.error)throw r.error;return r.data||[]}
async function init(){try{
const {data:{user},error}=await db.auth.getUser();if(error)throw error;if(!user){say('Please sign in first at Clubhouse Sign In.');return}
const memberships=await get(db.from('memberships').select('league_id,role').eq('user_id',user.id));
if(!memberships.length){say('No approved league membership found.',true);return}
const m=memberships.find(x=>x.role==='commissioner')||memberships[0];leagueId=m.league_id;commissioner=m.role==='commissioner';
const [g,w]=await Promise.all([get(db.from('golfers').select('id,display_name,user_id,kind,active').eq('league_id',leagueId).eq('kind','member').eq('active',true).order('display_name')),get(db.from('weeks').select('id,week_number,week_type,scheduled_date').eq('league_id',leagueId))]);
golfers=g;weeks=w.sort((a,b)=>(a.week_type==='playoff')-(b.week_type==='playoff')||a.week_number-b.week_number);selfId=g.find(x=>x.user_id===user.id)?.id||null;
if(!commissioner&&!selfId){say('Your golfer profile is not linked to this account.',true);return}
if(commissioner){$('commissioner').hidden=false;$('payout-panel').hidden=false;const sel=$('golfer-choice');g.forEach(x=>{const o=row('option',x.display_name);o.value=x.id;sel.append(o)});if(selfId)sel.value=selfId;sel.onchange=render;$('reload').onclick=load;}
$('content').hidden=false;await load();
}catch(e){say('Unable to open finances: '+e.message,true)}}
async function load(){try{say('Loading payments…');
const [a,p]=await Promise.all([get(db.from('attendance_signups').select('golfer_id,week_id,response').eq('league_id',leagueId)),get(db.from('bb_finance_payments').select('id,golfer_id,week_id,payment_type,amount_cents').eq('league_id',leagueId))]);attendance=a;payments=p;render();say('Payment records loaded.');
}catch(e){say('Could not load payment records: '+e.message,true)}}
async function toggle(golferId,weekId,type,paid){if(!commissioner)return;const buttonStatus=$('commissioner-status');buttonStatus.textContent='Saving…';try{
if(paid){const r=await db.from('bb_finance_payments').insert({league_id:leagueId,golfer_id:golferId,week_id:weekId,payment_type:type,amount_cents:type==='weekly'?500:1000});if(r.error)throw r.error}
else{let q=db.from('bb_finance_payments').delete().eq('league_id',leagueId).eq('golfer_id',golferId).eq('payment_type',type);q=weekId?q.eq('week_id',weekId):q.is('week_id',null);const r=await q;if(r.error)throw r.error}
await load();buttonStatus.textContent='Payment record saved.';
}catch(e){buttonStatus.textContent='Could not save: '+e.message}}
function render(){const id=commissioner?$('golfer-choice').value:selfId,g=golfers.find(x=>x.id===id);if(!g){$('week-rows').replaceChildren();return}
$('view-title').textContent=commissioner?'Payments · '+g.display_name:'My Payment Summary';
const memberPayments=payments.filter(p=>p.golfer_id===id),paidWeeks=new Set(memberPayments.filter(p=>p.payment_type==='weekly').map(p=>p.week_id));
const paidChamp=memberPayments.some(p=>p.payment_type==='championship'),dueWeeks=weeks.filter(w=>attendance.some(a=>a.golfer_id===id&&a.week_id===w.id&&a.response==='playing'));
const weeklyDue=dueWeeks.length*500,weeklyPaid=paidWeeks.size*500,champPaid=paidChamp?1000:0;
$('weekly-due').textContent=dollars(weeklyDue);$('weekly-paid').textContent=dollars(weeklyPaid);$('champ-paid').textContent=dollars(champPaid);
const unpaidWeeks=dueWeeks.filter(w=>!paidWeeks.has(w.id)).length;
$('outstanding').textContent=dollars(unpaidWeeks*500+(paidChamp?0:1000));
$('summary-note').textContent='Weekly dues earned from paid regular-season weeks: '+dollars(weeks.filter(w=>w.week_type==='regular'&&paidWeeks.has(w.id)).length*100)+'. Amount due is based on weeks marked Playing; championship contribution is due once.';
const tbody=$('week-rows');tbody.replaceChildren();weeks.forEach(w=>{const a=attendance.find(x=>x.golfer_id===id&&x.week_id===w.id),playing=a?.response==='playing',paid=paidWeeks.has(w.id),tr=document.createElement('tr');
tr.append(row('td',(w.week_type==='playoff'?'Playoff':'Regular')+' '+w.week_number),row('td',a?.response==='playing'?'Playing':a?.response==='not_playing'?'Not Playing':'No Response'),row('td',playing?'$5.00':'$0.00'),row('td',paid?'$5.00':'$0.00'));
const cell=document.createElement('td');if(commissioner){const btn=row('button',paid?'Undo paid':'Mark paid');btn.onclick=()=>toggle(id,w.id,'weekly',!paid);cell.append(btn)}else cell.textContent=paid?'Paid':'Unpaid';tr.append(cell);tbody.append(tr)});
$('championship-state').textContent=paidChamp?'Paid':'Not paid';const ca=$('championship-action');ca.replaceChildren();if(commissioner){const btn=row('button',paidChamp?'Undo championship payment':'Mark $10 championship paid');btn.onclick=()=>toggle(id,null,'championship',!paidChamp);ca.append(btn)}
if(commissioner){const total=payments.filter(p=>p.payment_type==='championship').reduce((sum,p)=>sum+p.amount_cents,0);$('pot-total').textContent=dollars(total);[40,30,20,10].forEach((pct,i)=>$('pot-'+(i+1)).textContent=dollars(Math.floor(total*pct/100)));$('action-head').textContent='Commissioner action'}
}
await init();
})();
