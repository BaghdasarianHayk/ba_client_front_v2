import { useState, useEffect, useCallback, useRef } from 'react'
import type { DragEvent } from 'react'
import {
  AlertCircle,
  Building2,
  Clock,
  FileIcon,
  FileText,
  Globe,
  MoreHorizontal,
  Swords,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageDescription } from '@/components/page-description'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { useProjectStore } from '@/stores/project-store'
import { knowledgeBaseAPI } from './api'
import type { DocType, FileItem, TaskStatus } from './types'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'xlsx']
const ACCEPT = '.pdf,.docx,.txt,.xlsx'
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_FILES = 10
const POLL_MS = 2000

function fmtSize(mb: number) {
  return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`
}

function fmtDate(iso: string) {
  const d = iso.includes('+') || iso.includes('Z') ? new Date(iso) : new Date(iso + 'Z')
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileText className='size-4 text-red-500' />
  if (ext === 'docx' || ext === 'xlsx') return <FileText className='size-4 text-lime-500' />
  return <FileIcon className='size-4 text-muted-foreground' />
}

const DOC_TYPE_BADGE: Record<DocType, { icon: React.ElementType; label: string; cls: string }> = {
  brand: { icon: Building2, label: 'Brand', cls: 'text-emerald-600 border-emerald-300' },
  competitor: { icon: Swords, label: 'Competitor', cls: 'text-orange-600 border-orange-300' },
  general: { icon: Globe, label: 'General', cls: 'text-blue-600 border-blue-300' },
}

export function KnowledgeBasePage() {
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id

  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus | null>>({})

  // Upload modal
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [docType, setDocType] = useState<DocType>('brand')
  const [competitorName, setCompetitorName] = useState('')

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<number | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await knowledgeBaseAPI.getFiles(projectId)
      setFiles(res.files.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()))
    } catch {
      toast.error('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  // ── Polling for processing files ─────────────────────────────────────────
  const pollStatuses = useCallback(async () => {
    const processing = files.filter((f) => f.status === 'uploaded')
    if (processing.length === 0) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    const results = await Promise.all(
      processing.map(async (f) => {
        try { return { [f.task_id]: await knowledgeBaseAPI.getTaskStatus(f.task_id) } }
        catch { return { [f.task_id]: null } }
      })
    )
    const map = Object.assign({}, ...results) as Record<string, TaskStatus | null>
    setTaskStatuses((prev) => ({ ...prev, ...map }))
    const anyDone = Object.values(map).some((s) => s && (s.status === 'completed' || s.status === 'failed'))
    if (anyDone) fetchFiles()
  }, [files, fetchFiles])

  useEffect(() => {
    const processing = files.filter((f) => f.status === 'uploaded')
    if (processing.length > 0) {
      pollStatuses()
      if (!pollRef.current) pollRef.current = window.setInterval(pollStatuses, POLL_MS)
    } else if (pollRef.current) {
      clearInterval(pollRef.current); pollRef.current = null
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [files, pollStatuses])

  // ── Upload flow ──────────────────────────────────────────────────────────
  const stageFile = (file: File) => {
    if (!projectId) return
    if (files.length >= MAX_FILES) { toast.warning(`Max ${MAX_FILES} files`); return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) { toast.warning('Invalid file type'); return }
    if (file.size > MAX_SIZE) { toast.warning('File too large (max 50 MB)'); return }
    setPendingFile(file)
    setDocType('brand')
    setCompetitorName('')
    setUploadOpen(true)
  }

  const confirmUpload = async () => {
    if (!pendingFile || !projectId) return
    if (docType === 'competitor' && !competitorName.trim()) { toast.warning('Enter competitor name'); return }
    setUploading(true)
    setUploadOpen(false)
    try {
      await knowledgeBaseAPI.uploadFile(projectId, pendingFile, docType, docType === 'competitor' ? competitorName.trim() : undefined)
      toast.success('File uploaded')
      await fetchFiles()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.detail || err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      setPendingFile(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!projectId || !deleteTarget) return
    try {
      await knowledgeBaseAPI.deleteFile(projectId, deleteTarget.id)
      toast.success('File deleted')
      await fetchFiles()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteTarget(null) }
  }

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) stageFile(f) }

  function statusCell(file: FileItem) {
    if (file.status === 'completed') return <span className='text-sm text-lime-600'>Completed</span>
    if (file.status === 'failed') return <Badge variant='destructive'><AlertCircle className='mr-1 size-3' />Failed</Badge>
    const progress = taskStatuses[file.task_id]?.progress || 0
    return (
      <div className='min-w-[140px] space-y-1.5'>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Clock className='size-3 animate-spin' />
          <span>Processing {progress}%</span>
        </div>
        <Progress value={progress} className='h-1.5' />
      </div>
    )
  }

  return (
    <>
      <Header fixed>
        <h1 className='text-sm font-semibold'>Knowledge Base</h1>
        <span className='text-xs text-muted-foreground'>
          {loading ? '' : `${files.length}/${MAX_FILES} files`}
        </span>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'><ProfileDropdown /></span>
        </div>
      </Header>

      <Main>
        <PageDescription
          id='knowledge-base-page'
          summary='The Knowledge Base stores documents that the AI uses to generate relevant replies. Upload FAQs, product guides, or brand guidelines to improve response quality.'
          details='Uploaded files are analyzed and indexed. The AI references this knowledge when writing auto-replies, ensuring responses are accurate and on-brand. Assign files to a keyword type (Brand, Competitor, General) to control which context is used.'
          helpAnchor='knowledge-base'
          className='mb-4'
        />

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${uploading || files.length >= MAX_FILES ? 'cursor-not-allowed opacity-50' : ''} ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
        >
          <input ref={inputRef} type='file' className='hidden' accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; if (f) stageFile(f) }} disabled={uploading || files.length >= MAX_FILES} />
          <Upload className='mx-auto mb-3 size-10 text-muted-foreground' />
          <p className='text-sm'>
            {uploading ? <span className='font-medium'>Uploading…</span> : files.length >= MAX_FILES ? 'File limit reached' : <><span className='font-medium'>Click to upload</span> or drag and drop</>}
          </p>
          <p className='text-xs text-muted-foreground'>PDF, TXT, DOCX, XLSX — Max 50 MB</p>
        </div>

        <div className='mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground'>
          <span>Upload FAQ, manuals or guides</span>
          <span className='text-border'>•</span>
          <span>Auto-analyzed after upload</span>
          <span className='text-border'>•</span>
          <span>Ready for AI responses when complete</span>
        </div>

        {/* Table */}
        <div className='mt-6'>
          {loading ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex items-center justify-between rounded-lg border p-4'>
                  <div className='flex flex-1 items-center gap-4'>
                    <Skeleton className='size-8 rounded' />
                    <div className='flex-1 space-y-2'><Skeleton className='h-4 w-40' /><Skeleton className='h-3 w-32' /></div>
                  </div>
                  <Skeleton className='h-6 w-20' />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className='rounded-lg border py-12 text-center'>
              <FileIcon className='mx-auto mb-4 size-12 text-muted-foreground' />
              <h3 className='text-lg font-semibold'>No files yet</h3>
              <p className='mt-1 text-sm text-muted-foreground'>Upload your first file to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className='w-10' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => {
                  const badge = DOC_TYPE_BADGE[f.doc_type] || DOC_TYPE_BADGE.brand
                  const Icon = badge.icon
                  return (
                    <TableRow key={f.file_uuid}>
                      <TableCell><div className='flex items-center gap-2'>{fileIcon(f.filename)}<span className='font-medium'>{f.filename}</span></div></TableCell>
                      <TableCell>
                        <Badge variant='outline' className={badge.cls}>
                          <Icon className='mr-1 size-3' />
                          {f.doc_type === 'competitor' ? (f.competitor_name || 'Competitor') : badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>{fmtSize(f.size_mb)}</TableCell>
                      <TableCell>{statusCell(f)}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{fmtDate(f.upload_date)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='size-8'><MoreHorizontal className='size-4' /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem className='text-destructive' onClick={() => setDeleteTarget({ id: f.file_uuid, name: f.filename })}>
                              <Trash2 className='size-4' />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Main>

      {/* Upload settings modal */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!o) setPendingFile(null); setUploadOpen(o) }}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>{pendingFile?.name} — choose the document type.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label>Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='brand'><div className='flex items-center gap-2'><Building2 className='size-3.5' />Brand</div></SelectItem>
                  <SelectItem value='competitor'><div className='flex items-center gap-2'><Swords className='size-3.5' />Competitor</div></SelectItem>
                  <SelectItem value='general'><div className='flex items-center gap-2'><Globe className='size-3.5' />General</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            {docType === 'competitor' && (
              <div className='space-y-1.5'>
                <Label>Competitor name</Label>
                <Input placeholder='e.g. Acme Corp' value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => { setUploadOpen(false); setPendingFile(null) }}>Cancel</Button>
            <Button onClick={confirmUpload} disabled={docType === 'competitor' && !competitorName.trim()}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTarget?.name}"? This removes all processed data from this file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
