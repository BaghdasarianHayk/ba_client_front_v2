import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function MagicLogin() {
  const navigate = useNavigate()
  const { token } = useSearch({ from: '/(auth)/magic-login' })
  const { magicLogin } = useAuthStore()

  useEffect(() => {
    if (!token) {
      navigate({ to: '/sign-in', replace: true })
      return
    }

    magicLogin(token)
      .then(() => navigate({ to: '/', replace: true }))
      .catch(() => navigate({ to: '/sign-in', replace: true }))
  }, [token, magicLogin, navigate])

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>Logging you in...</p>
      </div>
    </div>
  )
}
