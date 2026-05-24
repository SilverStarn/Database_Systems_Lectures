import { type Deck } from './courseData'
import { getPracticePrompt } from './practicePrompts'
import { plainText } from './richText'
import {
  tableScenarioLibrary,
  type AppliedCaseCard,
  type DbTableScenario,
  type DbTableSnapshot,
} from './tableScenarios'
import { compactText, identifierFrom } from './textUtils'
import {
  deckInteractiveBlueprints,
  deckVisualLabels,
  focusNodeLibrary,
  type SubtopicPageInfo,
  type SubtopicVisualMode,
  type VisualFamily,
} from './visualModelData'
export function isGeneratedSubtopicSlide(slide: Deck['slides'][number]) {
  return /\b\d+\/20$/.test(slide.eyebrow)
}

export function getSubtopicPageInfo(slide: Deck['slides'][number]): SubtopicPageInfo | null {
  const match = slide.eyebrow.match(/^(.*?)\s+(\d+)\/20$/)
  if (!match) return null
  return {
    focus: match[1],
    page: Number(match[2]),
  }
}

export const pageVisualModeProfiles: Record<number, SubtopicVisualMode[]> = {
  1: ['adaptive', 'map', 'matrix'],
  2: ['table', 'adaptive', 'matrix'],
  3: ['adaptive', 'counterexample', 'table'],
  4: ['counterexample', 'adaptive', 'trace'],
  5: ['table', 'adaptive', 'simulator'],
  6: ['trace', 'table', 'adaptive'],
  7: ['matrix', 'adaptive', 'simulator'],
  8: ['counterexample', 'table', 'adaptive'],
  9: ['counterexample', 'simulator', 'table'],
  10: ['adaptive', 'table', 'simulator'],
  11: ['trace', 'adaptive', 'map'],
  12: ['simulator', 'trace', 'adaptive'],
  13: ['simulator', 'table', 'adaptive'],
  14: ['trace', 'simulator', 'table'],
  15: ['table', 'trace', 'adaptive'],
  16: ['matrix', 'table', 'adaptive'],
  17: ['adaptive', 'counterexample', 'matrix'],
  18: ['map', 'counterexample', 'adaptive'],
  19: ['matrix', 'counterexample', 'adaptive'],
  20: ['trace', 'map', 'adaptive'],
}

export type PageInstrumentLayout =
  | 'orientation'
  | 'grain'
  | 'state'
  | 'stress'
  | 'pattern'
  | 'code'
  | 'decision'
  | 'failure'
  | 'counter'
  | 'repair'
  | 'trace'
  | 'lab'
  | 'verify'
  | 'edge'
  | 'transfer'
  | 'exam'
  | 'teach'

export type PageInteractionProfile = {
  eyebrow: string
  title: string
  subtitle: string
  layout: PageInstrumentLayout
  cardLabels: [string, string, string]
}

export type InstrumentCard = {
  label: string
  title: string
  detail: string
}

export const pageInteractionProfiles: Record<number, PageInteractionProfile> = {
  1: {
    eyebrow: 'Orientation instrument',
    title: 'Anchor the mental object',
    subtitle: 'Click a card to decide which object, rule, and proof should stay stable while the page changes.',
    layout: 'orientation',
    cardLabels: ['Object', 'Rule', 'Proof'],
  },
  2: {
    eyebrow: 'Grain splitter',
    title: 'Separate the unit of reality from the syntax',
    subtitle: 'Use the paired cards to test whether the row, group, relation, page, or runtime object is being preserved.',
    layout: 'grain',
    cardLabels: ['Unit', 'Boundary', 'Mismatch'],
  },
  3: {
    eyebrow: 'State gate',
    title: 'Classify legal, forbidden, and deferred states',
    subtitle: 'The interaction is about deciding what the database can reject directly and what belongs to a later workflow.',
    layout: 'state',
    cardLabels: ['Legal', 'Forbidden', 'Deferred'],
  },
  4: {
    eyebrow: 'Stress test',
    title: 'Make the hidden advanced rule visible',
    subtitle: 'Switch cards to see which future legal case would break the naive version of the rule.',
    layout: 'stress',
    cardLabels: ['Future case', 'Naive break', 'Stronger rule'],
  },
  5: {
    eyebrow: 'Pattern transfer board',
    title: 'Turn the example into a reusable database move',
    subtitle: 'The same relation pressure should survive after table names and domain details change.',
    layout: 'pattern',
    cardLabels: ['Source pattern', 'Reusable shape', 'New domain'],
  },
  6: {
    eyebrow: 'Code lens',
    title: 'Read syntax as proof, not decoration',
    subtitle: 'Use the tokens and code panel to connect each clause or declaration to the rule it carries.',
    layout: 'code',
    cardLabels: ['Token', 'Meaning', 'Risk'],
  },
  7: {
    eyebrow: 'Decision tree',
    title: 'Choose the narrowest reliable mechanism',
    subtitle: 'Each branch represents a design pressure: declarative rule, query layer, procedure, trigger, index, or application boundary.',
    layout: 'decision',
    cardLabels: ['Mechanism', 'Pressure', 'Consequence'],
  },
  8: {
    eyebrow: 'Failure detector',
    title: 'Inspect the most tempting wrong model',
    subtitle: 'Click a failure card to keep the misleading assumption close to the repair evidence.',
    layout: 'failure',
    cardLabels: ['Temptation', 'Hidden degree', 'Detector'],
  },
  9: {
    eyebrow: 'Counterexample builder',
    title: 'Use one legal variation to falsify the naive answer',
    subtitle: 'The board tracks the sample, the added row or action, and the assumption that collapses.',
    layout: 'counter',
    cardLabels: ['Sample', 'Variation', 'Broken assumption'],
  },
  10: {
    eyebrow: 'Repair console',
    title: 'Patch the cause, not the symptom',
    subtitle: 'Compare the broken state with the implementation move that prevents the same error from returning.',
    layout: 'repair',
    cardLabels: ['Cause', 'Patch', 'Regression test'],
  },
  11: {
    eyebrow: 'Trace setup',
    title: 'Give every arrow a reason',
    subtitle: 'The trace focuses on what enters, what rule transforms it, and what evidence leaves.',
    layout: 'trace',
    cardLabels: ['Input', 'Transformation', 'Output'],
  },
  12: {
    eyebrow: 'Lab step 1',
    title: 'Make the starting assumption inspectable',
    subtitle: 'The first lab step should be concrete enough that another reader can reproduce it.',
    layout: 'lab',
    cardLabels: ['Assumption', 'Input fact', 'Contradiction'],
  },
  13: {
    eyebrow: 'Lab step 2',
    title: 'Translate the rule into an operation',
    subtitle: 'The second step shows which relational structure, clause, page, or runtime state actually changes.',
    layout: 'lab',
    cardLabels: ['Operation', 'Changed object', 'Observable effect'],
  },
  14: {
    eyebrow: 'Lab step 3',
    title: 'Inspect the intermediate state',
    subtitle: 'This page catches silent multiplication, filtering, stale values, and ambiguous writes before the final answer.',
    layout: 'lab',
    cardLabels: ['Intermediate', 'Risk signal', 'Evidence'],
  },
  15: {
    eyebrow: 'Lab step 4',
    title: 'Validate the final state against the original requirement',
    subtitle: 'The last lab step is a proof that the final result still means what the prompt required.',
    layout: 'lab',
    cardLabels: ['Final state', 'Requirement check', 'Surviving edge'],
  },
  16: {
    eyebrow: 'Audit checklist',
    title: 'Verify the rule, data state, path, and consequence',
    subtitle: 'The active checklist item shows which part of the answer must be auditable before moving on.',
    layout: 'verify',
    cardLabels: ['Rule', 'Data state', 'Consequence'],
  },
  17: {
    eyebrow: 'Edge-case wheel',
    title: 'Test legal states that classroom samples hide',
    subtitle: 'Use missing, duplicate, null, tie, stale, or concurrent cases to decide whether the model really covers the topic.',
    layout: 'edge',
    cardLabels: ['Legal edge', 'Expected behavior', 'Damage if ignored'],
  },
  18: {
    eyebrow: 'Domain transfer',
    title: 'Keep the relational pressure while replacing the story',
    subtitle: 'The transfer board separates vocabulary changes from the invariant that must stay true.',
    layout: 'transfer',
    cardLabels: ['Old domain', 'New domain', 'Invariant'],
  },
  19: {
    eyebrow: 'Exam reasoning panel',
    title: 'Find the plausible distractor and the hidden requirement',
    subtitle: 'This panel trains concise graduate-style reasoning: infer, test, eliminate, then justify.',
    layout: 'exam',
    cardLabels: ['Hidden requirement', 'Best distractor', 'Elimination proof'],
  },
  20: {
    eyebrow: 'Teach-back ladder',
    title: 'Reconstruct the concept from evidence',
    subtitle: 'Use the ladder to rebuild the explanation in order: grain, invariant, failure, repair, verification.',
    layout: 'teach',
    cardLabels: ['Define', 'Demonstrate', 'Verify'],
  },
}

