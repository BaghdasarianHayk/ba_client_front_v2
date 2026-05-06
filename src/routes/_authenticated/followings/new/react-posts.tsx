import { createFileRoute } from '@tanstack/react-router'
import { FollowingReactPosts } from '@/features/followings/settings/react-posts'

export const Route = createFileRoute('/_authenticated/followings/new/react-posts')({
  component: FollowingReactPosts,
})
