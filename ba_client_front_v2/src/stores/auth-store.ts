import { create } from 'zustand'
import { toast } from 'sonner'
import { TokenManager } from '@/services/api/token-manager'
import { AuthService } from '@/services/api/auth-service'
import { UserService } from '@/services/api/user-service'
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from '@/services/api/types'

// Prevent duplicate Google callback processing
let googleCallbackProcessing = false

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>

  sendVerificationEmail: (email: string) => Promise<void>
  sendResetEmail: (email: string) => Promise<void>
  resetPassword: (data: ResetPasswordRequest) => Promise<void>

  googleAuth: () => void
  handleGoogleCallback: (code: string) => Promise<void>
  magicLogin: (token: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: TokenManager.getAccessToken() !== null,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const response = await AuthService.login(credentials)
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      })
      set({ isAuthenticated: true })
      toast.success('Login successful')
    } catch (error: any) {
      const message = error.detail || error.message || 'Login failed'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const response = await AuthService.register(data)
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      })
      set({ isAuthenticated: true })
      toast.success('Registration successful')
    } catch (error: any) {
      const message = error.detail || error.message || 'Registration failed'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    TokenManager.clearTokens()
    set({ user: null, isAuthenticated: false })
    toast.success('Logged out successfully')
  },

  fetchUser: async () => {
    try {
      const user = await UserService.getCurrentUser()
      set({ user })
    } catch {
      // silently fail — user profile is non-critical
    }
  },

  sendVerificationEmail: async (email) => {
    set({ isLoading: true })
    try {
      await AuthService.sendVerificationEmail(email)
      toast.success('Verification email sent')
    } catch (error: any) {
      const message =
        error.detail || error.message || 'Failed to send verification email'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  sendResetEmail: async (email) => {
    set({ isLoading: true })
    try {
      await AuthService.sendResetEmail(email)
      toast.success('Password reset email sent')
    } catch (error: any) {
      const message =
        error.detail || error.message || 'Failed to send reset email'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (data) => {
    set({ isLoading: true })
    try {
      const response = await AuthService.resetPassword(data)
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      })
      set({ isAuthenticated: true })
      toast.success('Password reset successful')
    } catch (error: any) {
      const message =
        error.detail || error.message || 'Password reset failed'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  googleAuth: () => {
    try {
      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '1046035431297-fkkncatmrg0aelb3tavr7h1olkj0tbmk.apps.googleusercontent.com'
      const redirectUri = `${window.location.origin}/auth/google/callback`

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
      })

      window.location.href = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`
    } catch {
      toast.error('Failed to initialize Google authentication')
    }
  },

  handleGoogleCallback: async (code) => {
    // Prevent duplicate calls (React StrictMode / double-render)
    if (googleCallbackProcessing) return
    googleCallbackProcessing = true

    set({ isLoading: true })
    try {
      const response = await AuthService.googleAuth(code)
      TokenManager.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      })
      set({ isAuthenticated: true })
      toast.success('Successfully authenticated with Google!')
    } catch (error: any) {
      TokenManager.clearTokens()
      set({ isAuthenticated: false })
      const message =
        error.detail || error.message || 'Google authentication failed'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
      setTimeout(() => {
        googleCallbackProcessing = false
      }, 1000)
    }
  },

  magicLogin: async (token) => {
    set({ isLoading: true })
    try {
      // Store the token directly
      TokenManager.setTokens({
        access_token: token,
        refresh_token: '',
        token_type: 'bearer',
      })

      // Verify the token by fetching user data
      await UserService.getCurrentUser()

      set({ isAuthenticated: true })
      toast.success('Successfully logged in via magic link')
    } catch (error: any) {
      TokenManager.clearTokens()
      set({ isAuthenticated: false })
      const message =
        error.detail || error.message || 'Invalid or expired magic link'
      toast.error(message)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
}))
