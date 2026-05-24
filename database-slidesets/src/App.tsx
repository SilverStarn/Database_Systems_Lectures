import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Command,
  Database,
  Eye,
  GraduationCap,
  Library,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { getAcademicContent, type AcademicSlideContent } from './academicContent'
import {
  decks,
  slideCount,
  type Deck,
} from './courseData'
import {
  getMasteryNode,
  masteryPath,
  type MasteryPathNode,
} from './masteryPath'
import {
  getDeckQuiz,
  getRichQuizCount,
  type RichQuizQuestion,
} from './quizContent'
import { QuizFeedbackGrid, QuizQuestionInput } from './QuizQuestionComponents'
import {
  correctAnswerLabel,
  correctAnswerPatch,
  createAttemptState,
  disabledStateAfterRetry,
  incorrectFeedbackFor,
  matchValues,
  normalizeAttemptStates,
  primaryFeedback,
  responseCanAdvance,
  responseIsCorrect,
  responseIsReady,
  visualSelection,
  type InteractiveAttemptState,
  type QuizStatus,
  type SlideAttemptState,
  type SlideAttemptStatesByDeck,
  type UserAnswer,
} from './quizRuntime'
import { normalizeInlineSymbols, plainText, renderMathAwareCode, renderRichText } from './richText'
import './App.css'

