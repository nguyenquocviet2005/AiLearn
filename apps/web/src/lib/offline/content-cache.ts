/**
 * Local cache of the student's own last-fetched readiness/remediation content.
 *
 * Populated after every successful real-API fetch; read back when the app reloads
 * offline (before the network request can complete) or when a fetch fails. This is
 * what "cached content remains accessible offline" and the "Trợ giúp -> Kiểm tra
 * bài đã lưu" action are backed by — not the static data/fixtures/ seed JSON, which
 * covers a different demo student/lesson and would show mismatched content.
 */

const STORAGE_KEY = "ailearn.student.contentCache.v1";

export interface ContentCacheEntry<T = unknown> {
  key: string;
  savedAt: string;
  data: T;
}

function readAll(): Record<string, ContentCacheEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ContentCacheEntry>) : {};
  } catch {
    return {};
  }
}

function writeAll(entries: Record<string, ContentCacheEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function saveToCache<T>(key: string, data: T): void {
  const entries = readAll();
  entries[key] = { key, savedAt: new Date().toISOString(), data };
  writeAll(entries);
}

export function readFromCache<T>(key: string): T | null {
  const entry = readAll()[key];
  return entry ? (entry.data as T) : null;
}

export function listCacheEntries(): ContentCacheEntry[] {
  return Object.values(readAll());
}

export function clearCache(): void {
  writeAll({});
}
