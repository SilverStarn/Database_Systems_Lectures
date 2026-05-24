import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import type { InteractiveMatchComponent, InteractiveVisualComponent, RichQuizQuestion } from './quizContent'
import {
  correctFeedbackValues,
  explanationFeedbackItems,
  interactiveHandlers,
  isMatchComponent,
  isVisualComponent,
  matchValues,
  selectedFeedbackValues,
  selectedOptionValue,
  visualSelection,
  type InteractiveHandler,
  type QuizStatus,
  type SlideAttemptState,
} from './quizRuntime'
import { plainText, renderRichText } from './richText'

export function QuizQuestionInput({
  question,
  attemptState,
  status,
  cheated,
  onChoose,
  onToggleVisual,
  onMatchChange,
}: {
  question: RichQuizQuestion
  attemptState: SlideAttemptState
  status: QuizStatus
  cheated: boolean
  onChoose: (value: string) => void
  onToggleVisual: (index: number) => void
  onMatchChange: (itemId: string, value: string) => void
}) {
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    const options = question.options ?? []
    return (
      <div className={`answer-grid ${question.quizType === 'true-false' ? 'is-boolean' : ''}`}>
        {options.map((option, index) => {
          const isSelected = selectedOptionValue(attemptState) === option.value
          const isDisabledByRetry = Boolean(attemptState.interactiveState?.disabledOptionValues?.includes(option.value))
          const isCorrectOption = question.correctAnswer === option.value
          const showCorrect = (status === 'correct' || cheated) && isCorrectOption
          const showWrong = status === 'incorrect' && isSelected && !isCorrectOption
          return (
            <button
              aria-pressed={isSelected}
              className={`answer-option ${isSelected ? 'is-selected' : ''} ${showCorrect ? 'is-correct' : ''} ${showWrong ? 'is-wrong' : ''} ${
                cheated && isCorrectOption ? 'is-cheat' : ''
              } ${isDisabledByRetry ? 'is-disabled-by-retry' : ''}`}
              disabled={status === 'correct' || status === 'incorrect' || cheated || isDisabledByRetry}
              key={option.value}
              onClick={() => onChoose(option.value)}
              type="button"
            >
              <span>{question.quizType === 'true-false' ? (option.value === 'true' ? 'T' : 'F') : String.fromCharCode(65 + index)}</span>
              <strong>{renderRichText(option.text)}</strong>
              {showCorrect && <Check size={18} aria-hidden={true} />}
              {showWrong && <X size={18} aria-hidden={true} />}
            </button>
          )
        })}
      </div>
    )
  }

  if (isVisualComponent(question.interactiveComponent)) {
    return (
      <InteractiveVisualQuestion
        component={question.interactiveComponent}
        attemptState={attemptState}
        status={status}
        cheated={cheated}
        onToggleVisual={onToggleVisual}
      />
    )
  }

  if (isMatchComponent(question.interactiveComponent)) {
    return (
      <MatchingQuestion
        component={question.interactiveComponent}
        attemptState={attemptState}
        status={status}
        cheated={cheated}
        onMatchChange={onMatchChange}
      />
    )
  }

  return null
}

