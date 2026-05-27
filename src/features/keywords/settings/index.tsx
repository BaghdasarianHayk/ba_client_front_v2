import { useParams } from '@tanstack/react-router'
import { ArrowLeft, Eye, KeyRound, MessageSquare, Settings2, SmilePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { HeaderSaveButton } from '@/components/header-save-button'
import { ScrollSpyNav, type ScrollSpyItem } from '@/components/scroll-spy-nav'
import { KeywordGeneral } from './general'
import { KeywordMonitoring } from './monitoring'
import { KeywordAutoComment } from './auto-comment'
import { KeywordAutoReact } from './auto-react'

const NAV_ITEMS: ScrollSpyItem[] = [
  { id: 'general', title: 'General', icon: <Settings2 size={18} /> },
  { id: 'monitoring', title: 'Monitoring', icon: <Eye size={18} /> },
  { id: 'auto-comment', title: 'Auto Comment', icon: <MessageSquare size={18} /> },
  { id: 'auto-react', title: 'Auto React', icon: <SmilePlus size={18} /> },
]

export function KeywordSettings() {
  const { keywordId } = useParams({ strict: false }) as { keywordId?: string }
  const isNew = !keywordId || keywordId === 'new'

  return (
    <>
      <Header fixed hideSidebarTrigger>
        <Button
          variant='ghost'
          size='icon'
          className='size-8'
          onClick={() => window.history.back()}
        >
          <ArrowLeft className='size-4' />
        </Button>
        <Separator orientation='vertical' className='h-5' />
        <h1 className='flex items-center gap-1.5 text-sm font-semibold'>
          <KeyRound className='size-4 text-muted-foreground' />
          {isNew ? 'New Keyword' : 'Keyword Settings'}
        </h1>
        <div className='ms-auto flex items-center gap-2'>
          <HeaderSaveButton />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-1 flex-col gap-4 lg:flex-row lg:gap-12'>
          {/* Sidebar nav — sticky on desktop, dropdown on mobile */}
          {!isNew && (
            <aside className='top-20 shrink-0 self-start lg:sticky lg:w-48'>
              <ScrollSpyNav items={NAV_ITEMS} />
            </aside>
          )}

          {/* Content — all sections on one scrollable page */}
          <div className='flex-1 space-y-10'>
            <section id='general' className='scroll-mt-20'>
              <KeywordGeneral />
            </section>

            {!isNew && (
              <>
                <section id='monitoring' className='scroll-mt-20'>
                  <KeywordMonitoring />
                </section>
                <section id='auto-comment' className='scroll-mt-20'>
                  <KeywordAutoComment />
                </section>
                <section id='auto-react' className='scroll-mt-20'>
                  <KeywordAutoReact />
                </section>
              </>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
