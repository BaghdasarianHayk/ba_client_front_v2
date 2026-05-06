import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/projects'

export const Route = createFileRoute('/_authenticated/')({
  component: () => (
    // Full-screen overlay — covers the sidebar layout
    <div className='fixed inset-0 z-50 bg-background'>
      <ProjectsPage />
    </div>
  ),
})
