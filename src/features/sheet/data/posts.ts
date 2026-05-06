import { faker } from '@faker-js/faker'

faker.seed(31415)

export type Post = {
  id: string
  author: {
    username: string
    avatar: string
  }
  platform: 'reddit' | 'telegram' | 'x' | 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'web'
  subreddit: string
  title: string
  body: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'question'
  reasons: (
    | { type: 'keyword'; keyword: string }
    | { type: 'following' }
  )[]
  upvotes: number
  downvotes: number
  commentCount: number
  commentSentiments: {
    positive: number
    neutral: number
    negative: number
    question: number
  }
  createdAt: Date
  availableEmojis: string[]
  type: 'text' | 'link' | 'mention'
}

const subreddits = [
  'r/reactjs',
  'r/typescript',
  'r/webdev',
  'r/javascript',
  'r/programming',
  'r/frontend',
  'r/tailwindcss',
  'r/nextjs',
  'r/Python',
  'r/opensource',
]

const keywords = [
  '#python tricks',
  '#react hooks',
  '#typescript tips',
  '#css grid',
  '#tailwind',
  '#webdev',
  '#javascript',
  '#frontend',
  '#opensource',
  '#vite',
]

export const posts: Post[] = Array.from({ length: 30 }, () => {
  const up = faker.number.int({ min: 1, max: 12000 })
  const down = faker.number.int({ min: 0, max: Math.floor(up * 0.3) })
  const positive = faker.number.int({ min: 10, max: 2500 })
  const neutral = faker.number.int({ min: 5, max: 1200 })
  const negative = faker.number.int({ min: 0, max: 800 })
  const question = faker.number.int({ min: 0, max: 400 })
  const commentSentiments = { positive, neutral, negative, question }
  const commentCount = positive + neutral + negative + question

  return {
    id: faker.string.nanoid(8),
    author: {
      username: faker.internet.username().toLowerCase(),
      avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${faker.string.alpha(6)}`,
    },
    subreddit: faker.helpers.arrayElement(subreddits),
    platform: faker.helpers.arrayElement(['reddit', 'telegram', 'x', 'youtube', 'instagram', 'facebook', 'tiktok', 'web'] as const),
    title: faker.lorem.sentence({ min: 6, max: 18 }).replace(/\.$/, ''),
    body: faker.lorem.paragraphs({ min: 1, max: 3 }, '\n\n'),
    sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative', 'question'] as const),
    reasons: (() => {
      const r: Post['reasons'] = []
      if (faker.datatype.boolean(0.4)) r.push({ type: 'following' })
      const kwCount = faker.number.int({ min: 0, max: 3 })
      const picked = faker.helpers.arrayElements(keywords, kwCount)
      for (const kw of picked) r.push({ type: 'keyword', keyword: kw })
      // ensure at least one reason
      if (r.length === 0) r.push({ type: 'keyword', keyword: faker.helpers.arrayElement(keywords) })
      return r
    })(),
    upvotes: up,
    downvotes: down,
    commentCount,
    commentSentiments,
    createdAt: faker.date.recent({ days: 14 }),
    availableEmojis: faker.helpers.arrayElements(
      ['👍', '👎', '❤️', '🔥', '😂', '😮', '😢', '🎉', '🤔', '👀', '💯', '🙏', '👏', '🚀', '💪', '⭐'],
      faker.number.int({ min: 4, max: 10 })
    ),
    type: faker.helpers.weightedArrayElement([
      { value: 'text' as const, weight: 7 },
      { value: 'link' as const, weight: 1 },
      { value: 'mention' as const, weight: 2 },
    ]),
  }
})
