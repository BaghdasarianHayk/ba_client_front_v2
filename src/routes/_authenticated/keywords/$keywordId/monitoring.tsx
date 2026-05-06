import { createFileRoute } from '@tanstack/react-router'
import { KeywordMonitoring } from '@/features/keywords/settings/monitoring'

export const Route = createFileRoute(
  '/_authenticated/keywords/$keywordId/monitoring'
)({
  component: KeywordMonitoring,
})
