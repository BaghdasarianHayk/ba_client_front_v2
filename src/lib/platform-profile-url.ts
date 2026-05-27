/**
 * Returns a URL to the author's profile on the given platform.
 * Returns null for platforms where we can't reliably construct a profile URL.
 */
export function getAuthorProfileUrl(platform: string, username: string): string | null {
  const clean = username.replace(/^@/, '')
  switch (platform) {
    case 'telegram': return `https://t.me/${clean}`
    case 'reddit': return `https://reddit.com/user/${clean}`
    case 'x': return `https://x.com/${clean}`
    case 'youtube': return `https://youtube.com/@${clean}`
    case 'instagram': return `https://instagram.com/${clean}`
    case 'facebook': return `https://facebook.com/${clean}`
    case 'tiktok': return `https://tiktok.com/@${clean}`
    default: return null
  }
}
