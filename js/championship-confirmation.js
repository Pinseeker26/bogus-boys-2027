
/* Bogus Boys 2027 — Commissioner-confirmed championship Top Four */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const config = window.BB_SUPABASE_CONFIG;

  const status = $('championship-confirmation-status');
  const results = $('championship-confirmation-results');
  const editor = $('championship-confirmation-editor');
  const fields = $('championship-confirmation-fields');
  const saveButton = $('save-championship-results');

  if (!status || !results || !editor || !fields || !saveButton) return;

  if (!window.supabase?.createClient || !config?.url ||
      !config?.publishableKey) {
    status.textContent = 'Championship results unavailable.';
    return;
  }

  const db = window.supabase.createClient(
    config.url,
    config.publishableKey
  );

  let leagueId;
  let commissioner = false;
  let finalists = [];

  const escapeHtml = value =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);

  function showResults(saved) {
    results.innerHTML = '';

    if (saved.length !== 4) return;

    const heading = document.createElement('p');
    heading.innerHTML = '<strong>OFFICIAL FINAL RESULTS</strong>';
    results.appendChild(heading);

    const list = document.createElement('ol');

    for (const row of [...saved].sort(
      (a, b) => a.finishing_position - b.finishing_position
    )) {
      const golfer = finalists.find(
        g => g.id === row.golfer_id
      );

      const item = document.createElement('li');
      item.textContent = golfer?.display_name || 'Unknown golfer';
      list.appendChild(item);
    }

    results.appendChild(list);
  }

  function buildEditor(saved) {
    fields.innerHTML = '';

    for (let position = 1; position <= 4; position++) {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginBottom = '12px';

      const title = document.createElement('strong');
      title.textContent = `Position ${position}: `;
      label.appendChild(title);

      const select = document.createElement('select');
      select.dataset.position = String(position);
      select.required = true;
      select.style.padding = '8px';
      select.style.maxWidth = '100%';

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select golfer';
      select.appendChild(placeholder);

      const selectedId = saved.find(
        row => row.finishing_position === position
      )?.golfer_id;

      for (const golfer of finalists) {
        const option = document.createElement('option');
        option.value = golfer.id;
        option.textContent = golfer.display_name;
        option.selected = golfer.id === selectedId;
        select.appendChild(option);
      }

      label.appendChild(select);
      fields.appendChild(label);
    }
  }

  async function load() {
    status.textContent = 'Loading championship confirmation…';

    const { data: leagues, error: leagueError } = await db
      .from('leagues')
      .select('id')
      .eq('season', 2027)
      .eq('name', 'Bogus Boys')
      .limit(1);

    if (leagueError) throw leagueError;
    if (!leagues?.length) throw Error('League not found.');

    leagueId = leagues[0].id;

    const { data: auth } = await db.auth.getUser();

    if (auth?.user) {
      const { data: membership, error } = await db
        .from('memberships')
        .select('role')
        .eq('league_id', leagueId)
        .eq('user_id', auth.user.id);

      if (error) throw error;

      commissioner = (membership || []).some(
        row => row.role === 'commissioner'
      );
    }

    const { data: weeks, error: weekError } = await db
      .from('weeks')
      .select('id,week_number,status')
      .eq('league_id', leagueId)
      .eq('week_type', 'playoff');

    if (weekError) throw weekError;

    const championship = (weeks || []).find(
      week => Number(week.week_number) === 4
    );

    if (!championship || championship.status !== 'finalized') {
      status.textContent =
        'Awaiting finalized Playoff Round 4.';
      return;
    }

    const { data: rounds, error: roundError } = await db
      .from('rounds')
      .select('golfer_id,gross_score,handicap_used,finalized')
      .eq('week_id', championship.id)
      .eq('finalized', true);

    if (roundError) throw roundError;

    const scored = (rounds || []).filter(
      row => row.gross_score != null &&
             row.handicap_used != null
    );

    if (scored.length !== 4) {
      status.textContent =
        'Expected four finalized championship scores.';
      return;
    }

    const ids = scored.map(row => row.golfer_id);

    const { data: golfers, error: golferError } = await db
      .from('golfers')
      .select('id,display_name,kind')
      .eq('league_id', leagueId)
      .in('id', ids);

    if (golferError) throw golferError;

    finalists = (golfers || []).filter(
      golfer => golfer.kind !== 'guest'
    );

    if (finalists.length !== 4) {
      status.textContent = 'Four league finalists required.';
      return;
    }

    const { data: saved, error: savedError } = await db
      .from('bb_championship_results')
      .select('golfer_id,finishing_position')
      .eq('league_id', leagueId);

    if (savedError) throw savedError;

    const official = saved || [];

    showResults(official);

    status.textContent = official.length === 4
      ? 'Official championship finishing order confirmed.'
      : 'Championship finalized. Awaiting Commissioner confirmation.';

    if (commissioner) {
      buildEditor(official);
      editor.hidden = false;
    }
  }

  saveButton.addEventListener('click', async () => {
    if (!commissioner || finalists.length !== 4) return;

    const selections = [...fields.querySelectorAll('select')];

    const entries = selections.map(select => ({
      league_id: leagueId,
      finishing_position: Number(select.dataset.position),
      golfer_id: select.value
    }));

    const selectedIds = entries.map(entry => entry.golfer_id);

    if (selectedIds.some(id => !id) ||
        new Set(selectedIds).size !== 4) {
      status.textContent =
        'Select four different golfers, one for each position.';
      return;
    }

    if (!window.confirm(
      'Save the official championship finishing order?'
    )) return;

    saveButton.disabled = true;
    status.textContent = 'Saving official championship results…';

    try {
      
      // Save all four finishing positions in one transaction.
      // If anything fails, previous results remain unchanged.
      const { error: saveError } = await db.rpc(
        'bb_save_championship_results',
        {
          p_league_id: leagueId,
          p_golfer_ids: entries.map(entry => entry.golfer_id)
        }
      );

      if (saveError) throw saveError;


      await load();

      status.textContent =
        'Official Top Four saved successfully.';
    } catch (error) {
      console.error('Championship confirmation error:', error);
      status.textContent = 'Save failed: ' + error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  load().catch(error => {
    console.error('Championship confirmation load error:', error);
    status.textContent = 'Unable to load: ' + error.message;
  });
})();
