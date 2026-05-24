export const deckVisualLabels: Record<string, string[]> = {
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

export type SubtopicPageInfo = {
  focus: string
  page: number
}

export type VisualFamily =
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

export type DeckVisualBlueprint = {
  family: VisualFamily
  artifact: string
  stages: string[]
  matrixRows: string[]
  matrixColumns: string[]
  metrics: string[]
  actions: string[]
}

export const subtopicVisualModes = ['adaptive', 'map', 'trace', 'table', 'counterexample', 'matrix', 'simulator'] as const
export type SubtopicVisualMode = (typeof subtopicVisualModes)[number]
export const fallbackSubtopicModes = subtopicVisualModes.slice(0, 3) as SubtopicVisualMode[]

export const visualModeLabels: Record<SubtopicVisualMode, string> = {
  adaptive: 'Adaptive lab',
  map: 'Concept map',
  trace: 'Trace',
  table: 'Table run',
  counterexample: 'Counterexample',
  matrix: 'Decision matrix',
  simulator: 'Simulator',
}

export const familyModeLabels: Record<VisualFamily, Partial<Record<SubtopicVisualMode, string>>> = {
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

export function visualModeLabelFor(mode: SubtopicVisualMode, family: VisualFamily) {
  return familyModeLabels[family][mode] ?? visualModeLabels[mode]
}

export const deckInteractiveBlueprints: Record<string, DeckVisualBlueprint> = {
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

export const focusNodeLibrary: Record<string, string[]> = {
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

export type ExperimentNodeKind = 'input' | 'relation' | 'operator' | 'result' | 'risk'

export type ExperimentNode = {
  label: string
  detail: string
  kind: ExperimentNodeKind
  stage: number
}

export type ExperimentRow = {
  label: string
  values: string[]
  stage: number
  verdict: string
}

export type ExperimentMetric = {
  label: string
  value: string
  stage: number
}

export type ExperimentSpec = {
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

export type VisualAtlasKind =
  | 'schema'
  | 'pipeline'
  | 'sets'
  | 'algebra'
  | 'view'
  | 'dependency'
  | 'routine'
  | 'index'
  | 'network'

export type VisualAtlasCard = {
  title: string
  caption: string
  kind: VisualAtlasKind
  labels: string[]
  checkpoints: string[]
}

export const experimentSpecs: Record<string, ExperimentSpec> = {
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

export const visualAtlasSpecs: Record<string, VisualAtlasCard[]> = {
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