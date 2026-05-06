import {
  Angry,
  Blend,
  BotMessageSquare,
  Megaphone,
  Meh,
  MessageCircleOff,
  MessageCircleQuestion,
  MessageCircleReply,
  MessageSquare,
  MessageSquareOff,
  Search,
  Smile,
  X,
} from 'lucide-react'
import { PlatformIcon, type PlatformId } from '@/components/platform-icon'
import type { MentionFilters, MentionStats } from '@/services/api/mention-service'

function Badge({
  onRemove,
  children,
}: {
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs [&_svg]:!size-3.5 [&_img]:!size-3.5'>
      <button
        type='button'
        onClick={onRemove}
        className='rounded-full p-0.5 hover:bg-muted-foreground/20'
      >
        <X className='!size-3' />
      </button>
      {children}
    </span>
  )
}

const SENTIMENT_ICONS: Record<string, React.ElementType> = {
  positive: Smile,
  neutral: Meh,
  negative: Angry,
  question: MessageCircleQuestion,
}

export function FilterBadges({
  filters,
  stats,
  onUpdate,
}: {
  filters: MentionFilters
  stats: MentionStats | null
  onUpdate: (partial: Partial<MentionFilters>) => void
}) {
  const platforms = filters.platform
    ? (filters.platform.split(',').map((p) => (p === 'twitter' ? 'x' : p)) as PlatformId[])
    : []
  const sentiments = filters.sentiment
    ? filters.sentiment.toLowerCase().split(',')
    : []
  const replied = filters.replied?.split(',') || []

  return (
    <div className='flex flex-wrap gap-1'>
      {/* Search */}
      {filters.search && (
        <Badge onRemove={() => onUpdate({ search: undefined })}>
          <Search />
          <span className='max-w-20 truncate'>{filters.search}</span>
        </Badge>
      )}

      {/* Platforms */}
      {platforms.map((p) => (
        <Badge
          key={p}
          onRemove={() => {
            const next = platforms.filter((x) => x !== p)
            const api = next.map((x) => (x === 'x' ? 'twitter' : x))
            onUpdate({ platform: api.length ? api.join(',') : undefined })
          }}
        >
          <PlatformIcon platform={p} size='sm' />
        </Badge>
      ))}

      {/* Sentiments */}
      {sentiments.map((s) => {
        const Icon = SENTIMENT_ICONS[s] || Meh
        return (
          <Badge
            key={s}
            onRemove={() => {
              const next = sentiments.filter((x) => x !== s)
              onUpdate({
                sentiment: next.length
                  ? next.map((x) => x.toUpperCase()).join(',')
                  : undefined,
              })
            }}
          >
            <Icon />
          </Badge>
        )
      })}

      {/* Replied */}
      {replied.includes('not') &&
        !(replied.includes('auto') && replied.includes('manual')) && (
          <Badge
            onRemove={() => {
              const next = replied.filter((r) => r !== 'not')
              onUpdate({
                replied: next.length && next.length < 3 ? next.join(',') : undefined,
              })
            }}
          >
            <MessageCircleOff />
            Not Replied
          </Badge>
        )}
      {replied.includes('auto') &&
        !(replied.includes('not') && replied.includes('manual')) && (
          <Badge
            onRemove={() => {
              const next = replied.filter((r) => r !== 'auto')
              onUpdate({
                replied: next.length && next.length < 3 ? next.join(',') : undefined,
              })
            }}
          >
            <BotMessageSquare />
            Auto
          </Badge>
        )}
      {replied.includes('manual') &&
        !(replied.includes('not') && replied.includes('auto')) && (
          <Badge
            onRemove={() => {
              const next = replied.filter((r) => r !== 'manual')
              onUpdate({
                replied: next.length && next.length < 3 ? next.join(',') : undefined,
              })
            }}
          >
            <MessageCircleReply />
            Manual
          </Badge>
        )}

      {/* Relevance */}
      {(filters.relevance_from !== undefined && filters.relevance_from > 0) ||
      (filters.relevance_to !== undefined && filters.relevance_to < 100) ? (
        <Badge
          onRemove={() =>
            onUpdate({ relevance_from: undefined, relevance_to: undefined })
          }
        >
          <Blend />
          {filters.relevance_from ?? 0}–{filters.relevance_to ?? 100}%
        </Badge>
      ) : null}

      {/* Score */}
      {(filters.unified_score_from !== undefined &&
        filters.unified_score_from > (stats?.min_unified_score ?? 0)) ||
      (filters.unified_score_to !== undefined &&
        filters.unified_score_to < (stats?.max_unified_score ?? 1000)) ? (
        <Badge
          onRemove={() =>
            onUpdate({
              unified_score_from: undefined,
              unified_score_to: undefined,
            })
          }
        >
          <Megaphone />
          {filters.unified_score_from ?? 0}–{filters.unified_score_to ?? '∞'}
        </Badge>
      ) : null}

      {/* Comments */}
      {filters.has_comments === true && (
        <Badge onRemove={() => onUpdate({ has_comments: undefined })}>
          <MessageSquare />
          With Comments
        </Badge>
      )}
      {filters.has_comments === false && (
        <Badge onRemove={() => onUpdate({ has_comments: undefined })}>
          <MessageSquareOff />
          No Comments
        </Badge>
      )}

      {/* Commentable */}
      {filters.is_commentable === true && (
        <Badge onRemove={() => onUpdate({ is_commentable: undefined })}>
          <MessageSquare />
          Commentable
        </Badge>
      )}
      {filters.is_commentable === false && (
        <Badge onRemove={() => onUpdate({ is_commentable: undefined })}>
          <MessageSquareOff />
          Not Commentable
        </Badge>
      )}
    </div>
  )
}
