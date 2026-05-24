import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, RefreshCcw } from 'lucide-react'
import type { Deck } from './courseData'
import type { RichQuizQuestion } from './quizContent'
import { QuizFeedbackGrid, QuizQuestionInput } from './QuizQuestionComponents'
import {
  correctAnswerLabel,
  primaryFeedback,
  responseCanAdvance,
  responseIsReady,
  type QuizStatus,
  type SlideAttemptState,
} from './quizRuntime'
import { renderRichText } from './richText'
function normalizeCodeSnippetHTML(html: string) {
  return html
    .replace(/-&gt;/g, '\u2192')
    .replace(/-&amp;gt;/g, '\u2192')
    .replace(/->/g, '\u2192')
    .replace(/&gt;=/g, '\u2265')
    .replace(/&amp;gt;=/g, '\u2265')
    .replace(/>=/g, '\u2265')
    .replace(/&lt;=/g, '\u2264')
    .replace(/&amp;lt;=/g, '\u2264')
    .replace(/<=/g, '\u2264')
}

export function QuizStage({
  deck,
  quizIndex,
  total,
  attemptState,
  score,
  answeredCount,
  cheatedCount,
  scorePercent,
  question,
  onChoose,
  onToggleVisual,
  onMatchChange,
  onSubmit,
  onRetry,
  onRevealCorrect,
  onPrevious,
  onNext,
  onReset,
  onJump,
}: {
  deck: Deck
  quizIndex: number
  total: number
  attemptState: SlideAttemptState
  score: number
  answeredCount: number
  cheatedCount: number
  scorePercent: number
  question: RichQuizQuestion
  onChoose: (value: string) => void
  onToggleVisual: (index: number) => void
  onMatchChange: (itemId: string, value: string) => void
  onSubmit: () => void
  onRetry: () => void
  onRevealCorrect: () => void
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
  onJump: (index: number) => void
}) {
  const cheated = Boolean(attemptState.interactiveState?.cheated)
  const status: QuizStatus = cheated || attemptState.showNextButton ? 'correct' : attemptState.feedbackVisible ? 'incorrect' : 'idle'
  const hasFeedback = Boolean(attemptState.feedbackVisible || attemptState.showNextButton || cheated)
  const isCorrect = Boolean(attemptState.showNextButton || cheated)
  const isIncorrect = attemptState.feedbackVisible
  const canSubmit = responseIsReady(question, attemptState) && status === 'idle' && !cheated
  const canRetry = attemptState.feedbackVisible && !cheated
  const canAdvance = responseCanAdvance(attemptState)
  const correctLabel = correctAnswerLabel(question)
  const answeredState = cheated
    ? 'Answer revealed'
    : isCorrect
      ? 'Correct'
      : isIncorrect
        ? 'Not Quite... Try Again!'
        : responseIsReady(question, attemptState)
          ? 'Ready to submit'
          : 'Answer required'

  return (
    <article className="quiz-stage" style={{ '--deck-accent': deck.accent } as CSSProperties}>
      <div className="quiz-header">
          <div>
            <p className="eyebrow">Quiz set - Deck {deck.number}</p>
            <h3>{deck.title}</h3>
          </div>
        <div className="quiz-header-actions">
          <div className="quiz-score-card" aria-label={`Score ${score} of ${answeredCount}, ${scorePercent}%`}>
            <span><i className="fa-solid fa-chart-simple" aria-hidden={true} /> Score</span>
            <strong>{score} / {answeredCount}</strong>
            <small>Score: {score}/{answeredCount} ({scorePercent}%) - {cheatedCount} revealed</small>
          </div>
          <button className="ghost-button" type="button" onClick={onReset}>
            <RefreshCcw size={16} aria-hidden={true} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="quiz-card" key={`${deck.id}-quiz-${quizIndex}`}>
        <div className="question-index">
          <span className="question-number-badge">Question {quizIndex + 1} / {total}</span>
          <span className="quiz-type-badge">{question.quizType.replaceAll('-', ' ')}</span>
          <span>{answeredState}</span>
        </div>
        <div className="quiz-question-block">
          <p>{renderRichText(question.setup)}</p>
          <h3>{renderRichText(question.questionText)}</h3>
        </div>

        {question.codeSnippet && (
          <pre className="quiz-code-snippet" aria-label="Question code snippet">
            <code dangerouslySetInnerHTML={{ __html: normalizeCodeSnippetHTML(question.codeSnippet) }} />
          </pre>
        )}

        <div className="quiz-workbench">
          <div className="answer-column">
            <QuizQuestionInput
              question={question}
              attemptState={attemptState}
              cheated={cheated}
              status={status}
              onChoose={onChoose}
              onMatchChange={onMatchChange}
              onToggleVisual={onToggleVisual}
            />
          </div>
        </div>

        <div className="quiz-action-bar" aria-label="Quiz navigation and submission controls">
          <div className="quiz-flow-controls" aria-label="Question flow controls">
            <button className="icon-button" disabled={quizIndex <= 0} onClick={onPrevious} type="button">
              <ArrowLeft size={18} aria-hidden={true} />
              <span>Previous</span>
            </button>
            {!isCorrect && !cheated && (
              <button
                className={`submit-button ${canRetry ? 'is-retry' : ''}`}
                disabled={canRetry ? false : !canSubmit}
                onClick={canRetry ? onRetry : onSubmit}
                type="button"
              >
                {canRetry ? <RefreshCcw size={18} aria-hidden={true} /> : <Check size={18} aria-hidden={true} />}
                <span>{canRetry ? 'Retry Answer' : 'Submit Answer'}</span>
              </button>
            )}
            <button className="icon-button" disabled={!canAdvance} onClick={onNext} type="button">
              <span>Next</span>
              <ArrowRight size={18} aria-hidden={true} />
            </button>
          </div>
          <button className="cheat-button" disabled={cheated || attemptState.showNextButton} onClick={onRevealCorrect} type="button">
            <Eye size={16} aria-hidden={true} />
            <span>Correct answer: {cheated || attemptState.showNextButton ? correctLabel : 'Reveal'}</span>
          </button>
        </div>

        {hasFeedback && (
          <div
            aria-live="polite"
            className={`explanation-panel is-visible ${isCorrect ? 'is-correct' : ''} ${isIncorrect ? 'is-wrong' : ''}`}
          >
            <p className="eyebrow">
              <i className={`fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} aria-hidden={true} />
              {' '}
              {isCorrect ? 'Correct!' : 'Not Quite... Try Again!'}
            </p>
            <p>{renderRichText(primaryFeedback(question, attemptState))}</p>
          </div>
        )}

        <QuizFeedbackGrid hasFeedback={hasFeedback} question={question} attemptState={attemptState} />
      </div>

      <div className="quiz-timeline" aria-label="Quiz question selector">
        {Array.from({ length: total }).map((_, index) => (
          <button
            aria-label={`Go to quiz question ${index + 1}`}
            className={index === quizIndex ? 'is-active' : ''}
            key={`${deck.id}-quiz-selector-${index}`}
            onClick={() => onJump(index)}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </div>
    </article>
  )
}

export function QuizSummaryStage({
  deck,
  states,
  score,
  attempted,
  cheatedCount,
  scorePercent,
  onPrevious,
  onReset,
  onJump,
}: {
  deck: Deck
  states: SlideAttemptState[]
  score: number
  attempted: number
  cheatedCount: number
  scorePercent: number
  onPrevious: () => void
  onReset: () => void
  onJump: (index: number) => void
}) {
  const total = states.length
  const completionPercent = total > 0 ? Math.round((attempted / total) * 100) : 0
  const circleStyle = { '--summary-percent': `${scorePercent * 3.6}deg` } as CSSProperties

  return (
    <article className="quiz-stage" style={{ '--deck-accent': deck.accent } as CSSProperties}>
      <section className="quiz-summary-card">
        <div className="summary-hero">
          <div className="summary-score-ring" style={circleStyle} aria-label={`Final score ${score} of ${attempted}`}>
            <div>
              <span>{scorePercent}%</span>
              <small>first attempt</small>
            </div>
          </div>
          <div>
            <p className="eyebrow">Final score summary</p>
            <h3>{deck.title}</h3>
            <p>
              Score: {score}/{attempted} ({scorePercent}%). This score counts only questions answered correctly on the first
              submitted attempt, so retries preserve learning without inflating the first-pass measure.
            </p>
          </div>
        </div>

        <div className="summary-stat-grid">
          <div>
            <i className="fa-solid fa-bullseye" aria-hidden={true} />
            <span>{score}</span>
            <small>first-attempt correct</small>
          </div>
          <div>
            <i className="fa-solid fa-pen-to-square" aria-hidden={true} />
            <span>{attempted}</span>
            <small>attempted this session</small>
          </div>
          <div>
            <i className="fa-solid fa-layer-group" aria-hidden={true} />
            <span>{completionPercent}%</span>
            <small>quiz completion</small>
          </div>
          <div>
            <i className="fa-solid fa-eye" aria-hidden={true} />
            <span>{cheatedCount}</span>
            <small>answers revealed</small>
          </div>
        </div>

        <div className="summary-review-grid" aria-label="Per-question attempt review">
          {states.map((state, index) => {
            const stateLabel = state.interactiveState?.cheated
              ? 'revealed'
              : state.firstAttemptCorrect
                ? 'first try'
                : state.attempts > 0 && state.showNextButton
                  ? 'solved after retry'
                  : state.attempts > 0
                    ? 'needs retry'
                    : 'not attempted'
            return (
              <button
                className={`${state.firstAttemptCorrect ? 'is-correct' : ''} ${state.interactiveState?.cheated ? 'is-revealed' : ''}`}
                key={`${deck.id}-summary-${index}`}
                onClick={() => onJump(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{stateLabel}</strong>
                <small>{state.attempts} attempt{state.attempts === 1 ? '' : 's'}</small>
              </button>
            )
          })}
        </div>

        <div className="quiz-action-bar summary-actions" aria-label="Summary controls">
          <div className="quiz-flow-controls" aria-label="Summary flow controls">
            <button className="icon-button" onClick={onPrevious} type="button">
              <ArrowLeft size={18} aria-hidden={true} />
              <span>Previous</span>
            </button>
            <button className="submit-button is-retry" onClick={onReset} type="button">
              <RefreshCcw size={18} aria-hidden={true} />
              <span>Reset Quiz</span>
            </button>
          </div>
        </div>
      </section>
    </article>
  )
}