import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function GoogleCallback() {
  const navigate = useNavigate()
  const { code } = useSearch({ from: '/auth/google/callback' })
  const { handleGoogleCallback } = useAuthStore()

  useEffect(() => {
    if (!code) {
      navigate({ to: '/sign-in', replace: true })
      return
    }

    handleGoogleCallback(code)
      .then(() => navigate({ to: '/', replace: true }))
      .catch(() => navigate({ to: '/sign-in', replace: true }))
  }, [code, handleGoogleCallback, navigate])

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>
          Authenticating with Google...
        </p>
      </div>
    </div>
  )
}
