
/* Bogus Boys 2027 — Commissioner-selected Hall of Champions awards */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.BB_SUPABASE_CONFIG;

  const admin = $('hall-special-awards-admin');
  const status = $('hall-special-awards-status');
  const save = $('save-hall-special-awards');

  const awards = [
    {
      type: 'commissioners_award',
      select: $('commissioners-award-select'),
      winner: $('commissioners-award-winner')
    },
    {
      type: 'bogus_boys_legend',
      select: $('bogus-boys-legend-select'),
      winner: $('bogus-boys-legend-winner')
    }
  ];

  if (!admin || !status || !save ||
      awards.some(a => !a.select || !a.winner)) return;

  if (!window.supabase?.createClient ||
      !config?.url || !config?.publishableKey) return;

  const db = window.supabase.createClient(
    config.url, config.publishableKey
  );

  let leagueId = null;
  let commissioner = false;
  let golfers = [];

  async function load() {
    const { data: leagues, error: leagueError } = await db
      .from('leagues')
      .select('id')
      .eq('season', 2027)
      .eq('name', 'Bogus Boys')
      .limit(1);

    if (leagueError) throw leagueError;
    if (!leagues?.length) throw Error('League not found.');

    leagueId = leagues[0].id;

    const { data: golferRows, error: golferError } = await db
      .from('golfers')
      .select('id,display_name,kind')
      .eq('league_id', leagueId)
      .order('display_name');

    if (golferError) throw golferError;

    golfers = (golferRows || []).filter(g => g.kind !== 'guest');
    const names = new Map(
      golfers.map(g => [g.id, g.display_name])
    );

    const { data: saved, error: savedError } = await db
      .from('bb_hall_special_awards')
      .select('award_type,award_year,golfer_id')
      .eq('league_id', leagueId)
      .eq('award_year', 2027);

    if (savedError) throw savedError;

    for (const award of awards) {
      const record = (saved || []).find(
        row => row.award_type === award.type
      );

      if (record) {
        award.winner.textContent =
          names.get(record.golfer_id) || 'Recipient unavailable';
      }

      award.select.innerHTML =
        '<option value="">Select recipient</option>';

      for (const golfer of golfers) {
        const option = document.createElement('option');
        option.value = golfer.id;
        option.textContent = golfer.display_name;
        option.selected = record?.golfer_id === golfer.id;
        award.select.appendChild(option);
      }
    }

    const { data: auth } = await db.auth.getUser();

    if (auth?.user) {
      const { data: memberships, error } = await db
        .from('memberships')
        .select('role')
        .eq('league_id', leagueId)
        .eq('user_id', auth.user.id);

      if (error) throw error;

      commissioner = (memberships || []).some(
        row => row.role === 'commissioner'
      );
    }

    admin.hidden = !commissioner;
    status.textContent = '';
  }

  save.addEventListener('click', async () => {
    if (!commissioner || !leagueId) return;

    const selected = awards.filter(a => a.select.value);

    if (!selected.length) {
      status.textContent = 'Select at least one recipient.';
      return;
    }

    save.disabled = true;
    status.textContent = 'Saving special awards…';

    try {
      const rows = selected.map(a => ({
        league_id: leagueId,
        award_year: 2027,
        award_type: a.type,
        golfer_id: a.select.value
      }));

      const { error } = await db
        .from('bb_hall_special_awards')
        .upsert(rows, {
          onConflict: 'league_id,award_year,award_type'
        });

      if (error) throw error;

      await load();
      status.textContent = 'Special awards saved successfully.';
    } catch (error) {
      console.error('Special awards save error:', error);
      status.textContent = 'Save failed: ' + error.message;
    } finally {
      save.disabled = false;
    }
  });

  load().catch(error => {
    console.error('Special awards load error:', error);
    status.textContent = 'Unable to load special awards: ' +
      error.message;
  });
})();
