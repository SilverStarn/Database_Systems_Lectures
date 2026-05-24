import { useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Database, Eye, ShieldCheck, Zap } from 'lucide-react'
import { type AcademicSlideContent } from './academicContent'
import { type Deck } from './courseData'
import { normalizeInlineSymbols, plainText, renderMathAwareCode, renderRichText } from './richText'
import { clamp } from './studyState'
import { compactText } from './textUtils'
import {
  deckInteractiveBlueprints,
  deckVisualLabels,
  experimentSpecs,
  visualAtlasSpecs,
  type DeckVisualBlueprint,
  type ExperimentSpec,
  type VisualAtlasCard,
  type VisualFamily,
} from './visualModelData'

function detailAt(items: string[], index: number, fallback: string) {
  return items[index % Math.max(items.length, 1)] ?? fallback
}

export function AcademicStudyLayer({
  deck,
  content,
}: {
  deck: Deck
  content: AcademicSlideContent
}) {
  const [advancedIndex, setAdvancedIndex] = useState(0)
  const [requiredIndex, setRequiredIndex] = useState(0)
  const [atlasIndex, setAtlasIndex] = useState(0)
  const [reasoningStep, setReasoningStep] = useState(0)
  const [experimentStep, setExperimentStep] = useState(0)
  const currentStep = content.steps[reasoningStep] ?? content.steps[0]
  const currentAdvancedIndex = content.advancedSubtopics.length
    ? advancedIndex % content.advancedSubtopics.length
    : 0
  const currentRequiredIndex = content.subtopics.length
    ? requiredIndex % content.subtopics.length
    : 0

  return (
    <section className="academic-layer" aria-label="Academic slide expansion">
      <div className="subtopic-panel">
        <div className="subtopic-panel-head">
          <div>
            <p className="eyebrow">Required subtopics</p>
            <h4>Learn each topic as a dialogue: claim, objection, evidence, and transfer.</h4>
          </div>
          <span>{currentRequiredIndex + 1} active</span>
        </div>
        <div className="subtopic-list">
          {content.subtopics.map((subtopic, index) => (
            <article
              className={index === currentRequiredIndex ? 'is-active' : ''}
              key={`${subtopic.title}-${index}`}
              onClick={() => setRequiredIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setRequiredIndex(index)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="subtopic-title-row">
                <span>{index + 1}</span>
                <strong>{renderRichText(subtopic.title)}</strong>
              </div>
              <p>{renderRichText(subtopic.thesis)}</p>
              <dl>
                <div>
                  <dt><i className="fa-solid fa-question" aria-hidden="true" />Learner question</dt>
                  <dd>{renderRichText(subtopic.learnerQuestion)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-reply" aria-hidden="true" />Instructor answer</dt>
                  <dd>{renderRichText(subtopic.instructorAnswer)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-code" aria-hidden="true" />Mini example</dt>
                  <dd>{renderRichText(subtopic.miniExample)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-calculator" aria-hidden="true" />Numeric check</dt>
                  <dd>{renderRichText(subtopic.numericCheck)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-flask-vial" aria-hidden="true" />Stress test</dt>
                  <dd>{renderRichText(subtopic.stressTest)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-pen-ruler" aria-hidden="true" />Practice move</dt>
                  <dd>{renderRichText(subtopic.practiceMove)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="advanced-subtopic-panel">
        <div className="advanced-subtopic-head">
          <div>
            <p className="eyebrow">Advanced mastery extensions</p>
            <h4>Push each subtopic past recognition into design judgment.</h4>
          </div>
          <span>{currentAdvancedIndex + 1} active</span>
        </div>
        <div className="advanced-subtopic-grid">
          {content.advancedSubtopics.map((subtopic, index) => (
            <article
              className={index === currentAdvancedIndex ? 'is-active' : ''}
              key={subtopic.title}
              onClick={() => setAdvancedIndex(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setAdvancedIndex(index)
                }
              }}
            >
              <div className="advanced-subtopic-title">
                <span>{index + 1}</span>
                <strong>{renderRichText(subtopic.title)}</strong>
              </div>
              <p>{renderRichText(subtopic.whyItMatters)}</p>
              <dl>
                <div>
                  <dt><i className="fa-solid fa-layer-group" aria-hidden="true" />Advanced move</dt>
                  <dd>{renderRichText(subtopic.advancedMove)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-diagram-project" aria-hidden="true" />Applied pattern</dt>
                  <dd>{renderRichText(subtopic.appliedPattern)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />Failure mode</dt>
                  <dd>{renderRichText(subtopic.commonFailure)}</dd>
                </div>
                <div>
                  <dt><i className="fa-solid fa-dumbbell" aria-hidden="true" />Mastery drill</dt>
                  <dd>{renderRichText(subtopic.masteryDrill)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>

      <SubtopicVisualAtlas deck={deck} activeStep={atlasIndex} onStep={setAtlasIndex} />

      <div className="term-deck">
        <p className="eyebrow">Hover terms</p>
        <div className="term-grid">
          {content.terms.map((term) => (
            <article className="term-card" key={term.term} tabIndex={0}>
              <div>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                <strong>{renderRichText(term.term)}</strong>
              </div>
              <p>{renderRichText(term.definition)}</p>
              <div className="term-popover">
                <span>Analogy</span>
                <p>{renderRichText(term.analogy)}</p>
                <span>Diagnostic test</span>
                <p>{renderRichText(term.diagnostic)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="step-lab">
        <div className="step-lab-head">
          <div>
            <p className="eyebrow">Click-through reasoning</p>
            <h4>{renderRichText(currentStep.label)}</h4>
          </div>
          <span>{reasoningStep + 1} / {content.steps.length}</span>
        </div>
        <div className="reasoning-step-buttons">
          {content.steps.map((step, index) => (
            <button
              className={index === reasoningStep ? 'is-active' : ''}
              key={step.label}
              onClick={() => setReasoningStep(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
        <p>{renderRichText(currentStep.detail)}</p>
        <code>{renderMathAwareCode(currentStep.artifact)}</code>
      </div>

      <div className="example-drill-panel">
        <div className="example-drill-head">
          <div>
            <p className="eyebrow">Concrete example lab</p>
            <h4>Trace code, numbers, and meaning before trusting the concept.</h4>
          </div>
          <span>{content.exampleDrills.length} drills</span>
        </div>
        <div className="example-drill-grid">
          {content.exampleDrills.map((drill) => (
            <article key={drill.title}>
              <div className="example-drill-title">
                <i className="fa-solid fa-vial-circle-check" aria-hidden="true" />
                <strong>{renderRichText(drill.title)}</strong>
              </div>
              <p>{renderRichText(drill.scenario)}</p>
              <pre><code>{renderMathAwareCode(drill.code)}</code></pre>
              <ol>
                {drill.walkthrough.map((step) => (
                  <li key={step}>{renderRichText(step)}</li>
                ))}
              </ol>
              <div className="example-number-check">
                <span><i className="fa-solid fa-hashtag" aria-hidden="true" /> Number check</span>
                <strong>{renderRichText(drill.numericCheck)}</strong>
              </div>
              <p className="example-takeaway">{renderRichText(drill.takeaway)}</p>
            </article>
          ))}
        </div>
      </div>

      <InteractiveExperiment
        deck={deck}
        content={content}
        activeStep={experimentStep}
        onStep={setExperimentStep}
      />

      <div className="worked-example-panel">
        <div className="worked-copy">
          <p className="eyebrow">Worked example</p>
          <h4>{renderRichText(content.workedTitle)}</h4>
          <p>{renderRichText(content.workedExplanation)}</p>
        </div>
        <pre><code>{renderMathAwareCode(content.workedExample)}</code></pre>
      </div>

      <div className="misconception-panel">
        <p className="eyebrow">Common wrong model</p>
        <p>{renderRichText(content.misconception)}</p>
      </div>

      <div className="question-strip">
        <i className="fa-solid fa-question" aria-hidden="true" />
        <strong>{renderRichText(content.question)}</strong>
      </div>
    </section>
  )
}

function SubtopicVisualAtlas({
  deck,
  activeStep,
  onStep,
}: {
  deck: Deck
  activeStep: number
  onStep: (step: number) => void
}) {
  const cards = visualAtlasSpecs[deck.id] ?? visualAtlasSpecs.ddl
  const activeIndex = clamp(activeStep, 0, cards.length - 1)
  const card = cards[activeIndex] ?? cards[0]

  return (
    <section className="visual-atlas" aria-label={`${deck.title} subtopic visual atlas`}>
      <div className="visual-atlas-head">
        <div>
          <p className="eyebrow">Subtopic visual atlas</p>
          <h4>{renderRichText(card.title)}</h4>
        </div>
        <span>{activeIndex + 1} / {cards.length}</span>
      </div>

      <div className="visual-atlas-tabs" aria-label="Choose subtopic diagram">
        {cards.map((item, index) => (
          <button
            className={index === activeIndex ? 'is-active' : ''}
            key={item.title}
            onClick={() => onStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{renderRichText(item.title)}</strong>
          </button>
        ))}
      </div>

      <div className="visual-atlas-body">
        <VisualAtlasGraphic card={card} activeIndex={activeIndex} />
        <div className="visual-atlas-copy">
          <p>{renderRichText(card.caption)}</p>
          <ul>
            {card.checkpoints.map((checkpoint) => (
              <li key={checkpoint}>
                <CheckCircle2 size={15} aria-hidden={true} />
                <span>{renderRichText(checkpoint)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function VisualAtlasGraphic({ card, activeIndex }: { card: VisualAtlasCard; activeIndex: number }) {
  const activeNode = activeIndex % Math.max(card.labels.length, 1)

  if (card.kind === 'pipeline' || card.kind === 'network') {
    return (
      <div className={`atlas-graphic atlas-${card.kind}`} aria-label={`${card.title} diagram`}>
        {card.labels.map((label, index) => (
          <div className={index <= activeNode ? 'is-active' : ''} key={`${card.title}-${label}`}>
            <span>{index + 1}</span>
            <strong>{renderRichText(label)}</strong>
          </div>
        ))}
      </div>
    )
  }

  if (card.kind === 'sets') {
    const isSubtypeMap = card.labels[0] === 'Product' && card.labels.some((label) => label === 'Laptop')
    if (isSubtypeMap) {
      return (
        <div className="atlas-graphic atlas-subtype-map" aria-label={`${card.title} subtype identity diagram`}>
          <div className="subtype-parent">
            <span>1</span>
            <strong>{renderRichText(card.labels[0] ?? 'Product')}</strong>
            <small>shared identity row</small>
          </div>
          <div className="subtype-connector" aria-hidden={true}>
            <span />
            <span />
            <span />
          </div>
          <div className="subtype-children">
            {card.labels.slice(1).map((label, index) => (
              <div className={index + 1 <= activeNode ? 'is-active' : ''} key={`${card.title}-${label}`}>
                <span>{index + 2}</span>
                <strong>{renderRichText(label)}</strong>
                <small>{index === 0 ? 'desktop facts' : index === 1 ? 'mobile facts' : 'printer facts'}</small>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="atlas-graphic atlas-sets" aria-label={`${card.title} set diagram`}>
        <div className="atlas-venn">
          <span>{renderRichText(card.labels[0] ?? 'A')}</span>
          <span>{renderRichText(card.labels[1] ?? 'B')}</span>
          <strong>{renderRichText(card.labels[2] ?? 'test')}</strong>
        </div>
        <div className="atlas-chip-column">
          {card.labels.slice(2).map((label, index) => (
            <span className={index + 2 <= activeNode ? 'is-active' : ''} key={`${card.title}-${label}`}>
              {renderRichText(label)}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (card.kind === 'index') {
    return (
      <div className="atlas-graphic atlas-index" aria-label={`${card.title} index diagram`}>
        <div className="atlas-tree-root">{renderRichText(card.labels[0] ?? 'Root')}</div>
        <div className="atlas-tree-branches">
          {(card.labels[1] ? [card.labels[1], card.labels[2] ?? 'Leaf'] : ['Internal', 'Leaf']).map((label) => (
            <span key={`${card.title}-${label}`}>{renderRichText(label)}</span>
          ))}
        </div>
        <div className="atlas-leaf-chain">
          {(card.labels.slice(2).length ? card.labels.slice(2) : ['Leaf A', 'Leaf B', 'Leaf C']).map((label, index) => (
            <span className={index <= activeNode ? 'is-active' : ''} key={`${card.title}-${label}`}>
              {renderRichText(label)}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`atlas-graphic atlas-${card.kind}`} aria-label={`${card.title} diagram`}>
      {card.labels.map((label, index) => (
        <div className={index <= activeNode ? 'is-active' : ''} key={`${card.title}-${label}`}>
          <span>{index + 1}</span>
          <strong>{renderRichText(label)}</strong>
        </div>
      ))}
    </div>
  )
}

function InteractiveExperiment({
  deck,
  content,
  activeStep,
  onStep,
}: {
  deck: Deck
  content: AcademicSlideContent
  activeStep: number
  onStep: (step: number) => void
}) {
  const spec = experimentSpecs[deck.id] ?? experimentSpecs.ddl
  const maxStep = content.steps.length - 1
  const safeStep = clamp(activeStep, 0, maxStep)
  const activeNodes = spec.nodes.filter((node) => node.stage <= safeStep).length
  const activeRows = spec.rows.filter((row) => row.stage <= safeStep).length

  function moveStep(delta: number) {
    onStep(clamp(safeStep + delta, 0, maxStep))
  }

  return (
    <section className="interactive-experiment" aria-label={`${deck.title} interactive experiment`}>
      <div className="experiment-header">
        <div>
          <p className="eyebrow">Interactive experiment</p>
          <h4>{renderRichText(spec.title)}</h4>
          <p>{renderRichText(spec.objective)}</p>
        </div>
        <div className="experiment-status" aria-label="Experiment status">
          <span>{activeNodes} nodes active</span>
          <span>{activeRows} rows explained</span>
        </div>
      </div>

      <div className="experiment-controls" aria-label="Experiment step controls">
        <button disabled={safeStep <= 0} onClick={() => moveStep(-1)} type="button">
          <ArrowLeft size={15} aria-hidden={true} />
          <span>Step back</span>
        </button>
        <div className="experiment-step-pills">
          {content.steps.map((step, index) => (
            <button
              aria-label={`Run experiment step ${index + 1}: ${step.label}.`}
              className={index === safeStep ? 'is-active' : ''}
              key={step.label}
              onClick={() => onStep(index)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(step.label)}</strong>
            </button>
          ))}
        </div>
        <button disabled={safeStep >= maxStep} onClick={() => moveStep(1)} type="button">
          <span>Step forward</span>
          <ArrowRight size={15} aria-hidden={true} />
        </button>
      </div>

      <div className="experiment-workbench">
        <div className="experiment-graph" aria-label={spec.pathLabel}>
          {spec.nodes.map((node, index) => (
            <button
              aria-label={`Show ${spec.pathLabel} stage ${node.stage + 1}: ${node.label}. ${node.detail}`}
              className={`experiment-node node-${node.kind} ${node.stage <= safeStep ? 'is-active' : ''} ${
                node.stage === safeStep ? 'is-current' : ''
              }`}
              key={`${node.label}-${index}`}
              onClick={() => onStep(clamp(node.stage, 0, maxStep))}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(node.label)}</strong>
              <small>{renderRichText(node.detail)}</small>
            </button>
          ))}
        </div>

        <div className="experiment-data">
          <div className="experiment-data-head">
            <div>
              <p className="eyebrow">{spec.tableLabel}</p>
              <h5>Evidence table</h5>
            </div>
            <span>Stage {safeStep + 1}</span>
          </div>

          <div className="experiment-columns" aria-hidden={true}>
            {spec.datasetColumns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>

          <div className="experiment-rows">
            {spec.rows.map((row) => (
              <article className={row.stage <= safeStep ? 'is-active' : ''} key={row.label}>
                <strong>{renderRichText(row.label)}</strong>
                <div>
                  {row.values.map((value) => (
                    <code key={value}>{normalizeInlineSymbols(value)}</code>
                  ))}
                </div>
                <span>{renderRichText(row.stage <= safeStep ? row.verdict : 'waiting for stage')}</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="experiment-lower-grid">
        <ol className="algorithm-trace" aria-label="Highlighted algorithm trace">
          {content.steps.map((step, index) => (
            <li className={index === safeStep ? 'is-current' : index < safeStep ? 'is-complete' : ''} key={step.label}>
              <span>{index + 1} </span>
              <div>
                <strong>{renderRichText(step.label)}</strong>
                {' '}
                <p>{renderRichText(spec.stepCaptions[index] ?? step.detail)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function AnimatedConceptLab({ deck, slide, activeIndex }: { deck: Deck; slide: Deck['slides'][number]; activeIndex: number }) {
  const spec = experimentSpecs[deck.id] ?? experimentSpecs.ddl
  const family = deckInteractiveBlueprints[deck.id]?.family ?? 'schema'
  const maxStep = Math.max(
    0,
    ...spec.nodes.map((node) => node.stage),
    ...spec.rows.map((row) => row.stage),
    ...spec.metrics.map((metric) => metric.stage),
    spec.stepCaptions.length - 1,
  )
  const variant = (activeIndex + Number(deck.number) - 1) % 6
  const [step, setStep] = useState(() => clamp(activeIndex % (maxStep + 1), 0, maxStep))
  const safeStep = clamp(step, 0, maxStep)
  const progress = maxStep > 0 ? (safeStep / maxStep) * 100 : 0
  const activeRow = spec.rows.filter((row) => row.stage <= safeStep).at(-1) ?? spec.rows[0]
  const phaseText = spec.stepCaptions[safeStep] ?? spec.objective
  const slideEvidence = [
    slide.body,
    ...(slide.bullets ?? []),
    slide.bridge ?? '',
    ...(slide.checks ?? []),
  ].filter(Boolean)
  const activeEvidence = detailAt(slideEvidence, safeStep, slide.body)
  const localChallenge = slide.checks?.[safeStep % Math.max(slide.checks.length, 1)]
    ?? slide.bullets?.[safeStep % Math.max(slide.bullets.length, 1)]
    ?? slide.bridge
    ?? slide.body

  function jumpToStep(nextStep: number) {
    setStep(clamp(nextStep, 0, maxStep))
  }

  return (
    <section
      className={`slide-specific-lab family-${family} deck-${deck.id} visual-style-${variant}`}
      style={{ '--motion-progress': `${progress}%` } as CSSProperties}
      aria-label={`${slide.title} slide-specific visual lab`}
    >
      <div className="specific-lab-head">
        <div>
          <p className="eyebrow">Slide-specific interaction</p>
          <h4>{renderRichText(slide.title)}</h4>
          <p>{renderRichText(compactText(slide.body, 170))}</p>
        </div>
        <span>{safeStep + 1} / {maxStep + 1}</span>
      </div>

      <div className="specific-phase-strip" aria-label="Choose slide visual phase">
        {spec.stepCaptions.slice(0, maxStep + 1).map((caption, index) => (
          <button
            aria-pressed={index === safeStep}
            className={index === safeStep ? 'is-active' : ''}
            key={`${slide.title}-${caption}-${index}`}
            onClick={() => jumpToStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{renderRichText(spec.nodes.find((node) => node.stage === index)?.label ?? `Phase ${index + 1}`)}</strong>
          </button>
        ))}
      </div>

      <div className="specific-primary-visual">
        <SlideSpecificVisualScene
          deck={deck}
          family={family}
          maxStep={maxStep}
          onStep={jumpToStep}
          safeStep={safeStep}
          slide={slide}
          spec={spec}
          variant={variant}
        />
      </div>

      <div className="specific-node-board" aria-label="Slide concept nodes">
        <div className="motion-path" aria-label={spec.pathLabel}>
          <span className="motion-track" aria-hidden={true} />
          <span className="motion-pulse" aria-hidden={true} />
          {spec.nodes.map((node, index) => (
            <button
              aria-pressed={node.stage === safeStep}
              className={`${node.stage < safeStep ? 'is-complete' : ''} ${node.stage === safeStep ? 'is-current' : ''} ${
                node.stage <= safeStep ? 'is-active' : ''
              } node-${node.kind}`}
              key={`${node.label}-${index}`}
              onClick={() => jumpToStep(node.stage)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(node.label)}</strong>
              <small>{renderRichText(node.detail)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="specific-evidence-board">
        <article className="specific-state-card">
          <span>{renderRichText(spec.tableLabel)}</span>
          <strong>{renderRichText(activeRow.label)}</strong>
          {activeRow.values.map((value) => (
            <code key={value}>{normalizeInlineSymbols(value)}</code>
          ))}
          <small>{renderRichText(activeRow.verdict)}</small>
        </article>

        <article className="specific-reason-card">
          <span>Slide-local reasoning</span>
          <p>{renderRichText(`${phaseText} ${compactText(activeEvidence, 180)}`)}</p>
        </article>
      </div>

      <div className="specific-challenge-panel">
        <span>Try this interaction</span>
        <strong>{renderRichText(localChallenge)}</strong>
        <p>{renderRichText(`Click a phase above, then explain exactly what changed in the ${deckInteractiveBlueprints[deck.id]?.artifact ?? 'database object'} for this slide.`)}</p>
      </div>
    </section>
  )
}

type SlideSpecificVisualSceneProps = {
  deck: Deck
  family: VisualFamily
  maxStep: number
  onStep: (step: number) => void
  safeStep: number
  slide: Deck['slides'][number]
  spec: ExperimentSpec
  variant: number
}

function slideConceptLabels(slide: Deck['slides'][number], spec: ExperimentSpec) {
  const termLabels = slide.terms?.map((term) => term.term) ?? []
  const bulletLabels = slide.bullets.map((bullet) => compactText(plainText(bullet), 44))
  const checkLabels = slide.checks?.map((check) => compactText(plainText(check), 44)) ?? []
  return [...termLabels, ...checkLabels, ...bulletLabels, ...spec.nodes.map((node) => node.label)].filter(Boolean)
}

function slideEvidenceDetails(slide: Deck['slides'][number], spec: ExperimentSpec) {
  const termLogic = slide.terms?.flatMap((term) => [term.definition, term.logic]) ?? []
  return [slide.body, slide.bridge ?? '', ...slide.bullets, ...(slide.checks ?? []), ...termLogic, ...spec.stepCaptions].filter(Boolean)
}

function tableSnapshotFor(family: VisualFamily, slide: Deck['slides'][number], safeStep: number) {
  const focus = compactText(plainText(slide.title), 42)
  const byFamily: Record<VisualFamily, { columns: string[]; before: string[][]; after: string[][]; reason: string }> = {
    schema: {
      columns: ['row', 'key evidence', 'state'],
      before: [['candidate', 'missing rule', 'uncertain'], ['stored fact', focus, 'unchecked']],
      after: [['candidate', safeStep >= 1 ? 'key named' : 'waiting', safeStep >= 3 ? 'rejected' : 'accepted'], ['stored fact', 'referential policy', 'auditable']],
      reason: 'Constraint logic turns a vague business sentence into a state transition that the DBMS can accept or reject.',
    },
    query: {
      columns: ['phase', 'row meaning', 'visible facts'],
      before: [['FROM', 'source rows', 'all columns'], ['WHERE', 'candidate rows', 'row predicates']],
      after: [['GROUP', safeStep >= 2 ? 'one row per group' : 'not grouped yet', 'aggregate evidence'], ['SELECT', focus, 'published names']],
      reason: 'The table shows why moving a predicate changes the logical object it can inspect.',
    },
    set: {
      columns: ['candidate', 'inner evidence', 'decision'],
      before: [['outer row', 'not probed', 'undecided'], ['matched row', 'join predicate', 'fanout risk']],
      after: [['outer row', safeStep >= 2 ? 'membership set built' : 'probing', 'kept if proof survives'], ['tie row', 'same maximum evidence', safeStep >= 3 ? 'kept' : 'waiting']],
      reason: 'Set and subquery reasoning is about proving membership without accidentally changing the answer grain.',
    },
    algebra: {
      columns: ['operator', 'schema effect', 'tuple effect'],
      before: [['base relation', 'full heading', 'all tuples'], ['selection', 'same heading', 'fewer tuples']],
      after: [['projection', safeStep >= 2 ? 'narrower heading' : 'full heading still visible', 'same surviving tuples'], ['join', 'combined heading', 'matched tuple pairs']],
      reason: 'Relational algebra is useful because every operator has a visible effect on rows, columns, or both.',
    },
    view: {
      columns: ['layer', 'exposed contract', 'hidden dependency'],
      before: [['base table', 'all facts', 'internal naming'], ['view SQL', focus, 'definition dependency']],
      after: [['consumer', 'stable columns', safeStep >= 2 ? 'base details hidden' : 'waiting'], ['update path', 'key-preserving only', 'ambiguity tested']],
      reason: 'A view is valuable only if it narrows what consumers rely on while keeping dependencies understandable.',
    },
    dependency: {
      columns: ['fact', 'determinant', 'anomaly test'],
      before: [['repeated fact', 'too wide key', 'update risk'], ['FD', focus, 'semantic rule']],
      after: [['split relation', safeStep >= 3 ? 'determinant isolated' : 'determinant still mixed in row', 'redundancy reduced'], ['join back', 'common key', 'lossless proof']],
      reason: 'Dependency work becomes concrete when repeated facts are moved to the key that actually determines them.',
    },
    routine: {
      columns: ['runtime point', 'owned logic', 'effect'],
      before: [['caller', 'parameters', 'request'], ['routine body', focus, 'controlled SQL']],
      after: [['condition', safeStep >= 2 ? 'checked' : 'waiting', 'branch chosen'], ['side effect', 'transaction boundary', 'logged or rolled back']],
      reason: 'Stored modules and triggers should make the timing and ownership of side effects explicit.',
    },
    storage: {
      columns: ['access object', 'physical state', 'cost signal'],
      before: [['heap page', 'many records', 'scan risk'], ['buffer frame', focus, 'hit or miss']],
      after: [['index leaf', safeStep >= 2 ? 'search narrowed' : 'not reached', 'fewer reads'], ['record fetch', 'RID located', 'final I/O']],
      reason: 'Physical design is visible when each step is described as a page movement, not just as a SQL phrase.',
    },
    network: {
      columns: ['layer', 'resource', 'failure avoided'],
      before: [['Java call', 'SQL text', 'injection risk'], ['driver', focus, 'translation boundary']],
      after: [['connection', safeStep >= 2 ? 'session opened' : 'not ready', 'network path'], ['result set', 'cursor lifetime', 'closed after read']],
      reason: 'JDBC reasoning improves when every object has a lifetime and a visible cleanup point.',
    },
    statistics: {
      columns: ['grain', 'measure', 'distortion check'],
      before: [['detail row', 'raw amount', 'fanout possible'], ['group row', focus, 'aggregate target']],
      after: [['measure', safeStep >= 2 ? 'computed after grouping' : 'waiting', 'one value per group'], ['filter', 'HAVING threshold', 'group-level test']],
      reason: 'Aggregate correctness depends on proving the unit of measurement before trusting the displayed number.',
    },
  }

  return byFamily[family]
}

function SlideSpecificVisualScene({
  deck,
  family,
  maxStep,
  onStep,
  safeStep,
  slide,
  spec,
  variant,
}: SlideSpecificVisualSceneProps) {
  const blueprint = deckInteractiveBlueprints[deck.id] ?? deckInteractiveBlueprints.ddl
  const labels = slideConceptLabels(slide, spec)
  const details = slideEvidenceDetails(slide, spec)
  const activeLabel = detailAt(labels, safeStep, slide.title)
  const activeDetail = detailAt(details, safeStep, slide.body)
  const snapshot = tableSnapshotFor(family, slide, safeStep)
  const maxUsableStep = Math.max(maxStep, 1)
  const deckMechanic = (
    <DeckMechanicPanel
      activeDetail={activeDetail}
      activeLabel={activeLabel}
      blueprint={blueprint}
      deck={deck}
      maxStep={maxStep}
      onStep={onStep}
      safeStep={safeStep}
    />
  )

  if (variant === 1) {
    return (
      <div className="specific-scene specific-table-scene" aria-label={`${slide.title} row transformation scene`}>
        <div className="scene-table-pair">
          <SceneTable title="Before the rule is applied" columns={snapshot.columns} rows={snapshot.before} />
          <button
            aria-label="Advance to the next transformation phase"
            className="scene-transform-button"
            onClick={() => onStep((safeStep + 1) % (maxStep + 1))}
            type="button"
          >
            <ArrowRight size={18} aria-hidden={true} />
            <span>Run next state</span>
          </button>
          <SceneTable title="After this slide's logic" columns={snapshot.columns} rows={snapshot.after} />
        </div>
        <article className="scene-explain-card">
          <span>Why this transition matters</span>
          <strong>{renderRichText(activeLabel)}</strong>
          <p>{renderRichText(`${snapshot.reason} ${compactText(activeDetail, 180)}`)}</p>
        </article>
        {deckMechanic}
      </div>
    )
  }

  if (variant === 2) {
    const pathLabels = blueprint.stages.slice(0, Math.min(6, maxStep + 2))
    return (
      <div className="specific-scene specific-flow-scene" aria-label={`${slide.title} causal flow scene`}>
        <div className="flow-rail">
          {pathLabels.map((label, index) => (
            <button
              className={`${index <= safeStep ? 'is-active' : ''} ${index === safeStep ? 'is-current' : ''}`}
              key={`${slide.title}-${label}`}
              onClick={() => onStep(clamp(index, 0, maxStep))}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(label)}</strong>
            </button>
          ))}
        </div>
        <div className="flow-state-meter" aria-hidden={true}>
          <i style={{ width: `${(safeStep / maxUsableStep) * 100}%` }} />
        </div>
        <div className="flow-detail-grid">
          <article>
            <span>Current object</span>
            <strong>{renderRichText(activeLabel)}</strong>
          </article>
          <article>
            <span>Observed change</span>
            <p>{renderRichText(compactText(activeDetail, 220))}</p>
          </article>
          <article>
            <span>Check before moving on</span>
            <p>{renderRichText(detailAt(slide.checks ?? slide.bullets, safeStep, `Explain what changed in the ${blueprint.artifact}.`))}</p>
          </article>
        </div>
        {deckMechanic}
      </div>
    )
  }

  if (variant === 3) {
    const activeRowIndex = safeStep % blueprint.matrixRows.length
    const activeColumnIndex = (safeStep + 1) % blueprint.matrixColumns.length
    return (
      <div className="specific-scene specific-matrix-scene" aria-label={`${slide.title} decision matrix scene`}>
        <div className="scene-matrix">
          <span />
          {blueprint.matrixColumns.map((column, index) => (
            <button
              className={index === activeColumnIndex ? 'is-active' : ''}
              key={column}
              onClick={() => onStep(index % (maxStep + 1))}
              type="button"
            >
              {renderRichText(column)}
            </button>
          ))}
          {blueprint.matrixRows.map((row, rowIndex) => (
            <div className="matrix-row-fragment" key={row}>
              <button
                className={rowIndex === activeRowIndex ? 'is-active' : ''}
                onClick={() => onStep(rowIndex % (maxStep + 1))}
                type="button"
              >
                {renderRichText(row)}
              </button>
              {blueprint.matrixColumns.map((column, columnIndex) => {
                const active = rowIndex === activeRowIndex && columnIndex === activeColumnIndex
                return (
                  <button
                    aria-label={`${row} against ${column}`}
                    className={active ? 'is-active' : ''}
                    key={`${row}-${column}`}
                    onClick={() => onStep((rowIndex + columnIndex) % (maxStep + 1))}
                    type="button"
                  >
                    {active ? 'inspect' : 'test'}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <article className="matrix-inspector-card">
          <span>Selected reasoning cell</span>
          <strong>{renderRichText(`${blueprint.matrixRows[activeRowIndex]} -> ${blueprint.matrixColumns[activeColumnIndex]}`)}</strong>
          <p>{renderRichText(compactText(activeDetail, 220))}</p>
        </article>
        {deckMechanic}
      </div>
    )
  }

  if (variant === 4) {
    return (
      <div className="specific-scene specific-network-scene" aria-label={`${slide.title} dependency network scene`}>
        <div className="network-board">
          {labels.slice(0, 6).map((label, index) => (
            <button
              className={`${index <= safeStep ? 'is-active' : ''} ${index === safeStep ? 'is-current' : ''}`}
              key={`${slide.title}-${label}-${index}`}
              onClick={() => onStep(index % (maxStep + 1))}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(label)}</strong>
            </button>
          ))}
        </div>
        <div className="network-causal-thread">
          <span>{renderRichText(blueprint.artifact)}</span>
          <strong>{renderRichText(activeLabel)}</strong>
          <p>{renderRichText(compactText(activeDetail, 220))}</p>
        </div>
        {deckMechanic}
      </div>
    )
  }

  if (variant === 5) {
    const metric = detailAt(blueprint.metrics, safeStep, blueprint.metrics[0])
    const action = detailAt(blueprint.actions, safeStep, blueprint.actions[0])
    return (
      <div className="specific-scene specific-simulator-scene" aria-label={`${slide.title} simulator scene`}>
        <div className="simulator-console">
          <article>
            <span>Input fact</span>
            <strong>{renderRichText(activeLabel)}</strong>
            <p>{renderRichText(compactText(slide.body, 130))}</p>
          </article>
          <button
            className="simulator-action"
            onClick={() => onStep((safeStep + 1) % (maxStep + 1))}
            type="button"
          >
            <Zap size={18} aria-hidden={true} />
            <span>{renderRichText(action)}</span>
          </button>
          <article>
            <span>Output signal</span>
            <strong>{renderRichText(metric)}</strong>
            <p>{renderRichText(compactText(activeDetail, 150))}</p>
          </article>
        </div>
        <div className="simulator-toggles" aria-label="Simulator stages">
          {spec.metrics.map((metricItem, index) => (
            <button
              className={metricItem.stage <= safeStep ? 'is-active' : ''}
              key={metricItem.label}
              onClick={() => onStep(clamp(metricItem.stage, 0, maxStep))}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(metricItem.label)}</strong>
            </button>
          ))}
        </div>
        {deckMechanic}
      </div>
    )
  }

  return (
    <div className="specific-scene specific-circuit-scene" aria-label={`${slide.title} constraint circuit scene`}>
      <MotionConceptGraphic deckId={deck.id} family={family} spec={spec} safeStep={safeStep} maxStep={maxStep} />
      <div className="circuit-overlay-panel">
        <span>Reasoning note</span>
        <strong>{renderRichText(activeLabel)}</strong>
        <p>{renderRichText(compactText(activeDetail, 180))}</p>
      </div>
      {deckMechanic}
    </div>
  )
}

function SceneTable({ columns, rows, title }: { columns: string[]; rows: string[][]; title: string }) {
  return (
    <article className="scene-mini-table">
      <span>{title}</span>
      <div style={{ '--table-columns': columns.length } as CSSProperties}>
        {columns.map((column) => (
          <strong key={column}>{renderRichText(column)}</strong>
        ))}
        {rows.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <p key={`${rowIndex}-${columnIndex}-${cell}`}>{renderRichText(cell)}</p>
          )),
        )}
      </div>
    </article>
  )
}

export function DeckMechanicPanel({
  activeDetail,
  activeLabel,
  blueprint,
  deck,
  maxStep,
  onStep,
  safeStep,
}: {
  activeDetail: string
  activeLabel: string
  blueprint: DeckVisualBlueprint
  deck: Deck
  maxStep: number
  onStep: (step: number) => void
  safeStep: number
}) {
  const stageCount = Math.max(maxStep + 1, 1)
  const labels = deckVisualLabels[deck.id] ?? blueprint.stages
  const stepFor = (index: number) => clamp(index % stageCount, 0, maxStep)
  const activeToken = detailAt(labels, safeStep, activeLabel)

  if (deck.id === 'ddl') {
    return (
      <section className="deck-mechanic-panel mechanic-ddl" aria-label="DDL constraint lock mechanic">
        <div className="mechanic-head">
          <span>Constraint lockboard</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="constraint-locks">
          {['identity', 'reference', 'domain', 'action'].map((lock, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={lock} onClick={() => onStep(stepFor(index))} type="button">
              <ShieldCheck size={16} aria-hidden={true} />
              <span>{lock}</span>
            </button>
          ))}
        </div>
        <p>{renderRichText(`A row enters only when each lock can explain the allowed state. ${compactText(activeDetail, 130)}`)}</p>
      </section>
    )
  }

  if (deck.id === 'dml') {
    const rowCounts = ['96 rows', '61 rows', '14 groups', '7 groups', '7 rows', 'sorted']
    return (
      <section className="deck-mechanic-panel mechanic-dml" aria-label="SQL clause conveyor mechanic">
        <div className="mechanic-head">
          <span>Clause conveyor</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="clause-conveyor">
          {blueprint.stages.slice(0, 6).map((stage, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={stage} onClick={() => onStep(stepFor(index))} type="button">
              <span>{renderRichText(stage.split(' ')[0])}</span>
              <strong>{rowCounts[index]}</strong>
            </button>
          ))}
        </div>
        <p>{renderRichText('Each click changes what kind of fact exists: source rows, filtered rows, groups, group predicates, named output, then display order.')}</p>
      </section>
    )
  }

  if (deck.id === 'joins-subqueries') {
    return (
      <section className="deck-mechanic-panel mechanic-set" aria-label="Join and subquery set radar mechanic">
        <div className="mechanic-head">
          <span>Set radar</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="set-radar">
          {['candidate', 'match', 'absence', 'tie'].map((probe, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={probe} onClick={() => onStep(stepFor(index))} type="button">
              <span>{index + 1}</span>
              <strong>{probe}</strong>
            </button>
          ))}
        </div>
        <p>{renderRichText('The radar forces a row to prove membership, non-membership, or tie survival before it becomes part of the answer set.')}</p>
      </section>
    )
  }

  if (deck.id === 'relational-algebra') {
    return (
      <section className="deck-mechanic-panel mechanic-algebra" aria-label="Relational algebra rewrite mechanic">
        <div className="mechanic-head">
          <span>Rewrite bench</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="rewrite-bench">
          {['R', '\u03c3', '\u03c0', '\u03c1', '\u22c8', 'Ans'].map((operator, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={operator} onClick={() => onStep(stepFor(index))} type="button">
              {operator}
            </button>
          ))}
        </div>
        <p>{renderRichText('Every operator must leave a known relation schema for the next operator; otherwise the rewrite is only notation, not logic.')}</p>
      </section>
    )
  }

  if (deck.id === 'views') {
    return (
      <section className="deck-mechanic-panel mechanic-view" aria-label="View aperture mechanic">
        <div className="mechanic-head">
          <span>Contract aperture</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="mechanic-view-aperture">
          <button onClick={() => onStep(0)} type="button">base tables</button>
          <Eye size={24} aria-hidden={true} />
          <button className={safeStep >= 2 ? 'is-active' : ''} onClick={() => onStep(stepFor(2))} type="button">published rows</button>
        </div>
        <p>{renderRichText('The aperture opens only the columns and row grain consumers are allowed to depend on; hidden base detail remains behind the contract.')}</p>
      </section>
    )
  }

  if (deck.id === 'normalization') {
    return (
      <section className="deck-mechanic-panel mechanic-normalization" aria-label="Functional dependency closure mechanic">
        <div className="mechanic-head">
          <span>Closure machine</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="closure-machine">
          {['X', 'X+', 'FD hit', 'split', 'join back'].map((token, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={token} onClick={() => onStep(stepFor(index))} type="button">
              {token}
            </button>
          ))}
        </div>
        <p>{renderRichText('The machine adds attributes only when determinants are already present, then tests whether the split rejoins without invented rows.')}</p>
      </section>
    )
  }

  if (deck.id === 'modules-triggers') {
    return (
      <section className="deck-mechanic-panel mechanic-routine" aria-label="Stored module event condition action sequencer">
        <div className="mechanic-head">
          <span>ECA sequencer</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="eca-sequencer">
          {['event', 'condition', 'action', 'side effect', 'rollback'].map((token, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={token} onClick={() => onStep(stepFor(index))} type="button">
              {token}
            </button>
          ))}
        </div>
        <p>{renderRichText('This deck is controlled by time: the same SQL can be safe or surprising depending on when the event fires and what side effect follows.')}</p>
      </section>
    )
  }

  if (deck.id === 'storage-indexes') {
    return (
      <section className="deck-mechanic-panel mechanic-storage" aria-label="Storage page route mechanic">
        <div className="mechanic-head">
          <span>Page route</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="page-route">
          {['root', 'internal', 'leaf', 'data', 'buffer'].map((page, index) => (
            <button className={index <= safeStep ? 'is-active' : ''} key={page} onClick={() => onStep(stepFor(index))} type="button">
              <Database size={15} aria-hidden={true} />
              <span>{page}</span>
            </button>
          ))}
        </div>
        <p>{renderRichText('The interaction counts page movement instead of rows; a path is good only when the physical route explains the cost.')}</p>
      </section>
    )
  }

  if (deck.id === 'jdbc') {
    return (
      <section className="deck-mechanic-panel mechanic-jdbc" aria-label="JDBC route and cleanup mechanic">
        <div className="mechanic-head">
          <span>Runtime route</span>
          <strong>{renderRichText(activeToken)}</strong>
        </div>
        <div className="jdbc-route">
          {['Java', 'driver', 'tunnel', 'MySQL', 'cursor', 'close'].map((hop, index) => (
            <button className={index <= safeStep + 1 ? 'is-active' : ''} key={hop} onClick={() => onStep(stepFor(index))} type="button">
              <span>{index + 1}</span>
              <strong>{hop}</strong>
            </button>
          ))}
        </div>
        <p>{renderRichText('Debugging follows the route: classpath, URL, tunnel, authentication, SQL execution, result consumption, and cleanup.')}</p>
      </section>
    )
  }

  return (
    <section className="deck-mechanic-panel mechanic-capstone" aria-label="Capstone architecture control board">
      <div className="mechanic-head">
        <span>Architecture board</span>
        <strong>{renderRichText(activeToken)}</strong>
      </div>
      <div className="architecture-board">
        {['model', 'contract', 'workflow', 'index', 'deploy'].map((layer, index) => (
          <button className={index <= safeStep ? 'is-active' : ''} key={layer} onClick={() => onStep(stepFor(index))} type="button">
            <span>{index + 1}</span>
            <strong>{layer}</strong>
          </button>
        ))}
      </div>
      <p>{renderRichText('The capstone mechanic connects every design decision to one system layer, then checks whether the layer still works under failure.')}</p>
    </section>
  )
}

function MotionConceptGraphic({
  deckId,
  family,
  spec,
  safeStep,
  maxStep,
}: {
  deckId: string
  family: VisualFamily
  spec: ExperimentSpec
  safeStep: number
  maxStep: number
}) {
  const progress = maxStep > 0 ? safeStep / maxStep : 0
  const rows = spec.rows
  const activeNodes = spec.nodes.filter((node) => node.stage <= safeStep)

  if (family === 'schema') {
    const gates = ['Primary key', 'Foreign key', 'Referential action', 'Rejected write']
    return (
      <div className="motion-graphic motion-schema-graphic" aria-label="Animated schema constraint gate">
        <article className="schema-fact-card parent">
          <span>Parent table</span>
          <strong>Movie</strong>
          <code>movie_id = 4</code>
          <small>{safeStep >= 1 ? 'referenced key exists' : 'identity must be named first'}</small>
        </article>
        <div className="schema-gate-stack" aria-label="Constraint checks">
          {gates.map((gate, index) => (
            <span className={safeStep >= index ? 'is-active' : ''} key={gate}>
              <ShieldCheck size={14} aria-hidden={true} />
              {gate}
            </span>
          ))}
        </div>
        <article className="schema-fact-card child">
          <span>Candidate child row</span>
          <strong>{safeStep >= 3 ? 'MovieCopy(999, 001)' : 'MovieCopy(4, 001)'}</strong>
          <code>{safeStep >= 3 ? 'blocked: missing parent' : 'accepted: legal reference'}</code>
          <small>{safeStep >= 2 ? 'action policy controls future deletes' : 'child identity depends on parent key'}</small>
        </article>
      </div>
    )
  }

  if (family === 'query' || family === 'statistics') {
    const clauseFlow = [
      { label: 'FROM', detail: 'candidate rows', count: '96' },
      { label: 'WHERE', detail: 'row predicate', count: '61' },
      { label: 'GROUP BY', detail: 'answer grain', count: '14' },
      { label: 'HAVING', detail: 'group predicate', count: '7' },
      { label: 'SELECT', detail: 'named output', count: '7' },
      { label: 'ORDER BY', detail: 'display order', count: '7' },
    ]
    return (
      <div className="motion-graphic motion-query-graphic" aria-label="Animated SQL logical clause pipeline">
        <div className="query-row-stack" aria-label="Rows moving through query clauses">
          {rows.map((row) => (
            <span className={row.stage <= safeStep ? 'is-active' : ''} key={row.label}>
              <strong>{renderRichText(row.label)}</strong>
              <small>{renderRichText(row.verdict)}</small>
            </span>
          ))}
        </div>
        <div className="query-clause-chain">
          {clauseFlow.map((clause, index) => (
            <article className={safeStep >= Math.min(index, maxStep) ? 'is-active' : ''} key={clause.label}>
              <span>{clause.label}</span>
              <strong>{clause.count}</strong>
              <small>{clause.detail}</small>
            </article>
          ))}
        </div>
        <div className="query-result-grain">
          <span>Current meaning</span>
          <strong>{safeStep >= 2 ? 'one row per group' : 'one row per source fact'}</strong>
          <code>{safeStep >= 2 ? 'GROUP BY changes row identity' : 'WHERE cannot see aggregates yet'}</code>
        </div>
      </div>
    )
  }

  if (deckId === 'storage-indexes') {
    return (
      <div className="motion-graphic motion-index-graphic" aria-label="Animated B plus tree traversal">
        <div className="motion-index-root">root page</div>
        <div className="motion-index-branches">
          {['< 30', '30-60', '> 60'].map((label, index) => (
            <span className={safeStep >= index + 1 ? 'is-active' : ''} key={label}>{label}</span>
          ))}
        </div>
        <div className="motion-index-leaves">
          {['10|20', '35|42', '67|84'].map((label, index) => (
            <span className={safeStep >= index + 1 ? 'is-active' : ''} key={label}>{label}</span>
          ))}
        </div>
        <span className="motion-search-token" style={{ '--token-x': `${progress * 82}%` } as CSSProperties}>42</span>
        <div className="motion-index-cost">
          <span>{safeStep >= 1 ? 'index page read' : 'data file scan avoided?'}</span>
          <strong>{safeStep >= 3 ? 'root -> branch -> leaf -> range' : 'path still forming'}</strong>
        </div>
      </div>
    )
  }

  if (family === 'dependency') {
    return (
      <div className="motion-graphic motion-dependency-graphic" aria-label="Animated dependency and decomposition graph">
        <div className="fd-rule-card">
          <span>Functional dependency</span>
          <strong>{'B \u2192 C'}</strong>
          <small>{safeStep >= 1 ? 'B must determine one stable C value in every legal instance.' : 'The rule is semantic, not just a row sample.'}</small>
        </div>

        <div className="fd-wide-table">
          <span>Universal relation R(A, B, C)</span>
          <div className="fd-header-row">
            <b>A</b>
            <b>B</b>
            <b>C</b>
            <b>Status</b>
          </div>
          {[
            ['0', '0', safeStep >= 2 ? '0' : '?', 'stored'],
            ['0', '0', safeStep >= 2 ? '2' : '?', safeStep >= 2 ? 'conflict' : 'candidate'],
            ['1', '4', '8', safeStep >= 1 ? 'legal' : 'unknown'],
          ].map((row, index) => (
            <div className={`fd-data-row ${safeStep >= 2 && index === 1 ? 'is-conflict' : ''}`} key={`${row.join('-')}-${index}`}>
              {row.map((cell) => <span key={`${index}-${cell}`}>{cell}</span>)}
            </div>
          ))}
        </div>

        <div className={`fd-anomaly-card ${safeStep >= 2 ? 'is-active' : ''}`}>
          <span>Anomaly detector</span>
          <strong>{safeStep >= 2 ? 'Same B, different C' : 'No contradiction exposed yet'}</strong>
          <small>{safeStep >= 2 ? 'The repeated B value proves C is stored at the wrong grain.' : 'Advance until the candidate tuple tests the dependency.'}</small>
        </div>

        <div className={`fd-decomposition-board ${safeStep >= 3 ? 'is-active' : ''}`}>
          <article>
            <span>R1(A, B)</span>
            <strong>entity / determinant side</strong>
          </article>
          <article>
            <span>R2(B, C)</span>
            <strong>dependent fact home</strong>
          </article>
          <div>
            <CheckCircle2 size={16} aria-hidden={true} />
            <span>{safeStep >= 3 ? 'lossless join target' : 'waiting for split proof'}</span>
          </div>
        </div>
      </div>
    )
  }

  if (family === 'set') {
    const probes = [
      { label: 'candidate', value: 'outer movie row' },
      { label: 'join', value: 'attach matching rental rows' },
      { label: 'subquery', value: 'compare against peer set' },
      { label: 'ties', value: 'keep every maximum' },
    ]
    return (
      <div className="motion-graphic motion-set-probe-graphic" aria-label="Animated join and subquery membership probe">
        <div className="set-probe-source">
          <span>Outer row</span>
          <strong>{safeStep >= 1 ? 'Movie A' : 'candidate'}</strong>
          <code>answer grain stays outside</code>
        </div>
        <div className="set-probe-center">
          {probes.map((probe, index) => (
            <article className={safeStep >= index ? 'is-active' : ''} key={probe.label}>
              <span>{probe.label}</span>
              <strong>{probe.value}</strong>
            </article>
          ))}
        </div>
        <div className="set-probe-result">
          <span>Result policy</span>
          <strong>{safeStep >= 3 ? 'Movie A + Movie B' : safeStep >= 2 ? 'membership tested' : 'not decided'}</strong>
          <code>{safeStep >= 3 ? '>= ALL preserves ties' : 'NOT EXISTS avoids NULL traps'}</code>
        </div>
      </div>
    )
  }

  if (family === 'algebra') {
    return (
      <div className="motion-graphic motion-algebra-graphic" aria-label="Animated relational algebra operator tree">
        <div className="relation-card relation-left">
          <strong>Base relation</strong>
          {['Product(model,maker)', 'Laptop(model,drive)', 'Printer(model,color)'].map((row, index) => (
            <span className={safeStep >= index ? 'is-active' : ''} key={row}>{row}</span>
          ))}
        </div>
        <div className="relation-operator-lens">
          <span className={safeStep >= 1 ? 'is-active' : ''}>{'\u03c3'}</span>
          <ArrowRight size={16} aria-hidden={true} />
          <span className={safeStep >= 2 ? 'is-active' : ''}>{'\u22c8'}</span>
          <ArrowRight size={16} aria-hidden={true} />
          <span className={safeStep >= 3 ? 'is-active' : ''}>{'\u03c0'}</span>
        </div>
        <div className="relation-card relation-result">
          <strong>Intermediate result</strong>
          {rows.slice(0, 3).map((row) => (
            <span className={row.stage <= safeStep ? 'is-active' : ''} key={row.label}>{row.verdict}</span>
          ))}
        </div>
        <code className="algebra-expression">
          {safeStep >= 3 ? '\u03c0_maker(Product \u22c8 \u03c3_drive\u22651000(Laptop))' : safeStep >= 2 ? 'Product \u22c8 \u03c3_drive\u22651000(Laptop)' : '\u03c3_drive\u22651000(Laptop)'}
        </code>
      </div>
    )
  }

  if (family === 'view') {
    return (
      <div className="motion-graphic motion-view-graphic" aria-label="Animated view contract lens">
        <article>
          <span>Base tables</span>
          <code>MovieCopy.status</code>
          <code>RentalItem.returned_at</code>
          <code>Movie.title</code>
        </article>
        <div className={`view-contract-lens ${safeStep >= 1 ? 'is-active' : ''}`}>
          <Eye size={24} aria-hidden={true} />
          <strong>CREATE VIEW</strong>
          <small>{safeStep >= 3 ? 'writes require key-preserving mapping' : 'read contract hides repeated predicates'}</small>
        </div>
        <article>
          <span>Consumer relation</span>
          <code>available_copy(movie_id, copy_num)</code>
          <code>{safeStep >= 2 ? 'one reusable interface' : 'definition still internal'}</code>
        </article>
      </div>
    )
  }

  if (family === 'routine') {
    const routineSteps = ['CALL / event', 'condition check', 'SQL action', 'side effect', 'reported result']
    return (
      <div className="motion-graphic motion-routine-graphic" aria-label="Animated stored module event condition action flow">
        {routineSteps.map((label, index) => (
          <article className={safeStep >= Math.min(index, maxStep) ? 'is-active' : ''} key={label}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
            <small>{index === 3 ? 'trigger-like change must be tested' : spec.nodes[index]?.detail ?? 'database-side boundary'}</small>
          </article>
        ))}
      </div>
    )
  }

  if (family === 'network') {
    return (
      <div className="motion-graphic motion-network-graphic" aria-label="Animated JDBC runtime route">
        {['Java', 'Driver', 'Tunnel', 'MySQL', 'Rows'].map((label, index) => (
          <div className={index <= safeStep + 1 ? 'is-active' : ''} key={label}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
            <small>{index === 1 ? 'jar visible' : index === 2 ? 'port forwarded' : index === 4 ? 'cursor closed' : 'checkpoint'}</small>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`motion-graphic motion-pipeline-graphic family-${family}`} aria-label="Animated database logic pipeline">
      {activeNodes.slice(0, 4).map((node, index) => (
        <article className={`pipeline-card card-${index + 1}`} key={`${node.label}-${index}`}>
          <span>{node.kind}</span>
          <strong>{renderRichText(node.label)}</strong>
        </article>
      ))}
      <div className="pipeline-token" style={{ '--token-x': `${progress * 76}%` } as CSSProperties}>
        row
      </div>
    </div>
  )
}

export function ConceptDiagram({ deck, slide, activeIndex }: { deck: Deck; slide: Deck['slides'][number]; activeIndex: number }) {
  return <AnimatedConceptLab deck={deck} slide={slide} activeIndex={activeIndex} />
}


