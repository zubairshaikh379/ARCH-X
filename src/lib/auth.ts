// Secure auth utilities — passwords are SHA-256 hashed before storage.
// No plaintext passwords, no dev bypasses, no OTP in toasts.

const SALT = "archx-secure-salt-v2-2025";
const USERS_KEY = "archx_users_v2";
const SESSION_KEY = "archx_session_v2";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(input);
  return inputHash === storedHash;
}

export function generateOtp(): string {
  // Cryptographically random 6-digit code
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

// ─── User Storage ──────────────────────────────────────────────────────────────

export interface StoredUser {
  username: string;
  passwordHash: string;
  email: string;
  mfaEnabled: boolean;
  createdAt: number;
}

export const UserStore = {
  getAll(): StoredUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
    catch { return []; }
  },

  save(users: StoredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  find(username: string): StoredUser | undefined {
    return UserStore.getAll()
      .find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  add(user: StoredUser) {
    const existing = UserStore.getAll().filter(u => u.username !== user.username);
    UserStore.save([...existing, user]);
  },

  update(username: string, updates: Partial<StoredUser>) {
    const users = UserStore.getAll().map(u =>
      u.username === username ? { ...u, ...updates } : u
    );
    UserStore.save(users);
  },
};

// ─── Session ──────────────────────────────────────────────────────────────────

export const Session = {
  get(): string | null { return localStorage.getItem(SESSION_KEY); },
  set(username: string) { localStorage.setItem(SESSION_KEY, username); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

// ─── Profile Storage (separate from auth) ─────────────────────────────────────

export const ProfileStore = {
  key: (username: string) => `archx_profile_${username.toLowerCase()}`,

  get(username: string): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(ProfileStore.key(username));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  save(username: string, data: Record<string, unknown>) {
    localStorage.setItem(ProfileStore.key(username), JSON.stringify(data));
  },

  clear(username: string) {
    localStorage.removeItem(ProfileStore.key(username));
  },
};