export const familyModeProfiles: Record<VisualFamily, SubtopicVisualMode[]> = {
  schema: ['adaptive', 'table', 'matrix'],
  query: ['adaptive', 'trace', 'table'],
  set: ['adaptive', 'counterexample', 'matrix'],
  algebra: ['adaptive', 'trace', 'table'],
  view: ['adaptive', 'table', 'map'],
  dependency: ['adaptive', 'matrix', 'table'],
  routine: ['adaptive', 'trace', 'simulator'],
  storage: ['adaptive', 'simulator', 'table'],
  network: ['adaptive', 'trace', 'simulator'],
  statistics: ['adaptive', 'table', 'counterexample'],
}

export function uniqueVisualModes(modes: SubtopicVisualMode[]) {
  return Array.from(new Set(modes))
}

export function visualModesFor(deck: Deck, info: SubtopicPageInfo): SubtopicVisualMode[] {
  const family = deckInteractiveBlueprints[deck.id]?.family ?? 'schema'
  return uniqueVisualModes([
    ...(pageVisualModeProfiles[info.page] ?? ['adaptive', 'map', 'trace']),
    ...familyModeProfiles[family],
  ]).slice(0, 4)
}

export function pageInteractionProfileFor(info: SubtopicPageInfo) {
  return pageInteractionProfiles[info.page] ?? pageInteractionProfiles[1]
}

export function sequenceSlideClassFor(deck: Deck, slide: Deck['slides'][number]) {
  const info = getSubtopicPageInfo(slide)
  if (!info) return ''
  const profile = pageInteractionProfileFor(info)
  const family = deckInteractiveBlueprints[deck.id]?.family ?? 'schema'
  return `sequence-page-${info.page} sequence-layout-${profile.layout} sequence-family-${family}`
}

export function detailAt(items: string[], index: number, fallback: string) {
  return items[index % Math.max(items.length, 1)] ?? fallback
}

export function instrumentCardsFor(
  slide: Deck['slides'][number],
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
  profile: PageInteractionProfile,
): InstrumentCard[] {
  const detailPool = [
    ...(slide.checks ?? []),
    ...(slide.bullets ?? []),
    slide.bridge ?? '',
    slide.body,
  ].filter(Boolean)
  const offset = Math.max(info.page - 1, 0)
  const advancedLens = [
    `In a larger case, write the controlling identity first: row, group, relation schema, dependency determinant, page entry, or runtime boundary for ${info.focus}.`,
    `Check where the rule starts and stops; most wrong answers apply ${model.blueprint.artifact} logic one operation too early or one operation too late.`,
    `Use a legal variation as a stress test: nulls, duplicate detail rows, missing parents, fanout, stale state, nonkey dependencies, and failed commits expose weak reasoning.`,
  ]
  return profile.cardLabels.map((label, index) => {
    const node = model.nodes[(index + offset) % model.nodes.length]
    const stage = model.stages[(index + offset) % model.stages.length]
    const action = model.actions[(index + offset) % model.actions.length]
    const metric = model.metrics[(index + offset) % model.metrics.length]
    const title = index === 0 ? node?.label : index === 1 ? stage?.label : action
    const baseDetail = index === 0 ? node?.detail : index === 1 ? stage?.detail : `${metric}: ${detailAt(detailPool, index + offset, slide.body)}`
    const detailSource = `${baseDetail}. ${advancedLens[index]}`
    return {
      label,
      title: title ?? info.focus,
      detail: compactText(detailSource, 230),
    }
  })
}

export function fallbackTableScenario(_deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>): DbTableScenario {
  const labels = model.nodes.map((node) => node.label)
  return {
    title: `${info.focus} state transition`,
    queryLabel: `Apply ${model.blueprint.artifact} logic`,
    sql: slide.example ?? `${info.focus}\n-- apply the rule, then inspect before and after states`,
    before: {
      title: 'Before reasoning',
      columns: ['fact', 'state', 'risk'],
      rows: [
        [labels[0] ?? info.focus, 'raw input', 'assumption hidden'],
        [labels[1] ?? model.blueprint.artifact, 'candidate rule', 'not yet verified'],
        [labels[2] ?? 'edge case', 'legal variation', 'may break naive answer'],
      ],
      highlightRows: [2],
    },
    after: {
      title: 'After applying rule',
      columns: ['fact', 'state', 'meaning'],
      rows: [
        [labels[0] ?? info.focus, 'validated', compactText(slide.bullets[0], 42)],
        [labels[3] ?? 'repair', 'selected', compactText(slide.checks?.[0], 42)],
        [labels[4] ?? 'result', 'exposed', model.blueprint.artifact],
      ],
      highlightRows: [1],
    },
    analysis: [
      `${info.focus} is shown as an explicit state transition so the learner can inspect the object before the rule changes it.`,
      'The highlighted row marks the concrete assumption, edge case, or repair that changes the database state.',
      'Read this panel as a small experiment: the before state, operation, and after state must tell the same story.',
    ],
  }
}

