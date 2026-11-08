
/* Bogus Boys 2027 — Live Season BBPts Standings */
(async function () {
  'use strict';

  const LEAGUE = '5c6fde06-0205-4f47-b333-eedcd0b47c12';
  const cfg = window.BB_SUPABASE_CONFIG;

  const esc = value => String(value ?? '').replace(
    /[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;',
      '"':'&quot;', "'":'&#39;'
    })[c]
  );

  const main = document.querySelector('main');
  if (!main) return;

  // Replace the old demo interface, including its sample players.
  main.innerHTML = `
    <section class="bb-live-standings">
      <p class="bb-eyebrow">THE RACE TO THE PLAYOFFS</p>
      <h1>SEASON <span>BBPts</span></h1>
      <p>All 16 regular-season weeks count.
         Official points are recorded when each week is finalized.</p>

      <div class="bb-stats">
        <div><small>OVERALL LEADER</small>
          <strong id="bb-leader">—</strong></div>
        <div><small>FINALIZED WEEKS</small>
          <strong id="bb-weeks">0 / 16</strong></div>
        <div><small>CHAMPIONSHIP FORMAT</small>
          <strong>ALL 16 WEEKS</strong></div>
      </div>

      <h2>Season Standings</h2>
      <p>Regular-season BBPts earned within each player's flight.</p>

      <div class="bb-filters">
        <button data-flight="all" class="selected">Overall</button>
        <button data-flight="A">Flight A</button>
        <button data-flight="B">Flight B</button>
      </div>

      <div class="bb-table-wrap">
        <table>
          <thead><tr>
            <th>POS</th>
            <th>PLAYER</th>
            <th>FLIGHT</th>
            <th>TOTAL BBPts</th>
            <th>WEEKS SCORED</th>
          </tr></thead>
          <tbody id="bb-rows">
            <tr><td colspan="5">Loading live standings…</td></tr>
          </tbody>
        </table>
      </div>

      <p id="bb-status" role="status"></p>
      <p class="bb-rules">
        <strong>Points:</strong> 1st = 110, 2nd = 100,
        3rd = 90, decreasing by 10 per position.
        Tied players split the combined points for
        their tied positions. Only finalized regular-season
        rounds count. Playoff points are handled separately.
      </p>
    </section>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .bb-live-standings{
      max-width:1100px;margin:35px auto 70px;padding:0 20px;
      color:#151515;font-family:inherit
    }
    .bb-live-standings .bb-eyebrow{
      color:#b87b00;font-size:12px;font-weight:800;
      letter-spacing:2px
    }
    .bb-live-standings h1{
      font-size:clamp(38px,6vw,70px);
      margin:10px 0;font-weight:900
    }
    .bb-live-standings h1 span{color:#e6a000}
    .bb-live-standings h2{margin-top:35px}
    .bb-stats{
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;margin:30px 0
    }
    .bb-stats>div{
      background:#111;color:white;border-top:4px solid #ffb612;
      border-radius:9px;padding:18px
    }
    .bb-stats small{
      display:block;font-size:11px;letter-spacing:1px
    }
    .bb-stats strong{
      display:block;color:#ffb612;font-size:23px;
      margin-top:10px
    }
    .bb-filters{display:flex;gap:8px;margin:20px 0}
    .bb-filters button{
      background:white;color:#111;border:1px solid #bbb;
      border-radius:7px;padding:11px 17px;cursor:pointer;
      font-weight:bold
    }
    .bb-filters button.selected{
      background:#ffb612;border-color:#ffb612
    }
    .bb-table-wrap{
      overflow-x:auto;border:1px solid #ddd;border-radius:10px
    }
    .bb-table-wrap table{
      width:100%;border-collapse:collapse;background:white
    }
    .bb-table-wrap th{
      background:#111;color:#ffb612;text-align:left;
      padding:15px 12px;font-size:12px
    }
    .bb-table-wrap td{
      border-bottom:1px solid #ddd;padding:14px 12px
    }
    .bb-table-wrap td:nth-child(4){font-weight:bold}
    .bb-rules{
      background:white;border:1px solid #ddd;
      border-radius:9px;padding:18px;margin-top:25px
    }
    #bb-status{margin-top:15px}
    @media(max-width:650px){
      .bb-stats{grid-template-columns:1fr}
      .bb-live-standings{padding:0 12px}
    }
  `;
  document.head.append(style);

  const $ = id => document.getElementById(id);
  const status = text => { $('bb-status').textContent = text; };

  if (!window.supabase?.createClient ||
      !cfg?.url || !cfg?.publishableKey) {
    status('Unable to connect to Supabase.');
    return;
  }

  const db = window.supabase.createClient(
    cfg.url, cfg.publishableKey
  );

  try {
    const results = await Promise.all([
      db.from('golfers')
        .select('id,display_name,flight,kind,active')
        .eq('league_id', LEAGUE),
      db.from('weeks')
        .select('id,week_number,status')
        .eq('league_id', LEAGUE)
        .eq('week_type', 'regular')
        .order('week_number')
    ]);

    for (const result of results) {
      if (result.error) throw result.error;
    }

    const golfers = (results[0].data || []).filter(g =>
      g.active && g.kind === 'member' &&
      ['A','B'].includes(g.flight)
    );

    const weeks = results[1].data || [];
    const finalized = weeks.filter(w =>
      w.status === 'finalized'
    );

    $('bb-weeks').textContent = finalized.length + ' / 16';

    let rounds = [];
    if (finalized.length) {
      const {data,error} = await db.from('rounds')
        .select('week_id,golfer_id,bb_points,finalized')
        .in('week_id',finalized.map(w => w.id))
        .eq('finalized',true);

      if (error) throw error;
      rounds = data || [];
    }

    const standings = golfers.map(g => {
      const playerRounds = rounds.filter(r =>
        r.golfer_id === g.id && r.bb_points != null
      );

      return {
        id:g.id,
        name:g.display_name,
        flight:g.flight,
        points:playerRounds.reduce(
          (sum,r) => sum + Number(r.bb_points),0
        ),
        played:playerRounds.length
      };
    });

    standings.sort((a,b) =>
      b.points-a.points ||
      b.played-a.played ||
      a.name.localeCompare(b.name)
    );

    const leader = standings.find(p => p.points > 0);
    $('bb-leader').textContent =
      leader ? leader.name : 'No finalized results yet';

    let selectedFlight = 'all';

    function render() {
      const visible = standings.filter(p =>
        selectedFlight === 'all' ||
        p.flight === selectedFlight
      );

      $('bb-rows').innerHTML = visible.length
        ? visible.map((p,i) => `
          <tr>
            <td>${i+1}</td>
            <td>${esc(p.name)}</td>
            <td>Flight ${esc(p.flight)}</td>
            <td>${p.points.toLocaleString('en-US')}</td>
            <td>${p.played}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="5">No league members in this flight.</td></tr>';
    }

    document.querySelectorAll('[data-flight]').forEach(button => {
      button.addEventListener('click', () => {
        selectedFlight = button.dataset.flight;
        document.querySelectorAll('[data-flight]').forEach(b =>
          b.classList.toggle('selected',b===button)
        );
        render();
      });
    });

    render();
    status('Live standings connected to Supabase.');

  } catch (error) {
    $('bb-rows').innerHTML =
      '<tr><td colspan="5">Standings unavailable.</td></tr>';
    status('Unable to load standings: ' + error.message);
  }
})();
