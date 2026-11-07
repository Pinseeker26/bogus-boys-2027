/* Bogus Boys 2027 nine-hole league handicap (not an official WHS index).
   Pure calculation helpers: history must come from finalized league rounds.
   Only earlier rounds may be supplied when computing a given week's handicap.
*/
(function (root) {
  'use strict';
  function handicapCount(n) {
    return n >= 20 ? 8 : n >= 12 ? 3 : n >= 9 ? 3 : n >= 8 ? 2 : n >= 6 ? 2 : n >= 3 ? 1 : 0;
  }
  function eligibleRound(r) {
    if (!r || r.score === null || r.score === undefined || r.score === '') return false;
    if (r.rating === null || r.rating === undefined || r.rating === '') return false;
    if (r.slope === null || r.slope === undefined || r.slope === '') return false;
    const score = Number(r.score), rating = Number(r.rating), slope = Number(r.slope);
    return Number.isFinite(score) && score >= 9 && score <= 100 &&
      Number.isFinite(rating) && rating > 0 && Number.isFinite(slope) && slope > 0;
  }
  function calculateLeagueHandicap(rounds, startingHandicap = null) {
    const recent = (Array.isArray(rounds) ? rounds : []).filter(eligibleRound).slice(-20);
    const n = recent.length;
    const k = handicapCount(n);
    if (n < 3) {
      const starter = startingHandicap === null || startingHandicap === undefined || startingHandicap === ''
        ? null : Number(startingHandicap);
      const playing = Number.isFinite(starter) ? Math.round(starter) : null;
      return { handicap: playing, playingHandicap: playing,
        quota: playing === null ? null : 18 - playing, rounds: n, count: 0,
        source: playing === null ? 'unassigned' : 'commissioner' };
    }
    const diffs = recent.map(r => (Number(r.score) - Number(r.rating)) * 113 / Number(r.slope))
      .sort((a, b) => a - b);
    const avg = diffs.slice(0, k).reduce((sum, x) => sum + x, 0) / k;
    const handicap = Math.round(avg * 100) / 100;
    const playingHandicap = Math.round(handicap);
    return { handicap, playingHandicap, quota: 18 - playingHandicap,
      rounds: n, count: k, source: 'league-rounds' };
  }
  root.BBHandicap2027 = Object.freeze({ handicapCount, eligibleRound, calculateLeagueHandicap });
})(window);