function InteractiveVisualQuestion({
  component,
  attemptState,
  status,
  cheated,
  onToggleVisual,
}: {
  component: InteractiveVisualComponent
  attemptState: SlideAttemptState
  status: QuizStatus
  cheated: boolean
  onToggleVisual: (index: number) => void
}) {
  const slideRef = useRef<HTMLElement | null>(null)
  const selected = visualSelection(attemptState)
  const locked = status === 'correct' || cheated

  useEffect(() => {
    const handler = interactiveHandlers[component.type] as InteractiveHandler<InteractiveVisualComponent> | undefined
    handler?.init(slideRef.current, component, attemptState)
    if (status !== 'idle' || cheated) {
      const userAnswer = handler?.getUserAnswer(slideRef.current, component, attemptState) ?? selected
      handler?.showFeedback(slideRef.current, userAnswer, status === 'correct' || cheated, component, attemptState)
    }
  }, [attemptState, cheated, component, selected, status])

  return (
    <section className="interactive-question-card" aria-label={component.title} ref={slideRef}>
      <div className="interactive-question-head">
        <div>
          <p className="eyebrow">Diagram interaction</p>
          <h4>{renderRichText(component.title)}</h4>
        </div>
        <span>{selected.length} selected</span>
      </div>
      <p>{renderRichText(component.instructions)}</p>
      <div className="interactive-node-grid">
        {component.nodes.map((node, index) => {
          const isSelected = selected.includes(index)
          const isDisabledByRetry = Boolean(attemptState.interactiveState?.disabledVisualIndices?.includes(index))
          const isRequired = component.correctIndices.includes(index)
          const showCorrect = (status === 'correct' || cheated) && isRequired
          const showWrong = status === 'incorrect' && isSelected && !isRequired
          return (
            <button
              aria-pressed={isSelected}
              className={`${isSelected ? 'is-selected' : ''} ${showCorrect ? 'is-correct' : ''} ${showWrong ? 'is-wrong' : ''} ${
                isDisabledByRetry ? 'is-disabled-by-retry' : ''
              }`}
              data-interactive-node={index}
              disabled={locked || status === 'incorrect' || isDisabledByRetry}
              key={node.value}
              onClick={() => onToggleVisual(index)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(node.label)}</strong>
              <small>{renderRichText(node.detail)}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MatchingQuestion({
  component,
  attemptState,
  status,
  cheated,
  onMatchChange,
}: {
  component: InteractiveMatchComponent
  attemptState: SlideAttemptState
  status: QuizStatus
  cheated: boolean
  onMatchChange: (itemId: string, value: string) => void
}) {
  const slideRef = useRef<HTMLElement | null>(null)
  const locked = status === 'correct' || cheated
  const values = matchValues(attemptState)

  useEffect(() => {
    const handler = interactiveHandlers[component.type] as InteractiveHandler<InteractiveMatchComponent> | undefined
    handler?.init(slideRef.current, component, attemptState)
    if (status !== 'idle' || cheated) {
      const userAnswer = handler?.getUserAnswer(slideRef.current, component, attemptState) ?? values
      handler?.showFeedback(slideRef.current, userAnswer, status === 'correct' || cheated, component, attemptState)
    }
  }, [attemptState, cheated, component, status, values])

  return (
    <section className="matching-question-card" aria-label="Match each concept to the correct role" ref={slideRef}>
      <div className="matching-head">
        <p className="eyebrow">Pairing interaction</p>
        <span>{component.items.length} pairs</span>
      </div>
      <div className="matching-grid">
        {component.items.map((item, index) => {
          const selectedValue = values[item.id] ?? ''
          const isCorrectPair = selectedValue === component.correctPairs[item.id]
          const showWrong = status === 'incorrect' && Boolean(selectedValue) && !isCorrectPair
          return (
            <label
              className={`${isCorrectPair && (status === 'correct' || cheated) ? 'is-correct' : ''} ${showWrong ? 'is-wrong' : ''}`}
              data-match-row={item.id}
              key={item.id}
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(item.label)}</strong>
              <small>{renderRichText(item.detail)}</small>
              <select
                aria-label={`Choose matching role for ${item.label}`}
                disabled={locked || status === 'incorrect'}
                onChange={(event) => onMatchChange(item.id, event.target.value)}
                value={selectedValue}
              >
                <option value="">Select role</option>
                {component.choices.map((choice) => (
                  <option
                    disabled={Boolean(attemptState.interactiveState?.disabledMatchValues?.[item.id]?.includes(choice.value))}
                    key={choice.value}
                    value={choice.value}
                  >
                    {plainText(choice.text)}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export function QuizFeedbackGrid({
  question,
  attemptState,
  hasFeedback,
}: {
  question: RichQuizQuestion
  attemptState: SlideAttemptState
  hasFeedback: boolean
}) {
  const selectedValues = new Set(selectedFeedbackValues(question, attemptState))
  const showCorrectReasoning = Boolean(attemptState.showNextButton || attemptState.interactiveState?.cheated)
  const isIncorrectRetryState = Boolean(attemptState.feedbackVisible && !showCorrectReasoning)
  const allFeedback = explanationFeedbackItems(question)
  const correctValues = showCorrectReasoning ? correctFeedbackValues(question) : new Set<string>()
  const feedbackItems =
    isIncorrectRetryState && (question.quizType === 'multiple-choice' || question.quizType === 'true-false')
      ? allFeedback.filter((feedback) => selectedValues.has(feedback.value) && !correctValues.has(feedback.value))
      : isIncorrectRetryState
        ? []
        : allFeedback

  if (!hasFeedback || feedbackItems.length === 0) return null

  return (
    <div className="option-feedback-grid is-visible">
      {feedbackItems.map((feedback, index) => {
        const isSelected = selectedValues.has(feedback.value)
        const isCorrectFeedback = correctValues.has(feedback.value)
        const feedbackLabel = isIncorrectRetryState
          ? 'Your submitted choice'
          : isCorrectFeedback && isSelected
            ? 'Solved rationale'
            : isCorrectFeedback
              ? 'Answer rationale'
              : isSelected
                ? 'Your choice'
                : 'Rationale'
        return (
          <article
            className={`${isCorrectFeedback ? 'is-correct' : ''} ${isSelected ? 'is-selected' : ''}`}
            key={feedback.value}
          >
            <div>
              <span>{index + 1}</span>
              <strong>{feedbackLabel}</strong>
            </div>
            <p>{renderRichText(feedback.detail)}</p>
          </article>
        )
      })}
    </div>
  )
}
