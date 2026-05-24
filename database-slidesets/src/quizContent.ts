import type { Deck, QuizQuestion } from './courseData'

export type QuizType =
  | 'true-false'
  | 'multiple-choice'
  | 'interactive-visual'
  | 'interactive-click'
  | 'interactive-match-the-correct-pairing-of-the-items'

export type QuizOption = {
  text: string
  value: string
}

export type QuizVisual = {
  title: string
  kind: 'flow' | 'sets' | 'dependency' | 'storage' | 'network' | 'grouping'
  nodes: string[]
  active: number[]
  caption: string
}

type LegacyQuizQuestion = {
  setup: string
  prompt: string
  options: string[]
  answer: number
  correctExplanation: string
  optionExplanations: string[]
  visual?: QuizVisual
}

type CodeRepairQuestion = {
  setup: string
  questionText: string
  codeSnippet: string
  options: string[]
  answer: number
  correctExplanation: string
  optionExplanations: string[]
  visual?: QuizVisual
}

export type InteractiveVisualComponent = {
  type: string
  title: string
  instructions: string
  nodes: {
    value: string
    label: string
    detail: string
  }[]
  correctIndices: number[]
}

export type InteractiveMatchComponent = {
  type: string
  items: {
    id: string
    label: string
    detail: string
  }[]
  choices: QuizOption[]
  correctPairs: Record<string, string>
}

export type QuizInteractiveComponent = InteractiveVisualComponent | InteractiveMatchComponent

export type QuizExplanation = {
  correct: string
  optionsFeedback: {
    value: string
    detail: string
  }[]
  incorrectBase: string
  incorrectDetail: string[]
}

export type RichQuizQuestion = {
  quizType: QuizType
  setup: string
  questionText: string
  codeSnippet?: string
  options?: QuizOption[]
  correctAnswer: string | string[] | Record<string, string>
  interactiveComponent?: QuizInteractiveComponent
  explanation: QuizExplanation
  visual?: QuizVisual
}

