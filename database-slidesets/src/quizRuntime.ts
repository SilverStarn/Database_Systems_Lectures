import type {
  InteractiveMatchComponent,
  InteractiveVisualComponent,
  QuizInteractiveComponent,
  RichQuizQuestion,
} from './quizContent'

export type QuizStatus = 'idle' | 'incorrect' | 'correct'
export type UserAnswer = string | number[] | Record<string, string> | undefined
export type InteractiveAttemptState = {
  visualSelection?: number[]
  matchValues?: Record<string, string>
  disabledOptionValues?: string[]
  disabledVisualIndices?: number[]
  disabledMatchValues?: Record<string, string[]>
  cheated?: boolean
}
export type SlideAttemptState = {
  userAnswer: UserAnswer
  attempts: number
  firstAttemptCorrect: boolean
  lastAttemptCorrect: boolean
  feedbackHTML: string
  showNextButton: boolean
  feedbackVisible: boolean
  interactiveState?: InteractiveAttemptState
}
export type SlideAttemptStatesByDeck = Record<string, SlideAttemptState[] | undefined>

export function isVisualComponent(component: QuizInteractiveComponent | undefined): component is InteractiveVisualComponent {
  return Boolean(component && 'nodes' in component && 'correctIndices' in component)
}

export function isMatchComponent(component: QuizInteractiveComponent | undefined): component is InteractiveMatchComponent {
  return Boolean(component && 'items' in component && 'correctPairs' in component)
}

export function createAttemptState(): SlideAttemptState {
  return {
    userAnswer: undefined,
    attempts: 0,
    firstAttemptCorrect: false,
    lastAttemptCorrect: false,
    feedbackHTML: '',
    showNextButton: false,
    feedbackVisible: false,
    interactiveState: {},
  }
}

export function normalizeAttemptStates(states: SlideAttemptState[] | undefined, length: number) {
  return Array.from({ length }, (_, index) => states?.[index] ?? createAttemptState())
}

export function selectedOptionValue(state: SlideAttemptState | undefined) {
  return typeof state?.userAnswer === 'string' ? state.userAnswer : undefined
}

export function visualSelection(state: SlideAttemptState | undefined) {
  return state?.interactiveState?.visualSelection ?? (Array.isArray(state?.userAnswer) ? state.userAnswer : [])
}

export function matchValues(state: SlideAttemptState | undefined) {
  if (state?.interactiveState?.matchValues) return state.interactiveState.matchValues
  if (state?.userAnswer && typeof state.userAnswer === 'object' && !Array.isArray(state.userAnswer)) {
    return state.userAnswer as Record<string, string>
  }
  return {}
}

function arraysMatch(left: number[] = [], right: number[] = []) {
  if (left.length !== right.length) return false
  const leftSorted = [...left].sort((a, b) => a - b)
  const rightSorted = [...right].sort((a, b) => a - b)
  return leftSorted.every((value, index) => value === rightSorted[index])
}

export function responseIsReady(question: RichQuizQuestion, state: SlideAttemptState | undefined) {
  if (!state) return false
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    return Boolean(selectedOptionValue(state))
  }
  if (isVisualComponent(question.interactiveComponent)) {
    return Boolean(visualSelection(state).length)
  }
  if (isMatchComponent(question.interactiveComponent)) {
    const values = matchValues(state)
    return question.interactiveComponent.items.every((item) => Boolean(values[item.id]))
  }
  return false
}

export function responseIsCorrect(question: RichQuizQuestion, state: SlideAttemptState | undefined) {
  if (!state) return false
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    return selectedOptionValue(state) === question.correctAnswer
  }
  if (isVisualComponent(question.interactiveComponent)) {
    const handler = interactiveHandlers[question.interactiveComponent.type]
    return handler?.isCorrect(visualSelection(state), question.interactiveComponent) ?? false
  }
  if (isMatchComponent(question.interactiveComponent)) {
    const handler = interactiveHandlers[question.interactiveComponent.type]
    return handler?.isCorrect(matchValues(state), question.interactiveComponent) ?? false
  }
  return false
}

export function responseCanAdvance(state: SlideAttemptState | undefined) {
  return Boolean(state?.showNextButton || state?.interactiveState?.cheated)
}

export function correctAnswerLabel(question: RichQuizQuestion) {
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    const answerIndex = question.options?.findIndex((option) => option.value === question.correctAnswer) ?? -1
    const answer = question.options?.[answerIndex]
    if (question.quizType === 'multiple-choice' && answerIndex >= 0) return String.fromCharCode(65 + answerIndex)
    return answer?.text ?? String(question.correctAnswer)
  }
  if (isVisualComponent(question.interactiveComponent)) {
    return question.interactiveComponent.correctIndices.map((index) => index + 1).join(', ')
  }
  if (isMatchComponent(question.interactiveComponent)) {
    return 'matched pairs'
  }
  return 'revealed'
}