type Mode = 'lecture' | 'quiz'
type PlaySpeed = 6000 | 9000 | 12000
type BookmarkedSlides = Record<string, number[]>
type PersistedStudyState = {
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
type StudyCommandKind = 'deck' | 'slide' | 'quiz' | 'bookmark'
type StudyCommandItem = {
  id: string
  kind: StudyCommandKind
  title: string
  detail: string
  deckId: string
  mode: Mode
  slideIndex?: number
  quizIndex?: number
}

const totalQuizCount = getRichQuizCount(decks)
const STUDY_STATE_STORAGE_KEY = 'database-slidesets.study-state.v3'
const validPlaySpeeds: PlaySpeed[] = [6000, 9000, 12000]

const deckVisualLabels: Record<string, string[]> = {
  ddl: ['requirements', 'entities', 'tables', 'keys', 'actions'],
  dml: ['from', 'where', 'group', 'having', 'select', 'order'],
  'joins-subqueries': ['outer query', 'joined rows', 'set result', 'tie test'],
  'relational-algebra': ['selection', 'projection', 'join', 'set operators'],
  views: ['base tables', 'view definition', 'stable interface', 'application'],
  normalization: ['redundancy', 'dependencies', 'decomposition', 'lossless join'],
  'modules-triggers': ['procedure call', 'parameters', 'loop/action', 'trigger event'],
  'storage-indexes': ['disk blocks', 'buffer pool', 'index entries', 'B+ tree'],
  jdbc: ['java app', 'connector/j', 'ssh tunnel', 'mysql server'],
  'capstone-studio': ['domain model', 'query contract', 'transaction', 'index review', 'deployment'],
}

type SubtopicPageInfo = {
  focus: string
  page: number
}

type VisualFamily =
  | 'schema'
  | 'query'
  | 'set'
  | 'algebra'
  | 'view'
  | 'dependency'
  | 'routine'
  | 'storage'
  | 'network'
  | 'statistics'

type DeckVisualBlueprint = {
  family: VisualFamily
  artifact: string
  stages: string[]
  matrixRows: string[]
  matrixColumns: string[]
  metrics: string[]
  actions: string[]
}

const subtopicVisualModes = ['adaptive', 'map', 'trace', 'table', 'counterexample', 'matrix', 'simulator'] as const
type SubtopicVisualMode = (typeof subtopicVisualModes)[number]
const fallbackSubtopicModes = subtopicVisualModes.slice(0, 3) as SubtopicVisualMode[]

const visualModeLabels: Record<SubtopicVisualMode, string> = {
  adaptive: 'Adaptive lab',
  map: 'Concept map',
  trace: 'Trace',
  table: 'Table run',
  counterexample: 'Counterexample',
  matrix: 'Decision matrix',
  simulator: 'Simulator',
}

const familyModeLabels: Record<VisualFamily, Partial<Record<SubtopicVisualMode, string>>> = {
  schema: {
    adaptive: 'Constraint gate',
    map: 'Rule map',
    trace: 'Constraint trace',
    table: 'Row-state run',
    counterexample: 'Invalid row',
    matrix: 'Integrity matrix',
    simulator: 'Write simulator',
  },
  query: {
    adaptive: 'Clause pipeline',
    map: 'Clause map',
    trace: 'Logical trace',
    table: 'Result runner',
    counterexample: 'Alias trap',
    matrix: 'Clause matrix',
    simulator: 'Predicate lab',
  },
  set: {
    adaptive: 'Membership lab',
    map: 'Match map',
    trace: 'Probe trace',
    table: 'Pair table',
    counterexample: 'Edge pair',
    matrix: 'Join chooser',
    simulator: 'Tie simulator',
  },
  algebra: {
    adaptive: 'Operator tree',
    map: 'Operator map',
    trace: 'Rewrite trace',
    table: 'Relation result',
    counterexample: 'Schema trap',
    matrix: 'Operator matrix',
    simulator: 'Rewrite simulator',
  },
  view: {
    adaptive: 'View lens',
    map: 'Contract map',
    trace: 'Rewrite trace',
    table: 'Published rows',
    counterexample: 'Update trap',
    matrix: 'Contract matrix',
    simulator: 'Consumer simulator',
  },
  dependency: {
    adaptive: 'Closure machine',
    map: 'Dependency map',
    trace: 'Closure trace',
    table: 'Split result',
    counterexample: 'Anomaly trap',
    matrix: 'Anomaly matrix',
    simulator: 'Split simulator',
  },
  routine: {
    adaptive: 'ECA timeline',
    map: 'Boundary map',
    trace: 'Execution trace',
    table: 'Side-effect table',
    counterexample: 'Failure path',
    simulator: 'Side-effect lab',
    matrix: 'Boundary matrix',
  },
  storage: {
    adaptive: 'Access route',
    map: 'Access map',
    trace: 'Page trace',
    table: 'I/O result',
    counterexample: 'Cost trap',
    simulator: 'Page simulator',
    matrix: 'Cost matrix',
  },
  network: {
    adaptive: 'Runtime route',
    map: 'Layer map',
    trace: 'Resource trace',
    table: 'Session table',
    counterexample: 'Leak case',
    simulator: 'Round-trip lab',
    matrix: 'Leak matrix',
  },
  statistics: {
    adaptive: 'Grain lab',
    map: 'Grain map',
    trace: 'Aggregate trace',
    table: 'Aggregate run',
    counterexample: 'Fanout trap',
    matrix: 'Measure matrix',
    simulator: 'Fanout simulator',
  },
}

function visualModeLabelFor(mode: SubtopicVisualMode, family: VisualFamily) {
  return familyModeLabels[family][mode] ?? visualModeLabels[mode]
}

const deckInteractiveBlueprints: Record<string, DeckVisualBlueprint> = {
  ddl: {
    family: 'schema',
    artifact: 'schema contract',
    stages: ['Requirement', 'row grain', 'key or domain rule', 'illegal state test', 'DDL clause'],
    matrixRows: ['PK', 'FK', 'UNIQUE', 'CHECK'],
    matrixColumns: ['reject row', 'allow null', 'cascade effect', 'preserve history'],
    metrics: ['illegal rows blocked', 'future rows survived', 'workflow rules deferred'],
    actions: ['insert child', 'delete parent', 'rename key', 'audit null'],
  },
  dml: {
    family: 'query',
    artifact: 'logical query result',
    stages: ['FROM source rows', 'WHERE row filter', 'GROUP BY grain', 'HAVING group filter', 'SELECT projection', 'ORDER BY display'],
    matrixRows: ['row filter', 'group filter', 'derived measure', 'formatted label'],
    matrixColumns: ['before grouping', 'after grouping', 'display only', 'sort only'],
    metrics: ['rows remaining', 'groups formed', 'expressions exposed'],
    actions: ['move predicate', 'widen group', 'pre-aggregate', 'test null'],
  },
  'joins-subqueries': {
    family: 'set',
    artifact: 'combined relation',
    stages: ['outer row', 'join predicate', 'inner probe', 'set comparison', 'tie preservation'],
    matrixRows: ['inner join', 'semi join', 'anti join', 'scalar subquery'],
    matrixColumns: ['duplicates matter', 'null-sensitive', 'correlated', 'tie-safe'],
    metrics: ['fanout risk', 'missing matches', 'tie rows preserved'],
    actions: ['probe inner', 'anti-match', 'compare all', 'keep ties'],
  },
  'relational-algebra': {
    family: 'algebra',
    artifact: 'operator expression',
    stages: ['base relation', 'selection', 'projection', 'rename', 'join or set operation', 'result schema'],
    matrixRows: ['selection', 'projection', 'rename', 'difference'],
    matrixColumns: ['changes rows', 'changes columns', 'requires compatibility', 'enables self-reference'],
    metrics: ['operator depth', 'schema width', 'rewrite choices'],
    actions: ['push selection', 'rename copy', 'project late', 'check compatibility'],
  },
  views: {
    family: 'view',
    artifact: 'stable interface',
    stages: ['base tables', 'view definition', 'security boundary', 'derived output', 'application query'],
    matrixRows: ['simple view', 'joined view', 'aggregated view', 'security view'],
    matrixColumns: ['updatable', 'derived', 'filtered', 'privilege-safe'],
    metrics: ['columns exposed', 'base rows hidden', 'rewrite dependency'],
    actions: ['hide column', 'derive measure', 'change base table', 'test update'],
  },
  normalization: {
    family: 'dependency',
    artifact: 'dependency-preserving design',
    stages: ['attributes', 'functional dependency', 'candidate key', 'anomaly test', 'decomposition', 'lossless join'],
    matrixRows: ['partial dependency', 'transitive dependency', 'BCNF violation', 'multivalued fact'],
    matrixColumns: ['update anomaly', 'insert anomaly', 'delete anomaly', 'lossless repair'],
    metrics: ['redundant cells', 'determinants', 'relations after split'],
    actions: ['mark determinant', 'find closure', 'split table', 'join back'],
  },
  'modules-triggers': {
    family: 'routine',
    artifact: 'procedural rule boundary',
    stages: ['call or event', 'parameters', 'local variables', 'SQL action', 'side effect', 'error handling'],
    matrixRows: ['procedure', 'function', 'trigger', 'application transaction'],
    matrixColumns: ['explicit call', 'returns value', 'event-driven', 'cross-row rule'],
    metrics: ['side effects', 'rows touched', 'rule locality'],
    actions: ['call routine', 'fire trigger', 'raise signal', 'rollback path'],
  },
  'storage-indexes': {
    family: 'storage',
    artifact: 'physical access path',
    stages: ['disk page', 'buffer frame', 'index entry', 'tree traversal', 'record fetch', 'eviction'],
    matrixRows: ['heap scan', 'dense index', 'sparse index', 'B+ tree'],
    matrixColumns: ['random I/O', 'range-friendly', 'update cost', 'cache benefit'],
    metrics: ['page reads', 'tree height', 'buffer hits'],
    actions: ['pin page', 'split leaf', 'scan range', 'evict dirty'],
  },
  jdbc: {
    family: 'network',
    artifact: 'client-server execution path',
    stages: ['Java code', 'DriverManager', 'Connection', 'PreparedStatement', 'ResultSet', 'close resources'],
    matrixRows: ['connection', 'statement', 'result set', 'tunnel'],
    matrixColumns: ['owns resource', 'can leak', 'parameterized', 'network-sensitive'],
    metrics: ['open resources', 'round trips', 'injection risk'],
    actions: ['open connection', 'bind parameter', 'execute query', 'close scope'],
  },
  'capstone-studio': {
    family: 'schema',
    artifact: 'capstone system contract',
    stages: ['requirement', 'schema invariant', 'query contract', 'transaction boundary', 'index path', 'deployment check'],
    matrixRows: ['constraint', 'view', 'procedure', 'index'],
    matrixColumns: ['enforces state', 'exposes result', 'changes rows', 'improves access'],
    metrics: ['invariants covered', 'interfaces named', 'failure layers tested'],
    actions: ['reject invalid checkout', 'publish active view', 'commit return workflow', 'trace JDBC failure'],
  },
}

const focusNodeLibrary: Record<string, string[]> = {
  'Entity integrity': ['row identity', 'candidate key', 'surrogate key', 'alternate UNIQUE', 'future duplicate'],
  'Referential integrity': ['parent key', 'child value', 'mandatory link', 'optional NULL', 'orphan row'],
  'Referential actions': ['owned child', 'optional association', 'audit history', 'cascade', 'restrict'],
  'Domain constraints': ['data type', 'stable vocabulary', 'default', 'NULL meaning', 'workflow rule'],
  'Logical processing order': ['FROM rows', 'WHERE filter', 'GROUP grain', 'HAVING predicate', 'SELECT alias'],
  'Result grain': ['target row', 'join fanout', 'detail source', 'pre-aggregation', 'final group'],
  'Expressions and aliases': ['stored value', 'derived measure', 'formatted label', 'alias meaning', 'late rounding'],
  'Null logic': ['true', 'false', 'unknown', 'IS NULL', 'NOT EXISTS'],
  'Join reasoning': ['left relation', 'right relation', 'predicate', 'fanout', 'matched tuple'],
  'Subquery shape': ['outer query', 'inner query', 'correlation', 'scalar value', 'set result'],
  'Anti-join and difference': ['candidate row', 'missing match', 'NOT EXISTS', 'NULL trap', 'difference result'],
  'Tie-aware extrema': ['measure', 'maximum set', 'ALL comparison', 'ties', 'leader rows'],
  'Operator shape': ['operand schema', 'operator', 'result schema', 'tuple flow', 'equivalent SQL'],
  'Rename and self-joins': ['first copy', 'second copy', 'alias', 'self-predicate', 'paired result'],
  'Set compatibility': ['same arity', 'compatible domains', 'union', 'difference', 'intersection'],
  'Algebraic rewrites': ['selection pushdown', 'projection trimming', 'join ordering', 'cost', 'same result'],
  'View contracts': ['base table', 'view definition', 'interface column', 'dependency', 'consumer query'],
  'Security and exposure': ['private column', 'filtered row', 'least privilege', 'view grant', 'safe output'],
  'Derived tables': ['inner result', 'alias', 'temporary grain', 'outer query', 'materialized thought'],
  Updatability: ['key preservation', 'single base table', 'derived column', 'ambiguous update', 'rejected write'],
  'Functional dependencies': ['determinant', 'dependent', 'closure', 'superkey', 'violation row'],
  'Candidate keys': ['attribute set', 'closure', 'minimality', 'alternate key', 'primary choice'],
  'Anomalies and normal forms': ['redundancy', 'update anomaly', 'insert anomaly', 'delete anomaly', 'normal form'],
  Decomposition: ['original relation', 'projection split', 'common key', 'lossless join', 'dependency check'],
  'Procedure boundaries': ['caller', 'routine body', 'transaction', 'result', 'side effect'],
  'Parameters and variables': ['IN parameter', 'OUT parameter', 'local variable', 'assignment', 'scope'],
  'Triggers and ECA logic': ['event', 'condition', 'action', 'old row', 'new row'],
  'Rule placement': ['constraint', 'view', 'trigger', 'procedure', 'application'],
  'Physical I/O': ['disk block', 'page read', 'buffer frame', 'record slot', 'write back'],
  'Buffer management': ['pin count', 'dirty bit', 'replacement', 'hit', 'eviction'],
  'Index density': ['search key', 'dense entry', 'sparse entry', 'data page', 'lookup cost'],
  'B+ tree behavior': ['root', 'internal node', 'leaf page', 'range scan', 'split'],
  'JDBC layers': ['Java app', 'driver', 'connection URL', 'DBMS session', 'result cursor'],
  'Connections and resources': ['open connection', 'statement', 'result set', 'try-with-resources', 'leak'],
  'Prepared statements': ['SQL template', 'placeholder', 'bound value', 'plan reuse', 'injection block'],
  'Tunneling and deployment': ['local port', 'SSH tunnel', 'remote host', 'MySQL port', 'firewall path'],
  'End-to-end domain modeling': ['durable entity', 'event row', 'audit row', 'legal state', 'invariant'],
  'Service query contracts': ['result grain', 'caller', 'join risk', 'view boundary', 'stable output'],
  'Transactional audit workflow': ['precondition', 'writes', 'postcondition', 'rollback', 'evidence'],
  'Operational readiness review': ['workload', 'index path', 'prepared value', 'resource lifetime', 'failure layer'],
}

type ExperimentNodeKind = 'input' | 'relation' | 'operator' | 'result' | 'risk'

type ExperimentNode = {
  label: string
  detail: string
  kind: ExperimentNodeKind
  stage: number
}

type ExperimentRow = {
  label: string
  values: string[]
  stage: number
  verdict: string
}

type ExperimentMetric = {
  label: string
  value: string
  stage: number
}

type ExperimentSpec = {
  title: string
  objective: string
  tableLabel: string
  pathLabel: string
  datasetColumns: string[]
  nodes: ExperimentNode[]
  rows: ExperimentRow[]
  metrics: ExperimentMetric[]
  stepCaptions: string[]
}

type VisualAtlasKind =
  | 'schema'
  | 'pipeline'
  | 'sets'
  | 'algebra'
  | 'view'
  | 'dependency'
  | 'routine'
  | 'index'
  | 'network'

type VisualAtlasCard = {
  title: string
  caption: string
  kind: VisualAtlasKind
  labels: string[]
  checkpoints: string[]
}

const experimentSpecs: Record<string, ExperimentSpec> = {
  ddl: {
    title: 'Constraint laboratory: can the row enter the database?',
    objective: 'Press each stage to watch a requirement become a table, a key, a referential action, and a rejected invalid row.',
    tableLabel: 'candidate row test',
    pathLabel: 'schema contract path',
    datasetColumns: ['fact', 'key or value', 'status'],
    nodes: [
      { label: 'Requirement', detail: 'A movie owns numbered physical copies.', kind: 'input', stage: 0 },
      { label: 'Parent key', detail: 'Movie.movie_id exists before copies can refer to it.', kind: 'relation', stage: 1 },
      { label: 'Composite child key', detail: 'movie_id plus copy_num identifies one copy.', kind: 'operator', stage: 1 },
      { label: 'Referential action', detail: 'Delete and update rules decide child survival.', kind: 'operator', stage: 2 },
      { label: 'Rejected row', detail: 'A copy for a missing movie cannot be stored.', kind: 'risk', stage: 3 },
    ],
    rows: [
      { label: 'Parent', values: ['Movie', 'movie_id = 4', 'stored first'], stage: 0, verdict: 'valid parent' },
      { label: 'Child', values: ['MovieCopy', '(4, 001)', 'references parent'], stage: 1, verdict: 'accepted' },
      { label: 'Action', values: ['FavoritePizza', 'patron_id = 8', 'set null allowed'], stage: 2, verdict: 'optional link' },
      { label: 'Bad child', values: ['MovieCopy', '(999, 001)', 'movie 999 missing'], stage: 3, verdict: 'blocked by FK' },
    ],
    metrics: [
      { label: 'identity columns', value: '2', stage: 1 },
      { label: 'invalid rows stored', value: '0', stage: 3 },
      { label: 'rule owner', value: 'DBMS', stage: 0 },
    ],
    stepCaptions: [
      'Start with the business sentence, not SQL syntax. The sentence tells which facts must be stable.',
      'Identity is the first executable decision: without a key, references and updates have no target.',
      'Referential actions encode meaning. Cascade, set null, and restrict are different stories.',
      'The final proof is a row that should fail. Good DDL makes the failure happen before application code runs.',
    ],
  },
  dml: {
    title: 'Logical query pipeline: what row grain survives?',
    objective: 'Move through the SQL clauses in logical order and watch individual rental rows collapse into order-level facts.',
    tableLabel: 'intermediate tuples',
    pathLabel: 'query execution logic',
    datasetColumns: ['tuple', 'visible columns', 'grain'],
    nodes: [
      { label: 'FROM source rows', detail: 'RentalOrder and RentalItem create the candidate row space.', kind: 'input', stage: 0 },
      { label: 'WHERE predicate', detail: 'Join and filter predicates remove rows before grouping.', kind: 'operator', stage: 1 },
      { label: 'GROUP BY grain', detail: 'Rows become one answer per rental_id.', kind: 'operator', stage: 2 },
      { label: 'SELECT aliases', detail: 'Aggregate expressions name the answer columns.', kind: 'result', stage: 3 },
      { label: 'ORDER BY display', detail: 'Sorting changes presentation, not row membership.', kind: 'operator', stage: 3 },
    ],
    rows: [
      { label: 'raw item', values: ['rental_id 17', 'movie_id 4', 'one rented movie'], stage: 0, verdict: 'candidate' },
      { label: 'filtered item', values: ['rental_id 17', 'rate 1.50', 'joined row'], stage: 1, verdict: 'kept' },
      { label: 'group', values: ['rental_id 17', 'COUNT = 3', 'one order'], stage: 2, verdict: 'collapsed' },
      { label: 'answer', values: ['rental_id 17', 'daily_cost = 4.50', 'report row'], stage: 3, verdict: 'returned' },
    ],
    metrics: [
      { label: 'raw rows', value: 'many', stage: 0 },
      { label: 'answer grain', value: 'order', stage: 2 },
      { label: 'aggregate columns', value: '3', stage: 3 },
    ],
    stepCaptions: [
      'Name the raw table that owns the facts before writing SELECT.',
      'WHERE decides which raw facts are allowed into the computation.',
      'GROUP BY changes the unit of meaning from item rows to order rows.',
      'Aliases and ordering should happen after the logical relation is already shaped.',
    ],
  },
  'joins-subqueries': {
    title: 'Join versus subquery experiment: rows, sets, and ties',
    objective: 'Use the active stage to decide whether the prompt needs attached columns, a membership test, or a tie-preserving comparison.',
    tableLabel: 'comparison tuples',
    pathLabel: 'nested query decision path',
    datasetColumns: ['question shape', 'SQL form', 'tie behavior'],
    nodes: [
      { label: 'Outer movie rows', detail: 'The outer query owns the answer rows.', kind: 'input', stage: 0 },
      { label: 'Join rental facts', detail: 'A join attaches movie-level rental rows.', kind: 'relation', stage: 1 },
      { label: 'Inner aggregate set', detail: 'The subquery produces peer rental counts.', kind: 'operator', stage: 2 },
      { label: 'ALL comparison', detail: 'Every outer count is compared to every peer count.', kind: 'operator', stage: 3 },
      { label: 'Tied leaders', detail: 'All movies sharing the maximum count survive.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Outer row', values: ['Movie A', 'answer candidate', 'movie grain'], stage: 0, verdict: 'candidate' },
      { label: 'Joined row', values: ['Movie A + RentalItem', 'matching movie_id', 'rental fact attached'], stage: 1, verdict: 'matched' },
      { label: 'Null trap', values: ['NOT IN set', 'contains null', 'unknown'], stage: 2, verdict: 'danger' },
      { label: 'Tied leaders', values: ['Movie A and Movie B', 'count = 9', 'both maxima'], stage: 3, verdict: 'returned' },
    ],
    metrics: [
      { label: 'outer grain', value: 'movie', stage: 0 },
      { label: 'inner shape', value: 'set', stage: 2 },
      { label: 'leaders returned', value: 'all ties', stage: 3 },
    ],
    stepCaptions: [
      'First classify whether the final answer is a row-extension problem or a set-membership problem.',
      'A join predicate explains which facts describe the same object.',
      'A subquery must return the right shape: one value, many values, or grouped peer values.',
      'Tie-aware extrema should compare against every peer aggregate rather than using one arbitrary row.',
    ],
  },
  'relational-algebra': {
    title: 'Relational algebra workbench: shape before syntax',
    objective: 'Watch the expression reduce rows, combine relations, and project only the requested attributes before SQL translation.',
    tableLabel: 'algebra relation state',
    pathLabel: 'operator composition',
    datasetColumns: ['relation', 'attributes present', 'operator effect'],
    nodes: [
      { label: 'Base relation', detail: 'Start from Product, PC, Laptop, or Printer.', kind: 'input', stage: 0 },
      { label: 'Selection', detail: 'sigma keeps rows that satisfy a predicate.', kind: 'operator', stage: 1 },
      { label: 'Join or set operator', detail: 'Composition connects compatible intermediate relations.', kind: 'operator', stage: 2 },
      { label: 'Projection', detail: 'pi keeps only requested attributes.', kind: 'result', stage: 3 },
      { label: 'SQL rendering', detail: 'SELECT and WHERE encode the same relation shape.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'PC', values: ['model, speed, hd', '3 rows', 'raw relation'], stage: 0, verdict: 'available' },
      { label: 'sigma speed >= 3', values: ['model, speed, hd', '1 row', 'rows reduced'], stage: 1, verdict: 'filtered' },
      { label: 'Product join PC', values: ['maker, model, speed', 'matched models', 'context added'], stage: 2, verdict: 'joined' },
      { label: 'pi maker', values: ['maker', 'duplicates removed', 'answer schema'], stage: 3, verdict: 'projected' },
    ],
    metrics: [
      { label: 'row-changing ops', value: 'selection', stage: 1 },
      { label: 'schema-changing ops', value: 'projection', stage: 3 },
      { label: 'join keys needed', value: 'model', stage: 2 },
    ],
    stepCaptions: [
      'Mark every base relation named by the prompt before choosing operators.',
      'Selection is the cleanest way to make predicates visible.',
      'Join and set operations belong after each branch has the right compatible shape.',
      'Projection at the end protects join attributes from disappearing too early.',
    ],
  },
  views: {
    title: 'View interface experiment: saved query or unnecessary wrapper?',
    objective: 'Click stages to test when a view creates a useful relation boundary and when it only hides a simple join.',
    tableLabel: 'view row mapping',
    pathLabel: 'query layer decision',
    datasetColumns: ['layer', 'consumer sees', 'update path'],
    nodes: [
      { label: 'Base tables', detail: 'Movie, Inventory, RentalItem remain the real storage.', kind: 'input', stage: 0 },
      { label: 'Repeated logic', detail: 'ActiveMovie names a recurring filtered relation.', kind: 'operator', stage: 1 },
      { label: 'Stable interface', detail: 'Applications query the named relation.', kind: 'relation', stage: 2 },
      { label: 'Update gate', detail: 'Aggregates and unions can make writes ambiguous.', kind: 'risk', stage: 3 },
      { label: 'Simple join check', detail: 'If no boundary is gained, a direct join is clearer.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Base movie', values: ['Movie', 'title, year', 'one base row'], stage: 0, verdict: 'stored' },
      { label: 'ActiveMovie', values: ['movie_id, title', 'inventory or open rental', 'named query'], stage: 1, verdict: 'readable' },
      { label: 'App query', values: ['SELECT title', 'FROM ActiveMovie', 'stable contract'], stage: 2, verdict: 'simplified' },
      { label: 'Aggregate view', values: ['COUNT rentals', 'many rows per result', 'ambiguous write'], stage: 3, verdict: 'read only' },
    ],
    metrics: [
      { label: 'storage copied', value: 'no', stage: 1 },
      { label: 'consumer columns', value: 'curated', stage: 2 },
      { label: 'updatable', value: 'depends', stage: 3 },
    ],
    stepCaptions: [
      'Begin with the base relations so the view does not feel magical.',
      'A view earns its name when the intermediate relation has a reusable grain.',
      'The interface hides internal joins and filters from consumers.',
      'Before allowing writes, ask which exact base row the view row would modify.',
    ],
  },
  normalization: {
    title: 'Dependency experiment: where should each fact live?',
    objective: 'Trace a dependency from determinant to dependent fact, expose the anomaly, then split the relation without losing information.',
    tableLabel: 'legal tuple test',
    pathLabel: 'normalization proof path',
    datasetColumns: ['tuple or rule', 'dependency', 'effect'],
    nodes: [
      { label: 'Universal row', detail: 'One wide row stores multiple facts at mixed grains.', kind: 'input', stage: 0 },
      { label: 'FD graph', detail: 'A determinant controls a dependent attribute.', kind: 'operator', stage: 0 },
      { label: 'Key closure', detail: 'Closure checks whether attributes determine the whole relation.', kind: 'operator', stage: 1 },
      { label: 'Anomaly', detail: 'A repeated fact can be updated inconsistently.', kind: 'risk', stage: 2 },
      { label: 'Lossless split', detail: 'Shared determinant lets the split join back correctly.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Existing', values: ['A = 0, B = 0, C = 0', 'B -> C', 'legal'], stage: 0, verdict: 'stored' },
      { label: 'Candidate', values: ['A = 0, B = 0, C = 2', 'B -> C', 'conflict'], stage: 2, verdict: 'reject' },
      { label: 'R1', values: ['A, B', 'A -> B', 'determinant home'], stage: 3, verdict: 'split' },
      { label: 'R2', values: ['B, C', 'B -> C', 'dependent home'], stage: 3, verdict: 'recoverable' },
    ],
    metrics: [
      { label: 'candidate key test', value: 'closure', stage: 1 },
      { label: 'anomaly risk', value: 'high', stage: 2 },
      { label: 'lossless join', value: 'required', stage: 3 },
    ],
    stepCaptions: [
      'Functional dependencies are semantic rules over every legal database state.',
      'Closure tells whether a determinant is powerful enough to identify the whole row.',
      'Anomalies appear when a fact is repeated under the wrong key.',
      'Decomposition works only when joining the pieces cannot invent extra tuples.',
    ],
  },
  'modules-triggers': {
    title: 'Stored module experiment: explicit call versus automatic reaction',
    objective: 'Run the create_copies workflow and compare procedure boundaries with trigger-style side effects.',
    tableLabel: 'procedure state',
    pathLabel: 'database-side workflow',
    datasetColumns: ['state', 'value', 'responsibility'],
    nodes: [
      { label: 'CALL boundary', detail: 'The caller supplies movie_id and copy count.', kind: 'input', stage: 0 },
      { label: 'Read current max', detail: 'The procedure queries existing copy numbers.', kind: 'operator', stage: 1 },
      { label: 'Loop insert', detail: 'Each iteration inserts one new copy row.', kind: 'operator', stage: 2 },
      { label: 'OUT parameter', detail: 'The caller receives the final copy number.', kind: 'result', stage: 3 },
      { label: 'Trigger warning', detail: 'Automatic reactions should be visible in documentation and tests.', kind: 'risk', stage: 3 },
    ],
    rows: [
      { label: 'Input', values: ['movie_id = 4', 'num_copies = 3', 'caller decides'], stage: 0, verdict: 'passed in' },
      { label: 'State read', values: ['MAX(copy_num)', '12', 'procedure computes'], stage: 1, verdict: 'known' },
      { label: 'Loop', values: ['13, 14, 15', 'three INSERTs', 'database performs'], stage: 2, verdict: 'inserted' },
      { label: 'Return', values: ['@last', '15', 'caller observes'], stage: 3, verdict: 'reported' },
    ],
    metrics: [
      { label: 'round trips avoided', value: 'many', stage: 2 },
      { label: 'explicit call', value: 'yes', stage: 0 },
      { label: 'hidden side effects', value: 'test', stage: 3 },
    ],
    stepCaptions: [
      'A procedure boundary should make caller inputs and database-owned computation explicit.',
      'Reading state first prevents numbering collisions.',
      'A loop is justified when the operation repeats a database-side write with controlled state.',
      'OUT parameters and trigger side effects must be tested because callers depend on them.',
    ],
  },
  'storage-indexes': {
    title: 'Access path experiment: block scan versus dense index versus B+ tree',
    objective: 'Step through data order, index density, block counting, and final lookup behavior with the active path highlighted.',
    tableLabel: 'block and index state',
    pathLabel: 'storage access path',
    datasetColumns: ['structure', 'entries', 'cost meaning'],
    nodes: [
      { label: 'Data file order', detail: 'A sparse index needs data ordered by the search key.', kind: 'input', stage: 0 },
      { label: 'Dense index', detail: 'One index entry points at every record.', kind: 'relation', stage: 1 },
      { label: 'Block capacity', detail: 'Entries per block determine index size.', kind: 'operator', stage: 2 },
      { label: 'B+ tree root', detail: 'Internal nodes guide search to the correct leaf.', kind: 'operator', stage: 3 },
      { label: 'Leaf range scan', detail: 'Leaves preserve sorted order for range queries.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Data blocks', values: ['12 records', '3 per block', '4 blocks'], stage: 0, verdict: 'stored' },
      { label: 'Dense index', values: ['12 entries', '6 per block', '2 index blocks'], stage: 1, verdict: 'built' },
      { label: 'Sparse index', values: ['4 anchors', 'ordered file only', 'unsafe if unordered'], stage: 2, verdict: 'conditional' },
      { label: 'B+ tree', values: ['root -> leaf', 'balanced path', 'range capable'], stage: 3, verdict: 'efficient' },
    ],
    metrics: [
      { label: 'unit of cost', value: 'block', stage: 0 },
      { label: 'dense entries', value: 'records', stage: 1 },
      { label: 'leaf order', value: 'sorted', stage: 3 },
    ],
    stepCaptions: [
      'File order determines which index structures are legal, not just convenient.',
      'Dense indexes are straightforward because every record has an entry.',
      'Block math uses ceiling division because a partially filled block still exists.',
      'A B+ tree keeps search depth stable while leaves support sequential range movement.',
    ],
  },
  jdbc: {
    title: 'JDBC connection experiment: which layer failed?',
    objective: 'Click through the runtime path from Java source to driver jar, tunnel endpoint, server session, and returned rows.',
    tableLabel: 'runtime checkpoint',
    pathLabel: 'client-server connection path',
    datasetColumns: ['layer', 'evidence', 'failure signal'],
    nodes: [
      { label: 'Java app', detail: 'Application code calls JDBC interfaces.', kind: 'input', stage: 0 },
      { label: 'Connector/J jar', detail: 'The MySQL driver implements those interfaces.', kind: 'relation', stage: 0 },
      { label: 'SSH tunnel', detail: 'localhost can forward to a remote DBMS host.', kind: 'operator', stage: 1 },
      { label: 'MySQL session', detail: 'Credentials and database permissions are checked here.', kind: 'operator', stage: 2 },
      { label: 'ResultSet cursor', detail: 'Rows are read only after executeQuery succeeds.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Classpath', values: ['mysql-connector-j', 'jar visible', 'Class not found if missing'], stage: 0, verdict: 'loaded' },
      { label: 'Tunnel', values: ['localhost:3306', 'forwarded', 'connection refused if closed'], stage: 1, verdict: 'open' },
      { label: 'Login', values: ['user + password', 'schema selected', 'access denied if wrong'], stage: 2, verdict: 'authenticated' },
      { label: 'Query', values: ['PreparedStatement', 'ResultSet', 'SQL error if invalid'], stage: 3, verdict: 'rows read' },
    ],
    metrics: [
      { label: 'driver layer', value: 'classpath', stage: 0 },
      { label: 'network layer', value: 'tunnel', stage: 1 },
      { label: 'SQL layer', value: 'prepared', stage: 3 },
    ],
    stepCaptions: [
      'Debug connection failures from the outer runtime inward instead of blaming SQL immediately.',
      'The tunnel changes what localhost means for the Java process.',
      'A successful socket still needs valid credentials and database privileges.',
      'Prepared statements bind values safely before reading the ResultSet cursor.',
    ],
  },
  'capstone-studio': {
    title: 'Capstone workflow experiment: can the system stay legal?',
    objective: 'Trace a full checkout workflow from requirement to schema invariant, query contract, transaction boundary, and operational review.',
    tableLabel: 'capstone state checkpoint',
    pathLabel: 'end-to-end system design path',
    datasetColumns: ['layer', 'evidence', 'risk controlled'],
    nodes: [
      { label: 'Requirement', detail: 'An item can be checked out only when it is available.', kind: 'input', stage: 0 },
      { label: 'Schema invariant', detail: 'Keys and foreign keys make item, borrower, and checkout identity enforceable.', kind: 'relation', stage: 0 },
      { label: 'Query contract', detail: 'ActiveCheckout exposes one row per open checkout for screens and reports.', kind: 'operator', stage: 1 },
      { label: 'Transaction boundary', detail: 'Checkout insert and item-state update must commit or roll back together.', kind: 'operator', stage: 2 },
      { label: 'Operational review', detail: 'Indexes, prepared statements, and resource cleanup make the workflow deployable.', kind: 'result', stage: 3 },
    ],
    rows: [
      { label: 'Item', values: ['item_id=42', 'status=AVAILABLE', 'durable identity'], stage: 0, verdict: 'eligible' },
      { label: 'Checkout', values: ['borrower=17', 'due_at set', 'event row'], stage: 1, verdict: 'contracted' },
      { label: 'Transaction', values: ['insert + update', 'same unit', 'rollback if guard fails'], stage: 2, verdict: 'atomic' },
      { label: 'Endpoint', values: ['PreparedStatement', 'idx status_due', 'resources closed'], stage: 3, verdict: 'deployable' },
    ],
    metrics: [
      { label: 'invariant', value: 'item legal', stage: 0 },
      { label: 'contract', value: 'one open row', stage: 1 },
      { label: 'operation', value: 'atomic', stage: 2 },
      { label: 'runtime', value: 'safe', stage: 3 },
    ],
    stepCaptions: [
      'Start with a requirement that can be tested against legal and illegal states.',
      'Expose repeated read logic as a contract only after the row grain is clear.',
      'Treat multi-row changes as one operation with visible rollback behavior.',
      'Finish by checking access path, prepared-statement boundary, resources, and failure layer.',
    ],
  },
}

const visualAtlasSpecs: Record<string, VisualAtlasCard[]> = {
  ddl: [
    {
      title: 'Entity integrity map',
      caption: 'Identity starts with a stable key before any relationship can be enforced.',
      kind: 'schema',
      labels: ['Requirement', 'Entity', 'Primary key', 'Legal tuple'],
      checkpoints: ['Name one fact per row.', 'Choose a minimal identifier.', 'Reject duplicate identity.'],
    },
    {
      title: 'Reference contract',
      caption: 'A foreign key is a value-level rule, not just a line between boxes.',
      kind: 'schema',
      labels: ['Parent key', 'Child value', 'FK check', 'Allowed row'],
      checkpoints: ['Find the parent candidate key.', 'Allow null only when optional.', 'Choose delete/update behavior.'],
    },
    {
      title: 'Action semantics switchboard',
      caption: 'Cascade, set null, and restrict encode three different business meanings.',
      kind: 'pipeline',
      labels: ['Parent changes', 'Cascade', 'Set null', 'Restrict'],
      checkpoints: ['Delete child only when it loses meaning.', 'Set null for optional references.', 'Restrict when history must survive.'],
    },
    {
      title: 'Subtype identity picture',
      caption: 'Product owns shared identity while PC, Laptop, and Printer hold specialized facts.',
      kind: 'sets',
      labels: ['Product', 'PC', 'Laptop', 'Printer'],
      checkpoints: ['Reuse the same key.', 'Check type consistency.', 'Use UNION across subtypes.'],
    },
  ],
  dml: [
    {
      title: 'Logical SELECT pipeline',
      caption: 'SQL text is written one way, but the answer is reasoned through a row-shaping pipeline.',
      kind: 'pipeline',
      labels: ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY'],
      checkpoints: ['Rows first.', 'Groups second.', 'Display last.'],
    },
    {
      title: 'Expression workbench',
      caption: 'Computed columns are presentation decisions derived from stored values.',
      kind: 'pipeline',
      labels: ['Raw value', 'Arithmetic', 'String format', 'Alias'],
      checkpoints: ['Do not store derivable facts.', 'Name output columns.', 'Check formatting after logic.'],
    },
    {
      title: 'Group grain board',
      caption: 'Aggregation is correct only when one output row represents the intended unit.',
      kind: 'sets',
      labels: ['Raw rows', 'Groups', 'Aggregate', 'One row per group'],
      checkpoints: ['Say one row per what.', 'Group non-aggregate output facts.', 'Use HAVING for group filters.'],
    },
    {
      title: 'Verification lens',
      caption: 'A running query can still answer the wrong story if grain, nulls, or duplicates are wrong.',
      kind: 'schema',
      labels: ['Expected story', 'SQL result', 'Null test', 'Duplicate check'],
      checkpoints: ['Predict shape first.', 'Test null behavior.', 'Inspect duplicates intentionally.'],
    },
  ],
  'joins-subqueries': [
    {
      title: 'Join context builder',
      caption: 'A join expands each row with related evidence when the final answer needs columns from both sides.',
      kind: 'schema',
      labels: ['Left row', 'Join key', 'Right row', 'Combined row'],
      checkpoints: ['State the equality.', 'Avoid cartesian products.', 'Check row multiplication.'],
    },
    {
      title: 'Nested question type match',
      caption: 'The inner query must return the shape the outer comparison expects.',
      kind: 'pipeline',
      labels: ['Outer value', 'Scalar', 'Set', 'Peer groups'],
      checkpoints: ['Use scalar for one value.', 'Use IN for a set.', 'Use ALL for tie-aware extrema.'],
    },
    {
      title: 'Anti-join null trap',
      caption: 'NOT EXISTS asks absence per row and avoids global null poisoning from NOT IN.',
      kind: 'sets',
      labels: ['Candidates', 'Matches', 'Null row', 'Survivors'],
      checkpoints: ['Check nullable subquery values.', 'Prefer correlated absence tests.', 'Explain what no match means.'],
    },
    {
      title: 'Tie preservation frame',
      caption: 'Leader questions often return a set, not one arbitrary row.',
      kind: 'sets',
      labels: ['Group A', 'Group B', 'Max value', 'Both leaders'],
      checkpoints: ['Aggregate first.', 'Compare to all peers.', 'Do not use LIMIT 1 for ties.'],
    },
  ],
  'relational-algebra': [
    {
      title: 'Operator shape map',
      caption: 'Selection changes rows, projection changes columns, and join changes context.',
      kind: 'algebra',
      labels: ['Relation R', 'Select rows', 'Project columns', 'Join S'],
      checkpoints: ['Track row changes.', 'Track attribute survival.', 'Delay projection until join keys survive.'],
    },
    {
      title: 'Result schema tracker',
      caption: 'Every algebra expression still produces a relation with a specific schema.',
      kind: 'schema',
      labels: ['Input schema', 'Operator', 'Output schema', 'Answer relation'],
      checkpoints: ['Annotate columns after each step.', 'Keep required attributes.', 'Project only at the end.'],
    },
    {
      title: 'Set compatibility gate',
      caption: 'Union, intersection, and difference need operands with compatible shapes.',
      kind: 'sets',
      labels: ['Branch A', 'Branch B', 'Aligned schema', 'Set result'],
      checkpoints: ['Same number of columns.', 'Compatible domains.', 'Rename or project before combining.'],
    },
    {
      title: 'Rewrite intuition',
      caption: 'Equivalent algebra explains why SQL optimizers can transform query plans.',
      kind: 'algebra',
      labels: ['SQL form 1', 'Algebra meaning', 'SQL form 2', 'Same answer'],
      checkpoints: ['Preserve semantics.', 'Notice bag/set differences.', 'Reason before optimizing.'],
    },
  ],
  views: [
    {
      title: 'View as relational lens',
      caption: 'A view names a useful query result so later users can start from a cleaner interface.',
      kind: 'view',
      labels: ['Base tables', 'SELECT logic', 'View name', 'Consumer query'],
      checkpoints: ['Name the result grain.', 'Expose useful columns.', 'Hide repeated joins.'],
    },
    {
      title: 'Derived table test',
      caption: 'A FROM subquery is useful when it creates a meaningful intermediate relation.',
      kind: 'pipeline',
      labels: ['Raw rows', 'Inner grain', 'Outer join', 'Final answer'],
      checkpoints: ['Keep it if grain changes.', 'Remove decorative nesting.', 'Name aliases clearly.'],
    },
    {
      title: 'Exposure boundary',
      caption: 'Views can publish a controlled shape while base tables remain more detailed.',
      kind: 'view',
      labels: ['Private columns', 'Filtered rows', 'Public view', 'App screen'],
      checkpoints: ['Protect sensitive fields.', 'Stabilize app contracts.', 'Keep source meaning traceable.'],
    },
    {
      title: 'Updatability mirror',
      caption: 'A view is writable only when one output row maps back to base rows unambiguously.',
      kind: 'dependency',
      labels: ['View row', 'Base row?', 'Aggregate?', 'Update decision'],
      checkpoints: ['Avoid updating grouped views.', 'Check one-to-one mapping.', 'Use procedures for complex writes.'],
    },
  ],
  normalization: [
    {
      title: 'Functional dependency graph',
      caption: 'Dependencies are semantic rules that must hold across every legal instance.',
      kind: 'dependency',
      labels: ['A', 'B', 'C', 'Legal rows'],
      checkpoints: ['Do not infer only from samples.', 'Compare same determinant rows.', 'Reject contradictions.'],
    },
    {
      title: 'Key closure loop',
      caption: 'Candidate keys are found by expanding what a determinant can imply.',
      kind: 'pipeline',
      labels: ['Start X', 'Apply FDs', 'X+', 'All attributes?'],
      checkpoints: ['Compute closure.', 'Test minimality.', 'Separate superkeys from candidate keys.'],
    },
    {
      title: 'Anomaly locator',
      caption: 'Repeated facts reveal that a fact is stored at the wrong determinant.',
      kind: 'sets',
      labels: ['Repeated fact', 'Update risk', 'Delete risk', 'Insert risk'],
      checkpoints: ['Find duplicated non-key facts.', 'Ask what determines them.', 'Move facts to their owner key.'],
    },
    {
      title: 'Lossless split picture',
      caption: 'A decomposition must join back without inventing or losing tuples.',
      kind: 'dependency',
      labels: ['Original R', 'R1', 'R2', 'Natural join'],
      checkpoints: ['Shared attributes matter.', 'One side should be controlled.', 'Verify reconstruction.'],
    },
  ],
  'modules-triggers': [
    {
      title: 'Procedure boundary',
      caption: 'A stored procedure packages intentional multi-step database work behind a CALL.',
      kind: 'routine',
      labels: ['Caller', 'IN params', 'Procedure body', 'OUT value'],
      checkpoints: ['Define inputs.', 'Read current state.', 'Return computed result.'],
    },
    {
      title: 'Looped workflow',
      caption: 'Procedural SQL is useful when a task must repeat reads and writes in a controlled operation.',
      kind: 'pipeline',
      labels: ['Read max', 'Initialize counter', 'Insert row', 'Repeat'],
      checkpoints: ['Handle empty state.', 'Advance the counter.', 'Stop exactly once.'],
    },
    {
      title: 'Trigger ECA picture',
      caption: 'Triggers run because a table event happened, not because a caller explicitly requested them.',
      kind: 'routine',
      labels: ['Event', 'Condition', 'Action', 'Side effect'],
      checkpoints: ['Document side effects.', 'Keep logic narrow.', 'Test every event path.'],
    },
    {
      title: 'Rule placement chooser',
      caption: 'Use the narrowest mechanism that enforces the rule clearly.',
      kind: 'sets',
      labels: ['Constraint', 'View', 'Procedure', 'Trigger', 'Application'],
      checkpoints: ['Static truth uses constraints.', 'Explicit workflows use procedures.', 'Automatic reactions use triggers.'],
    },
  ],
  'storage-indexes': [
    {
      title: 'Block movement picture',
      caption: 'Database cost is often dominated by moving pages, not by comparing values.',
      kind: 'index',
      labels: ['Disk blocks', 'Buffer frame', 'Pinned page', 'Dirty write'],
      checkpoints: ['Count pages.', 'Respect pins.', 'Write dirty victims before eviction.'],
    },
    {
      title: 'Index density grid',
      caption: 'Dense and sparse indexes differ by how many search-key anchors they store.',
      kind: 'index',
      labels: ['Data order', 'Dense entry', 'Sparse anchor', 'Local scan'],
      checkpoints: ['Sparse needs order.', 'Secondary is usually dense.', 'Entry capacity drives block count.'],
    },
    {
      title: 'B+ tree navigation',
      caption: 'Balanced internal nodes guide lookup while leaves support equality and range scans.',
      kind: 'index',
      labels: ['Root', 'Internal', 'Leaf chain', 'Data records'],
      checkpoints: ['Same leaf depth.', 'Linked leaves support ranges.', 'Splits preserve balance.'],
    },
    {
      title: 'Cost classification board',
      caption: 'Before drawing an index, classify the workload and file order.',
      kind: 'pipeline',
      labels: ['Search key', 'File order', 'Entry count', 'Access cost'],
      checkpoints: ['Identify ordering.', 'Choose primary or secondary.', 'Compute blocks with ceiling.'],
    },
  ],
  jdbc: [
    {
      title: 'Runtime connection route',
      caption: 'A database request crosses Java code, JDBC, Connector/J, tunnel, and MySQL.',
      kind: 'network',
      labels: ['Java app', 'JDBC API', 'Connector/J', 'SSH tunnel', 'MySQL'],
      checkpoints: ['Classpath before SQL.', 'Credentials before query logic.', 'Tunnel before server access.'],
    },
    {
      title: 'Prepared statement boundary',
      caption: 'Placeholders keep SQL structure separate from user-provided values.',
      kind: 'pipeline',
      labels: ['SQL template', 'Placeholder', 'Bound value', 'Execute safely'],
      checkpoints: ['Never concatenate user text.', 'Bind by position.', 'Let the driver quote values.'],
    },
    {
      title: 'ResultSet reader',
      caption: 'Query output is consumed row by row through a cursor-like API.',
      kind: 'network',
      labels: ['executeQuery', 'ResultSet', 'rs.next()', 'Typed getters'],
      checkpoints: ['Loop rows.', 'Read by column name or index.', 'Close resources.'],
    },
    {
      title: 'Callable procedure route',
      caption: 'CallableStatement connects Java code to stored procedures with IN and OUT parameters.',
      kind: 'routine',
      labels: ['Java caller', 'CALL text', 'IN values', 'OUT value'],
      checkpoints: ['Register OUT parameters.', 'Execute call.', 'Read returned values.'],
    },
  ],
  'capstone-studio': [
    {
      title: 'System contract map',
      caption: 'A capstone design connects durable entities, workflow events, audit evidence, and operational interfaces.',
      kind: 'schema',
      labels: ['Requirement', 'Entity', 'Event', 'Audit row', 'Operation'],
      checkpoints: ['Name row grain.', 'Preserve legal states.', 'Keep evidence visible.'],
    },
    {
      title: 'Query contract pipeline',
      caption: 'A stable service query moves from source rows to a declared output grain that callers can rely on.',
      kind: 'pipeline',
      labels: ['Source rows', 'Row filter', 'Group grain', 'Stable view'],
      checkpoints: ['State one output row.', 'Control fanout.', 'Separate WHERE from HAVING.'],
    },
    {
      title: 'Transaction evidence board',
      caption: 'A multi-row operation should make before state, writes, after state, and audit evidence traceable.',
      kind: 'pipeline',
      labels: ['Precondition', 'Write set', 'Commit/Rollback', 'Evidence'],
      checkpoints: ['Guard the state transition.', 'Commit related writes together.', 'Preserve audit rows.'],
    },
    {
      title: 'Operational readiness route',
      caption: 'Deployment quality comes from matching workload, access path, safe binding, and debug layer.',
      kind: 'network',
      labels: ['Workload', 'Index', 'Prepared value', 'JDBC resource', 'Failure layer'],
      checkpoints: ['Choose access path.', 'Bind values safely.', 'Close and diagnose by layer.'],
    },
  ],
}

function clamp(value: number, min: number, max: number) {
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

function readPersistedStudyState(): PersistedStudyState | null {
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

function commandKindLabel(kind: StudyCommandKind) {
  if (kind === 'deck') return 'Deck'
  if (kind === 'slide') return 'Slide'
  if (kind === 'quiz') return 'Quiz'
  return 'Bookmark'
}

function buildStudyCommandItems(bookmarks: BookmarkedSlides): StudyCommandItem[] {
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
    updateScoreDisplay()
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
    updateScoreDisplay()
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

  function updateScoreDisplay() {
    return undefined
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

type IconType = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>

function Metric({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={17} aria-hidden={true} />
      <span>{value}</span>
      <small>{label}</small>
    </div>
  )
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: IconType
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-selected={active}
      className={`mode-button ${active ? 'is-active' : ''}`}
      onClick={onClick}
      role="tab"
      type="button"
      title={label}
    >
      <Icon size={17} aria-hidden={true} />
      <span>{label}</span>
    </button>
  )
}

function isGeneratedSubtopicSlide(slide: Deck['slides'][number]) {
  return /\b\d+\/20$/.test(slide.eyebrow)
}

function getSubtopicPageInfo(slide: Deck['slides'][number]): SubtopicPageInfo | null {
  const match = slide.eyebrow.match(/^(.*?)\s+(\d+)\/20$/)
  if (!match) return null
  return {
    focus: match[1],
    page: Number(match[2]),
  }
}

const pageVisualModeProfiles: Record<number, SubtopicVisualMode[]> = {
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

type PageInstrumentLayout =
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

type PageInteractionProfile = {
  eyebrow: string
  title: string
  subtitle: string
  layout: PageInstrumentLayout
  cardLabels: [string, string, string]
}

type InstrumentCard = {
  label: string
  title: string
  detail: string
}

const pageInteractionProfiles: Record<number, PageInteractionProfile> = {
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

const familyModeProfiles: Record<VisualFamily, SubtopicVisualMode[]> = {
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

function uniqueVisualModes(modes: SubtopicVisualMode[]) {
  return Array.from(new Set(modes))
}

function visualModesFor(deck: Deck, info: SubtopicPageInfo): SubtopicVisualMode[] {
  const family = deckInteractiveBlueprints[deck.id]?.family ?? 'schema'
  return uniqueVisualModes([
    ...(pageVisualModeProfiles[info.page] ?? ['adaptive', 'map', 'trace']),
    ...familyModeProfiles[family],
  ]).slice(0, 4)
}

function pageInteractionProfileFor(info: SubtopicPageInfo) {
  return pageInteractionProfiles[info.page] ?? pageInteractionProfiles[1]
}

function sequenceSlideClassFor(deck: Deck, slide: Deck['slides'][number]) {
  const info = getSubtopicPageInfo(slide)
  if (!info) return ''
  const profile = pageInteractionProfileFor(info)
  const family = deckInteractiveBlueprints[deck.id]?.family ?? 'schema'
  return `sequence-page-${info.page} sequence-layout-${profile.layout} sequence-family-${family}`
}

function compactText(text: string | undefined, limit = 132) {
  if (!text) return ''
  const normalized = plainText(text).replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit - 1).trim()}...`
}

function detailAt(items: string[], index: number, fallback: string) {
  return items[index % Math.max(items.length, 1)] ?? fallback
}

function instrumentCardsFor(
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

type DbCell = string | number
type DbTableSnapshot = {
  title: string
  columns: string[]
  rows: DbCell[][]
  highlightRows?: number[]
}
type DbTableScenario = {
  title: string
  queryLabel: string
  sql: string
  before: DbTableSnapshot
  after: DbTableSnapshot
  analysis: string[]
  transitions?: DbTransitionEvent[]
}
type DbTransitionEvent = {
  label: string
  before: string
  operation: string
  after: string
  why: string
}
type AppliedCaseCard = {
  label: string
  title: string
  objective: string
  code: string
  evidence: string[]
  diagnostic: string
  transfer: string
}

const tableScenarioLibrary: Record<string, DbTableScenario> = {
  'Entity integrity': {
    title: 'Composite key insert test',
    queryLabel: 'Try a legal duplicate-looking copy number',
    sql: 'INSERT INTO MovieCopy(movie_id, copy_num, barcode)\nVALUES (11, 1, \'B-001\');',
    before: {
      title: 'MovieCopy before',
      columns: ['movie_id', 'copy_num', 'barcode'],
      rows: [[10, 1, 'A-001'], [10, 2, 'A-002']],
    },
    after: {
      title: 'MovieCopy after',
      columns: ['movie_id', 'copy_num', 'barcode', 'result'],
      rows: [[10, 1, 'A-001', 'kept'], [10, 2, 'A-002', 'kept'], [11, 1, 'B-001', 'inserted']],
      highlightRows: [2],
    },
    analysis: [
      'The new row reuses copy_num 1, but the full key is movie_id plus copy_num, so it is a different physical copy.',
      'If copy_num alone were the primary key, this legal row would be rejected and the schema would be too strict.',
      'The table view lets the learner see that uniqueness belongs to the chosen row grain, not to a convenient single column.',
    ],
  },
  'Referential integrity': {
    title: 'Foreign key orphan rejection',
    queryLabel: 'Try to insert a child row without its parent',
    sql: 'INSERT INTO RentalItem(rental_id, movie_id, copy_num)\nVALUES (999, 10, 1);',
    before: {
      title: 'RentalOrder parent rows',
      columns: ['rental_id', 'customer_id'],
      rows: [[101, 7], [102, 9]],
    },
    after: {
      title: 'RentalItem attempted result',
      columns: ['rental_id', 'movie_id', 'copy_num', 'result'],
      rows: [[101, 10, 1, 'valid existing item'], [999, 10, 1, 'rejected: no parent']],
      highlightRows: [1],
    },
    analysis: [
      'The child value 999 is checked against the referenced parent key before the row can become durable.',
      'The row is syntactically shaped correctly, but referential integrity is about allowed values, not only column count.',
      'This is why a foreign key is executable validation rather than a decorative relationship line.',
    ],
  },
  'Referential actions': {
    title: 'Delete action comparison',
    queryLabel: 'Delete a referenced parent',
    sql: 'DELETE FROM Pizza\nWHERE pizza_name = \'Margherita\';',
    before: {
      title: 'Patron before delete',
      columns: ['patron_id', 'name', 'fav_pizza'],
      rows: [[1, 'Ari', 'Margherita'], [2, 'Bo', 'Pepperoni']],
    },
    after: {
      title: 'Patron after ON DELETE SET NULL',
      columns: ['patron_id', 'name', 'fav_pizza', 'meaning'],
      rows: [[1, 'Ari', 'NULL', 'patron preserved'], [2, 'Bo', 'Pepperoni', 'unchanged']],
      highlightRows: [0],
    },
    analysis: [
      'SET NULL removes the optional association without deleting the patron row.',
      'A cascade here would delete the patron, which would overstate ownership and destroy a meaningful entity.',
      'The before-and-after table makes lifecycle semantics visible instead of hiding them inside ON DELETE syntax.',
    ],
  },
  'Domain constraints': {
    title: 'Domain rule blocks impossible values',
    queryLabel: 'Try a value outside the status vocabulary',
    sql: "INSERT INTO MovieCopy(copy_id, status)\nVALUES (4, 'BROKENISH');",
    before: {
      title: 'Allowed copy statuses',
      columns: ['copy_id', 'status'],
      rows: [[1, 'WORKING'], [2, 'DAMAGED'], [3, 'MISSING']],
    },
    after: {
      title: 'Attempt result',
      columns: ['copy_id', 'submitted_status', 'result'],
      rows: [[4, 'BROKENISH', 'rejected by enum/domain']],
      highlightRows: [0],
    },
    analysis: [
      'The table does not wait for a later query to discover the typo; the domain rejects it at write time.',
      'Stable vocabularies are good candidates for enum or lookup-table constraints.',
      'Workflow facts still require additional logic when they depend on previous states or multi-row events.',
    ],
  },
  'Logical processing order': {
    title: 'WHERE then GROUP BY then HAVING',
    queryLabel: 'Count open rentals per movie',
    sql: 'SELECT movie_id, COUNT(*) AS open_items\nFROM RentalItem\nWHERE returned_at IS NULL\nGROUP BY movie_id\nHAVING COUNT(*) >= 2;',
    before: {
      title: 'RentalItem rows',
      columns: ['rental_id', 'movie_id', 'returned_at'],
      rows: [[1, 10, 'NULL'], [2, 10, 'NULL'], [3, 11, '2025-02-01'], [4, 11, 'NULL']],
      highlightRows: [0, 1, 3],
    },
    after: {
      title: 'Query result',
      columns: ['movie_id', 'open_items'],
      rows: [[10, 2]],
      highlightRows: [0],
    },
    analysis: [
      'WHERE removes returned rows before groups exist, so movie 11 has only one open row in the grouped input.',
      'GROUP BY changes the grain from rental item rows to movie rows.',
      'HAVING removes movie groups whose aggregate count is below the threshold.',
    ],
  },
  'Result grain': {
    title: 'Fanout-safe aggregate result',
    queryLabel: 'Pre-aggregate details to rental grain',
    sql: 'WITH item_summary AS (\n  SELECT rental_id, COUNT(*) AS item_count\n  FROM RentalItem GROUP BY rental_id\n)\nSELECT rental_id, item_count\nFROM item_summary;',
    before: {
      title: 'RentalItem detail rows',
      columns: ['rental_id', 'movie_id'],
      rows: [[101, 10], [101, 11], [102, 12]],
      highlightRows: [0, 1],
    },
    after: {
      title: 'One row per rental',
      columns: ['rental_id', 'item_count'],
      rows: [[101, 2], [102, 1]],
      highlightRows: [0],
    },
    analysis: [
      'The output grain is rental_id, not individual item rows.',
      'The count is safe because the detail table is grouped before it is combined with any other one-to-many source.',
      'This table display makes fanout visible: two detail rows collapse into one rental summary row.',
    ],
  },
  'Null logic': {
    title: 'Anti-join result with NOT EXISTS',
    queryLabel: 'Find patrons with no rental orders',
    sql: 'SELECT p.patron_id, p.name\nFROM Patron AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM RentalOrder AS r\n  WHERE r.patron_id = p.patron_id\n);',
    before: {
      title: 'Patron and RentalOrder facts',
      columns: ['patron_id', 'name', 'rental_order?'],
      rows: [[1, 'Ari', 'yes'], [2, 'Bo', 'no'], [3, 'Cy', 'yes']],
      highlightRows: [1],
    },
    after: {
      title: 'NOT EXISTS result',
      columns: ['patron_id', 'name'],
      rows: [[2, 'Bo']],
      highlightRows: [0],
    },
    analysis: [
      'The result contains the outer row for which the correlated subquery finds no matching rental order.',
      'NOT EXISTS avoids the null-sensitive behavior that can make NOT IN surprising.',
      'The result table shows absence as a tested condition, not as a hidden literal value.',
    ],
  },
  'Join reasoning': {
    title: 'Join fanout demonstration',
    queryLabel: 'Join customers to rental orders',
    sql: 'SELECT c.customer_id, c.city, r.rental_id\nFROM Customer AS c\nJOIN RentalOrder AS r\n  ON r.customer_id = c.customer_id;',
    before: {
      title: 'Customer rows',
      columns: ['customer_id', 'city', 'orders'],
      rows: [[7, 'Denver', '101, 102'], [9, 'Austin', '103']],
      highlightRows: [0],
    },
    after: {
      title: 'Joined rows',
      columns: ['customer_id', 'city', 'rental_id'],
      rows: [[7, 'Denver', 101], [7, 'Denver', 102], [9, 'Austin', 103]],
      highlightRows: [0, 1],
    },
    analysis: [
      'Customer 7 appears twice after the join because two rental orders match the same customer key.',
      'This duplication is correct for the joined grain, but dangerous if the next step sums customer-level facts.',
      'The after table makes row multiplication inspectable before aggregation hides it.',
    ],
  },
  'Anti-join and difference': {
    title: 'Difference through candidate pairs',
    queryLabel: 'Find missing patron-pizzeria pairs',
    sql: 'SELECT p.patron, z.pizzeria\nFROM Patron AS p\nCROSS JOIN Pizzeria AS z\nWHERE NOT EXISTS (\n  SELECT 1 FROM Frequents AS f\n  WHERE f.patron = p.patron\n    AND f.pizzeria = z.pizzeria\n);',
    before: {
      title: 'Candidate pairs',
      columns: ['patron', 'pizzeria', 'frequents?'],
      rows: [['Ari', 'Slice', 'yes'], ['Ari', 'Oven', 'no'], ['Bo', 'Slice', 'no']],
      highlightRows: [1, 2],
    },
    after: {
      title: 'Difference result',
      columns: ['patron', 'pizzeria'],
      rows: [['Ari', 'Oven'], ['Bo', 'Slice']],
      highlightRows: [0, 1],
    },
    analysis: [
      'The CROSS JOIN defines the universe of possible pairs before observed pairs are subtracted.',
      'NOT EXISTS removes only pairs with matching evidence in Frequents.',
      'The result is a relation of missing relationships, which is easier to see as a table than as prose.',
    ],
  },
  'Tie-aware extrema': {
    title: 'Top value with ties preserved',
    queryLabel: 'Return all most expensive laptops',
    sql: 'SELECT model, price\nFROM Laptop\nWHERE price >= ALL (SELECT price FROM Laptop);',
    before: {
      title: 'Laptop',
      columns: ['model', 'price'],
      rows: [['L1', 1400], ['L2', 1800], ['L3', 1800], ['L4', 1200]],
      highlightRows: [1, 2],
    },
    after: {
      title: 'Tie-aware result',
      columns: ['model', 'price'],
      rows: [['L2', 1800], ['L3', 1800]],
      highlightRows: [0, 1],
    },
    analysis: [
      'Both top rows survive because the predicate compares each price to all prices rather than picking one row.',
      'LIMIT 1 would hide one valid answer unless the prompt explicitly asks for a single arbitrary row.',
      'The table result emphasizes that extrema questions need tie policy, not just maximum calculation.',
    ],
  },
  'View contracts': {
    title: 'View output as a stable table interface',
    queryLabel: 'Expose currently available copies',
    sql: 'SELECT movie_id, copy_num\nFROM available_copy;',
    before: {
      title: 'MovieCopy state',
      columns: ['movie_id', 'copy_num', 'status', 'open_rental?'],
      rows: [[10, 1, 'WORKING', 'no'], [10, 2, 'WORKING', 'yes'], [11, 1, 'DAMAGED', 'no']],
      highlightRows: [0],
    },
    after: {
      title: 'available_copy view',
      columns: ['movie_id', 'copy_num'],
      rows: [[10, 1]],
      highlightRows: [0],
    },
    analysis: [
      'The view hides damaged and currently rented copies behind one reusable interface.',
      'Applications can query available_copy without repeating the underlying predicate logic.',
      'The after table is the contract consumers depend on, even though it is derived from base facts.',
    ],
  },
  Updatability: {
    title: 'Updatable versus derived view result',
    queryLabel: 'Compare one-row mapping to aggregate mapping',
    sql: 'UPDATE active_customer\nSET city = \'Atlanta\'\nWHERE customer_id = 42;',
    before: {
      title: 'active_customer view',
      columns: ['customer_id', 'email', 'city'],
      rows: [[42, 'a@example.com', 'Dallas'], [43, 'b@example.com', 'Boston']],
      highlightRows: [0],
    },
    after: {
      title: 'Base Customer after update',
      columns: ['customer_id', 'email', 'city', 'mapping'],
      rows: [[42, 'a@example.com', 'Atlanta', 'one base row'], [43, 'b@example.com', 'Boston', 'unchanged']],
      highlightRows: [0],
    },
    analysis: [
      'The update can be translated because the view row preserves the base table key.',
      'An aggregate view such as city_counts would not have one base row to update for customer_count.',
      'The before-and-after tables show that view updatability is a mapping problem, not just a SELECT syntax problem.',
    ],
  },
  'Functional dependencies': {
    title: 'Closure table for key reasoning',
    queryLabel: 'Compute closure of {model}',
    sql: 'Start: {model}\nApply model -> maker, type, speed\nResult: {model, maker, type, speed}',
    before: {
      title: 'Functional dependencies',
      columns: ['determinant', 'dependent'],
      rows: [['model', 'maker'], ['model', 'type'], ['model', 'speed']],
      highlightRows: [0, 1, 2],
    },
    after: {
      title: 'Closure result',
      columns: ['step', 'closure'],
      rows: [[0, '{model}'], [1, '{model, maker}'], [2, '{model, maker, type}'], [3, '{model, maker, type, speed}']],
      highlightRows: [3],
    },
    analysis: [
      'Closure grows only when a dependency has its determinant already available.',
      'If the final closure contains every attribute in the relation, the starting set is a superkey.',
      'The table turns key discovery into a repeatable algorithm instead of a guess from sample rows.',
    ],
  },
  Decomposition: {
    title: 'Lossless decomposition check',
    queryLabel: 'Split course facts from enrollment facts',
    sql: 'R(course_id, student_id, instructor, room)\nFD: course_id -> instructor, room\nSplit into Course(course_id, instructor, room)\nand Enrollment(student_id, course_id).',
    before: {
      title: 'Original relation',
      columns: ['student_id', 'course_id', 'instructor', 'room'],
      rows: [[1, 'DB', 'Kim', 'B12'], [2, 'DB', 'Kim', 'B12']],
      highlightRows: [0, 1],
    },
    after: {
      title: 'Decomposed tables',
      columns: ['table', 'rows'],
      rows: [['Course', 'DB -> Kim, B12'], ['Enrollment', '(1, DB), (2, DB)']],
      highlightRows: [0, 1],
    },
    analysis: [
      'The repeated instructor and room facts move into Course because course_id determines them.',
      'Enrollment keeps the student-course relationship without duplicating course properties.',
      'The common course_id allows a lossless join back to the original facts.',
    ],
  },
  'Triggers and ECA logic': {
    title: 'Trigger side effect table',
    queryLabel: 'Insert rental item, then update copy state',
    sql: 'INSERT INTO RentalItem(rental_id, movie_id, copy_num)\nVALUES (201, 10, 1);\n-- trigger sets MovieCopy.status = RENTED',
    before: {
      title: 'MovieCopy before trigger',
      columns: ['movie_id', 'copy_num', 'status'],
      rows: [[10, 1, 'WORKING'], [10, 2, 'WORKING']],
      highlightRows: [0],
    },
    after: {
      title: 'MovieCopy after trigger',
      columns: ['movie_id', 'copy_num', 'status'],
      rows: [[10, 1, 'RENTED'], [10, 2, 'WORKING']],
      highlightRows: [0],
    },
    analysis: [
      'The insert event provides NEW.movie_id and NEW.copy_num to identify the affected copy.',
      'The trigger creates a second table change that the original INSERT statement does not visibly show.',
      'This makes trigger logic powerful but harder to audit, so the side effect table must be part of the mental trace.',
    ],
  },
  'B+ tree behavior': {
    title: 'Index range scan output',
    queryLabel: 'Use composite index for customer-date range',
    sql: 'SELECT order_id, order_date, total_amount\nFROM Orders\nWHERE customer_id = 42\n  AND order_date BETWEEN \'2026-01-01\' AND \'2026-03-31\';',
    before: {
      title: 'Index leaf order',
      columns: ['key(customer_id, order_date)', 'total_amount'],
      rows: [['17,2026-01-04', 84], ['42,2026-01-19', 210], ['42,2026-02-08', 96], ['42,2026-03-21', 134]],
      highlightRows: [1, 2, 3],
    },
    after: {
      title: 'Range scan result',
      columns: ['order_id', 'order_date', 'total_amount'],
      rows: [[1004, '2026-01-19', 210], [1040, '2026-02-08', 96], [1112, '2026-03-21', 134]],
      highlightRows: [0, 1, 2],
    },
    analysis: [
      'Equality on customer_id positions the scan at the first matching leaf entry.',
      'The date range then reads adjacent ordered entries instead of scanning unrelated customers.',
      'The table display makes the physical order benefit of the composite index visible.',
    ],
  },
  'Prepared statements': {
    title: 'Parameter binding result',
    queryLabel: 'Bind email as data, not SQL text',
    sql: 'SELECT customer_id, email\nFROM Customer\nWHERE email = ?;\n-- parameter 1 = "ari@example.com"',
    before: {
      title: 'Customer',
      columns: ['customer_id', 'email'],
      rows: [[7, 'ari@example.com'], [8, 'bo@example.com']],
      highlightRows: [0],
    },
    after: {
      title: 'Prepared query result',
      columns: ['customer_id', 'email'],
      rows: [[7, 'ari@example.com']],
      highlightRows: [0],
    },
    analysis: [
      'The placeholder is filled as a value, so the query structure stays fixed.',
      'The DBMS compares the bound value to stored email values rather than reparsing user text as SQL.',
      'The result table shows normal selection behavior while the security benefit happens in how the command is built.',
    ],
  },
  'Service query contracts': {
    title: 'Active checkout contract result',
    queryLabel: 'Expose one row per active checkout',
    sql: 'CREATE VIEW ActiveCheckout AS\nSELECT checkout_id, item_id, borrower_id, due_at\nFROM Checkout\nWHERE status = \'OUT\';',
    before: {
      title: 'Checkout',
      columns: ['checkout_id', 'item_id', 'borrower_id', 'status', 'due_at'],
      rows: [[501, 42, 17, 'OUT', '2026-06-03'], [502, 43, 18, 'RETURNED', '2026-06-01'], [503, 44, 17, 'OUT', '2026-06-10']],
      highlightRows: [0, 2],
    },
    after: {
      title: 'ActiveCheckout',
      columns: ['checkout_id', 'item_id', 'borrower_id', 'due_at'],
      rows: [[501, 42, 17, '2026-06-03'], [503, 44, 17, '2026-06-10']],
      highlightRows: [0, 1],
    },
    analysis: [
      'The view contract removes returned events before callers see the interface.',
      'One output row means one active checkout, not one borrower, item type, or historical event.',
      'Screens can reuse the view without reimplementing the status predicate inconsistently.',
    ],
  },
  'Transactional audit workflow': {
    title: 'Checkout transaction state',
    queryLabel: 'Insert event and change item state together',
    sql: 'START TRANSACTION;\nINSERT INTO Checkout(item_id, borrower_id, status) VALUES (42, 17, \'OUT\');\nUPDATE EquipmentItem SET status = \'OUT\'\nWHERE item_id = 42 AND status = \'AVAILABLE\';\nCOMMIT;',
    before: {
      title: 'EquipmentItem before',
      columns: ['item_id', 'barcode', 'status'],
      rows: [[42, 'CAM-42', 'AVAILABLE'], [43, 'MIC-43', 'OUT']],
      highlightRows: [0],
    },
    after: {
      title: 'Workflow after',
      columns: ['fact', 'key', 'state'],
      rows: [['Checkout', 501, 'OUT event inserted'], ['EquipmentItem', 42, 'OUT']],
      highlightRows: [0, 1],
    },
    analysis: [
      'The guarded update proves the item was available at the moment of checkout.',
      'The insert and update represent one workflow operation, so partial success should not be committed.',
      'The after table keeps both event evidence and current item state aligned.',
    ],
  },
}

function fallbackTableScenario(_deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>): DbTableScenario {
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

function tableScenarioFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>) {
  return tableScenarioLibrary[info.focus] ?? fallbackTableScenario(deck, slide, info, model)
}

function tableRowSummary(snapshot: DbTableSnapshot, rowIndex: number) {
  const row = snapshot.rows[rowIndex] ?? snapshot.rows[0] ?? []
  if (!row.length) return `${snapshot.title}: no row`
  return snapshot.columns
    .map((column, columnIndex) => `${column}=${row[columnIndex] ?? ''}`)
    .join(', ')
}

function tableTransitionEvents(
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

function baseExampleCode(slide: Deck['slides'][number], scenario: DbTableScenario) {
  const firstBlock = (slide.example ?? scenario.sql).split('\n\nWorked micro-case:')[0]?.trim()
  return firstBlock || scenario.sql
}

function failureProbeCodeFor(
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

function repairSnippetFor(
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
R1 := σ_condition(R)
R2 := R1 ⋈_key S
Answer := π_requested(R2)
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

function appliedCaseCardsFor(
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

const tablePhaseLabels: Record<'before' | 'sql' | 'after' | 'analysis', string> = {
  before: 'Before',
  sql: 'Operation',
  after: 'After',
  analysis: 'Why',
}

function nodeWhyText(info: SubtopicPageInfo, node: { label: string; detail: string }, slide: Deck['slides'][number]) {
  return `${node.label} is the local object to inspect for ${info.focus}. ${node.detail} Keep the explanation attached to this node: do not let a later result card replace the evidence that made this node necessary. ${slide.checks?.[0] ?? 'State the test that proves this node belongs in the solution.'}`
}

function stageChangeText(info: SubtopicPageInfo, stage: { label: string; detail: string }, slide: Deck['slides'][number]) {
  return `${stage.label} changes the current intermediate state for ${info.focus}. ${stage.detail} For a larger case, write the relation schema, row grain, dependency set, access path, or runtime object that exists after this step before using it in the next step. ${slide.checks?.[1] ?? slide.checks?.[0] ?? 'Name the evidence produced by this stage.'}`
}

function matrixDecisionText(info: SubtopicPageInfo, row: string, column: string, slide: Deck['slides'][number]) {
  return `${row} is the mechanism being considered; ${column} is the behavior it is being tested against. In ${info.focus}, this pairing is useful only if it explains a concrete legal-state change, result-grain change, dependency change, access-path change, or runtime-state change. ${slide.checks?.[0] ?? 'Test the pairing against the scenario before accepting it.'}`
}

function simulationEventsFor(
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

function traceStateForStage(
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

function traceArtifactForStage(
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
      'R1 := σ_condition(R0)\nRows may shrink; schema stays {model, maker, type}\nLarge-case rule: selection predicates must mention attributes currently present.',
      'R2 := π_model,maker(R1)\nRows keep identity only if projected attributes still support later joins or comparisons.\nLarge-case rule: project late when a future operator still needs a removed attribute.',
      'R3 := ρ_P1(R2)\nSchema is renamed so one relation can play a separate role.\nLarge-case rule: rename prevents self-comparison ambiguity; it does not change meaning by itself.',
      'R4 := R3 ⋈_P1.model=L.model L\nJoin changes row context and can multiply tuples.\nLarge-case rule: inspect join keys and fanout before projecting the final answer.',
      'Answer := π_requested_attributes(R4)\nThe final schema must match the question exactly.\nLarge-case rule: verify both tuple membership and output attributes.',
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

function buildSubtopicVisualModel(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo) {
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

function deepDiveCodeFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
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
  π_maker (
    Product ⋈_{Product.model = Laptop.model}
    σ_{drive >= 1000 AND ram >= 16}(Laptop)
  )

Check:
  σ keeps tuple membership testable.
  ⋈ happens before maker is projected.
  π removes extra columns only at the end.`
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

function deepDiveChecksFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
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

function deepDivePracticeCardsFor(deck: Deck, slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
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

function deepWorksheetCardsFor(slide: Deck['slides'][number], info: SubtopicPageInfo, model: ReturnType<typeof buildSubtopicVisualModel>, scenario: DbTableScenario) {
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
                  {renderRichText(`${transition.before} → ${transition.operation} → ${transition.after}`)}
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

function LectureStage({
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

type SequenceWorkbenchContent = {
  rule: string
  trace: string
  exampleTitle: string
  exampleCode: string
  trap: string
  transfer: string
  proof: string
}

function identifierFrom(text: string, fallback = 'object') {
  const slug = plainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 34)
  return slug || fallback
}

function sequenceWorkbenchContentFor({
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
        exampleCode: `Wanted := π_maker(
  Product ⋈_{Product.model = Laptop.model}
  σ_{drive ≥ 1000}(Laptop)
)`,
        trap: `Projecting too early can erase the join key. A shorter expression is not equivalent if a later operator needs an attribute that was removed.`,
        transfer: `Transfer case: rewrite a SQL query into algebra, then move one σ operator earlier. The rewrite is valid only when the selection references attributes still present at that point.`,
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

type TechnicalTermItem = {
  term: string
  definition: string
  example: string
}

type TechnicalCase = {
  title: string
  scenario: string
  code: string
  explanation: string[]
}

const deckTechnicalTermBank: Record<string, TechnicalTermItem[]> = {
  ddl: [
    { term: 'Candidate key', definition: 'A minimal attribute set that can identify one legal row without depending on another attribute.', example: 'In MovieCopy, (movie_id, copy_num) is a candidate key because neither part alone identifies one physical copy.' },
    { term: 'Referential action', definition: 'The rule that controls child rows when a referenced parent row is updated or deleted.', example: 'ON DELETE RESTRICT keeps rental history from disappearing when a movie title is retired.' },
    { term: 'Domain constraint', definition: 'A restriction on the legal values of one attribute independent of relationships.', example: 'CHECK (copy_num > 0) rejects impossible numbered copies before application code runs.' },
    { term: 'Alternate key', definition: 'A candidate key that is enforced as UNIQUE even if it is not chosen as the primary key.', example: 'A customer_id primary key can coexist with UNIQUE(email) when email is also a stable identifier.' },
    { term: 'Entity integrity', definition: 'The rule that primary key attributes must identify rows and cannot be NULL.', example: 'A rental_id cannot be missing because every payment, return, and audit row must point to one rental event.' },
    { term: 'Subtype table', definition: 'A table whose primary key is also a foreign key to a supertype table.', example: 'Laptop.model references Product.model so laptop facts cannot exist without the shared product identity.' },
  ],
  dml: [
    { term: 'Logical processing order', definition: 'The conceptual order in which SQL forms rows, filters rows, groups rows, filters groups, projects columns, and sorts output.', example: 'WHERE runs before GROUP BY, so it cannot use COUNT(*) created by grouping.' },
    { term: 'Result grain', definition: 'The unit represented by one output row of a query.', example: 'A report grouped by restaurant_id and month has one row per restaurant-month, not one row per order.' },
    { term: 'Aggregate predicate', definition: 'A condition whose truth requires aggregate values over a group.', example: 'HAVING SUM(total) > 5000 belongs after GROUP BY because SUM(total) does not exist per source row.' },
    { term: 'Derived expression', definition: 'A value computed from stored values during query execution.', example: 'price * quantity is a derived line total; storing it separately creates a consistency risk unless controlled.' },
    { term: 'Projection', definition: 'The choice of output columns or expressions exposed by SELECT.', example: 'SELECT customer_id, COUNT(*) hides individual rentals and publishes group-level evidence.' },
    { term: 'Predicate selectivity', definition: 'The fraction of rows expected to survive a filter.', example: 'Filtering active rentals before joining to rental items can reduce the number of row pairs built.' },
  ],
  'joins-subqueries': [
    { term: 'Join fanout', definition: 'The multiplication of rows when one row matches multiple rows on the other side of a join.', example: 'One movie with three rental items becomes three joined rows unless the query later regroups.' },
    { term: 'Semi-join', definition: 'A membership test that keeps rows from the outer relation without copying inner columns.', example: 'EXISTS keeps movies that have rentals while preserving one movie row per movie.' },
    { term: 'Anti-join', definition: 'A membership test that keeps candidates for which matching evidence does not exist.', example: 'NOT EXISTS finds customers with no open invoices without producing NULL-sensitive NOT IN surprises.' },
    { term: 'Correlated subquery', definition: 'A subquery that uses values from the current outer row.', example: 'WHERE r.movie_id = m.movie_id makes the inner rental test run relative to each movie.' },
    { term: 'Tie preservation', definition: 'Keeping every row that shares an extreme value instead of arbitrarily choosing one.', example: 'ALL or a max-subquery can keep every movie tied for most rentals.' },
    { term: 'NULL-sensitive comparison', definition: 'A comparison whose truth can become UNKNOWN when NULL participates.', example: 'NOT IN can fail unexpectedly if the subquery returns NULL; NOT EXISTS avoids that trap.' },
  ],
  'relational-algebra': [
    { term: 'Selection sigma', definition: 'The relational algebra operator that keeps tuples satisfying a predicate while preserving attributes.', example: 'σ_{drive >= 1000}(Laptop) keeps only laptops with large drives.' },
    { term: 'Projection pi', definition: 'The operator that keeps chosen attributes and removes duplicate tuples in pure relational algebra.', example: 'π_maker(Product) returns the set of makers, not one row per product.' },
    { term: 'Rename rho', definition: 'The operator that gives a relation or attribute a new name so self-reference becomes unambiguous.', example: 'ρ_L1(Laptop) and ρ_L2(Laptop) let one laptop row be compared to another.' },
    { term: 'Union compatibility', definition: 'The requirement that set operands have matching arity and compatible domains.', example: 'PC(model) ∪ Laptop(model) is valid; PC(model, speed) ∪ Printer(model) is not.' },
    { term: 'Intermediate schema', definition: 'The attribute heading available after an algebra operator runs.', example: 'After projecting maker only, model is no longer available for a later join.' },
    { term: 'Equivalence rewrite', definition: 'A transformation that preserves result meaning while possibly changing execution cost.', example: 'A selection can be pushed below a join only if its attributes belong to one side.' },
  ],
  views: [
    { term: 'View contract', definition: 'The stable relation name and columns promised to consumers by a view definition.', example: 'active_rentals can hide status rules while preserving one row per active rental item.' },
    { term: 'Key preservation', definition: 'A property where a view still exposes enough key information to map updates back to one base row.', example: 'A simple filtered Customer view may be updatable; an aggregate customer summary usually is not.' },
    { term: 'Security boundary', definition: 'A design that exposes only approved rows or columns through a controlled relation.', example: 'A payroll-safe employee view can omit salary while still showing names and departments.' },
    { term: 'Dependency chain', definition: 'The set of base tables and views that a derived relation depends on.', example: 'Changing Rental.status can break a view that assumes only returned_at defines active rentals.' },
    { term: 'Derived table', definition: 'A named subquery result used inside a larger query.', example: 'A monthly_revenue derived table can be joined to restaurants after aggregation.' },
    { term: 'Materialization', definition: 'Physically storing a derived result instead of recomputing it on every reference.', example: 'A reporting system may materialize daily summaries when live recomputation is too expensive.' },
  ],
  normalization: [
    { term: 'Functional dependency', definition: 'A rule X -> Y saying any two rows equal on X must be equal on Y.', example: 'course_id -> instructor means a course cannot have two instructors in the same legal relation instance.' },
    { term: 'Attribute closure', definition: 'The set of attributes logically implied by a starting attribute set and the known dependencies.', example: 'If A -> B and B -> C, then A+ includes A, B, and C.' },
    { term: 'Superkey', definition: 'An attribute set whose closure includes every attribute in the relation.', example: '(student_id, course_id) is a superkey for Enrollment when it determines grade and all enrollment facts.' },
    { term: 'Transitive dependency', definition: 'A dependency where a nonkey attribute determines another nonkey attribute through an intermediate fact.', example: 'student_id -> advisor_id and advisor_id -> office repeats office in every student row.' },
    { term: 'Lossless decomposition', definition: 'A split of a relation that can be joined back without creating spurious tuples or losing original tuples.', example: 'Splitting Course facts from Enrollment is lossless when course_id determines the course row.' },
    { term: 'Dependency preservation', definition: 'The ability to enforce original dependencies by checking the decomposed tables directly.', example: 'A decomposition is harder to maintain if enforcing X -> Y requires joining tables every time.' },
  ],
  'modules-triggers': [
    { term: 'Stored procedure', definition: 'A named database routine that performs an operation and may change database state.', example: 'checkout_item can insert a rental row, update inventory, and return a generated rental_id.' },
    { term: 'Stored function', definition: 'A routine intended to return a value and usually used inside expressions.', example: 'late_fee(days_late) can compute a fee without directly changing rows.' },
    { term: 'Trigger', definition: 'A routine fired automatically by INSERT, UPDATE, or DELETE events on a table.', example: 'AFTER UPDATE on RentalItem can increment inventory when returned_at becomes non-NULL.' },
    { term: 'ECA rule', definition: 'Event-condition-action logic: when an event occurs, if a condition holds, run an action.', example: 'When a rental is returned, if it was previously open, then restock the copy.' },
    { term: 'OLD and NEW rows', definition: 'Pseudo-row values available inside row-level triggers to compare prior and updated state.', example: 'OLD.returned_at IS NULL and NEW.returned_at IS NOT NULL detects the first return transition.' },
    { term: 'Signal', definition: 'A database-side error raised intentionally when procedural validation fails.', example: 'SIGNAL SQLSTATE can reject a checkout when no copy is available.' },
  ],
  'storage-indexes': [
    { term: 'Disk page', definition: 'A fixed-size block transferred between disk and memory as the unit of I/O.', example: 'A table scan reads page after page even if only a few rows qualify.' },
    { term: 'Buffer frame', definition: 'A memory slot holding one page from disk while the DBMS reads or modifies it.', example: 'Repeatedly reading hot customer pages can become cheap if the buffer pool keeps them resident.' },
    { term: 'Dirty page', definition: 'A buffered page whose memory version has changes not yet written back to disk.', example: 'Updating an index leaf makes it dirty until the DBMS flushes it.' },
    { term: 'Dense index', definition: 'An index with an entry for every search-key value or record.', example: 'A dense secondary index on email supports point lookup even when the file is not sorted by email.' },
    { term: 'Sparse index', definition: 'An index with entries for some search-key values, usually one per sorted data block.', example: 'A sparse primary index can jump to a block range in a sorted file.' },
    { term: 'B+ tree leaf chain', definition: 'The linked sequence of leaf pages that supports range scans after reaching the first matching leaf.', example: 'After finding customer_id = 42, the query scans leaf entries ordered by rental_date.' },
  ],
  jdbc: [
    { term: 'DriverManager', definition: 'The JDBC entry point that locates a driver and opens a database connection from a URL.', example: 'DriverManager.getConnection(url, user, pw) creates a DBMS session when the URL and credentials are valid.' },
    { term: 'PreparedStatement', definition: 'A precompiled SQL template with placeholders for data values.', example: 'WHERE customer_id = ? lets the driver bind an integer instead of concatenating text into SQL.' },
    { term: 'ResultSet cursor', definition: 'The pointer over query output rows returned by executeQuery.', example: 'rs.next() advances to the next row before rs.getString("title") reads a column.' },
    { term: 'JDBC URL', definition: 'The string that names protocol, host, port, database, and options for a connection.', example: 'jdbc:mysql://127.0.0.1:3307/course_db uses a local tunnel port to reach MySQL.' },
    { term: 'Classpath', definition: 'The runtime search path Java uses to find classes and JARs.', example: 'Connector/J must be on the classpath or the MySQL driver cannot load.' },
    { term: 'Try-with-resources', definition: 'Java syntax that automatically closes resources at the end of a block.', example: 'A Connection, PreparedStatement, and ResultSet can all be closed safely even after an exception.' },
  ],
  'capstone-studio': [
    { term: 'Invariant', definition: 'A condition that must remain true after every legal operation.', example: 'A copy cannot be checked out to two active rentals at the same time.' },
    { term: 'Query contract', definition: 'A documented result shape that callers are allowed to depend on.', example: 'active_checkout_report returns one row per currently checked-out copy, not one row per customer.' },
    { term: 'Audit row', definition: 'A durable fact that records what happened instead of overwriting history.', example: 'ReturnInspection stores condition_at_return even after inventory state changes.' },
    { term: 'Transaction boundary', definition: 'The set of writes that must commit or roll back together.', example: 'Creating a rental and decrementing available_count must be atomic.' },
    { term: 'Workload-driven index', definition: 'An index chosen from frequent predicates, joins, and ordering needs.', example: 'An index on (customer_id, returned_at) supports active rentals by customer.' },
    { term: 'Deployment boundary', definition: 'The runtime layer where credentials, network, driver, and permissions can fail independently of SQL correctness.', example: 'A query can be right but unreachable when an SSH tunnel points to the wrong remote port.' },
  ],
}

function technicalCaseFor(deck: Deck, slide: Deck['slides'][number], slideIndex: number, masteryNode: MasteryPathNode): TechnicalCase {
  const focus = identifierFrom(slide.title, 'focus')
  const title = compactText(plainText(slide.title), 68)
  const cases: Record<string, TechnicalCase> = {
    ddl: {
      title: 'Schema contract in a rental system',
      scenario: 'A rental platform stores movies, physical copies, and checkout events. The realistic problem is not only storing rows; it is preventing orphan copies, duplicate copy numbers, and destructive parent deletes.',
      code: `CREATE TABLE MovieCopy (
  movie_id INT NOT NULL,
  copy_num INT NOT NULL,
  acquired_on DATE NOT NULL,
  PRIMARY KEY (movie_id, copy_num),
  FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)
    ON DELETE RESTRICT
);

-- Test case:
-- INSERT INTO MovieCopy VALUES (999, 1, CURRENT_DATE);
-- should fail if Movie(999) does not exist.`,
      explanation: [
        'The primary key defines the identity of one physical copy, while the foreign key defines which parent movie values are legal.',
        'The referential action matters because deleting a parent movie would otherwise erase the meaning of copy and rental history.',
        'A technical proof includes one accepted row, one rejected orphan row, and one parent-delete scenario.',
      ],
    },
    dml: {
      title: 'Dashboard query with row and group filters',
      scenario: 'A food delivery dashboard reports one row per restaurant-month while excluding refunded orders and keeping only months whose net revenue is high enough.',
      code: `SELECT restaurant_id,
       DATE_FORMAT(delivered_at, '%Y-%m') AS month_key,
       COUNT(*) AS completed_orders,
       SUM(total - refund_amount) AS net_revenue
FROM DeliveryOrder
WHERE delivered_at IS NOT NULL
  AND refund_amount < total
GROUP BY restaurant_id, DATE_FORMAT(delivered_at, '%Y-%m')
HAVING SUM(total - refund_amount) >= 10000;`,
      explanation: [
        'WHERE removes individual rows before grouping; HAVING removes completed restaurant-month groups after aggregates exist.',
        'The result grain is restaurant-month, so every displayed nonaggregate expression must be compatible with that grain.',
        'A realistic validation uses a refunded order, a late delivered order, and a low-revenue month.',
      ],
    },
    'joins-subqueries': {
      title: 'Membership query without accidental fanout',
      scenario: 'A media service wants movies that have at least one rental but no unresolved damage report. The answer should remain one row per movie.',
      code: `SELECT m.movie_id, m.title
FROM Movie AS m
WHERE EXISTS (
  SELECT 1
  FROM RentalItem AS r
  WHERE r.movie_id = m.movie_id
)
AND NOT EXISTS (
  SELECT 1
  FROM DamageReport AS d
  WHERE d.movie_id = m.movie_id
    AND d.resolved_at IS NULL
);`,
      explanation: [
        'EXISTS and NOT EXISTS test membership while preserving the outer movie row as the answer grain.',
        'An inner join would expose rental-item detail rows and can duplicate one movie when it has many rentals.',
        'A strong test adds two rentals for the same movie and one unresolved damage row to verify both fanout and exclusion.',
      ],
    },
    'relational-algebra': {
      title: 'Algebraic expression with schema preservation',
      scenario: 'A product catalog query asks for makers of high-storage laptops. The key technical risk is projecting away model before the Product-Laptop join can use it.',
      code: `LargeLaptop := σ_{drive >= 1000}(Laptop)
Joined := Product ⋈_{Product.model = LargeLaptop.model} LargeLaptop
Answer := π_{maker}(Joined)

-- Equivalent SQL:
SELECT DISTINCT p.maker
FROM Product AS p
JOIN Laptop AS l ON l.model = p.model
WHERE l.drive >= 1000;`,
      explanation: [
        'Selection keeps the Laptop schema, so model survives for the join predicate.',
        'Projection occurs at the end because maker is the only attribute required in the final answer.',
        'A technical proof annotates the schema after each operator, not only the final result.',
      ],
    },
    views: {
      title: 'Stable reporting interface',
      scenario: 'An application repeatedly needs active rental balances but should not know every base-table status convention.',
      code: `CREATE VIEW active_rental_balance AS
SELECT c.customer_id,
       c.display_name,
       COUNT(ri.rental_item_id) AS open_items,
       SUM(ri.daily_rate) AS daily_balance
FROM Customer AS c
JOIN Rental AS r ON r.customer_id = c.customer_id
JOIN RentalItem AS ri ON ri.rental_id = r.rental_id
WHERE ri.returned_at IS NULL
GROUP BY c.customer_id, c.display_name;`,
      explanation: [
        'The view publishes one row per customer while hiding the base-table path that defines active rental items.',
        'The consumer contract includes column names, result grain, and the meaning of daily_balance.',
        'A realistic update test asks whether changing daily_balance through the view maps to one base row; here it does not.',
      ],
    },
    normalization: {
      title: 'Repairing repeated course facts',
      scenario: 'A registration table repeats instructor and room under every student-course enrollment. The table works for display but fails when a course changes room.',
      code: `EnrollmentRaw(student_id, course_id, instructor, room, grade)

FDs:
  course_id -> instructor, room
  student_id, course_id -> grade

Repair:
  Course(course_id, instructor, room)
  Enrollment(student_id, course_id, grade)`,
      explanation: [
        'The determinant course_id owns instructor and room, so repeating those facts under student_id creates update anomalies.',
        'The split is lossless because course_id is the common attribute and determines the Course side.',
        'A technical proof computes closure and checks whether the original dependencies can still be enforced after decomposition.',
      ],
    },
    'modules-triggers': {
      title: 'Inventory return workflow',
      scenario: 'A rental item return should update inventory exactly once, even if application code retries or updates other columns later.',
      code: `CREATE TRIGGER rental_item_returned
AFTER UPDATE ON RentalItem
FOR EACH ROW
BEGIN
  IF OLD.returned_at IS NULL
     AND NEW.returned_at IS NOT NULL THEN
    UPDATE Inventory
       SET available_count = available_count + 1
     WHERE movie_id = NEW.movie_id;
  END IF;
END;`,
      explanation: [
        'The trigger uses OLD and NEW values to detect the transition into returned state, not merely any update to the row.',
        'The event boundary is table-level and row-level, so multi-row updates must still be tested carefully.',
        'A realistic failure case updates returned_at twice and verifies inventory increments only once.',
      ],
    },
    'storage-indexes': {
      title: 'B+ tree access path for rental history',
      scenario: 'A customer service screen frequently loads recent rentals for one customer in date order.',
      code: `CREATE INDEX rental_customer_date
ON Rental(customer_id, rental_date);

-- Access path:
-- 1. search root for customer_id = ?
-- 2. descend to the first matching leaf entry
-- 3. scan the date range in leaf order
-- 4. fetch records if the index is not covering`,
      explanation: [
        'The equality column first narrows the tree to one customer; the range column then supports ordered scanning.',
        'The cost model counts page reads, leaf scans, and record fetches, not just returned rows.',
        'A realistic stress test inserts many recent rentals and checks leaf split and dirty-page behavior.',
      ],
    },
    jdbc: {
      title: 'Safe parameterized query path',
      scenario: 'A Java search endpoint receives user input, connects through Connector/J, binds parameters, reads rows, and closes resources.',
      code: `String sql = "SELECT title FROM Movie WHERE title LIKE ?";

try (Connection c = DriverManager.getConnection(url, user, pw);
     PreparedStatement ps = c.prepareStatement(sql)) {
  ps.setString(1, "%" + searchText + "%");
  try (ResultSet rs = ps.executeQuery()) {
    while (rs.next()) {
      System.out.println(rs.getString("title"));
    }
  }
}`,
      explanation: [
        'The placeholder turns user input into data, which blocks SQL injection through concatenated syntax.',
        'try-with-resources closes Connection, PreparedStatement, and ResultSet even if result processing throws.',
        'A realistic debug path separates driver/classpath errors, tunnel errors, authentication errors, SQL errors, and cursor logic errors.',
      ],
    },
    'capstone-studio': {
      title: 'End-to-end checkout feature',
      scenario: 'An equipment checkout system must reject impossible state, publish active checkouts, keep return inspection history, and run safely from an application endpoint.',
      code: `Feature checklist:
1. EquipmentCopy(copy_id) identifies physical copies.
2. ActiveCheckout view exposes one row per checked-out copy.
3. checkout_copy procedure writes checkout and inventory state together.
4. ReturnInspection stores audit evidence after return.
5. PreparedStatement binds user and copy identifiers.
6. Index(copy_id, returned_at) supports active lookup.`,
      explanation: [
        'The schema invariant prevents duplicate active checkouts before reports or application code rely on the data.',
        'The query contract keeps a stable result grain for callers and tests fanout explicitly.',
        'The runtime path matters because a correct schema and query are still incomplete if the endpoint concatenates SQL or leaks resources.',
      ],
    },
  }

  const selected = cases[deck.id] ?? {
    title: `${deck.title} technical case`,
    scenario: masteryNode.transferChallenge,
    code: `${title}
slide_index = ${slideIndex + 1}
proof_task = ${masteryNode.proofTask}`,
    explanation: [masteryNode.masteryTarget, masteryNode.proofTask, masteryNode.transferChallenge],
  }

  return {
    ...selected,
    code: selected.code.replace(/\bfocus\b/g, focus),
  }
}

function technicalTermsForSlide(deck: Deck, slide: Deck['slides'][number], slideIndex: number) {
  const bank = deckTechnicalTermBank[deck.id] ?? deckTechnicalTermBank.ddl
  const slideTerms: TechnicalTermItem[] = (slide.terms ?? []).map((term) => ({
    term: term.term,
    definition: term.definition,
    example: term.logic,
  }))
  const rotatedBank = bank.map((_, index) => bank[(index + slideIndex) % bank.length])
  const combined = [...slideTerms, ...rotatedBank]
  const seen = new Set<string>()
  return combined.filter((term) => {
    const key = plainText(term.term).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 6)
}

function SlideTechnicalExpansion({
  deck,
  slide,
  slideIndex,
  masteryNode,
}: {
  deck: Deck
  slide: Deck['slides'][number]
  slideIndex: number
  masteryNode: MasteryPathNode
}) {
  const terms = technicalTermsForSlide(deck, slide, slideIndex)
  const technicalCase = technicalCaseFor(deck, slide, slideIndex, masteryNode)
  const activeTerm = terms[slideIndex % Math.max(terms.length, 1)]

  return (
    <section className="slide-technical-expansion" aria-label="Technical terms, examples, and implementation notes">
      <div className="technical-expansion-head">
        <div>
          <p className="eyebrow">Technical expansion</p>
          <h4>{renderRichText(`${deck.title}: applied vocabulary and worked case`)}</h4>
        </div>
        <span>{renderRichText(activeTerm?.term ?? masteryNode.phase)}</span>
      </div>

      <div className="technical-expansion-grid">
        <article className="technical-case-card">
          <div>
            <Database size={16} aria-hidden={true} />
            <strong>{renderRichText(technicalCase.title)}</strong>
          </div>
          <p>{renderRichText(technicalCase.scenario)}</p>
          <code>{renderMathAwareCode(technicalCase.code)}</code>
        </article>

        <article className="technical-explanation-card">
          <div>
            <ShieldCheck size={16} aria-hidden={true} />
            <strong>Technical explanation</strong>
          </div>
          <ul>
            {technicalCase.explanation.map((item) => (
              <li key={item}>{renderRichText(item)}</li>
            ))}
          </ul>
        </article>

        <div className="technical-term-bank" aria-label="Slide-level technical terms">
          {terms.map((term, index) => (
            <article key={`${term.term}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{renderRichText(term.term)}</strong>
                <p>{renderRichText(term.definition)}</p>
                <small>{renderRichText(term.example)}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function SlideTermStrip({ terms }: { terms: NonNullable<Deck['slides'][number]['terms']> }) {
  return (
    <section className="slide-term-strip" aria-label="Terms and concept logic">
      <div className="slide-term-head">
        <p className="eyebrow">Terms and logic</p>
        <span>{terms.length} concepts</span>
      </div>
      <div className="slide-term-grid">
        {terms.map((term, index) => (
          <article className="slide-term-card" key={`${term.term}-${index}`}>
            <div>
              <span>{index + 1}</span>
              <strong>{renderRichText(term.term)}</strong>
            </div>
            <p>{renderRichText(term.definition)}</p>
            <small>
              <b>Logic:</b>
              {' '}
              {renderRichText(term.logic)}
            </small>
          </article>
        ))}
      </div>
    </section>
  )
}

function masteryStageCaseFor(deck: Deck, masteryNode: MasteryPathNode): TechnicalCase {
  const firstTerm = deckTechnicalTermBank[deck.id]?.[0]
  const cases: Record<string, TechnicalCase> = {
    ddl: {
      title: 'Stage case: equipment checkout schema',
      scenario: 'A lab loans cameras and sensors. Each physical copy must be identifiable, each checkout must reference a real borrower and item, and returns must remain auditable after inventory status changes.',
      code: `Equipment(copy_id PK, item_type, serial_no UNIQUE)
Borrower(borrower_id PK, email UNIQUE)
Checkout(checkout_id PK, copy_id FK, borrower_id FK, checked_out_at)
ReturnInspection(checkout_id FK, returned_at, condition_note)`,
      explanation: ['Static integrity is handled by keys and foreign keys.', 'Workflow history belongs in event/audit rows instead of destructive updates.', 'The schema is mastered when an impossible checkout can be rejected before reports or Java code run.'],
    },
    dml: {
      title: 'Stage case: store-month revenue report',
      scenario: 'A dashboard needs one row per store-month, excluding voided sales and keeping only groups with positive margin.',
      code: `SELECT store_id, month_key,
       SUM(revenue - cost) AS gross_margin
FROM sale_fact
WHERE voided_at IS NULL
GROUP BY store_id, month_key
HAVING SUM(revenue - cost) > 0;`,
      explanation: ['The proof starts by naming the output grain.', 'WHERE removes individual sale rows; HAVING removes completed store-month groups.', 'A realistic test includes a voided sale and a low-margin month.'],
    },
    'joins-subqueries': {
      title: 'Stage case: suppliers with no late shipments',
      scenario: 'Procurement wants suppliers that have shipped orders but have no unresolved late shipment records, while preserving one output row per supplier.',
      code: `SELECT s.supplier_id
FROM Supplier AS s
WHERE EXISTS (SELECT 1 FROM Shipment sh WHERE sh.supplier_id = s.supplier_id)
  AND NOT EXISTS (
    SELECT 1 FROM LateShipment l
    WHERE l.supplier_id = s.supplier_id AND l.resolved_at IS NULL
  );`,
      explanation: ['EXISTS proves membership without copying shipment rows.', 'NOT EXISTS proves absence without NULL-sensitive NOT IN behavior.', 'The result grain remains supplier, even if a supplier has many shipments.'],
    },
    'relational-algebra': {
      title: 'Stage case: self-join with rename',
      scenario: 'A product catalog needs pairs of laptops from the same maker where one has more memory than the other.',
      code: `L1 := ρ_L1(Laptop)
L2 := ρ_L2(Laptop)
Pairs := σ_{L1.maker = L2.maker AND L1.ram > L2.ram}(L1 × L2)
Answer := π_{L1.model, L2.model}(Pairs)`,
      explanation: ['Rename separates two roles played by the same relation.', 'Selection defines which tuple pairs survive.', 'Projection is delayed until both model attributes have been proven meaningful.'],
    },
    views: {
      title: 'Stage case: active rental interface',
      scenario: 'Applications need active rentals but should not duplicate the internal definition of active across every query.',
      code: `CREATE VIEW active_rental AS
SELECT rental_id, customer_id, movie_id, due_at
FROM RentalItem
WHERE returned_at IS NULL;`,
      explanation: ['The view names a reusable relation and hides internal filtering detail.', 'The contract is one row per active rental item.', 'Updatability must be tested separately from readability.'],
    },
    normalization: {
      title: 'Stage case: enrollment anomaly repair',
      scenario: 'A single enrollment table repeats course title, instructor, office, student name, and grade in every row.',
      code: `FDs:
  course_id -> course_title, instructor, office
  student_id -> student_name
  student_id, course_id -> grade

Repair:
  Course(course_id, course_title, instructor, office)
  Student(student_id, student_name)
  Enrollment(student_id, course_id, grade)`,
      explanation: ['Each fact moves to the determinant that owns it.', 'The split removes update anomalies while preserving the enrollment grade fact.', 'Lossless reconstruction is checked through shared keys.'],
    },
    'modules-triggers': {
      title: 'Stage case: checkout procedure boundary',
      scenario: 'The DBMS should create a checkout only if the copy is available, then write the event and inventory state in one transaction.',
      code: `CALL checkout_copy(:copy_id, :borrower_id);

Procedure responsibilities:
  validate availability
  insert checkout event
  update copy state
  SIGNAL if the precondition fails`,
      explanation: ['The procedure owns a multi-step operation rather than leaving every caller to coordinate writes.', 'A trigger is better only when the table event itself is the reliable boundary.', 'Failure behavior must be explicit and rollback-safe.'],
    },
    'storage-indexes': {
      title: 'Stage case: lookup and range workload',
      scenario: 'Customer support searches by customer id and then scans recent rentals in date order.',
      code: `CREATE INDEX rental_customer_date
ON Rental(customer_id, rental_date);

Expected path:
root page -> internal page -> first matching leaf -> leaf range scan`,
      explanation: ['The index prefix matches the equality predicate.', 'The second key supports the range and order within the customer partition.', 'A physical proof counts page reads and update cost.'],
    },
    jdbc: {
      title: 'Stage case: layered Java database request',
      scenario: 'A search box sends user text to Java, through Connector/J, across a tunnel, into MySQL, then iterates a result cursor.',
      code: `PreparedStatement ps =
  c.prepareStatement("SELECT title FROM Movie WHERE title LIKE ?");
ps.setString(1, "%" + text + "%");
ResultSet rs = ps.executeQuery();`,
      explanation: ['Prepared statements separate SQL structure from user data.', 'The first failure layer might be classpath, tunnel, credentials, SQL, or cursor handling.', 'try-with-resources is part of correctness because leaked resources change runtime behavior.'],
    },
    'capstone-studio': {
      title: 'Stage case: durable checkout workflow',
      scenario: 'An end-to-end checkout system must combine schema invariants, query contracts, transaction boundaries, indexes, and prepared application execution.',
      code: `Invariant: one active checkout per copy
View: active_checkout(copy_id, borrower_id, due_at)
Transaction: checkout + inventory update
Index: (copy_id, returned_at)
JDBC: PreparedStatement with bound ids`,
      explanation: ['Each layer protects a different failure mode.', 'The design is incomplete if any invariant depends only on caller discipline.', 'Capstone mastery means defending the whole path, not one isolated SQL statement.'],
    },
  }

  return cases[deck.id] ?? {
    title: `${masteryNode.phase} applied case`,
    scenario: masteryNode.transferChallenge,
    code: masteryNode.proofTask,
    explanation: [masteryNode.masteryTarget, firstTerm?.definition ?? masteryNode.proofTask, masteryNode.transferChallenge],
  }
}

function SlideMasteryContext({ deck, masteryNode }: { deck: Deck; masteryNode: MasteryPathNode }) {
  const masteryCase = masteryStageCaseFor(deck, masteryNode)
  const stageTerms = (deckTechnicalTermBank[deck.id] ?? deckTechnicalTermBank.ddl).slice(0, 4)

  return (
    <section className="slide-mastery-context" aria-label="Current mastery target">
      <div className="slide-mastery-head">
        <div>
          <p className="eyebrow">Mastery stage {masteryNode.stage} / {masteryPath.length}</p>
          <h4>{renderRichText(masteryNode.phase)}</h4>
        </div>
        <GraduationCap size={22} aria-hidden={true} />
      </div>
      <p>{renderRichText(masteryNode.masteryTarget)}</p>
      <div className="slide-mastery-grid">
        <article>
          <span>Assumes</span>
          <strong>{renderRichText(masteryNode.assumes[0])}</strong>
        </article>
        <article>
          <span>Unlocks</span>
          <strong>{renderRichText(masteryNode.unlocks[0])}</strong>
        </article>
        <article>
          <span>Prove it</span>
          <strong>{renderRichText(masteryNode.proofTask)}</strong>
        </article>
        <article>
          <span>Transfer it</span>
          <strong>{renderRichText(masteryNode.transferChallenge)}</strong>
        </article>
      </div>

      <div className="slide-mastery-example">
        <article className="mastery-case-card">
          <span>Realistic stage case</span>
          <h5>{renderRichText(masteryCase.title)}</h5>
          <p>{renderRichText(masteryCase.scenario)}</p>
          <code>{renderMathAwareCode(masteryCase.code)}</code>
        </article>

        <article className="mastery-explain-card">
          <span>Technical explanation</span>
          <ul>
            {masteryCase.explanation.map((item) => (
              <li key={item}>{renderRichText(item)}</li>
            ))}
          </ul>
        </article>

        <div className="mastery-term-row" aria-label="Mastery-stage technical terms">
          {stageTerms.map((term) => (
            <article key={term.term}>
              <strong>{renderRichText(term.term)}</strong>
              <p>{renderRichText(term.definition)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function AcademicStudyLayer({
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

function StageControls({
  current,
  total,
  isPlaying,
  playLabel,
  onTogglePlay,
  onPrevious,
  onNext,
}: {
  current: number
  total: number
  isPlaying: boolean
  playLabel: string
  onTogglePlay?: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="stage-controls" aria-label="Playback controls">
      <div className="stage-nav-pair" aria-label="Slide navigation">
        <button className="icon-button" disabled={current <= 1} onClick={onPrevious} title="Previous" type="button">
          <ArrowLeft size={19} aria-hidden={true} />
          <span>Previous</span>
        </button>
        <button className="icon-button" disabled={current >= total} onClick={onNext} title="Next" type="button">
          <span>Next</span>
          <ArrowRight size={19} aria-hidden={true} />
        </button>
      </div>
      <span className="position-pill">{current} / {total}</span>
      {onTogglePlay && (
        <button className="play-button" onClick={onTogglePlay} title={playLabel} type="button">
          {isPlaying ? <Pause size={18} aria-hidden={true} /> : <Play size={18} aria-hidden={true} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
      )}
    </div>
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
      after: [['projection', safeStep >= 2 ? 'narrower heading' : 'pending', 'same surviving tuples'], ['join', 'combined heading', 'matched tuple pairs']],
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
      after: [['split relation', safeStep >= 3 ? 'determinant isolated' : 'pending', 'redundancy reduced'], ['join back', 'common key', 'lossless proof']],
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

function DeckMechanicPanel({
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

function ConceptDiagram({ deck, slide, activeIndex }: { deck: Deck; slide: Deck['slides'][number]; activeIndex: number }) {
  return <AnimatedConceptLab deck={deck} slide={slide} activeIndex={activeIndex} />
}

function QuizStage({
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

function QuizSummaryStage({
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

function StudyCommandPalette({
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
    if (!open) return
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
          <button className="command-close" onClick={onClose} type="button" aria-label="Close study map">
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

function getPracticePrompt(deck: Deck, slideIndex: number) {
  const prompts: Record<string, string> = {
    ddl: 'Before moving on, identify which rule belongs in DDL and which rule must be handled by later workflow logic.',
    dml: 'Before moving on, state the logical clause order for this example, then name the output grain.',
    'joins-subqueries': 'Before moving on, decide whether this problem wants joined rows, set membership, exclusion, or a tie-aware comparison.',
    'relational-algebra': 'Before moving on, write the row-changing operator and the column-changing operator before translating to SQL.',
    views: 'Before moving on, name the intermediate relation a view would expose, then decide whether a direct join is simpler.',
    normalization: 'Before moving on, find the determinant, the dependent facts, and the anomaly that appears when the fact is stored at the wrong grain.',
    'modules-triggers': 'Before moving on, classify the rule as a constraint, procedure, trigger, or application responsibility.',
    'storage-indexes': 'Before moving on, classify the access path by search key, data order, density, and expected block movement.',
    jdbc: 'Before moving on, trace the runtime path from Java code to driver, tunnel, credentials, and MySQL.',
    'capstone-studio': 'Before moving on, name the invariant, the query contract, the workflow boundary, and the operational check that would catch a failure.',
  }
  return `${prompts[deck.id] ?? 'Before moving on, connect this slide to the exact concept being practiced.'} This is checkpoint ${slideIndex + 1} in the deck's reasoning path.`
}

export default App