const advancedQuiz: Record<string, LegacyQuizQuestion[]> = {
  ddl: [
    {
      setup: 'A lab booking system stores rooms, reservations, and invoice lines. A reservation can be cancelled, but invoice rows must remain auditable.',
      prompt: 'Which design choice keeps room and reservation references enforceable while still preserving invoice rows as historical evidence after cancellation?',
      options: [
        'Use foreign keys for room and reservation identity, then restrict deletion of invoiced reservations.',
        'Cascade every reservation deletion so invoice rows never reference old data.',
        'Store room names inside invoice lines and remove reservation keys entirely.',
        'Use an enum for invoice status and skip all relationship constraints.',
      ],
      answer: 0,
      correctExplanation: 'The key idea is that references and identity are static constraints, while audit history has survival requirements. Restricting deletion preserves invoice meaning without pretending that workflow state is just a lookup value.',
      optionExplanations: [
        'Correct. It keeps the relationship enforceable while preventing a parent deletion from erasing audit evidence.',
        'Incorrect. Cascade is appropriate only when the child fact has no independent meaning after the parent disappears.',
        'Incorrect. Copying names may help audit snapshots, but removing keys loses enforceable identity and permits contradictions.',
        'Incorrect. An enum can restrict labels, but it cannot prove that related reservation and invoice facts are coherent.',
      ],
      visual: {
        title: 'Constraint survival test',
        kind: 'flow',
        nodes: ['Room', 'Reservation', 'Invoice line', 'Deletion rule'],
        active: [0, 1, 2],
        caption: 'The invoice row is a historical fact, so the deletion action must preserve evidence rather than clean it away.',
      },
    },
    {
      setup: 'A sensor network reports readings from many devices. Each device can report once per second, and different devices report at the same second.',
      prompt: 'Which key choice identifies exactly one sensor reading when many devices can report at the same timestamp and measured values can repeat?',
      options: [
        'A composite key of device_id and reading_timestamp.',
        'A key on reading_timestamp alone.',
        'A key on temperature because it is the measured value.',
        'No key, because time-series data is append-only.',
      ],
      answer: 0,
      correctExplanation: 'The reading is identified by the device plus the instant. Timestamp alone collides across devices, and measured values are facts about the row, not identifiers for the row.',
      optionExplanations: [
        'Correct. It captures the grain: one device reading at one time.',
        'Incorrect. Multiple devices can report at the same timestamp, so this is not unique.',
        'Incorrect. Many readings can share the same temperature; the value is not identity.',
        'Incorrect. Append-only tables still need keys for deduplication, references, and reliable updates.',
      ],
      visual: {
        title: 'Grain of a reading',
        kind: 'dependency',
        nodes: ['device_id', 'timestamp', 'temperature', 'reading row'],
        active: [0, 1, 3],
        caption: 'The determinant for one reading is device plus time; temperature is dependent content.',
      },
    },
    {
      setup: 'A marketplace has Product, DigitalProduct, and PhysicalProduct tables. The Product row stores a type flag.',
      prompt: 'If subtype rows reference Product, what additional consistency rule is still missing between the Product type flag and the specific subtype table?',
      options: [
        'The DBMS may not automatically prove that exactly the matching subtype row exists for the type flag.',
        'Foreign keys stop subtype rows from sharing the same product identifier.',
        'Subtype tables cannot store attributes that Product does not store.',
        'A type flag forces every query to use a scalar subquery.',
      ],
      answer: 0,
      correctExplanation: 'The foreign key can prove that a subtype row has a parent Product, but extra logic is often needed to prove that the parent type and the subtype table agree exactly.',
      optionExplanations: [
        'Correct. This is the classic supertype-subtype enforcement gap in many SQL schemas.',
        'Incorrect. The shared key is exactly how the subtype row reuses Product identity.',
        'Incorrect. Subtype tables exist specifically to store type-specific attributes.',
        'Incorrect. Query form is a design choice; the type flag does not require scalar subqueries.',
      ],
      visual: {
        title: 'Subtype consistency',
        kind: 'sets',
        nodes: ['Product(type)', 'DigitalProduct', 'PhysicalProduct', 'consistency rule'],
        active: [0, 1, 3],
        caption: 'A parent row and a child row can exist while the type promise still needs a stronger rule.',
      },
    },
    {
      setup: 'A rental kiosk stores Copy(status) with allowed values available, rented, damaged, and missing.',
      prompt: 'Which requirement cannot be enforced by checking only the value stored in Copy.status, because it depends on related rental-event evidence?',
      options: [
        'A copy becomes rented only when an open rental line exists for that exact copy.',
        'The status text must be one of four known values.',
        'The copy number is required.',
        'The copy must reference an existing title.',
      ],
      answer: 0,
      correctExplanation: 'The transition into rented is a cross-row, time-sensitive workflow rule. A column constraint can restrict labels, but it cannot by itself prove the event history that justifies the label.',
      optionExplanations: [
        'Correct. This needs relationship and event logic, not just a domain check.',
        'Incorrect. A domain or enum constraint is well-suited for a finite set of labels.',
        'Incorrect. NOT NULL is a basic column constraint.',
        'Incorrect. A foreign key is exactly a relationship constraint for this requirement.',
      ],
      visual: {
        title: 'Static versus event rule',
        kind: 'flow',
        nodes: ['Copy row', 'Status domain', 'Open rental line', 'Workflow transition'],
        active: [0, 2, 3],
        caption: 'A valid status word is static; the reason a copy is rented depends on a related open event.',
      },
    },
  ],
  dml: [
    {
      setup: 'A food delivery dashboard reports one row per restaurant-month, excluding refunded orders and showing only groups whose net revenue exceeds a threshold.',
      prompt: 'Choose the clause placement that first removes refunded order rows before aggregation and then removes restaurant-month groups whose computed net revenue is too small.',
      options: [
        'Refunded orders in WHERE, revenue threshold in HAVING.',
        'Refunded orders in HAVING, revenue threshold in WHERE.',
        'Both in SELECT because aliases are computed there.',
        'Both in ORDER BY because the report is sorted after grouping.',
      ],
      answer: 0,
      correctExplanation: 'Refund status removes individual rows before aggregation. Net revenue is a group-level fact and can be tested only after grouping.',
      optionExplanations: [
        'Correct. It follows logical query processing: row filters first, group filters later.',
        'Incorrect. HAVING is too late for row-level exclusions, and WHERE cannot see aggregate revenue.',
        'Incorrect. SELECT names output expressions after the relation shape is determined.',
        'Incorrect. ORDER BY changes display order, not membership in the result.',
      ],
      visual: {
        title: 'Logical clause pipeline',
        kind: 'flow',
        nodes: ['FROM orders', 'WHERE refund filter', 'GROUP BY month', 'HAVING revenue'],
        active: [1, 2, 3],
        caption: 'The key decision is whether the predicate talks about a row or a group.',
      },
    },
    {
      setup: 'A query joins Customer, Ticket, and TicketComment to count support tickets by customer. Some tickets have many comments.',
      prompt: 'After joining tickets to comments, why can COUNT(*) count comment-expanded rows instead of the intended support tickets?',
      options: [
        'The join grain becomes one row per comment unless the query counts distinct tickets or aggregates first.',
        'COUNT(*) ignores rows with null comment text.',
        'Joining three tables always creates a syntax error without GROUP BY.',
        'ORDER BY changes the number of rows counted.',
      ],
      answer: 0,
      correctExplanation: 'The subtle error is grain multiplication. A ticket with five comments can become five joined rows, so counting rows no longer counts tickets.',
      optionExplanations: [
        'Correct. The query must preserve or restore the intended ticket grain.',
        'Incorrect. COUNT(*) counts rows regardless of null values in a column.',
        'Incorrect. The query can run and still be semantically wrong.',
        'Incorrect. ORDER BY sorts the final result and does not affect count membership.',
      ],
      visual: {
        title: 'Join multiplication',
        kind: 'grouping',
        nodes: ['1 ticket', '5 comments', '5 joined rows', 'wrong count'],
        active: [0, 1, 2],
        caption: 'A running query can still answer the wrong grain.',
      },
    },
    {
      setup: 'An employee table has optional manager_id. A report must list employees who do not have a manager assigned.',
      prompt: 'Which WHERE predicate correctly keeps employees whose optional manager_id is absent under SQL null semantics?',
      options: ['manager_id IS NULL', 'manager_id = NULL', 'manager_id <> manager_id', 'COUNT(manager_id) = 0 in WHERE'],
      answer: 0,
      correctExplanation: 'Null means unknown or absent, so SQL requires IS NULL. Equality comparisons with null evaluate to unknown rather than true.',
      optionExplanations: [
        'Correct. IS NULL is the intended predicate for missing values.',
        'Incorrect. Equality to NULL does not behave like equality to an ordinary value.',
        'Incorrect. This is not a meaningful way to test absence and also fails under null logic.',
        'Incorrect. COUNT is an aggregate and cannot be used this way in WHERE.',
      ],
      visual: {
        title: 'Three-valued logic',
        kind: 'sets',
        nodes: ['manager_id value', 'known id', 'null', 'IS NULL keeps row'],
        active: [0, 2, 3],
        caption: 'Null tests are not equality tests.',
      },
    },
    {
      setup: 'A report asks for one row per city, but cities with the same name can exist in different states.',
      prompt: 'Which GROUP BY columns keep same-named cities in different states from being collapsed into one output row?',
      options: [
        'Group by state and city together.',
        'Group by city only because the city name is visible.',
        'Group by postal code only even if it is not selected or requested.',
        'Do not group; use DISTINCT city after counting.',
      ],
      answer: 0,
      correctExplanation: 'The real-world entity is not a city name string alone. The state disambiguates the city for the requested output grain.',
      optionExplanations: [
        'Correct. The grouping attributes match the intended unit of one city within a state.',
        'Incorrect. Same-named cities in different states would be merged.',
        'Incorrect. Postal code may be a different and more detailed grain.',
        'Incorrect. DISTINCT after aggregation does not repair an incorrectly grouped count.',
      ],
      visual: {
        title: 'Output grain',
        kind: 'grouping',
        nodes: ['Oshkosh, WI', 'Oshkosh, another state', 'city only merge', 'state + city'],
        active: [0, 1, 3],
        caption: 'Grouping keys should describe exactly one output row.',
      },
    },
  ],
  'joins-subqueries': [
    {
      setup: 'A compliance report asks for vendors that have never submitted a safety document. The document table can contain rows with an unknown vendor_id from old imports.',
      prompt: 'Which anti-join pattern still works when the document table may contain NULL vendor_id values from old imports?',
      options: [
        'Use NOT EXISTS with a correlated equality to the vendor row.',
        'Use NOT IN over every vendor_id from the document table.',
        'Use an inner join and keep vendors with matching document rows.',
        'Use MAX(vendor_id) and compare each vendor to it.',
      ],
      answer: 0,
      correctExplanation: 'NOT EXISTS tests absence of a matching row for each vendor and avoids the global null behavior that can poison NOT IN.',
      optionExplanations: [
        'Correct. The correlation asks the precise anti-join question.',
        'Incorrect. A null inside the subquery set can make NOT IN produce no useful true comparisons.',
        'Incorrect. An inner join finds vendors that do have documents.',
        'Incorrect. The maximum identifier has no relationship to missing document coverage.',
      ],
      visual: {
        title: 'Anti-join with nulls',
        kind: 'sets',
        nodes: ['Vendors', 'Documents', 'null vendor_id', 'NOT EXISTS'],
        active: [0, 1, 3],
        caption: 'Absence should be checked per vendor, not by trusting a set that may contain null.',
      },
    },
    {
      setup: 'A streaming service wants every film tied for highest completion count this week.',
      prompt: 'Which query strategy returns every film sharing the highest completion count instead of picking one arbitrary first row?',
      options: [
        'Group by film and compare each count to all peer counts.',
        'Sort by count descending and take one row.',
        'Use DISTINCT film after joining all watch events.',
        'Compare each film title alphabetically to the maximum title.',
      ],
      answer: 0,
      correctExplanation: 'Tie preservation requires comparing the aggregate value against the full peer set or an equivalent max aggregate relation.',
      optionExplanations: [
        'Correct. Every group whose count equals the maximum survives.',
        'Incorrect. Taking one row discards legitimate co-leaders.',
        'Incorrect. DISTINCT removes duplicate film labels, not lower-count films.',
        'Incorrect. Alphabetic order is unrelated to completion count.',
      ],
      visual: {
        title: 'Tie-aware extrema',
        kind: 'grouping',
        nodes: ['Film A: 90', 'Film B: 90', 'Film C: 75', 'A and B survive'],
        active: [0, 1, 3],
        caption: 'The answer is a set of leaders, not a single row.',
      },
    },
    {
      setup: "A fraud query needs accounts whose current transaction is larger than that account's own historical average.",
      prompt: "Why does this comparison need an inner average that is recomputed for the account in the current outer transaction row?",
      options: [
        'The comparison baseline changes for each outer account.',
        'The inner query must return every column from every transaction.',
        'Correlation is required whenever a query has GROUP BY.',
        'It prevents indexes from being used, which is the goal.',
      ],
      answer: 0,
      correctExplanation: 'The inner average depends on the account in the current outer row, so the nested question is parameterized by that row.',
      optionExplanations: [
        'Correct. The outer row supplies the account-specific context.',
        'Incorrect. The inner result should usually be a scalar average, not every transaction column.',
        'Incorrect. GROUP BY can be used with or without correlation.',
        'Incorrect. Query clarity and correctness are the goal; the optimizer may still use indexes.',
      ],
      visual: {
        title: 'Per-row baseline',
        kind: 'flow',
        nodes: ['Outer transaction', 'account_id', 'inner AVG', 'compare amount'],
        active: [0, 1, 2, 3],
        caption: 'The nested query answers a different question for each outer row.',
      },
    },
    {
      setup: 'A report needs product names and supplier emails only for products with at least one late shipment.',
      prompt: 'When does the final report need an actual join because it must output supplier attributes rather than merely test that a late shipment exists?',
      options: [
        'When the final output needs columns from the related supplier row.',
        'When the related table has more rows than the product table.',
        'When the query should ignore all join predicates.',
        'When the answer must contain no attributes from any table.',
      ],
      answer: 0,
      correctExplanation: 'If the final result needs supplier attributes, the query must bring supplier rows into the answer context through a join or equivalent derived relation.',
      optionExplanations: [
        'Correct. Output requirements drive whether related columns must be joined into scope.',
        'Incorrect. Table size may affect performance, but it does not define the logical need.',
        'Incorrect. Ignoring join predicates creates row multiplication.',
        'Incorrect. A result with no attributes is not the report described.',
      ],
      visual: {
        title: 'Output drives shape',
        kind: 'flow',
        nodes: ['Product', 'Late shipment exists', 'Supplier email needed', 'join context'],
        active: [0, 2, 3],
        caption: 'Existence is enough only when you do not need related columns in the final row.',
      },
    },
  ],
  'relational-algebra': [
    {
      setup: 'An algebra expression must find makers of laptops with a large solid-state drive. Product has maker and model; Laptop has model and drive size.',
      prompt: 'Which algebra mistake removes the model attribute before Product and Laptop can be joined to recover the maker?',
      options: [
        'Projecting Laptop down to drive size before preserving model.',
        'Selecting Laptop rows by drive size before the join.',
        'Renaming attributes to avoid ambiguity.',
        'Projecting maker after the join.',
      ],
      answer: 0,
      correctExplanation: 'The join needs model. If projection removes model too early, the expression loses the bridge between Product and Laptop.',
      optionExplanations: [
        'Correct. Projection can destroy attributes that later operators require.',
        'Incorrect. Early selection is often beneficial when it keeps the schema needed for later joins.',
        'Incorrect. Rename helps disambiguate relation instances.',
        'Incorrect. Final projection is the normal way to return only requested attributes.',
      ],
      visual: {
        title: 'Projection timing',
        kind: 'flow',
        nodes: ['Laptop(model, drive)', 'select drive', 'join on model', 'project maker'],
        active: [0, 2],
        caption: 'Column reduction is safe only after future operators no longer need those columns.',
      },
    },
    {
      setup: 'Two query branches produce premium customers from invoices and preferred customers from subscriptions. One branch returns customer_id and name; the other returns only customer_id.',
      prompt: 'Before applying UNION, what must be repaired so both customer branches expose the same number of attributes with compatible meanings?',
      options: [
        'Project both branches to the same number of compatible attributes.',
        'Sort both branches by the display name.',
        'Add a foreign key between the two temporary results.',
        'Convert the union into a cartesian product.',
      ],
      answer: 0,
      correctExplanation: 'Set operators require compatible relation schemas. The branches must have the same arity and compatible domains.',
      optionExplanations: [
        'Correct. Union compatibility is about shape and domains.',
        'Incorrect. Sorting is presentation and does not fix schema mismatch.',
        'Incorrect. Foreign keys are stored constraints, not set-operator requirements.',
        'Incorrect. Cartesian product changes the meaning entirely.',
      ],
      visual: {
        title: 'Union compatibility',
        kind: 'sets',
        nodes: ['Branch A: id, name', 'Branch B: id', 'project to id', 'union'],
        active: [0, 1, 2, 3],
        caption: 'The two operands must line up before they can be stacked.',
      },
    },
    {
      setup: 'A mentorship database stores Employee(id, name, mentor_id). The question asks for pairs of employees who share the same mentor.',
      prompt: 'Why must Employee be renamed into two logical copies before comparing two different employees who share one mentor?',
      options: [
        'The same relation must appear in two roles with distinct attribute references.',
        'Rename automatically removes duplicate rows.',
        'Rename converts a relation into a view.',
        'Rename replaces selection predicates.',
      ],
      answer: 0,
      correctExplanation: 'A self-comparison needs two logical copies of Employee. Rename makes each role addressable without ambiguity.',
      optionExplanations: [
        'Correct. Self-joins require role names.',
        'Incorrect. Duplicate removal is a projection or set semantics issue, not rename itself.',
        'Incorrect. A view is a named query; rename is an algebra operator.',
        'Incorrect. Rename changes names, not row membership.',
      ],
      visual: {
        title: 'Self-join roles',
        kind: 'sets',
        nodes: ['Employee as E1', 'Employee as E2', 'same mentor_id', 'different employees'],
        active: [0, 1, 2],
        caption: 'The same base relation can play two roles in one expression.',
      },
    },
    {
      setup: 'A SQL translation of a pure algebra projection returns repeated department names.',
      prompt: 'Why can a SQL translation of pure projection return repeated department names unless duplicate elimination is made explicit?',
      options: [
        'SQL commonly preserves bags unless DISTINCT or a set operator removes duplicates.',
        'Pure relational algebra always keeps duplicate projected tuples.',
        'Projection in SQL removes rows before WHERE.',
        'SQL cannot express projection.',
      ],
      answer: 0,
      correctExplanation: 'Pure relational algebra is set-based, but SQL SELECT normally uses bag semantics. DISTINCT may be needed to match algebra.',
      optionExplanations: [
        'Correct. Duplicate behavior is a semantic difference between the models.',
        'Incorrect. Pure algebra projection removes duplicate tuples.',
        'Incorrect. WHERE is logically evaluated before SELECT projection.',
        'Incorrect. SELECT is SQL projection.',
      ],
      visual: {
        title: 'Set versus bag',
        kind: 'sets',
        nodes: ['Algebra projection', 'duplicate removed', 'SQL SELECT', 'DISTINCT needed'],
        active: [0, 1, 2, 3],
        caption: 'The same-looking expression can differ because SQL allows repeated rows.',
      },
    },
  ],
  views: [
    {
      setup: 'An analytics team repeatedly joins orders, payments, and refunds to define settled_order. Applications should not know all internal refund rules.',
      prompt: 'Which reason justifies a view because settled_order is a reusable contract that hides refund/payment rules from application queries?',
      options: [
        'It creates a stable relation-like boundary for a recurring business concept.',
        'It guarantees the query will run faster than all base-table queries.',
        'It prevents all invalid inserts into the base tables.',
        'It makes every aggregate result updatable.',
      ],
      answer: 0,
      correctExplanation: 'A view is valuable when it names a reusable relation and hides internal complexity. Performance and update behavior are separate questions.',
      optionExplanations: [
        'Correct. The view is acting as a controlled interface.',
        'Incorrect. A standard view is often a stored definition, not automatically a faster materialized result.',
        'Incorrect. Constraints protect base-table validity; a view can hide or expose columns.',
        'Incorrect. Aggregation usually weakens direct updatability.',
      ],
      visual: {
        title: 'View as interface',
        kind: 'flow',
        nodes: ['Orders', 'Payments', 'Refunds', 'settled_order view'],
        active: [0, 1, 2, 3],
        caption: 'The view names a relation that consumers can query without learning every base-table detail.',
      },
    },
    {
      setup: "A query computes each customer's lifetime spend and then joins that result to a customer segment table.",
      prompt: 'When does the FROM-clause subquery earn its place by first producing one customer-level spend row that the outer query can safely join?',
      options: [
        'When it creates the customer-level spend grain needed by the outer join.',
        'Whenever a query contains more than one table.',
        'Only when it hides every join predicate.',
        'Only when the outer query does no filtering.',
      ],
      answer: 0,
      correctExplanation: 'The derived table is useful if it produces a meaningful intermediate relation: one row per customer with lifetime spend.',
      optionExplanations: [
        'Correct. It changes the grain in a way the outer query genuinely uses.',
        'Incorrect. Many multi-table queries are clearer as direct joins.',
        'Incorrect. Hiding join predicates makes reasoning harder, not better.',
        'Incorrect. Outer filtering does not determine whether a derived table is meaningful.',
      ],
      visual: {
        title: 'Derived table grain',
        kind: 'grouping',
        nodes: ['Order rows', 'group by customer', 'spend relation', 'join segment'],
        active: [0, 1, 2, 3],
        caption: 'A subquery earns its place when it creates a named intermediate grain.',
      },
    },
    {
      setup: 'A view shows department_id and COUNT(*) employees per department.',
      prompt: 'Why can an UPDATE against a grouped department-count view not be translated to one clear base Employee row change?',
      options: [
        'One view row summarizes many base rows, so the target base row is not clear.',
        'COUNT(*) is a foreign key.',
        'Views can never be queried after creation.',
        'department_id cannot appear in a view.',
      ],
      answer: 0,
      correctExplanation: 'An update needs a clear mapping from view row to base row. Aggregation collapses many rows into one summary.',
      optionExplanations: [
        'Correct. The row mapping is many-to-one.',
        'Incorrect. COUNT(*) is an aggregate expression.',
        'Incorrect. Views are meant to be queried.',
        'Incorrect. View definitions can include department_id.',
      ],
      visual: {
        title: 'Update ambiguity',
        kind: 'grouping',
        nodes: ['Employee rows', 'group by dept', 'count row', 'no single target'],
        active: [0, 1, 2, 3],
        caption: 'Readability does not imply updatability.',
      },
    },
    {
      setup: 'A developer wraps a simple two-table join in three nested FROM subqueries, each selecting all columns.',
      prompt: 'What critique identifies that the nested subqueries add layers without creating a new grain, filter boundary, or security contract?',
      options: [
        'The layers do not add a new grain, boundary, or security decision, so they obscure the join.',
        'Every FROM subquery is illegal SQL.',
        'A direct join cannot be optimized.',
        'Selecting all columns always creates a primary key.',
      ],
      answer: 0,
      correctExplanation: 'Layers should carry meaning. If a wrapper does not name an interface or change relation shape, it can make the query harder to verify.',
      optionExplanations: [
        'Correct. The issue is not syntax; it is unnecessary abstraction.',
        'Incorrect. Derived tables are legal and often useful.',
        'Incorrect. Direct joins are normal query forms and can be optimized.',
        'Incorrect. Selecting columns does not create constraints.',
      ],
      visual: {
        title: 'Layer test',
        kind: 'flow',
        nodes: ['Base join', 'wrapper 1', 'wrapper 2', 'same grain'],
        active: [0, 3],
        caption: 'A query layer should explain something, not merely hide syntax.',
      },
    },
  ],
  normalization: [
    {
      setup: 'In relation R(A, B, C), the business rules are A determines B and B determines C. Existing rows contain A = 1, B = 7, C = 9.',
      prompt: 'Given A determines B and B determines C, which candidate row violates the existing B to C dependency for B = 7?',
      options: ['A = 2, B = 7, C = 8', 'A = 2, B = 8, C = 9', 'A = 1, B = 7, C = 9', 'A = 3, B = 10, C = 11'],
      answer: 0,
      correctExplanation: 'Because B determines C, every row with B = 7 must have C = 9. The candidate with B = 7 and C = 8 violates the dependency.',
      optionExplanations: [
        'Correct. It conflicts with the existing B -> C fact.',
        'Incorrect. It may be legal because B = 8 has no stated C value yet.',
        'Incorrect. It repeats the existing dependency-consistent values.',
        'Incorrect. New determinant values can introduce new dependent values.',
      ],
      visual: {
        title: 'Dependency consistency',
        kind: 'dependency',
        nodes: ['A -> B', 'B -> C', 'B = 7', 'C must be 9'],
        active: [1, 2, 3],
        caption: 'Dependencies are checked against the whole relation, not just inside a single row.',
      },
    },
    {
      setup: 'Enrollment(student_id, course_id, student_name, course_title, grade) has key student_id plus course_id.',
      prompt: 'Which stored fact depends only on course_id rather than the full student_id plus course_id enrollment key?',
      options: [
        'student_id determines student_name.',
        'student_id plus course_id determines grade.',
        'grade does not determine course_title.',
        'course_id and student_id together are needed for enrollment identity.',
      ],
      answer: 0,
      correctExplanation: 'student_name depends on only part of the composite key. That means the student fact is repeated across enrollments.',
      optionExplanations: [
        'Correct. A non-key attribute depends on a proper subset of the composite key.',
        'Incorrect. This is a full dependency on the whole enrollment key.',
        'Incorrect. A non-dependency does not identify the partial dependency problem.',
        'Incorrect. That describes the composite identity, not the anomaly.',
      ],
      visual: {
        title: 'Partial dependency',
        kind: 'dependency',
        nodes: ['student_id', 'course_id', 'student_name', 'grade'],
        active: [0, 2],
        caption: 'A fact should live with the key that determines it.',
      },
    },
    {
      setup: 'A warehouse table stores part_id, supplier_id, supplier_city, and part_weight. supplier_id determines supplier_city.',
      prompt: 'If supplier_city is repeated in every part-supplier row, which anomaly appears when a supplier moves to a new city?',
      options: [
        'Changing a supplier city requires many updates and can become inconsistent.',
        'The table cannot be queried with WHERE.',
        'The supplier city becomes a primary key automatically.',
        'Every part must have the same weight.',
      ],
      answer: 0,
      correctExplanation: 'The supplier city belongs at the supplier grain. Repeating it under part-supplier rows creates update anomalies.',
      optionExplanations: [
        'Correct. One real-world fact is stored many times.',
        'Incorrect. The table remains queryable; the problem is redundancy and inconsistency risk.',
        'Incorrect. Stored repetition does not create key status.',
        'Incorrect. The dependency says nothing about part_weight equality.',
      ],
      visual: {
        title: 'Update anomaly',
        kind: 'dependency',
        nodes: ['supplier_id', 'supplier_city', 'many rows', 'inconsistent update'],
        active: [0, 1, 2, 3],
        caption: 'Repeated dependent facts are the source of the anomaly.',
      },
    },
    {
      setup: 'A decomposition splits R(A, B, C) into R1(A, B) and R2(B, C). The known dependency is B determines C.',
      prompt: 'What property of the shared B attribute makes joining R1(A,B) and R2(B,C) plausibly reconstruct the original facts without spurious rows?',
      options: [
        'The shared attribute B determines all attributes on one side of the split.',
        'Both tables have exactly two columns.',
        'C is alphabetically after B.',
        'The original table had no foreign keys.',
      ],
      answer: 0,
      correctExplanation: 'A lossless join can be guaranteed when the shared attributes functionally determine one decomposed relation.',
      optionExplanations: [
        'Correct. B controls the R2 side, preventing spurious combinations when joining back.',
        'Incorrect. Column count is not the lossless criterion.',
        'Incorrect. Attribute name order is irrelevant.',
        'Incorrect. Lossless decomposition is about dependencies, not declared foreign keys alone.',
      ],
      visual: {
        title: 'Lossless split',
        kind: 'sets',
        nodes: ['R1(A,B)', 'shared B', 'R2(B,C)', 'join back'],
        active: [0, 1, 2, 3],
        caption: 'The shared determinant lets the pieces reconnect without inventing rows.',
      },
    },
  ],
  'modules-triggers': [
    {
      setup: 'A bank must reject transfers that would make an account balance negative.',
      prompt: 'Which database mechanism should enforce the no-negative-balance rule even when transfers arrive through different applications?',
      options: [
        'A database constraint or trigger close to the balance update, depending on the exact row logic.',
        'Only a UI warning in the mobile app.',
        'A view that displays positive balances.',
        'A delimiter change in the SQL client.',
      ],
      answer: 0,
      correctExplanation: 'The rule is central integrity logic. If a simple constraint can express it, prefer that; if event-aware checks are needed, a trigger may be justified.',
      optionExplanations: [
        'Correct. The rule must live where all write paths are controlled.',
        'Incorrect. UI validation can be bypassed by another application or script.',
        'Incorrect. A view can hide invalid rows but does not prevent them.',
        'Incorrect. Delimiters only affect client parsing of stored module definitions.',
      ],
      visual: {
        title: 'Rule placement',
        kind: 'flow',
        nodes: ['Update request', 'integrity check', 'balance row', 'reject or commit'],
        active: [0, 1, 2, 3],
        caption: 'Critical invariants should not depend on one front end behaving correctly.',
      },
    },
    {
      setup: 'A procedure creates warehouse bins and returns the highest bin number it inserted.',
      prompt: 'Why should the procedure return the final inserted bin number through an OUT parameter instead of making the caller query MAX later?',
      options: [
        'The procedure already owns the insertion sequence and can report the exact final value.',
        'OUT parameters automatically create indexes.',
        'OUT parameters prevent the procedure from reading tables.',
        'The caller cannot read any SQL variables.',
      ],
      answer: 0,
      correctExplanation: 'The procedure is the unit that reads current state, inserts rows, and knows the final number. Returning it avoids duplicated and potentially stale logic.',
      optionExplanations: [
        'Correct. The output belongs to the workflow that computed it.',
        'Incorrect. Parameters do not create physical access paths.',
        'Incorrect. Procedures can read and write tables.',
        'Incorrect. Callers can read variables, but the procedure should return the authoritative result.',
      ],
      visual: {
        title: 'Procedure result boundary',
        kind: 'flow',
        nodes: ['CALL', 'read max', 'loop inserts', 'OUT final number'],
        active: [0, 1, 2, 3],
        caption: 'The result crosses the procedure boundary intentionally.',
      },
    },
    {
      setup: 'An inventory trigger automatically writes an audit row whenever quantity changes.',
      prompt: 'What risk matters most when an inventory trigger writes audit rows automatically after quantity changes?',
      options: [
        'The side effect can be invisible to developers unless it is documented and tested.',
        'Triggers cannot read old and new values.',
        'Triggers are the same as primary keys.',
        'A trigger can run only from Java, not from SQL.',
      ],
      answer: 0,
      correctExplanation: 'Automatic behavior is powerful because every write path invokes it, but that also makes hidden effects harder to reason about.',
      optionExplanations: [
        'Correct. Hidden side effects are a maintainability and testing risk.',
        'Incorrect. Many trigger systems expose old and new row values.',
        'Incorrect. A trigger is procedural event logic; a primary key is identity.',
        'Incorrect. Triggers fire from table events regardless of which client caused them.',
      ],
      visual: {
        title: 'Event side effect',
        kind: 'flow',
        nodes: ['UPDATE quantity', 'trigger fires', 'audit row', 'developer awareness'],
        active: [0, 1, 2, 3],
        caption: 'Automatic does not mean obvious.',
      },
    },
    {
      setup: 'A MySQL client stops reading a procedure definition at the first semicolon inside the body.',
      prompt: 'What problem does DELIMITER solve when defining a procedure body that contains internal semicolons?',
      options: [
        'It changes the client-side statement terminator so the whole procedure is sent together.',
        'It changes how foreign keys are enforced.',
        'It makes loops execute in parallel.',
        'It encrypts the stored procedure body.',
      ],
      answer: 0,
      correctExplanation: 'The delimiter is a client parsing device. It does not change the logical semantics of the procedure.',
      optionExplanations: [
        'Correct. The client needs a temporary terminator that does not conflict with internal semicolons.',
        'Incorrect. Foreign key enforcement is unrelated to delimiters.',
        'Incorrect. Loop execution semantics do not change.',
        'Incorrect. Delimiters provide no encryption.',
      ],
      visual: {
        title: 'Client parser boundary',
        kind: 'flow',
        nodes: ['Procedure text', 'internal semicolons', 'temporary delimiter', 'single definition'],
        active: [0, 1, 2, 3],
        caption: 'The delimiter protects the statement boundary while defining the procedure.',
      },
    },
  ],
  'storage-indexes': [
    {
      setup: 'A customer file is physically ordered by customer_id. An engineer proposes a sparse index on last_name.',
      prompt: 'Why is a sparse index on last_name unsafe when the data file is physically ordered by customer_id instead of last_name?',
      options: [
        'Sparse entries on last_name cannot guide local scans unless the data file is ordered by last_name.',
        'Sparse indexes require every record to have an index entry.',
        'last_name is too textual to appear in any index.',
        'A sparse index always deletes the data file order.',
      ],
      answer: 0,
      correctExplanation: 'Sparse indexes skip many key values, so the data between anchors must be predictably ordered on the search key.',
      optionExplanations: [
        'Correct. The skipped last names could be anywhere in a file ordered by customer_id.',
        'Incorrect. That describes a dense index more closely.',
        'Incorrect. Text attributes can be indexed.',
        'Incorrect. An index does not delete the data file order.',
      ],
      visual: {
        title: 'Sparse index legality',
        kind: 'storage',
        nodes: ['file ordered by id', 'search by last_name', 'missing anchors', 'unsafe scan'],
        active: [0, 1, 2, 3],
        caption: 'Sparse works only when the anchor tells you where nearby search-key values live.',
      },
    },
    {
      setup: 'A buffer pool is full. Frame P is dirty but unpinned; frame Q is clean but pinned; frame R is clean and unpinned.',
      prompt: 'Which frame can be evicted with the least disruption because it is both unpinned and clean?',
      options: ['Frame R', 'Frame Q', 'Frame P without writing it', 'Any frame, because pinning is only a display label'],
      answer: 0,
      correctExplanation: 'A clean unpinned frame can be evicted without waiting for a client or writing changes back to disk.',
      optionExplanations: [
        'Correct. It is available and cheap to evict.',
        'Incorrect. Pinned frames are currently in use and should not be evicted.',
        'Incorrect. Dirty frames require write-back before eviction.',
        'Incorrect. Pinning is a real buffer-management state.',
      ],
      visual: {
        title: 'Eviction decision',
        kind: 'storage',
        nodes: ['dirty unpinned P', 'clean pinned Q', 'clean unpinned R', 'evict R'],
        active: [0, 1, 2, 3],
        caption: 'Replacement policy must consider both use state and write-back cost.',
      },
    },
    {
      setup: 'A dense secondary index has 13 record entries. Each index block holds 5 entries.',
      prompt: 'How many index blocks are needed when 13 dense secondary-index entries are packed 5 entries per block, counting the partially filled final block?',
      options: ['3', '2', '5', '13'],
      answer: 0,
      correctExplanation: 'Dense means one entry per record. Ceiling of 13 divided by 5 is 3 because the final partially filled block still exists.',
      optionExplanations: [
        'Correct. Two full blocks hold 10 entries and a third holds the remaining 3.',
        'Incorrect. Two blocks can hold only 10 entries.',
        'Incorrect. Five is the capacity per block, not the block count.',
        'Incorrect. Thirteen is the number of entries, not blocks.',
      ],
      visual: {
        title: 'Index block math',
        kind: 'storage',
        nodes: ['13 entries', '5 per block', 'ceil division', '3 blocks'],
        active: [0, 1, 2, 3],
        caption: 'Block counts use ceiling division.',
      },
    },
    {
      setup: 'A workload often asks for all orders between two dates and also inserts new orders continuously.',
      prompt: 'Why does a B+-tree fit a date-range workload with ongoing inserts better than a hash index built mainly for equality lookup?',
      options: [
        'Its leaves preserve key order, supporting range scans while staying balanced under updates.',
        'It stores every table row directly in the root node.',
        'It makes all updates free.',
        'It works only when the table has no primary key.',
      ],
      answer: 0,
      correctExplanation: 'Hashing is strong for equality lookup, but ordered leaves make B+-trees natural for ranges and incremental maintenance.',
      optionExplanations: [
        'Correct. Ordered leaf traversal is the decisive advantage for range predicates.',
        'Incorrect. B+-trees use multiple levels; the root guides search.',
        'Incorrect. Updates have costs such as splits, but the structure remains balanced.',
        'Incorrect. B+-trees can support primary or secondary access paths.',
      ],
      visual: {
        title: 'Range access path',
        kind: 'storage',
        nodes: ['root', 'internal ranges', 'linked leaves', 'date range scan'],
        active: [0, 1, 2, 3],
        caption: 'Linked ordered leaves turn a range query into a short seek plus sequential movement.',
      },
    },
  ],
  jdbc: [
    {
      setup: 'A Java database app fails before it reaches the server. The error says the MySQL driver class cannot be loaded.',
      prompt: 'Which runtime layer should be checked first when the Java program fails before any server connection because the MySQL driver class cannot load?',
      options: ['Classpath and Connector/J dependency', 'SQL GROUP BY logic', 'B+-tree leaf splits', 'Foreign key cascade action'],
      answer: 0,
      correctExplanation: 'Driver loading happens before authentication, tunneling, or SQL execution. The failure points to the Java runtime classpath.',
      optionExplanations: [
        "Correct. The program cannot use JDBC's MySQL implementation if the jar is not visible.",
        'Incorrect. SQL logic is not reached yet.',
        'Incorrect. Index internals are irrelevant to loading a driver class.',
        'Incorrect. DDL constraints are not involved in this runtime failure.',
      ],
      visual: {
        title: 'Connection failure layer',
        kind: 'network',
        nodes: ['Java app', 'driver jar', 'tunnel', 'MySQL session'],
        active: [0, 1],
        caption: 'Debug from the failing layer outward.',
      },
    },
    {
      setup: 'A search box lets users type part of a movie title. The program currently concatenates the text into SQL.',
      prompt: 'Why does a PreparedStatement fix the SQL-concatenation problem by keeping the query program fixed while binding search text as a value?',
      options: [
        'It keeps SQL structure fixed while binding user text as a value.',
        'It automatically creates a dense index on title.',
        'It removes the need for a database connection.',
        'It turns every SELECT into a stored procedure.',
      ],
      answer: 0,
      correctExplanation: 'Prepared statements separate code from data. The driver binds the user text without treating it as SQL syntax.',
      optionExplanations: [
        'Correct. This protects both correctness and safety.',
        'Incorrect. Index design is separate from parameter binding.',
        'Incorrect. The statement still runs through a connection.',
        'Incorrect. Prepared statements and stored procedures are different mechanisms.',
      ],
      visual: {
        title: 'Binding boundary',
        kind: 'flow',
        nodes: ['SQL template', 'placeholder', 'user value', 'execute safely'],
        active: [0, 1, 2, 3],
        caption: 'The input fills a value slot; it does not rewrite the SQL program.',
      },
    },
    {
      setup: 'A tunnel maps local port 3306 to a remote MySQL service through SSH.',
      prompt: 'In a JDBC URL used with SSH tunneling, what endpoint does localhost:3306 name from the Java process point of view?',
      options: [
        'The local tunnel endpoint, not necessarily the machine where MySQL physically runs.',
        'The database server is embedded inside the Java process.',
        'The query will run without credentials.',
        'The URL is naming a table rather than a network endpoint.',
      ],
      answer: 0,
      correctExplanation: 'The Java app connects locally, and SSH forwards the traffic to the remote database path.',
      optionExplanations: [
        'Correct. localhost is the entry point into the tunnel.',
        'Incorrect. MySQL is still a separate server process.',
        'Incorrect. Network reachability does not replace authentication.',
        'Incorrect. A JDBC URL names a connection target.',
      ],
      visual: {
        title: 'Tunnel path',
        kind: 'network',
        nodes: ['Java localhost:3306', 'SSH tunnel', 'remote host', 'MySQL'],
        active: [0, 1, 2, 3],
        caption: 'The local endpoint is a doorway to a remote service.',
      },
    },
    {
      setup: 'A Java app must call a database routine that creates rows and returns the final generated number.',
      prompt: 'Which JDBC object is intended for calling a stored routine with IN parameters and an OUT value returned to Java?',
      options: ['CallableStatement', 'ResultSet alone', 'A plain enum value', 'A sparse index'],
      answer: 0,
      correctExplanation: 'CallableStatement is designed for stored procedure calls, including parameters that return values.',
      optionExplanations: [
        'Correct. It is the JDBC abstraction for calling stored modules.',
        'Incorrect. A ResultSet reads query rows; it does not initiate the procedure call by itself.',
        'Incorrect. An enum constrains values in a schema, not Java procedure calls.',
        'Incorrect. An index is a storage access path.',
      ],
      visual: {
        title: 'Callable boundary',
        kind: 'flow',
        nodes: ['Java call', 'IN parameter', 'procedure body', 'OUT value'],
        active: [0, 1, 2, 3],
        caption: 'The call crosses from application code into stored database logic.',
      },
    },
  ],
  'capstone-studio': [
    {
      setup: 'An equipment checkout system stores EquipmentItem, Checkout, ReturnInspection, FeeAssessment, and Payment. A damaged return can later be waived by a supervisor.',
      prompt: 'Which design keeps damaged-return evidence, fee assessment, and later waiver decisions queryable as separate historical facts?',
      options: [
        'Keep ReturnInspection and FeeAssessment as event or audit rows tied to the checkout, even if the fee is waived later.',
        'Overwrite EquipmentItem.status with the final supervisor decision and delete the fee row.',
        'Store the damage reason only in the borrower name field to avoid another table.',
        'Use a view to hide all damaged returns so reports never see them.',
      ],
      answer: 0,
      correctExplanation: 'Auditability requires preserving the evidence chain. Waiving a fee changes the financial outcome, but it should not erase the inspection event or the fact that a fee was assessed.',
      optionExplanations: [
        'Correct. The design separates event evidence from the later business decision about payment or waiver.',
        'Incorrect. A mutable item status cannot explain who inspected the item, what was observed, and why a later waiver occurred.',
        'Incorrect. Borrower identity and damage evidence have different row meanings; mixing them destroys both constraints and audit clarity.',
        'Incorrect. A view can filter display, but hiding evidence is not the same as preserving an auditable workflow.',
      ],
      visual: {
        title: 'Audit chain',
        kind: 'flow',
        nodes: ['Checkout', 'Inspection', 'FeeAssessment', 'Waiver decision'],
        active: [0, 1, 2, 3],
        caption: 'The financial outcome can change while the evidence chain remains queryable.',
      },
    },
    {
      setup: 'A dashboard endpoint should show one row per item type with counts of available, checked-out, and overdue items. A developer joins item rows directly to all checkout history.',
      prompt: 'Before trusting item-type dashboard counts, what join-grain risk must be checked when item rows are joined directly to checkout history?',
      options: [
        'Historical checkout rows can multiply item rows unless the query first isolates current or active checkout state.',
        'Joining always collapses history into one current row per item automatically.',
        'GROUP BY item_type makes every fanout harmless by definition.',
        'ORDER BY item_type runs before the join and prevents duplicated counts.',
      ],
      answer: 0,
      correctExplanation: 'The dashboard contract is one row per item type, but checkout history has event grain. The query must reduce history to the active or relevant state before counting items.',
      optionExplanations: [
        'Correct. This identifies the grain mismatch between item identity and checkout history events.',
        'Incorrect. Joins preserve matching combinations; they do not infer which historical row is current.',
        'Incorrect. GROUP BY can aggregate inflated input just as easily as correct input.',
        'Incorrect. ORDER BY is presentation after the logical result has already been formed.',
      ],
      visual: {
        title: 'Dashboard grain mismatch',
        kind: 'grouping',
        nodes: ['Item row', 'History events', 'Active state filter', 'Item-type count'],
        active: [0, 1, 2, 3],
        caption: 'The contract must reduce event history before exposing inventory counts.',
      },
    },
    {
      setup: 'A checkout operation inserts a Checkout row and updates EquipmentItem.status. The insert succeeds, but the update affects zero rows because the item is no longer available.',
      prompt: 'If the guarded item-status update affects zero rows after the checkout insert, what transaction behavior keeps the checkout workflow legal?',
      options: [
        'Rollback the checkout insert and report that the item failed the availability precondition.',
        'Keep the checkout row anyway because an insert already succeeded.',
        'Set every item to available so the update can succeed next time.',
        'Disable the foreign key from Checkout to EquipmentItem during busy periods.',
      ],
      answer: 0,
      correctExplanation: 'The invariant is that an open checkout implies a matching item state. If the guarded update fails, the transaction must not leave an orphaned workflow event.',
      optionExplanations: [
        'Correct. The operation fails atomically and leaves the database in the previous legal state.',
        'Incorrect. A successful insert alone is not a successful checkout workflow.',
        'Incorrect. Broadly changing item states destroys the meaning of every other workflow.',
        'Incorrect. Foreign keys protect identity; disabling them weakens the system and does not solve availability.',
      ],
      visual: {
        title: 'Atomic checkout',
        kind: 'flow',
        nodes: ['Precondition', 'Insert event', 'Update item', 'Commit or rollback'],
        active: [0, 1, 2, 3],
        caption: 'The operation is correct only if all required state changes survive together.',
      },
    },
    {
      setup: 'A Java endpoint searches active checkouts by borrower email and due date. Both values come from user input.',
      prompt: 'Which implementation boundary protects both user-supplied email/date values and JDBC resource lifetime before the endpoint is deployed?',
      options: [
        'Use a PreparedStatement with placeholders for the email and date values, and close resources with try-with-resources.',
        'Concatenate the email into SQL but use an index for the due date.',
        'Bind the table name with a placeholder so users can choose any table.',
        'Use ResultSet before executing the query so the driver validates input early.',
      ],
      answer: 0,
      correctExplanation: 'PreparedStatement protects the SQL structure from user values, and try-with-resources gives the endpoint a deterministic resource lifetime.',
      optionExplanations: [
        'Correct. It addresses both input safety and runtime cleanup.',
        'Incorrect. An index can help performance but does not make string-concatenated input safe.',
        'Incorrect. Placeholders bind values, not identifiers or SQL structure.',
        'Incorrect. A ResultSet exists after execution; it cannot validate a query before the statement runs.',
      ],
      visual: {
        title: 'Endpoint safety',
        kind: 'network',
        nodes: ['Request values', 'PreparedStatement', 'DBMS execution', 'Closed resources'],
        active: [0, 1, 2, 3],
        caption: 'Deployment quality includes both safe SQL construction and predictable cleanup.',
      },
    },
  ],
}

