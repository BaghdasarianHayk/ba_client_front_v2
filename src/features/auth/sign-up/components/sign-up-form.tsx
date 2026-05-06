import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail } from 'lucide-react'
import { IconGoogle } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z
  .object({
    email: z.email({
      error: (iss) =>
        iss.input === '' ? 'Please enter your email' : undefined,
    }),
    fullName: z.string().min(1, 'Please enter your full name'),
    languagePreference: z.enum(['en', 'ru'], {
      message: 'Please select a language',
    }),
    password: z
      .string()
      .min(1, 'Please enter your password')
      .min(7, 'Password must be at least 7 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const { register, googleAuth, sendVerificationEmail } = useAuthStore()

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      languagePreference: 'en',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await register({
        email: data.email,
        full_name: data.fullName,
        language_preference: data.languagePreference,
        password: data.password,
        confirm_password: data.confirmPassword,
      })
      setRegisteredEmail(data.email)
    } catch {
      // error handled by store
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (!registeredEmail || resendCountdown > 0 || isLoading) return
    setIsLoading(true)
    try {
      await sendVerificationEmail(registeredEmail)
      setResendCountdown(60)
    } catch {
      // error handled by store
    } finally {
      setIsLoading(false)
    }
  }

  // Show "Check your email" card after successful registration
  if (registeredEmail) {
    return (
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
            <span className='font-medium text-foreground'>{registeredEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg border bg-muted/50 p-4'>
            <p className='text-sm text-muted-foreground'>
              Click the link in the email to verify your account and complete
              your registration. Check your spam folder if you don&apos;t see it.
            </p>
          </div>
          <Button
            onClick={handleResend}
            disabled={resendCountdown > 0 || isLoading}
            variant='outline'
            className='w-full'
          >
            {resendCountdown > 0 ? (
              `Resend in ${resendCountdown}s`
            ) : isLoading ? (
              <>
                <Loader2 className='animate-spin' /> Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='languagePreference'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='en'>English</SelectItem>
                  <SelectItem value='ru'>Russian</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading && <Loader2 className='animate-spin' />}
          Create Account
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant='outline'
          className='w-full'
          type='button'
          disabled={isLoading}
          onClick={() => googleAuth()}
        >
          <IconGoogle className='h-4 w-4' /> Sign up with Google
        </Button>
      </form>
    </Form>
  )
}
