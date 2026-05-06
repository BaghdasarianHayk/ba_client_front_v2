import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { KeywordGeneral } from '@/features/keywords/settings/general'

const searchSchema = z.object({
  keyword: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/keywords/$keywordId/')({
  component: KeywordGeneral,
  validateSearch: searchSchema,
})
