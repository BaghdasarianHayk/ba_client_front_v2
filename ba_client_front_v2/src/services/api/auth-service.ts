import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenData,
} from './types'

interface AuthResponse extends TokenData {
  access_token: string
  refresh_token: string
  token_type: string
}

export const AuthService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data)
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    })
  },

  async sendVerificationEmail(email: string): Promise<void> {
    await apiClient.post<void>(API_ENDPOINTS.AUTH.SEND_VERIFICATION_EMAIL, {
      email,
    })
  },

  async sendResetEmail(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.SEND_RESET_EMAIL,
      { email }
    )
  },

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    )
  },

  async googleAuth(code: string): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>(
      `${API_ENDPOINTS.AUTH.GOOGLE}?code=${encodeURIComponent(code)}`
    )
  },
}
