
/* Bogus Boys 2027 — Commissioner Golfer Score Entry Controls */
(async function () {
  'use strict';

  const weekSelect = document.getElementById('self-score-week');
  const enabledSelect = document.getElementById('self-score-enabled');
  const saveButton = document.getElementById('self-score-save');

  if (!weekSelect || !enabledSelect || !saveButton) return;

  const cfg = window.BB_SUPABASE_CONFIG;

  function showMessage(text, isError = false) {
    let message = document.getElementById('self-score-message');

    if (!message) {
      message = document.createElement('p');
      message.id = 'self-score-message';
      message.setAttribute('role', 'status');
      saveButton.insertAdjacentElement('afterend', message);
    }

    message.textContent = text;
    message.style.color = isError ? '#b42318' : 'inherit';
  }

  if (!window.supabase?.createClient ||
      !cfg?.url || !cfg?.publishableKey) {
    showMessage('Supabase connection is unavailable.', true);
    return;
  }

  const db = window.supabase.createClient(
    cfg.url,
    cfg.publishableKey
  );

  const LEAGUE_ID = '5c6fde06-0205-4f47-b333-eedcd0b47c12';

  let weeks = [];
  let permissions = [];

  function selectedWeek() {
    return weeks.find(w => w.id === weekSelect.value);
  }

  function updateControls() {
    const week = selectedWeek();

    if (!week) {
      enabledSelect.value = 'false';
      saveButton.disabled = true;
      return;
    }

    const permission = permissions.find(p =>
      p.week_id === week.id
    );

    enabledSelect.value = permission?.enabled
      ? 'true'
      : 'false';

    const isOpen = week.status === 'open';

    enabledSelect.disabled = !isOpen;
    saveButton.disabled = !isOpen;

    if (!isOpen) {
      showMessage('This week is finalized. Scoring permission is locked.');
    } else {
      showMessage('Scoring permission is ready for this week.');
    }
  }

  try {
    const { data: auth, error: authError } =
      await db.auth.getUser();

    if (authError) throw authError;

    if (!auth?.user) {
      throw new Error('Sign in as commissioner to manage scoring.');
    }

    const { data: memberships, error: membershipError } =
      await db.from('memberships')
        .select('role')
        .eq('league_id', LEAGUE_ID)
        .eq('user_id', auth.user.id);

    if (membershipError) throw membershipError;

    const commissioner = (memberships || []).some(
      m => m.role === 'commissioner'
    );

    if (!commissioner) {
      throw new Error('Commissioner access required.');
    }

    const responses = await Promise.all([
      db.from('weeks')
        .select('id,week_number,week_type,status')
        .eq('league_id', LEAGUE_ID),

      db.from('week_self_scoring')
        .select('week_id,enabled')
    ]);

    for (const response of responses) {
      if (response.error) throw response.error;
    }

    weeks = responses[0].data || [];
    permissions = responses[1].data || [];

    weeks.sort((a, b) => {
      const aPlayoff = a.week_type === 'playoff' ? 1 : 0;
      const bPlayoff = b.week_type === 'playoff' ? 1 : 0;

      return aPlayoff - bPlayoff ||
        Number(a.week_number) - Number(b.week_number);
    });

    weekSelect.replaceChildren();

    weeks.forEach(week => {
      const label = week.week_type === 'playoff'
        ? 'Playoff ' + week.week_number
        : 'Week ' + week.week_number;

      weekSelect.add(new Option(label, week.id));
    });

    weekSelect.addEventListener('change', updateControls);

    saveButton.addEventListener('click', async () => {
      const week = selectedWeek();

      if (!week || week.status !== 'open') {
        showMessage('Only open weeks can be changed.', true);
        return;
      }

      saveButton.disabled = true;
      showMessage('Saving scoring permission...');

      const enabled = enabledSelect.value === 'true';

      try {
        const { data, error } = await db
          .from('week_self_scoring')
          .upsert({
            week_id: week.id,
            enabled: enabled,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'week_id'
          })
          .select('week_id,enabled');

        if (error) throw error;

        if (!data?.length) {
          throw new Error('The database did not confirm the save.');
        }

        const existing = permissions.find(p =>
          p.week_id === week.id
        );

        if (existing) {
          existing.enabled = enabled;
        } else {
          permissions.push({
            week_id: week.id,
            enabled: enabled
          });
        }

        showMessage(
          'Saved! Golfer score entry is ' +
          (enabled ? 'ON' : 'OFF') +
          ' for the selected week.'
        );

      } catch (error) {
        showMessage('NOT SAVED: ' + error.message, true);
      } finally {
        saveButton.disabled = false;
      }
    });

    if (weeks.length) {
      updateControls();
    } else {
      showMessage('No league weeks were found.', true);
    }

  } catch (error) {
    console.error('Self-scoring commissioner error:', error);
    showMessage('Unable to load scoring controls: ' + error.message, true);
  }
})();
