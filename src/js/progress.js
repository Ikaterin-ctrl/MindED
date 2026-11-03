/* Profile and study progress, kept in this browser per account (see account.js).
   Used by the Workspace to record progress and by Preferências to show it. */
(function () {
  const PROFILE_KEY = 'minded_profile';
  const STATS_KEY = 'minded_stats';

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  // Local calendar day, so the streak follows the person's own midnight
  function dayKey(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  const DEFAULT_PROFILE = { apelido: '', avatar: '', metaMinutos: 20, dias: [1, 2, 3, 4, 5] };
  const EMPTY_STATS = { adaptacoes: 0, passos: 0, revisoes: 0, minutos: {}, dias: [] };

  window.MindedProfile = {
    load: () => ({ ...DEFAULT_PROFILE, ...read(PROFILE_KEY, {}) }),
    save: profile => write(PROFILE_KEY, profile),
  };

  window.MindedProgress = {
    load: () => ({ ...EMPTY_STATS, ...read(STATS_KEY, {}) }),

    // Counts one more adaptation, step or review, and marks today as a study day
    bump(field, n = 1) {
      const stats = this.load();
      stats[field] = (stats[field] || 0) + n;
      const today = dayKey();
      if (!stats.dias.includes(today)) stats.dias = [...stats.dias, today].slice(-400);
      write(STATS_KEY, stats);
      window.dispatchEvent(new Event('minded-progress'));
    },

    addMinutes(n) {
      const stats = this.load();
      const today = dayKey();
      stats.minutos[today] = (stats.minutos[today] || 0) + n;
      // Only the last two months are kept
      const keep = Object.keys(stats.minutos).sort().slice(-60);
      stats.minutos = Object.fromEntries(keep.map(k => [k, stats.minutos[k]]));
      if (!stats.dias.includes(today)) stats.dias = [...stats.dias, today].slice(-400);
      write(STATS_KEY, stats);
      window.dispatchEvent(new Event('minded-progress'));
    },

    minutesOn(date) {
      return this.load().minutos[dayKey(date)] || 0;
    },

    // Days in a row with some study, counting from today (or from yesterday, if today has none yet)
    streak() {
      const days = new Set(this.load().dias);
      const d = new Date();
      if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
      let count = 0;
      while (days.has(dayKey(d))) {
        count += 1;
        d.setDate(d.getDate() - 1);
      }
      return count;
    },

    // The last 7 days, oldest first, for the weekly chart
    week() {
      const out = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        out.push({ date: d, minutes: this.minutesOn(d) });
      }
      return out;
    },
  };

  // Pixel avatars: one 8×8 face, in a few colours
  const FACE = 'M2 1h4v1h-4zM1 2h6v4h-6zM2 6h4v1h-4z';
  const EYES = 'M2 3h1v1h-1zM5 3h1v1h-1zM3 5h2v1h-2z';
  const COLORS = { roxo: '#7C3AED', azul: '#2563EB', verde: '#059669', laranja: '#EA580C', rosa: '#DB2777', cinza: '#4B5563' };
  window.MINDED_AVATARS = Object.fromEntries(Object.entries(COLORS).map(([name, color]) => [name,
    `<svg viewBox="0 0 8 8" width="48" height="48" shape-rendering="crispEdges" aria-hidden="true"><path fill="${color}" d="${FACE}"/><path fill="#fff" d="${EYES}"/></svg>`]));
})();
