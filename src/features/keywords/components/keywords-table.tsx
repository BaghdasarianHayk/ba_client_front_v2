import {
  ArrowRight,
  Blend,
  Bot,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Smile,
  Meh,
  Angry,
  MessageCircleQuestion,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PlatformIcon } from '@/components/platform-icon'
import type { Keyword } from '@/services/api/keyword-service'

const sentimentIcons = {
  positive: { icon: Smile, color: 'text-green-600 dark:text-green-400' },
  neutral: { icon: Meh, color: 'text-amber-600 dark:text-amber-400' },
  negative: { icon: Angry, color: 'text-red-600 dark:text-red-400' },
  question: { icon: MessageCircleQuestion, color: 'text-purple-600 dark:text-purple-400' },
} as const

type Props = {
  keywords: Keyword[]
  onEdit: (kw: Keyword) => void
  onDelete: (kw: Keyword) => void
  onToggleActive: (kw: Keyword) => void
}

export function KeywordsTable({
  keywords,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow className='text-xs'>
            <TableHead className='w-[240px]'>Keyword</TableHead>
            <TableHead className='hidden sm:table-cell'>Platforms</TableHead>
            <TableHead className='w-[80px] text-center'>Active</TableHead>
            <TableHead className='hidden md:table-cell text-center'>
              Auto Reply
            </TableHead>
            <TableHead className='hidden md:table-cell text-center'>
              Auto React
            </TableHead>
            <TableHead className='hidden lg:table-cell text-right'>
              Mentions
            </TableHead>
            <TableHead className='w-[40px]' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((kw) => (
            <TableRow
              key={kw.id}
              className='cursor-pointer'
              onClick={() => onEdit(kw)}
            >
              {/* Keyword */}
              <TableCell className='py-2'>
                <div>
                  <span className='text-sm font-medium'>{kw.keyword}</span>
                  {kw.excludedKeywords.length > 0 && (
                    <p className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                      −{kw.excludedKeywords.join(', ')}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* Platforms */}
              <TableCell className='hidden py-2 sm:table-cell'>
                <div className='flex gap-0.5'>
                  {kw.platforms.map((p) => (
                    <PlatformIcon key={p} platform={p} size='sm' />
                  ))}
                </div>
              </TableCell>

              {/* Active switch */}
              <TableCell
                className='py-2 text-center'
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={kw.isActive}
                  onCheckedChange={() => onToggleActive(kw)}
                  className='scale-90'
                />
              </TableCell>

              {/* Auto Reply */}
              <TableCell className='hidden py-2 md:table-cell'>
                {kw.autoComment.enabled ? (
                  <div className='flex flex-wrap items-center justify-center gap-1'>
                    <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                      <Blend className='!size-3.5' />
                      ≥{kw.autoComment.threshold}%
                    </Badge>
                    {kw.autoComment.scoreThreshold > 0 && (
                      <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                        <Megaphone className='!size-3.5' />
                        ≥{kw.autoComment.scoreThreshold}
                      </Badge>
                    )}
                    {(kw.autoComment.countMin > 0 || kw.autoComment.countMax < 10) && (
                      <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                        <Bot className='!size-3.5' />
                        {kw.autoComment.countMin}–{kw.autoComment.countMax}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className='block text-center text-xs text-muted-foreground'>off</span>
                )}
              </TableCell>

              {/* Auto React */}
              <TableCell className='hidden py-2 md:table-cell'>
                {kw.autoReact.enabled ? (
                  <div className='flex flex-wrap items-center justify-center gap-1'>
                    <Badge variant='outline' className='gap-1 rounded-full px-1.5 py-0.5 text-[11px]'>
                      <Blend className='!size-3.5' />
                      ≥{kw.autoReact.threshold}%
                    </Badge>
                    {(Object.entries(kw.autoReact.sentiments) as [keyof typeof sentimentIcons, string | null][])
                      .filter(([, r]) => r !== null)
                      .map(([s, r]) => {
                        const { icon: SIcon, color } = sentimentIcons[s]
                        return (
                          <Badge
                            key={s}
                            variant='outline'
                            className='gap-0.5 rounded-full py-0.5 pl-1 pr-1.5 text-[11px]'
                          >
                            <SIcon className={`!size-3.5 ${color}`} />
                            <ArrowRight className='!size-3 text-muted-foreground' />
                            {r === 'POSITIVE' ? (
                              <ThumbsUp className='!size-3.5 text-green-600 dark:text-green-400' />
                            ) : (
                              <ThumbsDown className='!size-3.5 text-red-600 dark:text-red-400' />
                            )}
                          </Badge>
                        )
                      })}
                  </div>
                ) : (
                  <span className='block text-center text-xs text-muted-foreground'>off</span>
                )}
              </TableCell>

              {/* Mentions */}
              <TableCell className='hidden py-2 text-right text-xs text-muted-foreground lg:table-cell'>
                {kw.mentionsCount}
              </TableCell>

              {/* Actions */}
              <TableCell
                className='py-2'
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='size-7'>
                      <MoreHorizontal className='size-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => onEdit(kw)}>
                      <Pencil className='size-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={() => onDelete(kw)}
                    >
                      <Trash2 className='size-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
