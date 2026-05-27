import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Plus,
  Radio,
  Search as SearchIcon,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageDescription } from '@/components/page-description'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PlatformIcon } from '@/components/platform-icon'
import { DateSeparator } from '@/components/date-separator'
import { useProjectStore } from '@/stores/project-store'
import { useViewerMode } from '@/hooks/use-viewer-mode'
import {
  ChannelService,
  type Following,
} from '@/services/api/channel-service'
import { POSTER_TASK_COMPLETED_EVENT } from '@/services/api/poster-service'
import type { PostData } from '@/features/sheet/types'
import { PostCard } from '@/features/sheet/components/post-card'

function timeAgo(iso: string) {
  const d = new Date(iso)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function FollowingsPage() {
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const { canEdit } = useViewerMode()
  const projectId = currentProject?.id

  // Left panel
  const [followings, setFollowings] = useState<Following[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [search, setSearch] = useState('')

  // Right panel
  const [selected, setSelected] = useState<Following | null>(null)
  const [mobileSelected, setMobileSelected] = useState<Following | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [channelMeta, setChannelMeta] = useState<{
    username: string
    status: string
  } | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(false)

  // Fetch followings list
  const fetchList = useCallback(async () => {
    if (!projectId) return
    setLoadingList(true)
    try {
      setFollowings(await ChannelService.getChannels(projectId))
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to load channels')
    } finally {
      setLoadingList(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Refetch posts when a poster task completes (comment published)
  // Soft refetch: updates data in-place without clearing the list
  useEffect(() => {
    const handler = async () => {
      if (!selected || !projectId) return
      try {
        const res = await ChannelService.getChannelPosts(projectId, selected.id)
        setChannelMeta(res.channel)
        setPosts(res.posts)
      } catch {
        // Silent — non-critical background refresh
      }
    }
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
  }, [selected, projectId])

  // Fetch posts when selection changes
  const fetchPosts = useCallback(
    async (f: Following) => {
      if (!projectId) return
      setLoadingPosts(true)
      setPosts([])
      setChannelMeta(null)
      try {
        const res = await ChannelService.getChannelPosts(projectId, f.id)
        setChannelMeta(res.channel)
        setPosts(res.posts)
      } catch (err: any) {
        toast.error(err.detail || err.message || 'Failed to load posts')
      } finally {
        setLoadingPosts(false)
      }
    },
    [projectId]
  )

  const handleSelect = (f: Following) => {
    setSelected(f)
    setMobileSelected(f)
    fetchPosts(f)
  }

  const filtered = followings.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  // Group posts by date
  const grouped = useMemo(() => {
    const map: Record<string, PostData[]> = {}
    for (const p of posts) {
      const key = format(p.createdAt, 'd MMM, yyyy')
      if (!map[key]) map[key] = []
      map[key].push(p)
    }
    return map
  }, [posts])

  return (
    <>
      <Header>
        <h1 className='text-sm font-semibold'>Tracked Channels</h1>
        <div className='ms-auto flex items-center gap-2'>
          {canEdit && (
            <Button
              size='sm'
              className='h-8 gap-1.5'
              onClick={() => navigate({ to: '/followings/new' })}
            >
              <Plus className='size-3.5' />
              <span className='hidden sm:inline'>Add</span>
            </Button>
          )}
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'>
            <ProfileDropdown />
          </span>
        </div>
      </Header>

      <Main fixed>
        <PageDescription
          id='followings-page'
          summary='Tracked Channels are Telegram channels you monitor. New posts from tracked channels appear in your Mentions feed automatically.'
          details='Follow channels relevant to your brand or industry. You can configure auto-reply and auto-react rules for each channel separately.'
          helpAnchor='followings'
          className='mb-3'
        />
        <section className='flex h-full gap-6'>
          {/* ── Left panel ──────────────────────────────────────────────── */}
          <div className='flex w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80'>
            <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
              <label
                className={cn(
                  'focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden',
                  'flex h-10 w-full items-center space-x-0 rounded-md border border-border ps-2'
                )}
              >
                <SearchIcon size={15} className='me-2 stroke-slate-500' />
                <span className='sr-only'>Search</span>
                <input
                  type='text'
                  className='w-full flex-1 bg-inherit text-sm focus-visible:outline-hidden'
                  placeholder='Search channels...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            <ScrollArea className='-mx-3 h-full overflow-scroll p-3'>
              {loadingList &&
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className='mb-2 flex gap-2 rounded-md px-2 py-2'>
                    <Skeleton className='size-10 rounded-full' />
                    <div className='flex-1 space-y-1.5'>
                      <Skeleton className='h-4 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </div>
                  </div>
                ))}

              {!loadingList &&
                filtered.map((f) => (
                  <Fragment key={f.id}>
                    <button
                      type='button'
                      className={cn(
                        'group flex w-full rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground',
                        selected?.id === f.id && 'sm:bg-muted'
                      )}
                      onClick={() => handleSelect(f)}
                    >
                      <div className='flex items-center gap-2.5'>
                        <div className='flex size-10 shrink-0 items-center justify-center rounded-full border bg-muted/50'>
                          <PlatformIcon platform={f.platform} size='md' />
                        </div>
                        <div className='min-w-0'>
                          <span className='block truncate font-medium'>
                            @{f.username}
                          </span>
                          <span className='block text-xs text-muted-foreground group-hover:text-accent-foreground/70'>
                            Last sync: {timeAgo(f.lastSync)} · {f.postsCount} posts
                          </span>
                        </div>
                      </div>
                    </button>
                    <Separator className='my-1' />
                  </Fragment>
                ))}

              {!loadingList && filtered.length === 0 && (
                <p className='py-8 text-center text-sm text-muted-foreground'>
                  {followings.length === 0
                    ? 'No tracked channels yet'
                    : 'No results'}
                </p>
              )}
            </ScrollArea>
          </div>

          {/* ── Right panel ─────────────────────────────────────────────── */}
          {selected ? (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col border bg-background shadow-xs sm:static sm:z-auto sm:flex sm:rounded-md',
                mobileSelected && 'start-0 flex'
              )}
            >
              {/* Header */}
              <div className='mb-1 flex flex-none items-center justify-between bg-card p-3 shadow-lg sm:rounded-t-md'>
                <div className='flex items-center gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='-ms-2 sm:hidden'
                    onClick={() => setMobileSelected(null)}
                  >
                    <ArrowLeft className='rtl:rotate-180' />
                  </Button>
                  <PlatformIcon platform={selected.platform} size='md' />
                  <div>
                    <span className='text-sm font-medium'>
                      @{channelMeta?.username ?? selected.username}
                    </span>
                    <span className='ml-2 text-xs text-muted-foreground'>
                      {selected.postsCount} posts
                    </span>
                  </div>
                </div>
                {channelMeta && (
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <span
                        className={cn(
                          'inline-block size-2 rounded-full',
                          channelMeta.status === 'active'
                            ? 'bg-green-500'
                            : 'bg-amber-500'
                        )}
                      />
                      {channelMeta.status}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='h-7 gap-1.5 text-xs'
                      onClick={() =>
                        navigate({
                          to: `/followings/${selected!.id}/settings`,
                        })
                      }
                    >
                      <Settings className='size-3.5' />
                      Settings
                    </Button>
                  </div>
                )}
              </div>

              {/* Posts */}
              <div className='flex-1 overflow-y-auto px-4 py-2'>
                {loadingPosts && (
                  <div className='space-y-4 py-4'>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className='space-y-2'>
                        <Skeleton className='h-4 w-48' />
                        <Skeleton className='h-16 w-full' />
                        <div className='flex gap-2'>
                          <Skeleton className='h-6 w-16 rounded-full' />
                          <Skeleton className='h-6 w-16 rounded-full' />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingPosts && posts.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                    <Radio className='mb-3 size-10 opacity-40' />
                    <p className='text-sm'>No posts found</p>
                  </div>
                )}

                {!loadingPosts &&
                  Object.entries(grouped).map(([date, datePosts]) => (
                    <Fragment key={date}>
                      <DateSeparator date={date} />
                      {datePosts.map((post, i) => (
                        <Fragment key={post.id}>
                          <div className='rounded-lg px-1 py-2'>
                            <PostCard post={post} projectId={projectId} />
                          </div>
                          {i < datePosts.length - 1 && <Separator />}
                        </Fragment>
                      ))}
                    </Fragment>
                  ))}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'absolute inset-0 start-full z-50 hidden w-full flex-1 flex-col items-center justify-center rounded-md border bg-card shadow-xs sm:static sm:z-auto sm:flex'
              )}
            >
              <div className='flex flex-col items-center space-y-6'>
                <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                  <Radio className='size-8' />
                </div>
                <div className='space-y-2 text-center'>
                  <h1 className='text-xl font-semibold'>Your tracked channels</h1>
                  <p className='text-sm text-muted-foreground'>
                    Select a channel from the list to view its posts and configure monitoring settings.
                  </p>
                  <p className='text-xs text-muted-foreground/70'>
                    Tip: Click the gear icon to set up auto-reply and auto-react rules for each channel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </Main>
    </>
  )
}
