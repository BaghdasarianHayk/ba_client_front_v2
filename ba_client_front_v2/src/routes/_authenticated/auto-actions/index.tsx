import { createFileRoute } from '@tanstack/react-router'
import { AutoActionsPage } from '@/features/auto-actions'

export const Route = createFileRoute('/_authenticated/auto-actions/')({
  component: AutoActionsPage,
})