export function selectedFeedbackValues(question: RichQuizQuestion, state: SlideAttemptState | undefined) {
  if (!state) return []
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    const selected = selectedOptionValue(state)
    return selected ? [selected] : []
  }
  if (isVisualComponent(question.interactiveComponent)) {
    return visualSelection(state).map((index) => `node-${index}`)
  }
  if (isMatchComponent(question.interactiveComponent)) {
    return question.interactiveComponent.items.map((item) => item.id)
  }
  return []
}

export function explanationFeedbackItems(question: RichQuizQuestion) {
  return question.explanation.optionsFeedback ?? []
}

export function correctFeedbackValues(question: RichQuizQuestion) {
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    return new Set([String(question.correctAnswer)])
  }
  if (isVisualComponent(question.interactiveComponent)) {
    return new Set(question.interactiveComponent.correctIndices.map((index) => `node-${index}`))
  }
  if (isMatchComponent(question.interactiveComponent)) {
    return new Set(question.interactiveComponent.items.map((item) => item.id))
  }
  return new Set<string>()
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function incorrectFeedbackFor(question: RichQuizQuestion, state: SlideAttemptState | undefined) {
  if (!state) return question.explanation.incorrectBase

  if (isVisualComponent(question.interactiveComponent)) {
    const component = question.interactiveComponent
    const selected = visualSelection(state)
    const required = component.correctIndices
    const selectedRequiredCount = selected.filter((index) => required.includes(index)).length
    const extraCount = selected.filter((index) => !required.includes(index)).length
    const missingCount = Math.max(required.length - selectedRequiredCount, 0)
    const selectionSummary =
      extraCount > 0
        ? `Your current proof set includes ${countLabel(extraCount, 'extra node')} that does not belong in this exact reasoning path.`
        : missingCount > 0
          ? `Your current proof set contains relevant evidence, but it is missing ${countLabel(missingCount, 'required node')}.`
          : 'Your current proof set needs to be checked as a complete set, not as isolated useful nodes.'

    return `<strong>Recheck the complete proof set:</strong> ${selectionSummary} This interaction grades the whole selected set, so one individually relevant node can still be part of an incorrect submission when the other necessary evidence is absent. The correct nodes stay hidden until you solve the diagram or use reveal.`
  }

  if (isMatchComponent(question.interactiveComponent)) {
    const component = question.interactiveComponent
    const values = matchValues(state)
    const wrongPairs = component.items.filter((item) => values[item.id] && values[item.id] !== component.correctPairs[item.id]).length
    const missingPairs = component.items.filter((item) => !values[item.id]).length
    const pairSummary =
      wrongPairs > 0
        ? `${countLabel(wrongPairs, 'pairing')} conflicts with the role it must play in this scenario.`
        : `${countLabel(missingPairs, 'pairing')} still needs a role before the full mapping is valid.`
    return `<strong>Recheck the mapping:</strong> ${pairSummary} A matching answer is correct only when every left-side item is assigned to the role that preserves the scenario logic. The correct pairing remains hidden during retry.`
  }

  return question.explanation.incorrectBase
}

export function primaryFeedback(question: RichQuizQuestion, state: SlideAttemptState | undefined) {
  if (!state?.feedbackVisible && !state?.showNextButton && !state?.interactiveState?.cheated) {
    return 'Answer the prompt, then submit. Detailed feedback will explain why the chosen path works or where the reasoning breaks.'
  }
  if (state.feedbackVisible) return incorrectFeedbackFor(question, state)
  if (state.showNextButton || state.interactiveState?.cheated) return question.explanation.correct
  return question.explanation.incorrectBase
}

export function correctAnswerPatch(question: RichQuizQuestion): Partial<SlideAttemptState> {
  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    return { userAnswer: String(question.correctAnswer) }
  }
  if (isVisualComponent(question.interactiveComponent)) {
    return {
      userAnswer: [...question.interactiveComponent.correctIndices],
      interactiveState: { visualSelection: [...question.interactiveComponent.correctIndices] },
    }
  }
  if (isMatchComponent(question.interactiveComponent)) {
    return {
      userAnswer: { ...question.interactiveComponent.correctPairs },
      interactiveState: { matchValues: { ...question.interactiveComponent.correctPairs } },
    }
  }
  return {}
}

export function disabledStateAfterRetry(question: RichQuizQuestion, state: SlideAttemptState): InteractiveAttemptState {
  const nextState: InteractiveAttemptState = {
    ...state.interactiveState,
  }

  if (question.quizType === 'multiple-choice' || question.quizType === 'true-false') {
    const selected = selectedOptionValue(state)
    return {
      ...nextState,
      disabledOptionValues: selected
        ? Array.from(new Set([...(nextState.disabledOptionValues ?? []), selected]))
        : nextState.disabledOptionValues,
    }
  }

  if (isVisualComponent(question.interactiveComponent)) {
    const component = question.interactiveComponent
    const selected = visualSelection(state).filter((index) => !component.correctIndices.includes(index))
    return {
      ...nextState,
      visualSelection: [],
      disabledVisualIndices: Array.from(new Set([...(nextState.disabledVisualIndices ?? []), ...selected])),
    }
  }

  if (isMatchComponent(question.interactiveComponent)) {
    const component = question.interactiveComponent
    const currentValues = matchValues(state)
    const disabledMatchValues = { ...(nextState.disabledMatchValues ?? {}) }
    Object.entries(currentValues).forEach(([itemId, value]) => {
      if (!value) return
      if (component.correctPairs[itemId] === value) return
      disabledMatchValues[itemId] = Array.from(new Set([...(disabledMatchValues[itemId] ?? []), value]))
    })
    return {
      ...nextState,
      matchValues: {},
      disabledMatchValues,
    }
  }

  return nextState
}

