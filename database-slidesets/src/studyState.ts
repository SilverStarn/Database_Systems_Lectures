import { decks } from './courseData'
import { getDeckQuiz } from './quizContent'
import {
  createAttemptState,
  type InteractiveAttemptState,
  type SlideAttemptState,
  type SlideAttemptStatesByDeck,
  type UserAnswer,
} from './quizRuntime'

export type Mode = 'lecture' | 'quiz'
export type PlaySpeed = 6000 | 9000 | 12000
export type BookmarkedSlides = Record<string, number[]>
export type PersistedStudyState = {
  version: 3
  activeDeckId: string
  mode: Mode
  slideIndex: number
  quizIndex: number
  slideAttemptStates: SlideAttemptStatesByDeck
  playSpeed: PlaySpeed
  focusMode: boolean
  railCollapsed: boolean
  bookmarkedSlides: BookmarkedSlides
}
export type StudyCommandKind = 'deck' | 'slide' | 'quiz' | 'bookmark'
export type StudyCommandItem = {
  id: string
  kind: StudyCommandKind
  title: string
  detail: string
  deckId: string
  mode: Mode
  slideIndex?: number
  quizIndex?: number
}

export const STUDY_STATE_STORAGE_KEY = 'database-slidesets.study-state.v3'
const validPlaySpeeds: PlaySpeed[] = [6000, 9000, 12000]

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isMode(value: unknown): value is Mode {
  return value === 'lecture' || value === 'quiz'
}

function isPlaySpeed(value: unknown): value is PlaySpeed {
  return validPlaySpeeds.includes(value as PlaySpeed)
}

function safeInteger(value: unknown, fallback: number) {
  return Number.isInteger(value) ? Number(value) : fallback
}

function coerceInteractiveState(value: unknown): InteractiveAttemptState {
  if (!isRecord(value)) return {}
  const matchValuesCandidate = value.matchValues
  const disabledMatchValuesCandidate = value.disabledMatchValues
  const matchValues =
    isRecord(matchValuesCandidate)
      ? Object.fromEntries(
          Object.entries(matchValuesCandidate)
            .filter(([, entry]) => typeof entry === 'string')
            .map(([key, entry]) => [key, entry as string]),
        )
      : undefined
  const disabledMatchValues =
    isRecord(disabledMatchValuesCandidate)
      ? Object.fromEntries(
          Object.entries(disabledMatchValuesCandidate).map(([key, entry]) => [
            key,
            Array.isArray(entry) ? entry.filter((item): item is string => typeof item === 'string') : [],
          ]),
        )
      : undefined

  return {
    visualSelection: Array.isArray(value.visualSelection)
      ? value.visualSelection.filter((item): item is number => Number.isInteger(item))
      : undefined,
    matchValues,
    disabledOptionValues: Array.isArray(value.disabledOptionValues)
      ? value.disabledOptionValues.filter((item): item is string => typeof item === 'string')
      : undefined,
    disabledVisualIndices: Array.isArray(value.disabledVisualIndices)
      ? value.disabledVisualIndices.filter((item): item is number => Number.isInteger(item))
      : undefined,
    disabledMatchValues,
    cheated: value.cheated === true,
  }
}

function coerceAttemptState(value: unknown): SlideAttemptState {
  const base = createAttemptState()
  if (!isRecord(value)) return base
  const userAnswerCandidate = value.userAnswer
  const userAnswer =
    typeof userAnswerCandidate === 'string' ||
    Array.isArray(userAnswerCandidate) ||
    (userAnswerCandidate && typeof userAnswerCandidate === 'object')
      ? (userAnswerCandidate as UserAnswer)
      : undefined

  return {
    userAnswer,
    attempts: safeInteger(value.attempts, base.attempts),
    firstAttemptCorrect: value.firstAttemptCorrect === true,
    lastAttemptCorrect: value.lastAttemptCorrect === true,
    feedbackHTML: '',
    showNextButton: value.showNextButton === true,
    feedbackVisible: value.feedbackVisible === true,
    interactiveState: coerceInteractiveState(value.interactiveState),
  }
}

