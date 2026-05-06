import { useProjectStore } from '@/stores/project-store'

/**
 * Returns viewer-mode state for the current project.
 * - `isViewer`: true if user has read-only access
 * - `role`: 'owner' | 'editor' | 'viewer'
 * - `canEdit`: true if user can perform mutations
 */
export function useViewerMode() {
  const currentProject = useProjectStore((s) => s.currentProject)
  const getProjectRole = useProjectStore((s) => s.getProjectRole)

  const projectId = currentProject?.id
  const role = projectId ? getProjectRole(projectId) : 'viewer'
  const isViewer = role === 'viewer'
  const canEdit = !isViewer

  return { isViewer, canEdit, role, projectId }
}