const optionValues = ['option-a', 'option-b', 'option-c', 'option-d']
const targetQuizCountPerDeck = 20

const quizTypeCycle: QuizType[] = [
  'multiple-choice',
  'true-false',
  'interactive-click',
  'interactive-match-the-correct-pairing-of-the-items',
]

const visualPrimaryDecks = new Set(['relational-algebra', 'normalization', 'storage-indexes', 'jdbc'])

const codeRepairQuestions: Record<string, CodeRepairQuestion> = {
  ddl: {
    setup:
      'A schema designer wants physical copy numbers to restart inside each movie while barcode remains globally unique. The table below runs, but its identity rule is incomplete.',
    questionText:
      'Which table edit lets copy numbers restart for each movie while still preventing duplicate copies of the same movie and duplicate barcodes?',
    codeSnippet:
      '<span class="keyword">CREATE TABLE</span> MovieCopy (\n' +
      '  movie_id <span class="type">INT</span> <span class="keyword">NOT NULL</span>,\n' +
      '  copy_num <span class="type">INT</span> <span class="keyword">NOT NULL</span>,\n' +
      '  barcode <span class="type">VARCHAR</span>(<span class="number">32</span>) <span class="keyword">NOT NULL</span>,\n' +
      '  status <span class="type">VARCHAR</span>(<span class="number">12</span>) <span class="keyword">DEFAULT</span> <span class="string">\'WORKING\'</span>\n' +
      '  <span class="comment">-- line to repair goes here</span>\n' +
      ');',
    options: [
      'Insert <code>PRIMARY KEY (movie_id, copy_num), UNIQUE (barcode)</code> before the closing parenthesis.',
      'Insert <code>PRIMARY KEY (copy_num)</code> because copy numbers look like identifiers.',
      'Insert <code>UNIQUE (status)</code> because each status value should be controlled.',
      'Leave the table without a key and rely on application code to avoid duplicates.',
    ],
    answer: 0,
    correctExplanation:
      'The physical copy is identified by the pair movie_id and copy_num, while barcode is a separate alternate business key. This permits copy_num 1 to exist under many movies without permitting two copies of the same movie to share a copy number.',
    optionExplanations: [
      'Correct. The composite primary key matches the intended row grain, and the unique barcode rule captures a different uniqueness fact without confusing the two.',
      'Incorrect. A primary key on copy_num alone makes copy numbers globally unique, which rejects legal data when every movie can have copy number 1.',
      'Incorrect. Status is a domain or workflow value, not identity. Making it unique would allow only one working copy in the entire table.',
      'Incorrect. Application checks can be bypassed by other clients, imports, or later maintenance scripts. Identity belongs in the schema when it is a durable invariant.',
    ],
    visual: {
      title: 'Composite identity repair',
      kind: 'dependency',
      nodes: ['movie_id', 'copy_num', 'barcode', 'copy row'],
      active: [0, 1, 3],
      caption: 'The row is identified by the parent movie plus local copy number; barcode is a separate unique access value.',
    },
  },
  dml: {
    setup:
      'A reporting query should return restaurant-month groups whose non-refunded revenue is above 10000. The draft mixes row filtering with group filtering.',
    questionText:
      'Which edit keeps the row-level refund predicate in WHERE and moves the aggregate revenue predicate to the stage where SUM(net_amount) exists?',
    codeSnippet:
      '<span class="keyword">SELECT</span> restaurant_id, month, <span class="function">SUM</span>(net_amount) <span class="keyword">AS</span> revenue\n' +
      '<span class="keyword">FROM</span> Orders\n' +
      '<span class="keyword">WHERE</span> refunded = <span class="number">0</span>\n' +
      '  <span class="keyword">AND</span> <span class="function">SUM</span>(net_amount) &gt; <span class="number">10000</span>\n' +
      '<span class="keyword">GROUP BY</span> restaurant_id, month;',
    options: [
      'Move <code>SUM(net_amount) &gt; 10000</code> into a <code>HAVING</code> clause after <code>GROUP BY</code>.',
      'Move <code>refunded = 0</code> into <code>HAVING</code> and leave the aggregate in <code>WHERE</code>.',
      'Remove <code>GROUP BY</code> so the aggregate can be used in <code>WHERE</code>.',
      'Add <code>DISTINCT</code> to the select list so duplicate orders do not affect the aggregate.',
    ],
    answer: 0,
    correctExplanation:
      'WHERE decides which individual order rows enter the grouped input. HAVING is the correct place to test SUM because aggregate values exist only after GROUP BY has formed restaurant-month groups.',
    optionExplanations: [
      'Correct. The row-level predicate remains in WHERE, and the aggregate predicate moves to the stage where the aggregate is defined.',
      'Incorrect. refunded is a row-level condition and should usually be applied before grouping so refunded rows never enter the sum.',
      'Incorrect. Removing GROUP BY collapses the requested restaurant-month grain into a single total and changes the question.',
      'Incorrect. DISTINCT does not repair logical processing order and may incorrectly discard legitimate same-valued order rows.',
    ],
    visual: {
      title: 'Clause-order repair',
      kind: 'flow',
      nodes: ['FROM rows', 'WHERE refunded', 'GROUP BY month', 'HAVING revenue'],
      active: [1, 2, 3],
      caption: 'Rows are filtered before grouping; aggregate groups are filtered after grouping.',
    },
  },
  'joins-subqueries': {
    setup:
      'A vendor audit query should return vendors with no uploaded safety document. The draft accidentally asks whether the whole SafetyDocument table is empty.',
    questionText:
      'Which missing correlation line makes <code>NOT EXISTS</code> ask whether this outer vendor lacks a matching safety document?',
    codeSnippet:
      '<span class="keyword">SELECT</span> v.vendor_id, v.vendor_name\n' +
      '<span class="keyword">FROM</span> Vendor <span class="keyword">AS</span> v\n' +
      '<span class="keyword">WHERE NOT EXISTS</span> (\n' +
      '  <span class="keyword">SELECT</span> <span class="number">1</span>\n' +
      '  <span class="keyword">FROM</span> SafetyDocument <span class="keyword">AS</span> d\n' +
      '  <span class="comment">-- missing correlation line</span>\n' +
      ');',
    options: [
      'Insert <code>WHERE d.vendor_id = v.vendor_id</code> inside the subquery.',
      'Insert <code>ORDER BY d.uploaded_at DESC</code> inside the subquery.',
      'Insert <code>GROUP BY v.vendor_id</code> inside the subquery.',
      'Insert <code>WHERE v.vendor_id IS NOT NULL</code> outside the subquery.',
    ],
    answer: 0,
    correctExplanation:
      'The subquery must be correlated to the current outer vendor. Without the equality between d.vendor_id and v.vendor_id, NOT EXISTS tests the existence of any document anywhere, not whether this vendor has one.',
    optionExplanations: [
      'Correct. The correlation predicate turns the subquery into a vendor-specific membership test and makes the anti-join meaningful.',
      'Incorrect. Sorting rows inside EXISTS does not change whether a matching row exists.',
      'Incorrect. Grouping by the outer alias inside the subquery does not create the required row-pair comparison.',
      'Incorrect. The outer vendor id being non-null does not prove that a matching document is absent or present.',
    ],
    visual: {
      title: 'Anti-join correlation',
      kind: 'sets',
      nodes: ['outer vendor', 'document table', 'vendor_id equality', 'absent match'],
      active: [0, 2, 3],
      caption: 'The missing equality creates the connection between the candidate vendor and matching document rows.',
    },
  },
  'relational-algebra': {
    setup:
      'An algebra translation should find makers of laptops with at least 1000 GB of storage. A student projected too early and removed the join key.',
    questionText:
      'Which rewrite keeps <code>model</code> available long enough to join Product to the filtered Laptop relation, then projects <code>maker</code> afterward?',
    codeSnippet:
      'Draft:\n' +
      'L1 := <span class="ra-op">&pi;</span><sub class="ra-sub">model</sub>(<span class="ra-op">&sigma;</span><sub class="ra-sub">hd &ge; <span class="number">1000</span></sub>(Laptop))\n' +
      'P1 := <span class="ra-op">&pi;</span><sub class="ra-sub">maker</sub>(Product)\n' +
      'Answer := P1 <span class="ra-join">&#8904;</span><sub class="ra-sub">?</sub> L1',
    options: [
      'Join Product to the filtered Laptop relation while <code>model</code> is still present, then project <code>maker</code>.',
      'Project <code>maker</code> from Product first because the final answer only needs maker.',
      'Rename Laptop to Product so both relations have the same attributes before joining.',
      'Use union between Product and Laptop because both relations mention models.',
    ],
    answer: 0,
    correctExplanation:
      'The join needs Product.model and Laptop.model. Projection is safe only after it preserves every attribute required by later predicates, so maker should be projected after the model-based join.',
    optionExplanations: [
      'Correct. This keeps the join key alive through the join and shrinks the result only after the qualifying products have been identified.',
      'Incorrect. Projecting maker alone removes Product.model, so the expression can no longer connect product rows to laptop rows.',
      'Incorrect. Rename changes attribute names or relation aliases; it does not make unrelated schemas semantically identical.',
      'Incorrect. Union requires compatible schemas and combines rows; it does not connect maker facts to laptop specifications.',
    ],
    visual: {
      title: 'Algebra key preservation',
      kind: 'flow',
      nodes: ['select Laptop', 'keep model', 'join Product', 'project maker'],
      active: [0, 1, 2, 3],
      caption: 'Projection is delayed until the join has consumed the model key.',
    },
  },
  views: {
    setup:
      'A public reporting view should expose one row per active customer city, with rental counts, while hiding private customer columns. The draft leaks too much detail.',
    questionText:
      'Which replacement defines the view as a deliberate public contract: city-level rows, explicit public columns, and hidden customer details?',
    codeSnippet:
      '<span class="keyword">CREATE VIEW</span> customer_activity <span class="keyword">AS</span>\n' +
      '<span class="keyword">SELECT</span> *\n' +
      '<span class="keyword">FROM</span> Customer c\n' +
      '<span class="keyword">JOIN</span> Rental r <span class="keyword">ON</span> r.customer_id = c.customer_id;',
    options: [
      'Select explicit public columns such as <code>city</code> and <code>COUNT(*) AS rentals</code>, filter active customers, and <code>GROUP BY city</code>.',
      'Keep <code>SELECT *</code> so new private columns automatically appear in the view.',
      'Add <code>ORDER BY email</code> inside the view to make private data easier to inspect.',
      'Rename the view only; the exposed columns do not affect the contract.',
    ],
    answer: 0,
    correctExplanation:
      'A view contract should define the public row grain and column boundary. Explicit grouping by city publishes city-level activity while avoiding accidental exposure of email, phone, or internal customer attributes.',
    optionExplanations: [
      'Correct. The edit names the output grain, computes the intended measure, and avoids leaking base-table columns.',
      'Incorrect. SELECT star is especially risky in views because future base-table columns can become public without review.',
      'Incorrect. Ordering does not hide data and should not be used as an exposure control.',
      'Incorrect. A view name is not enough; the selected columns and row grain are the interface that consumers depend on.',
    ],
    visual: {
      title: 'View contract repair',
      kind: 'flow',
      nodes: ['base detail rows', 'public columns', 'city grain', 'report interface'],
      active: [1, 2, 3],
      caption: 'The view should publish a deliberate relation shape, not every base-table detail.',
    },
  },
  normalization: {
    setup:
      'A registration table stores course facts repeatedly. The domain rule says one course_id has exactly one instructor and room for the term.',
    questionText:
      'Which decomposition stores instructor and room once per course_id while keeping student-course enrollment as a separate relationship?',
    codeSnippet:
      'Registration(student_id, course_id, instructor, room)\n' +
      'Functional dependency: course_id <span class="operator">-&gt;</span> instructor, room\n' +
      'Candidate key for registration rows: student_id, course_id',
    options: [
      'Create <code>Course(course_id, instructor, room)</code> and <code>Registration(student_id, course_id)</code>.',
      'Create <code>Student(student_id, instructor)</code> and <code>Room(room, course_id)</code>.',
      'Keep one table and add <code>DISTINCT</code> to every query.',
      'Split into <code>Registration(student_id, instructor)</code> and <code>RegistrationRoom(student_id, room)</code>.',
    ],
    answer: 0,
    correctExplanation:
      'The dependency says course_id owns instructor and room. Putting those course-level facts in a Course relation and keeping student-course enrollment separately removes repetition while retaining course_id as the shared join attribute.',
    optionExplanations: [
      'Correct. The split places each fact under the determinant that controls it and joins back through course_id.',
      'Incorrect. instructor is not determined by student_id in the given rule, so this split invents a dependency the domain did not state.',
      'Incorrect. DISTINCT can hide repeated output rows, but it does not repair update, insert, or delete anomalies in storage.',
      'Incorrect. Splitting by student_id loses the course determinant and can create spurious combinations when joined back.',
    ],
    visual: {
      title: 'Dependency-owned facts',
      kind: 'dependency',
      nodes: ['course_id', 'instructor', 'room', 'enrollment row'],
      active: [0, 1, 2],
      caption: 'Course-level facts belong with course_id, not repeated under every student-course row.',
    },
  },
  'modules-triggers': {
    setup:
      'A procedure inserts several movie-copy rows and should return the last copy number through an OUT parameter. The loop inserts rows but the caller receives NULL.',
    questionText:
      'Which assignment copies the procedure loop state into the OUT parameter so the caller receives the final inserted copy number?',
    codeSnippet:
      '<span class="keyword">CREATE PROCEDURE</span> create_copies(\n' +
      '  <span class="keyword">IN</span> p_movie_id <span class="type">INT</span>,\n' +
      '  <span class="keyword">IN</span> p_count <span class="type">INT</span>,\n' +
      '  <span class="keyword">OUT</span> p_last_copy <span class="type">INT</span>\n' +
      ')\n' +
      '<span class="keyword">BEGIN</span>\n' +
      '  <span class="comment">-- v_next_copy is incremented after each insert</span>\n' +
      '  <span class="comment">-- missing OUT assignment after loop</span>\n' +
      '<span class="keyword">END</span>;',
    options: [
      'Add <code>SET p_last_copy = v_next_copy - 1;</code> on the successful path after the loop.',
      'Add <code>SELECT p_count;</code> because selecting a value always assigns every OUT parameter.',
      'Add <code>DROP PROCEDURE create_copies;</code> after the call so state cannot leak.',
      'Change both IN parameters to OUT parameters so the caller can see them.',
    ],
    answer: 0,
    correctExplanation:
      'An OUT parameter must be assigned deliberately inside the procedure. If v_next_copy advances after each insert, the last inserted copy number is v_next_copy minus one on the successful path.',
    optionExplanations: [
      'Correct. The line makes the procedure contract explicit by copying internal loop state into the caller-visible OUT parameter.',
      'Incorrect. SELECT can return a result set, but it does not automatically assign an OUT parameter unless the procedure explicitly sets it.',
      'Incorrect. Dropping the procedure is destructive metadata maintenance and has nothing to do with returning the generated value.',
      'Incorrect. IN parameters represent caller-supplied intent; changing them to OUT would damage the procedure boundary.',
    ],
    visual: {
      title: 'Procedure return boundary',
      kind: 'flow',
      nodes: ['caller inputs', 'loop state', 'OUT assignment', 'caller result'],
      active: [1, 2, 3],
      caption: 'Internal state becomes visible only when assigned to the OUT parameter.',
    },
  },
  'storage-indexes': {
    setup:
      'A query repeatedly asks for one customer across an order-date range. The existing composite index has the columns in an order that weakens that access path.',
    questionText:
      'Which composite index order first narrows to one customer and then scans that customer\'s order_date range efficiently?',
    codeSnippet:
      '<span class="comment">-- current index</span>\n' +
      '<span class="keyword">CREATE INDEX</span> idx_order_date_customer\n' +
      '<span class="keyword">ON</span> Orders(order_date, customer_id);\n\n' +
      '<span class="keyword">SELECT</span> order_id, order_date, total_amount\n' +
      '<span class="keyword">FROM</span> Orders\n' +
      '<span class="keyword">WHERE</span> customer_id = <span class="number">42</span>\n' +
      '  <span class="keyword">AND</span> order_date <span class="keyword">BETWEEN</span> <span class="string">\'2026-01-01\'</span> <span class="keyword">AND</span> <span class="string">\'2026-03-31\'</span>;',
    options: [
      'Use <code>CREATE INDEX ... ON Orders(customer_id, order_date)</code>.',
      'Use <code>CREATE INDEX ... ON Orders(total_amount, order_date)</code> because total_amount is displayed.',
      'Use <code>CREATE INDEX ... ON Orders(order_date)</code> only, because BETWEEN appears in the query.',
      'Remove the index because all range predicates require a full table scan.',
    ],
    answer: 0,
    correctExplanation:
      'Equality on the leading column positions the B+ tree at one customer, and the second column can then support an ordered date range scan within that customer. The displayed total_amount value does not drive the search predicate.',
    optionExplanations: [
      'Correct. The index order matches equality first, then range, which is the usual composite-index access pattern for this query.',
      'Incorrect. total_amount is projected but not searched, so leading with total_amount optimizes a different question.',
      'Incorrect. A date-only index can find the range but then still mixes all customers inside that range.',
      'Incorrect. B+ tree indexes are especially useful for range predicates when the leading columns match the search pattern.',
    ],
    visual: {
      title: 'Composite index order',
      kind: 'storage',
      nodes: ['customer equality', 'date range', 'linked leaves', 'few data rows'],
      active: [0, 1, 2],
      caption: 'The leading equality column narrows the leaf interval before the range scan begins.',
    },
  },
  jdbc: {
    setup:
      'A Java search method should perform a prefix search safely. The draft concatenates user text into the SQL program.',
    questionText:
      'Which edit keeps the SQL template fixed and binds the user-supplied prefix as a value for the LIKE predicate?',
    codeSnippet:
      '<span class="type">String</span> sql = <span class="string">"SELECT title FROM Movie WHERE title LIKE \'"</span>\n' +
      '  + userText + <span class="string">"%\'"</span>;\n' +
      '<span class="keyword">Statement</span> stmt = conn.createStatement();\n' +
      '<span class="keyword">ResultSet</span> rs = stmt.executeQuery(sql);',
    options: [
      'Use <code>WHERE title LIKE ?</code>, prepare the statement, and bind <code>userText + "%"</code> with <code>setString</code>.',
      'Keep concatenation but remove quotes around userText so SQL can parse faster.',
      'Use <code>ORDER BY ?</code> to bind the search text as a column name.',
      'Run the same string through <code>CallableStatement</code> without changing the SQL text.',
    ],
    answer: 0,
    correctExplanation:
      'The placeholder represents a value, so the SQL template remains fixed and the driver binds the prefix pattern as data. The percent wildcard belongs in the bound value, not in string-concatenated SQL syntax.',
    optionExplanations: [
      'Correct. This gives the query the same meaning while preventing user text from becoming SQL syntax.',
      'Incorrect. Removing quotes makes the SQL less reliable and does nothing to separate code from data.',
      'Incorrect. Placeholders bind values, not identifiers such as column names or keywords.',
      'Incorrect. CallableStatement is for stored routines; it does not make unsafe concatenated SQL safe by itself.',
    ],
    visual: {
      title: 'Prepared prefix search',
      kind: 'network',
      nodes: ['SQL template', 'placeholder', 'bound prefix', 'safe result'],
      active: [0, 1, 2, 3],
      caption: 'The user text fills a value slot and cannot rewrite the query structure.',
    },
  },
  'capstone-studio': {
    setup:
      'A checkout endpoint should show active overdue checkouts and accept borrower email and date values from a web request. The draft concatenates values and also joins all return inspections, which can multiply active checkout rows.',
    questionText:
      'Which repair preserves one row per active overdue checkout while also preventing user-supplied email/date values from rewriting SQL?',
    codeSnippet:
      '<span class="keyword">String</span> sql = <span class="string">"SELECT c.checkout_id, c.item_id "</span> +\n' +
      '  <span class="string">"FROM Checkout c JOIN ReturnInspection r "</span> +\n' +
      '  <span class="string">"ON c.checkout_id = r.checkout_id "</span> +\n' +
      '  <span class="string">"WHERE c.status = &apos;OUT&apos; AND c.due_at < &apos;"</span> + dueText + <span class="string">"&apos; "</span> +\n' +
      '  <span class="string">"AND c.borrower_email = &apos;"</span> + email + <span class="string">"&apos;"</span>;',
    options: [
      'Query only the active checkout grain, bind <code>status</code>, <code>due_at</code>, and email with a <code>PreparedStatement</code>, and add inspection data only through a controlled aggregate or separate endpoint.',
      'Keep the inspection join because every checkout may eventually have an inspection.',
      'Use <code>DISTINCT</code> as the main fix, because it proves the join grain is safe.',
      'Keep string concatenation but add an index on <code>borrower_email</code> so the query runs faster.',
    ],
    answer: 0,
    correctExplanation:
      'The endpoint contract is one row per active overdue checkout, so inspection history should not multiply rows. PreparedStatement binding also keeps request values from changing SQL structure.',
    optionExplanations: [
      'Correct. This repair fixes both the row-grain problem and the application security boundary.',
      'Incorrect. A possible future inspection does not mean inspection history belongs in the active-checkout contract.',
      'Incorrect. DISTINCT can hide duplicated projections while leaving the wrong logical join in place.',
      'Incorrect. An index improves access cost but does not make concatenated user input safe or repair row multiplication.',
    ],
    visual: {
      title: 'Capstone endpoint repair',
      kind: 'network',
      nodes: ['Active checkout grain', 'Prepared values', 'Controlled inspection data', 'Stable endpoint result'],
      active: [0, 1, 2, 3],
      caption: 'A deployable endpoint protects both meaning and execution boundary.',
    },
  },
}

