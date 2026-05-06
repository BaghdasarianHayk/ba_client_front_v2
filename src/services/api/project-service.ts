import { apiClient } from './client'
import { API_ENDPOINTS } from '@/config/api-config'
import type {
  Project,
  SharedProject,
  UpdateProjectRequest,
  Collaborator,
  GrantAccessRequest,
  UpdateAccessRequest,
} from './types'

interface ProjectsApiResponse {
  owned: Project[]
  shared: SharedProject[]
}

export const ProjectService = {
  async getProjects(): Promise<{ owned: Project[]; shared: SharedProject[] }> {
    const res = await apiClient.get<ProjectsApiResponse>(
      API_ENDPOINTS.PROJECTS.LIST
    )
    return { owned: res.owned ?? [], shared: res.shared ?? [] }
  },

  async createProject(data: {
    brand_name: string
    brand_description: string
    brand_website?: string
    brand_tags?: string[]
  }): Promise<Project> {
    return apiClient.post<Project>(API_ENDPOINTS.PROJECTS.CREATE, data)
  },

  async updateProject(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> {
    const url = API_ENDPOINTS.PROJECTS.UPDATE.replace(':projectId', projectId)
    return apiClient.put<Project>(url, data)
  },

  async deleteProject(projectId: string): Promise<void> {
    const url = API_ENDPOINTS.PROJECTS.DELETE.replace(':projectId', projectId)
    await apiClient.delete(url)
  },

  async exportProject(projectId: string, dateFrom: string, dateTo: string): Promise<Blob> {
    return apiClient.post(
      API_ENDPOINTS.PROJECTS.EXPORT,
      {
        project_ids: [projectId],
        date_from: dateFrom,
        date_to: dateTo,
        currency: 'rub',
        comment_price: 0,
        reaction_price: 0,
      },
      { responseType: 'blob' }
    ) as unknown as Promise<Blob>
  },

  async getCollaborators(projectId: string): Promise<Collaborator[]> {
    const url = API_ENDPOINTS.PROJECTS.COLLABORATORS.replace(
      ':projectId',
      projectId
    )
    return apiClient.get<Collaborator[]>(url)
  },

  async grantAccess(
    projectId: string,
    data: GrantAccessRequest
  ): Promise<Collaborator> {
    const url = API_ENDPOINTS.PROJECTS.COLLABORATORS.replace(
      ':projectId',
      projectId
    )
    return apiClient.post<Collaborator>(url, data)
  },

  async updateCollaborator(
    projectId: string,
    accessId: string,
    data: UpdateAccessRequest
  ): Promise<Collaborator> {
    const url = API_ENDPOINTS.PROJECTS.COLLABORATOR.replace(
      ':projectId',
      projectId
    ).replace(':accessId', accessId)
    return apiClient.put<Collaborator>(url, data)
  },

  async removeCollaborator(
    projectId: string,
    accessId: string
  ): Promise<void> {
    const url = API_ENDPOINTS.PROJECTS.COLLABORATOR.replace(
      ':projectId',
      projectId
    ).replace(':accessId', accessId)
    await apiClient.delete(url)
  },

  async getReplySuggestion(
    projectId: string,
    commentBody: string,
    keywordId?: string,
    commentThread?: { comment: string; is_target: boolean }[]
  ): Promise<{ reply_suggestion: string }> {
    const url = API_ENDPOINTS.PROJECTS.REPLY_SUGGESTION.replace(
      ':projectId',
      projectId
    )
    const body: Record<string, unknown> = { comment_body: commentBody }
    if (keywordId) body.keyword_id = keywordId
    if (commentThread?.length) body.comment_thread = commentThread
    return apiClient.post<{ reply_suggestion: string }>(url, body)
  },
}
