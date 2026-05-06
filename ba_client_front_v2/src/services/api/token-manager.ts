import type { TokenData } from './types'

const ACCESS_TOKEN_KEY = 'ba_access_token'
const REFRESH_TOKEN_KEY = 'ba_refresh_token'

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

export const TokenManager = {
  setTokens(tokens: TokenData) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh(resolve)
      })
    }

    isRefreshing = true

    try {
      const { AuthService } = await import('./auth-service')
      const response = await AuthService.refreshToken(refreshToken)

      this.setTokens({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      })

      onTokenRefreshed(response.access_token)
      isRefreshing = false
      return response.access_token
    } catch (error) {
      isRefreshing = false
      refreshSubscribers = []
      throw error
    }
  },
}
