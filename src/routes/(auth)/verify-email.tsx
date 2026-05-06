import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { VerifyEmail } from '@/features/auth/verify-email'

const searchSchema = z.object({
  email: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/verify-email')({
  component: VerifyEmail,
  validateSearch: searchSchema,
})
