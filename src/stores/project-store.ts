import { create } from 'zustand'
import { ProjectService } from '@/services/api/project-service'
import type { Project, SharedProject } from '@/services/api/types'

interface ProjectState {
  projects: Project[]
  sharedProjects: SharedProject[]
  currentProject: Project | null
  isLoading: boolean

  fetchProjects: () => Promise<void>
  setCurrentProject: (project: Project) => void
  getProjectRole: (projectId: string) => 'owner' | 'viewer' | 'editor'
  isViewer: (projectId: string) => boolean
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  sharedProjects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    if (get().isLoading) return
    set({ isLoading: true })
    try {
      const { owned, shared } = await ProjectService.getProjects()
      const allProjects = [...owned, ...shared]
      const current = get().currentProject
      set({
        projects: owned,
        sharedProjects: shared,
        currentProject:
          current && allProjects.find((p) => p.id === current.id)
            ? current
            : allProjects[0] ?? null,
      })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  getProjectRole: (projectId) => {
    const { projects, sharedProjects } = get()
    if (projects.find((p) => p.id === projectId)) return 'owner'
    const shared = sharedProjects.find((p) => p.id === projectId)
    if (shared) return shared.role
    return 'viewer'
  },

  isViewer: (projectId) => get().getProjectRole(projectId) === 'viewer',
}))
