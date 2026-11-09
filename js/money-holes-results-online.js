
/* Bogus Boys 2027 — Live Money Hole Results */
(async function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const LEAGUE = '5c6fde06-0205-4f47-b333-eedcd0b47c12';
  const cfg = window.BB_SUPABASE_CONFIG;

  const esc = value => String(value ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]
  );

  const money = value => '$' + Number(value || 0)
    .toLocaleString('en-US', {
      maximumFractionDigits: 2
    });

  function showError(message) {
    $('mh-contests').textContent = message;
    $('mh-history').innerHTML =
      '<tr><td colspan="5">Results unavailable.</td></tr>';
  }

  if (!window.supabase?.createClient ||
      !cfg?.url || !cfg?.publishableKey) {
    showError('Supabase connection is unavailable.');
    return;
  }

  const db = window.supabase.createClient(
    cfg.url,
    cfg.publishableKey
  );

  let weeks = [];
  let contests = [];
  let contributions = [];
  let golfers = [];
  let guestFlights = [];

  function weekLabel(week) {
    return week.week_type === 'playoff'
      ? 'Playoff ' + week.week_number
      : 'Week ' + week.week_number;
  }

  function contestAmount(contest) {
    const slot = Number(contest.funded_slot);

    if (slot !== 1 && slot !== 2) return null;

    const golferMap = new Map(
      golfers.map(g => [g.id, g])
    );

    const guestMap = new Map(
      guestFlights
        .filter(g => g.week_id === contest.week_id)
        .map(g => [g.golfer_id, g.flight])
    );

    return contributions.filter(c => {
      if (c.week_id !== contest.week_id || !c.paid) {
        return false;
      }

      const golfer = golferMap.get(c.golfer_id);
      if (!golfer) return false;

      const assignedFlight = golfer.kind === 'guest'
        ? guestMap.get(golfer.id)
        : golfer.flight;

      return assignedFlight === contest.flight;
    }).length;
  }

  function winnerName(contest) {
    if (contest.no_winner) return 'No Winner';

    if (!contest.winner_golfer_id) return 'Not assigned';

    return golfers.find(g =>
      g.id === contest.winner_golfer_id
    )?.display_name || 'Unknown golfer';
  }

  function payoutText(contest) {
    const amount = contestAmount(contest);

    if (amount === null) return 'Separate funding';

    if (contest.no_winner) {
      return money(amount) + ' to League Fund';
    }

    if (!contest.winner_golfer_id) return 'Pending';

    return money(amount);
  }

  function render() {
    const weekId = $('mh-week').value;
    const selectedFlight = $('mh-flight').value;
    const week = weeks.find(w => w.id === weekId);

    if (!week) return;

    const matchesFlight = c =>
      selectedFlight === 'all' ||
      c.flight === selectedFlight;

    const weekly = contests.filter(c =>
      c.week_id === weekId && matchesFlight(c)
    );

    const history = contests.filter(matchesFlight);

    const awarded = c =>
      !!c.winner_golfer_id && !c.no_winner;

    const total = list => list.reduce((sum, c) => {
      if (!awarded(c)) return sum;
      return sum + (contestAmount(c) || 0);
    }, 0);

    $('mh-count').textContent = weekly.length;
    $('mh-total').textContent = money(total(weekly));
    $('mh-season').textContent = money(total(history));

    $('mh-status').textContent =
      week.status === 'finalized'
        ? 'FINALIZED'
        : 'OPEN';

    $('mh-contests').innerHTML = weekly.length
      ? weekly.map(c => `
        <article class="mh-item">
          <span class="tag">FLIGHT ${esc(c.flight)}</span>
          <h3>${esc(c.contest_name)}</h3>
          <div>Hole ${esc(c.hole_number || '—')}</div>
          <div class="winner">${esc(winnerName(c))}</div>
          <div class="payout">${esc(payoutText(c))}</div>
          <div>
            ${c.no_winner
              ? 'Unclaimed'
              : c.winner_golfer_id
                ? c.paid_out ? 'Paid' : 'Not yet paid'
                : 'Awaiting result'}
          </div>
        </article>
      `).join('')
      : '<p class="mh-empty">No Money Hole contests recorded for this week and flight.</p>';

    const weekMap = new Map(
      weeks.map(w => [w.id, w])
    );

    const ordered = [...history].sort((a, b) => {
      const wa = weekMap.get(a.week_id);
      const wb = weekMap.get(b.week_id);

      const order = w => w
        ? (w.week_type === 'playoff' ? 16 : 0) +
          Number(w.week_number)
        : -1;

      return order(wb) - order(wa);
    });

    $('mh-history').innerHTML = ordered.length
      ? ordered.map(c => {
        const w = weekMap.get(c.week_id);

        return `
          <tr>
            <td>${esc(w ? weekLabel(w) : 'Unknown week')}</td>
            <td>${esc(c.contest_name)}</td>
            <td>${esc(winnerName(c))}</td>
            <td>Flight ${esc(c.flight)}</td>
            <td>${esc(payoutText(c))}</td>
          </tr>
        `;
      }).join('')
      : '<tr><td colspan="5">No recorded contests yet.</td></tr>';
  }

  try {
    const responses = await Promise.all([
      db.from('weeks')
        .select('id,week_number,week_type,status')
        .eq('league_id', LEAGUE),

      db.from('money_contests')
        .select('id,week_id,flight,contest_name,hole_number,funded_slot,winner_golfer_id,no_winner,paid_out')
        .eq('league_id', LEAGUE),

      db.from('money_contributions')
        .select('week_id,golfer_id,paid')
        .eq('league_id', LEAGUE),

      db.from('golfers')
        .select('id,display_name,kind,flight')
        .eq('league_id', LEAGUE),

      db.from('money_guest_flights')
        .select('week_id,golfer_id,flight')
        .eq('league_id', LEAGUE)
    ]);

    for (const response of responses) {
      if (response.error) throw response.error;
    }

    [weeks, contests, contributions, golfers, guestFlights] =
      responses.map(r => r.data || []);

    weeks.sort((a, b) => {
      const aPlayoff = a.week_type === 'playoff' ? 1 : 0;
      const bPlayoff = b.week_type === 'playoff' ? 1 : 0;

      return aPlayoff - bPlayoff ||
        Number(a.week_number) - Number(b.week_number);
    });

    const select = $('mh-week');
    select.replaceChildren();

    weeks.forEach(w => {
      select.add(new Option(weekLabel(w), w.id));
    });

    select.addEventListener('change', render);
    $('mh-flight').addEventListener('change', render);

    if (!weeks.length) {
      showError('No league weeks found.');
      return;
    }

    render();

  } catch (error) {
    console.error('Money Holes results error:', error);
    showError('Unable to load live results: ' + error.message);
  }
})();
