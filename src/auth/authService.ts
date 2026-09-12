import { AUTH_SESSION_KEY } from '../lib/utils'

export type AuthUser = { email: string }

export type RegisterInput = {
  email: string
  phone: string
  password: string
  relationship: string
}

/**
 * The seam between the UI and whatever performs authentication.
 * Today: a mock over localStorage. Tomorrow: a real provider — swap
 * `authService` below and nothing else in the app needs to change.
 */
export interface AuthService {
  /** Synchronous so the provider can initialise without an effect. */
  getSession(): AuthUser | null
  login(email: string, password: string): Promise<AuthUser>
  register(input: RegisterInput): Promise<void>
  logout(): Promise<void>
}

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { email?: unknown }).email === 'string'
    ) {
      return { email: (parsed as { email: string }).email }
    }
    return null
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_SESSION_KEY)
  } catch {
    /* privacy mode — ignore */
  }
}

/**
 * Mock implementation. Login is a formality: any email/password pair that
 * passed form validation is accepted. Registration persists nothing — the
 * UI shows the "pending review" state instead.
 */
function createMockAuthService(): AuthService {
  return {
    getSession: readSession,
    async login(email) {
      const user: AuthUser = { email: email.trim() }
      writeSession(user)
      return user
    },
    async register() {
      /* no backend yet — nothing to persist */
    },
    async logout() {
      writeSession(null)
    },
  }
}

export const authService: AuthService = createMockAuthService()
