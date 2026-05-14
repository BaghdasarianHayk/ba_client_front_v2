import { useState } from 'react'
import {
  AtSign,
  BarChart3,
  BookOpen,
  BotMessageSquare,
  ChevronDown,
  KeyRound,
  Radio,
  Rss,
  Search,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

// ─── Help content data ───────────────────────────────────────────────────────

interface HelpSection {
  id: string
  title: string
  icon: React.ElementType
  description: string
  items: { question: string; answer: string }[]
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'mentions',
    title: 'Mentions',
    icon: AtSign,
    description: 'Your main feed of social media posts that match your keywords or followed channels.',
    items: [
      {
        question: 'What is a mention?',
        answer: 'A mention is a social media post that matches one of your keywords or comes from a channel you follow. The system scans platforms like Reddit, Telegram, X, YouTube, Instagram, Facebook, TikTok, and the web.',
      },
      {
        question: 'What does the relevance score mean?',
        answer: 'Relevance (0-100%) is an AI-calculated score showing how closely a post relates to your brand or keyword context. A post about "Apple computers" would have high relevance for a tech brand keyword "Apple" but low relevance for a fruit company.',
      },
      {
        question: 'What is the reach score?',
        answer: 'Reach score combines views, shares, comments, and reactions into a single number representing the post\'s potential audience. Higher reach means more people will see your reply if you comment.',
      },
      {
        question: 'What do the sentiment colors mean?',
        answer: 'Green = positive sentiment, Amber = neutral, Red = negative, Purple = question. Sentiment is determined by AI analysis of the post content and tone.',
      },
      {
        question: 'How do I reply to a mention?',
        answer: 'Click the "Reply" button on any mention card. Type your comment and send. The reply is queued as a background task and posted within seconds. You can also set up auto-replies in keyword or tracked post settings.',
      },
      {
        question: 'How do filters work?',
        answer: 'Use the Filter button to narrow mentions by platform, sentiment, relevance range, reach score, keywords, and more. Filters are saved per project and persist between sessions. The date range in the header controls the time window.',
      },
    ],
  },
  {
    id: 'keywords',
    title: 'Keywords',
    icon: KeyRound,
    description: 'Search terms the system monitors across social platforms.',
    items: [
      {
        question: 'What is a keyword?',
        answer: 'A keyword is a search term that the system monitors across social platforms. When someone posts content matching your keyword, it appears in your Mentions feed.',
      },
      {
        question: 'What are keyword types (Brand, Competitor, General)?',
        answer: 'Brand keywords represent your own brand/products. Competitor keywords track rival brands. General keywords cover industry topics. The type determines which Knowledge Base documents the AI uses when generating replies.',
      },
      {
        question: 'What are excluded terms?',
        answer: 'Excluded terms filter out irrelevant results. If your keyword is "Apple" and you exclude "apple pie", posts about apple pie won\'t appear in your feed.',
      },
      {
        question: 'What does the minimum relevance threshold do?',
        answer: 'Posts with relevance below this threshold are hidden from your Mentions feed. Set it higher (70-90%) for precision, lower (30-50%) for broader coverage.',
      },
      {
        question: 'What is the filtering prompt?',
        answer: 'An optional AI instruction that helps judge relevance. Example: "Only show posts asking questions about our product" or "Ignore posts that are just sharing news without discussion."',
      },
    ],
  },
  {
    id: 'followings',
    title: 'Followings',
    icon: Radio,
    description: 'Telegram channels you monitor for new posts.',
    items: [
      {
        question: 'What is a following?',
        answer: 'A following is a Telegram channel you monitor. Every new post in that channel is analyzed and, if relevant enough, appears in your Mentions feed.',
      },
      {
        question: 'How is this different from keywords?',
        answer: 'Keywords search across all platforms for specific terms. Followings monitor specific Telegram channels regardless of content — every post is analyzed for relevance to your brand.',
      },
      {
        question: 'What happens when I pause a following?',
        answer: 'When paused, no new posts are fetched from that channel. Existing posts and their comments remain visible. You can resume at any time.',
      },
    ],
  },
  {
    id: 'tracked-posts',
    title: 'Tracked Posts',
    icon: Rss,
    description: 'Individual posts you monitor for new comments.',
    items: [
      {
        question: 'What is a tracked post?',
        answer: 'A tracked post is a specific social media post you want to monitor for new comments. Unlike keywords (which find new posts), tracked posts focus on monitoring comments on posts you already know about.',
      },
      {
        question: 'When should I track a post?',
        answer: 'Track posts where you want to engage with commenters — your own posts, viral discussions about your brand, competitor announcements, or any post where timely replies matter.',
      },
      {
        question: 'Can I auto-reply to comments on tracked posts?',
        answer: 'Yes. Go to the tracked post settings and enable Auto Reply. Set a relevance threshold and optional reply rules. The AI will automatically respond to matching comments.',
      },
    ],
  },
  {
    id: 'auto-actions',
    title: 'Auto Actions',
    icon: Zap,
    description: 'Overview of all automated commenting and reacting rules.',
    items: [
      {
        question: 'What are auto actions?',
        answer: 'Auto actions are automated rules that post comments or set reactions without manual intervention. They are configured on individual keywords, followings, or tracked posts.',
      },
      {
        question: 'What is Auto Comment / Auto Reply?',
        answer: 'When enabled, the AI automatically writes and posts a reply to mentions that meet your criteria (relevance threshold, reach score). The reply uses your Knowledge Base and reply rules for context.',
      },
      {
        question: 'What is Auto React?',
        answer: 'Auto React automatically sets emoji reactions (👍/👎) on comments based on their sentiment. For example, you can auto-like positive comments and auto-dislike negative ones.',
      },
      {
        question: 'What does "Bot comments per post" mean?',
        answer: 'This limits how many automated comments the bot can leave on a single post. A range like 1-3 means the bot will comment between 1 and 3 times, adding natural variation.',
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Task History',
    icon: BotMessageSquare,
    description: 'Log of all automated and manual actions performed by the system.',
    items: [
      {
        question: 'What is a task?',
        answer: 'A task is any action the system performs: posting a comment, setting a reaction, or deleting a comment. Tasks are queued and processed in the background.',
      },
      {
        question: 'What do task statuses mean?',
        answer: 'Processing = currently being executed. Done = successfully completed. Error = failed (hover over the error icon for details).',
      },
      {
        question: 'Why is my task stuck on "processing"?',
        answer: 'Tasks usually complete within seconds. If stuck, the platform might be rate-limiting or temporarily unavailable. The system will retry automatically.',
      },
    ],
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    icon: BookOpen,
    description: 'Documents the AI uses to generate relevant, on-brand replies.',
    items: [
      {
        question: 'What is the Knowledge Base?',
        answer: 'The Knowledge Base stores documents (FAQs, product guides, brand guidelines) that the AI references when writing auto-replies. Better knowledge = better replies.',
      },
      {
        question: 'What file types are supported?',
        answer: 'PDF, TXT, DOCX, and XLSX files up to 50 MB each. Files are automatically analyzed and indexed after upload.',
      },
      {
        question: 'How do document types (Brand, Competitor, General) work?',
        answer: 'Assign each document to a type. When the AI replies to a "Brand" keyword mention, it uses Brand-type documents. This ensures the right context is used for each reply.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    description: 'Analytics and trends for your mentions over time.',
    items: [
      {
        question: 'What do reports show?',
        answer: 'Reports visualize mention volume over time, sentiment distribution, platform breakdown, and reach scores. Use them to track brand perception trends.',
      },
      {
        question: 'How do I export data?',
        answer: 'Go to Settings → Access & Export. Choose a date range and download an Excel file with all mentions and comments.',
      },
    ],
  },
]

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className='border-b border-border/50 last:border-b-0'>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        className='flex w-full items-center justify-between py-3 text-start text-[13px] font-medium transition-colors hover:text-foreground'
      >
        <span className='pe-4'>{question}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <p className='pb-3 text-[13px] leading-relaxed text-muted-foreground'>
          {answer}
        </p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function HelpCenter() {
  const [search, setSearch] = useState('')

  const filtered = HELP_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !search ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((section) =>
    !search ||
    section.items.length > 0 ||
    section.title.toLowerCase().includes(search.toLowerCase()) ||
    section.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header>
        <h1 className='text-sm font-semibold'>Help Center</h1>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mx-auto max-w-3xl'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold tracking-tight'>
              Help Center
            </h2>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              Quick answers about Brand Advocate features.
            </p>
          </div>

          {/* Search */}
          <div className='relative mb-6'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search…'
              className='h-9 pl-9'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sections */}
          <div className='space-y-10'>
            {filtered.map((section) => (
              <section key={section.id} id={section.id}>
                <div className='mb-2 flex items-center gap-2.5'>
                  <div className='flex size-8 items-center justify-center rounded-lg bg-muted'>
                    <section.icon className='size-4 text-muted-foreground' />
                  </div>
                  <div>
                    <h2 className='text-sm font-semibold'>{section.title}</h2>
                    <p className='text-[11px] text-muted-foreground'>
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className='rounded-lg border bg-card'>
                  <div className='px-4'>
                    {section.items.length > 0 ? (
                      section.items.map((item, i) => (
                        <FaqItem
                          key={i}
                          question={item.question}
                          answer={item.answer}
                        />
                      ))
                    ) : (
                      <p className='py-4 text-center text-sm text-muted-foreground'>
                        No matching questions in this section.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className='py-12 text-center text-muted-foreground'>
              <p className='text-sm'>No results found for "{search}"</p>
              <p className='mt-1 text-xs'>Try different keywords or browse sections above.</p>
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
