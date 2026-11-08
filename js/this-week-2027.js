
(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const select = $('tw-week');
  const cfg = window.BB_SUPABASE_CONFIG || {};

  function showError(message) {
    $('tw-description').textContent = message;
  }

  if (!window.supabase?.createClient ||
      !cfg.url || !cfg.publishableKey) {
    showError('Unable to connect to the league database.');
    return;
  }

  const db = window.supabase.createClient(
    cfg.url,
    cfg.publishableKey
  );

  const { data, error } = await db.rpc(
    'bogus_boys_public_roster'
  );

  if (error) {
    showError('Unable to load the live roster: ' + error.message);
    return;
  }

  const rows = data || [];
  const weeks = [...new Set(
    rows.map(r => Number(r.week_number))
  )].sort((a, b) => a - b);

  select.replaceChildren();

  for (const week of weeks) {
    const row = rows.find(
      r => Number(r.week_number) === week
    );
    const option = document.createElement('option');
    option.value = String(week);
    option.textContent =
      'Week ' + week +
      (row?.scheduled_date
        ? ' · ' + row.scheduled_date
        : '');
    select.append(option);
  }

  function render() {
    const week = Number(select.value);
    const weekRows = rows.filter(
      r => Number(r.week_number) === week
    );
    const info = weekRows[0];
    if (!info) return;

    const format = info.format === 'quota'
      ? 'quota'
      : 'net';

    $('tw-format').textContent =
      format === 'net' ? 'NET SCORE' : 'QUOTA';

    $('tw-rule').textContent =
      format === 'net'
        ? 'Lowest net wins'
        : 'Highest quota differential wins';

    $('tw-description').textContent =
      format === 'net'
        ? 'This week is a Net Score competition. Players compete within their fixed flights. The lowest net score ranks first, and BBPts are awarded automatically.'
        : 'This week is a Quota competition. Players compete within their fixed flights. The highest points-over-quota result ranks first, and BBPts are awarded automatically.';

    let total = 0;

    for (const flight of ['A', 'B']) {
      const players = weekRows
        .filter(r =>
          r.flight === flight &&
          r.golfer_name
        )
        .sort((a, b) =>
          a.golfer_name.localeCompare(b.golfer_name)
        );

      total += players.length;

      $('tw-' + flight.toLowerCase()).textContent =
        String(players.length);

      const list = $('tw-roster-' + flight.toLowerCase());
      list.replaceChildren();

      if (!players.length) {
        const li = document.createElement('li');
        li.className = 'tw-empty';
        li.textContent = 'No golfers checked in yet';
        list.append(li);
      } else {
        for (const player of players) {
          const li = document.createElement('li');
          li.textContent = player.golfer_name;
          list.append(li);
        }
      }
    }

    $('tw-total').textContent = String(total);
  }

  select.addEventListener('change', render);
  render();
})();
