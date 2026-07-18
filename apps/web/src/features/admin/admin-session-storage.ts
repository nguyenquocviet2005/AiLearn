const STORAGE_KEY = "ailearn_admin_session";

export type StoredAdminSession = {
  token: string;
  expiresAt: string;
};

export function readAdminSession(): StoredAdminSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAdminSession>;
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export function writeAdminSession(session: StoredAdminSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isExpired(session: StoredAdminSession): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}
