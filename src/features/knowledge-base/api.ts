import axios from 'axios'
import { API_CONFIG } from '@/config/api-config'
import { TokenManager } from '@/services/api/token-manager'
import type { DocType, FileListResponse, UploadResponse, TaskStatus } from './types'

// Knowledge base uses a separate microservice
function authHeaders() {
  const token = TokenManager.getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const baseURL = API_CONFIG.KNOWLEDGE_BASE_URL

export const knowledgeBaseAPI = {
  async getFiles(projectId: string): Promise<FileListResponse> {
    const res = await axios.get<FileListResponse>(`${baseURL}/files/${projectId}`, {
      headers: { ...authHeaders(), Accept: 'application/json' },
    })
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
    const res = await axios.post<UploadResponse>(`${baseURL}/upload`, formData, {
      headers: { ...authHeaders() },
    })
    return res.data
  },

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const res = await axios.get<TaskStatus>(`${baseURL}/status/${taskId}`, {
      headers: { ...authHeaders(), Accept: 'application/json' },
    })
    return res.data
  },

  async deleteFile(projectId: string, fileUuid: string): Promise<void> {
    await axios.delete(`${baseURL}/files/${projectId}/${fileUuid}`, {
      headers: { ...authHeaders(), Accept: 'application/json' },
    })
  },
}
