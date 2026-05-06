import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type { UserProfile } from './types'

export const UserService = {
  async getCurrentUser(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(API_ENDPOINTS.CUSTOMER.ME)
  },
}
