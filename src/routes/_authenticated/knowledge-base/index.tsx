import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeBasePage } from '@/features/knowledge-base'

export const Route = createFileRoute('/_authenticated/knowledge-base/')({
  component: KnowledgeBasePage,
})
