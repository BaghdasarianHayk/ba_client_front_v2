import { createFileRoute } from '@tanstack/react-router'
import { FollowingSettings } from '@/features/followings/settings'

export const Route = createFileRoute('/_authenticated/followings/new')({
  component: FollowingSettings,
})
