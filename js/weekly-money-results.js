
/* Bogus Boys 2027 — Read-only Weekly Money Hole Results */
(async function () {
  'use strict';

  const LEAGUE = '5c6fde06-0205-4f47-b333-eedcd0b47c12';
  const cfg = window.BB_SUPABASE_CONFIG;
  const weekSelect = document.getElementById('week-select');

  if (!weekSelect || !cfg?.url ||
      !window.supabase?.createClient) return;

  const db = window.supabase.createClient(
    cfg.url, cfg.publishableKey
  );

  const esc = value => String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#39;'
    })[char]
  );

  const dollars = n => '$' + Number(n || 0).toLocaleString(
    'en-US', { maximumFractionDigits: 2 }
  );

  const panel = document.createElement('section');
  panel.id = 'live-money-results';
  panel.style.cssText =
    'margin:24px 0;padding:20px;border:1px solid #a77a00;' +
    'border-radius:12px;background:#191919;color:#fff';

  panel.innerHTML = `
    <h2 style="color:#ffb612;margin-top:0">
      Weekly Money Hole Results
    </h2>
    <p>Official contest results entered through Commissioner HQ.</p>
    <div id="live-money-status" role="status">
      Loading Money Hole results…
    </div>
    <div id="live-money-content"></div>
  `;

  const anchor = document.getElementById('save-message');

  if (anchor?.parentElement) {
    anchor.parentElement.insertAdjacentElement('beforebegin', panel);
  } else {
    document.querySelector('main')?.append(panel);
  }

  const status = document.getElementById('live-money-status');
  const content = document.getElementById('live-money-content');

  let requestNumber = 0;

  async function render() {
    const request = ++requestNumber;
    
const selectedWeek = weekSelect.value;
const { data: weekRecord, error: weekError } = await db
  .from('weeks')
  .select('id')
  .eq('league_id', LEAGUE)
  .eq('week_type', 'regular')
  .eq('week_number', Number(selectedWeek))
  .single();

if (weekError) {
  status.textContent = 'Unable to find week: ' + weekError.message;
  return;
}

const weekId = weekRecord.id;


    if (!weekId) {
      status.textContent = 'Choose a week to see Money Hole results.';
      content.innerHTML = '';
      return;
    }

    status.textContent = 'Loading Money Hole results…';
    content.innerHTML = '';

    const results = await Promise.all([
      db.from('money_contests')
        .select('id,flight,contest_name,hole_number,funded_slot,winner_golfer_id,no_winner,paid_out')
        .eq('league_id', LEAGUE)
        .eq('week_id', weekId),
      db.from('money_contributions')
        .select('golfer_id,paid')
        .eq('league_id', LEAGUE)
        .eq('week_id', weekId),
      db.from('golfers')
        .select('id,display_name,kind,flight')
        .eq('league_id', LEAGUE),
      db.from('money_guest_flights')
        .select('golfer_id,flight')
        .eq('league_id', LEAGUE)
        .eq('week_id', weekId)
    ]);

    if (request !== requestNumber) return;

    const error = results.find(r => r.error)?.error;
    if (error) {
      status.textContent = 'Unable to load results: ' + error.message;
      return;
    }

    const [contests, contributions, golfers, guestFlights] =
      results.map(r => r.data || []);

    const names = new Map(golfers.map(g => [g.id, g.display_name]));
    const golferMap = new Map(golfers.map(g => [g.id, g]));
    const guestFlightMap = new Map(
      guestFlights.map(g => [g.golfer_id, g.flight])
    );

    function potFor(flight) {
      return contributions.filter(c => {
        if (!c.paid) return false;
        const g = golferMap.get(c.golfer_id);
        if (!g) return false;

        const assignedFlight = g.kind === 'guest'
          ? guestFlightMap.get(g.id)
          : g.flight;

        return assignedFlight === flight;
      }).length;
    }

    status.textContent = '';

    if (!contests.length) {
      content.innerHTML =
        '<p>No Money Hole contests recorded for this week.</p>';
      return;
    }

    content.innerHTML = ['A', 'B'].map(flight => {
      const list = contests
        .filter(c => c.flight === flight)
        .sort((a, b) =>
          Number(a.hole_number) - Number(b.hole_number)
        );

      const rows = list.length ? list.map(c => {
        const funded = [1, 2].includes(Number(c.funded_slot));
        const amount = funded ? potFor(flight) : null;

        const winner = c.no_winner
          ? 'No Winner'
          : c.winner_golfer_id
            ? names.get(c.winner_golfer_id) || 'Unknown golfer'
            : 'Not assigned';

        const payout = !funded
          ? 'Separate funding'
          : c.no_winner
            ? dollars(amount) + ' to League Fund'
            : dollars(amount);

        const payment = c.no_winner
          ? 'No payout'
          : c.winner_golfer_id
            ? (c.paid_out ? 'Paid' : 'Not yet paid')
            : 'Pending';

        return `
          <tr>
            <td>${esc(c.contest_name)}</td>
            <td>${esc(c.hole_number)}</td>
            <td>${esc(winner)}</td>
            <td>${esc(payout)}</td>
            <td>${esc(payment)}</td>
          </tr>`;
      }).join('') : `
        <tr><td colspan="5">No contests recorded.</td></tr>`;

      return `
        <h3 style="color:#ffb612">Flight ${flight}</h3>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th>Contest</th>
                <th>Hole</th>
                <th>Winner</th>
                <th>Prize</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');
  }

  weekSelect.addEventListener('change', render);

  // The Weekly Results script populates the week selector
  // asynchronously. Wait for it to receive its first week.
  const observer = new MutationObserver(() => {
    if (weekSelect.value) {
      observer.disconnect();
      render();
    }
  });

  if (weekSelect.value) {
    render();
  } else {
    observer.observe(weekSelect, { childList: true });
  }
})();
