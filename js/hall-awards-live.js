
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

  // Lowest Gross and Lowest Net — finalized league rounds.

  async function loadLowestRoundAwards() {
    const grossElement =
      document.getElementById('lowest-gross-award');
    const netElement =
      document.getElementById('lowest-net-award');

    if (!grossElement || !netElement) return;

    const setStatus = message => {
      grossElement.textContent = message;
      netElement.textContent = message;
    };

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey) {
      setStatus('Results unavailable');
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url,
        cfg.publishableKey
      );

      const [weeksResult, golfersResult] = await Promise.all([
        client.from('weeks')
          .select('id,status')
          .eq('league_id', LEAGUE),

        client.from('golfers')
          .select('id,display_name,kind')
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const finalizedWeekIds = (weeksResult.data || [])
        .filter(w => w.status === 'finalized')
        .map(w => w.id);

      if (!finalizedWeekIds.length) {
        setStatus('To Be Determined');
        return;
      }

      const members = new Map(
        (golfersResult.data || [])
          .filter(g => g.kind === 'member')
          .map(g => [g.id, g.display_name])
      );

      const { data: rounds, error } = await client
        .from('rounds')
        .select(
          'week_id,golfer_id,gross_score,handicap_used,finalized'
        )
        .in('week_id', finalizedWeekIds)
        .eq('finalized', true);

      if (error) throw error;

      const eligible = (rounds || []).filter(r =>
        members.has(r.golfer_id) &&
        r.gross_score != null &&
        Number.isFinite(Number(r.gross_score))
      );

      function showLowest(element, getScore, label) {
        const scored = eligible
          .map(r => ({
            name: members.get(r.golfer_id),
            score: getScore(r)
          }))
          .filter(r => Number.isFinite(r.score));

        if (!scored.length) {
          element.textContent = 'To Be Determined';
          return;
        }

        const lowest = Math.min(
          ...scored.map(r => r.score)
        );

        const names = [...new Set(
          scored
            .filter(r => r.score === lowest)
            .map(r => r.name)
        )].sort((a, b) => a.localeCompare(b));

        element.textContent =
          names.join(' / ') +
          ' — ' + lowest + ' ' + label;
      }

      showLowest(
        grossElement,
        r => Number(r.gross_score),
        'gross'
      );

      showLowest(
        netElement,
        r => r.handicap_used == null
          ? NaN
          : Number(r.gross_score) -
            Number(r.handicap_used),
        'net'
      );

    } catch (error) {
      console.error('Lowest Round Awards error:', error);
      setStatus('Results unavailable');
    }
  }

  await loadLowestRoundAwards();

  // Most Weekly Victories — regular-season flight wins only.

  async function loadMostWeeklyVictories() {
    const element = document.getElementById('most-weekly-wins');
    if (!element) return;

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey) {
      element.textContent = 'Results unavailable';
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url, cfg.publishableKey
      );

      const [weeksResult, golfersResult] = await Promise.all([
        client.from('weeks')
          .select('id,status,week_type')
          .eq('league_id', LEAGUE)
          .eq('week_type', 'regular'),

        client.from('golfers')
          .select('id,display_name,flight,kind')
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const finalizedWeeks = (weeksResult.data || [])
        .filter(w => w.status === 'finalized');

      if (!finalizedWeeks.length) {
        element.textContent = 'To Be Determined';
        return;
      }

      const members = new Map(
        (golfersResult.data || [])
          .filter(g => g.kind === 'member' &&
            ['A', 'B'].includes(g.flight))
          .map(g => [g.id, g])
      );

      const { data: rounds, error } = await client
        .from('rounds')
        .select('week_id,golfer_id,bb_points,finalized')
        .in('week_id', finalizedWeeks.map(w => w.id))
        .eq('finalized', true);

      if (error) throw error;

      const groups = new Map();

      for (const round of rounds || []) {
        const golfer = members.get(round.golfer_id);
        if (!golfer || round.bb_points == null) continue;

        const key = round.week_id + ':' + golfer.flight;

        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          id: golfer.id,
          points: Number(round.bb_points)
        });
      }

      const wins = new Map();

      for (const players of groups.values()) {
        const highest = Math.max(...players.map(p => p.points));

        for (const player of players) {
          if (player.points !== highest) continue;

          wins.set(
            player.id,
            (wins.get(player.id) || 0) + 1
          );
        }
      }

      if (!wins.size) {
        element.textContent = 'To Be Determined';
        return;
      }

      const highestWins = Math.max(...wins.values());

      const leaders = [...wins.entries()]
        .filter(([, count]) => count === highestWins)
        .map(([id]) => members.get(id)?.display_name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      element.textContent =
        leaders.join(' / ') +
        ' — ' + highestWins +
        (highestWins === 1 ? ' victory' : ' victories');

    } catch (error) {
      console.error('Most Weekly Victories error:', error);
      element.textContent = 'Results unavailable';
    }
  }

  await loadMostWeeklyVictories();

})();
