
/* Bogus Boys 2027 — Live Player Profile Statistics */
(async function () {
  'use strict';

  const root = document.getElementById('player-profile');
  if (!root) return;

  const cfg = window.BB_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;

  const db = window.supabase.createClient(
    cfg.url,
    cfg.publishableKey
  );

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

  const fmt = value =>
    value == null || !Number.isFinite(Number(value))
      ? '—'
      : Number(value).toLocaleString('en-US', {
          maximumFractionDigits: 2
        });

  const round1 = n => Math.round(n * 10) / 10;
  const status = document.getElementById('profile-status');

  try {
    const { data: auth, error: authError } =
      await db.auth.getUser();

    if (authError) throw authError;
    if (!auth?.user) return;

    const { data: member, error: memberError } = await db
      .from('memberships')
      .select('league_id')
      .eq('user_id', auth.user.id)
      .limit(1)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) return;

    const leagueId = member.league_id;

    const results = await Promise.all([
      db.from('golfers')
        .select('id,display_name,flight,starting_handicap')
        .eq('league_id', leagueId)
        .eq('id', id)
        .maybeSingle(),

      db.from('weeks')
        .select('id,week_number,week_type,status,scheduled_date,format')
        .eq('league_id', leagueId),

      db.from('rounds')
        .select('week_id,golfer_id,gross_score,handicap_used,quota_used,quota_points,bb_points,tee_box,course_rating,slope_rating,finalized')
        .eq('golfer_id', id)
        .eq('finalized', true)
    ]);

    for (const result of results) {
      if (result.error) throw result.error;
    }

    const golfer = results[0].data;
    if (!golfer) return;

    const weeks = new Map(
      (results[1].data || []).map(w => [w.id, w])
    );

    const records = (results[2].data || [])
      .filter(r =>
        weeks.has(r.week_id) &&
        weeks.get(r.week_id).status === 'finalized'
      )
      .sort((a, b) => {
        const wa = weeks.get(a.week_id);
        const wb = weeks.get(b.week_id);

        const na =
          (wa.week_type === 'playoff' ? 16 : 0) +
          wa.week_number;

        const nb =
          (wb.week_type === 'playoff' ? 16 : 0) +
          wb.week_number;

        return na - nb;
      });

    const regular = records.filter(r =>
      weeks.get(r.week_id).week_type === 'regular'
    );

    const grossRounds = records.filter(r =>
      r.gross_score != null &&
      Number.isFinite(Number(r.gross_score))
    );

    const netRounds = records.filter(r =>
      r.gross_score != null &&
      r.handicap_used != null
    );

    const avg = values =>
      values.length
        ? round1(
            values.reduce((sum, n) => sum + n, 0) /
            values.length
          )
        : null;

    const grossAverage = avg(
      grossRounds.map(r => Number(r.gross_score))
    );

    const netScores = netRounds.map(r =>
      Number(r.gross_score) - Number(r.handicap_used)
    );

    const netAverage = avg(netScores);

    const bestNet = netScores.length
      ? Math.min(...netScores)
      : null;

    const points = regular.reduce(
      (sum, r) => sum + Number(r.bb_points || 0),
      0
    );

    let handicap = null;
    let quota = null;

    if (window.BBHandicap2027?.calculateLeagueHandicap) {
      const history = records
        .filter(r =>
          r.gross_score != null &&
          r.course_rating != null &&
          r.slope_rating != null
        )
        .map(r => ({
          score: r.gross_score,
          rating: r.course_rating,
          slope: r.slope_rating
        }));

      const result =
        window.BBHandicap2027.calculateLeagueHandicap(
          history,
          golfer.starting_handicap
        );

      handicap = result.playingHandicap;
      quota = result.quota;

    } else if (
      records.length < 3 &&
      golfer.starting_handicap != null
    ) {
      handicap = Math.round(
        Number(golfer.starting_handicap)
      );

      quota = 18 - handicap;
    }

    const style = document.createElement('style');

    style.textContent = `
      .profile-live-stats {
        margin-top: 18px;
      }

      .profile-live-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin: 16px 0 24px;
      }

      .profile-live-stat {
        background: #111;
        color: #fff;
        border-top: 3px solid #ffb612;
        border-radius: 8px;
        padding: 15px;
      }

      .profile-live-stat small {
        display: block;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .5px;
      }

      .profile-live-stat strong {
        display: block;
        color: #ffb612;
        font-size: 24px;
        margin-top: 7px;
      }

      .profile-live-table {
        overflow-x: auto;
      }

      .profile-live-table table {
        border-collapse: collapse;
        width: 100%;
        background: white;
      }

      .profile-live-table th {
        background: #111;
        color: #ffb612;
        text-align: left;
      }

      .profile-live-table th,
      .profile-live-table td {
        padding: 11px;
        border-bottom: 1px solid #ddd;
        white-space: nowrap;
      }

      @media (max-width: 700px) {
        .profile-live-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;

    document.head.appendChild(style);

    const cards = [
      ['Nine-hole handicap', fmt(handicap)],
      ['Current quota', fmt(quota)],
      ['Regular-season BBPts', fmt(points)],
      ['Finalized rounds', fmt(records.length)],
      ['Average gross', fmt(grossAverage)],
      ['Average net', fmt(netAverage)],
      ['Best net', fmt(bestNet)]
    ];

    const section = document.createElement('section');
    section.className = 'profile-section profile-live-stats';

    const rows = records.map(r => {
      const week = weeks.get(r.week_id);

      const label =
        (week.week_type === 'playoff' ? 'Playoff ' : 'Week ') +
        week.week_number;

      const net =
        r.gross_score != null &&
        r.handicap_used != null
          ? Number(r.gross_score) -
            Number(r.handicap_used)
          : null;

      return `
        <tr>
          <td>${esc(label)}</td>
          <td>${esc(week.format || '—')}</td>
          <td>${esc(r.tee_box || '—')}</td>
          <td>${fmt(r.gross_score)}</td>
          <td>${fmt(r.handicap_used)}</td>
          <td>${fmt(net)}</td>
          <td>${fmt(r.quota_points)}</td>
          <td>${fmt(r.bb_points)}</td>
        </tr>
      `;
    }).join('');

    section.innerHTML = `
      <h3>2027 Season Statistics</h3>

      <div class="profile-live-grid">
        ${cards.map(([label, value]) => `
          <div class="profile-live-stat">
            <small>${esc(label)}</small>
            <strong>${esc(value)}</strong>
          </div>
        `).join('')}
      </div>

      <h3>Week-by-Week Results</h3>

      <div class="profile-live-table">
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Format</th>
              <th>Tee</th>
              <th>Gross</th>
              <th>HCP used</th>
              <th>Net</th>
              <th>Quota points</th>
              <th>BBPts</th>
            </tr>
          </thead>

          <tbody>
            ${rows || `
              <tr>
                <td colspan="8">
                  No finalized rounds yet.
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

    // Wait for the existing player profile to finish loading.
    if (!root.querySelector('.profile-heading')) {
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (root.querySelector('.profile-heading')) {
            observer.disconnect();
            resolve();
          }
        });

        observer.observe(root, {
          childList: true,
          subtree: true
        });
      });
    }

    const old = root.querySelector('.profile-section');

    if (old) {
      old.replaceWith(section);
    } else {
      root.appendChild(section);
    }

  } catch (error) {
    console.error('Player statistics error:', error);

    if (status) {
      status.hidden = false;
      status.textContent =
        'Unable to load season statistics: ' +
        error.message;
    }
  }
})();
