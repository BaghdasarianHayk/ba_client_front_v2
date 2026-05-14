import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError } from 'axios'
import { TokenManager } from './token-manager'

/**
 * Creates an Axios instance with:
 * - Auto-attach Bearer token on every request
 * - Auto-refresh token on 401 and retry the failed request
 * - Redirect to /sign-in if refresh also fails
 *
 * Use this for ALL API microservices (main, poster, knowledge-base).
 */
export function createApiClient(config: {
  baseURL: string
  timeout: number
}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
  })

  // ─── Request: attach token ─────────────────────────────────────────────────
  instance.interceptors.request.use(
    (reqConfig) => {
      const token = TokenManager.getAccessToken()
      if (token) reqConfig.headers.Authorization = `Bearer ${token}`
      if (!(reqConfig.data instanceof FormData)) {
        reqConfig.headers['Content-Type'] = 'application/json'
      }
      reqConfig.headers['Accept'] = 'application/json'
      return reqConfig
    },
    (error) => Promise.reject(error)
  )

  // ─── Response: refresh on 401 ──────────────────────────────────────────────
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean
      }

      if (!originalRequest) return Promise.reject(error)

      const isAuthEndpoint = originalRequest.url?.includes('/auth/')

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        originalRequest._retry = true
        try {
          const newToken = await TokenManager.refreshAccessToken()
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return instance(originalRequest)
        } catch {
          TokenManager.clearTokens()
          window.location.href = '/sign-in'
          return Promise.reject(error)
        }
      }

      return Promise.reject(error)
    }
  )

  return instance
}
