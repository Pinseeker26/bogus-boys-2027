
/* Bogus Boys 2027 — Commissioner Money & Payouts (Supabase) */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LEAGUE = '5c6fde06-0205-4f47-b333-eedcd0b47c12';
  const cfg = window.BB_SUPABASE_CONFIG;
  const money = n => '$' + Number(n || 0).toLocaleString('en-US');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const status = s => { $('money-status').textContent = s; };
  if (!window.supabase?.createClient || !cfg?.url || !cfg?.publishableKey) {
    status('Supabase configuration is missing.'); return;
  }
  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);
  let weeks=[], golfers=[], attendance=[], guests=[], contributions=[],
      contests=[], payouts=[], guestFlights=[], commissioner=false;
  const currentWeek = () => weeks.find(w => w.id === $('money-week').value);
  const flight = () => $('money-flight').value;
  const golfer = id => golfers.find(g => g.id === id);
  const name = id => golfer(id)?.display_name || 'Unknown golfer';
  const isGuest = g => g.kind === 'guest';
  const isLocked = () => currentWeek()?.status === 'finalized';
  const playing = (weekId) => {
    const signed = new Set(attendance.filter(a =>
      a.week_id === weekId && a.response === 'playing'
    ).map(a => a.golfer_id));
    return golfers.filter(g =>
      g.active && g.kind === 'member' && signed.has(g.id));
  };
  const assignedGuests = weekId => {
    const assigned = new Set(guests.filter(g =>
      g.week_id === weekId).map(g => g.golfer_id));
    return golfers.filter(g => g.active && isGuest(g) && assigned.has(g.id));
  };
  const assignedFlight = (weekId, g) => {
    if (!isGuest(g)) return g.flight;
    return guestFlights.find(x =>
      x.week_id === weekId && x.golfer_id === g.id)?.flight || '';
  };
  const paid = (weekId, id) =>
    contributions.some(c => c.week_id === weekId &&
      c.golfer_id === id && c.paid);
  const eligible = (weekId, f) =>
    [...playing(weekId),...assignedGuests(weekId)].filter(g =>
      assignedFlight(weekId,g) === f);
  const paidMembers = (weekId,f) =>
    eligible(weekId,f).filter(g => !isGuest(g) && paid(weekId,g.id));
  const paidGuests = (weekId,f) =>
    eligible(weekId,f).filter(g => isGuest(g) && paid(weekId,g.id));
  const pot = (weekId,f) =>
    paidMembers(weekId,f).length + paidGuests(weekId,f).length;
  const purse = (weekId,f) =>
    paidMembers(weekId,f).length * 3;
  const contestsFor = (weekId,f) =>
    contests.filter(c => c.week_id === weekId && c.flight === f);
  function option(value,label) {
    const o=document.createElement('option'); o.value=value;
    o.textContent=label; return o;
  }
  function render() {
    const w=currentWeek(); if (!w) return;
    const f=flight(), locked=isLocked(), members=eligible(w.id,f);
    $('money-flight-purse').textContent=money(purse(w.id,f));
    $('money-pot-one').textContent=money(pot(w.id,f));
    $('money-pot-two').textContent=money(pot(w.id,f));
    $('money-players').innerHTML=members.length ? members.map(g => {
      const guest=isGuest(g), isPaid=paid(w.id,g.id);
      const guestSelect=guest
        ? `<select data-guest-flight="${esc(g.id)}" ${locked?'disabled':''}>
          <option value="A" ${f==='A'?'selected':''}>A</option>
          <option value="B" ${f==='B'?'selected':''}>B</option>
          </select>`
        : 'Flight '+esc(g.flight);
      return `<tr><td>${esc(g.display_name)}</td>
        <td>${guest?'Guest':'Member'}</td>
        <td>${guestSelect}</td>
        <td>${money(guest?2:5)}</td>
        <td><input type="checkbox" data-paid="${esc(g.id)}"
          ${isPaid?'checked':''} ${locked?'disabled':''}></td></tr>`;
    }).join('') : '<tr><td colspan="5">No eligible golfers in this flight.</td></tr>';
    const list=contestsFor(w.id,f);
    $('money-contests').innerHTML=list.length ? list.map(c => {
      const funded=Number(c.funded_slot);
      const amount=funded===1||funded===2 ? pot(w.id,f) : 0;
      const possible=members.filter(g => paid(w.id,g.id));
      const winnerOptions=[
        '<option value="">Not assigned</option>',
        ...possible.map(g => `<option value="${esc(g.id)}"
          ${c.winner_golfer_id===g.id?'selected':''}>
          ${esc(g.display_name)}</option>`)
      ].join('');
      return `<tr><td>${esc(c.contest_name)}</td>
        <td>${esc(c.hole_number)}</td>
        <td>${money(amount)}</td>
        <td><select data-winner="${esc(c.id)}" ${locked?'disabled':''}>
          ${winnerOptions}</select>
          <label style="display:block;font-size:.8rem">
            <input type="checkbox" data-no-winner="${esc(c.id)}"
            ${c.no_winner?'checked':''} ${locked?'disabled':''}>
            No winner</label></td>
        <td><input type="checkbox" data-paid-out="${esc(c.id)}"
          ${c.paid_out?'checked':''} ${locked?'disabled':''}></td>
        <td><button type="button" class="small-button"
          data-remove-contest="${esc(c.id)}" ${locked?'disabled':''}>
          Remove</button></td></tr>`;
    }).join('') : '<tr><td colspan="6">No contests for this week and flight.</td></tr>';
    const form=$('money-contest-form');
    [...form.elements].forEach(el => el.disabled=locked);
    status(locked
      ? 'Week finalized. Money Hole assignments are locked.'
      : 'Connected to Supabase. Changes save automatically.');
  }
  async function load() {
    status('Loading money holes…');
    const {data:auth,error:authError}=await db.auth.getUser();
    if (authError) throw authError;
    if (!auth?.user) throw Error('Sign in as commissioner first.');
    const {data:membership,error:memberError}=await db.from('memberships')
      .select('role').eq('league_id',LEAGUE)
      .eq('user_id',auth.user.id);
    if (memberError) throw memberError;
    commissioner=(membership||[]).some(m => m.role==='commissioner');
    if (!commissioner) throw Error('Commissioner access required.');
    const requests=await Promise.all([
      db.from('weeks').select('id,week_number,week_type,status,scheduled_date')
        .eq('league_id',LEAGUE).order('week_number'),
      db.from('golfers').select('id,display_name,kind,flight,active')
        .eq('league_id',LEAGUE),
      db.from('attendance_signups').select('week_id,golfer_id,response')
        .eq('league_id',LEAGUE),
      db.from('guest_appearances').select('week_id,golfer_id')
        .eq('league_id',LEAGUE),
      db.from('money_contributions').select('week_id,golfer_id,paid')
        .eq('league_id',LEAGUE),
      db.from('money_contests').select('*').eq('league_id',LEAGUE),
      db.from('money_flight_payouts').select('*').eq('league_id',LEAGUE),
      db.from('money_guest_flights').select('week_id,golfer_id,flight')
        .eq('league_id',LEAGUE)
    ]);
    for (const r of requests) if (r.error) throw r.error;
    [weeks,golfers,attendance,guests,contributions,contests,payouts,
      guestFlights]=requests.map(r => r.data||[]);
    weeks=weeks.filter(w => w.week_type==='regular' ||
      w.week_type==='playoff').sort((a,b) => {
        if (a.week_type!==b.week_type)
          return a.week_type==='regular'?-1:1;
        return a.week_number-b.week_number;
      });
    const select=$('money-week'),old=select.value;
    select.replaceChildren();
    weeks.forEach(w => select.add(option(w.id,
      (w.week_type==='playoff'?'Playoff ':'Week ')+w.week_number)));
    if (weeks.some(w => w.id===old)) select.value=old;
    render();
  }
  async function upsertContribution(weekId,golferId,isPaid) {
    const {error}=await db.from('money_contributions').upsert({
      league_id:LEAGUE,week_id:weekId,golfer_id:golferId,paid:isPaid
    },{onConflict:'league_id,week_id,golfer_id'});
    if (error) throw error;
    const old=contributions.find(c =>
      c.week_id===weekId && c.golfer_id===golferId);
    if (old) old.paid=isPaid;
    else contributions.push({week_id:weekId,golfer_id:golferId,paid:isPaid});
  }
  async function saveGuestFlight(weekId,golferId,f) {
    const {error}=await db.from('money_guest_flights').upsert({
      league_id:LEAGUE,week_id:weekId,golfer_id:golferId,flight:f
    },{onConflict:'league_id,week_id,golfer_id'});
    if (error) throw error;
    const old=guestFlights.find(g =>
      g.week_id===weekId && g.golfer_id===golferId);
    if (old) old.flight=f;
    else guestFlights.push({week_id:weekId,golfer_id:golferId,flight:f});
  }
  async function updateContest(id,patch) {
    const {data,error}=await db.from('money_contests')
      .update(patch).eq('id',id).eq('league_id',LEAGUE)
      .select();
    if (error) throw error;
    if (!data?.length) throw Error('Contest update was not saved.');
    const i=contests.findIndex(c=>c.id===id);
    if (i>=0) contests[i]=data[0];
  }
  $('money-week').addEventListener('change',render);
  $('money-flight').addEventListener('change',render);
  $('money-players').addEventListener('change',async e => {
    const el=e.target,w=currentWeek();
    if (!w||isLocked()) return;
    try {
      if (el.dataset.paid!==undefined)
        await upsertContribution(w.id,el.dataset.paid,el.checked);
      if (el.dataset.guestFlight!==undefined)
        await saveGuestFlight(w.id,el.dataset.guestFlight,el.value);
      render();
    } catch(err) {status('NOT SAVED: '+err.message);el.disabled=true;}
  });
  $('money-contest-form').addEventListener('submit',async e => {
    e.preventDefault();const w=currentWeek();
    if (!w||isLocked()) return;
    const contest_name=$('money-contest-name').value.trim();
    const hole_number=Number($('money-contest-hole').value);
    const funded_slot=Number($('money-contest-slot').value);
    if (!contest_name||!Number.isInteger(hole_number)||
        hole_number<1||hole_number>18) {
      status('Enter a contest name and valid hole number.');return;
    }
    if (funded_slot===1||funded_slot===2) {
      if (contestsFor(w.id,flight()).some(c =>
        Number(c.funded_slot)===funded_slot)) {
        status('That funded Money Hole slot is already assigned.');
        return;
      }
    }
    const {data,error}=await db.from('money_contests').insert({
      league_id:LEAGUE,week_id:w.id,flight:flight(),
      contest_name,hole_number,funded_slot,
      winner_golfer_id:null,paid_out:false,no_winner:false
    }).select();
    if (error) {status('NOT SAVED: '+error.message);return;}
    contests.push(...(data||[]));
    e.target.reset();render();
  });
  $('money-contests').addEventListener('change',async e => {
    const el=e.target,w=currentWeek();
    if (!w||isLocked()) return;
    const id=el.dataset.winner??el.dataset.noWinner??el.dataset.paidOut;
    if (!id) return;
    let patch={};
    if (el.dataset.winner!==undefined)
      patch={winner_golfer_id:el.value||null,no_winner:false};
    if (el.dataset.noWinner!==undefined)
      patch={no_winner:el.checked,
        winner_golfer_id:el.checked?null:
          contests.find(c=>c.id===id)?.winner_golfer_id||null};
    if (el.dataset.paidOut!==undefined)
      patch={paid_out:el.checked};
    try {await updateContest(id,patch);render();}
    catch(err) {status('NOT SAVED: '+err.message);}
  });
  $('money-contests').addEventListener('click',async e => {
    const btn=e.target.closest('[data-remove-contest]');
    if (!btn||isLocked()) return;
    if (!confirm('Remove this Money Hole contest?')) return;
    const id=btn.dataset.removeContest;
    const {error}=await db.from('money_contests')
      .delete().eq('id',id).eq('league_id',LEAGUE);
    if (error) {status('NOT REMOVED: '+error.message);return;}
    contests=contests.filter(c=>c.id!==id);render();
  });
  try {await load();}
  catch(err) {status('Money & Payouts error: '+err.message);}
})();
