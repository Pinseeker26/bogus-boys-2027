
/* Bogus Boys 2027 — Members-only player directory and profiles */
(async function () {
  const $ = id => document.getElementById(id);
  const directoryPage = !!$('players-grid');
  const profilePage = !!$('player-profile');

  if (!directoryPage && !profilePage) return;

  const status = directoryPage
    ? $('players-status')
    : $('profile-status');

  const content = directoryPage
    ? $('players-grid')
    : $('player-profile');

  function message(text, signIn = false) {
    status.textContent = text;

    if (signIn) {
      const link = document.createElement('a');
      link.href = 'clubhouse.html';
      link.textContent = ' Go to the Clubhouse';
      status.appendChild(link);
    }
  }

  function initials(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  try {
    if (!window.supabase || !window.BB_SUPABASE_CONFIG) {
  throw new Error('Supabase connection is not available.');
}

const db = window.supabase.createClient(
  window.BB_SUPABASE_CONFIG.url,
  window.BB_SUPABASE_CONFIG.publishableKey
);

    const { data: authData, error: authError } =
      await db.auth.getUser();

    const user = authData?.user;

    if (!user) {
      message('Please sign in to view Bogus Boys players.', true);
      return;
    }

    if (authError) throw authError;

    const { data: memberships, error: memberError } =
      await db
        .from('memberships')
        .select('league_id')
        .eq('user_id', user.id)
        .limit(1);

    if (memberError) throw memberError;

    if (!memberships || memberships.length === 0) {
      message('Player information is available to approved league members only.');
      return;
    }

    const leagueId = memberships[0].league_id;

    const { data: golfers, error: golferError } =
      await db
        .from('golfers')
        .select('id, display_name, flight, active')
        .eq('league_id', leagueId)
        .eq('active', true)
        .order('display_name');

    if (golferError) throw golferError;

    const players = golfers || [];

    if (directoryPage) {
      $('player-count').textContent = players.length;
      $('flight-a-count').textContent =
        players.filter(p => p.flight === 'A').length;
      $('flight-b-count').textContent =
        players.filter(p => p.flight === 'B').length;

      function renderDirectory() {
        const search = $('player-search').value.trim().toLowerCase();
        const flight = $('flight-filter').value;

        const shown = players.filter(p => {
          const name = p.display_name || '';
          return (flight === 'ALL' || p.flight === flight) &&
            name.toLowerCase().includes(search);
        });

        content.replaceChildren();

        if (!shown.length) {
          content.appendChild(element(
            'div',
            'empty-players',
            'No golfers match your search.'
          ));
          return;
        }

        for (const player of shown) {
          const card = element('a', 'player-card');
          card.href = 'players-profile.html?id=' +
            encodeURIComponent(player.id);

          card.appendChild(element(
            'div',
            'player-initials',
            initials(player.display_name)
          ));

          card.appendChild(element(
            'h3',
            '',
            player.display_name || 'Unnamed Golfer'
          ));

          card.appendChild(element(
            'span',
            'player-tag',
            'FLIGHT ' + (player.flight || 'UNASSIGNED')
          ));

          const stats = element('div', 'player-stats');
          const note = element(
            'div',
            '',
            'Season statistics coming soon'
          );
          stats.appendChild(note);
          card.appendChild(stats);

          content.appendChild(card);
        }
      }

      $('player-search').addEventListener('input', renderDirectory);
      $('flight-filter').addEventListener('change', renderDirectory);

      renderDirectory();
    }

    if (profilePage) {
      const id = new URLSearchParams(location.search).get('id');
      const player = players.find(p => String(p.id) === id);

      content.replaceChildren();

      if (!player) {
        content.appendChild(element(
          'div',
          'empty-players',
          'Player not found in the active league roster.'
        ));
      } else {
        const heading = element('section', 'profile-heading');

        heading.appendChild(element(
          'div',
          'player-initials',
          initials(player.display_name)
        ));

        const details = element('div');
        details.appendChild(element(
          'h2',
          '',
          player.display_name || 'Unnamed Golfer'
        ));
        details.appendChild(element(
          'span',
          'player-tag',
          'FLIGHT ' + (player.flight || 'UNASSIGNED') + ' · 2027'
        ));

        heading.appendChild(details);
        content.appendChild(heading);

        const section = element('section', 'profile-section');
        section.appendChild(element(
          'h3',
          '',
          'Week-by-Week Results'
        ));
        section.appendChild(element(
          'p',
          '',
          'Official season statistics will appear here once results are recorded.'
        ));
        content.appendChild(section);
      }
    }

    status.hidden = true;
    content.hidden = false;

  } catch (error) {
    console.error('Players page error:', error);
    message('Unable to load player information. Please try again later.');
  }
})();
