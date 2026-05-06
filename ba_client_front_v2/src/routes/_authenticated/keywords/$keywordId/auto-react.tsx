import { createFileRoute } from '@tanstack/react-router'
import { KeywordAutoReact } from '@/features/keywords/settings/auto-react'

export const Route = createFileRoute(
  '/_authenticated/keywords/$keywordId/auto-react'
)({
  component: KeywordAutoReact,
})
