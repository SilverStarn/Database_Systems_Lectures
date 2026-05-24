import type { ReactNode } from 'react'

const relationalOperatorGlyphs = {
  sigma: '\u03c3',
  pi: '\u03c0',
  rho: '\u03c1',
} as const

type RelationalOperatorName = keyof typeof relationalOperatorGlyphs

export function normalizeInlineSymbols(text: string) {
  return text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<>/g, '\u2260')
    .replace(/>=/g, '\u2265')
    .replace(/<=/g, '\u2264')
    .replace(/->/g, '\u2192')
    .replace(/\bsigma\b/gi, '\u03c3')
    .replace(/\bpi\b/gi, '\u03c0')
    .replace(/\brho\b/gi, '\u03c1')
}

function parseRelationalNotation(text: string, start: number) {
  const prefix = /^(sigma|pi|rho|\u03c3|\u03c0|\u03c1)_/i.exec(text.slice(start))
  if (!prefix) return undefined

  const previous = start > 0 ? text[start - 1] : ''
  if (previous && /[A-Za-z0-9_]/.test(previous)) return undefined

  const operatorToken = prefix[1].toLowerCase()
  const operator = (
    operatorToken === '\u03c3' ? 'sigma' : operatorToken === '\u03c0' ? 'pi' : operatorToken === '\u03c1' ? 'rho' : operatorToken
  ) as RelationalOperatorName
  const subscriptStart = start + prefix[0].length
  const openIndex = text.indexOf('(', subscriptStart)
  if (openIndex === -1 || openIndex - subscriptStart > 88) return undefined

  const subscript = text.slice(subscriptStart, openIndex).trim()
  if (!subscript || /[\n;:]/.test(subscript)) return undefined

  let depth = 0
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index]
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth === 0) {
      return {
        operator,
        subscript,
        body: text.slice(openIndex + 1, index),
        end: index + 1,
      }
    }
  }

  return undefined
}

function renderMathText(text: string, keyPrefix = 'math'): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let index = 0

  while (index < text.length) {
    const notation = parseRelationalNotation(text, index)
    if (!notation) {
      index += 1
      continue
    }

    if (cursor < index) nodes.push(normalizeInlineSymbols(text.slice(cursor, index)))
    nodes.push(
      <span className={`math-inline math-${notation.operator}`} key={`${keyPrefix}-${index}`}>
        <span className="math-op">{relationalOperatorGlyphs[notation.operator]}</span>
        <sub>{normalizeInlineSymbols(notation.subscript)}</sub>
        <span className="math-relation">({renderMathText(notation.body, `${keyPrefix}-${index}-body`)})</span>
      </span>,
    )
    index = notation.end
    cursor = notation.end
  }

  if (cursor < text.length) nodes.push(normalizeInlineSymbols(text.slice(cursor)))
  return nodes.filter((node) => node !== '')
}

export function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /<(strong|code)>(.*?)<\/\1>/gi
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(...renderMathText(text.slice(cursor, match.index), `text-${cursor}`))
    const [, tag, content] = match
    const key = `${tag}-${match.index}-${content}`
    nodes.push(
      tag.toLowerCase() === 'strong' ? (
        <strong key={key}>{renderMathText(content, `${key}-math`)}</strong>
      ) : (
        <code key={key}>{normalizeInlineSymbols(content)}</code>
      ),
    )
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) nodes.push(...renderMathText(text.slice(cursor), `text-${cursor}`))
  return nodes
}

function isSymbolicCodeLine(line: string) {
  return /\b(?:sigma|pi|rho)_/i.test(line) || /[\u03c3\u03c0\u03c1\u22c8\u222a\u2229\u2212]/.test(line) || /->/.test(line)
}

export function renderMathAwareCode(code: string): ReactNode[] {
  return code.split('\n').flatMap((line, index, lines) => {
    const renderedLine: ReactNode = isSymbolicCodeLine(line) ? (
      <span className="math-code-line" key={`code-line-${index}`}>
        {renderMathText(line, `code-${index}`)}
      </span>
    ) : (
      line
    )

    return index < lines.length - 1 ? [renderedLine, '\n'] : [renderedLine]
  })
}

export function plainText(text: string) {
  return normalizeInlineSymbols(text.replace(/<\/?(strong|code)>/gi, ''))
}
