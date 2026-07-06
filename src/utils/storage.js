export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is optional; app should continue if storage is blocked.
  }
}

export function saveHistoryItem(key, item, limit = 8) {
  const current = readStorage(key, []);
  const next = [item, ...current].slice(0, limit);
  writeStorage(key, next);
  return next;
}
