import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Mentions } from '@/features/sheet'

const searchSchema = z.object({
  mention: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/sheet/')({
  component: Mentions,
  validateSearch: searchSchema,
})