export function tableScenarioFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>) {
  return tableScenarioLibrary[info.focus] ?? fallbackTableScenario(deck, slide, info, model)
}

export function tableRowSummary(snapshot: DbTableSnapshot, rowIndex: number) {
  const row = snapshot.rows[rowIndex] ?? snapshot.rows[0] ?? []
  if (!row.length) return `${snapshot.title}: no row`
  return snapshot.columns
    .map((column, columnIndex) => `${column}=${row[columnIndex] ?? ''}`)
    .join(', ')
}

export function tableTransitionEvents(
  scenario: DbTableScenario,
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
) {
  if (scenario.transitions?.length) return scenario.transitions
  const beforeRows = scenario.before.highlightRows?.length ? scenario.before.highlightRows : [0]
  const afterRows = scenario.after.highlightRows?.length ? scenario.after.highlightRows : [0]
  const labels = ['Input evidence', 'Rule operation', 'Visible result', 'Edge-case check']

  return scenario.analysis.map((why, index) => ({
    label: labels[index] ?? `Reason ${index + 1}`,
    before: tableRowSummary(scenario.before, beforeRows[index % beforeRows.length]),
    operation: index === 0 ? scenario.queryLabel : `${model.blueprint.artifact}: ${model.actions[index % model.actions.length]}`,
    after: tableRowSummary(scenario.after, afterRows[index % afterRows.length]),
    why: `${why} For ${info.focus}, this is the row-level evidence that connects the displayed before state to the displayed after state.`,
  }))
}

export function baseExampleCode(slide: Deck['slides'][number], scenario: DbTableScenario) {
  const firstBlock = (slide.example ?? scenario.sql).split('\n\nWorked micro-case:')[0]?.trim()
  return firstBlock || scenario.sql
}

export function failureProbeCodeFor(
  _deck: Deck,
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
) {
  const family = model.blueprint.family
  const snippets: Record<VisualFamily, string> = {
    schema: `-- Failure probe for ${info.focus}
INSERT a row that has the right shape but violates the intended key, domain, or reference.
Ask whether the DBMS rejects the row before later queries rely on it.`,
    query: `-- Failure probe for ${info.focus}
Move one predicate to a different clause.
Compare the row grain before and after the move; the syntax may still run while the answer changes.`,
    set: `-- Failure probe for ${info.focus}
Create one outer item with zero matching evidence and one item with two matches.
Check whether IN, EXISTS, JOIN, or difference still preserves the requested membership rule.`,
    algebra: `-- Failure probe for ${info.focus}
Apply projection before the join or rename step.
If a needed attribute disappears, the algebra expression cannot justify the final answer.`,
    view: `-- Failure probe for ${info.focus}
Change the base table while a consumer reads only the view.
If the exposed row grain is unclear, the interface hides the real contract instead of simplifying it.`,
    dependency: `-- Failure probe for ${info.focus}
Add two legal tuples with the same determinant but different dependent values.
If both can exist, the claimed functional dependency is not actually enforced by the data model.`,
    routine: `-- Failure probe for ${info.focus}
Run the event twice or force the action to fail halfway.
The routine must make side effects, rollback behavior, and repeated execution visible.`,
    storage: `-- Failure probe for ${info.focus}
Count index probes without counting data-page fetches.
If the index is unclustered, the apparent logical shortcut may still cause many random reads.`,
    network: `-- Failure probe for ${info.focus}
Break the tunnel, then break credentials, then break SQL.
Each failure occurs at a different runtime layer and should produce a different debugging move.`,
    statistics: `-- Failure probe for ${info.focus}
Join two one-to-many detail tables before aggregating.
If totals inflate, the measure was computed at the wrong denominator or output grain.`,
  }

  return snippets[family] ?? snippets.schema
}

export function repairSnippetFor(
  _deck: Deck,
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
  scenario: DbTableScenario,
) {
  const family = model.blueprint.family
  const snippets: Record<VisualFamily, string> = {
    schema: `-- Repair pattern
Name the row grain for ${info.focus} first.
Declare the narrowest constraint that blocks the illegal state.
Then test with: ${scenario.queryLabel}`,
    query: `-- Repair pattern
WITH correct_grain AS (
  ${scenario.sql.split('\n')[0] ?? 'SELECT ...'}
)
SELECT only the attributes that match the requested output grain.`,
    set: `-- Repair pattern
Build the candidate set explicitly.
Subtract or test membership using the relation that proves absence or presence.
Return the outer object only when the evidence set agrees.`,
    algebra: `-- Repair pattern
R1 := ?_condition(R)
R2 := R1 ?_key S
Answer := ?_requested(R2)
Verify that every projected attribute exists after the previous operator.`,
    view: `-- Repair pattern
CREATE VIEW stable_contract AS
${scenario.sql}
-- Consumers depend on the published columns and row grain, not on hidden base-table detail.`,
    dependency: `-- Repair pattern
Compute X+.
If X+ misses attributes needed for a key, decompose around the determinant.
Check that the common attributes make the join lossless.`,
    routine: `-- Repair pattern
START TRANSACTION;
  perform the visible event;
  perform every required side effect;
  verify affected row counts;
COMMIT;`,
    storage: `-- Repair pattern
Estimate:
1. root/internal index pages
2. leaf pages
3. data pages
4. dirty-page writes or pinned-frame limits`,
    network: `-- Repair pattern
Open connection -> prepare statement -> bind values -> execute -> consume ResultSet -> close resources.
Debug in that order before rewriting the SQL.`,
    statistics: `-- Repair pattern
Pre-aggregate each many-side table to the target grain.
Join summaries after denominators are stable.
Compute rates only after numerator and denominator match.`,
  }

  return snippets[family] ?? snippets.schema
}

