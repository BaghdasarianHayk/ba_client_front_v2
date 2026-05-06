import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from 'axios'
import { API_CONFIG } from '@/config/api-config'
import { TokenManager } from './token-manager'

class APIClient {
  private axiosInstance: AxiosInstance

  constructor(config: { baseURL: string; timeout: number }) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
    })
    this.setupRequestInterceptor()
    this.setupResponseInterceptor()
  }

  private setupRequestInterceptor() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = TokenManager.getAccessToken()
        if (token) config.headers.Authorization = `Bearer ${token}`
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json'
        }
        config.headers['Accept'] = 'application/json'
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  private setupResponseInterceptor() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean
        }

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
            return this.axiosInstance(originalRequest)
          } catch {
            TokenManager.clearTokens()
            window.location.href = '/sign-in'
            return Promise.reject(error)
          }
        }

        // Normalize error
        const apiError = {
          message:
            (error.response?.data as any)?.message ||
            error.message ||
            'An error occurred',
          status: error.response?.status || 500,
          detail: (error.response?.data as any)?.detail,
        }
        return Promise.reject(apiError)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config)
    return response.data
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config)
    return response.data
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config)
    return response.data
  }
}

export const apiClient = new APIClient({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
})
