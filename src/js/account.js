/* Keeps each account's local data apart on shared browsers.
   Only the signed-in account's data stays in the live keys; the rest waits in a
   per-account stash. Accessibility settings belong to the device, not the account. */
(function () {
  const PRIVATE_KEYS = ['minded_prefs', 'minded_history', 'minded_draft', 'minded_onboarded'];
  const OWNER_KEY = 'minded_owner';
  const STASH_PREFIX = 'minded_account_';

  function stash(uid) {
    const data = {};
    PRIVATE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
      localStorage.removeItem(key);
    });
    if (Object.keys(data).length) localStorage.setItem(STASH_PREFIX + uid, JSON.stringify(data));
  }

  function restore(uid) {
    const saved = localStorage.getItem(STASH_PREFIX + uid);
    if (!saved) return false;
    Object.entries(JSON.parse(saved)).forEach(([key, value]) => localStorage.setItem(key, value));
    localStorage.removeItem(STASH_PREFIX + uid);
    return true;
  }

  // Returns true when the live data changed, so the page must reload.
  window.mindedUseAccount = uid => {
    try {
      const owner = localStorage.getItem(OWNER_KEY);
      if (owner === uid) return false;
      if (owner) stash(owner);
      const restored = restore(uid);
      localStorage.setItem(OWNER_KEY, uid);
      return Boolean(owner) || restored;
    } catch (_) {
      return false;
    }
  };

  // Returns true when an account's data was put away.
  window.mindedLeaveAccount = () => {
    try {
      const owner = localStorage.getItem(OWNER_KEY);
      if (!owner) return false;
      stash(owner);
      localStorage.removeItem(OWNER_KEY);
      return true;
    } catch (_) {
      return false;
    }
  };
})();
