
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
  
  // Flight Champions — finalized regular-season BBPts only.
  // This section is independent of the Money Hole awards.

  async function loadFlightChampions() {
    const flightA = document.getElementById('flight-a-champion');
    const flightB = document.getElementById('flight-b-champion');

    if (!flightA || !flightB) return;

    const setFlightStatus = message => {
      flightA.textContent = message;
      flightB.textContent = message;
    };

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey) {
      setFlightStatus('Results unavailable');
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url,
        cfg.publishableKey
      );

      const [weeksResult, golfersResult] = await Promise.all([
        client.from('weeks')
          .select('id,week_number,status')
          .eq('league_id', LEAGUE)
          .eq('week_type', 'regular'),

        client.from('golfers')
          .select('id,display_name,flight,kind,active')
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const weeks = weeksResult.data || [];
      const golfers = (golfersResult.data || []).filter(
        g => g.active &&
          g.kind === 'member' &&
          ['A', 'B'].includes(g.flight)
      );

      const finalizedWeeks = weeks.filter(
        w => w.status === 'finalized'
      );

      // Don't crown champions before the regular season ends.
      const completedNumbers = new Set(
        finalizedWeeks.map(w => Number(w.week_number))
      );

      if (completedNumbers.size !== 16) {
        setFlightStatus('To Be Determined');
        return;
      }

      const { data: rounds, error } = await client
        .from('rounds')
        .select('week_id,golfer_id,bb_points,finalized')
        .in('week_id', finalizedWeeks.map(w => w.id))
        .eq('finalized', true);

      if (error) throw error;

      const totals = new Map();

      for (const round of rounds || []) {
        if (round.bb_points == null) continue;

        totals.set(
          round.golfer_id,
          (totals.get(round.golfer_id) || 0) +
            Number(round.bb_points)
        );
      }

      function showChampion(element, flight) {
        const players = golfers
          .filter(g => g.flight === flight)
          .map(g => ({
            name: g.display_name,
            points: totals.get(g.id) || 0
          }));

        if (!players.length) {
          element.textContent = 'No eligible golfers';
          return;
        }

        const highest = Math.max(
          ...players.map(p => p.points)
        );

        const leaders = players
          .filter(p => p.points === highest)
          .map(p => p.name)
          .sort((a, b) => a.localeCompare(b));

        element.textContent =
          leaders.join(' / ') +
          ' — ' +
          highest.toLocaleString('en-US') +
          ' BBPts';
      }

      showChampion(flightA, 'A');
      showChampion(flightB, 'B');

    } catch (error) {
      console.error('Flight Champions error:', error);
      setFlightStatus('Results unavailable');
    }
  }

  await loadFlightChampions();

})();