export type InteractiveHandler<ComponentData extends QuizInteractiveComponent = QuizInteractiveComponent> = {
  init: (slideDOM: HTMLElement | null, componentData: ComponentData, attemptState: SlideAttemptState) => void
  getUserAnswer: (slideDOM: HTMLElement | null, componentData: ComponentData, attemptState: SlideAttemptState) => UserAnswer
  isCorrect: (userAnswer: UserAnswer, componentData: ComponentData) => boolean
  showFeedback: (
    slideDOM: HTMLElement | null,
    userAnswer: UserAnswer,
    isCorrectThisAttempt: boolean,
    componentData: ComponentData,
    attemptState: SlideAttemptState,
  ) => void
}

function applyClassToken(element: Element | null, classToken: string, shouldAdd: boolean) {
  if (!element || /\s/.test(classToken) || classToken.length === 0) return
  if (shouldAdd) element.classList.add(classToken)
  else element.classList.remove(classToken)
}

const visualInteractiveHandler: InteractiveHandler<InteractiveVisualComponent> = {
  init(slideDOM, _componentData, attemptState) {
    slideDOM?.querySelectorAll('[data-interactive-node]').forEach((element, index) => {
      applyClassToken(element, 'is-correct', false)
      applyClassToken(element, 'is-wrong', false)
      applyClassToken(element, 'is-selected', visualSelection(attemptState).includes(index))
    })
  },
  getUserAnswer(_slideDOM, _componentData, attemptState) {
    return visualSelection(attemptState)
  },
  isCorrect(userAnswer, componentData) {
    return Array.isArray(userAnswer) && arraysMatch(userAnswer, componentData.correctIndices)
  },
  showFeedback(slideDOM, userAnswer, isCorrectThisAttempt, componentData) {
    const selected = Array.isArray(userAnswer) ? userAnswer : []
    slideDOM?.querySelectorAll('[data-interactive-node]').forEach((element, index) => {
      applyClassToken(
        element,
        'is-wrong',
        !isCorrectThisAttempt && selected.includes(index) && !componentData.correctIndices.includes(index),
      )
      applyClassToken(element, 'is-correct', isCorrectThisAttempt && componentData.correctIndices.includes(index))
    })
  },
}

const matchingInteractiveHandler: InteractiveHandler<InteractiveMatchComponent> = {
  init(slideDOM, _componentData, attemptState) {
    slideDOM?.querySelectorAll('[data-match-row]').forEach((element) => {
      applyClassToken(element, 'is-correct', false)
      applyClassToken(element, 'is-wrong', false)
      applyClassToken(element, 'is-restored', Boolean(attemptState.userAnswer))
    })
  },
  getUserAnswer(_slideDOM, _componentData, attemptState) {
    return matchValues(attemptState)
  },
  isCorrect(userAnswer, componentData) {
    if (!userAnswer || typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false
    const values = userAnswer as Record<string, string>
    return componentData.items.every((item) => values[item.id] === componentData.correctPairs[item.id])
  },
  showFeedback(slideDOM, userAnswer, isCorrectThisAttempt, componentData) {
    if (!userAnswer || typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return
    const values = userAnswer as Record<string, string>
    slideDOM?.querySelectorAll('[data-match-row]').forEach((element) => {
      const itemId = element.getAttribute('data-match-row')
      const isCorrectPair = Boolean(itemId && values[itemId] === componentData.correctPairs[itemId])
      applyClassToken(element, 'is-wrong', !isCorrectThisAttempt && !isCorrectPair)
      applyClassToken(element, 'is-correct', isCorrectThisAttempt && isCorrectPair)
    })
  },
}

export const interactiveHandlers: Record<string, InteractiveHandler> = {
  'flow-reasoning-selector': visualInteractiveHandler,
  'sets-reasoning-selector': visualInteractiveHandler,
  'dependency-reasoning-selector': visualInteractiveHandler,
  'storage-reasoning-selector': visualInteractiveHandler,
  'network-reasoning-selector': visualInteractiveHandler,
  'grouping-reasoning-selector': visualInteractiveHandler,
  'flow-concept-role-match': matchingInteractiveHandler,
  'sets-concept-role-match': matchingInteractiveHandler,
  'dependency-concept-role-match': matchingInteractiveHandler,
  'storage-concept-role-match': matchingInteractiveHandler,
  'network-concept-role-match': matchingInteractiveHandler,
  'grouping-concept-role-match': matchingInteractiveHandler,
}
