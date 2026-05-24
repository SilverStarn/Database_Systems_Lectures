import { useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  Play,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { AcademicStudyLayer, ConceptDiagram, DeckMechanicPanel } from './AcademicLayer'
import { type AcademicSlideContent } from './academicContent'
import { type Deck } from './courseData'
import { type MasteryPathNode } from './masteryPath'
import { getPracticePrompt } from './practicePrompts'
import { renderMathAwareCode, renderRichText } from './richText'
import { clamp } from './studyState'
import { StageControls } from './StageControls'
import {
  type DbTableScenario,
  type DbTableSnapshot,
} from './tableScenarios'
import {
  SlideMasteryContext,
  SlideTechnicalExpansion,
  SlideTermStrip,
} from './TeachingPanels'
import { compactText } from './textUtils'
import {
  appliedCaseCardsFor,
  buildSubtopicVisualModel,
  deepDiveChecksFor,
  deepDiveCodeFor,
  deepDivePracticeCardsFor,
  deepWorksheetCardsFor,
  detailAt,
  getSubtopicPageInfo,
  instrumentCardsFor,
  isGeneratedSubtopicSlide,
  matrixDecisionText,
  nodeWhyText,
  pageInteractionProfileFor,
  sequenceSlideClassFor,
  sequenceWorkbenchContentFor,
  simulationEventsFor,
  stageChangeText,
  tablePhaseLabels,
  tableScenarioFor,
  tableTransitionEvents,
  traceArtifactForStage,
  traceStateForStage,
  visualModesFor,
  type PageInteractionProfile,
} from './subtopicModel'
import {
  fallbackSubtopicModes,
  visualModeLabelFor,
  type SubtopicPageInfo,
  type SubtopicVisualMode,
  type VisualFamily,
} from './visualModelData'
function PageInstrumentPanel({
  slide,
  info,
  model,
  profile,
}: {
  slide: Deck['slides'][number]
  info: SubtopicPageInfo
  model: ReturnType<typeof buildSubtopicVisualModel>
  profile: PageInteractionProfile
}) {
  const [activeCard, setActiveCard] = useState(0)
  const cards = instrumentCardsFor(slide, info, model, profile)
  const active = cards[activeCard % cards.length]
  const checks = [...(slide.checks ?? []), ...(slide.bullets ?? [])].slice(0, 4)
  const stages = model.stages.slice(0, 4)

  return (
    <section className={`page-instrument instrument-${profile.layout} page-${info.page}`} aria-label={`${profile.title} interaction`}>
      <div className="page-instrument-head">
        <div>
          <p className="eyebrow">{profile.eyebrow}</p>
          <h5>{renderRichText(profile.title)}</h5>
        </div>
        <span>{info.page}</span>
      </div>
      <p className="instrument-subtitle">{renderRichText(profile.subtitle)}</p>

      {['orientation', 'pattern', 'failure', 'counter', 'repair', 'exam'].includes(profile.layout) && (
        <div className="instrument-card-row">
          {cards.map((card, index) => (
            <button
              className={activeCard === index ? 'is-active' : ''}
              key={`${profile.layout}-${card.label}`}
              onClick={() => setActiveCard(index)}
              type="button"
            >
              <span>{card.label}</span>
              <strong>{renderRichText(card.title)}</strong>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'grain' && (
        <div className="instrument-grain-board">
          {cards.map((card, index) => (
            <button
              className={activeCard === index ? 'is-active' : ''}
              key={`${profile.layout}-${card.label}`}
              onClick={() => setActiveCard(index)}
              type="button"
            >
              <span>{card.label}</span>
              <strong>{renderRichText(card.title)}</strong>
              <small>{renderRichText(card.detail)}</small>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'state' && (
        <div className="instrument-state-gates">
          {cards.map((card, index) => (
            <button
              className={activeCard === index ? 'is-active' : ''}
              key={`${card.label}-${card.title}`}
              onClick={() => setActiveCard(index)}
              type="button"
            >
              <span>{card.label}</span>
              <strong>{renderRichText(card.title)}</strong>
              <small>{renderRichText(card.detail)}</small>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'stress' && (
        <div className="instrument-stress-grid">
          <div className="stress-meter" aria-hidden={true}>
            {cards.map((card, index) => <span className={index <= activeCard ? 'is-active' : ''} key={card.label} />)}
          </div>
          <div className="instrument-card-row">
            {cards.map((card, index) => (
              <button
                className={activeCard === index ? 'is-active' : ''}
                key={card.label}
                onClick={() => setActiveCard(index)}
                type="button"
              >
                <span>{card.label}</span>
                <strong>{renderRichText(card.title)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {profile.layout === 'code' && (
        <div className="instrument-code-grid">
          <code>{renderMathAwareCode(model.code)}</code>
          <div>
            {cards.map((card, index) => (
              <button
                className={activeCard === index ? 'is-active' : ''}
                key={card.label}
                onClick={() => setActiveCard(index)}
                type="button"
              >
                <span>{card.label}</span>
                <strong>{renderRichText(card.title)}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {profile.layout === 'decision' && (
        <div className="instrument-decision-tree">
          {cards.map((card, index) => (
            <button
              className={activeCard === index ? 'is-active' : ''}
              key={card.label}
              onClick={() => setActiveCard(index)}
              type="button"
            >
              <span>{index === 0 ? 'if' : index === 1 ? 'then' : 'test'}</span>
              <strong>{renderRichText(card.title)}</strong>
            </button>
          ))}
        </div>
      )}

      {['trace', 'lab'].includes(profile.layout) && (
        <div className="instrument-stage-rail">
          {stages.map((stage, index) => (
            <button
              className={activeCard === index % cards.length ? 'is-active' : ''}
              key={`${profile.layout}-${stage.label}`}
              onClick={() => setActiveCard(index % cards.length)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{renderRichText(stage.label)}</strong>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'verify' && (
        <div className="instrument-audit-list">
          {(checks.length ? checks : cards.map((card) => card.detail)).map((check, index) => (
            <button
              className={activeCard === index % cards.length ? 'is-active' : ''}
              key={`${check}-${index}`}
              onClick={() => setActiveCard(index % cards.length)}
              type="button"
            >
              <Check size={14} aria-hidden={true} />
              <span>{renderRichText(check)}</span>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'edge' && (
        <div className="instrument-edge-wheel">
          {cards.map((card, index) => (
            <button
              className={activeCard === index ? 'is-active' : ''}
              key={card.label}
              onClick={() => setActiveCard(index)}
              type="button"
            >
              <span>{card.label}</span>
              <strong>{renderRichText(card.title)}</strong>
            </button>
          ))}
        </div>
      )}

      {profile.layout === 'transfer' && (
        <div className="instrument-transfer-board">
          <button
            className={activeCard === 0 ? 'is-active' : ''}
            onClick={() => setActiveCard(0)}
            type="button"
          >
            <span>{cards[0].label}</span>
            <strong>{renderRichText(info.focus)}</strong>
          </button>
          <ArrowRight size={16} aria-hidden={true} />
          <button
            className={activeCard === 1 ? 'is-active' : ''}
            onClick={() => setActiveCard(1)}
            type="button"
          >
            <span>{cards[1].label}</span>
            <strong>{renderRichText(cards[1].title)}</strong>
          </button>
          <ArrowRight size={16} aria-hidden={true} />
          <button
            className={activeCard === 2 ? 'is-active' : ''}
            onClick={() => setActiveCard(2)}
            type="button"
          >
            <span>{cards[2].label}</span>
            <strong>{renderRichText(model.blueprint.artifact)}</strong>
          </button>
        </div>
      )}

      {profile.layout === 'teach' && (
        <ol className="instrument-teach-ladder">
          {cards.map((card, index) => (
            <li className={activeCard === index ? 'is-active' : ''} key={card.label} onClick={() => setActiveCard(index)}>
              <span>{index + 1}</span>
              <strong>{renderRichText(card.label)}</strong>
              <small>{renderRichText(card.title)}</small>
            </li>
          ))}
        </ol>
      )}

      <div className="instrument-readout">
        <span>{renderRichText(active.label)}</span>
        <strong>{renderRichText(active.title)}</strong>
        <p>{renderRichText(active.detail)}</p>
      </div>
    </section>
  )
}

function MiniDbSnapshot({ snapshot, label }: { snapshot: DbTableSnapshot; label: string }) {
  const visibleColumns = snapshot.columns.slice(0, 4)
  const visibleRows = snapshot.rows.slice(0, 3)

  return (
    <article className="case-mini-table">
      <div>
        <span>{label}</span>
        <strong>{renderRichText(snapshot.title)}</strong>
      </div>
      <table>
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th key={`${snapshot.title}-${column}`}>{renderRichText(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr className={snapshot.highlightRows?.includes(rowIndex) ? 'is-highlighted' : ''} key={`${snapshot.title}-mini-${rowIndex}`}>
              {visibleColumns.map((_, cellIndex) => (
                <td key={`${snapshot.title}-mini-${rowIndex}-${cellIndex}`}>{renderRichText(String(row[cellIndex] ?? ''))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  )
}

function AppliedCaseStudio({
  deck,
  slide,
  info,
  model,
  scenario,
}: {
  deck: Deck
  slide: Deck['slides'][number]
  info: SubtopicPageInfo
  model: ReturnType<typeof buildSubtopicVisualModel>
  scenario: DbTableScenario
}) {
  const [activeCase, setActiveCase] = useState(0)
  const caseCards = appliedCaseCardsFor(deck, slide, info, model, scenario)
  const card = caseCards[activeCase % caseCards.length]

  return (
    <section className="subtopic-case-studio" aria-label={`${info.focus} applied case studio`}>
      <div className="case-studio-head">
        <div>
          <p className="eyebrow">Applied case studio</p>
          <h5>{renderRichText(card.title)}</h5>
        </div>
        <span>{activeCase + 1} / {caseCards.length}</span>
      </div>

      <div className="case-studio-tabs" aria-label="Choose applied case angle">
        {caseCards.map((item, index) => (
          <button
            className={index === activeCase ? 'is-active' : ''}
            key={item.label}
            onClick={() => setActiveCase(index)}
            type="button"
          >
            <Search size={14} aria-hidden={true} />
            <span>{renderRichText(item.label)}</span>
          </button>
        ))}
      </div>

      <div className="case-studio-grid">
        <article className="case-code-panel">
          <div>
            <Database size={15} aria-hidden={true} />
            <span>Concrete artifact</span>
          </div>
          <code>{renderMathAwareCode(card.code)}</code>
        </article>

        <div className="case-table-pair">
          <MiniDbSnapshot label="Before" snapshot={scenario.before} />
          <ArrowRight size={16} aria-hidden={true} />
          <MiniDbSnapshot label="After" snapshot={scenario.after} />
        </div>

        <article className="case-reasoning-panel">
          <p>{renderRichText(card.objective)}</p>
          <ul>
            {card.evidence.map((item) => (
              <li key={item}>
                <ShieldCheck size={14} aria-hidden={true} />
                <span>{renderRichText(item)}</span>
              </li>
            ))}
          </ul>
        </article>

        <details className="case-expansion">
          <summary>
            <span>More practice</span>
            <strong>Scale checks, transfer moves, and traps</strong>
          </summary>

          <div className="case-bottom-row">
            <article>
              <span>Diagnostic check</span>
              <strong>{renderRichText(card.diagnostic)}</strong>
            </article>
            <article>
              <span>Transfer move</span>
              <strong>{renderRichText(card.transfer)}</strong>
            </article>
          </div>

          <div className="case-lab-notebook" aria-label="Applied practice notebook">
            {model.stages.slice(0, 4).map((stage, index) => (
              <article key={`${card.label}-${stage.label}-${index}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{renderRichText(stage.label)}</strong>
                  <p>{renderRichText(compactText(stage.detail, 142))}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="case-scale-grid" aria-label="Larger case reasoning extensions">
            <article>
              <span>Scale-up pressure</span>
              <strong>{renderRichText(`What changes when ${info.focus} is applied to thousands of legal rows instead of the displayed sample?`)}</strong>
            </article>
            <article>
              <span>Audit question</span>
              <strong>{renderRichText(`Which intermediate row, group, dependency, page, or runtime object would you log to prove the result?`)}</strong>
            </article>
            <article>
              <span>Best trap</span>
              <strong>{renderRichText(`The tempting shortcut is the one that preserves the visible output while silently changing ${model.blueprint.artifact}.`)}</strong>
            </article>
          </div>
        </details>
      </div>
    </section>
  )
}

function SubtopicInteractiveVisual({ deck, slide }: { deck: Deck; slide: Deck['slides'][number] }) {
  const info = getSubtopicPageInfo(slide)
  const model = info ? buildSubtopicVisualModel(deck, slide, info) : null
  const availableModes = info ? visualModesFor(deck, info) : fallbackSubtopicModes
  const defaultMode = availableModes[0] ?? 'adaptive'
  const [mode, setMode] = useState<SubtopicVisualMode>(defaultMode)
  const [activeNode, setActiveNode] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const [activeScenario, setActiveScenario] = useState(0)
  const [activeCell, setActiveCell] = useState({ row: 0, column: 0 })
  const [simulationStep, setSimulationStep] = useState(0)
  const [tableStep, setTableStep] = useState(0)
  const [activeTransition, setActiveTransition] = useState(0)
  const [mechanicStep, setMechanicStep] = useState(0)
  const activeMode = availableModes.includes(mode) ? mode : defaultMode

  function resetInteractionState() {
    setActiveNode(0)
    setActiveStage(0)
    setActiveScenario(0)
    setActiveCell({ row: 0, column: 0 })
    setSimulationStep(0)
    setTableStep(0)
    setActiveTransition(0)
    setMechanicStep(0)
  }

  function selectMode(nextMode: SubtopicVisualMode) {
    setMode(nextMode)
    resetInteractionState()
  }

  if (!info || !model) return <ConceptDiagram deck={deck} activeIndex={0} slide={slide} />

  const activeNodeData = model.nodes[activeNode % model.nodes.length]
  const activeStageData = model.stages[activeStage % model.stages.length]
  const activeScenarioData = model.scenarios[activeScenario % model.scenarios.length]
  const activeRow = model.matrixRows[activeCell.row % model.matrixRows.length]
  const activeColumn = model.matrixColumns[activeCell.column % model.matrixColumns.length]
  const tableScenario = tableScenarioFor(deck, slide, info, model)
  const tablePhases = ['before', 'sql', 'after', 'analysis'] as const
  const tablePhase = tablePhases[tableStep % tablePhases.length]
  const transitionEvents = tableTransitionEvents(tableScenario, info, model)
  const activeTransitionEvent = transitionEvents[activeTransition % transitionEvents.length]
  const simulationEvents = simulationEventsFor(slide, info, model)
  const activeSimulation = simulationEvents[simulationStep % simulationEvents.length]
  const pageProfile = pageInteractionProfileFor(info)
  const activeTraceState = traceStateForStage(slide, info, model, activeStage)
  const activeTraceArtifact = traceArtifactForStage(deck, slide, info, model, activeStage)
  const mechanicStageData = model.stages[mechanicStep % Math.max(model.stages.length, 1)] ?? activeStageData

  return (
    <section
      className={`subtopic-visual family-${model.blueprint.family} mode-${activeMode} page-layout-${pageProfile.layout}`}
      data-subtopic-visual={activeMode}
    >
      <div className="subtopic-visual-head">
        <div>
          <p className="eyebrow">{renderRichText(`${model.blueprint.artifact} / ${pageProfile.eyebrow}`)}</p>
          <h4>{renderRichText(`${info.focus}: ${pageProfile.title}`)}</h4>
        </div>
        <span>{String(info.page).padStart(2, '0')} / 20</span>
      </div>

      <PageInstrumentPanel
        info={info}
        model={model}
        profile={pageProfile}
        slide={slide}
      />

      <DeckMechanicPanel
        activeDetail={mechanicStageData.detail}
        activeLabel={mechanicStageData.label}
        blueprint={model.blueprint}
        deck={deck}
        maxStep={Math.max(model.stages.length - 1, 0)}
        onStep={setMechanicStep}
        safeStep={mechanicStep}
      />

      <div className="subtopic-mode-switch" aria-label="Subtopic interaction type">
        {availableModes.map((candidate) => (
          <button
            className={activeMode === candidate ? 'is-active' : ''}
            key={candidate}
            onClick={() => selectMode(candidate)}
            type="button"
          >
            {visualModeLabelFor(candidate, model.blueprint.family)}
          </button>
        ))}
      </div>

      {activeMode === 'adaptive' && <AdaptiveInteractionLab deck={deck} slide={slide} info={info} model={model} />}

      {activeMode === 'map' && (
        <div className="subtopic-map-layout">
          <div className="visual-map-canvas">
            <div className="map-core">
              <Brain size={24} aria-hidden={true} />
              <strong>{renderRichText(info.focus)}</strong>
              <span>{renderRichText(model.blueprint.artifact)}</span>
            </div>
            {model.nodes.map((node, index) => (
              <button
                className={activeNode === index ? 'is-active' : ''}
                key={node.label}
                onClick={() => setActiveNode(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{renderRichText(node.label)}</strong>
                <small>{renderRichText(node.detail)}</small>
              </button>
            ))}
          </div>
          <div className="visual-inspector">
            <p className="eyebrow">Selected node</p>
            <h5>{renderRichText(activeNodeData.label)}</h5>
            <p>{renderRichText(activeNodeData.detail)}</p>
            <div className="causal-note">
              <span>Why it matters</span>
              <p>{renderRichText(nodeWhyText(info, activeNodeData, slide))}</p>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'trace' && (
        <div className="subtopic-trace-layout">
          <div className="trace-rail">
            {model.stages.map((stage, index) => (
              <button
                className={`${activeStage === index ? 'is-active' : ''} ${index < activeStage ? 'is-complete' : ''}`}
                key={stage.label}
                onClick={() => setActiveStage(index)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{renderRichText(stage.label)}</strong>
                <small>{renderRichText(stage.detail)}</small>
              </button>
            ))}
          </div>
          <div className="trace-detail">
            <p className="eyebrow">Trace focus</p>
            <h5>{renderRichText(activeStageData.label)}</h5>
            <p>{renderRichText(activeStageData.detail)}</p>
            <div className="trace-state-grid" aria-label="Current trace state">
              <span>
                <small>Before</small>
                {renderRichText(activeTraceState.before)}
              </span>
              <span>
                <small>Operation</small>
                {renderRichText(activeTraceState.operation)}
              </span>
              <span>
                <small>After</small>
                {renderRichText(activeTraceState.after)}
              </span>
            </div>
            <code>{renderMathAwareCode(activeTraceArtifact)}</code>
            <div className="causal-note">
              <span>What changed at this step</span>
              <p>{renderRichText(`${stageChangeText(info, activeStageData, slide)} Evidence check: ${activeTraceState.proof}`)}</p>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'table' && (
        <div className={`table-runner phase-${tablePhase}`}>
          <div className="table-runner-toolbar">
            <div>
              <p className="eyebrow">Relational state transition</p>
              <h5>{renderRichText(tableScenario.title)}</h5>
            </div>
            <button
              onClick={() => {
                setTableStep((current) => (current + 1) % tablePhases.length)
              }}
              type="button"
            >
              <Play size={15} aria-hidden={true} />
              <span>Step query</span>
            </button>
          </div>

          <div className="table-phase-tabs" aria-label="Table execution phase">
            {tablePhases.map((phase, index) => (
              <button
                className={tablePhase === phase ? 'is-active' : ''}
                key={phase}
                onClick={() => {
                  setTableStep(index)
                }}
                type="button"
              >
                {tablePhaseLabels[phase]}
              </button>
            ))}
          </div>

          <div className="db-table-pair">
            <DbTableView snapshot={tableScenario.before} emphasized={tablePhase === 'before'} />
            <div className="query-card">
              <span>{renderRichText(tableScenario.queryLabel)}</span>
              <code>{renderMathAwareCode(tableScenario.sql)}</code>
            </div>
            <DbTableView snapshot={tableScenario.after} emphasized={tablePhase === 'after'} />
          </div>

          <div className="transition-lens" data-transition-lens="true">
            <p className="eyebrow">Why this transition happens</p>
            <div className="reason-chip-row" aria-label="Choose transition reason">
              {transitionEvents.map((event, index) => (
                <button
                  className={activeTransition === index ? 'is-active' : ''}
                  key={event.label}
                  onClick={() => {
                    setActiveTransition(index)
                    setTableStep(3)
                  }}
                  type="button"
                >
                  <span>{index + 1}</span>
                  {event.label}
                </button>
              ))}
            </div>
            <div className="transition-chain">
              <span>
                <small>Before</small>
                {renderRichText(activeTransitionEvent.before)}
              </span>
              <ArrowRight size={16} aria-hidden={true} />
              <span>
                <small>Operation</small>
                {renderRichText(activeTransitionEvent.operation)}
              </span>
              <ArrowRight size={16} aria-hidden={true} />
              <span>
                <small>After</small>
                {renderRichText(activeTransitionEvent.after)}
              </span>
            </div>
            <p><strong>Because:</strong> {renderRichText(activeTransitionEvent.why)}</p>
          </div>
        </div>
      )}

      {activeMode === 'counterexample' && (
        <div className="counterexample-lab">
          <div className="scenario-tabs">
            {model.scenarios.map((scenario, index) => (
              <button
                className={activeScenario === index ? 'is-active' : ''}
                key={scenario.label}
                onClick={() => setActiveScenario(index)}
                type="button"
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <div className="scenario-board">
            <div>
              <span>Input condition</span>
              <strong>{renderRichText(activeScenarioData.input)}</strong>
            </div>
            <div>
              <span>Observed result</span>
              <strong>{renderRichText(activeScenarioData.output)}</strong>
            </div>
            <div>
              <span>Reasoning consequence</span>
              <strong>{renderRichText(activeScenarioData.insight)}</strong>
            </div>
          </div>
          <div className="causal-note">
            <span>Why the outcome changes</span>
            <p>{renderRichText(`${activeScenarioData.insight} This tab changes only the scenario being tested, so the three cards stay paired as one local input-result-reason chain.`)}</p>
          </div>
          <p className="scenario-question">{renderRichText(slide.checks?.[activeScenario] ?? slide.bridge ?? 'Which assumption changes the answer?')}</p>
        </div>
      )}

      {activeMode === 'matrix' && (
        <div className="decision-matrix-layout">
          <div className="decision-matrix">
            {model.matrixRows.map((row, rowIndex) => (
              <div key={row}>
                <strong>{renderRichText(row)}</strong>
                {model.matrixColumns.map((column, columnIndex) => (
                  <button
                    className={activeCell.row === rowIndex && activeCell.column === columnIndex ? 'is-active' : ''}
                    key={`${row}-${column}`}
                    onClick={() => setActiveCell({ row: rowIndex, column: columnIndex })}
                    type="button"
                  >
                    {renderRichText(column)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <aside className="matrix-readout">
            <p className="eyebrow">Chosen design pressure</p>
            <h5>{renderRichText(`${activeRow} \u00d7 ${activeColumn}`)}</h5>
            <p>{renderRichText(compactText(matrixDecisionText(info, activeRow, activeColumn, slide), 230))}</p>
            <div className="causal-note">
              <span>Decision consequence</span>
              <p>The selected cell changes only this readout and the active matrix cell. The surrounding slide content stays stable so the learner can compare one mechanism-behavior pairing at a time.</p>
            </div>
          </aside>
        </div>
      )}

      {activeMode === 'simulator' && (
        <div className="subtopic-simulator">
          <div className="simulator-actions">
            {model.actions.map((action, index) => (
              <button
                className={simulationStep === index ? 'is-active' : ''}
                key={action}
                onClick={() => setSimulationStep(index)}
                type="button"
              >
                <Zap size={15} aria-hidden={true} />
                <span>{renderRichText(action)}</span>
              </button>
            ))}
          </div>
          <div className="simulator-metrics">
            {model.metrics.map((metric, index) => (
              <div className={index === simulationStep % model.metrics.length ? 'is-active' : ''} key={metric}>
                <span>{renderRichText(metric)}</span>
                <strong>{index === simulationStep % model.metrics.length ? 'active' : 'watch'}</strong>
                <small>{renderRichText(compactText(index === simulationStep % model.metrics.length ? activeSimulation.check : detailAt(slide.checks ?? slide.bullets, index, slide.body), 92))}</small>
              </div>
            ))}
          </div>
          <div className="simulator-readout">
            <p className="eyebrow">Simulated action</p>
            <h5>{renderRichText(activeSimulation.action)}</h5>
            <div className="simulator-state-chain">
              <span>
                <small>Input</small>
                {renderRichText(activeSimulation.input)}
              </span>
              <ArrowRight size={15} aria-hidden={true} />
              <span>
                <small>Action</small>
                {renderRichText(activeSimulation.action)}
              </span>
              <ArrowRight size={15} aria-hidden={true} />
              <span>
                <small>Observed metric</small>
                {renderRichText(activeSimulation.metric)}
              </span>
            </div>
            <p>{renderRichText(compactText(activeSimulation.check, 188))}</p>
            <div className="causal-note">
              <span>What changed</span>
              <p>{renderRichText(activeSimulation.consequence)}</p>
            </div>
          </div>
        </div>
      )}

      <AppliedCaseStudio
        deck={deck}
        info={info}
        model={model}
        scenario={tableScenario}
        slide={slide}
      />

      <SubtopicDeepDivePanel
        deck={deck}
        info={info}
        model={model}
        scenario={tableScenario}
        slide={slide}
      />
    </section>
  )
}

function SubtopicDeepDivePanel({
  deck,
  slide,
  info,
  model,
  scenario,
}: {
  deck: Deck
  slide: Deck['slides'][number]
  info: SubtopicPageInfo
  model: ReturnType<typeof buildSubtopicVisualModel>
  scenario: DbTableScenario
}) {
  const code = deepDiveCodeFor(deck, slide, info, model, scenario)
  const checks = deepDiveChecksFor(deck, slide, info, model, scenario)
  const practiceCards = deepDivePracticeCardsFor(deck, slide, info, model, scenario)
  const worksheetCards = deepWorksheetCardsFor(slide, info, model, scenario)
  const transitions = tableTransitionEvents(scenario, info, model).slice(0, 3)
  const metric = model.metrics[info.page % model.metrics.length] ?? model.blueprint.metrics[0]
  const action = model.actions[info.page % model.actions.length] ?? model.blueprint.actions[0]

  return (
    <section className={`subtopic-deep-dive deep-family-${model.blueprint.family}`} aria-label={`${info.focus} worked extension`}>
      <div className="deep-dive-head">
        <div>
          <p className="eyebrow">Worked extension</p>
          <h5>{renderRichText(`${info.focus}: code, state, and proof practice`)}</h5>
        </div>
        <span>{renderRichText(metric)}</span>
      </div>

      <div className="deep-dive-grid">
        <article className="deep-code-card">
          <div>
            <Database size={15} aria-hidden={true} />
            <strong>Runnable-shaped artifact</strong>
          </div>
          <code>{renderMathAwareCode(code)}</code>
        </article>

        <article className="deep-trace-card">
          <div>
            <ChevronRight size={15} aria-hidden={true} />
            <strong>State trace</strong>
          </div>
          <div className="deep-transition-stack">
            {transitions.map((transition, index) => (
              <div key={`${transition.label}-${index}`}>
                <span>{index + 1}</span>
                <p>
                  <b>{renderRichText(transition.label)}:</b>
                  {' '}
                  {renderRichText(`${transition.before} ??${transition.operation} ??${transition.after}`)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="deep-proof-card">
          <div>
            <ShieldCheck size={15} aria-hidden={true} />
            <strong>Explanation checklist</strong>
          </div>
          <ul>
            {checks.map((check) => (
              <li key={check}>{renderRichText(check)}</li>
            ))}
          </ul>
        </article>

        <article className="deep-transfer-card">
          <div>
            <Zap size={15} aria-hidden={true} />
            <strong>Try a larger case</strong>
          </div>
          <p>{renderRichText(`Apply ${action} to a larger dataset where the displayed sample is no longer enough. Track ${metric}, then write one row that would break a weaker answer.`)}</p>
          <p>{renderRichText(`The explanation should mention the exact object that changed: ${model.blueprint.artifact}, not just the final label shown on the screen.`)}</p>
        </article>
      </div>

      <div className="deep-practice-grid" aria-label={`${info.focus} additional worked practice`}>
        {practiceCards.map((card, index) => (
          <article key={`${card.label}-${index}`}>
            <span>{index + 1}</span>
            <div>
              <strong>{renderRichText(card.label)}</strong>
              <p>{renderRichText(card.detail)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="deep-explanation-band">
        <article>
          <span>What to write down</span>
          <p>{renderRichText(`State the starting object, apply ${action}, and name the exact evidence that proves ${metric}. This keeps the worked example useful even when the table names change.`)}</p>
        </article>
        <article>
          <span>What to avoid</span>
          <p>{renderRichText(`Do not accept a final answer just because it looks familiar. Compare the intermediate state against ${model.blueprint.artifact} before trusting the visible result.`)}</p>
        </article>
        <article>
          <span>How to self-test</span>
          <p>{renderRichText(`Add one duplicate, missing, null, stale, or high-cardinality case and rerun the reasoning. A robust database explanation survives that variation.`)}</p>
        </article>
      </div>

      <div className="deep-worksheet-grid" aria-label={`${info.focus} verification worksheet`}>
        {worksheetCards.map((card, index) => (
          <article key={`${card.label}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{renderRichText(card.label)}</strong>
              <p>{renderRichText(card.detail)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function AdaptiveInteractionLab({
  deck,
  slide,
  info,
  model,
}: {
  deck: Deck
  slide: Deck['slides'][number]
  info: SubtopicPageInfo
  model: ReturnType<typeof buildSubtopicVisualModel>
}) {
  const [step, setStep] = useState(0)
  const family = model.blueprint.family
  const scenario = tableScenarioFor(deck, slide, info, model)
  const stageButtons = model.stages.slice(0, Math.min(model.stages.length, 6))
  const stageCount = Math.max(stageButtons.length, 1)
  const safeStep = clamp(step, 0, stageCount - 1)
  const activeStage = stageButtons[safeStep] ?? model.stages[0]
  const nodes = model.nodes.length ? model.nodes : [{ label: info.focus, detail: slide.body }]
  const activeNode = nodes[safeStep % nodes.length]
  const activeReason = scenario.analysis[safeStep % scenario.analysis.length] ?? slide.bridge ?? slide.body
  const activeTraceState = traceStateForStage(slide, info, model, safeStep)
  const activeTraceArtifact = traceArtifactForStage(deck, slide, info, model, safeStep)
  const titleByFamily: Record<VisualFamily, string> = {
    schema: 'Constraint gate',
    query: 'Clause pipeline',
    set: 'Set membership lab',
    algebra: 'Algebra operator tree',
    view: 'View contract lens',
    dependency: 'Dependency closure machine',
    routine: 'Event-condition-action timeline',
    storage: 'B+ tree and buffer route',
    network: 'JDBC runtime route',
    statistics: 'Aggregate grain lab',
  }

  return (
    <div className={`adaptive-lab adaptive-${family}`}>
      <div className="adaptive-lab-head">
        <div>
          <p className="eyebrow">{renderRichText(titleByFamily[family])}</p>
          <h5>{renderRichText(activeStage?.label ?? info.focus)}</h5>
          <p>{renderRichText(activeStage?.detail ?? slide.body)}</p>
        </div>
        <span>{safeStep + 1} / {stageCount}</span>
      </div>

      <div className="adaptive-step-strip" aria-label="Adaptive interaction stage selector">
        {stageButtons.map((stage, index) => (
          <button
            className={safeStep === index ? 'is-active' : ''}
            key={`${stage.label}-${index}`}
            onClick={() => setStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{renderRichText(stage.label)}</strong>
          </button>
        ))}
      </div>

      {(family === 'schema' || family === 'statistics') && (
        <div className="adaptive-contract-grid">
          <article className="adaptive-source-card">
            <span>Submitted fact</span>
            <strong>{renderRichText(activeNode?.label ?? info.focus)}</strong>
            <p>{renderRichText(activeNode?.detail ?? slide.body)}</p>
          </article>
          <div className="constraint-gates" aria-label="Constraint gates">
            {model.matrixRows.map((row, index) => (
              <button
                className={index <= safeStep % model.matrixRows.length ? 'is-active' : ''}
                key={row}
                onClick={() => setStep(index)}
                type="button"
              >
                <ShieldCheck size={15} aria-hidden={true} />
                <span>{renderRichText(row)}</span>
              </button>
            ))}
          </div>
          <article className="adaptive-result-card">
            <span>Resulting state</span>
            <strong>{renderRichText(scenario.after.title)}</strong>
            <p>{renderRichText(activeReason)}</p>
          </article>
        </div>
      )}

      {family === 'query' && (
        <div className="adaptive-query-pipeline">
          {model.stages.slice(0, 6).map((stage, index) => {
            const rowCounts = [96, 61, 18, 7, 7, 7]
            const rowCount = rowCounts[index] ?? Math.max(1, 96 - index * 14)
            return (
              <button
                className={index <= safeStep ? 'is-active' : ''}
                key={stage.label}
                onClick={() => setStep(index)}
                type="button"
              >
                <span>{renderRichText(stage.label)}</span>
                <strong>{rowCount}</strong>
                <small>{index < 2 ? 'rows' : index < 4 ? 'groups' : 'output'}</small>
              </button>
            )
          })}
        </div>
      )}

      {family === 'set' && (
        <div className="adaptive-set-lab">
          <div className="set-circle left">
            <span>{renderRichText(nodes[0]?.label ?? 'Outer set')}</span>
          </div>
          <div className="set-circle right">
            <span>{renderRichText(nodes[1]?.label ?? 'Evidence set')}</span>
          </div>
          <div className="set-overlap">
            <strong>{renderRichText(model.actions[safeStep % model.actions.length] ?? 'compare')}</strong>
          </div>
          <aside>
            <p className="eyebrow">Membership result</p>
            <h5>{renderRichText(nodes[Math.min(safeStep, nodes.length - 1)]?.label ?? info.focus)}</h5>
            <p>{renderRichText(activeReason)}</p>
          </aside>
        </div>
      )}

      {family === 'algebra' && (
        <div className="adaptive-algebra-tree">
          {['R', '\u03c3', '\u03c0', '\u03c1', '\u22c8', 'Ans'].map((operator, index) => (
            <button
              className={index === safeStep % 6 ? 'is-active' : ''}
              key={operator}
              onClick={() => setStep(index)}
              type="button"
            >
              <span>{operator}</span>
              <strong>{renderRichText(model.stages[index]?.label ?? model.actions[index % model.actions.length])}</strong>
            </button>
          ))}
          <div className="algebra-schema-readout">
            <span>Intermediate relation</span>
            <code>{renderMathAwareCode(activeTraceArtifact)}</code>
          </div>
        </div>
      )}

      {family === 'view' && (
        <div className="adaptive-view-lens">
          <article>
            <span>Base surface</span>
            {scenario.before.columns.map((column) => <code key={column}>{renderRichText(column)}</code>)}
          </article>
          <div className="view-aperture" aria-hidden={true}>
            <Eye size={24} />
            <strong>{renderRichText(model.actions[safeStep % model.actions.length] ?? 'view')}</strong>
          </div>
          <article>
            <span>Published contract</span>
            {scenario.after.columns.map((column) => <code key={column}>{renderRichText(column)}</code>)}
          </article>
        </div>
      )}

      {family === 'dependency' && (
        <div className="adaptive-fd-machine">
          <div className="closure-source">
            <span>Start</span>
            <strong>{renderRichText(nodes[0]?.label ?? 'X')}</strong>
          </div>
          <div className="closure-chips">
            {nodes.map((node, index) => (
              <button
                className={index <= safeStep % nodes.length ? 'is-active' : ''}
                key={node.label}
                onClick={() => setStep(index)}
                type="button"
              >
                {renderRichText(node.label)}
              </button>
            ))}
          </div>
          <div className="closure-result">
            <span>Closure / split</span>
            <strong>{renderRichText(scenario.after.rows[Math.min(safeStep, scenario.after.rows.length - 1)]?.join(' -> ') ?? scenario.after.title)}</strong>
          </div>
        </div>
      )}

      {family === 'routine' && (
        <div className="adaptive-routine-timeline">
          {['Event', 'Condition', 'Action', 'Result', 'Failure path'].map((label, index) => (
            <button
              className={index <= safeStep % 5 ? 'is-active' : ''}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span>{label}</span>
              <strong>{renderRichText(model.stages[index]?.label ?? model.actions[index % model.actions.length])}</strong>
            </button>
          ))}
        </div>
      )}

      {family === 'storage' && (
        <div className="adaptive-storage-route">
          <div className="btree-root">root</div>
          <div className="btree-level">
            {['< 40', '40-80', '> 80'].map((label, index) => (
              <button className={index === safeStep % 3 ? 'is-active' : ''} key={label} onClick={() => setStep(index)} type="button">
                {label}
              </button>
            ))}
          </div>
          <div className="btree-leaves">
            {scenario.before.rows.slice(0, 4).map((row, index) => (
              <span className={index === safeStep % 4 ? 'is-active' : ''} key={`${row.join('-')}-${index}`}>
                {renderRichText(row.slice(0, 2).join(' | '))}
              </span>
            ))}
          </div>
          <p>{renderRichText(activeReason)}</p>
        </div>
      )}

      {family === 'network' && (
        <div className="adaptive-network-route">
          {['Java', 'Driver', 'Connection', 'Statement', 'DBMS', 'Result'].map((label, index) => (
            <button
              className={index <= safeStep % 6 ? 'is-active' : ''}
              key={label}
              onClick={() => setStep(index)}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
              <small>{renderRichText(model.stages[index]?.label ?? model.actions[index % model.actions.length])}</small>
            </button>
          ))}
        </div>
      )}

      <div className="adaptive-explain-panel" aria-live="polite">
        <div className="trace-state-grid" aria-label="Adaptive step state">
          <span>
            <small>Before</small>
            {renderRichText(activeTraceState.before)}
          </span>
          <span>
            <small>Operation</small>
            {renderRichText(activeTraceState.operation)}
          </span>
          <span>
            <small>After</small>
            {renderRichText(activeTraceState.after)}
          </span>
        </div>
        <div className="adaptive-explain-copy">
          <span>Why this click matters</span>
          <p>{renderRichText(`${activeStage?.label ?? info.focus} changes the visible reasoning state for ${info.focus}. ${activeReason} Evidence to carry forward: ${activeTraceState.proof}`)}</p>
        </div>
      </div>
    </div>
  )
}

function DbTableView({ snapshot, emphasized }: { snapshot: DbTableSnapshot; emphasized: boolean }) {
  return (
    <div className={`db-table-card ${emphasized ? 'is-emphasized' : ''}`}>
      <h5>{renderRichText(snapshot.title)}</h5>
      <div className="db-table-scroll">
        <table>
          <thead>
            <tr>
              {snapshot.columns.map((column) => (
                <th key={column}>{renderRichText(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.map((row, rowIndex) => (
              <tr className={snapshot.highlightRows?.includes(rowIndex) ? 'is-highlighted' : ''} key={`${snapshot.title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${snapshot.title}-${rowIndex}-${cellIndex}`}>{renderRichText(String(cell))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function LectureStage({
  deck,
  slideIndex,
  slide,
  isPlaying,
  bookmarkedSlides,
  masteryNode,
  academicContent,
  onTogglePlay,
  onPrevious,
  onNext,
  onJump,
}: {
  deck: Deck
  slideIndex: number
  slide: Deck['slides'][number]
  isPlaying: boolean
  bookmarkedSlides: number[]
  masteryNode: MasteryPathNode
  academicContent: AcademicSlideContent
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  onJump: (index: number) => void
}) {
  const progress = ((slideIndex + 1) / deck.slides.length) * 100
  const isSubtopicSequence = isGeneratedSubtopicSlide(slide)
  const slideCardClassName = `slide-card ${isSubtopicSequence ? `is-sequence-slide ${sequenceSlideClassFor(deck, slide)}` : ''}`
  const timelineClassName = `slide-timeline ${deck.slides.length > 40 ? 'is-long' : ''}`
  const bridgeText = slide.bridge ?? deck.missingLinks[slideIndex % deck.missingLinks.length]

  return (
    <article className="lecture-stage" style={{ '--deck-accent': deck.accent } as CSSProperties}>
      <div className="stage-progress" aria-label="Slide progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <StageControls
        current={slideIndex + 1}
        total={deck.slides.length}
        isPlaying={isPlaying}
        playLabel={isPlaying ? 'Pause lecture' : 'Play lecture'}
        onTogglePlay={onTogglePlay}
        onPrevious={onPrevious}
        onNext={onNext}
      />

      <div className={slideCardClassName} key={`${deck.id}-${slideIndex}`}>
        <div className="slide-main">
          <div className="slide-kicker">
            <span>{slide.eyebrow}</span>
            <span>{slideIndex + 1} of {deck.slides.length}</span>
          </div>
          <h3>{renderRichText(slide.title)}</h3>
          <p className="slide-body">{renderRichText(slide.body)}</p>

          <ul className="lesson-points">
            {slide.bullets.map((bullet) => (
              <li key={bullet}>
                <CheckCircle2 size={18} aria-hidden={true} />
                <span>{renderRichText(bullet)}</span>
              </li>
            ))}
          </ul>

          {slide.terms && <SlideTermStrip terms={slide.terms} />}

          <div className="slide-integrated-guidance" aria-label="Slide reasoning guidance">
            <p>{renderRichText(bridgeText)}</p>
            <p>{renderRichText(getPracticePrompt(deck, slideIndex))}</p>
            {slide.checks && (
              <div className="slide-guidance-checks">
                {slide.checks.map((check) => (
                  <span key={check}>
                    <ShieldCheck size={14} aria-hidden={true} />
                    {renderRichText(check)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {slide.example && (
            <div className="code-callout">
              <div>
                <Zap size={17} aria-hidden={true} />
                <span>{slide.codeTitle ?? 'Concrete example'}</span>
              </div>
              <code>{renderMathAwareCode(slide.example)}</code>
              {slide.codeAnalysis && (
                <ul className="code-analysis-list" aria-label="Code analysis">
                  {slide.codeAnalysis.map((item) => (
                    <li key={item}>
                      <ShieldCheck size={15} aria-hidden={true} />
                      <span>{renderRichText(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <SlideTechnicalExpansion
            deck={deck}
            masteryNode={masteryNode}
            slide={slide}
            slideIndex={slideIndex}
          />

          {isSubtopicSequence && (
            <SequenceMasteryWorkbench
              deck={deck}
              slide={slide}
              slideIndex={slideIndex}
            />
          )}
        </div>

        <div className="slide-visual">
          {isSubtopicSequence ? (
            <SubtopicInteractiveVisual deck={deck} key={`${deck.id}-${slideIndex}-${slide.title}`} slide={slide} />
          ) : (
            <ConceptDiagram deck={deck} activeIndex={slideIndex} slide={slide} />
          )}
        </div>

        {!isSubtopicSequence && (
          <>
            <SlideMasteryContext deck={deck} masteryNode={masteryNode} />

            <AcademicStudyLayer
              deck={deck}
              content={academicContent}
            />
          </>
        )}
      </div>

      <div className={timelineClassName} aria-label="Slide selector">
        {deck.slides.map((item, index) => (
          <button
            aria-label={`Go to slide ${index + 1}: ${item.title}`}
            className={`${index === slideIndex ? 'is-active' : ''} ${bookmarkedSlides.includes(index) ? 'is-bookmarked' : ''}`}
            key={`${item.title}-${index}`}
            onClick={() => onJump(index)}
            type="button"
            title={item.title}
          />
        ))}
      </div>

    </article>
  )
}

function SequenceMasteryWorkbench({
  deck,
  slide,
  slideIndex,
}: {
  deck: Deck
  slide: Deck['slides'][number]
  slideIndex: number
}) {
  const info = getSubtopicPageInfo(slide)
  if (!info) return null

  const model = buildSubtopicVisualModel(deck, slide, info)
  const profile = pageInteractionProfileFor(info)
  const stage = model.stages[(info.page + slideIndex) % model.stages.length]?.label ?? model.blueprint.stages[0]
  const nextStage = model.stages[(info.page + slideIndex + 1) % model.stages.length]?.label ?? model.blueprint.stages[1] ?? model.blueprint.artifact
  const action = model.actions[(info.page + slideIndex) % model.actions.length] ?? model.blueprint.actions[0]
  const metric = model.metrics[(info.page + slideIndex) % model.metrics.length] ?? model.blueprint.metrics[0]
  const term = slide.terms?.[(info.page - 1) % slide.terms.length]
  const workbench = sequenceWorkbenchContentFor({
    deck,
    info,
    slide,
    stage,
    nextStage,
    action,
    metric,
  })

  return (
    <section className={`sequence-workbench sequence-workbench-${model.blueprint.family}`} aria-label="Focused mastery workbench">
      <div className="sequence-workbench-head">
        <div>
          <p className="eyebrow">{renderRichText(profile.eyebrow)}</p>
          <h4>{renderRichText(`${info.focus}: ${profile.cardLabels[(info.page - 1) % profile.cardLabels.length]} workbench`)}</h4>
        </div>
        <span>{renderRichText(model.blueprint.artifact)}</span>
      </div>

      <div className="sequence-workbench-grid">
        <article className="sequence-workbench-card is-rule">
          <div>
            <Brain size={16} aria-hidden={true} />
            <strong>Master rule</strong>
          </div>
          <p>{renderRichText(workbench.rule)}</p>
        </article>

        <article className="sequence-workbench-card is-trace">
          <div>
            <ChevronRight size={16} aria-hidden={true} />
            <strong>Trace to inspect</strong>
          </div>
          <p>{renderRichText(workbench.trace)}</p>
          <div className="sequence-mini-pipeline" aria-label="Reasoning pipeline">
            <span>{renderRichText(stage)}</span>
            <ChevronRight size={14} aria-hidden={true} />
            <span>{renderRichText(nextStage)}</span>
            <ChevronRight size={14} aria-hidden={true} />
            <span>{renderRichText(metric)}</span>
          </div>
        </article>

        <article className="sequence-workbench-card is-code">
          <div>
            <Database size={16} aria-hidden={true} />
            <strong>{renderRichText(workbench.exampleTitle)}</strong>
          </div>
          <code>{renderMathAwareCode(workbench.exampleCode)}</code>
        </article>

        <article className="sequence-workbench-card is-transfer">
          <div>
            <ShieldCheck size={16} aria-hidden={true} />
            <strong>Transfer test</strong>
          </div>
          <p>{renderRichText(workbench.transfer)}</p>
          <p className="sequence-workbench-proof">{renderRichText(workbench.proof)}</p>
        </article>

        <article className="sequence-workbench-card is-trap">
          <div>
            <X size={16} aria-hidden={true} />
            <strong>Failure mode</strong>
          </div>
          <p>{renderRichText(workbench.trap)}</p>
        </article>

        {term && (
          <article className="sequence-workbench-card is-vocabulary">
            <div>
              <BookOpen size={16} aria-hidden={true} />
              <strong>{renderRichText(term.term)}</strong>
            </div>
            <p>{renderRichText(term.definition)}</p>
            <p className="sequence-workbench-proof">{renderRichText(term.logic)}</p>
          </article>
        )}
      </div>
    </section>
  )
}



