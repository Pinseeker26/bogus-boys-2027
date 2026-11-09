
/* Bogus Boys 2027 — Hall of Champions Live Awards */
(async function () {
  'use strict';

  const LEAGUE = '5c6fde06-0205-4f47-b333-eedcd0b47c12';
  const cfg = window.BB_SUPABASE_CONFIG;

  const ctpElement = document.getElementById('ctp-king');
  const puttingElement = document.getElementById('putting-king');

  if (!ctpElement || !puttingElement) return;

  function setBoth(message) {
    ctpElement.textContent = message;
    puttingElement.textContent = message;
  }

  function contestType(name) {
    const text = String(name || '').toLowerCase();

    if (/\bctp\b|closest[\s-]*to[\s-]*the[\s-]*pin/.test(text)) {
      return 'ctp';
    }

    if (/longest[\s-]*putt|long[\s-]*putt/.test(text)) {
      return 'putting';
    }

    return null;
  }

  function displayLeaders(element, counts, golferMap) {
    if (!counts.size) {
      element.textContent = 'To Be Determined';
      return;
    }

    const highest = Math.max(...counts.values());

    const leaders = [...counts.entries()]
      .filter(([, wins]) => wins === highest)
      .map(([id]) => golferMap.get(id)?.display_name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    element.textContent =
      leaders.join(' / ') +
      ' — ' +
      highest +
      (highest === 1 ? ' win' : ' wins');
  }

  if (!window.supabase?.createClient ||
      !cfg?.url || !cfg?.publishableKey) {
    setBoth('Results unavailable');
    return;
  }

  try {
    const db = window.supabase.createClient(
      cfg.url,
      cfg.publishableKey
    );

    const responses = await Promise.all([
      db.from('weeks')
        .select('id,status')
        .eq('league_id', LEAGUE),

      db.from('money_contests')
        .select('week_id,contest_name,winner_golfer_id,no_winner')
        .eq('league_id', LEAGUE),

      db.from('golfers')
        .select('id,display_name,kind')
        .eq('league_id', LEAGUE)
    ]);

    for (const response of responses) {
      if (response.error) throw response.error;
    }

    const [weeks, contests, golfers] =
      responses.map(response => response.data || []);

    const finalizedWeeks = new Set(
      weeks
        .filter(week => week.status === 'finalized')
        .map(week => week.id)
    );

    const golferMap = new Map(
      golfers.map(golfer => [golfer.id, golfer])
    );

    const ctpWins = new Map();
    const puttingWins = new Map();

    for (const contest of contests) {
      if (!finalizedWeeks.has(contest.week_id)) continue;
      if (contest.no_winner) continue;
      if (!contest.winner_golfer_id) continue;

      const golfer = golferMap.get(contest.winner_golfer_id);

      // Guests and non-league members are excluded.
      if (!golfer || golfer.kind === 'guest') continue;

      const type = contestType(contest.contest_name);
      const counts = type === 'ctp'
        ? ctpWins
        : type === 'putting'
          ? puttingWins
          : null;

      if (!counts) continue;

      counts.set(
        golfer.id,
        (counts.get(golfer.id) || 0) + 1
      );
    }

    displayLeaders(ctpElement, ctpWins, golferMap);
    displayLeaders(puttingElement, puttingWins, golferMap);

  } catch (error) {
    console.error('Hall awards error:', error);
    setBoth('Results unavailable');
  }
})();
