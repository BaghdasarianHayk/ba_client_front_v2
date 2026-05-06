import { cn } from '@/lib/utils'

import redditIcon from '@/assets/platforms/reddit.svg'
import telegramIcon from '@/assets/platforms/telegram.svg'
import xIcon from '@/assets/platforms/x.svg'
import youtubeIcon from '@/assets/platforms/youtube.svg'
import instagramIcon from '@/assets/platforms/instagram.svg'
import facebookIcon from '@/assets/platforms/facebook.svg'
import tiktokIcon from '@/assets/platforms/tiktok.svg'
import webIcon from '@/assets/platforms/web.svg'

export type PlatformId =
  | 'reddit'
  | 'telegram'
  | 'x'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'web'

const icons: Record<PlatformId, string> = {
  reddit: redditIcon,
  telegram: telegramIcon,
  x: xIcon,
  youtube: youtubeIcon,
  instagram: instagramIcon,
  facebook: facebookIcon,
  tiktok: tiktokIcon,
  web: webIcon,
}

const labels: Record<PlatformId, string> = {
  reddit: 'Reddit',
  telegram: 'Telegram',
  x: 'X',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  web: 'Web',
}

const sizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

type PlatformIconProps = {
  platform: PlatformId
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PlatformIcon({
  platform,
  size = 'md',
  className,
}: PlatformIconProps) {
  return (
    <img
      src={icons[platform] ?? icons.web}
      alt={labels[platform] ?? 'Web'}
      className={cn(sizes[size], 'shrink-0 object-contain', className)}
    />
  )
}
