/**
 * Wraps occurrences of `keyword` in the given text with <mark> tags.
 * Returns an HTML string safe for dangerouslySetInnerHTML (keyword is escaped).
 * If keyword is empty or not found, returns the original text (HTML-escaped).
 */
export function highlightKeyword(text: string, keyword?: string | null): string {
  // HTML-escape the text first
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (!keyword || keyword.trim().length === 0) return escaped

  // Escape regex special chars in keyword
  const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKw})`, 'gi')

  return escaped.replace(
    regex,
    '<mark class="bg-blue-500/15 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300 rounded-sm px-0.5">$1</mark>'
  )
}
