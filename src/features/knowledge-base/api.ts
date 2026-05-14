import { API_CONFIG } from '@/config/api-config'
import { createApiClient } from '@/services/api/create-api-client'
import type { DocType, FileListResponse, UploadResponse, TaskStatus } from './types'

// Knowledge base uses a separate microservice — with token refresh
const kbClient = createApiClient({
  baseURL: API_CONFIG.KNOWLEDGE_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
})

export const knowledgeBaseAPI = {
  async getFiles(projectId: string): Promise<FileListResponse> {
    const res = await kbClient.get<FileListResponse>(`/files/${projectId}`)
    return res.data
  },

  async uploadFile(
    projectId: string,
    file: File,
    docType: DocType = 'brand',
    competitorName?: string
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', projectId)
    formData.append('doc_type', docType)
    if (docType === 'competitor' && competitorName) {
      formData.append('competitor_name', competitorName)
    }
    const res = await kbClient.post<UploadResponse>('/upload', formData)
    return res.data
  },

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const res = await kbClient.get<TaskStatus>(`/status/${taskId}`)
    return res.data
  },

  async deleteFile(projectId: string, fileUuid: string): Promise<void> {
    await kbClient.delete(`/files/${projectId}/${fileUuid}`)
  },
}
