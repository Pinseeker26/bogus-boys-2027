
(async function () {
  const container = document.getElementById('past-league-champions');
  if (!container) return;

  const config = window.BB_SUPABASE_CONFIG;
  if (!config?.url || !config?.anonKey || !window.supabase) return;

  const db = window.supabase.createClient(config.url, config.anonKey);

  const { data, error } = await db
    .from('bb_championship_history')
    .select('season, champion_name')
    .order('season', { ascending: false });

  if (error) {
    console.error('Unable to load championship history:', error);
    return;
  }

  if (!data?.length) return;

  container.replaceChildren();

  data.forEach(({ season, champion_name }) => {
    const card = document.createElement('article');
    card.className = 'champion-card';

    const year = document.createElement('span');
    year.className = 'season';
    year.textContent = season;

    const label = document.createElement('div');
    label.className = 'eyebrow';
    label.textContent = 'BOGUS BOYS LEAGUE CHAMPION';

    const name = document.createElement('h3');
    name.textContent = champion_name;

    const description = document.createElement('p');
    description.textContent = `${season} League Champion`;

    card.append(year, label, name, description);
    container.appendChild(card);
  });
})();
