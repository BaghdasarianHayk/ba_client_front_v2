import { useState, useEffect } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { Mail, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '../auth-layout'

export function VerifyEmail() {
  const { email } = useSearch({ from: '/(auth)/verify-email' })
  const { sendVerificationEmail, isLoading } = useAuthStore()
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    try {
      await sendVerificationEmail(email)
      setCountdown(60)
    } catch {
      // error handled by store
    }
  }

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
            <Mail className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-lg tracking-tight'>
            Check your email
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to{' '}
            <span className='font-medium text-foreground'>{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg border bg-muted/50 p-4'>
            <p className='text-sm text-muted-foreground'>
              Click the link in the email to verify your account and complete
              your registration. Check your spam folder if you don&apos;t see
              it.
            </p>
          </div>
          <Button
            onClick={handleResend}
            disabled={countdown > 0 || isLoading || !email}
            variant='outline'
            className='w-full'
          >
            {countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : isLoading ? (
              <>
                <Loader2 className='animate-spin' /> Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
        </CardContent>
        <CardFooter>
          <p className='mx-auto text-center text-sm text-muted-foreground'>
            Already verified?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
