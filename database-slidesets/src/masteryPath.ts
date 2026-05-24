export type MasteryPathNode = {
  deckId: string
  stage: number
  phase: string
  masteryTarget: string
  assumes: string[]
  unlocks: string[]
  proofTask: string
  transferChallenge: string
}

export const masteryPath: MasteryPathNode[] = [
  {
    deckId: 'ddl',
    stage: 1,
    phase: 'Modeling foundation',
    masteryTarget: 'Turn requirements into enforceable schema contracts before any query is written.',
    assumes: [
      'You can identify entities and relationships in a short scenario.',
      'You understand that a table row should represent one stable kind of fact.',
    ],
    unlocks: [
      'Reliable query practice because table identity and relationships are explicit.',
      'A vocabulary for later deciding whether a rule belongs in a constraint, procedure, trigger, or application.',
    ],
    proofTask: 'Given a new domain, choose primary keys, foreign keys, nullability, and referential actions, then explain which workflow rules remain outside plain DDL.',
    transferChallenge: 'Design a checkout schema for equipment loans where item identity, borrower identity, current loan state, and historical audit rows cannot contradict one another.',
  },
  {
    deckId: 'dml',
    stage: 2,
    phase: 'Query construction',
    masteryTarget: 'Read SELECT as a logical pipeline that shapes rows into answers at a declared grain.',
    assumes: [
      'You can read table names, keys, and foreign keys from a schema.',
      'You can state what one row in a base table represents.',
    ],
    unlocks: [
      'Correct joins and subqueries because row filters, group filters, and output expressions are separated.',
      'A verification habit: a query must match the story, not merely run without syntax errors.',
    ],
    proofTask: 'For any prompt, name the source tables, row filters, grouping grain, aggregate expressions, and final displayed columns before writing SQL.',
    transferChallenge: 'Build a dashboard query that reports one row per store-month while excluding refunded rows and keeping only profitable groups.',
  },
  {
    deckId: 'joins-subqueries',
    stage: 3,
    phase: 'Multi-relation reasoning',
    masteryTarget: 'Choose deliberately between row-combining joins, nested set tests, anti-joins, and tie-preserving comparisons.',
    assumes: [
      'You can explain FROM, WHERE, GROUP BY, HAVING, SELECT, and ORDER BY in logical order.',
      'You can identify the intended output grain before writing a query.',
    ],
    unlocks: [
      'The ability to solve exclusion, membership, and maximum-with-ties problems without accidental row multiplication.',
      'A bridge from concrete SQL into relational algebra set reasoning.',
    ],
    proofTask: 'Given a scenario, justify whether the cleanest solution needs joined rows, a scalar subquery, an IN or EXISTS test, or an ALL comparison.',
    transferChallenge: 'Find every supplier with no late shipments while also listing suppliers tied for the highest on-time delivery rate.',
  },
  {
    deckId: 'relational-algebra',
    stage: 4,
    phase: 'Formal query logic',
    masteryTarget: 'Use algebra operators to see result shape, equivalence, and translation before SQL syntax distracts from meaning.',
    assumes: [
      'You can solve basic SELECT, join, grouping, and set-membership SQL prompts.',
      'You can describe the row and column shape of an intermediate result.',
    ],
    unlocks: [
      'Optimizer-level thinking: equivalent query forms can have the same meaning but different execution paths.',
      'Cleaner SQL because selection, projection, join, rename, and set operations are mentally separated.',
    ],
    proofTask: 'Translate a prompt into algebra, annotate the schema after each operator, then translate the final expression back into SQL.',
    transferChallenge: 'Express a self-join problem with rename, then explain exactly which attributes must survive until the final projection.',
  },
  {
    deckId: 'views',
    stage: 5,
    phase: 'Abstraction boundary',
    masteryTarget: 'Name useful query results as stable interfaces without hiding unnecessary complexity inside derived layers.',
    assumes: [
      'You can recognize repeated join, filter, and grouping patterns.',
      'You can tell whether an intermediate relation changes the grain of the result.',
    ],
    unlocks: [
      'Reusable database interfaces that support applications and reporting without exposing every base table.',
      'A disciplined distinction between helpful abstraction and decorative nesting.',
    ],
    proofTask: 'Decide whether a view is justified, name its result grain, and determine whether updates through the view are meaningful.',
    transferChallenge: 'Create a view for active rentals that hides internal status logic while preserving one row per rental item.',
  },
  {
    deckId: 'normalization',
    stage: 6,
    phase: 'Design repair',
    masteryTarget: 'Move each fact to the key that determines it while preserving reconstruction and important dependencies.',
    assumes: [
      'You can read keys and relations from a schema.',
      'You can distinguish row identity from descriptive attributes.',
    ],
    unlocks: [
      'Schema critique: you can identify redundancy, update anomalies, partial dependencies, and transitive dependencies.',
      'Principled decomposition instead of table splitting by intuition alone.',
    ],
    proofTask: 'List functional dependencies, compute candidate keys, identify anomalies, and propose a lossless decomposition with a reason.',
    transferChallenge: 'Repair a course enrollment table that repeats student names, course titles, instructor offices, and grades in one relation.',
  },
  {
    deckId: 'modules-triggers',
    stage: 7,
    phase: 'Database-side behavior',
    masteryTarget: 'Place procedural and event-driven logic where it enforces workflow without obscuring static integrity rules.',
    assumes: [
      'You can tell which rules are static constraints and which rules depend on a sequence of events.',
      'You can write or read multi-statement SQL patterns.',
    ],
    unlocks: [
      'Stored procedures for explicit database operations that read state, loop, insert, and return values.',
      'Trigger judgment: automatic reactions are powerful but must be visible, testable, and narrowly scoped.',
    ],
    proofTask: 'Classify a rule as constraint, view, procedure, trigger, or application logic, then defend the placement using failure cases.',
    transferChallenge: 'Implement an inventory operation that creates new copy rows and returns the final copy number without making every caller recompute state.',
  },
  {
    deckId: 'storage-indexes',
    stage: 8,
    phase: 'Physical execution',
    masteryTarget: 'Connect logical query needs to block movement, buffer behavior, index density, and B+-tree access paths.',
    assumes: [
      'You can describe the logical result of a query or algebra expression.',
      'You can identify the search key and expected access pattern in a workload.',
    ],
    unlocks: [
      'Cost-aware reasoning: equivalent logical answers can have very different physical costs.',
      'Index design judgment: primary, secondary, sparse, dense, hash, and B+-tree indexes serve different workloads.',
    ],
    proofTask: 'Given a file order and query workload, classify legal index choices, compute index blocks, and explain expected page movement.',
    transferChallenge: 'Choose indexes for a customer table that supports point lookup by id, range lookup by last name, and frequent inserts.',
  },
  {
    deckId: 'jdbc',
    stage: 9,
    phase: 'Application connection',
    masteryTarget: 'Trace a database request across Java code, JDBC interfaces, Connector/J, credentials, network tunnel, and MySQL.',
    assumes: [
      'You can write SQL whose result shape and side effects are understood.',
      'You can distinguish query logic errors from runtime environment errors.',
    ],
    unlocks: [
      'Safe application execution with prepared statements and callable statements.',
      'Layered debugging across classpath, driver, tunnel, authentication, permissions, and SQL behavior.',
    ],
    proofTask: 'Diagnose a failed Java database run by identifying whether the first broken layer is classpath, tunnel, credentials, SQL, or result processing.',
    transferChallenge: 'Build a small Java search routine that binds user text safely, executes a query, and prints each result row without concatenating SQL.',
  },
  {
    deckId: 'capstone-studio',
    stage: 10,
    phase: 'Integrated architecture mastery',
    masteryTarget: 'Design and defend a database-backed workflow from requirements through schema, queries, transactions, indexes, and application execution.',
    assumes: [
      'You can read requirements as row grains, keys, dependencies, query contracts, and workflow transitions.',
      'You can distinguish static constraints, reusable reads, transactional operations, physical access paths, and application runtime boundaries.',
    ],
    unlocks: [
      'Independent database project work: you can move from a domain story to a coherent, testable, runnable system design.',
      'A capstone validation habit: every design decision is checked against legal states, counterexamples, workload cost, and deployment failure modes.',
    ],
    proofTask: 'Given a new workflow, name the durable entities, event rows, audit evidence, query contracts, transactional operations, indexes, and JDBC safety checks before implementation.',
    transferChallenge: 'Design an equipment checkout workflow where invalid checkouts are rejected, active-checkout reports keep the right grain, return inspections remain auditable, and the Java endpoint binds values safely.',
  },
]

export function getMasteryNode(deckId: string) {
  return masteryPath.find((node) => node.deckId === deckId) ?? masteryPath[0]
}

export function getPreviousMasteryNode(deckId: string) {
  const index = masteryPath.findIndex((node) => node.deckId === deckId)
  return index > 0 ? masteryPath[index - 1] : undefined
}

export function getNextMasteryNode(deckId: string) {
  const index = masteryPath.findIndex((node) => node.deckId === deckId)
  return index >= 0 && index < masteryPath.length - 1 ? masteryPath[index + 1] : undefined
}
