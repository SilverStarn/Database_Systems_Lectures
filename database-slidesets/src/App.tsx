import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  BookOpen,
  Brain,
  ChevronRight,
  Command,
  Database,
  Library,
  Maximize2,
  Minimize2,
  Play,
  Save,
} from 'lucide-react'
import { getAcademicContent } from './academicContent'
import { LectureStage } from './LectureStage'
import {
  decks,
  slideCount,
} from './courseData'
import { getMasteryNode } from './masteryPath'
import {
  getDeckQuiz,
  getRichQuizCount,
} from './quizContent'
import { QuizStage, QuizSummaryStage } from './QuizStages'
import {
  correctAnswerPatch,
  disabledStateAfterRetry,
  incorrectFeedbackFor,
  matchValues,
  normalizeAttemptStates,
  responseCanAdvance,
  responseIsCorrect,
  responseIsReady,
  visualSelection,
  type SlideAttemptState,
  type SlideAttemptStatesByDeck,
} from './quizRuntime'
import {
  STUDY_STATE_STORAGE_KEY,
  buildStudyCommandItems,
  clamp,
  commandKindLabel,
  readPersistedStudyState,
  type BookmarkedSlides,
  type Mode,
  type PersistedStudyState,
  type PlaySpeed,
  type StudyCommandItem,
} from './studyState'
import { Metric, ModeButton } from './AppShellControls'
import { StudyCommandPalette } from './StudyCommandPalette'
import './App.css'

const totalQuizCount = getRichQuizCount(decks)

