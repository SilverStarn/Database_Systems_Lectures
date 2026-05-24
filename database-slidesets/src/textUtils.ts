import { plainText } from './richText'

export function compactText(text: string | undefined, limit = 132) {
  if (!text) return ''
  const normalized = plainText(text).replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit - 1).trim()}...`
}

export function identifierFrom(text: string, fallback = 'object') {
  const slug = plainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 34)
  return slug || fallback
}
