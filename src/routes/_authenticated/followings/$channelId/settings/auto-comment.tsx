import { createFileRoute } from '@tanstack/react-router'
import { FollowingAutoComment } from '@/features/followings/settings/auto-comment'

export const Route = createFileRoute('/_authenticated/followings/$channelId/settings/auto-comment')({
  component: FollowingAutoComment,
})
