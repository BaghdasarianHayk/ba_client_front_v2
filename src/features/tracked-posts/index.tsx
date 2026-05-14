import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Rss,
  Search as SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { EmptyState } from '@/components/empty-state'
import { PageDescription } from '@/components/page-description'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { DateSeparator } from '@/components/date-separator'
import { useProjectStore } from '@/stores/project-store'
import { useViewerMode } from '@/hooks/use-viewer-mode'
import {
  PostService,
  trackedPostToPostData,
  type TrackedPost,
} from '@/services/api/post-service'
import { POSTER_TASK_COMPLETED_EVENT } from '@/services/api/poster-service'
import type { PostData, CommentData } from '@/features/sheet/types'
import { PostCard } from '@/features/sheet/components/post-card'

export function TrackedPostsPage() {
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const { canEdit } = useViewerMode()
  const projectId = currentProject?.id

  const [trackedPosts, setTrackedPosts] = useState<TrackedPost[]>([])
  const [postDataMap, setPostDataMap] = useState<Map<string, PostData>>(
    new Map()
  )
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchPosts = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const { posts } = await PostService.getPosts(projectId)
      setTrackedPosts(posts)

      // Convert to PostData for rendering
      const map = new Map<string, PostData>()
      for (const tp of posts) {
        map.set(tp.id, trackedPostToPostData(tp))
      }
      setPostDataMap(map)
    } catch (err: any) {
      toast.error(err.detail || err.message || 'Failed to load tracked posts')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Refetch when a poster task completes (comment/reply published)
  // Soft refetch: updates data in-place without showing loading skeleton
  // Also reloads comments for posts that already had them expanded
  useEffect(() => {
    const handler = async () => {
      if (!projectId) return
      try {
        const { posts } = await PostService.getPosts(projectId)
        setTrackedPosts(posts)

        // Snapshot which posts currently have comments loaded
        setPostDataMap((prev) => {
          const postsWithComments = Array.from(prev.entries())
            .filter(([, pd]) => pd.comments.length > 0)
            .map(([id]) => id)

          // Update base post data
          const next = new Map<string, PostData>()
          for (const tp of posts) {
            next.set(tp.id, trackedPostToPostData(tp))
          }

          // Reload comments for expanded posts (async, updates map later)
          for (const postId of postsWithComments) {
            PostService.getPostFull(projectId, postId)
              .then(({ comments }) => {
                const stats = countSentiments(comments)
                setPostDataMap((cur) => {
                  const updated = new Map(cur)
                  const existing = updated.get(postId)
                  if (existing) {
                    updated.set(postId, {
                      ...existing,
                      comments,
                      commentCount: stats.total,
                      commentSentiments: stats,
                    })
                  }
                  return updated
                })
              })
              .catch(() => { /* skip */ })
          }

          return next
        })
      } catch {
        // Silent — non-critical background refresh
      }
    }
    window.addEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
    return () => window.removeEventListener(POSTER_TASK_COMPLETED_EVENT, handler)
  }, [projectId])

  // Load comments for a specific post
  const loadComments = useCallback(
    async (postId: string) => {
      if (!projectId) return
      try {
        const { comments } = await PostService.getPostFull(projectId, postId)
        setPostDataMap((prev) => {
          const next = new Map(prev)
          const existing = next.get(postId)
          if (existing) {
            const stats = countSentiments(comments)
            next.set(postId, {
              ...existing,
              comments,
              commentCount: stats.total,
              commentSentiments: stats,
            })
          }
          return next
        })
      } catch (err: any) {
        toast.error(err.detail || err.message || 'Failed to load comments')
      }
    },
    [projectId]
  )

  const filtered = trackedPosts.filter(
    (tp) =>
      tp.url.toLowerCase().includes(search.toLowerCase()) ||
      tp.author.toLowerCase().includes(search.toLowerCase()) ||
      tp.content.toLowerCase().includes(search.toLowerCase())
  )

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, TrackedPost[]> = {}
    for (const tp of filtered) {
      const key = format(new Date(tp.createdAt), 'd MMM, yyyy')
      if (!map[key]) map[key] = []
      map[key].push(tp)
    }
    return map
  }, [filtered])

  return (
    <>
      <Header fixed>
        <Rss className='size-4 text-muted-foreground' />
        <h1 className='text-sm font-semibold whitespace-nowrap'>
          {loading ? (
            <Skeleton className='inline-block h-4 w-24' />
          ) : (
            `${trackedPosts.length} Tracked Posts`
          )}
        </h1>

        <div className='ms-auto flex items-center gap-1.5 sm:gap-2'>
          <div className='relative hidden sm:block'>
            <SearchIcon className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search posts…'
              className='h-8 w-40 pl-8 lg:w-[220px]'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canEdit && (
            <Button
              size='sm'
              className='h-8 gap-1.5'
              onClick={() => navigate({ to: '/tracked-posts/new' })}
            >
              <Plus className='size-3.5' />
              <span className='hidden sm:inline'>Track Post</span>
            </Button>
          )}
          <ThemeSwitch />
          <span className='hidden sm:inline-flex'>
            <ProfileDropdown />
          </span>
        </div>
      </Header>

      <Main>
        <PageDescription
          id='tracked-posts-page'
          summary='Tracked Posts let you monitor comments on specific posts in real-time. Set up auto-reply and auto-react rules for each post individually.'
          details='Unlike keywords (which find new posts), tracked posts focus on monitoring comments on posts you already know about. Useful for your own posts or viral discussions.'
          helpAnchor='tracked-posts'
          className='mb-4'
        />

        {/* Loading */}
        {loading && (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2 rounded-lg px-2 py-3'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='size-5 rounded-full' />
                  <Skeleton className='h-4 w-48' />
                </div>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-16 w-full' />
                <div className='flex gap-2'>
                  <Skeleton className='h-6 w-16 rounded-full' />
                  <Skeleton className='h-6 w-16 rounded-full' />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && trackedPosts.length === 0 && (
          <EmptyState
            icon={Rss}
            title='No tracked posts yet'
            description='Track specific posts to monitor their comments in real-time and set up automated replies and reactions.'
            tips={[
              'Paste any Telegram post URL to start tracking',
              'Or click "Track Post" on any mention in the feed',
              'Configure auto-reply rules per tracked post',
            ]}
            action={canEdit ? { label: 'Track Post', onClick: () => navigate({ to: '/tracked-posts/new' }), icon: Plus } : undefined}
          />
        )}

        {/* Post cards grouped by date */}
        {!loading &&
          Object.entries(grouped).map(([date, posts]) => (
            <Fragment key={date}>
              <DateSeparator date={date} />
              {posts.map((tp, i) => {
                const postData = postDataMap.get(tp.id)
                if (!postData) return null
                return (
                  <Fragment key={tp.id}>
                    <div className='rounded-lg px-2 py-3'>
                      <PostCard
                        post={postData}
                        trackedPostId={tp.id}
                        onLoadComments={() => loadComments(tp.id)}
                        projectId={projectId}
                      />
                    </div>
                    {i < posts.length - 1 && <Separator />}
                  </Fragment>
                )
              })}
            </Fragment>
          ))}
      </Main>
    </>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countSentiments(comments: CommentData[]) {
  const s = { total: 0, positive: 0, neutral: 0, negative: 0, question: 0 }
  function walk(list: CommentData[]) {
    for (const c of list) {
      s.total++
      if (c.sentiment) s[c.sentiment]++
      walk(c.replies)
    }
  }
  walk(comments)
  return s
}
