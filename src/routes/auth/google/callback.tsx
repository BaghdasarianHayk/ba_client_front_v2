import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { GoogleCallback } from '@/features/auth/google-callback'

const searchSchema = z.object({
  code: z.string().optional(),
  scope: z.string().optional(),
  authuser: z.string().optional(),
  prompt: z.string().optional(),
})

export const Route = createFileRoute('/auth/google/callback')({
  component: GoogleCallback,
  validateSearch: searchSchema,
})
