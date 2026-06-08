import { createFileRoute } from '@tanstack/react-router'
import { CreateProjectPage } from '@/features/projects/create'

export const Route = createFileRoute('/_authenticated/projects/new')({
  component: () => (
    // Full-screen overlay — covers the sidebar layout
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
      <CreateProjectPage />
    </div>
  ),
})
