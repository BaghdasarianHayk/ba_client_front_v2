import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tracked-posts/')({
  beforeLoad: () => {
    throw redirect({ to: '/sheet' })
  },
})