function normalizeQuestion(question: QuizQuestion): LegacyQuizQuestion {
  return {
    setup: 'Use the lecture concepts to reason from the scenario, not from memorized wording.',
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    correctExplanation: question.explanation,
    optionExplanations: question.options.map((option, index) =>
      index === question.answer
        ? question.explanation
        : `${option} does not answer this prompt's specific requirement: ${question.prompt}. Compare it with the provided explanation, which shows the database rule the answer must actually satisfy: ${question.explanation}`,
    ),
  }
}

function cleanText(text: string) {
  return text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/<>/g, '\u2260')
    .replace(/>=/g, '\u2265')
    .replace(/<=/g, '\u2264')
    .replace(/->/g, '\u2192')
    .replace(/\bsigma\b/gi, '\u03c3')
    .replace(/\bpi\b/gi, '\u03c0')
    .replace(/\brho\b/gi, '\u03c1')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.?;:])/g, '$1')
    .trim()
}

function stripInlineMarkup(text: string) {
  return text.replace(/<\/?(strong|code)>/gi, '')
}

function normalizeFeedbackBase(text: string) {
  let normalized = cleanText(text)
  for (let pass = 0; pass < 3; pass += 1) {
    normalized = normalized
      .replace(/^<strong>\s*(Correct|Incorrect|Not quite|Not Quite)\.?\s*<\/strong>\s*/i, '')
      .replace(/^(Correct|Incorrect|Not quite|Not Quite)[:.]\s*/i, '')
      .trim()
  }
  return normalized || 'This option must be checked against the exact database rule named by the prompt.'
}

