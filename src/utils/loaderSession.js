// Keep the existing key so sessions completed before this fix also skip loading.
const SESSION_KEY = 'ai-club:particle-loader:v1';
let playedInThisDocument = false;

export function hasLoaderPlayed() {
  if (playedInThisDocument) return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLoaderPlayed() {
  playedInThisDocument = true;
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch { /* The in-memory flag still survives client-side navigation. */ }
}