export function appliedCaseCardsFor(
  deck: Deck,
  slide: Deck['slides'][number],
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
  scenario: DbTableScenario,
): AppliedCaseCard[] {
  const checkPool = [...(slide.checks ?? []), ...(slide.bullets ?? [])].filter(Boolean)
  const firstCheck = detailAt(checkPool, 0, slide.body)
  const secondCheck = detailAt(checkPool, 1, slide.bridge ?? slide.body)
  const thirdCheck = detailAt(checkPool, 2, slide.body)
  const activeMetric = model.metrics[info.page % model.metrics.length] ?? model.blueprint.artifact
  const activeAction = model.actions[info.page % model.actions.length] ?? scenario.queryLabel

  return [
    {
      label: 'Worked case',
      title: scenario.title,
      objective: `Use the displayed before and after states to see ${info.focus} as an executable database behavior, not as a vocabulary item.`,
      code: baseExampleCode(slide, scenario),
      evidence: scenario.analysis.slice(0, 3),
      diagnostic: firstCheck,
      transfer: `Transfer move: replace the table names with a new domain, but preserve the same ${model.blueprint.artifact} and explain which row, group, dependency, page, or runtime object changed.`,
    },
    {
      label: 'Failure probe',
      title: `${info.focus} under a legal stress case`,
      objective: `The useful mistake is a case that still looks plausible while breaking ${activeMetric}. This trains you to find the hidden assumption before a larger schema hides it.`,
      code: failureProbeCodeFor(deck, info, model),
      evidence: [
        `Stress the current rule with ${activeAction}; the interesting result is the first place where row meaning, value legality, group identity, or execution state changes.`,
        compactText(secondCheck, 160),
        `A good probe stays legal. It should expose a flawed assumption, not depend on impossible data.`,
      ],
      diagnostic: secondCheck,
      transfer: `Try the same failure probe against a reporting query, a write transaction, and an API endpoint. The surface syntax changes, but the proof burden remains local to the same database object.`,
    },
    {
      label: 'Repair logic',
      title: `Repair the invariant instead of the symptom`,
      objective: `After the failure is visible, choose the narrowest reliable repair: constraint, query rewrite, decomposition, view contract, procedure, trigger, index, or application transaction.`,
      code: repairSnippetFor(deck, info, model, scenario),
      evidence: [
        compactText(thirdCheck, 160),
        `The repair should make the before state, operation, and after state auditable from the slide without requiring a hidden rule.`,
        `If the fix only changes the displayed answer but leaves the bad intermediate state possible, it is not a database repair yet.`,
      ],
      diagnostic: thirdCheck,
      transfer: `Write one sentence that starts with "This repair works because..." and names the exact key, predicate, dependency, page route, transaction state, or driver boundary that now stays stable.`,
    },
  ]
}

export const tablePhaseLabels: Record<'before' | 'sql' | 'after' | 'analysis', string> = {
  before: 'Before',
  sql: 'Operation',
  after: 'After',
  analysis: 'Why',
}

export function nodeWhyText(info: SubtopicPageInfo, node: { label: string; detail: string }, slide: Deck['slides'][number]) {
  return `${node.label} is the local object to inspect for ${info.focus}. ${node.detail} Keep the explanation attached to this node: do not let a later result card replace the evidence that made this node necessary. ${slide.checks?.[0] ?? 'State the test that proves this node belongs in the solution.'}`
}

export function stageChangeText(info: SubtopicPageInfo, stage: { label: string; detail: string }, slide: Deck['slides'][number]) {
  return `${stage.label} changes the current intermediate state for ${info.focus}. ${stage.detail} For a larger case, write the relation schema, row grain, dependency set, access path, or runtime object that exists after this step before using it in the next step. ${slide.checks?.[1] ?? slide.checks?.[0] ?? 'Name the evidence produced by this stage.'}`
}

export function matrixDecisionText(info: SubtopicPageInfo, row: string, column: string, slide: Deck['slides'][number]) {
  return `${row} is the mechanism being considered; ${column} is the behavior it is being tested against. In ${info.focus}, this pairing is useful only if it explains a concrete legal-state change, result-grain change, dependency change, access-path change, or runtime-state change. ${slide.checks?.[0] ?? 'Test the pairing against the scenario before accepting it.'}`
}

export function simulationEventsFor(
  slide: Deck['slides'][number],
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
) {
  return model.actions.map((action, index) => ({
    action,
    input: model.nodes[index % model.nodes.length]?.label ?? info.focus,
    metric: model.metrics[index % model.metrics.length] ?? model.blueprint.artifact,
    check: slide.checks?.[index % Math.max(slide.checks.length, 1)] ?? slide.bullets[index % Math.max(slide.bullets.length, 1)] ?? slide.body,
    consequence: `${action} should change only the evidence attached to ${info.focus}. If the visual highlights a metric, read it as the measurable consequence of this action, not as a separate score or unrelated card.`,
  }))
}

export function traceStateForStage(
  slide: Deck['slides'][number],
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
  stageIndex: number,
) {
  const stage = model.stages[stageIndex % model.stages.length]
  const nodeBefore = model.nodes[stageIndex % model.nodes.length]?.label ?? info.focus
  const nodeAfter = model.nodes[(stageIndex + 1) % model.nodes.length]?.label ?? model.blueprint.artifact
  const check = slide.checks?.[stageIndex % Math.max(slide.checks.length, 1)] ?? slide.bullets[stageIndex % Math.max(slide.bullets.length, 1)] ?? slide.body

  return {
    before: nodeBefore,
    operation: stage.label,
    after: nodeAfter,
    proof: compactText(check, 128),
  }
}

export function traceArtifactForStage(
  deck: Deck,
  slide: Deck['slides'][number],
  info: SubtopicPageInfo,
  model: ReturnType<typeof buildSubtopicVisualModel>,
  stageIndex: number,
) {
  const stage = model.stages[stageIndex % model.stages.length]
  const family = model.blueprint.family
  const check = slide.checks?.[stageIndex % Math.max(slide.checks.length, 1)] ?? slide.bridge ?? slide.body

  if (family === 'algebra') {
    const algebraSteps = [
      'R0 := Product(model, maker, type)\nSchema(R0) = {model, maker, type}\nLarge-case rule: name the available attributes before choosing the next operator.',
      'R1 := ?_condition(R0)\nRows may shrink; schema stays {model, maker, type}\nLarge-case rule: selection predicates must mention attributes currently present.',
      'R2 := ?_model,maker(R1)\nRows keep identity only if projected attributes still support later joins or comparisons.\nLarge-case rule: project late when a future operator still needs a removed attribute.',
      'R3 := ?_P1(R2)\nSchema is renamed so one relation can play a separate role.\nLarge-case rule: rename prevents self-comparison ambiguity; it does not change meaning by itself.',
      'R4 := R3 ?_P1.model=L.model L\nJoin changes row context and can multiply tuples.\nLarge-case rule: inspect join keys and fanout before projecting the final answer.',
      'Answer := ?_requested_attributes(R4)\nThe final schema must match the question exactly.\nLarge-case rule: verify both tuple membership and output attributes.',
    ]
    return algebraSteps[stageIndex % algebraSteps.length]
  }

  if (family === 'query' || family === 'statistics') {
    const querySteps = [
      'FROM stage\nCandidate rows are created from base tables or joined sources.\nLarge-case rule: inspect whether joins changed the row grain before filtering.',
      'WHERE stage\nIndividual rows are removed before grouping.\nLarge-case rule: row predicates belong here only if each row can be judged independently.',
      'GROUP BY stage\nRows collapse into one output group per declared grain.\nLarge-case rule: every nonaggregate output column must be compatible with this grain.',
      'HAVING stage\nGroups are removed after aggregate values exist.\nLarge-case rule: aggregate predicates cannot be evaluated before grouping.',
      'SELECT stage\nExpressions and aliases name the already-shaped answer.\nLarge-case rule: aliases are presentation labels unless referenced by a later legal clause.',
      'ORDER BY stage\nThe answer is sorted without changing membership.\nLarge-case rule: sorting should never be used as a correctness repair.',
    ]
    return querySteps[stageIndex % querySteps.length]
  }

  if (family === 'dependency') {
    return `Closure trace for ${info.focus}\nStart with the determinant currently proven.\nApply stage: ${stage.label}\nCheck: ${compactText(check, 150)}\nLarge-case rule: a dependency must hold for every legal instance, not only the displayed rows.`
  }

  if (family === 'storage') {
    return `Physical trace for ${info.focus}\nObject before: page, frame, entry, or leaf interval.\nOperation: ${stage.label}\nCheck: ${compactText(check, 150)}\nLarge-case rule: count page movement and ordering constraints before trusting the access path.`
  }

  if (family === 'network') {
    return `Runtime trace for ${info.focus}\nLayer before: caller, driver, tunnel, session, statement, or cursor.\nOperation: ${stage.label}\nCheck: ${compactText(check, 150)}\nLarge-case rule: debug the earliest failing layer before changing SQL semantics.`
  }

  if (family === 'routine') {
    return `Procedure/trigger trace for ${info.focus}\nBoundary before: caller input, event row, local variable, or transaction state.\nOperation: ${stage.label}\nCheck: ${compactText(check, 150)}\nLarge-case rule: make side effects and rollback behavior visible in the trace.`
  }

  if (family === 'view') {
    return `View contract trace for ${info.focus}\nPublished relation before: base rows or prior view result.\nOperation: ${stage.label}\nCheck: ${compactText(check, 150)}\nLarge-case rule: name the consumer-facing row grain and exposed columns.`
  }

  return `${deck.title} trace for ${info.focus}\nOperation: ${stage.label}\n${stage.detail}\nCheck: ${compactText(check, 150)}\nLarge-case rule: record the intermediate object before the next operation uses it.`
}