function compactFeedback(text: string, limit = 170) {
  const normalized = cleanText(stripInlineMarkup(text))
  if (normalized.length <= limit) return normalized
  const sentenceBoundary = normalized.lastIndexOf('.', limit)
  const end = sentenceBoundary > limit * 0.55 ? sentenceBoundary + 1 : limit
  const shortened = normalized.slice(0, end).trim()
  return /[.!?]$/.test(shortened) ? shortened : `${shortened}...`
}

function optionObjects(question: LegacyQuizQuestion): QuizOption[] {
  return question.options.map((option, index) => ({
    text: cleanText(option),
    value: optionValues[index] ?? `option-${index + 1}`,
  }))
}

function questionType(deck: Deck, index: number): QuizType {
  const type = quizTypeCycle[index % quizTypeCycle.length]
  if (type === 'interactive-click' && visualPrimaryDecks.has(deck.id)) return 'interactive-visual'
  return type
}

function buildQuestion(deck: Deck, question: LegacyQuizQuestion, index: number): RichQuizQuestion {
  const quizType = questionType(deck, index)
  if (quizType === 'true-false') return buildTrueFalse(deck, question, index)
  if (quizType === 'interactive-click' || quizType === 'interactive-visual') {
    return buildInteractiveVisual(deck, question, index, quizType)
  }
  if (quizType === 'interactive-match-the-correct-pairing-of-the-items') {
    return buildMatching(deck, question, index)
  }
  return buildMultipleChoice(deck, question, index)
}

