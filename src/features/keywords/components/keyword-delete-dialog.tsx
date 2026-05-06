import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { KeywordService, type Keyword } from '@/services/api/keyword-service'

type Props = {
  keyword: Keyword | null
  onClose: () => void
  onSuccess: () => void
}

export function KeywordDeleteDialog({ keyword, onClose, onSuccess }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (soft: boolean) => {
    if (!keyword) return
    setDeleting(true)
    try {
      await KeywordService.deleteKeyword(keyword.id, soft)
      toast.success(
        soft ? 'Keyword deleted (mentions kept)' : 'Keyword and mentions deleted'
      )
      onClose()
      onSuccess()
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={!!keyword} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{keyword?.keyword}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Choose whether to keep existing mentions or delete everything.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='flex-col gap-2 sm:flex-row'>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant='secondary'
            onClick={() => handleDelete(true)}
            disabled={deleting}
          >
            {deleting && <Loader2 className='size-4 animate-spin' />}
            Keep Mentions
          </Button>
          <Button
            variant='destructive'
            onClick={() => handleDelete(false)}
            disabled={deleting}
          >
            {deleting && <Loader2 className='size-4 animate-spin' />}
            Delete All
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
