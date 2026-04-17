/**
 * 履歴・お気に入り（localStorage）
 * キーは app.js の定数と整合させる
 */
(function (global) {
  const LS_HISTORY = 'homePrint_history_v1';
  const LS_FAVORITES = 'homePrint_favorites_v1';

  function genId() {
    try {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        return global.crypto.randomUUID();
      }
    } catch (_e) {
      /* ignore */
    }
    return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function loadArray(key) {
    try {
      const s = global.localStorage.getItem(key);
      if (!s) return [];
      const v = JSON.parse(s);
      return Array.isArray(v) ? v : [];
    } catch (_e) {
      return [];
    }
  }

  function saveArray(key, arr) {
    try {
      global.localStorage.setItem(key, JSON.stringify(arr));
    } catch (_e) {
      /* ignore */
    }
  }

  function maxHistory(isPro) {
    return isPro ? Number.POSITIVE_INFINITY : 3;
  }

  function maxFavorites(isPro) {
    return isPro ? Number.POSITIVE_INFINITY : 1;
  }

  function loadHistory() {
    return loadArray(LS_HISTORY);
  }

  function loadFavorites() {
    return loadArray(LS_FAVORITES);
  }

  /**
   * 新しい履歴を先頭に追加。件数超過時は古いものを削除。
   * @param {object} entry - id / createdAt は未設定なら付与
   */
  function prependHistory(entry, isPro) {
    const id = entry.id || genId();
    const createdAt = typeof entry.createdAt === 'number' ? entry.createdAt : Date.now();
    const row = { ...entry, id, createdAt };
    const list = loadHistory().filter((e) => e && e.id !== id);
    const next = [row, ...list];
    const cap = maxHistory(isPro);
    const trimmed = Number.isFinite(cap) ? next.slice(0, cap) : next;
    saveArray(LS_HISTORY, trimmed);
    return trimmed;
  }

  function updateHistoryTitle(historyId, title) {
    const list = loadHistory().map((e) => {
      if (e && e.id === historyId) return { ...e, title: title == null ? '' : String(title) };
      return e;
    });
    saveArray(LS_HISTORY, list);
    return list;
  }

  function updateFavoriteTitle(favoriteId, title) {
    const list = loadFavorites().map((e) => {
      if (e && e.id === favoriteId) return { ...e, title: title == null ? '' : String(title) };
      return e;
    });
    saveArray(LS_FAVORITES, list);
    return list;
  }

  /**
   * 履歴行をお気に入りにコピー（履歴とは別配列）
   */
  function addFavoriteFromHistory(historyEntry, isPro) {
    const favs = loadFavorites();
    if (favs.length >= maxFavorites(isPro)) {
      return { ok: false, reason: 'limit' };
    }
    const { id: histId, ...rest } = historyEntry;
    const row = {
      ...rest,
      id: genId(),
      favoritedAt: Date.now(),
      favoritedHistoryId: histId || null,
    };
    saveArray(LS_FAVORITES, [row, ...favs]);
    return { ok: true, entry: row };
  }

  function removeFavorite(favoriteId) {
    const next = loadFavorites().filter((e) => e && e.id !== favoriteId);
    saveArray(LS_FAVORITES, next);
    return next;
  }

  function isHistoryFavorited(historyId) {
    if (!historyId) return false;
    return loadFavorites().some((f) => f && f.favoritedHistoryId === historyId);
  }

  /** お気に入りに同一履歴が既にある場合は削除（トグル用） */
  function toggleFavoriteFromHistory(historyEntry, isPro) {
    const hid = historyEntry && historyEntry.id;
    if (!hid) return { ok: false, reason: 'no_id' };
    const favs = loadFavorites();
    const existing = favs.find((f) => f.favoritedHistoryId === hid);
    if (existing) {
      removeFavorite(existing.id);
      return { ok: true, action: 'removed' };
    }
    return addFavoriteFromHistory(historyEntry, isPro);
  }

  global.HistoryStore = {
    LS_HISTORY,
    LS_FAVORITES,
    genId,
    loadHistory,
    loadFavorites,
    prependHistory,
    updateHistoryTitle,
    updateFavoriteTitle,
    addFavoriteFromHistory,
    removeFavorite,
    isHistoryFavorited,
    toggleFavoriteFromHistory,
    maxHistory,
    maxFavorites,
  };
})(typeof window !== 'undefined' ? window : globalThis);