function App() {
  const [initialStudyState] = useState<PersistedStudyState | null>(() => readPersistedStudyState())
  const [activeDeckId, setActiveDeckId] = useState(initialStudyState?.activeDeckId ?? decks[0].id)
  const [mode, setMode] = useState<Mode>(initialStudyState?.mode ?? 'lecture')
  const [slideIndex, setSlideIndex] = useState(initialStudyState?.slideIndex ?? 0)
  const [quizIndex, setQuizIndex] = useState(initialStudyState?.quizIndex ?? 0)
  const [slideAttemptStates, setSlideAttemptStates] = useState<SlideAttemptStatesByDeck>(
    initialStudyState?.slideAttemptStates ?? {},
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed] = useState<PlaySpeed>(initialStudyState?.playSpeed ?? 9000)
  const [focusMode, setFocusMode] = useState(initialStudyState?.focusMode ?? false)
  const [railCollapsed, setRailCollapsed] = useState(initialStudyState?.railCollapsed ?? false)
  const [bookmarkedSlides] = useState<BookmarkedSlides>(initialStudyState?.bookmarkedSlides ?? {})
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? decks[0],
    [activeDeckId],
  )
  const deckQuiz = useMemo(() => getDeckQuiz(activeDeck), [activeDeck])
  const activeSlideAttemptStates = useMemo(
    () => normalizeAttemptStates(slideAttemptStates[activeDeck.id], deckQuiz.length),
    [activeDeck.id, deckQuiz.length, slideAttemptStates],
  )
  const isQuizSummary = quizIndex >= deckQuiz.length
  const safeQuizIndex = clamp(quizIndex, 0, deckQuiz.length - 1)
  const activeSlide = activeDeck.slides[slideIndex]
  const activeQuestion = deckQuiz[safeQuizIndex]
  const activeAttemptState = activeSlideAttemptStates[safeQuizIndex]
  const academicContent = useMemo(
    () => getAcademicContent(activeDeck, activeSlide, slideIndex),
    [activeDeck, activeSlide, slideIndex],
  )

  const deckScore = activeSlideAttemptStates.filter((state) => state.firstAttemptCorrect).length
  const answeredCount = activeSlideAttemptStates.filter((state) => state.attempts > 0).length
  const cheatedCount = activeSlideAttemptStates.filter((state) => state.interactiveState?.cheated).length
  const deckPercent = answeredCount > 0 ? Math.round((deckScore / answeredCount) * 100) : 0
  const activeMasteryNode = getMasteryNode(activeDeck.id)
  const activeDeckBookmarks = bookmarkedSlides[activeDeck.id] ?? []
  const commandItems = useMemo(
    () => buildStudyCommandItems(bookmarkedSlides),
    [bookmarkedSlides],
  )
  const filteredCommandItems = useMemo(() => {
    const query = commandQuery.trim().toLowerCase()
    if (!query) return commandItems.slice(0, 18)
    return commandItems
      .filter((item) => {
        const deck = decks.find((candidate) => candidate.id === item.deckId)
        return [item.title, item.detail, commandKindLabel(item.kind), deck?.title ?? '', deck?.number ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .slice(0, 28)
  }, [commandItems, commandQuery])

  useEffect(() => {
    if (!isPlaying || mode !== 'lecture') return undefined
    const timer = window.setInterval(() => {
      setSlideIndex((current) => {
        if (current >= activeDeck.slides.length - 1) {
          setIsPlaying(false)
          return current
        }
        return current + 1
      })
    }, playSpeed)
    return () => window.clearInterval(timer)
  }, [activeDeck.slides.length, isPlaying, mode, playSpeed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeDeckId, mode, quizIndex, slideIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen((open) => !open)
        return
      }
      if (event.key === 'Escape' && commandOpen) {
        event.preventDefault()
        setCommandOpen(false)
        return
      }
      const tag = document.activeElement?.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setFocusMode((value) => !value)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrevious()
      }
      if (event.key.toLowerCase() === ' ') {
        event.preventDefault()
        setIsPlaying((playing) => !playing)
        setMode('lecture')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const persistedState: PersistedStudyState = {
      version: 3,
      activeDeckId,
      mode,
      slideIndex,
      quizIndex,
      slideAttemptStates,
      playSpeed,
      focusMode,
      railCollapsed,
      bookmarkedSlides,
    }
    window.localStorage.setItem(STUDY_STATE_STORAGE_KEY, JSON.stringify(persistedState))
  }, [
    activeDeckId,
    bookmarkedSlides,
    focusMode,
    mode,
    playSpeed,
    quizIndex,
    railCollapsed,
    slideAttemptStates,
    slideIndex,
  ])

  function selectDeck(deckId: string) {
    setActiveDeckId(deckId)
    setMode('lecture')
    setSlideIndex(0)
    setQuizIndex(0)
    setIsPlaying(false)
  }

  function runCommand(item: StudyCommandItem) {
    setActiveDeckId(item.deckId)
    setMode(item.mode)
    setIsPlaying(false)
    setCommandOpen(false)
    setCommandQuery('')

    if (item.mode === 'lecture') {
      setSlideIndex(item.slideIndex ?? 0)
      setQuizIndex(0)
    }

    if (item.mode === 'quiz') {
      setQuizIndex(item.quizIndex ?? 0)
    }

  }

  function goPrevious() {
    if (mode === 'quiz') {
      setQuizIndex((current) => clamp(current - 1, 0, deckQuiz.length))
      return
    }
    setSlideIndex((current) => clamp(current - 1, 0, activeDeck.slides.length - 1))
  }

  function goNext() {
    if (mode === 'quiz') {
      if (isQuizSummary || !responseCanAdvance(activeAttemptState)) return
      setQuizIndex((current) => clamp(current + 1, 0, deckQuiz.length))
      return
    }
    setSlideIndex((current) => clamp(current + 1, 0, activeDeck.slides.length - 1))
  }

  function chooseAnswer(value: string) {
    updateAttemptState((existing) => {
      if (existing.showNextButton || existing.feedbackVisible || existing.interactiveState?.cheated) return existing
      if (existing.interactiveState?.disabledOptionValues?.includes(value)) return existing
      return {
        ...existing,
        userAnswer: value,
      }
    })
  }

  function toggleVisualAnswer(index: number) {
    updateAttemptState((existing) => {
      if (existing.showNextButton || existing.feedbackVisible || existing.interactiveState?.cheated) return existing
      if (existing.interactiveState?.disabledVisualIndices?.includes(index)) return existing
      const currentSelection = visualSelection(existing)
      const nextVisualSelection = currentSelection.includes(index)
        ? currentSelection.filter((item) => item !== index)
        : [...currentSelection, index]
      return {
        ...existing,
        userAnswer: nextVisualSelection,
        interactiveState: {
          ...existing.interactiveState,
          visualSelection: nextVisualSelection,
        },
      }
    })
  }

  function changeMatchAnswer(itemId: string, value: string) {
    updateAttemptState((existing) => {
      if (existing.showNextButton || existing.feedbackVisible || existing.interactiveState?.cheated) return existing
      if (value && existing.interactiveState?.disabledMatchValues?.[itemId]?.includes(value)) return existing
      const nextMatchValues = {
        ...matchValues(existing),
        [itemId]: value,
      }
      return {
        ...existing,
        userAnswer: nextMatchValues,
        interactiveState: {
          ...existing.interactiveState,
          matchValues: nextMatchValues,
        },
      }
    })
  }

  function submitAnswer() {
    if (!responseIsReady(activeQuestion, activeAttemptState)) {
      window.alert('Please select or complete an answer before submitting.')
      return
    }
    updateAttemptState((existing) => {
      if (existing.feedbackVisible || existing.showNextButton || existing.interactiveState?.cheated) return existing
      const isCorrect = responseIsCorrect(activeQuestion, existing)
      const attempts = existing.attempts + 1
      const feedbackHTML = isCorrect ? activeQuestion.explanation.correct : incorrectFeedbackFor(activeQuestion, existing)
      return {
        ...existing,
        attempts,
        firstAttemptCorrect: existing.attempts === 0 ? isCorrect : existing.firstAttemptCorrect,
        lastAttemptCorrect: isCorrect,
        feedbackHTML,
        showNextButton: isCorrect,
        feedbackVisible: !isCorrect,
      }
    })
  }

  function retryAnswer() {
    updateAttemptState((existing) => {
      if (!existing.feedbackVisible || existing.interactiveState?.cheated) return existing
      const nextInteractiveState = disabledStateAfterRetry(activeQuestion, existing)
      return {
        ...existing,
        userAnswer: undefined,
        lastAttemptCorrect: false,
        feedbackHTML: '',
        showNextButton: false,
        feedbackVisible: false,
        interactiveState: nextInteractiveState,
      }
    })
  }

  function revealCorrectAnswer() {
    updateAttemptState((existing) => {
      if (existing.showNextButton || existing.interactiveState?.cheated) return existing
      const patch = correctAnswerPatch(activeQuestion)
      return {
        ...existing,
        ...patch,
        lastAttemptCorrect: false,
        feedbackHTML: activeQuestion.explanation.correct,
        showNextButton: true,
        feedbackVisible: false,
        interactiveState: {
          ...existing.interactiveState,
          ...patch.interactiveState,
          cheated: true,
        },
      }
    })
  }

  function resetDeckQuiz() {
    setSlideAttemptStates((current) => {
      const next = { ...current }
      delete next[activeDeck.id]
      return next
    })
    setQuizIndex(0)
  }

  function updateAttemptState(updater: (existing: SlideAttemptState) => SlideAttemptState) {
    setSlideAttemptStates((current) => {
      const deckStates = normalizeAttemptStates(current[activeDeck.id], deckQuiz.length)
      const nextDeckStates = [...deckStates]
      nextDeckStates[safeQuizIndex] = updater(deckStates[safeQuizIndex])
      return {
        ...current,
        [activeDeck.id]: nextDeckStates,
      }
    })
  }

  return (
    <main className={`app-shell ${focusMode ? 'is-focus-mode' : ''} ${railCollapsed ? 'is-rail-collapsed' : ''}`}>
      <aside className="deck-rail" aria-label="Lecture sets">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden={true}>
            <Database size={24} />
          </div>
          <div>
            <p className="eyebrow">CS 361 Studio</p>
            <h1>Database Lecture Sets</h1>
          </div>
        </div>

        <div className="metric-strip" aria-label="Course coverage summary">
          <Metric icon={Library} label="Chapters" value={decks.length.toString()} />
          <Metric icon={BookOpen} label="Slides" value={slideCount.toString()} />
          <Metric icon={Brain} label="Quiz" value={totalQuizCount.toString()} />
        </div>

        <nav className="deck-list" aria-label="Deck navigation">
          {decks.map((deck) => (
            <button
              aria-label={`Open deck ${deck.number}: ${deck.title}. Level ${deck.level}. ${deck.minutes} minutes.`}
              className={`deck-button ${deck.id === activeDeck.id ? 'is-active' : ''}`}
              key={deck.id}
              onClick={() => selectDeck(deck.id)}
              type="button"
              style={{ '--deck-accent': deck.accent } as CSSProperties}
            >
              <span className="deck-number">{deck.number}</span>
              <span className="deck-copy">
                <strong>{deck.title}</strong>
                <small>{deck.level} - {deck.minutes} min</small>
              </span>
              <ChevronRight size={16} aria-hidden={true} />
            </button>
          ))}
        </nav>
      </aside>

      <button
        aria-expanded={!railCollapsed}
        aria-label={railCollapsed ? 'Show chapter menu' : 'Hide chapter menu'}
        className="rail-toggle inline-flex items-center justify-center shadow-lg transition-transform hover:-translate-y-0.5"
        onClick={() => setRailCollapsed((value) => !value)}
        title={railCollapsed ? 'Show chapter menu' : 'Hide chapter menu'}
        type="button"
      >
        {railCollapsed ? <Maximize2 size={18} aria-hidden={true} /> : <Minimize2 size={18} aria-hidden={true} />}
      </button>

      <section className="workspace">
        <header className="topbar">
          <div className="deck-heading">
            <p className="eyebrow">Deck {activeDeck.number}</p>
            <h2>{activeDeck.title}</h2>
            <p>{activeDeck.subtitle}</p>
          </div>

          <div className="topbar-actions">
            <div className="topbar-tool-pair" aria-label="Workspace tools">
              <button className={`focus-button ${focusMode ? 'is-active' : ''}`} type="button" onClick={() => setFocusMode((value) => !value)}>
                {focusMode ? <Minimize2 size={16} aria-hidden={true} /> : <Maximize2 size={16} aria-hidden={true} />}
                <span>{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
              </button>
              <button className="command-button" type="button" onClick={() => setCommandOpen(true)}>
                <Command size={16} aria-hidden={true} />
                <span>Study Map</span>
              </button>
            </div>
            <span className="save-chip">
              <Save size={15} aria-hidden={true} />
              Autosaved
            </span>
            <div className="mode-tabs" role="tablist" aria-label="Study mode">
              <ModeButton active={mode === 'lecture'} icon={Play} label="Lecture" onClick={() => setMode('lecture')} />
              <ModeButton active={mode === 'quiz'} icon={Brain} label="Quiz" onClick={() => setMode('quiz')} />
            </div>
          </div>
        </header>

        <section className="content-grid">
          <section className="stage-column">
            {mode === 'lecture' && (
              <LectureStage
                deck={activeDeck}
                slideIndex={slideIndex}
                slide={activeSlide}
                isPlaying={isPlaying}
                bookmarkedSlides={activeDeckBookmarks}
                masteryNode={activeMasteryNode}
                academicContent={academicContent}
                onTogglePlay={() => setIsPlaying((playing) => !playing)}
                onPrevious={goPrevious}
                onNext={goNext}
                onJump={(index) => {
                  setSlideIndex(index)
                }}
              />
            )}

            {mode === 'quiz' && !isQuizSummary && (
              <QuizStage
                deck={activeDeck}
                quizIndex={safeQuizIndex}
                total={deckQuiz.length}
                attemptState={activeAttemptState}
                score={deckScore}
                answeredCount={answeredCount}
                cheatedCount={cheatedCount}
                scorePercent={deckPercent}
                question={activeQuestion}
                onChoose={chooseAnswer}
                onToggleVisual={toggleVisualAnswer}
                onMatchChange={changeMatchAnswer}
                onSubmit={submitAnswer}
                onRetry={retryAnswer}
                onRevealCorrect={revealCorrectAnswer}
                onPrevious={goPrevious}
                onNext={goNext}
                onReset={resetDeckQuiz}
                onJump={setQuizIndex}
              />
            )}

            {mode === 'quiz' && isQuizSummary && (
              <QuizSummaryStage
                deck={activeDeck}
                states={activeSlideAttemptStates}
                score={deckScore}
                attempted={answeredCount}
                cheatedCount={cheatedCount}
                scorePercent={deckPercent}
                onPrevious={goPrevious}
                onReset={resetDeckQuiz}
                onJump={setQuizIndex}
              />
            )}

          </section>
        </section>
      </section>
      <StudyCommandPalette
        items={filteredCommandItems}
        onClose={() => setCommandOpen(false)}
        onQuery={setCommandQuery}
        onRun={runCommand}
        open={commandOpen}
        query={commandQuery}
      />
    </main>
  )
}

export default App