function coerceAttemptStatesByDeck(value: unknown): SlideAttemptStatesByDeck {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([deckId, states]) => decks.some((deck) => deck.id === deckId) && Array.isArray(states))
      .map(([deckId, states]) => [deckId, (states as unknown[]).map(coerceAttemptState)]),
  )
}

function coerceBookmarkedSlides(value: unknown): BookmarkedSlides {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([deckId]) => decks.some((deck) => deck.id === deckId))
      .map(([deckId, indexes]) => {
        const deck = decks.find((item) => item.id === deckId) ?? decks[0]
        const uniqueIndexes = Array.from(
          new Set(
            Array.isArray(indexes)
              ? indexes.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < deck.slides.length)
              : [],
          ),
        ).sort((left, right) => left - right)
        return [deckId, uniqueIndexes]
      }),
  )
}

export function readPersistedStudyState(): PersistedStudyState | null {
  if (typeof window === 'undefined') return null
  try {
    const rawState = window.localStorage.getItem(STUDY_STATE_STORAGE_KEY)
    if (!rawState) return null
    const parsed = JSON.parse(rawState) as unknown
    if (!isRecord(parsed) || parsed.version !== 3) return null
    const activeDeckId =
      typeof parsed.activeDeckId === 'string' && decks.some((deck) => deck.id === parsed.activeDeckId)
        ? parsed.activeDeckId
        : decks[0].id
    const activeDeck = decks.find((deck) => deck.id === activeDeckId) ?? decks[0]
    const mode = isMode(parsed.mode) ? parsed.mode : 'lecture'
    const playSpeed = isPlaySpeed(parsed.playSpeed) ? parsed.playSpeed : 9000

    return {
      version: 3,
      activeDeckId,
      mode,
      slideIndex: clamp(safeInteger(parsed.slideIndex, 0), 0, activeDeck.slides.length - 1),
      quizIndex: clamp(safeInteger(parsed.quizIndex, 0), 0, getDeckQuiz(activeDeck).length),
      slideAttemptStates: coerceAttemptStatesByDeck(parsed.slideAttemptStates),
      playSpeed,
      focusMode: parsed.focusMode === true,
      railCollapsed: parsed.railCollapsed === true,
      bookmarkedSlides: coerceBookmarkedSlides(parsed.bookmarkedSlides),
    }
  } catch {
    return null
  }
}

export function commandKindLabel(kind: StudyCommandKind) {
  if (kind === 'deck') return 'Deck'
  if (kind === 'slide') return 'Slide'
  if (kind === 'quiz') return 'Quiz'
  return 'Bookmark'
}

export function buildStudyCommandItems(bookmarks: BookmarkedSlides): StudyCommandItem[] {
  const deckItems = decks.flatMap((deck) => {
    const slideItems = deck.slides.map((slide, index) => ({
      id: `slide-${deck.id}-${index}`,
      kind: 'slide' as const,
      title: slide.title,
      detail: `Deck ${deck.number} - ${deck.title} - ${slide.eyebrow}`,
      deckId: deck.id,
      mode: 'lecture' as const,
      slideIndex: index,
    }))
    const bookmarkItems = (bookmarks[deck.id] ?? []).flatMap((index) => {
      const slide = deck.slides[index]
      if (!slide) return []
      return [
        {
          id: `bookmark-${deck.id}-${index}`,
          kind: 'bookmark' as const,
          title: slide.title,
          detail: `Bookmarked in Deck ${deck.number} - ${deck.title}`,
          deckId: deck.id,
          mode: 'lecture' as const,
          slideIndex: index,
        },
      ]
    })
    return [
      {
        id: `deck-${deck.id}`,
        kind: 'deck' as const,
        title: deck.title,
        detail: `Deck ${deck.number} - ${deck.subtitle}`,
        deckId: deck.id,
        mode: 'lecture' as const,
        slideIndex: 0,
      },
      {
        id: `quiz-${deck.id}`,
        kind: 'quiz' as const,
        title: `${deck.title} quiz set`,
        detail: `${getDeckQuiz(deck).length} graduate-style questions with retry feedback`,
        deckId: deck.id,
        mode: 'quiz' as const,
        quizIndex: 0,
      },
      ...bookmarkItems,
      ...slideItems,
    ]
  })

  return deckItems
}
