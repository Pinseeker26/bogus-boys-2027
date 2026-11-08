
/* Bogus Boys 2027 — Live Weekly Results */
(async () => {
  'use strict';

  const $ = id => document.getElementById(id);
  const cfg = window.BB_SUPABASE_CONFIG || {};
  const engine = window.BBHandicap2027;
  const leagueId = '5c6fde06-0205-4f47-b333-eedcd0b47c12';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const display = value => value == null ? '—' : String(value);
  const message = text => { $('save-message').textContent = text; };

  if (!window.supabase?.createClient || !cfg.url ||
      !cfg.publishableKey || !engine?.calculateLeagueHandicap) {
    message('Unable to load Supabase or the league handicap engine.');
    return;
  }

  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);
  let weeks = [];
  let golfers = [];
  let attendance = [];
  let rounds = [];
  let tees = new Map();
  let commissioner = false;
  let busy = false;

  // Existing money-hole management stays in Commissioner HQ.
  document.querySelector('.money-panel')?.remove();

  // Formats are controlled by the official Supabase schedule.
  $('format-override').closest('div').hidden = true;

  // Saving happens immediately when a score changes.
  $('save-results').textContent = 'Refresh Results';

  function currentWeek() {
    return weeks.find(w => w.id === $('week-select').value);
  }

  function checkedIn(week) {
    const ids = new Set(attendance.filter(a =>
      a.week_id === week.id && a.response === 'playing'
    ).map(a => a.golfer_id));

    return golfers.filter(g =>
      g.active && g.kind === 'member' &&
      ['A','B'].includes(g.flight) && ids.has(g.id)
    );
  }

  function roundFor(weekId, golferId) {
    return rounds.find(r =>
      r.week_id === weekId && r.golfer_id === golferId
    );
  }

  function handicapFor(golfer, week) {
    const earlier = weeks.filter(w =>
      w.week_number < week.week_number &&
      w.status === 'finalized'
    );

    const order = new Map(earlier.map((w, i) => [w.id, i]));
    const ids = new Set(earlier.map(w => w.id));

    const history = rounds.filter(r =>
      r.golfer_id === golfer.id &&
      r.finalized && ids.has(r.week_id)
    ).sort((a,b) =>
      order.get(a.week_id) - order.get(b.week_id)
    ).map(r => ({
      score: r.gross_score,
      rating: r.course_rating,
      slope: r.slope_rating
    }));

    return engine.calculateLeagueHandicap(
      history, golfer.starting_handicap
    );
  }

  function resultValue(round, format) {
    if (!round || round.gross_score == null ||
        round.handicap_used == null) return null;

    if (format === 'quota') {
      if (round.quota_points == null ||
          round.quota_used == null) return null;
      return Number(round.quota_points) - Number(round.quota_used);
    }

    return Number(round.gross_score) -
           Number(round.handicap_used);
  }

  function render() {
    const week = currentWeek();
    if (!week) return;

    const locked = week.status === 'finalized';
    const format = week.format;
    const playing = checkedIn(week);

    $('format-label').textContent =
      format === 'quota' ? 'QUOTA' : 'NET SCORE';
    $('format-note').textContent =
      format === 'quota'
        ? 'Highest points over quota leads'
        : 'Lowest net score leads';

    $('total-count').textContent = playing.length;
    $('a-count').textContent =
      playing.filter(g => g.flight === 'A').length;
    $('b-count').textContent =
      playing.filter(g => g.flight === 'B').length;

    $('status-label').textContent =
      locked ? 'FINALIZED' : 'OPEN';
    $('status-sub').textContent =
      locked ? 'Official results locked' : 'Scores editable';

    $('lock-week').textContent =
      locked ? 'Week Finalized' : 'Finalize & Lock Week';
    $('lock-week').disabled = locked || !commissioner;

    for (const flight of ['A','B']) {
      const key = flight.toLowerCase();
      const members = playing.filter(g => g.flight === flight);

      $('flight-' + key + '-count').textContent =
        members.length + ' golfers';

      $(key + '-head').innerHTML =
        '<tr><th>PLAYER / TEE</th><th>GROSS</th>' +
        '<th>HCP</th><th>' +
        (format === 'quota' ? 'QUOTA PTS' : 'NET') +
        '</th><th>BBPts</th></tr>';

      const entries = members.map(g => {
        const round = roundFor(week.id, g.id);
        return {
          golfer: g,
          round,
          handicap: handicapFor(g, week),
          value: resultValue(round, format)
        };
      });

      entries.sort((a,b) => {
        if (a.value == null && b.value == null)
          return a.golfer.display_name.localeCompare(b.golfer.display_name);
        if (a.value == null) return 1;
        if (b.value == null) return -1;
        return (format === 'quota'
          ? b.value - a.value
          : a.value - b.value) ||
          a.golfer.display_name.localeCompare(b.golfer.display_name);
      });

      $(key + '-body').innerHTML = entries.map(e => {
        const g = e.golfer;
        const r = e.round;
        const hcp = r?.handicap_used ?? e.handicap.playingHandicap;
        const quota = r?.quota_used ?? e.handicap.quota;
        const editable = commissioner && !locked;
        const disabled = editable ? '' : 'disabled';

        const tee = r?.tee_box || '';

        const teeControl = editable
          ? `<select data-tee="${esc(g.id)}">
               <option value="">Select tee</option>
               <option value="white" ${tee==='white'?'selected':''}>White</option>
               <option value="gold" ${tee==='gold'?'selected':''}>Gold</option>
             </select>`
          : esc(tee ? tee.toUpperCase() : 'No tee');

        const grossControl = editable
          ? `<input type="number" min="9" max="100" step="1"
               data-gross="${esc(g.id)}"
               value="${esc(r?.gross_score ?? '')}"
               style="width:75px" ${disabled}>`
          : display(r?.gross_score);

        const pointsControl = format === 'quota'
          ? (editable
            ? `<input type="number" min="0" max="36" step="1"
                 data-quota-points="${esc(g.id)}"
                 value="${esc(r?.quota_points ?? '')}"
                 style="width:75px">`
            : display(r?.quota_points))
          : display(e.value);

        const result = format === 'quota'
          ? `${pointsControl}<small> Target: ${display(quota)}</small>`
          : pointsControl;

        return `<tr>
          <td class="player-cell">
            <strong>${esc(g.display_name)}</strong>
            <div>${teeControl}</div>
          </td>
          <td>${grossControl}</td>
          <td>${display(hcp)}</td>
          <td>${result}</td>
          <td>${locked ? display(r?.bb_points) : 'Pending'}</td>
        </tr>`;
      }).join('') ||
        '<tr><td colspan="5" class="empty-row">' +
        'No checked-in golfers in this flight yet.</td></tr>';
    }
  }

  async function load() {
    message('Loading live weekly results…');

    const {data: auth} = await db.auth.getUser();

    commissioner = false;

    if (auth?.user) {
      const {data, error} = await db.from('memberships')
        .select('role')
        .eq('league_id', leagueId)
        .eq('user_id', auth.user.id);

      if (error) throw error;
      commissioner = (data || []).some(m =>
        m.role === 'commissioner'
      );
    }

    const queries = await Promise.all([
      db.from('weeks')
        .select('id,week_number,week_type,format,status,scheduled_date')
        .eq('league_id',leagueId)
        .eq('week_type','regular')
        .order('week_number'),
      db.from('golfers')
        .select('id,display_name,flight,kind,active,starting_handicap')
        .eq('league_id',leagueId),
      db.from('attendance_signups')
        .select('week_id,golfer_id,response')
        .eq('league_id',leagueId),
      db.from('tee_ratings')
        .select('tee_box,course_rating,slope_rating')
        .eq('league_id',leagueId)
    ]);

    for (const q of queries) if (q.error) throw q.error;

    weeks = queries[0].data || [];
    golfers = queries[1].data || [];
    attendance = queries[2].data || [];

    tees = new Map((queries[3].data || []).map(t =>
      [t.tee_box.toLowerCase(),t]
    ));

    rounds = [];

    const ids = weeks.map(w => w.id);
    for (let i = 0; i < ids.length; i += 40) {
      const {data,error} = await db.from('rounds')
        .select('id,week_id,golfer_id,gross_score,handicap_used,quota_used,quota_points,bb_points,finalized,tee_box,course_rating,slope_rating')
        .in('week_id',ids.slice(i,i+40));

      if (error) throw error;
      rounds.push(...(data || []));
    }

    const select = $('week-select');
    const previous = select.value;
    select.replaceChildren();

    for (const week of weeks) {
      const option = document.createElement('option');
      option.value = week.id;
      option.textContent =
        'Week ' + week.week_number +
        (week.scheduled_date ? ' · ' + week.scheduled_date : '');
      select.append(option);
    }

    if (weeks.some(w => w.id === previous))
      select.value = previous;

    render();
    message(commissioner
      ? 'Connected to Supabase. Commissioner scoring enabled.'
      : 'Live results. Commissioner sign-in required to enter scores.');
  }

  async function saveScore(golferId, field, raw) {
    const week = currentWeek();
    if (!commissioner || !week || week.status !== 'open') return;

    const golfer = golfers.find(g => g.id === golferId);
    if (!golfer || !checkedIn(week).some(g => g.id === golferId))
      throw Error('Golfer must be marked Playing.');

    const existing = roundFor(week.id,golferId);
    const tee = field === 'tee_box'
      ? raw
      : existing?.tee_box;

    if (!tee || !tees.has(tee))
      throw Error('Select White or Gold tees first.');

    const rating = tees.get(tee);
    const hcp = handicapFor(golfer,week);

    if (hcp.playingHandicap == null)
      throw Error('Golfer needs a starting or calculated handicap.');

    const gross = field === 'gross_score'
      ? (raw === '' ? null : Number(raw))
      : existing?.gross_score ?? null;

    const points = field === 'quota_points'
      ? (raw === '' ? null : Number(raw))
      : existing?.quota_points ?? null;

    if (gross !== null &&
        (!Number.isInteger(gross) || gross < 9 || gross > 100))
      throw Error('Gross score must be a whole number from 9 to 100.');

    if (points !== null &&
        (!Number.isInteger(points) || points < 0 || points > 36))
      throw Error('Quota points must be a whole number from 0 to 36.');

    const snapshot = {
      gross_score: gross,
      quota_points: points,
      handicap_used: hcp.playingHandicap,
      quota_used: hcp.quota,
      tee_box: tee,
      course_rating: rating.course_rating,
      slope_rating: rating.slope_rating
    };

    const query = existing
      ? db.from('rounds')
          .update(snapshot)
          .eq('id',existing.id)
          .eq('finalized',false)
      : db.from('rounds')
          .insert({
            week_id:week.id,
            golfer_id:golferId,
            finalized:false,
            ...snapshot
          });

    const {data,error} = await query.select(
      'id,week_id,golfer_id,gross_score,handicap_used,quota_used,quota_points,bb_points,finalized,tee_box,course_rating,slope_rating'
    );

    if (error) throw error;
    if (!data?.length) throw Error('No round was saved.');

    const saved = data[0];
    const index = rounds.findIndex(r =>
      r.week_id === week.id && r.golfer_id === golferId
    );

    if (index >= 0) rounds[index] = saved;
    else rounds.push(saved);

    render();
    message('Score saved to Supabase.');
  }

  $('week-select').addEventListener('change', () => {
    render();
    message('');
  });

  document.querySelector('.results-page').addEventListener('change',
    async event => {
      const input = event.target;
      const field = input.dataset.tee !== undefined
        ? 'tee_box'
        : input.dataset.gross !== undefined
          ? 'gross_score'
          : input.dataset.quotaPoints !== undefined
            ? 'quota_points'
            : null;

      if (!field || busy) return;

      const golferId =
        input.dataset.tee ??
        input.dataset.gross ??
        input.dataset.quotaPoints;

      busy = true;
      input.disabled = true;
      message('Saving to Supabase…');

      try {
        await saveScore(golferId,field,input.value);
      } catch (error) {
        message('NOT SAVED: ' + error.message);
        render();
      } finally {
        busy = false;
        input.disabled = false;
      }
    }
  );

  $('save-results').addEventListener('click',async () => {
    try { await load(); }
    catch (error) { message('Refresh failed: ' + error.message); }
  });

  $('lock-week').addEventListener('click',async () => {
    const week = currentWeek();
    if (!commissioner || !week ||
        week.status !== 'open' || busy) return;

    if (!confirm(
      'Finalize Week ' + week.week_number +
      '? All checked-in golfers must have complete scores. ' +
      'Finalized results cannot be edited.'
    )) return;

    busy = true;
    $('lock-week').disabled = true;
    message('Finalizing official results…');

    try {
      const {data,error} = await db.rpc('bb_finalize_week',{
        p_week_id:week.id
      });

      if (error) throw error;

      message('Week finalized: ' + data + ' golfers.');
      await load();
    } catch (error) {
      message('NOT FINALIZED: ' + error.message);
      $('lock-week').disabled = false;
    } finally {
      busy = false;
    }
  });

  try {
    await load();
  } catch (error) {
    message('Unable to load live results: ' + error.message);
  }
})();
