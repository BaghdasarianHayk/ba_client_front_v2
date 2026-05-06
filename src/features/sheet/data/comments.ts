import { faker } from '@faker-js/faker'

faker.seed(99999)

export type Comment = {
  id: string
  author: {
    username: string
    avatar: string
  }
  body: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'question'
  createdAt: Date
  replies: Comment[]
}

function generateComment(depth: number): Comment {
  const maxReplies = depth >= 2 ? 0 : faker.number.int({ min: 0, max: 3 })
  return {
    id: faker.string.nanoid(8),
    author: {
      username: faker.internet.username().toLowerCase(),
      avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${faker.string.alpha(6)}`,
    },
    body: faker.lorem.sentences({ min: 1, max: 4 }),
    sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative', 'question'] as const),
    createdAt: faker.date.recent({ days: 7 }),
    replies: Array.from({ length: maxReplies }, () => generateComment(depth + 1)),
  }
}

// Generate a map of postId -> comments
// We'll call this with a post id to get consistent comments
export function generateCommentsForPost(postId: string): Comment[] {
  faker.seed(postId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))
  const count = faker.number.int({ min: 1, max: 5 })
  return Array.from({ length: count }, () => generateComment(0))
}
