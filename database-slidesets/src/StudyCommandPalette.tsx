import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { commandKindLabel, type StudyCommandItem } from './studyState'
import { renderRichText } from './richText'

export function StudyCommandPalette({
  open,
  query,
  items,
  onQuery,
  onRun,
  onClose,
}: {
  open: boolean
  query: string
  items: StudyCommandItem[]
  onQuery: (value: string) => void
  onRun: (item: StudyCommandItem) => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return undefined
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!open) return null

  return (
    <div className="command-overlay" onClick={onClose} role="presentation">
      <section
        aria-label="Study map search"
        aria-modal={true}
        className="command-palette"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="command-search">
          <Search size={18} aria-hidden={true} />
          <input
            aria-label="Search study map"
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose()
              if (event.key === 'Enter' && items[0]) onRun(items[0])
            }}
            placeholder="Search decks, slides, quizzes, bookmarks"
            ref={inputRef}
            type="search"
            value={query}
          />
          <button aria-label="Close study map" className="command-close" onClick={onClose} type="button">
            <X size={17} aria-hidden={true} />
          </button>
        </div>

        <div className="command-results" role="listbox">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                className={`command-result result-${item.kind}`}
                key={item.id}
                onClick={() => onRun(item)}
                role="option"
                type="button"
              >
                <span>{commandKindLabel(item.kind)}</span>
                <strong>{renderRichText(item.title)}</strong>
                <small>{renderRichText(item.detail)}</small>
              </button>
            ))
          ) : (
            <div className="command-empty">
              <strong>No matching study items</strong>
              <small>Try a topic, deck name, quiz set, or bookmarked slide title.</small>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
