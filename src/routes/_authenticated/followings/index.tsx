import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/followings/')({
  beforeLoad: () => {
    throw redirect({ to: '/sheet' })
  },
})
