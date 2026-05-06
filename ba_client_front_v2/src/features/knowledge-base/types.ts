export type DocType = 'brand' | 'competitor' | 'general'

export interface FileItem {
  file_uuid: string
  filename: string
  size_chars: number
  upload_date: string
  task_id: string
  project_id: string
  status: 'uploaded' | 'completed' | 'failed'
  size_mb: number
  customer_id: string
  last_updated: string
  doc_type: DocType
  competitor_name?: string
}

export interface FileListResponse {
  project_id: string
  files: FileItem[]
  total_files: number
}

export interface UploadResponse {
  task_id: string
  status: string
  message: string
}

export interface TaskStatus {
  task_id: string
  status: 'uploaded' | 'completed' | 'failed'
  progress: number
  message: string
  processed_faqs?: number
  stored_in_qdrant?: number
  errors: string[]
  file_uuid: string
  cost_summary?: string
}
