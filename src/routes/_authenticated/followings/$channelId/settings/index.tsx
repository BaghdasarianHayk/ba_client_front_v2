import { createFileRoute } from '@tanstack/react-router'
import { FollowingGeneral } from '@/features/followings/settings/general'

export const Route = createFileRoute('/_authenticated/followings/$channelId/settings/')({
  component: FollowingGeneral,
})