function buildMultipleChoice(deck: Deck, question: LegacyQuizQuestion, index: number): RichQuizQuestion {
  const codeRepairQuestion = index === 0 ? codeRepairQuestions[deck.id] : undefined
  if (codeRepairQuestion) return buildCodeRepairQuestion(deck, codeRepairQuestion)

  const options = optionObjects(question)
  const correctValue = options[question.answer]?.value ?? options[0].value
  return {
    quizType: 'multiple-choice',
    setup: cleanText(question.setup),
    questionText: cleanText(question.prompt),
    codeSnippet: codeSnippetFor(deck.id, index),
    options,
    correctAnswer: correctValue,
    visual: question.visual,
    explanation: explanationForOptions(deck, question, options, correctValue),
  }
}

function buildCodeRepairQuestion(deck: Deck, question: CodeRepairQuestion): RichQuizQuestion {
  const options = optionObjects({
    setup: question.setup,
    prompt: question.questionText,
    options: question.options,
    answer: question.answer,
    correctExplanation: question.correctExplanation,
    optionExplanations: question.optionExplanations,
    visual: question.visual,
  })
  const correctValue = options[question.answer]?.value ?? options[0].value

  return {
    quizType: 'multiple-choice',
    setup: cleanText(question.setup),
    questionText: question.questionText,
    codeSnippet: question.codeSnippet,
    options,
    correctAnswer: correctValue,
    visual: question.visual,
    explanation: explanationForOptions(
      deck,
      {
        setup: question.setup,
        prompt: question.questionText,
        options: question.options,
        answer: question.answer,
        correctExplanation: question.correctExplanation,
        optionExplanations: question.optionExplanations,
        visual: question.visual,
      },
      options,
      correctValue,
    ),
  }
}

function buildTrueFalse(deck: Deck, question: LegacyQuizQuestion, index: number): RichQuizQuestion {
  const claimIsTrue = index % 2 === 0
  const claimIndex = claimIsTrue ? question.answer : (question.answer + 1) % question.options.length
  const claim = cleanText(question.options[claimIndex])
  const options = [
    { text: 'True', value: 'true' },
    { text: 'False', value: 'false' },
  ]
  const correctAnswer = claimIsTrue ? 'true' : 'false'
  const chosenExplanation = question.optionExplanations[claimIndex] ?? question.correctExplanation
  return {
    quizType: 'true-false',
    setup: cleanText(question.setup),
    questionText: `<strong>True or false:</strong> ${compactFeedback(claim, 145)} Does this claim satisfy the scenario requirement?`,
    codeSnippet: codeSnippetFor(deck.id, index),
    options,
    correctAnswer,
    visual: question.visual,
    explanation: {
      correct: detailedFeedback({
        deck,
        base:
          correctAnswer === 'true'
            ? question.correctExplanation
            : `${chosenExplanation} Therefore the quoted claim should be rejected for this scenario.`,
        isCorrect: true,
        topic: claim,
        correctTopic: claim,
        prompt: question.prompt,
        setup: question.setup,
      }),
      optionsFeedback: options.map((option) => ({
        value: option.value,
        detail: detailedFeedback({
          deck,
          base:
            option.value === correctAnswer
              ? `This truth value is correct for the proposed claim. ${chosenExplanation}`
              : `This truth value is not defensible for the proposed claim. ${chosenExplanation}`,
          isCorrect: option.value === correctAnswer,
          topic: claim,
          correctTopic: `The claim should be judged ${correctAnswer === 'true' ? 'true' : 'false'} for this scenario.`,
          prompt: question.prompt,
          setup: question.setup,
        }),
      })),
      incorrectBase: incorrectBaseFor(deck, question, 'the truth claim'),
      incorrectDetail: incorrectDetailFor(deck),
    },
  }
}

function buildInteractiveVisual(
  deck: Deck,
  question: LegacyQuizQuestion,
  index: number,
  quizType: 'interactive-click' | 'interactive-visual',
): RichQuizQuestion {
  const visual = question.visual ?? fallbackVisual(deck, question)
  const component = visualComponentFromVisual(visual)
  return {
    quizType,
    setup: cleanText(question.setup),
    questionText: `<strong>Select the needed diagram nodes:</strong> ${cleanText(question.prompt)}`,
    codeSnippet: codeSnippetFor(deck.id, index),
    correctAnswer: component.correctIndices.map((nodeIndex) => `node-${nodeIndex}`),
    interactiveComponent: component,
    visual,
    explanation: explanationForVisual(deck, question, component),
  }
}

function buildMatching(deck: Deck, question: LegacyQuizQuestion, index: number): RichQuizQuestion {
  const visual = question.visual ?? fallbackVisual(deck, question)
  const component = matchComponentFromVisual(visual)
  return {
    quizType: 'interactive-match-the-correct-pairing-of-the-items',
    setup: cleanText(question.setup),
    questionText: `<strong>Match each concept to its role:</strong> ${cleanText(question.prompt)}`,
    codeSnippet: codeSnippetFor(deck.id, index),
    correctAnswer: component.correctPairs,
    interactiveComponent: component,
    visual,
    explanation: explanationForMatching(deck, question, component),
  }
}

function explanationForOptions(
  deck: Deck,
  question: LegacyQuizQuestion,
  options: QuizOption[],
  correctValue: string,
): QuizExplanation {
  return {
    correct: detailedFeedback({
      deck,
      base: question.correctExplanation,
      isCorrect: true,
      topic: options.find((option) => option.value === correctValue)?.text ?? question.prompt,
      correctTopic: options.find((option) => option.value === correctValue)?.text ?? question.prompt,
      prompt: question.prompt,
      setup: question.setup,
    }),
    optionsFeedback: options.map((option, index) => ({
      value: option.value,
      detail: detailedFeedback({
        deck,
        base: question.optionExplanations[index] ?? question.correctExplanation,
        isCorrect: option.value === correctValue,
        topic: option.text,
        correctTopic: options.find((candidate) => candidate.value === correctValue)?.text,
        prompt: question.prompt,
        setup: question.setup,
      }),
    })),
    incorrectBase: incorrectBaseFor(deck, question, 'the selected option'),
    incorrectDetail: incorrectDetailFor(deck),
  }
}

function explanationForVisual(
  deck: Deck,
  question: LegacyQuizQuestion,
  component: InteractiveVisualComponent,
): QuizExplanation {
  return {
    correct: detailedFeedback({
      deck,
      base: question.correctExplanation,
      isCorrect: true,
      topic: component.title,
      correctTopic: component.correctIndices.map((nodeIndex) => component.nodes[nodeIndex]?.label).join(', '),
      prompt: question.prompt,
      setup: question.setup,
    }),
    optionsFeedback: component.nodes.map((node, index) => ({
      value: node.value,
      detail: detailedFeedback({
        deck,
        base: component.correctIndices.includes(index)
          ? `${node.label} is part of the proof set required by this diagram. ${node.detail}`
          : `${node.label} is useful context, but it is not required for this specific proof set. ${node.detail}`,
        isCorrect: component.correctIndices.includes(index),
        topic: node.label,
        correctTopic: component.correctIndices.map((nodeIndex) => component.nodes[nodeIndex]?.label).join(', '),
        prompt: question.prompt,
        setup: question.setup,
      }),
    })),
    incorrectBase: incorrectBaseFor(deck, question, 'the diagram proof path'),
    incorrectDetail: incorrectDetailFor(deck),
  }
}

function explanationForMatching(
  deck: Deck,
  question: LegacyQuizQuestion,
  component: InteractiveMatchComponent,
): QuizExplanation {
  return {
    correct: detailedFeedback({
      deck,
      base: question.correctExplanation,
      isCorrect: true,
      topic: 'matching roles',
      correctTopic: 'the complete set of concept-role pairings',
      prompt: question.prompt,
      setup: question.setup,
    }),
    optionsFeedback: component.items.map((item) => {
      const role = component.choices.find((choice) => choice.value === component.correctPairs[item.id])
      return {
        value: item.id,
        detail: detailedFeedback({
          deck,
          base: `${item.label} should be matched with ${role?.text ?? 'its reasoning role'}. ${item.detail}`,
          isCorrect: true,
          topic: item.label,
          correctTopic: role?.text,
          prompt: question.prompt,
          setup: question.setup,
        }),
      }
    }),
    incorrectBase: incorrectBaseFor(deck, question, 'the concept-role pairing'),
    incorrectDetail: incorrectDetailFor(deck),
  }
}

