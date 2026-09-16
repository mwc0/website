/*
 * Shared leaderboard storage.
 *
 * Talks to Supabase when CONFIG below is filled in. Until then it keeps a
 * per-browser board in localStorage so the games still work unconfigured.
 *
 * Setup:
 *   1. Create a Supabase project and run the leaderboard table SQL.
 *   2. Paste the project URL and the public anon key below.
 * The anon key is meant to live in client code: it only grants what the row
 * level security policies allow, which here is reading and appending rows.
 */
window.Leaderboard = (function () {
  const CONFIG = {
    url: 'https://haeqrrxqwksfuawyhwtv.supabase.co',
    anonKey: 'sb_publishable_s7W8VMkmepZZ62M-msXHSg_QDRzajCI',
    table: 'leaderboard',
  };

  const LIMIT = 10;

  // Light filter only. Three letters cannot be policed thoroughly, and the
  // table is small enough to clean up by hand if something slips through.
  const BLOCKED = new Set([
    'ASS', 'CUM', 'FAG', 'FCK', 'FUC', 'FUK', 'JIZ', 'KKK', 'NIG', 'TIT',
  ]);

  function isRemote() {
    return Boolean(CONFIG.url && CONFIG.anonKey);
  }

  function normalizeName(raw) {
    return String(raw || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  }

  function validateName(name) {
    if (name.length !== 3) return 'three letters, a to z';
    if (BLOCKED.has(name)) return 'pick different initials';
    return null;
  }

  function endpoint() {
    return CONFIG.url.replace(/\/$/, '') + '/rest/v1/' + CONFIG.table;
  }

  function headers(extra) {
    return Object.assign({
      apikey: CONFIG.anonKey,
      Authorization: 'Bearer ' + CONFIG.anonKey,
      'Content-Type': 'application/json',
    }, extra || {});
  }

  // ---- local fallback ----

  function localKey(game) {
    return 'leaderboard-' + game;
  }

  function localTop(game) {
    try {
      const rows = JSON.parse(localStorage.getItem(localKey(game)) || '[]');
      return Array.isArray(rows) ? rows.slice(0, LIMIT) : [];
    } catch (e) {
      return [];
    }
  }

  function localSubmit(game, name, score) {
    const row = { name: name, score: score, at: Date.now() };
    const rows = localTop(game).concat([row]);
    rows.sort((a, b) => b.score - a.score || a.at - b.at);
    try {
      localStorage.setItem(localKey(game), JSON.stringify(rows.slice(0, LIMIT)));
    } catch (e) {
      // storage unavailable, the score just will not persist
    }
    return row;
  }

  // ---- api ----

  async function top(game) {
    if (!isRemote()) return localTop(game);

    const query = '?game=eq.' + encodeURIComponent(game)
      + '&select=name,score,created_at'
      + '&order=score.desc,created_at.asc'
      + '&limit=' + LIMIT;

    const res = await fetch(endpoint() + query, { headers: headers() });
    if (!res.ok) throw new Error('leaderboard unavailable (' + res.status + ')');
    return res.json();
  }

  async function submit(game, rawName, score) {
    const name = normalizeName(rawName);
    const problem = validateName(name);
    if (problem) throw new Error(problem);

    if (!isRemote()) return localSubmit(game, name, score);

    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify({ game: game, name: name, score: score }),
    });
    if (!res.ok) throw new Error('could not submit (' + res.status + ')');
    const rows = await res.json();
    return rows[0] || { name: name, score: score };
  }

  return {
    isRemote: isRemote,
    top: top,
    submit: submit,
    normalizeName: normalizeName,
    validateName: validateName,
    LIMIT: LIMIT,
  };
})();