export function buildSubtopicVisualModel(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo) {
  const blueprint = deckInteractiveBlueprints[deck.id] ?? deckInteractiveBlueprints.ddl
  const focusNodes = focusNodeLibrary[info.focus] ?? [info.focus, ...(deckVisualLabels[deck.id] ?? deck.goals)].slice(0, 5)
  const detailPool = [
    ...(slide.bullets ?? []),
    ...(slide.checks ?? []),
    slide.bridge ?? '',
    slide.body,
  ].filter(Boolean)
  const nodes = focusNodes.slice(0, 5).map((label, index) => ({
    label,
    detail: compactText(detailAt(detailPool, index, slide.body), 108),
  }))
  const stages = blueprint.stages.map((label, index) => ({
    label,
    detail: compactText(detailAt(detailPool, index + info.page, slide.body), 120),
  }))
  const scenarios = [
    {
      label: 'Clean sample',
      input: nodes[0]?.label ?? info.focus,
      output: nodes[1]?.label ?? blueprint.artifact,
      insight: compactText(slide.bullets[0] ?? slide.body, 118),
    },
    {
      label: 'Hidden edge',
      input: nodes[2]?.label ?? 'edge case',
      output: nodes[3]?.label ?? 'failure',
      insight: compactText(slide.checks?.[0] ?? slide.bridge ?? slide.body, 118),
    },
    {
      label: 'Repaired rule',
      input: blueprint.actions[info.page % blueprint.actions.length],
      output: nodes[4]?.label ?? 'validated result',
      insight: compactText(slide.checks?.[1] ?? slide.bridge ?? slide.body, 118),
    },
  ]

  return {
    blueprint,
    nodes,
    stages,
    scenarios,
    matrixRows: blueprint.matrixRows,
    matrixColumns: blueprint.matrixColumns,
    metrics: blueprint.metrics,
    actions: blueprint.actions,
    code: slide.example ?? `${info.focus} -> ${blueprint.artifact}`,
  }
}


export function deepDiveCodeFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
  const focusName = identifierFrom(info.focus)
  const firstStage = model.stages[0]?.label ?? model.blueprint.stages[0]
  const secondStage = model.stages[1]?.label ?? model.blueprint.stages[1] ?? model.blueprint.artifact

  switch (deck.id) {
    case 'ddl':
      return `-- Goal: turn the story into rejected and accepted states.
CREATE TABLE ${focusName}_parent (
  id INT PRIMARY KEY,
  label VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE ${focusName}_child (
  parent_id INT NOT NULL,
  local_no INT NOT NULL,
  observed_state VARCHAR(24) NOT NULL DEFAULT 'active',
  PRIMARY KEY (parent_id, local_no),
  FOREIGN KEY (parent_id)
    REFERENCES ${focusName}_parent(id)
    ON DELETE RESTRICT
);

-- Test: an orphan child should fail before the workflow runs.`
    case 'dml':
      return `-- Goal: keep row filters and group filters in different phases.
WITH source_rows AS (
  SELECT restaurant_id, order_id, promised_at, delivered_at, total
  FROM delivery_event
  WHERE promised_at < delivered_at
)
SELECT restaurant_id,
       COUNT(*) AS late_orders,
       SUM(total) AS late_revenue
FROM source_rows
GROUP BY restaurant_id
HAVING COUNT(*) >= 5
ORDER BY late_revenue DESC;`
    case 'joins-subqueries':
      return `-- Goal: preserve the candidate row while proving membership.
SELECT m.movie_id, m.title
FROM Movie AS m
WHERE EXISTS (
  SELECT 1
  FROM RentalItem AS i
  WHERE i.movie_id = m.movie_id
)
AND NOT EXISTS (
  SELECT 1
  FROM DamageReport AS d
  WHERE d.movie_id = m.movie_id
);`
    case 'relational-algebra':
      return `Wanted :=
  ?_maker (
    Product ?_{Product.model = Laptop.model}
    ?_{drive >= 1000 AND ram >= 16}(Laptop)
  )

Check:
  ? keeps tuple membership testable.
  ? happens before maker is projected.
  ? removes extra columns only at the end.`
    case 'views':
      return `-- Goal: publish a stable interface, not every base fact.
CREATE VIEW active_rental_balance AS
SELECT c.customer_id,
       c.display_name,
       COUNT(r.rental_id) AS open_rentals,
       SUM(r.balance_due) AS balance_due
FROM Customer AS c
JOIN Rental AS r ON r.customer_id = c.customer_id
WHERE r.returned_at IS NULL
GROUP BY c.customer_id, c.display_name;`
    case 'normalization':
      return `R(student_id, course_id, instructor, room, grade)
FDs:
  course_id -> instructor, room
  student_id, course_id -> grade

Decompose:
  Course(course_id, instructor, room)
  Enrollment(student_id, course_id, grade)

Lossless check:
  common attribute course_id determines Course.`
    case 'modules-triggers':
      return `-- Goal: make the event boundary explicit.
CREATE TRIGGER return_inventory_after_update
AFTER UPDATE ON RentalItem
FOR EACH ROW
BEGIN
  IF OLD.returned_at IS NULL
     AND NEW.returned_at IS NOT NULL THEN
    UPDATE Inventory
       SET available_count = available_count + 1
     WHERE movie_id = NEW.movie_id;
  END IF;
END;`
    case 'storage-indexes':
      return `Workload:
  WHERE customer_id = ? AND rental_date >= ?
  ORDER BY rental_date

Candidate index:
  CREATE INDEX rental_customer_date
  ON Rental(customer_id, rental_date);

Trace:
  root page -> leaf interval -> ordered entries -> record fetches

Warning:
  reversing key order weakens the equality-plus-range search.`
    case 'jdbc':
      return `String sql = """
  SELECT title, due_date
  FROM RentalView
  WHERE customer_id = ?
  ORDER BY due_date
""";

try (Connection c = DriverManager.getConnection(url, user, pw);
     PreparedStatement ps = c.prepareStatement(sql)) {
  ps.setInt(1, customerId);
  try (ResultSet rs = ps.executeQuery()) {
    while (rs.next()) {
      readRentalRow(rs);
    }
  }
}`
    case 'capstone-studio':
      return `Feature contract for ${focusName}:
1. Schema invariant rejects impossible state.
2. View publishes one stable result grain.
3. Transaction writes all dependent rows together.
4. Index matches the common lookup path.
5. JDBC path binds parameters and closes resources.

Regression test:
  invalid state, duplicate event, stale read, slow lookup, failed commit.`
    default:
      return `${model.blueprint.artifact}
Stage 1: ${firstStage}
Stage 2: ${secondStage}
Artifact:
${scenario.sql || slide.example || slide.body}`
  }
}

