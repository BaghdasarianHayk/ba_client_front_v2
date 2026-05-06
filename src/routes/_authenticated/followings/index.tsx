import { createFileRoute } from '@tanstack/react-router'
import { FollowingsPage } from '@/features/followings'

export const Route = createFileRoute('/_authenticated/followings/')({
  component: FollowingsPage,
})
