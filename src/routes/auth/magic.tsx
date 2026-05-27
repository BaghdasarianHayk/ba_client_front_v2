import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { MagicLogin } from '@/features/auth/magic-login'

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth/magic')({
  component: MagicLogin,
  validateSearch: searchSchema,
})