function feedbackProfile(deckId: string) {
  const profiles: Record<string, { correct: string; incorrect: string; retry: string[] }> = {
    ddl: {
      correct:
        'This fits because the option places the rule where the DBMS can enforce stored-state legality before later workflow code sees the row.',
      incorrect:
        'This breaks because it either weakens enforceable identity/reference checks or treats audit survival as if it were only a column-shape issue.',
      retry: [
        'Check whether the rule must reject a row at write time or merely describe a later workflow event.',
        'Separate durable identity, optional reference, and audit history before choosing the DDL mechanism.',
        'Use the displayed table or code to ask which illegal row would still slip through.',
      ],
    },
    dml: {
      correct:
        'This fits because the SQL clause or grouping decision preserves the requested intermediate result before the final SELECT names it.',
      incorrect:
        'This breaks because it moves a predicate, aggregate, alias, or grouping decision to a phase where that value does not yet mean what the prompt needs.',
      retry: [
        'Trace FROM, WHERE, GROUP BY, HAVING, SELECT, and ORDER BY in logical order.',
        'Write what one output row represents before deciding which columns belong in GROUP BY.',
        'Check whether a join has multiplied facts before an aggregate counts or sums them.',
      ],
    },
    'joins-subqueries': {
      correct:
        'This fits because the query shape matches the requested relationship: attached rows, membership, absence, correlation, or tie-preserving comparison.',
      incorrect:
        'This breaks because it chooses the wrong query shape for the evidence: it may attach rows when only existence is needed, or collapse ties that should survive.',
      retry: [
        'Decide whether the answer needs columns from another table or only a yes/no existence test.',
        'Test nullable subquery values before trusting NOT IN for an absence query.',
        'For maximum/minimum questions, add a tied row and verify whether the query still returns every valid answer.',
      ],
    },
    'relational-algebra': {
      correct:
        'This fits because the operator sequence preserves the attributes needed by later joins or set operations before projecting the final schema.',
      incorrect:
        'This breaks because the proposed algebra tree changes either the tuple set or the available attributes before the next operator can legally use them.',
      retry: [
        'After each operator, write the relation schema that remains.',
        'Keep join attributes until the join is complete, then project the requested output.',
        'Use rename whenever one relation must play two different roles.',
      ],
    },
    views: {
      correct:
        'This fits because the view or derived relation publishes a useful interface with a clear consumer, stable columns, and an inspectable result shape.',
      incorrect:
        'This breaks because it wraps, exposes, or updates a query result without proving the view has a stable contract for this prompt.',
      retry: [
        'Name who will consume the view and which columns are intentionally public.',
        'Ask whether the view creates a reusable relation or only hides a simple join behind another name.',
        'For updates, identify the exact base row that would be changed by one view row.',
      ],
    },
    normalization: {
      correct:
        'This fits because the answer follows the dependency direction and stores each fact with the determinant that owns it.',
      incorrect:
        'This breaks because it leaves a fact attached to the wrong determinant or treats a sample coincidence as a rule that must hold in every legal instance.',
      retry: [
        'Compute closure before calling an attribute set a key.',
        'Invent two legal rows with the same determinant and test whether the dependent may differ.',
        'For a decomposition, check whether the shared attributes can join the pieces back without invented rows.',
      ],
    },
    'modules-triggers': {
      correct:
        'This fits because the selected mechanism matches the execution boundary: explicit call, returned value, automatic event reaction, or transaction-level rule.',
      incorrect:
        'This breaks because it assigns procedural behavior to the wrong boundary or hides a side effect that callers and tests must be able to reason about.',
      retry: [
        'Ask whether the rule should run because a caller invoked it or because a table event fired.',
        'Separate returned values from side effects; they are observed differently by application code.',
        'Check where rollback and error signaling should occur if the database-side action fails.',
      ],
    },
    'storage-indexes': {
      correct:
        'This fits because it reasons from physical units: data pages, index entries, tree height, pinned frames, dirty pages, and range-friendly leaf order.',
      incorrect:
        'This breaks because it ignores the physical condition that makes the access path legal or cheap, such as ordering, density, pinning, or range traversal.',
      retry: [
        'Count blocks with ceiling division; a partially filled block still costs a block.',
        'Check whether the data file is ordered before proposing a sparse index.',
        'For eviction, avoid pinned frames and account for dirty-write cost.',
      ],
    },
    jdbc: {
      correct:
        'This fits because it isolates the correct runtime layer: classpath, driver, tunnel, session, prepared statement, cursor, or resource lifetime.',
      incorrect:
        'This breaks because it diagnoses the wrong layer or improves performance while leaving the connection, binding, or resource-safety problem unsolved.',
      retry: [
        'Start with the earliest failing layer: driver loading before network, network before login, login before SQL.',
        'Use prepared statements when user text should fill value slots rather than rewrite SQL structure.',
        'Close ResultSet, Statement, and Connection in a scope that survives exceptions.',
      ],
    },
    'capstone-studio': {
      correct:
        'This fits because the repair keeps the workflow invariant intact across schema rules, query contracts, transactions, indexes, and Java execution.',
      incorrect:
        'This breaks because it fixes one visible symptom while leaving the endpoint contract, audit trail, or atomic workflow state inconsistent.',
      retry: [
        'Name the invariant the workflow must preserve after every write.',
        'Check whether report rows, event rows, and current-state rows are being mixed.',
        'Verify both meaning and operation: prepared values, useful indexes, transaction rollback, and resource cleanup.',
      ],
    },
  }

  return profiles[deckId] ?? profiles.ddl
}

function scenarioSnippet(setup: string | undefined, prompt: string | undefined) {
  return compactFeedback(setup || prompt || 'this question', 125)
}

function topicSnippet(topic: string | undefined) {
  return compactFeedback(topic || 'the selected answer', 105)
}