export function deepDiveChecksFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
  const checks = [
    `Before: ${compactText(scenario.before.title, 52)}. Name the row or object that exists before ${model.actions[0] ?? 'the operation'} runs.`,
    `Operation: ${compactText(model.stages[info.page % model.stages.length]?.label ?? model.blueprint.stages[0], 52)}. Explain which facts are added, removed, grouped, hidden, split, or fetched.`,
    `After: ${compactText(scenario.after.title, 52)}. Verify that the visible answer still has the required ${model.blueprint.artifact}.`,
    `Stress case: ${compactText(slide.checks?.[0] ?? slide.bridge ?? slide.body, 110)}`,
  ]

  if (deck.id === 'joins-subqueries') {
    checks.push('Fanout audit: if one outer row matches three inner rows, decide whether the answer should show one candidate or three detail facts.')
  } else if (deck.id === 'normalization') {
    checks.push('Dependency audit: update the determinant once and prove no dependent fact is left duplicated under another key.')
  } else if (deck.id === 'storage-indexes') {
    checks.push('Cost audit: count the page reads that remain after the index narrows the interval, not only the rows returned.')
  } else if (deck.id === 'jdbc') {
    checks.push('Runtime audit: a correct query still fails if the tunnel, URL, parameter type, cursor loop, or close scope is wrong.')
  }

  return checks
}

export function deepDivePracticeCardsFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
  const stageA = model.stages[info.page % model.stages.length] ?? model.stages[0]
  const stageB = model.stages[(info.page + 1) % model.stages.length] ?? model.stages[1] ?? stageA
  const action = model.actions[info.page % model.actions.length] ?? model.blueprint.actions[0]
  const metric = model.metrics[info.page % model.metrics.length] ?? model.blueprint.metrics[0]
  const check = slide.checks?.[info.page % Math.max(slide.checks.length, 1)] ?? slide.bridge ?? slide.body
  const beforeColumns = scenario.before.columns.slice(0, 3).join(', ')
  const afterColumns = scenario.after.columns.slice(0, 3).join(', ')
  const familySpecific: Record<string, { label: string; detail: string }[]> = {
    ddl: [
      { label: 'Invalid-row drill', detail: `Write one row for ${scenario.before.title} that should be rejected, then name the exact key, foreign key, or check clause that rejects it.` },
      { label: 'Lifecycle drill', detail: `Change the delete policy and predict whether history is preserved, cascaded, restricted, or converted to an optional reference.` },
    ],
    dml: [
      { label: 'Clause relocation', detail: `Move one predicate between WHERE and HAVING, then explain whether it now tests individual rows or completed groups.` },
      { label: 'Alias discipline', detail: `Rename a derived expression only after the relation shape is correct; an alias must not hide a wrong grouping grain.` },
    ],
    'joins-subqueries': [
      { label: 'Fanout drill', detail: `Add two matching inner rows and decide whether the output should duplicate the outer row or still return one membership answer.` },
      { label: 'Anti-match drill', detail: `Insert a NULL in the inner evidence and decide whether NOT EXISTS or NOT IN represents the safer absence test.` },
    ],
    'relational-algebra': [
      { label: 'Projection timing', detail: `Project away one attribute and check whether a later join, selection, or rename still has enough schema evidence to run.` },
      { label: 'Equivalence drill', detail: `Push a selection downward only when all referenced attributes still exist at the lower point in the expression tree.` },
    ],
    views: [
      { label: 'Consumer contract', detail: `Remove one exposed column and decide which application query breaks; that dependency defines the view boundary.` },
      { label: 'Update path', detail: `Try to update a derived or aggregated column and explain why the base-table target is ambiguous or rejected.` },
    ],
    normalization: [
      { label: 'Closure drill', detail: `Start from the determinant and list every attribute it implies before deciding whether the table violates 2NF, 3NF, or BCNF.` },
      { label: 'Lossless drill', detail: `Join the proposed split back on the common attributes and check whether spurious tuples can appear.` },
    ],
    'modules-triggers': [
      { label: 'Timing drill', detail: `Move the rule from BEFORE to AFTER and explain whether OLD values, NEW values, and rollback behavior still match the workflow.` },
      { label: 'Side-effect drill', detail: `Update multiple rows at once and decide whether the routine logic is row-local or needs a transaction-level guard.` },
    ],
    'storage-indexes': [
      { label: 'Prefix drill', detail: `Swap index key order and count which predicates still narrow the B+ tree search before the range scan begins.` },
      { label: 'Update-cost drill', detail: `Insert a row into a full leaf page and trace split, parent update, dirty page, and later write-back.` },
    ],
    jdbc: [
      { label: 'Binding drill', detail: `Replace string concatenation with placeholders and explain which values become data rather than executable SQL text.` },
      { label: 'Resource drill', detail: `Force an exception after executeQuery and verify which Connection, PreparedStatement, and ResultSet scopes still close.` },
    ],
    'capstone-studio': [
      { label: 'Feature drill', detail: `Pair every visible query with the schema invariant and transaction that make its answer trustworthy under failure.` },
      { label: 'Readiness drill', detail: `Run the feature through invalid input, duplicate event, slow lookup, lost connection, and rollback scenarios.` },
    ],
  }

  return [
    { label: 'Micro dataset', detail: `Before columns: ${beforeColumns || 'row evidence'}. After columns: ${afterColumns || 'result evidence'}. Use these headings to state the exact grain before calculating anything.` },
    { label: 'Operation contrast', detail: `${stageA.label} is not interchangeable with ${stageB.label}; one changes the current proof object before the other can be trusted.` },
    { label: 'Metric to watch', detail: `Track ${metric}. If this value changes unexpectedly after ${action}, the visual answer is probably hiding a grain or boundary error.` },
    { label: 'Counterexample row', detail: `Invent a legal row that satisfies the sample but violates the weak interpretation of ${info.focus}; this is the fastest way to expose a shallow answer.` },
    { label: 'Repair sentence', detail: `A complete repair says what mechanism changes, why it belongs there, and which later state can now be verified without guessing.` },
    { label: 'Reading checkpoint', detail: compactText(check, 180) },
    ...(familySpecific[deck.id] ?? [
      { label: 'Transfer drill', detail: `Replace the domain story while preserving ${model.blueprint.artifact}; the correct explanation should still work.` },
      { label: 'Audit drill', detail: `Log the intermediate object that proves the answer, not only the final display label.` },
    ]),
  ].slice(0, 8)
}

