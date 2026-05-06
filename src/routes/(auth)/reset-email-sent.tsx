import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ResetEmailSent } from '@/features/auth/reset-email-sent'

const searchSchema = z.object({
  email: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/reset-email-sent')({
  component: ResetEmailSent,
  validateSearch: searchSchema,
})
