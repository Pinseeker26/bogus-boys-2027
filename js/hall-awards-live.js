
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

  // Most Consistent Golfer — finalized regular-season net scores.
  // Minimum 8 rounds. Lowest standard deviation wins.

  async function loadMostConsistentGolfer() {
    const element = document.getElementById('most-consistent-award');
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
          .select('id,status')
          .eq('league_id', LEAGUE)
          .eq('week_type', 'regular'),

        client.from('golfers')
          .select('id,display_name,kind')
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const finalizedWeeks = (weeksResult.data || [])
        .filter(w => w.status === 'finalized')
        .map(w => w.id);

      if (!finalizedWeeks.length) {
        element.textContent = 'To Be Determined';
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
        .in('week_id', finalizedWeeks)
        .eq('finalized', true);

      if (error) throw error;

      const scores = new Map();

      for (const round of rounds || []) {
        if (!members.has(round.golfer_id)) continue;
        if (round.gross_score == null ||
            round.handicap_used == null) continue;

        const net = Number(round.gross_score) -
          Number(round.handicap_used);

        if (!Number.isFinite(net)) continue;

        if (!scores.has(round.golfer_id)) {
          scores.set(round.golfer_id, []);
        }

        scores.get(round.golfer_id).push(net);
      }

      const qualified = [];

      for (const [id, values] of scores) {
        if (values.length < 8) continue;

        const average = values.reduce(
          (sum, value) => sum + value, 0
        ) / values.length;

        const variance = values.reduce(
          (sum, value) => sum +
            Math.pow(value - average, 2), 0
        ) / values.length;

        qualified.push({
          name: members.get(id),
          deviation: Math.sqrt(variance)
        });
      }

      if (!qualified.length) {
        element.textContent = 'To Be Determined';
        return;
      }

      const lowest = Math.min(
        ...qualified.map(p => p.deviation)
      );

      // Compare at two decimal places for tied awards.
      const roundedLowest = lowest.toFixed(2);

      const leaders = qualified
        .filter(p =>
          p.deviation.toFixed(2) === roundedLowest
        )
        .map(p => p.name)
        .sort((a, b) => a.localeCompare(b));

      element.textContent =
        leaders.join(' / ') +
        ' — ' + roundedLowest + ' SD';

    } catch (error) {
      console.error('Most Consistent Golfer error:', error);
      element.textContent = 'Results unavailable';
    }
  }

  await loadMostConsistentGolfer();

  // Most Improved Golfer — regular-season handicap improvement.
  // Uses the existing Bogus Boys handicap engine.

  async function loadMostImprovedGolfer() {
    const element = document.getElementById('most-improved-award');
    if (!element) return;

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey ||
        !window.BBHandicap2027?.calculateLeagueHandicap) {
      element.textContent = 'Results unavailable';
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url, cfg.publishableKey
      );

      const [weeksResult, golfersResult] = await Promise.all([
        client.from('weeks')
          .select('id,week_number,status')
          .eq('league_id', LEAGUE)
          .eq('week_type', 'regular'),

        client.from('golfers')
          .select(
            'id,display_name,kind,starting_handicap'
          )
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const finalizedWeeks = (weeksResult.data || [])
        .filter(w => w.status === 'finalized')
        .sort((a, b) =>
          Number(a.week_number) - Number(b.week_number)
        );

      if (!finalizedWeeks.length) {
        element.textContent = 'To Be Determined';
        return;
      }

      const weekOrder = new Map(
        finalizedWeeks.map(w => [
          w.id, Number(w.week_number)
        ])
      );

      const { data: rounds, error } = await client
        .from('rounds')
        .select(
          'week_id,golfer_id,gross_score,course_rating,slope_rating,finalized'
        )
        .in('week_id', finalizedWeeks.map(w => w.id))
        .eq('finalized', true);

      if (error) throw error;

      const members = (golfersResult.data || [])
        .filter(g =>
          g.kind === 'member' &&
          g.starting_handicap != null &&
          Number.isFinite(Number(g.starting_handicap))
        );

      const qualified = [];

      for (const golfer of members) {
        const history = (rounds || [])
          .filter(r => r.golfer_id === golfer.id)
          .sort((a, b) =>
            weekOrder.get(a.week_id) -
            weekOrder.get(b.week_id)
          )
          .map(r => ({
            score: r.gross_score,
            rating: r.course_rating,
            slope: r.slope_rating
          }))
          .filter(window.BBHandicap2027.eligibleRound);

        if (history.length < 8) continue;

        const result =
          window.BBHandicap2027.calculateLeagueHandicap(
            history,
            golfer.starting_handicap
          );

        if (result.handicap == null) continue;

        qualified.push({
          name: golfer.display_name,
          improvement:
            Number(golfer.starting_handicap) -
            Number(result.handicap)
        });
      }

      if (!qualified.length) {
        element.textContent = 'To Be Determined';
        return;
      }

      const best = Math.max(
        ...qualified.map(g => g.improvement)
      );

      const leaders = qualified
        .filter(g =>
          Math.abs(g.improvement - best) < 0.005
        )
        .map(g => g.name)
        .sort((a, b) => a.localeCompare(b));

      element.textContent =
        leaders.join(' / ') +
        ' — ' + best.toFixed(2) +
        ' strokes improved';

    } catch (error) {
      console.error('Most Improved Golfer error:', error);
      element.textContent = 'Results unavailable';
    }
  }

  await loadMostImprovedGolfer();

  // Perfect Attendance and Bogus Boys Ironman.
  // Only finalized regular-season rounds count.

  async function loadAttendanceAwards() {
    const perfectElement =
      document.getElementById('perfect-attendance-award');
    const ironmanElement =
      document.getElementById('ironman-award');

    if (!perfectElement || !ironmanElement) return;

    const setStatus = message => {
      perfectElement.textContent = message;
      ironmanElement.textContent = message;
    };

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey) {
      setStatus('Results unavailable');
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url, cfg.publishableKey
      );

      const [weeksResult, golfersResult] = await Promise.all([
        client.from('weeks')
          .select('id,week_number,status')
          .eq('league_id', LEAGUE)
          .eq('week_type', 'regular'),

        client.from('golfers')
          .select('id,display_name,kind')
          .eq('league_id', LEAGUE)
      ]);

      if (weeksResult.error) throw weeksResult.error;
      if (golfersResult.error) throw golfersResult.error;

      const finalizedWeeks = (weeksResult.data || [])
        .filter(w => w.status === 'finalized');

      if (!finalizedWeeks.length) {
        setStatus('To Be Determined');
        return;
      }

      const weekNumbers = new Map(
        finalizedWeeks.map(w => [
          w.id, Number(w.week_number)
        ])
      );

      const { data: rounds, error } = await client
        .from('rounds')
        .select('week_id,golfer_id,gross_score,finalized')
        .in('week_id', finalizedWeeks.map(w => w.id))
        .eq('finalized', true);

      if (error) throw error;

      const members = (golfersResult.data || [])
        .filter(g => g.kind === 'member');

      const played = new Map();

      for (const round of rounds || []) {
        if (round.gross_score == null) continue;

        const weekNumber = weekNumbers.get(round.week_id);
        if (!Number.isInteger(weekNumber) ||
            weekNumber < 1 || weekNumber > 16) continue;

        if (!played.has(round.golfer_id)) {
          played.set(round.golfer_id, new Set());
        }

        played.get(round.golfer_id).add(weekNumber);
      }

      // Perfect Attendance requires all 16 completed weeks.
      const perfect = members.filter(g => {
        const weeks = played.get(g.id) || new Set();

        return Array.from(
          { length: 16 }, (_, i) => i + 1
        ).every(number => weeks.has(number));
      });

      perfectElement.textContent = perfect.length
        ? perfect
            .map(g => g.display_name)
            .sort((a, b) => a.localeCompare(b))
            .join(' / ') + ' — 16 weeks'
        : 'To Be Determined';

      // Ironman: longest uninterrupted weekly playing streak.
      function longestStreak(weekSet) {
        let longest = 0;
        let current = 0;

        for (let week = 1; week <= 16; week++) {
          if (weekSet.has(week)) {
            current++;
            longest = Math.max(longest, current);
          } else {
            current = 0;
          }
        }

        return longest;
      }

      const streaks = members.map(g => ({
        name: g.display_name,
        streak: longestStreak(
          played.get(g.id) || new Set()
        )
      }));

      const best = Math.max(
        0, ...streaks.map(g => g.streak)
      );

      if (best === 0) {
        ironmanElement.textContent = 'To Be Determined';
        return;
      }

      const leaders = streaks
        .filter(g => g.streak === best)
        .map(g => g.name)
        .sort((a, b) => a.localeCompare(b));

      ironmanElement.textContent =
        leaders.join(' / ') +
        ' — ' + best +
        (best === 1 ? ' consecutive week' :
          ' consecutive weeks');

    } catch (error) {
      console.error('Attendance Awards error:', error);
      setStatus('Results unavailable');
    }
  }

  await loadAttendanceAwards();

  // Money Kings — Top 3 league members by awarded winnings.
  // Includes flight payouts and funded money-hole prizes.
  // Championship prizes will be added when recipients are recorded.

  async function loadMoneyKings() {
    const places = [
      document.getElementById('money-first'),
      document.getElementById('money-second'),
      document.getElementById('money-third')
    ];

    if (places.some(el => !el)) return;

    const setAll = message => {
      places.forEach(el => { el.textContent = message; });
    };

    if (!window.supabase?.createClient ||
        !cfg?.url || !cfg?.publishableKey) {
      setAll('Results unavailable');
      return;
    }

    try {
      const client = window.supabase.createClient(
        cfg.url, cfg.publishableKey
      );

      const results = await Promise.all([
        client.from('golfers')
          .select('id,display_name,kind')
          .eq('league_id', LEAGUE),

        client.from('weeks')
          .select('id,status')
          .eq('league_id', LEAGUE),

        client.from('money_flight_payouts')
          .select('week_id,first_golfer_id,second_golfer_id,first_dollars,second_dollars')
          .eq('league_id', LEAGUE),

        client.from('money_contests')
          .select('week_id,flight,funded_slot,winner_golfer_id,no_winner')
          .eq('league_id', LEAGUE),

        client.from('money_contributions')
          .select('week_id,golfer_id,paid')
          .eq('league_id', LEAGUE),

        client.from('money_guest_flights')
          .select('week_id,golfer_id,flight')
          .eq('league_id', LEAGUE)
      ]);

      for (const result of results) {
        if (result.error) throw result.error;
      }

      const [
        golfers, weeks, flightPayouts,
        contests, contributions, guestFlights
      ] = results.map(r => r.data || []);

      const golferMap = new Map(
        golfers.map(g => [g.id, g])
      );

      const members = golfers.filter(
        g => g.kind === 'member'
      );

      const finalizedWeeks = new Set(
        weeks.filter(w => w.status === 'finalized')
          .map(w => w.id)
      );

      const totals = new Map(
        members.map(g => [g.id, 0])
      );

      function award(golferId, amount) {
        if (!totals.has(golferId)) return;

        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return;

        totals.set(
          golferId,
          totals.get(golferId) + value
        );
      }

      // Official first- and second-place flight payouts.
      for (const payout of flightPayouts) {
        if (!finalizedWeeks.has(payout.week_id)) continue;

        award(payout.first_golfer_id, payout.first_dollars);
        award(payout.second_golfer_id, payout.second_dollars);
      }

      // Funded money-hole pots are $1 per paid participant
      // in the assigned flight, including guest contributions.
      const guestFlightMap = new Map(
        guestFlights.map(g => [
          g.week_id + ':' + g.golfer_id, g.flight
        ])
      );

      const contributionCounts = new Map();

      for (const contribution of contributions) {
        if (!contribution.paid) continue;

        const golfer = golferMap.get(contribution.golfer_id);
        if (!golfer) continue;

        const flight = golfer.kind === 'guest'
          ? guestFlightMap.get(
              contribution.week_id + ':' + golfer.id
            )
          : golfer.flight;

        if (!flight) continue;

        const key = contribution.week_id + ':' + flight;

        contributionCounts.set(
          key, (contributionCounts.get(key) || 0) + 1
        );
      }

      for (const contest of contests) {
        if (!finalizedWeeks.has(contest.week_id)) continue;
        if (contest.no_winner || !contest.winner_golfer_id) {
          continue;
        }

        const slot = Number(contest.funded_slot);
        if (slot !== 1 && slot !== 2) continue;

        const pot = contributionCounts.get(
          contest.week_id + ':' + contest.flight
        ) || 0;

        award(contest.winner_golfer_id, pot);
      }

      const ranked = members
        .map(g => ({
          name: g.display_name,
          winnings: totals.get(g.id) || 0
        }))
        .filter(g => g.winnings > 0)
        .sort((a, b) =>
          b.winnings - a.winnings ||
          a.name.localeCompare(b.name)
        );

      places.forEach((element, index) => {
        const golfer = ranked[index];

        element.textContent = golfer
          ? golfer.name + ' — $' +
            golfer.winnings.toFixed(2)
          : 'To Be Determined';
      });

    } catch (error) {
      console.error('Money Kings error:', error);
      setAll('Results unavailable');
    }
  }

  await loadMoneyKings();

})();
