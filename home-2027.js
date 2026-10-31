
(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const cfg = window.BB_SUPABASE_CONFIG || {};
  const feedback = $('roster-feedback');
  const controls = $('roster-controls');
  const flights = $('roster-flights');
  const weekSelect = $('home-week');

  const say = message => {
    feedback.textContent = message;
  };

  const clearRoster = () => {
    for (const flight of ['a', 'b']) {
      $(flight + '-count').textContent = '0';
      $('flight-' + flight + '-list').replaceChildren();
    }
  };

  // Keep the roster private until membership is verified.
  controls.hidden = true;
  flights.hidden = true;
  clearRoster();

  if (!window.supabase?.createClient ||
      !cfg.url || !cfg.publishableKey) {
    say('Attendance is temporarily unavailable.');
    return;
  }

  const db = window.supabase.createClient(
    cfg.url,
    cfg.publishableKey
  );

  let leagueId = null;

  async function showRoster() {
    const weekId = weekSelect.value;
    clearRoster();

    if (!weekId || !leagueId) {
      say('No week selected.');
      return;
    }

    say('Loading attendance...');

    try {
      const { data: attendance, error: ae } = await db
        .from('attendance_signups')
        .select('golfer_id')
        .eq('league_id', leagueId)
        .eq('week_id', weekId)
        .eq('response', 'playing');

      if (ae) throw ae;

      const { data: golfers, error: ge } = await db
        .from('golfers')
        .select('id,display_name,flight,active')
        .eq('league_id', leagueId)
        .eq('active', true);

      if (ge) throw ge;

      const playingIds = new Set(
        (attendance || []).map(a => a.golfer_id)
      );

      for (const flight of ['A', 'B']) {
        const players = (golfers || [])
          .filter(g =>
            g.flight === flight &&
            playingIds.has(g.id)
          )
          .sort((a, b) =>
            a.display_name.localeCompare(b.display_name)
          );

        const list = $('flight-' + flight.toLowerCase() + '-list');

        for (const player of players) {
          const item = document.createElement('li');
          item.textContent = player.display_name;
          list.appendChild(item);
        }

        if (!players.length) {
          const item = document.createElement('li');
          item.textContent = 'No players checked in yet';
          item.className = 'muted';
          list.appendChild(item);
        }

        $(flight.toLowerCase() + '-count').textContent =
          String(players.length);
      }

      say('Showing confirmed players for the selected week.');
    } catch (error) {
      clearRoster();
      flights.hidden = true;
      say('Unable to load attendance: ' + error.message);
    }
  }

  async function start() {
    try {
      const { data: { user }, error: ue } =
        await db.auth.getUser();

      if (ue) throw ue;

      if (!user) {
        say('Sign in to see weekly attendance. ');
        const link = document.createElement('a');
        link.href = 'login.html';
        link.textContent = 'Clubhouse Sign In';
        feedback.appendChild(link);
        return;
      }

      const { data: memberships, error: me } = await db
        .from('memberships')
        .select('league_id')
        .eq('user_id', user.id)
        .limit(1);

      if (me) throw me;

      if (!memberships?.length) {
        say('Weekly attendance is available to approved league members.');
        return;
      }

      leagueId = memberships[0].league_id;

      const { data: weeks, error: we } = await db
        .from('weeks')
        .select('id,week_number,week_type,scheduled_date,status')
        .eq('league_id', leagueId);

      if (we) throw we;

      weekSelect.replaceChildren();

      const sortedWeeks = (weeks || []).sort((a, b) =>
        (a.week_type === 'playoff') -
        (b.week_type === 'playoff') ||
        a.week_number - b.week_number
      );

      for (const week of sortedWeeks) {
        const option = document.createElement('option');
        option.value = week.id;
        option.textContent =
          (week.week_type === 'playoff' ? 'Playoff' : 'Regular') +
          ' Week ' + week.week_number +
          (week.scheduled_date ? ' · ' + week.scheduled_date : '');
        weekSelect.appendChild(option);
      }

      if (!sortedWeeks.length) {
        say('No league weeks have been scheduled yet.');
        return;
      }

      controls.hidden = false;
      flights.hidden = false;
      weekSelect.addEventListener('change', showRoster);

      await showRoster();
    } catch (error) {
      controls.hidden = true;
      flights.hidden = true;
      say('Please sign in through the Clubhouse to view weekly attendance.');
    }
  }

  await start();
})();