export function deepWorksheetCardsFor(slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
  const metric = model.metrics[(info.page + 1) % model.metrics.length] ?? model.blueprint.metrics[0]
  const action = model.actions[(info.page + 2) % model.actions.length] ?? model.blueprint.actions[0]
  const stage = model.stages[(info.page + 2) % model.stages.length] ?? model.stages[0]
  const rowName = scenario.before.rows[0]?.[0] ?? 'candidate row'
  const resultName = scenario.after.rows[0]?.[0] ?? 'result row'
  const evidence = [
    ...(slide.checks ?? []),
    ...(slide.terms?.flatMap((term) => [term.definition, term.logic]) ?? []),
    ...slide.bullets,
    slide.bridge ?? '',
    slide.body,
  ].filter(Boolean)

  return [
    { label: 'Invariant', detail: `${model.blueprint.artifact} must remain true after ${action}; otherwise the example is only a display trick.` },
    { label: 'Small failing input', detail: `Use ${rowName} as a template and change one value until the weaker interpretation of ${info.focus} breaks.` },
    { label: 'Expected count', detail: `Predict whether ${metric} should increase, decrease, or stay unchanged before looking at ${resultName}.` },
    { label: 'Boundary', detail: `Decide whether ${stage.label} is enforceable by the DBMS or needs a query, module, trigger, transaction, index, or application rule.` },
    { label: 'Intermediate proof', detail: `Write the intermediate table, dependency closure, page state, or runtime object that makes the final answer auditable.` },
    { label: 'Null or missing case', detail: `Add one missing, NULL, unmatched, stale, or absent value and explain whether the same mechanism still gives a deterministic answer.` },
    { label: 'Duplicate case', detail: `Add a duplicate detail fact and check whether the row grain, group grain, dependency owner, or access path changes.` },
    { label: 'Performance note', detail: `If this logic runs at scale, identify whether the bottleneck is fanout, aggregation, index traversal, buffer churn, network round trips, or trigger side effects.` },
    { label: 'Repair move', detail: compactText(evidence[info.page % evidence.length] ?? slide.body, 190) },
    { label: 'Proof sentence', detail: `Therefore, ${info.focus} is correct only when the visible result and the hidden ${model.blueprint.artifact} are both preserved.` },
  ]
}


export type SequenceWorkbenchContent = {
  rule: string
  trace: string
  exampleTitle: string
  exampleCode: string
  trap: string
  transfer: string
  proof: string
}

