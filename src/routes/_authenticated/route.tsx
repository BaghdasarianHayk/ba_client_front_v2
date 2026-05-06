import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { TokenManager } from '@/services/api/token-manager'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const token = TokenManager.getAccessToken()
    if (!token) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
    // Fetch user profile if not loaded yet
    const { user, fetchUser } = useAuthStore.getState()
    if (!user) fetchUser()
  },
  component: AuthenticatedLayout,
})
