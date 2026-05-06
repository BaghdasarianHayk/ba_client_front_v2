import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  CalendarIcon,
  FileSpreadsheet,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useProjectStore } from '@/stores/project-store'
import { ProjectService } from '@/services/api/project-service'
import type { Collaborator } from '@/services/api/types'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function AccessPanel() {
  const navigate = useNavigate()
  const { currentProject, fetchProjects } = useProjectStore()
  const projectId = currentProject?.id

  // ── Collaborators ──────────────────────────────────────────────────────────
  const [collabs, setCollabs] = useState<Collaborator[]>([])
  const [collabsLoading, setCollabsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<Collaborator | null>(null)
  const [removing, setRemoving] = useState(false)

  const loadCollabs = useCallback(async () => {
    if (!projectId) return
    setCollabsLoading(true)
    try {
      setCollabs(await ProjectService.getCollaborators(projectId))
    } catch {
      /* noop */
    } finally {
      setCollabsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadCollabs()
  }, [loadCollabs])

  const handleInvite = async () => {
    if (!projectId || !email.trim()) return
    setInviting(true)
    try {
      const c = await ProjectService.grantAccess(projectId, {
        email: email.trim(),
        role,
      })
      setCollabs((prev) => [...prev, c])
      setEmail('')
      toast.success(`Invited ${c.customer_email} as ${role}`)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (c: Collaborator, newRole: 'viewer' | 'editor') => {
    if (!projectId) return
    try {
      const updated = await ProjectService.updateCollaborator(projectId, c.id, { role: newRole })
      setCollabs((prev) => prev.map((x) => (x.id === c.id ? updated : x)))
      toast.success(`Updated to ${newRole}`)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to update')
    }
  }

  const handleRemove = async () => {
    if (!projectId || !confirmRemove) return
    setRemoving(true)
    try {
      await ProjectService.removeCollaborator(projectId, confirmRemove.id)
      setCollabs((prev) => prev.filter((x) => x.id !== confirmRemove.id))
      toast.success('Collaborator removed')
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to remove')
    } finally {
      setRemoving(false)
      setConfirmRemove(null)
    }
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false)
  const [exportRange, setExportRange] = useState<{ from?: Date; to?: Date }>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 7)
    return { from, to }
  })
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!projectId || !exportRange.from || !exportRange.to) return
    setExporting(true)
    try {
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const blob = await ProjectService.exportProject(projectId, fmt(exportRange.from), fmt(exportRange.to))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentProject?.brand_name ?? 'export'}_${fmt(exportRange.from)}_${fmt(exportRange.to)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
      setExportOpen(false)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!projectId) return
    setDeleting(true)
    try {
      await ProjectService.deleteProject(projectId)
      await fetchProjects()
      toast.success('Project deleted')
      navigate({ to: '/', replace: true })
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (!currentProject) {
    return (
      <p className='text-sm text-muted-foreground'>
        Select a project to manage access.
      </p>
    )
  }

  return (
    <div className='space-y-8'>
      {/* ── Collaborators ─────────────────────────────────────────────────── */}
      <section className='space-y-4'>
        <div>
          <div className='flex items-center gap-2'>
            <Users className='size-4' />
            <h3 className='text-sm font-medium'>Collaborators</h3>
            {!collabsLoading && (
              <Badge variant='secondary' className='text-xs'>
                {collabs.length}
              </Badge>
            )}
          </div>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Invite people to view or edit this project.
          </p>
        </div>

        {/* Invite form */}
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Mail className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='email'
              placeholder='user@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleInvite())}
              disabled={inviting}
              className='pl-9'
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor')}>
            <SelectTrigger className='w-[100px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='viewer'>Viewer</SelectItem>
              <SelectItem value='editor'>Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button size='icon' onClick={handleInvite} disabled={inviting || !email.trim()}>
            {inviting ? <Loader2 className='size-4 animate-spin' /> : <UserPlus className='size-4' />}
          </Button>
        </div>

        {/* List */}
        {collabsLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : collabs.length === 0 ? (
          <p className='py-4 text-center text-sm text-muted-foreground'>
            No collaborators yet
          </p>
        ) : (
          <div className='space-y-2'>
            {collabs.map((c) => (
              <div
                key={c.id}
                className='flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2'
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>
                    {c.customer_name || c.customer_email}
                  </p>
                  {c.customer_name && (
                    <p className='truncate text-xs text-muted-foreground'>
                      {c.customer_email}
                    </p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <Select
                    value={c.role}
                    onValueChange={(v) => handleRoleChange(c, v as 'viewer' | 'editor')}
                  >
                    <SelectTrigger className='h-8 w-[100px] text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='viewer'>Viewer</SelectItem>
                      <SelectItem value='editor'>Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    onClick={() => setConfirmRemove(c)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Export ─────────────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <div>
          <h3 className='text-sm font-medium'>Export Data</h3>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Download all mentions and comments as an Excel file.
          </p>
        </div>
        <Button variant='outline' className='gap-2' onClick={() => setExportOpen(true)}>
          <FileSpreadsheet className='size-4' />
          Export Excel
        </Button>
      </section>

      <Separator />

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <div>
          <h3 className='text-sm font-medium text-destructive'>Danger Zone</h3>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            Permanently delete this project and all its data. This cannot be
            undone.
          </p>
        </div>
        <Button
          variant='destructive'
          className='gap-2'
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className='size-4' />
          Delete Project
        </Button>
      </section>

      {/* ── Remove collaborator dialog ────────────────────────────────────── */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{' '}
              <span className='font-medium'>
                {confirmRemove?.customer_name || confirmRemove?.customer_email}
              </span>{' '}
              from this project? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {removing ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Export dialog ─────────────────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FileSpreadsheet className='size-5' />
              Export Excel
            </DialogTitle>
            <DialogDescription>
              Select a date range for the export.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Label className='mb-2 block text-sm'>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full justify-start font-normal'>
                  <CalendarIcon className='mr-2 size-4' />
                  {exportRange.from
                    ? exportRange.to
                      ? `${format(exportRange.from, 'LLL dd, y')} – ${format(exportRange.to, 'LLL dd, y')}`
                      : format(exportRange.from, 'LLL dd, y')
                    : 'Pick dates'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='range'
                  selected={exportRange as { from: Date; to?: Date } | undefined}
                  onSelect={(r) => setExportRange((r as { from?: Date; to?: Date }) ?? {})}
                  disabled={(d) => d > new Date()}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setExportOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!exportRange.from || !exportRange.to || exporting}>
              {exporting ? <Loader2 className='mr-2 size-4 animate-spin' /> : <FileSpreadsheet className='mr-2 size-4' />}
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ─────────────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteText('') }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-3'>
                <p>
                  This will permanently delete all keywords, mentions, and
                  settings. This cannot be undone.
                </p>
                <p>
                  Type{' '}
                  <span className='font-semibold text-foreground'>
                    "{currentProject.brand_name}"
                  </span>{' '}
                  to confirm:
                </p>
                <Input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder={currentProject.brand_name}
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleting || deleteText !== currentProject.brand_name}
            >
              {deleting ? 'Deleting…' : 'Delete Project'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
