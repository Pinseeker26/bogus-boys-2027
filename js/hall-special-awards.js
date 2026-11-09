
/* Bogus Boys 2027 — Commissioner-selected Hall of Champions awards */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.BB_SUPABASE_CONFIG;

  const admin = $('hall-special-awards-admin');
  const status = $('hall-special-awards-status');
  const save = $('save-hall-special-awards');
  const commissionerSelect = $('commissioners-award-select');
  const legendSelect = $('bogus-boys-legend-select');
  const commissionerWinner = $('commissioners-award-winner');
  const legendWinner = $('bogus-boys-legend-winner');

  if (!admin || !status || !save ||
      !commissionerSelect || !legendSelect ||
      !commissionerWinner || !legendWinner) return;

  if (!window.supabase?.createClient ||
      !config?.url || !config?.publishableKey) return;

  const db = window.supabase.createClient(
    config.url, config.publishableKey
  );

  let leagueId = null;
  let commissioner = false;
  let golfers = [];
  let savedLegends = [];

  const YEAR = 2027;

  async function load() {
    const { data: leagues, error: leagueError } = await db
      .from('leagues')
      .select('id')
      .eq('season', YEAR)
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
      .select('id,award_type,award_year,golfer_id')
      .eq('league_id', leagueId);

    if (savedError) throw savedError;

    const allAwards = saved || [];

    const commissionerAward = allAwards.find(
      row => row.award_type === 'commissioners_award' &&
             row.award_year === YEAR
    );

    commissionerWinner.textContent = commissionerAward
      ? names.get(commissionerAward.golfer_id) ||
        'Recipient unavailable'
      : 'To Be Determined';

    // Legends are lifetime honorees across all award years.
    savedLegends = allAwards.filter(
      row => row.award_type === 'bogus_boys_legend'
    );

    legendWinner.textContent = savedLegends.length
      ? savedLegends
          .sort((a, b) => a.award_year - b.award_year)
          .map(row => names.get(row.golfer_id) ||
               'Recipient unavailable')
          .join(' • ')
      : 'Awarded When Earned';

    commissionerSelect.innerHTML =
      '<option value="">Select recipient</option>';

    legendSelect.innerHTML = '';

    for (const golfer of golfers) {
      const commissionerOption = document.createElement('option');
      commissionerOption.value = golfer.id;
      commissionerOption.textContent = golfer.display_name;
      commissionerOption.selected =
        commissionerAward?.golfer_id === golfer.id;
      commissionerSelect.appendChild(commissionerOption);

      const legendOption = document.createElement('option');
      legendOption.value = golfer.id;
      legendOption.textContent = golfer.display_name;
      legendOption.selected = savedLegends.some(
        row => row.golfer_id === golfer.id
      );
      legendSelect.appendChild(legendOption);
    }

    const { data: auth } = await db.auth.getUser();

    commissioner = false;

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

    admin.style.display = commissioner ? 'block' : 'none';
    status.textContent = '';
  }

  save.addEventListener('click', async () => {
    if (!commissioner || !leagueId) return;

    const commissionerId = commissionerSelect.value;

    const selectedLegendIds = [
      ...legendSelect.selectedOptions
    ].map(option => option.value);

    save.disabled = true;
    status.textContent = 'Saving special awards…';

    try {
      // Save or change the annual Commissioner's Award.
      if (commissionerId) {
        const { data: existing, error: lookupError } = await db
          .from('bb_hall_special_awards')
          .select('id')
          .eq('league_id', leagueId)
          .eq('award_year', YEAR)
          .eq('award_type', 'commissioners_award')
          .maybeSingle();

        if (lookupError) throw lookupError;

        const record = {
          league_id: leagueId,
          award_year: YEAR,
          award_type: 'commissioners_award',
          golfer_id: commissionerId
        };

        const query = existing
          ? db.from('bb_hall_special_awards')
              .update({ golfer_id: commissionerId })
              .eq('id', existing.id)
          : db.from('bb_hall_special_awards')
              .insert(record);

        const { error } = await query;
        if (error) throw error;
      }

      // Add newly selected Legends without removing past inductees.
      const existingLegendIds = new Set(
        savedLegends.map(row => row.golfer_id)
      );

      const newLegendIds = selectedLegendIds.filter(
        id => !existingLegendIds.has(id)
      );

      if (newLegendIds.length) {
        const records = newLegendIds.map(id => ({
          league_id: leagueId,
          award_year: YEAR,
          award_type: 'bogus_boys_legend',
          golfer_id: id
        }));

        const { error } = await db
          .from('bb_hall_special_awards')
          .insert(records);

        if (error) throw error;
      }

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
    status.textContent =
      'Unable to load special awards: ' + error.message;
  });
})();
