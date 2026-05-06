import { createFileRoute } from '@tanstack/react-router'
import { FollowingMonitoring } from '@/features/followings/settings/monitoring'

export const Route = createFileRoute('/_authenticated/followings/new/monitoring')({
  component: FollowingMonitoring,
})
