import { createFileRoute } from '@tanstack/react-router'
import { KeywordAutoComment } from '@/features/keywords/settings/auto-comment'

export const Route = createFileRoute(
  '/_authenticated/keywords/$keywordId/auto-comment'
)({
  component: KeywordAutoComment,
})