function asSentence(text: string) {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function incorrectBaseFor(deck: Deck, question: LegacyQuizQuestion | RichQuizQuestion, focus: string) {
  const profile = feedbackProfile(deck.id)
  const scenario = scenarioSnippet(question.setup, 'prompt' in question ? question.prompt : question.questionText)
  return `<strong>Recheck ${focus}:</strong> ${profile.incorrect} Use this question's scenario cue: ${asSentence(scenario)}`
}

function incorrectDetailFor(deck: Deck) {
  return [...feedbackProfile(deck.id).retry]
}

function detailedFeedback({
  deck,
  base,
  isCorrect,
  topic,
  correctTopic,
  prompt,
  setup,
}: {
  deck: Deck
  base: string
  isCorrect: boolean
  topic: string
  correctTopic?: string
  prompt?: string
  setup?: string
}) {
  const profile = feedbackProfile(deck.id)
  const lead = isCorrect ? '<strong>Why this answer fits:</strong>' : '<strong>Why this answer fails:</strong>'
  const core = compactFeedback(normalizeFeedbackBase(base), 220)
  const selected = topicSnippet(topic)
  const target = topicSnippet(correctTopic || topic)
  const scenario = scenarioSnippet(setup, prompt)
  const scenarioSentence = asSentence(scenario)
  const lens = isCorrect ? profile.correct : profile.incorrect
  const localReason = isCorrect
    ? `In this scenario, <code>${selected}</code> lines up with the requested evidence for <code>${target}</code>: ${scenarioSentence}`
    : `Here, <code>${selected}</code> has to be tested directly against the scenario evidence: ${scenarioSentence} The mistake is in the submitted reasoning itself, so the app withholds the correct answer until you solve or reveal it.`
  return `${lead} ${core} ${localReason} ${lens}`
}

function fallbackVisual(deck: Deck, question: LegacyQuizQuestion): QuizVisual {
  return {
    title: `${deck.title} reasoning path`,
    kind: 'flow',
    nodes: ['Scenario grain', 'Candidate rule', 'Evidence check', 'Final answer'],
    active: [0, 1, 2, 3],
    caption: cleanText(question.correctExplanation),
  }
}

function visualComponentFromVisual(visual: QuizVisual): InteractiveVisualComponent {
  return {
    type: `${visual.kind}-reasoning-selector`,
    title: visual.title,
    instructions: 'Select the exact nodes that make the answer logically valid.',
    nodes: visual.nodes.map((node, index) => ({
      value: `node-${index}`,
      label: node,
      detail: index === visual.active[0] ? visual.caption : `This node is part of the ${visual.title} model.`,
    })),
    correctIndices: [...visual.active].sort((left, right) => left - right),
  }
}

function matchComponentFromVisual(visual: QuizVisual): InteractiveMatchComponent {
  const roles = roleChoices(visual.kind)
  const items = visual.nodes.map((node, index) => ({
    id: `item-${index}`,
    label: node,
    detail: index === visual.active[0] ? visual.caption : `This item appears in the ${visual.title} reasoning chain.`,
  }))
  const correctPairs = Object.fromEntries(items.map((item, index) => [item.id, roles[index % roles.length].value]))
  return {
    type: `${visual.kind}-concept-role-match`,
    items,
    choices: [...roles.slice(1), roles[0]],
    correctPairs,
  }
}

function roleChoices(kind: QuizVisual['kind']): QuizOption[] {
  const labels: Record<QuizVisual['kind'], string[]> = {
    flow: ['Starting fact or event', 'Rule that constrains movement', 'Intermediate evidence', 'Final decision'],
    sets: ['Candidate set', 'Comparison set', 'Maximum or compatibility test', 'Returned set'],
    dependency: ['Determinant', 'Context attribute', 'Dependent fact', 'Legal row identity'],
    storage: ['Physical storage state', 'Buffer or occupancy condition', 'Capacity calculation', 'Access-path consequence'],
    network: ['Client-side boundary', 'Driver or tunnel layer', 'Server-side session', 'Returned database effect'],
    grouping: ['Input grain', 'Multiplicity source', 'Aggregation guardrail', 'Result interpretation'],
  }
  return labels[kind].map((label, index) => ({
    text: label,
    value: `role-${index}`,
  }))
}

function codeSnippetFor(deckId: string, index: number) {
  const snippets: Record<string, string[]> = {
    ddl: [
      '<span class="keyword">CREATE TABLE</span> InvoiceLine (\n  reservation_id <span class="type">INT</span>,\n  line_no <span class="type">INT</span>,\n  <span class="keyword">FOREIGN KEY</span> (reservation_id) <span class="keyword">REFERENCES</span> Reservation(id)\n    <span class="keyword">ON DELETE RESTRICT</span>\n);',
      '<span class="keyword">CHECK</span> (status <span class="operator">IN</span> (<span class="string">\'available\'</span>, <span class="string">\'rented\'</span>, <span class="string">\'damaged\'</span>))',
    ],
    dml: [
      '<span class="keyword">SELECT</span> restaurant_id, month, <span class="function">SUM</span>(net_amount)\n<span class="keyword">FROM</span> Orders\n<span class="keyword">WHERE</span> refunded = <span class="number">0</span>\n<span class="keyword">GROUP BY</span> restaurant_id, month\n<span class="keyword">HAVING</span> <span class="function">SUM</span>(net_amount) &gt; <span class="number">10000</span>;',
    ],
    'joins-subqueries': [
      '<span class="keyword">SELECT</span> v.vendor_id\n<span class="keyword">FROM</span> Vendor v\n<span class="keyword">WHERE NOT EXISTS</span> (\n  <span class="keyword">SELECT</span> <span class="number">1</span>\n  <span class="keyword">FROM</span> SafetyDocument d\n  <span class="keyword">WHERE</span> d.vendor_id = v.vendor_id\n);',
    ],
    'relational-algebra': [
      'LaptopFiltered := <span class="ra-op">&sigma;</span><sub class="ra-sub">drive &ge; <span class="number">1000</span></sub>(Laptop)\nJoined := Product <span class="ra-join">&#8904;</span><sub class="ra-sub">Product.model = LaptopFiltered.model</sub> LaptopFiltered\nAnswer := <span class="ra-op">&pi;</span><sub class="ra-sub">maker</sub>(Joined)',
    ],
    views: [
      '<span class="keyword">CREATE VIEW</span> ActiveMovie <span class="keyword">AS</span>\n<span class="keyword">SELECT</span> movie_id, title\n<span class="keyword">FROM</span> Movie\n<span class="keyword">WHERE EXISTS</span> (...);',
    ],
    normalization: [
      '<span class="comment">-- If B determines C, C belongs with B.</span>\nR(A, B, C),  B <span class="operator">-&gt;</span> C\nR1(A, B)  and  R2(B, C)',
    ],
    'modules-triggers': [
      '<span class="keyword">CREATE PROCEDURE</span> create_copies(\n  <span class="keyword">IN</span> p_movie_id <span class="type">INT</span>,\n  <span class="keyword">IN</span> p_count <span class="type">INT</span>,\n  <span class="keyword">OUT</span> p_last_copy <span class="type">INT</span>\n)\n<span class="keyword">BEGIN</span>\n  <span class="comment">-- read state, loop, insert, return final value</span>\n<span class="keyword">END</span>;',
    ],
    'storage-indexes': [
      'entries = <span class="number">13</span>\nentries_per_block = <span class="number">5</span>\nindex_blocks = <span class="function">CEIL</span>(entries / entries_per_block)',
    ],
    jdbc: [
      '<span class="keyword">PreparedStatement</span> ps = conn.prepareStatement(\n  <span class="string">"SELECT title FROM Movie WHERE title LIKE ?"</span>\n);\nps.setString(<span class="number">1</span>, userText + <span class="string">"%"</span>);',
    ],
    'capstone-studio': [
      '<span class="keyword">CREATE VIEW</span> ActiveCheckout <span class="keyword">AS</span>\n<span class="keyword">SELECT</span> checkout_id, item_id, borrower_id, due_at\n<span class="keyword">FROM</span> Checkout\n<span class="keyword">WHERE</span> status = <span class="string">&apos;OUT&apos;</span>;',
      '<span class="keyword">START TRANSACTION</span>;\n<span class="keyword">INSERT INTO</span> Checkout(...);\n<span class="keyword">UPDATE</span> EquipmentItem\n<span class="keyword">SET</span> status = <span class="string">&apos;OUT&apos;</span>\n<span class="keyword">WHERE</span> item_id = ? <span class="keyword">AND</span> status = <span class="string">&apos;AVAILABLE&apos;</span>;\n<span class="keyword">COMMIT</span>;',
    ],
  }
  const deckSnippets = snippets[deckId]
  if (!deckSnippets) return undefined
  return deckSnippets[index % deckSnippets.length]
}

function fallbackFeedbackFor(question: RichQuizQuestion, deck: Deck) {
  const profile = feedbackProfile(deck.id)
  const scenario = scenarioSnippet(question.setup, question.questionText)
  if (question.options?.length) {
    return question.options.map((option) => ({
      value: option.value,
      detail: `<strong>Option check:</strong> ${profile.incorrect} Test <code>${topicSnippet(option.text)}</code> against this scenario: ${scenario}.`,
    }))
  }
  if (question.interactiveComponent && 'nodes' in question.interactiveComponent) {
    return question.interactiveComponent.nodes.map((node) => ({
      value: node.value,
      detail: `<strong>Node check:</strong> ${profile.incorrect} The node <code>${topicSnippet(node.label)}</code> must be necessary for this visual proof, not just nearby context.`,
    }))
  }
  if (question.interactiveComponent && 'items' in question.interactiveComponent) {
    return question.interactiveComponent.items.map((item) => ({
      value: item.id,
      detail: `<strong>Pair check:</strong> ${profile.incorrect} Match <code>${topicSnippet(item.label)}</code> by its actual job in this scenario: ${scenario}.`,
    }))
  }
  return [
    {
      value: 'general',
      detail: `<strong>Question check:</strong> ${profile.incorrect} Use the local tables, code, and prompt facts in this scenario: ${scenario}.`,
    },
  ]
}

function ensureQuizQuestionSchema(deck: Deck, question: RichQuizQuestion): RichQuizQuestion {
  const optionsFeedback = question.explanation.optionsFeedback?.length
    ? question.explanation.optionsFeedback
    : fallbackFeedbackFor(question, deck)

  return {
    ...question,
    explanation: {
      correct:
        question.explanation.correct ||
        `<strong>Why this answer fits:</strong> ${feedbackProfile(deck.id).correct} The prompt evidence is: ${scenarioSnippet(question.setup, question.questionText)}.`,
      optionsFeedback,
      incorrectBase: question.explanation.incorrectBase || incorrectBaseFor(deck, question, 'the submitted answer'),
      incorrectDetail: question.explanation.incorrectDetail?.length ? question.explanation.incorrectDetail : incorrectDetailFor(deck),
    },
  }
}

type GeneratedQuizFrame = {
  visualKind: QuizVisual['kind']
  setting: string
  correctMove: string
  distractors: [string, string, string]
  proofNoun: string
}

const generatedQuizFrames: Record<string, GeneratedQuizFrame> = {
  ddl: {
    visualKind: 'dependency',
    setting: 'a schema change request where invalid rows must be rejected before application code sees them',
    correctMove: 'declare the invariant with the key, foreign key, nullability, uniqueness, or domain rule that owns the stored-state promise',
    distractors: [
      'store a descriptive label and trust later reports to notice contradictions',
      'push the entire rule into presentation code even though multiple clients can write the table',
      'use a cascade or enum because it looks convenient, without checking whether audit evidence should survive',
    ],
    proofNoun: 'stored-state invariant',
  },
  dml: {
    visualKind: 'grouping',
    setting: 'a reporting query whose answer is correct only if row filters, group filters, and selected expressions keep the requested output grain',
    correctMove: 'trace the logical query pipeline and place each predicate or aggregate where its value actually exists',
    distractors: [
      'move every condition into SELECT because aliases appear there',
      'add DISTINCT after the fact and assume row multiplication has been proven harmless',
      'sort the result and treat display order as if it changed membership in the answer',
    ],
    proofNoun: 'query-grain proof',
  },
  'joins-subqueries': {
    visualKind: 'sets',
    setting: 'a nested query or join decision where row attachment, existence, absence, and ties lead to different legal answers',
    correctMove: 'choose the query shape whose intermediate relation matches the requested evidence: joined row, membership test, anti-match, or tie-preserving comparison',
    distractors: [
      'join every table just because the names are available',
      'use NOT IN without checking null-sensitive behavior in the compared set',
      'collapse a leader query to one arbitrary row even though tied answers remain valid',
    ],
    proofNoun: 'membership and tie proof',
  },
  'relational-algebra': {
    visualKind: 'flow',
    setting: 'an algebra expression where each operator changes either the tuple set, the schema, or the relation role available to later operators',
    correctMove: 'preserve needed attributes until later operators consume them, then project or rename only after the relation shape is safe',
    distractors: [
      'project early because the final answer looks narrow',
      'rename relations and assume that renamed attributes become semantically compatible',
      'use a set operator before checking arity and domain compatibility',
    ],
    proofNoun: 'operator-shape proof',
  },
  views: {
    visualKind: 'flow',
    setting: 'a query layer that should publish a stable relation contract for consumers without leaking unnecessary base-table detail',
    correctMove: 'define the view or derived table only when it gives a reusable row grain, column boundary, or security interface',
    distractors: [
      'wrap a direct join in another SELECT without changing meaning or naming a useful interface',
      'use SELECT star so future private columns automatically appear',
      'assume every view row is updatable without proving an unambiguous base-row mapping',
    ],
    proofNoun: 'view-contract proof',
  },
  normalization: {
    visualKind: 'dependency',
    setting: 'a relation design where redundancy, functional dependencies, and decomposition determine whether updates remain coherent',
    correctMove: 'store each fact with the determinant that controls it and verify that any split is lossless for the stated dependencies',
    distractors: [
      'hide repeated output with DISTINCT instead of changing storage',
      'split by a convenient column that is not the determinant in the dependency',
      'call a set of attributes a key before computing closure and checking minimality',
    ],
    proofNoun: 'dependency proof',
  },
  'modules-triggers': {
    visualKind: 'flow',
    setting: 'a database-side behavior decision where calls, parameters, trigger events, side effects, and rollback boundaries must stay visible',
    correctMove: 'place the rule at the execution boundary that matches how the behavior should be invoked, observed, and tested',
    distractors: [
      'hide a side effect in a trigger when callers need an explicit returned result',
      'use an OUT parameter without assigning it on the successful path',
      'move a cross-row workflow into a static column label and assume the label proves the event history',
    ],
    proofNoun: 'execution-boundary proof',
  },
  'storage-indexes': {
    visualKind: 'storage',
    setting: 'a physical access-path problem where pages, entries, ordered leaves, dirty frames, and pinned buffers control cost',
    correctMove: 'reason from the physical unit being moved or searched, then choose the index, buffer, or scan strategy that matches the workload',
    distractors: [
      'count logical rows and ignore page boundaries or partially filled blocks',
      'use a sparse index without requiring data-file ordering on the search key',
      'evict a pinned or dirty frame without accounting for the rule that makes that choice invalid or expensive',
    ],
    proofNoun: 'access-path proof',
  },
  jdbc: {
    visualKind: 'network',
    setting: 'a Java-to-database path where driver loading, tunneling, sessions, prepared statements, cursors, and close scopes can fail independently',
    correctMove: 'diagnose the earliest failing runtime layer and bind user values through PreparedStatement placeholders while closing owned resources',
    distractors: [
      'debug SQL text before verifying that the driver, tunnel, credentials, and selected database are reachable',
      'concatenate user values into SQL and rely on indexes to make the endpoint safe',
      'read a ResultSet before executeQuery establishes a server-side result cursor',
    ],
    proofNoun: 'runtime-layer proof',
  },
  'capstone-studio': {
    visualKind: 'network',
    setting: 'an end-to-end database feature where schema invariants, query contracts, transaction boundaries, indexes, and JDBC resource lifetimes all matter',
    correctMove: 'preserve the workflow invariant across the schema, query result, transaction writes, access path, and application boundary',
    distractors: [
      'fix only the displayed report while leaving the write workflow non-atomic',
      'add an index and assume performance repair also proves input safety and row-grain correctness',
      'mix current state, audit history, and endpoint output in one query without declaring the result grain',
    ],
    proofNoun: 'capstone invariant proof',
  },
}

function quizFrameFor(deck: Deck) {
  return generatedQuizFrames[deck.id] ?? generatedQuizFrames.ddl
}

function isGeneratedLectureSlide(slide: Deck['slides'][number]) {
  return /\b\d+\/20$/.test(slide.eyebrow)
}

function focusFromSlide(slide: Deck['slides'][number]) {
  const eyebrowMatch = slide.eyebrow.match(/^(.*?)\s+\d+\/20$/)
  if (eyebrowMatch?.[1]) return cleanText(eyebrowMatch[1])
  const titleFocus = slide.title.split(':')[0]
  return cleanText(titleFocus || slide.title)
}

function selectedSupplementalSlides(deck: Deck, needed: number) {
  const candidates = deck.slides.filter(isGeneratedLectureSlide)
  const pool = candidates.length ? candidates : deck.slides
  if (!pool.length || needed <= 0) return []
  return Array.from({ length: needed }, (_, index) => {
    const poolIndex = Math.min(pool.length - 1, Math.floor(((index + 0.5) * pool.length) / needed))
    return pool[poolIndex]
  })
}

function arrangedOptions(correct: string, distractors: [string, string, string], correctIndex: number) {
  const options = [...distractors]
  options.splice(correctIndex, 0, correct)
  return options
}

function arrangedExplanations(correctExplanation: string, distractorExplanations: [string, string, string], correctIndex: number) {
  const explanations = [...distractorExplanations]
  explanations.splice(correctIndex, 0, correctExplanation)
  return explanations
}

function generatedVisual(deck: Deck, slide: Deck['slides'][number], supplementalIndex: number): QuizVisual {
  const frame = quizFrameFor(deck)
  const focus = focusFromSlide(slide)
  const terms = slide.terms?.map((term) => cleanText(term.term)).filter(Boolean) ?? []
  const checks = slide.checks?.map(cleanText).filter(Boolean) ?? []
  const nodes = [
    terms[0] ?? focus,
    checks[0] ?? frame.proofNoun,
    terms[1] ?? checks[1] ?? frame.correctMove.split(' ').slice(0, 5).join(' '),
    checks[2] ?? 'validated answer',
  ]

  return {
    title: `${focus} ${frame.proofNoun}`,
    kind: frame.visualKind,
    nodes,
    active: supplementalIndex % 3 === 0 ? [0, 1, 3] : supplementalIndex % 3 === 1 ? [0, 2, 3] : [1, 2, 3],
    caption: compactFeedback(slide.bridge || slide.body, 150),
  }
}

function generatedLegacyQuestion(
  deck: Deck,
  slide: Deck['slides'][number],
  supplementalIndex: number,
  globalIndex: number,
): LegacyQuizQuestion {
  const frame = quizFrameFor(deck)
  const focus = focusFromSlide(slide)
  const check = cleanText(slide.checks?.[supplementalIndex % Math.max(slide.checks.length, 1)] ?? slide.bullets[supplementalIndex % Math.max(slide.bullets.length, 1)] ?? slide.body)
  const correct =
    `Use ${frame.correctMove} for <code>${focus}</code>, then verify the local evidence: ${compactFeedback(check, 120)}`
  const distractors: [string, string, string] = [
    `Use ${frame.distractors[0]} for <code>${focus}</code>.`,
    `Use ${frame.distractors[1]} and accept the sample result without a separate proof.`,
    `Use ${frame.distractors[2]} even if it changes the intended boundary for this subtopic.`,
  ]
  const correctIndex = globalIndex % 4
  const options = arrangedOptions(correct, distractors, correctIndex)
  const correctExplanation =
    `${focus} is being tested as ${frame.proofNoun}. The reliable answer keeps the chapter's mechanism aligned with the local page evidence instead of only matching a familiar keyword. The page-specific check is: ${compactFeedback(check, 190)}`
  const distractorExplanations: [string, string, string] = [
    `This is tempting because it may resemble a familiar shortcut, but it does not prove the local ${frame.proofNoun}. It avoids the page's actual evidence: ${compactFeedback(check, 150)}`,
    `This confuses a sample that appears to work with a rule that remains valid under legal data changes. The prompt asks for the mechanism that survives the subtopic boundary, not a cosmetic repair.`,
    `This moves the answer to the wrong layer or grain. For ${focus}, the selected mechanism must preserve the stated meaning before later pages or users rely on the result.`,
  ]

  return {
    setup:
      `${focus} case: ${compactFeedback(frame.setting, 88)} Use the displayed evidence, not keyword memory.`,
    prompt:
      `Which choice preserves the required grain, boundary, and evidence for ${focus}?`,
    options,
    answer: correctIndex,
    correctExplanation,
    optionExplanations: arrangedExplanations(correctExplanation, distractorExplanations, correctIndex),
    visual: generatedVisual(deck, slide, supplementalIndex),
  }
}

function expandQuizToTarget(deck: Deck, baseQuestions: LegacyQuizQuestion[]) {
  const normalizedBase = baseQuestions.slice(0, targetQuizCountPerDeck)
  if (normalizedBase.length >= targetQuizCountPerDeck) return normalizedBase

  const needed = targetQuizCountPerDeck - normalizedBase.length
  const supplemental = selectedSupplementalSlides(deck, needed).map((slide, supplementalIndex) =>
    generatedLegacyQuestion(deck, slide, supplementalIndex, normalizedBase.length + supplementalIndex),
  )
  return [...normalizedBase, ...supplemental]
}

export function getDeckQuiz(deck: Deck): RichQuizQuestion[] {
  const baseQuestions = advancedQuiz[deck.id] ?? deck.quiz.map(normalizeQuestion)
  return expandQuizToTarget(deck, baseQuestions).map((question, index) =>
    ensureQuizQuestionSchema(deck, buildQuestion(deck, question, index)),
  )
}

export function getRichQuizCount(decks: Deck[]) {
  return decks.reduce((total, deck) => total + getDeckQuiz(deck).length, 0)
}
