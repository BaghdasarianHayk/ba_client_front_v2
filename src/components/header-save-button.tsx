import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingsSaveButton } from '@/hooks/use-settings-save'

export function HeaderSaveButton() {
  const { saving, hasHandler, disabled, label, trigger } = useSettingsSaveButton()

  if (!hasHandler) return null

  return (
    <Button
      size='sm'
      className='h-8 gap-1.5'
      disabled={saving || disabled}
      onClick={trigger}
    >
      {saving ? (
        <Loader2 className='size-3.5 animate-spin' />
      ) : (
        <Save className='size-3.5' />
      )}
      <span className='hidden sm:inline'>{label}</span>
    </Button>
  )
}