export function sequenceWorkbenchContentFor({
  deck,
  info,
  slide,
  stage,
  nextStage,
  action,
  metric,
}: {
  deck: Deck
  info: SubtopicPageInfo
  slide: Deck['slides'][number]
  stage: string
  nextStage: string
  action: string
  metric: string
}): SequenceWorkbenchContent {
  const focus = plainText(info.focus)
  const objectName = identifierFrom(focus)
  const check = compactText(slide.checks?.[0] ?? getPracticePrompt(deck, info.page - 1), 155)
  const bullet = compactText(slide.bullets[0] ?? slide.body, 150)

  const shared = {
    trace: `Trace ${stage} into ${nextStage}. The question is not only what changes, but which fact is still allowed to mean the same thing after the change.`,
    proof: `${check} Then state the smallest counterexample that would make the claim false.`,
  }

  switch (deck.id) {
    case 'ddl':
      return {
        ...shared,
        rule: `A DDL choice is a promise about all future rows, not a description of today's sample data. For ${focus}, decide the row identity before deciding whether the database should reject, default, cascade, or defer the case.`,
        exampleTitle: 'Constraint trace',
        exampleCode: `CREATE TABLE ${objectName}_child (
  parent_id INT NOT NULL,
  local_no INT NOT NULL,
  status VARCHAR(16) DEFAULT 'active',
  PRIMARY KEY (parent_id, local_no),
  FOREIGN KEY (parent_id) REFERENCES ${objectName}_parent(id)
);`,
        trap: `A syntactically valid table can still encode the wrong lifecycle. If ${action} removes audit evidence or makes optional data mandatory, the error is semantic even when every clause compiles.`,
        transfer: `Transfer case: model numbered lab instruments, ticket seats, or library copies. The parent exists independently; the child row must have a stable local identity and a clear delete policy.`,
      }
    case 'dml':
      return {
        ...shared,
        rule: `SQL DML is easiest when read as a pipeline of relation shapes. For ${focus}, name the row grain before every clause so filtering, grouping, aliasing, and sorting do not silently answer different questions.`,
        exampleTitle: 'Clause order micro-run',
        exampleCode: `SELECT restaurant_id, COUNT(*) AS late_orders
FROM delivery_event
WHERE promised_at < delivered_at
GROUP BY restaurant_id
HAVING COUNT(*) >= 5
ORDER BY late_orders DESC;`,
        trap: `Moving a predicate across GROUP BY is not a harmless formatting change. A row predicate removes events; a group predicate removes restaurant summaries after the measure exists.`,
        transfer: `Transfer case: replace deliveries with course enrollments, rentals, or support tickets. The logic survives only if the WHERE condition can be judged per source row and HAVING can be judged per output group.`,
      }
    case 'joins-subqueries':
      return {
        ...shared,
        rule: `Join and subquery problems are membership problems before they are syntax problems. For ${focus}, decide whether the answer needs joined facts, existence, absence, scalar comparison, or all tied rows.`,
        exampleTitle: 'Membership probe',
        exampleCode: `SELECT m.movie_id, m.title
FROM Movie AS m
WHERE NOT EXISTS (
  SELECT 1
  FROM RentalItem AS r
  WHERE r.movie_id = m.movie_id
);`,
        trap: `Replacing an existence test with an inner join can multiply rows and lose unmatched candidates. The visible output may look plausible while the membership rule has changed.`,
        transfer: `Transfer case: find customers with no unpaid invoice, products never returned, or students missing a prerequisite. Keep the outer candidate row outside the subquery unless the final answer intentionally changes grain.`,
      }
    case 'relational-algebra':
      return {
        ...shared,
        rule: `Relational algebra is a proof language for row membership and output schema. For ${focus}, every operator must preserve the attributes needed by later predicates and joins.`,
        exampleTitle: 'Symbolic rewrite',
        exampleCode: `Wanted := ?_maker(
  Product ?_{Product.model = Laptop.model}
  ?_{drive ??1000}(Laptop)
)`,
        trap: `Projecting too early can erase the join key. A shorter expression is not equivalent if a later operator needs an attribute that was removed.`,
        transfer: `Transfer case: rewrite a SQL query into algebra, then move one ? operator earlier. The rewrite is valid only when the selection references attributes still present at that point.`,
      }
    case 'views':
      return {
        ...shared,
        rule: `A view is a named contract for consumers. For ${focus}, separate the private base-table reality from the stable relation that downstream code is allowed to depend on.`,
        exampleTitle: 'Interface contract',
        exampleCode: `CREATE VIEW active_customer_invoice AS
SELECT c.customer_id, c.name, SUM(i.balance) AS open_balance
FROM Customer AS c
JOIN Invoice AS i ON i.customer_id = c.customer_id
WHERE i.status <> 'paid'
GROUP BY c.customer_id, c.name;`,
        trap: `A view that exposes convenient columns can still be a bad interface if it leaks private fields, hides grain changes, or promises updatability that the definition cannot support.`,
        transfer: `Transfer case: publish a payroll-safe employee view, a course roster view, or a rental availability view. The view should hide implementation detail while keeping the result grain explicit.`,
      }
    case 'normalization':
      return {
        ...shared,
        rule: `Normalization asks where a fact belongs because of dependency, not because the table currently has space. For ${focus}, mark the determinant, test closure, then split only when the join can reconstruct the original facts.`,
        exampleTitle: 'Dependency-owned fact',
        exampleCode: `Enrollment(student_id, course_id, instructor, room)
FD: course_id -> instructor, room
Repair:
  Course(course_id, instructor, room)
  Enrollment(student_id, course_id)`,
        trap: `Keeping course facts in every enrollment row appears convenient until one section changes room. The anomaly proves the fact belongs with the determinant, not with every student-course pair.`,
        transfer: `Transfer case: supplier address, department chair, product category tax rate, or airport time zone. If one value determines another across all legal rows, repetition is evidence of the wrong relation.`,
      }
    case 'modules-triggers':
      return {
        ...shared,
        rule: `Stored modules and triggers encode behavior boundaries. For ${focus}, decide whether the rule needs an explicit call, a returned value, an automatic event reaction, or application-level orchestration.`,
        exampleTitle: 'Event boundary',
        exampleCode: `CREATE TRIGGER rental_item_returned
AFTER UPDATE ON RentalItem
FOR EACH ROW
BEGIN
  IF NEW.returned_at IS NOT NULL THEN
    UPDATE Inventory
    SET available_count = available_count + 1
    WHERE movie_id = NEW.movie_id;
  END IF;
END;`,
        trap: `A trigger can make a workflow automatic, but it can also hide side effects. The design must expose timing, row scope, rollback behavior, and what happens when several rows change together.`,
        transfer: `Transfer case: invoice posting, seat release, inventory adjustment, or grade recalculation. Use a trigger only when the database event itself is the most reliable boundary for the rule.`,
      }
    case 'storage-indexes':
      return {
        ...shared,
        rule: `Storage reasoning turns logical predicates into page movement. For ${focus}, count which pages can be skipped, which entries must be scanned, and what each update will cost.`,
        exampleTitle: 'Access-path sketch',
        exampleCode: `B+ tree on (customer_id, rental_date)
Seek customer_id = 42
Scan leaf interval for rental_date >= '2026-01-01'
Fetch matching records or cover from index entries`,
        trap: `An index is not useful just because a column appears in the query. Prefix order, range boundaries, clustering, and update cost decide whether it improves the actual workload.`,
        transfer: `Transfer case: message inboxes, order history, hospital visits, or log events. Choose the index from the common search interval and the desired order, not from isolated column names.`,
      }
    case 'jdbc':
      return {
        ...shared,
        rule: `JDBC correctness has both SQL semantics and runtime resource semantics. For ${focus}, trace the Java object, driver session, prepared statement, result cursor, tunnel, and close boundary separately.`,
        exampleTitle: 'Runtime path',
        exampleCode: `try (Connection c = DriverManager.getConnection(url, user, pw);
     PreparedStatement ps = c.prepareStatement(
       "SELECT title FROM Movie WHERE movie_id = ?")) {
  ps.setInt(1, movieId);
  try (ResultSet rs = ps.executeQuery()) {
    while (rs.next()) readTitle(rs);
  }
}`,
        trap: `A query can be logically correct and still fail because the connection URL, tunnel, credential, parameter binding, or resource lifetime is wrong.`,
        transfer: `Transfer case: replace a local database with a remote VM. The SQL text may not change, but the failure point may move to driver loading, port forwarding, authentication, or result-set iteration.`,
      }
    case 'capstone-studio':
      return {
        ...shared,
        rule: `A mature database feature connects invariant, schema, query, transaction, index, and runtime path. For ${focus}, require every layer to make the same promise in a testable form.`,
        exampleTitle: 'End-to-end contract',
        exampleCode: `Requirement -> CHECK / FK / UNIQUE
Query contract -> view or tested SELECT
Workflow -> transaction or stored routine
Access path -> index for the real predicate
Runtime -> prepared statement and resource close`,
        trap: `A polished query is not a finished system. If invalid states can enter, history can disappear, performance collapses, or JDBC cannot execute the path, the feature is incomplete.`,
        transfer: `Transfer case: build a booking, checkout, registration, or inventory workflow. The same end-to-end contract should survive when the domain vocabulary changes.`,
      }
    default:
      return {
        ...shared,
        rule: `${deck.title} asks you to connect syntax, data state, and operational consequence. For ${focus}, keep the controlling object visible before trusting the final answer.`,
        exampleTitle: 'Reasoning trace',
        exampleCode: `${focus}
stage: ${stage}
action: ${action}
metric: ${metric}
evidence: ${bullet}`,
        trap: `The most common error is treating a familiar term as proof. The proof must show why the operation preserves the exact object required by the prompt.`,
        transfer: `Transfer case: change table names and story details, then check whether the same ${metric} still proves the result.`,
      }
  }
}


