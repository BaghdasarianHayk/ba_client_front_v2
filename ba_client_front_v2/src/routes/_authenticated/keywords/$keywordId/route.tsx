import { createFileRoute } from '@tanstack/react-router'
import { KeywordSettings } from '@/features/keywords/settings'

export const Route = createFileRoute('/_authenticated/keywords/$keywordId')({
  component: KeywordSettings,
})
