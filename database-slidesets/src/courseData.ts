export type Slide = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  bridge?: string
  example?: string
  codeTitle?: string
  codeAnalysis?: string[]
  terms?: ConceptTerm[]
  checks?: string[]
}

export type ConceptTerm = {
  term: string
  definition: string
  logic: string
}

export type QuizQuestion = {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export type Deck = {
  id: string
  number: string
  title: string
  subtitle: string
  minutes: number
  level: string
  accent: string
  goals: string[]
  missingLinks: string[]
  slides: Slide[]
  quiz: QuizQuestion[]
}

const baseDecks: Deck[] = [
  {
    id: 'ddl',
    number: '01',
    title: 'DDL and Schema Contracts',
    subtitle: 'Turn requirements into tables that the DBMS can defend.',
    minutes: 18,
    level: 'Foundation',
    accent: '#2f7d6b',
    goals: [
      'Read CREATE TABLE statements as enforceable design decisions.',
      'Choose primary keys, foreign keys, defaults, uniqueness, and nullability from requirements.',
      'Separate what DDL can enforce from logic that belongs in queries, procedures, triggers, or applications.',
    ],
    missingLinks: [
      'A foreign key is not only a relationship label. It is a rule for allowed values and for what happens when referenced values change.',
      'A schema can be syntactically valid and still miss business workflow rules such as inventory movement after rental.',
      'Subtype tables such as PC, Laptop, and Printer work because the shared Product key controls identity.',
    ],
    slides: [
      {
        eyebrow: 'Course map',
        title: 'DDL is the handoff from design to the DBMS.',
        body: 'The DDL slides repeat the course path: real-world facts become an E/R model, then a relational schema, then a better schema, then actual DBMS tables that applications use.',
        bullets: [
          'The table definition is where names, domains, keys, and constraints become executable.',
          'DDL turns a model into a contract: invalid rows should be rejected before queries ever see them.',
          'The sample schemas are small enough to inspect but rich enough to show most constraint choices.',
        ],
        bridge: 'The missing step is to ask what can be checked row-by-row, what needs a relationship check, and what needs procedural workflow logic.',
      },
      {
        eyebrow: 'Keys',
        title: 'Primary keys define identity; foreign keys define allowed references.',
        body: 'Redbox uses single-column keys for Customer, Movie, and Redbox, but composite keys for MovieCopy and RedboxInventory. Pizza uses junction tables to model many-to-many facts.',
        bullets: [
          'Primary key: the minimal values that identify a tuple.',
          'Foreign key: values must match referenced key values or be null when permitted.',
          'Composite key: identity depends on a combination, such as movie_id plus copy_num.',
        ],
        example: 'MovieCopy(movie_id, copy_num) and RedboxInventory(movie_id, copy_num) show how the copy identity follows the physical item.',
      },
      {
        eyebrow: 'Integrity actions',
        title: 'Cascades encode what should survive a delete or update.',
        body: 'The Pizza schema is a useful contrast: deleting a patron cascades Likes and Frequents, while deleting a favorite pizza sets Patron.fav_pizza to null.',
        bullets: [
          'ON DELETE CASCADE removes dependent facts that no longer make sense alone.',
          'ON DELETE SET NULL keeps the row but clears an optional reference.',
          'ON DELETE NO ACTION blocks the change when dependent data must be preserved.',
        ],
        bridge: 'When the source files jump from syntax to examples, the design question is: should the child fact disappear, remain unknown, or block the parent change?',
      },
      {
        eyebrow: 'Subtype pattern',
        title: 'Computer Products models one identity across several detail tables.',
        body: 'Product stores manufacturer, model, and type. PC, Laptop, and Printer store type-specific attributes while reusing Product.model as both primary key and foreign key.',
        bullets: [
          'The shared key keeps every detailed product tied to exactly one Product row.',
          'UNION queries are needed when a question spans all product subtypes.',
          'The type column is a promise that the right detail table should exist, but plain DDL may not fully enforce that promise.',
        ],
        example: 'Product(model 2001, type laptop) should pair with Laptop(model 2001), not PC or Printer.',
      },
      {
        eyebrow: 'Boundary',
        title: 'DDL prevents bad states, but it does not run the business.',
        body: 'Redbox comments describe workflow expectations, such as removing inventory when rented and adding it when returned. Those cannot be expressed by simple foreign keys.',
        bullets: [
          'Constraints enforce static facts about rows and references.',
          'Queries reveal current state, such as in-stock versus rented-out copies.',
          'Stored modules, triggers, or application code handle multi-step state transitions.',
        ],
        checks: ['Can the rule be checked from one row?', 'Does it require another table?', 'Does it require a before/after event?'],
      },
    ],
    quiz: [
      {
        prompt: 'Why is MovieCopy keyed by both movie_id and copy_num?',
        options: ['Because copy numbers are only unique within a movie', 'Because MySQL requires two-part keys for media tables', 'Because every movie has exactly one copy', 'Because copy_num is a foreign key to Movie'],
        answer: 0,
        explanation: 'The copy number restarts for each movie, so identity requires the movie and the copy number together.',
      },
      {
        prompt: 'Which action best fits Patron.fav_pizza when a pizza is deleted but the patron should remain?',
        options: ['ON DELETE SET NULL', 'ON DELETE CASCADE', 'ON UPDATE NO ACTION', 'DROP TABLE Patron'],
        answer: 0,
        explanation: 'The favorite pizza is optional; clearing the reference preserves the patron row.',
      },
      {
        prompt: 'What does the Product/PC/Laptop/Printer schema teach?',
        options: ['A supertype table can hold shared identity while subtype tables hold specialized attributes', 'All products must have identical columns', 'Foreign keys replace the need for SELECT queries', 'UNION is never needed with subtype tables'],
        answer: 0,
        explanation: 'The model uses Product as the shared identity table and separate subtype tables for different attributes.',
      },
      {
        prompt: 'Which rule is least likely to be enforced by plain DDL alone?',
        options: ['Remove a movie copy from inventory when it is rented', 'No two customers share an email', 'A rental item references an existing rental order', 'A movie rating is one of a fixed list'],
        answer: 0,
        explanation: 'Inventory movement is workflow logic across time; keys, unique constraints, and enums cover the other examples.',
      },
    ],
  },
  {
    id: 'dml',
    number: '02',
    title: 'SQL DML Query Thinking',
    subtitle: 'Shape rows into answers with SELECT, expressions, grouping, and verification.',
    minutes: 20,
    level: 'Core SQL',
    accent: '#6a5acd',
    goals: [
      'Read a SELECT query in logical processing order.',
      'Use expressions, functions, aggregates, GROUP BY, and HAVING deliberately.',
      'Test a query against expected data, not just against syntax success.',
    ],
    missingLinks: [
      'SQL text order is not the same as logical evaluation order.',
      'A query that runs can still answer the wrong question if the join grain or grouping grain is wrong.',
      'Homework restrictions such as no SELECT star and no JOIN keyword are forcing precision, not arbitrary formatting.',
    ],
    slides: [
      {
        eyebrow: 'Logical order',
        title: 'Read SELECT as a data pipeline.',
        body: 'The DML slides show SELECT syntax, but the query becomes easier when read as FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.',
        bullets: [
          'FROM chooses the starting row combinations.',
          'WHERE removes rows before aggregation.',
          'GROUP BY changes the grain from rows to groups.',
          'HAVING removes groups after aggregation.',
          'SELECT computes the displayed columns.',
        ],
        bridge: 'The missing logic is that every clause either changes which rows exist, what the current grain is, or how the answer is displayed.',
      },
      {
        eyebrow: 'Expressions',
        title: 'Output columns can be computed, renamed, and formatted.',
        body: 'H5 asks for movie length as hours and minutes. That requires arithmetic and string functions, not a new stored column.',
        bullets: [
          'Use FLOOR(length / 60) for hours.',
          'Use MOD(length, 60) for remaining minutes.',
          'Use CONCAT(...) AS length to name the presentation column.',
        ],
        example: "CONCAT(FLOOR(length / 60), 'h', MOD(length, 60), 'm') AS length",
      },
      {
        eyebrow: 'Aggregation',
        title: 'GROUP BY answers one row per group.',
        body: 'Redbox and Computer Products exercises ask for counts, max rates, totals, average prices, and min/max screen sizes. Each aggregate must match the grouping grain.',
        bullets: [
          'Group by city and state when a city is identified by both values.',
          'Group by rental_id when summarizing each rental order.',
          'Group by manufacturer when counting products made by each manufacturer.',
        ],
        checks: ['What is one output row supposed to represent?', 'Are all non-aggregate SELECT columns part of that grain?'],
      },
      {
        eyebrow: 'Old-style joins',
        title: 'A comma in FROM still creates a join when WHERE connects rows.',
        body: 'H5 bans the JOIN keyword, so Redbox solutions use multiple tables in FROM and join predicates in WHERE.',
        bullets: [
          'FROM Movie M, RentalItem RI creates candidate combinations.',
          'WHERE M.movie_id = RI.movie_id keeps matching movie rows.',
          'Additional filters answer the question, such as RI.rental_id = 2.',
        ],
        bridge: 'The syntax changes later, but the concept does not: join conditions prevent accidental cartesian products.',
      },
      {
        eyebrow: 'Verification',
        title: 'A query is correct only if its result matches the story.',
        body: 'The H5 prompt explicitly warns that a query may run but be logically wrong. Good SQL work includes predicting rows before trusting output.',
        bullets: [
          'Check whether duplicates should remain or be removed.',
          'Check null behavior, especially with returned versus outstanding rentals.',
          'Check ties before using shortcuts that return only one row.',
        ],
        example: 'Rental order 2 can have returned and unreturned items, so NULL tests matter more than syntax.',
      },
    ],
    quiz: [
      {
        prompt: 'Which clause filters groups after COUNT, AVG, or MAX has been computed?',
        options: ['HAVING', 'WHERE', 'FROM', 'ORDER BY'],
        answer: 0,
        explanation: 'WHERE filters rows before grouping; HAVING filters groups after aggregate values exist.',
      },
      {
        prompt: 'In the no-JOIN-keyword style, where should the table-matching condition usually go?',
        options: ['WHERE', 'SELECT', 'ORDER BY', 'DROP TABLE'],
        answer: 0,
        explanation: 'With comma-separated tables, the WHERE clause holds both join predicates and ordinary filters.',
      },
      {
        prompt: 'What is the main risk of a SQL query that runs without errors?',
        options: ['It may still answer a different logical question', 'It always changes stored data', 'It cannot use aliases', 'It ignores primary keys automatically'],
        answer: 0,
        explanation: 'SQL syntax success does not prove the row grain, grouping, joins, or null tests match the request.',
      },
      {
        prompt: 'For "number of Redboxes in each city and state", what is the correct grouping grain?',
        options: ['city, state', 'redbox_id', 'street', 'status only'],
        answer: 0,
        explanation: 'The prompt identifies a city by city and state together, so both attributes define the group.',
      },
    ],
  },
  {
    id: 'joins-subqueries',
    number: '03',
    title: 'Joins, Subqueries, and Set Logic',
    subtitle: 'Choose between row matching and nested membership tests.',
    minutes: 22,
    level: 'Core SQL',
    accent: '#b85c38',
    goals: [
      'Use joins when the answer needs columns from related rows.',
      'Use subqueries for membership, exclusion, scalar comparisons, and tie-aware maxima.',
      'Translate union, intersection, and difference into practical SQL patterns.',
    ],
    missingLinks: [
      'A join expands the row context; a subquery asks a separate question and uses its result as a condition.',
      'NOT IN can behave unexpectedly when the subquery can return NULL, so nullability matters.',
      'Top-with-ties is a comparison problem, not an ORDER BY plus LIMIT problem.',
    ],
    slides: [
      {
        eyebrow: 'Join model',
        title: 'Joins are controlled row combinations.',
        body: 'The joins slides start from a multi-table SELECT. Without a matching condition, SQL produces a cartesian product; with a condition, it keeps meaningful combinations.',
        bullets: [
          'Equi-join: rows match using equality between attributes.',
          'Theta join: rows match using another comparison.',
          'Self-join: one table appears twice with aliases to compare rows inside the same relation.',
        ],
        example: 'Movie M and RentalItem I become useful when M.movie_id = I.movie_id.',
      },
      {
        eyebrow: 'Subquery model',
        title: 'A subquery is a query used as data by another query.',
        body: 'The subquery slides and Redbox examples use scalar results, sets of values, and grouped results inside outer query conditions.',
        bullets: [
          'Scalar: length < (SELECT AVG(length) FROM Movie).',
          'Membership: movie_id IN (SELECT movie_id FROM RedboxInventory).',
          'Exclusion: manufacturer NOT IN (...).',
          'Comparison to all groups: COUNT(*) >= ALL (...).',
        ],
        bridge: 'The missing mental model is type matching: one value compares to one value, one value compares to a set, and one group result compares to other group results.',
      },
      {
        eyebrow: 'Ties',
        title: 'Use ALL when the question says "most" but ties must remain.',
        body: 'H5-1 and redbox_subqueries avoid ORDER BY plus LIMIT. They compare each group count to all group counts so every tied maximum survives.',
        bullets: [
          'GROUP BY movie_id counts rentals per movie.',
          'HAVING COUNT(*) >= ALL (...) keeps every maximum count.',
          'This pattern also works for cheapest, most expensive, youngest, or largest groups.',
        ],
        example: 'HAVING COUNT(*) >= ALL (SELECT COUNT(*) FROM RentalItem GROUP BY movie_id)',
      },
      {
        eyebrow: 'Set operations',
        title: 'Union, intersection, and difference are query patterns.',
        body: 'Pizza practice connects relational algebra set logic to SQL with UNION, IN, and NOT IN.',
        bullets: [
          'Union: SELECT patrons from Likes UNION SELECT patrons from Frequents.',
          'Intersection: pizza liked by one person and IN the pizzas liked by another.',
          'Difference: pizza NOT IN the set served below a price threshold.',
        ],
        bridge: 'When the slides jump between algebra and SQL, remember that SQL can express the same idea either as a set operator or as membership tests.',
      },
      {
        eyebrow: 'Decision rule',
        title: 'Join when you need the joined row; subquery when you need the result of another question.',
        body: 'The cleanest solution often depends on whether the outer answer needs attributes from the related table or only needs to know whether matching rows exist.',
        bullets: [
          'Use a join to display movie title with rental rate.',
          'Use a subquery to find movies shorter than average.',
          'Use a grouped subquery to compare each group to peer groups.',
        ],
        checks: ['Do I need columns from the other table?', 'Am I comparing against a list or aggregate result?', 'Should ties be preserved?'],
      },
    ],
    quiz: [
      {
        prompt: 'What happens when two tables appear in FROM with no join condition?',
        options: ['A cartesian product', 'A primary key is created', 'Only matching rows are kept automatically', 'The query cannot run'],
        answer: 0,
        explanation: 'Without a condition, every row from one table combines with every row from the other.',
      },
      {
        prompt: 'Which pattern preserves all movies tied for most rentals?',
        options: ['GROUP BY movie_id HAVING COUNT(*) >= ALL (...)', 'ORDER BY COUNT(*) DESC LIMIT 1', 'WHERE rental_id = MAX(rental_id)', 'SELECT DISTINCT title only'],
        answer: 0,
        explanation: 'Comparing each count to all counts keeps every group whose count equals the maximum.',
      },
      {
        prompt: 'Which SQL idea best matches relational difference?',
        options: ['NOT IN or EXCEPT-style exclusion', 'COUNT only', 'ORDER BY only', 'A cartesian product'],
        answer: 0,
        explanation: 'Difference means values in one set but not another, commonly expressed with NOT IN in these files.',
      },
      {
        prompt: 'When should a scalar subquery be used?',
        options: ['When the inner query returns one value, such as AVG(length)', 'When the inner query returns every movie title', 'Only with INSERT statements', 'Only after GROUP BY'],
        answer: 0,
        explanation: 'A scalar subquery can be compared to a single outer value, like movie length against average length.',
      },
    ],
  },
  {
    id: 'relational-algebra',
    number: '04',
    title: 'Relational Algebra as Query Logic',
    subtitle: 'Use algebra to see the shape of a query before writing SQL.',
    minutes: 21,
    level: 'Theory to SQL',
    accent: '#4f6f52',
    goals: [
      'Identify the purpose of each core algebra operator.',
      'Track result schemas after selection, projection, joins, and set operations.',
      'Translate algebra expressions into SQL and SQL prompts back into algebra plans.',
    ],
    missingLinks: [
      'Projection changes columns, selection changes rows, and join changes both row combinations and available attributes.',
      'Relational algebra is set-based by default; SQL often keeps duplicates unless DISTINCT is used.',
      'Rename is not cosmetic. It makes self-joins and attribute disambiguation possible.',
    ],
    slides: [
      {
        eyebrow: 'Operators',
        title: 'Algebra is a small language for building relations.',
        body: 'The Week 05 slides define operands, operators, and expressions. Each operator consumes a relation and produces a relation, so operations can be composed.',
        bullets: [
          'Selection \u03c3_C(R): keep rows satisfying condition C.',
          'Projection \u03c0_A,B(R): keep selected attributes.',
          'Rename \u03c1_X(R): give a relation or attribute a temporary name.',
          'Union \u222a, difference \u2212, and intersection \u2229 combine compatible relations.',
        ],
        bridge: 'The missing connection is that algebra is not separate from SQL; it is the plan underneath a SELECT statement.',
      },
      {
        eyebrow: 'Schemas',
        title: 'Every algebra expression has a result schema.',
        body: 'The Computer Products practice asks for final result schemas because a query answer is still a relation. Knowing its columns prevents vague answers.',
        bullets: [
          'Selection keeps the same schema as the input.',
          'Projection changes the schema to the projected attributes.',
          'Join combines attributes from both inputs, with matching attributes handled by the join form.',
        ],
        example: '\u03c0_model(\u03c3_speed >= 3.00(PC)) returns a one-column relation containing model.',
      },
      {
        eyebrow: 'Set compatibility',
        title: 'Union, difference, and intersection require compatible shapes.',
        body: 'Week 06 emphasizes that set operators append or compare rows. The operands must have the same number of columns with compatible types.',
        bullets: [
          'Use projection before union if two inputs have extra columns.',
          'Use rename when attribute names need to be aligned or clarified.',
          'SQL UNION also removes duplicates unless UNION ALL is requested.',
        ],
        bridge: 'A lot of SQL errors in multi-branch queries are really algebra shape errors.',
      },
      {
        eyebrow: 'Practice map',
        title: 'Pizza and Computer Products supply repeatable query drills.',
        body: 'The practice files ask for likes, frequents, served pizzas, product makers, printer types, laptop disks, and price comparisons.',
        bullets: [
          'Start by marking the base relations needed.',
          'Apply selections early when they clearly reduce rows.',
          'Project only after you no longer need hidden attributes for joins or filters.',
        ],
        checks: ['Which rows should survive?', 'Which columns are needed later?', 'Which relation names collide?'],
      },
      {
        eyebrow: 'SQL bridge',
        title: 'Relational algebra explains why SQL optimizers can rewrite queries.',
        body: 'If two SQL forms represent the same algebra expression, the DBMS can often transform one into the other. That is why query logic matters beyond homework notation.',
        bullets: [
          'Selection pushdown can reduce rows before joins.',
          'Projection can reduce carried columns when they are no longer needed.',
          'Join order can change when the relational result stays equivalent.',
        ],
        bridge: 'This connects algebra to indexes and storage later: the plan shape affects access cost.',
      },
    ],
    quiz: [
      {
        prompt: 'Which operator keeps rows but does not remove columns?',
        options: ['Selection', 'Projection', 'Union', 'Rename'],
        answer: 0,
        explanation: 'Selection filters tuples while preserving the input relation schema.',
      },
      {
        prompt: 'Why is rename important in algebra?',
        options: ['It enables disambiguation, especially for self-joins', 'It deletes duplicate rows', 'It sorts output', 'It creates foreign keys'],
        answer: 0,
        explanation: 'Rename gives temporary names to relations or attributes so expressions can refer to them clearly.',
      },
      {
        prompt: 'What must be true for union-compatible relations?',
        options: ['They have the same number of attributes with compatible types', 'They have the same primary key name', 'They come from the same table', 'They have no foreign keys'],
        answer: 0,
        explanation: 'Set operators need operands with matching shapes and compatible attribute domains.',
      },
      {
        prompt: 'What is the SQL duplicate behavior that differs from pure relational algebra?',
        options: ['SQL SELECT can keep duplicates unless DISTINCT is used', 'SQL never returns duplicates', 'SQL cannot project columns', 'SQL always requires rename'],
        answer: 0,
        explanation: 'Relational algebra is set-based; SQL query results may be bags unless DISTINCT or set operators remove duplicates.',
      },
    ],
  },
  {
    id: 'views',
    number: '05',
    title: 'Views and Query Layers',
    subtitle: 'Name a useful query without overcomplicating the next query.',
    minutes: 13,
    level: 'Design Pattern',
    accent: '#8a6f2a',
    goals: [
      'Explain what a view stores and what it does not store.',
      'Use views to simplify repeated logic and protect selected columns.',
      'Avoid unnecessary derived tables when a direct join expresses the same result.',
    ],
    missingLinks: [
      'A view is usually a stored query definition, not a copied table.',
      'A FROM-clause subquery is useful only when it changes the grain, filters before aggregation, or gives a reusable intermediate result.',
      'Views sit between schema design and application code as a named interface.',
    ],
    slides: [
      {
        eyebrow: 'Definition',
        title: 'A view gives a query a relation name.',
        body: 'Week08 connects views to query simplification. A view lets later queries treat a SELECT result like a relation.',
        bullets: [
          'The view definition is stored in the database catalog.',
          'The underlying base tables remain the source of truth.',
          'Applications can query the view without knowing every join detail.',
        ],
        example: 'CREATE VIEW ActiveMovies AS SELECT ...',
      },
      {
        eyebrow: 'Simplification',
        title: 'Do not wrap a query just to select from it again.',
        body: 'The Week08 notes warn against unnecessary FROM subqueries. If the outer query only projects or filters what a join could already produce, write the join directly.',
        bullets: [
          'Derived tables are useful when they create an intermediate grain.',
          'They are noise when they simply hide a normal join.',
          'Views are valuable when the same expression is reused or intentionally abstracted.',
        ],
        bridge: 'The missing judgment is to ask what new relation the subquery is creating. If there is no new grain, simplify.',
      },
      {
        eyebrow: 'Security and interface',
        title: 'Views can expose less than the base table.',
        body: 'A view can publish columns and rows appropriate for a use case while hiding implementation details or sensitive attributes.',
        bullets: [
          'Expose customer contact fields without reward internals.',
          'Expose inventory availability without rental workflow details.',
          'Keep application queries stable while base schema changes internally.',
        ],
      },
      {
        eyebrow: 'Updatability',
        title: 'Not every view should be updated.',
        body: 'Simple single-table views may be updatable, but grouped views, unions, and many joins often cannot map one output row back to one base row unambiguously.',
        bullets: [
          'Aggregates collapse many rows into one result.',
          'UNION combines rows from multiple branches.',
          'Joins can make it unclear which base row should receive a change.',
        ],
        checks: ['Does each view row map to exactly one base row?', 'Are computed columns being edited?', 'Would the edit violate base constraints?'],
      },
    ],
    quiz: [
      {
        prompt: 'What is usually stored for a standard SQL view?',
        options: ['The query definition', 'A separate copy of every result row', 'A Java classpath', 'An index block'],
        answer: 0,
        explanation: 'A standard view is generally a named query definition over base tables.',
      },
      {
        prompt: 'When is a FROM-clause subquery most justified?',
        options: ['When it creates a useful intermediate result or grain', 'Whenever a query uses two tables', 'Only because joins are not allowed', 'When ORDER BY is missing'],
        answer: 0,
        explanation: 'Derived tables are useful when they shape data in a way the outer query genuinely needs.',
      },
      {
        prompt: 'Which view is least likely to be directly updatable?',
        options: ['A grouped aggregate view', 'A simple one-table projection', 'A one-table selection', 'A view that renames one column'],
        answer: 0,
        explanation: 'Aggregate rows do not map cleanly back to individual base rows.',
      },
      {
        prompt: 'What is a practical reason to use a view?',
        options: ['Hide complexity or sensitive columns behind a named interface', 'Bypass all foreign keys', 'Guarantee faster performance every time', 'Replace all indexes'],
        answer: 0,
        explanation: 'Views are useful for abstraction and controlled exposure, though they do not automatically replace constraints or indexes.',
      },
    ],
  },
  {
    id: 'normalization',
    number: '06',
    title: 'Normalization and Dependencies',
    subtitle: 'Remove redundancy without losing the facts you need.',
    minutes: 23,
    level: 'Design Theory',
    accent: '#2f6f9f',
    goals: [
      'Identify insertion, deletion, and update anomalies caused by redundancy.',
      'Use functional dependencies to reason about keys and normal forms.',
      'Evaluate decompositions for lossless join and dependency preservation.',
    ],
    missingLinks: [
      'A functional dependency is a promise about all legal database states, not just the current rows.',
      'Normalization is not about making more tables for its own sake. It is about placing facts at their natural key.',
      'A decomposition must be tested so the original information can be reconstructed correctly.',
    ],
    slides: [
      {
        eyebrow: 'Anomalies',
        title: 'Redundancy is the root problem normalization attacks.',
        body: 'Normalization.pdf begins with update anomalies. The problem is not duplicate-looking text; it is storing one fact in multiple places where it can drift.',
        bullets: [
          'Insertion anomaly: cannot add a fact without unrelated facts.',
          'Deletion anomaly: removing one row accidentally removes another fact.',
          'Update anomaly: the same fact must be changed in several rows.',
        ],
        bridge: 'The missing question is: what fact does each row represent, and what key naturally determines it?',
      },
      {
        eyebrow: 'Functional dependencies',
        title: 'A -> B means A determines B in every valid instance.',
        body: 'H9 starts with legal tuple insertion under dependencies. That forces you to check whether a new row agrees with existing rows that have the same determinant.',
        bullets: [
          'If A -> B, two rows with the same A must have the same B.',
          'Dependencies come from meaning and requirements, not from SQL syntax alone.',
          'Candidate keys are attribute sets that determine all attributes and are minimal.',
        ],
        example: 'If serialno identifies a hard drive, serialno -> model, batch, capacity, and other drive properties.',
      },
      {
        eyebrow: '1NF',
        title: 'First normal form keeps values atomic.',
        body: 'Normalization-Day2 emphasizes that a 1NF relation cannot store sets of values or nested relations inside one attribute.',
        bullets: [
          'Atomic values are single values from the attribute domain.',
          'Repeated phone numbers belong in a separate relation if they are multiple facts.',
          'A table with a primary key is normally treated as a 1NF relation in relational DBMS practice.',
        ],
      },
      {
        eyebrow: 'Higher normal forms',
        title: '2NF, 3NF, and BCNF move facts to the key that determines them.',
        body: 'The conceptual progression is to eliminate partial and transitive dependency problems, then aim for every determinant to be a key when BCNF is possible.',
        bullets: [
          '2NF addresses non-key attributes depending on part of a composite key.',
          '3NF addresses non-key attributes depending on other non-key attributes.',
          'BCNF is stricter: every nontrivial determinant should be a superkey.',
        ],
        bridge: 'The slides can feel like formulas; the practical lens is simpler: no fact should be stored at the wrong grain.',
      },
      {
        eyebrow: 'Decomposition',
        title: 'Splitting tables must preserve meaning.',
        body: 'A decomposition is useful only if it removes bad dependencies while still allowing correct reconstruction and enforcing important dependencies.',
        bullets: [
          'Lossless join: joining decomposed relations does not create spurious tuples.',
          'Dependency preservation: important rules can still be checked without recombining everything.',
          'Some designs trade perfect normal form for practical enforcement or performance, but the tradeoff should be deliberate.',
        ],
        checks: ['What dependency caused the split?', 'Which attributes are shared?', 'Can the original rows be recovered?'],
      },
    ],
    quiz: [
      {
        prompt: 'What does A -> B mean?',
        options: ['Rows with the same A must have the same B', 'A and B must be primary keys', 'B always appears before A in SQL', 'A table can have only A and B'],
        answer: 0,
        explanation: 'A functional dependency says the determinant value fixes the dependent value in every valid instance.',
      },
      {
        prompt: 'Which anomaly loses information when a row is removed?',
        options: ['Deletion anomaly', 'Insertion anomaly', 'Projection anomaly', 'Index anomaly'],
        answer: 0,
        explanation: 'A deletion anomaly occurs when deleting one fact unintentionally deletes another fact.',
      },
      {
        prompt: 'What does 1NF reject?',
        options: ['Set-valued or nested attribute values', 'Primary keys', 'Foreign keys', 'Atomic strings'],
        answer: 0,
        explanation: '1NF requires atomic attribute values and no nested relation values in a field.',
      },
      {
        prompt: 'What is a lossless decomposition?',
        options: ['One that can be joined back without spurious rows', 'One that deletes all foreign keys', 'One that always improves speed', 'One that removes all attributes'],
        answer: 0,
        explanation: 'Lossless join means the decomposed tables can reconstruct the original relation correctly.',
      },
    ],
  },
  {
    id: 'modules-triggers',
    number: '07',
    title: 'Stored Modules and Triggers',
    subtitle: 'Move from declarative answers to database-side behavior.',
    minutes: 19,
    level: 'Advanced SQL',
    accent: '#a14766',
    goals: [
      'Explain why stored procedures use parameters, variables, loops, and delimiters.',
      'Understand trigger event-condition-action logic.',
      'Choose between constraints, procedures, triggers, and application code for database behavior.',
    ],
    missingLinks: [
      'Stored procedures are invoked deliberately; triggers run because an event happens.',
      'DELIMITER is a client parsing tool, not part of the stored procedure logic itself.',
      'Procedural SQL is useful for workflow, but it increases hidden side effects if overused.',
    ],
    slides: [
      {
        eyebrow: 'Stored modules',
        title: 'Stored procedures package database work into one callable unit.',
        body: 'StoredModules.pdf introduces precompiled SQL code stored at the database. Procedures can take IN, OUT, and INOUT parameters and can execute multiple statements.',
        bullets: [
          'IN parameters provide values to the procedure.',
          'OUT parameters return values to the caller.',
          'Variables and loops allow repeated work close to the data.',
        ],
        bridge: 'The missing connection from DML is control flow: SELECT answers a question, while a procedure can perform a sequence.',
      },
      {
        eyebrow: 'H8 procedure',
        title: 'create_copies combines lookup, loop, insert, and output.',
        body: 'The H8 prompt and answer ask for a procedure that creates N new DVD copies for a movie and returns the last copy number created.',
        bullets: [
          'Find the current maximum copy_num for the movie.',
          'Start at max plus one, or one when no copies exist.',
          'Loop until the requested number of new copies has been inserted.',
          'Set the OUT parameter to the final copy number.',
        ],
        example: 'CALL create_copies(4, 1000, @last);',
      },
      {
        eyebrow: 'Triggers',
        title: 'A trigger is an event-condition-action rule.',
        body: 'Triggers.pdf frames triggers as logic that runs when a defined event occurs. The DBMS checks a condition and performs an action when the condition is satisfied.',
        bullets: [
          'Event: INSERT, UPDATE, or DELETE on a table.',
          'Condition: optional test against old and new values.',
          'Action: SQL statements executed by the trigger.',
        ],
        bridge: 'This fills the gap left by DDL comments, such as inventory movement after rentals and returns.',
      },
      {
        eyebrow: 'Design choice',
        title: 'Use the narrowest mechanism that enforces the rule clearly.',
        body: 'Constraints, stored procedures, triggers, and application code all protect different kinds of rules.',
        bullets: [
          'Use constraints for static row and reference validity.',
          'Use procedures for explicit multi-step database operations.',
          'Use triggers for automatic reaction to table events.',
          'Use application code for user workflow, validation messages, and UI-specific decisions.',
        ],
        checks: ['Is the rule always true?', 'Does it require a specific event?', 'Should callers opt into this operation?'],
      },
    ],
    quiz: [
      {
        prompt: 'What is the role of an OUT parameter?',
        options: ['Return a value from a procedure to the caller', 'Filter rows before GROUP BY', 'Define a foreign key', 'Start an SSH tunnel'],
        answer: 0,
        explanation: 'OUT parameters let stored procedures assign values that the caller can read after execution.',
      },
      {
        prompt: 'Why is DELIMITER used around MySQL procedure definitions?',
        options: ['So the client does not stop at semicolons inside the procedure body', 'To create a primary key', 'To speed up every query', 'To encrypt source code'],
        answer: 0,
        explanation: 'Changing the delimiter lets the client send the whole procedure definition as one statement.',
      },
      {
        prompt: 'What phrase best describes a trigger?',
        options: ['Event-condition-action rule', 'Static table comment', 'A Java classpath setting', 'A dense index block'],
        answer: 0,
        explanation: 'Triggers run in response to table events, optionally check conditions, and execute actions.',
      },
      {
        prompt: 'Which mechanism best enforces "email values must be unique"?',
        options: ['A UNIQUE constraint', 'A loop in a procedure only', 'A view only', 'A buffer manager'],
        answer: 0,
        explanation: 'Uniqueness is static data integrity, so a UNIQUE constraint is direct and reliable.',
      },
    ],
  },
  {
    id: 'storage-indexes',
    number: '08',
    title: 'Storage, Buffers, and Indexes',
    subtitle: 'Understand why physical access paths change query cost.',
    minutes: 24,
    level: 'Systems',
    accent: '#c07a28',
    goals: [
      'Explain records, blocks, buffer pools, page pins, and dirty pages.',
      'Classify primary, secondary, sparse, and dense indexes.',
      'Describe ordered indexes, hash indexes, and B+-tree behavior.',
    ],
    missingLinks: [
      'A query plan is expensive mostly because of data movement, not because comparison operators are hard.',
      'Sparse indexes require ordered data because missing index entries must still guide a scan.',
      'B+-trees solve the maintenance problem that plain ordered index files create as data grows.',
    ],
    slides: [
      {
        eyebrow: 'Storage goal',
        title: 'The DBMS is managing expensive movement between disk and memory.',
        body: 'StorageManagement-Monday reintroduces the database as organized data on storage. The cost model starts with records grouped into blocks and blocks moved into memory.',
        bullets: [
          'Rows live in files made of pages or disk blocks.',
          'The DBMS tries to read as few blocks as possible.',
          'File organization affects whether useful rows are clustered or scattered.',
        ],
        bridge: 'This connects back to relational algebra: an equivalent query plan can be much cheaper if it touches fewer blocks.',
      },
      {
        eyebrow: 'Buffer manager',
        title: 'The buffer pool is the working set of disk pages in memory.',
        body: 'StorageManagement-Wednesday defines buffer, buffer manager, and buffer pool. Clients pin pages while using them, then unpin pages when finished.',
        bullets: [
          'If a requested page is already buffered, no disk read is needed.',
          'If the buffer is full, an unpinned page may be evicted.',
          'Dirty pages must be written back before eviction if they changed.',
        ],
        checks: ['Is the page in memory?', 'Is there free buffer space?', 'Is the victim page dirty?', 'Is the page pinned?'],
      },
      {
        eyebrow: 'Index categories',
        title: 'Indexes are access paths from search keys to records.',
        body: 'Indexes-part1 distinguishes primary and secondary indexes, then sparse and dense indexes.',
        bullets: [
          'Primary index: search key matches the physical ordering key of the data file.',
          'Secondary index: search key is not the physical ordering key.',
          'Dense index: every search key or record has an index entry.',
          'Sparse index: only some search keys have entries and the data must be ordered.',
        ],
        bridge: 'The missing logic is that sparse entries work only when the data between entries is predictably ordered.',
      },
      {
        eyebrow: 'B+-tree',
        title: 'B+-trees keep ordered indexes balanced as data changes.',
        body: 'Indexes-part2 introduces B+-trees as balanced trees where every root-to-leaf path has the same length and leaves point to data records.',
        bullets: [
          'Internal nodes guide search through key ranges.',
          'Leaf nodes hold data pointers and are linked for range scans.',
          'Splits and merges maintain balance as rows are inserted or deleted.',
        ],
        example: 'A B+-tree index on cust_name supports ordered lookup and range scans without scanning every Customer block.',
      },
      {
        eyebrow: 'H10 bridge',
        title: 'Index homework asks you to classify before drawing.',
        body: 'H10 gives Customer records in disk blocks, then asks whether a primary or sparse index can be built and how many index blocks a single-level ordered index needs.',
        bullets: [
          'Check whether the data file is ordered on the search key.',
          'Decide whether entries point to every record or only block anchors.',
          'Use index-entry capacity to compute index block count.',
        ],
        checks: ['What is the search key?', 'What is the data file order?', 'How many entries are required?', 'How many entries fit per block?'],
      },
    ],
    quiz: [
      {
        prompt: 'Why can a sparse index require ordered data?',
        options: ['Because missing entries rely on nearby ordered blocks being searchable', 'Because SQL forbids dense indexes', 'Because every sparse index is a hash table', 'Because pages cannot be pinned'],
        answer: 0,
        explanation: 'Sparse entries guide a scan into an ordered file; without ordering, skipped keys could be anywhere.',
      },
      {
        prompt: 'What does pinning a page mean?',
        options: ['A client is using it, so it should not be evicted', 'The page is deleted from disk', 'The page becomes a primary key', 'The page is converted to SQL'],
        answer: 0,
        explanation: 'Pinned pages are currently in use and should not be selected as eviction victims.',
      },
      {
        prompt: 'Which index is built on a search key different from the data file ordering key?',
        options: ['Secondary index', 'Primary index', 'Heap file', 'Foreign key'],
        answer: 0,
        explanation: 'A secondary index provides an access path on a non-ordering attribute.',
      },
      {
        prompt: 'What makes a B+-tree balanced?',
        options: ['Every path from root to leaf has the same length', 'Every leaf has one record only', 'Every node is a SQL table', 'Every key is stored in random order'],
        answer: 0,
        explanation: 'Balanced height keeps lookup cost predictable as the index grows.',
      },
    ],
  },
  {
    id: 'jdbc',
    number: '09',
    title: 'JDBC and Deployment Path',
    subtitle: 'Connect Java code, the driver, the tunnel, and the database safely.',
    minutes: 17,
    level: 'Application',
    accent: '#5f7d2f',
    goals: [
      'Explain the runtime pieces needed for a Java program to talk to MySQL.',
      'Use Statement, PreparedStatement, CallableStatement, and result processing appropriately.',
      'Understand local port forwarding for database access through the webdev server.',
    ],
    missingLinks: [
      'JDBC is an API; Connector/J is the MySQL implementation of that API.',
      'The tunnel makes localhost:3306 behave like a path to the remote MySQL server.',
      'Prepared statements are not just cleaner syntax. They separate SQL structure from user-provided values.',
    ],
    slides: [
      {
        eyebrow: 'Architecture',
        title: 'A JDBC app needs code, a driver, credentials, and network reachability.',
        body: 'JDBC.pdf places database use inside application development. The connection text adds the practical setup: driver jar, classpath, Login.java, tunnel, and test program.',
        bullets: [
          'Java code calls JDBC interfaces.',
          'Connector/J implements those interfaces for MySQL.',
          'DriverManager opens a connection using URL, user, and password.',
          'The SSH tunnel routes local port 3306 to the server-side MySQL port.',
        ],
        bridge: 'The missing link is that a ClassNotFoundException is classpath, while a connection failure is usually credentials or network path.',
      },
      {
        eyebrow: 'Demo files',
        title: 'The class demos cover the common JDBC operations.',
        body: 'The zip contains JDBCTest, JDBCQuery, JDBCUpdate, JDBCPreparedQuery, JDBCPreparedUpdate, JDBCCallable, and Login.',
        bullets: [
          'JDBCTest confirms the connection stack works.',
          'JDBCQuery runs SELECT and reads ResultSet rows.',
          'JDBCUpdate runs INSERT, UPDATE, or DELETE.',
          'Prepared demos bind values safely.',
          'Callable demo invokes stored procedures.',
        ],
      },
      {
        eyebrow: 'Prepared statements',
        title: 'PreparedStatement keeps values out of the SQL string.',
        body: 'Instead of concatenating user input, prepare SQL with placeholders and bind values by position.',
        bullets: [
          'The DBMS can parse the SQL structure separately from data values.',
          'String quoting and escaping are handled by the driver.',
          'The code becomes less fragile when input contains special characters.',
        ],
        example: 'SELECT title, year FROM Movie WHERE film_rating = ?',
      },
      {
        eyebrow: 'Tunnel',
        title: 'Port forwarding creates the local endpoint your app uses.',
        body: 'The tunneling PDF maps local source port 3306 to localhost:3306 on webdev through SSH on port 1022.',
        bullets: [
          'Your Java app connects to localhost:3306.',
          'SSH carries the traffic to webdev.cs.uwosh.edu.',
          'The remote side forwards it to MySQL on the server.',
        ],
        bridge: 'This is why the Java URL can look local even when the database lives behind the server login.',
      },
    ],
    quiz: [
      {
        prompt: 'What is mysql-connector-j-8.0.32.jar used for?',
        options: ['It is the MySQL JDBC driver implementation', 'It is the database data file', 'It is a PDF reader', 'It is an SSH private key'],
        answer: 0,
        explanation: 'Connector/J provides the MySQL driver classes used by JDBC.',
      },
      {
        prompt: 'What does a PreparedStatement primarily improve?',
        options: ['Safe binding of values separate from SQL structure', 'Physical table order', 'Index block capacity', 'PDF page extraction'],
        answer: 0,
        explanation: 'Prepared statements use placeholders and bound values instead of SQL string concatenation.',
      },
      {
        prompt: 'In the tunnel instructions, what does local port 3306 represent to the Java app?',
        options: ['A local endpoint forwarded to remote MySQL', 'A new primary key', 'A stored procedure delimiter', 'A B+-tree leaf page'],
        answer: 0,
        explanation: 'The app connects locally, and SSH forwards that traffic to the remote MySQL service.',
      },
      {
        prompt: 'Which demo class is most likely to call a stored procedure?',
        options: ['JDBCCallable.java', 'JDBCQuery.java', 'Login.java', 'JDBCTest.java'],
        answer: 0,
        explanation: 'CallableStatement is the JDBC API for calling stored procedures.',
      },
    ],
  },
  {
    id: 'capstone-studio',
    number: '10',
    title: 'Database Capstone Architecture Studio',
    subtitle: 'Design a complete database-backed workflow from requirements to reliable operations.',
    minutes: 22,
    level: 'Capstone',
    accent: '#3f7cac',
    goals: [
      'Convert a full application scenario into schema contracts, query contracts, workflow operations, and operational checks.',
      'Choose which rules belong in DDL, views, procedures, triggers, indexes, transactions, and application code.',
      'Validate a design by tracing legal states, failure modes, performance paths, and deployment boundaries.',
    ],
    missingLinks: [
      'A capstone design is not a larger ER diagram. It is a chain of commitments: what rows mean, which states are legal, which queries expose contracts, and which operations preserve invariants.',
      'A correct query can still be the wrong interface if it exposes the wrong grain, hides an important failure mode, or relies on application discipline for a rule the database could enforce.',
      'Operational readiness means the same design survives invalid writes, concurrent workflows, growing data volume, prepared-statement execution, and recoverable debugging.',
    ],
    slides: [
      {
        eyebrow: 'Capstone case',
        title: 'Design the database for an equipment checkout service.',
        body: 'The capstone case is a campus equipment system where people reserve items, staff check items out and in, fees may be assessed, and administrators need reliable reports.',
        bullets: [
          'Core entities include Person, EquipmentItem, Reservation, Checkout, ReturnInspection, FeeAssessment, and Payment.',
          'The design must preserve inventory identity, borrower responsibility, audit history, current availability, and staff actions.',
          'The same case requires DDL constraints, SELECT contracts, transactional routines, indexes, and JDBC-safe execution.',
        ],
        bridge: 'The missing capstone habit is to treat every table, query, and routine as part of one enforceable system rather than isolated homework answers.',
      },
      {
        eyebrow: 'Schema contract',
        title: 'Row grain decides which constraints are trustworthy.',
        body: 'A checkout system has several tempting but different grains: one physical asset, one reservation request, one checkout event, one returned item inspection, and one chargeable fee.',
        bullets: [
          'EquipmentItem owns durable item identity and should not be replaced by a display name.',
          'Checkout is an event with borrower, item, staff member, due date, and state transition evidence.',
          'FeeAssessment is audit history and should not disappear merely because a checkout record is later corrected.',
        ],
        example: 'EquipmentItem(item_id) -> Checkout(item_id)\nCheckout(checkout_id) -> ReturnInspection(checkout_id)\nFeeAssessment(checkout_id) preserves audit evidence',
      },
      {
        eyebrow: 'Query contracts',
        title: 'Reports and screens need declared result grains.',
        body: 'A query becomes an interface when another screen, report, or program depends on its column names and row meaning. That interface should state whether one row means an item, a borrower, an active checkout, a day, or a staff workload bucket.',
        bullets: [
          'An availability screen should expose one row per item or item type, not a fanout of reservations and inspections.',
          'An overdue report should filter active checkout rows before grouping by borrower or item type.',
          'A staff workload dashboard should group by staff member and time window, then use HAVING for group-level thresholds.',
          'Views are useful when the row meaning is stable and repeated across callers.',
        ],
        checks: ['What does one output row represent?', 'Which joins can multiply that row?', 'Which predicates are row-level versus group-level?'],
      },
      {
        eyebrow: 'Workflow boundary',
        title: 'Checkout and return should be modeled as recoverable operations.',
        body: 'The hardest rules in a real system are often not single-column checks. They are transitions: reserve, check out, extend, mark damaged, assess fee, pay, waive, and close.',
        bullets: [
          'Use constraints for static truth such as item identity, borrower existence, nonnegative fees, and required dates.',
          'Use explicit routines or transactions for multi-row changes that must succeed or fail together.',
          'Use triggers narrowly for unavoidable event reactions, and document every side-effect table they can touch.',
        ],
        bridge: 'Workflow design should make the reason for every state change visible enough to debug and audit later.',
      },
      {
        eyebrow: 'Operational review',
        title: 'A finished design must survive growth, deployment, and debugging.',
        body: 'After the schema and SQL are logically correct, the design still needs physical and application-level review: indexes for the real workload, predictable resource lifetimes, safe value binding, and layered failure diagnosis.',
        bullets: [
          'Choose indexes from access patterns: active checkouts by due date, item lookup by barcode, and fee review by borrower.',
          'Bind all user values through PreparedStatement and keep identifiers on a validated internal list.',
          'Trace failures by layer: Java resource, driver, network path, authentication, SQL semantics, and transaction outcome.',
          'Validate the design with counterexample rows that should be rejected, preserved, or transformed.',
        ],
        example: 'CREATE INDEX idx_checkout_due_state ON Checkout(status, due_at);\nSELECT checkout_id, item_id, borrower_id\nFROM Checkout\nWHERE status = ? AND due_at < ?;',
      },
    ],
    quiz: [
      {
        prompt: 'Which design choice best preserves auditability when a returned item creates a damage fee?',
        options: ['Store FeeAssessment as its own row tied to the checkout and inspection', 'Overwrite the item name with a damage note', 'Delete the checkout after payment', 'Store only a boolean damaged flag on Person'],
        answer: 0,
        explanation: 'A separate fee row preserves who was charged, why, when, and from which checkout event the charge came.',
      },
      {
        prompt: 'What should drive an availability query for checkout inventory?',
        options: ['The intended output grain, such as one row per physical item or one row per item type', 'The longest table name', 'The order in which tables were created', 'The visual position of the table in an ER diagram'],
        answer: 0,
        explanation: 'Availability queries are wrong if they accidentally return reservation, inspection, or checkout-event grain when the screen needs item grain.',
      },
      {
        prompt: 'Which rule belongs most naturally in a transaction or stored routine rather than a single CHECK constraint?',
        options: ['Checking out an item should insert the checkout event and make the item unavailable together', 'A fee amount should be nonnegative', 'An item barcode should be unique', 'A checkout row must reference an existing borrower'],
        answer: 0,
        explanation: 'A checkout operation changes multiple facts together, while the other choices are static row or relationship constraints.',
      },
      {
        prompt: 'Which deployment habit best prevents SQL injection while keeping the query reusable?',
        options: ['Use PreparedStatement placeholders for user-supplied values', 'Concatenate all user text into the WHERE clause', 'Disable all foreign keys during login', 'Use a sparse index as a password check'],
        answer: 0,
        explanation: 'Prepared statements separate SQL structure from runtime values, allowing safe binding and predictable execution.',
      },
    ],
  },
]

type SubtopicExpansion = {
  focus: string
  title: string
  concept: string
  advancedLogic: string
  application: string
  example: string
  checks: string[]
  labTitle: string
  labBody: string
  labSteps: string[]
  labExample: string
  labChecks: string[]
}

type CodeTeachingExample = {
  title: string
  code: string
  analysis: string[]
}

const pageConceptTerms: ConceptTerm[] = [
  {
    term: 'mastery target',
    definition: 'A mastery target is the exact reasoning ability the page is training, stated as something the learner should be able to reconstruct without copying the slide wording.',
    logic: 'Use it to separate recognition from understanding: if the learner can apply the idea to a new schema, query, dataset, or runtime situation, the target has been met.',
  },
  {
    term: 'row grain',
    definition: 'Row grain is the real-world or logical unit represented by one tuple, output row, object state, or intermediate result row.',
    logic: 'Use row grain before syntax because keys, GROUP BY columns, joins, dependencies, and aggregates are correct only when they preserve the intended unit of meaning.',
  },
  {
    term: 'legal state',
    definition: 'A legal state is a database state that can exist without violating the intended constraints, dependencies, workflow assumptions, or query meaning.',
    logic: 'Use legal-state reasoning to distinguish data that is merely inconvenient from data the system must reject because it would make later reasoning false.',
  },
  {
    term: 'invariant',
    definition: 'An invariant is a fact that must remain true after every legal insert, delete, update, query transformation, routine call, trigger firing, or access-path choice.',
    logic: 'Use invariants to test whether a design survives future operations instead of only matching the current sample rows shown in a lecture or homework file.',
  },
  {
    term: 'application pattern',
    definition: 'An application pattern is a reusable way a database concept appears in a concrete schema, report, transaction, storage decision, or program interaction.',
    logic: 'Use patterns by stripping away the table names and asking what logical pressure remains: identity, reference, fanout, dependency, null behavior, cost, or state change.',
  },
  {
    term: 'syntax semantics',
    definition: 'Syntax semantics means reading each keyword, clause, column list, predicate, alias, or parameter as a statement about allowed values or computed meaning.',
    logic: 'Use it to avoid decorative SQL: every token should explain what rows exist, what values are legal, what grouping exists, or what operation boundary is being enforced.',
  },
  {
    term: 'rule placement',
    definition: 'Rule placement is the decision about whether a rule belongs in a declared constraint, query, view, trigger, procedure, transaction, application layer, or index design.',
    logic: 'Use rule placement to avoid forcing procedural workflow into static DDL or leaving enforceable integrity rules to scattered application code.',
  },
  {
    term: 'failure mode',
    definition: 'A failure mode is the smallest realistic way a plausible solution can still produce an illegal state, wrong result, misleading count, stale value, or inefficient path.',
    logic: 'Use failure modes to debug by cause: identify whether the break comes from grain mismatch, null logic, missing constraint, fanout, update anomaly, or state leakage.',
  },
  {
    term: 'counterexample',
    definition: 'A counterexample is a tiny legal dataset, operation, or runtime trace that makes a tempting answer visibly fail while staying inside the rules of the problem.',
    logic: 'Use counterexamples as proof tools: if one legal case breaks the answer, the answer is not generally correct even if it works on the sample data.',
  },
  {
    term: 'repair strategy',
    definition: 'A repair strategy changes the model, query, procedure, view, or access path so the cause of an error is removed rather than cosmetically hidden.',
    logic: 'Use repair strategy after finding the failure mode: move the rule to the narrowest reliable layer and retest against the original counterexample.',
  },
  {
    term: 'trace state',
    definition: 'A trace state is a visible intermediate state in a query pipeline, constraint check, trigger action, index traversal, routine execution, or JDBC interaction.',
    logic: 'Use trace states to explain why the next state happens; each arrow in a diagram should be justified by a predicate, dependency, operation, or resource rule.',
  },
  {
    term: 'lab setup',
    definition: 'A lab setup is the deliberately small example instance used to test a concept before trusting it on a full schema or project dataset.',
    logic: 'Use lab setups to control variables: make one assumption visible, change one fact, and observe whether the rule still preserves the intended meaning.',
  },
  {
    term: 'operational translation',
    definition: 'Operational translation turns a plain-language requirement into a concrete database operation such as a key, predicate, join, grouping, trigger, procedure, or API call.',
    logic: 'Use it to bridge English and implementation: every requirement should become an enforceable rule, a computed result, a checked transition, or an explicit responsibility outside the DBMS.',
  },
  {
    term: 'intermediate result',
    definition: 'An intermediate result is the temporary relation, object state, metric, or cursor position that exists after one operation but before the final displayed answer.',
    logic: 'Use intermediate results to catch errors early; many wrong answers look plausible only because the flawed middle state is never inspected.',
  },
  {
    term: 'validation pass',
    definition: 'A validation pass checks the final design or answer against the original requirement, the row grain, the edge case, and the intended system behavior.',
    logic: 'Use validation passes to avoid answer-shaped reasoning: the final output must be correct because the logic holds, not because the displayed row count looks familiar.',
  },
  {
    term: 'auditability',
    definition: 'Auditability is the ability to explain why a value exists, why a row was rejected, why a result was returned, or why an operation took a particular path.',
    logic: 'Use auditability as a quality bar: if the explanation cannot identify the responsible rule, predicate, dependency, or state transition, the design is not yet clear.',
  },
  {
    term: 'edge case',
    definition: 'An edge case is a legal but easily forgotten situation such as a null, duplicate, empty set, tie, renamed value, deleted parent, zero denominator, or concurrent action.',
    logic: 'Use edge cases to harden reasoning; the goal is not to add trivia but to verify the rule over the full space of legal states.',
  },
  {
    term: 'transfer scenario',
    definition: 'A transfer scenario changes the domain while preserving the same underlying database pressure, such as identity, dependency, fanout, null behavior, or access cost.',
    logic: 'Use transfer to prove mastery: if the learner can rebuild the reasoning in a new domain, they understand the concept rather than only the example.',
  },
  {
    term: 'distractor logic',
    definition: 'Distractor logic is the plausible but incomplete reasoning that makes an incorrect answer attractive in a quiz, exam, or design review.',
    logic: 'Use distractor logic to sharpen judgment: name why the wrong answer is tempting, then identify the hidden grain, dependency, null, tie, or workflow issue it misses.',
  },
  {
    term: 'teach-back proof',
    definition: "A teach-back proof is the learner's reconstruction of a concept through definition, failure case, repair, and verification in their own words.",
    logic: 'Use teach-back as the final mastery check because it forces the learner to connect vocabulary, implementation, and causal reasoning without leaning on slide order.',
  },
]

const codeAnalysisPageNumbers = new Set([6, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19])

const codeTeachingExamples: Record<string, CodeTeachingExample[]> = {
  'Entity integrity': [
    {
      title: 'Composite identity plus alternate business key',
      code: 'CREATE TABLE MovieCopy (\n  movie_id INT NOT NULL,\n  copy_num INT NOT NULL,\n  barcode VARCHAR(32) NOT NULL,\n  status ENUM(\'WORKING\', \'DAMAGED\', \'MISSING\') DEFAULT \'WORKING\',\n  PRIMARY KEY (movie_id, copy_num),\n  UNIQUE (barcode)\n);',
      analysis: [
        'The primary key says one physical copy is identified by the movie and its local copy number together; copy_num alone would not be stable across movies.',
        'The barcode is an alternate key because it is also unique, but it is not the row grain if the business still numbers copies within each movie.',
        'NOT NULL is part of entity integrity here because a key value cannot be unknown and still identify a row.',
        'The status column is intentionally not part of the key because a copy can change condition without becoming a different copy.',
      ],
    },
    {
      title: 'Bad identity design and the duplicate it permits',
      code: 'CREATE TABLE BadMovieCopy (\n  copy_num INT PRIMARY KEY,\n  movie_id INT NOT NULL,\n  barcode VARCHAR(32) NOT NULL\n);\n\nINSERT INTO BadMovieCopy VALUES (1, 10, \'A-001\');\nINSERT INTO BadMovieCopy VALUES (1, 11, \'B-001\'); -- rejected, but should be legal',
      analysis: [
        'This design treats copy_num as globally unique even though the real requirement says copy numbers restart inside each movie.',
        'The second insert should be legal if it represents copy 1 of a different movie, so the rejected row exposes the wrong grain.',
        'A constraint can be too strong as well as too weak; both mistakes are design errors because they block legal future states.',
        'The repair is not to remove the primary key, but to choose the key that matches the identity story.',
      ],
    },
  ],
  'Referential integrity': [
    {
      title: 'Mandatory child row reference',
      code: 'CREATE TABLE RentalItem (\n  rental_id INT NOT NULL,\n  movie_id INT NOT NULL,\n  copy_num INT NOT NULL,\n  PRIMARY KEY (rental_id, movie_id, copy_num),\n  FOREIGN KEY (rental_id) REFERENCES RentalOrder(rental_id),\n  FOREIGN KEY (movie_id, copy_num) REFERENCES MovieCopy(movie_id, copy_num)\n);',
      analysis: [
        'RentalItem is a relationship fact, so it cannot exist unless both the rental order and the physical copy exist first.',
        'The composite foreign key must match the composite parent key because the copy identity uses two columns.',
        'NOT NULL makes the relationship mandatory; a rental line with an unknown rental_id would have no transaction context.',
        'The primary key prevents the same copy from being listed twice inside the same rental order.',
      ],
    },
    {
      title: 'Optional reference with explicit null semantics',
      code: 'CREATE TABLE Patron (\n  patron_id INT PRIMARY KEY,\n  patron_name VARCHAR(80) NOT NULL,\n  fav_pizza VARCHAR(60) NULL,\n  FOREIGN KEY (fav_pizza) REFERENCES Pizza(pizza_name)\n    ON DELETE SET NULL\n);',
      analysis: [
        'fav_pizza is nullable because a patron can exist before choosing a favorite, so absence is a legal state.',
        'The foreign key still validates non-null values; optional does not mean unconstrained.',
        'ON DELETE SET NULL preserves the patron when the referenced pizza disappears, which matches an optional association.',
        'This differs from rental history, where deleting the parent would usually damage evidence rather than merely remove a preference.',
      ],
    },
  ],
  'Referential actions': [
    {
      title: 'Lifecycle choices encoded in foreign keys',
      code: 'FOREIGN KEY (patron_id) REFERENCES Patron(patron_id)\n  ON DELETE CASCADE;\n\nFOREIGN KEY (fav_pizza) REFERENCES Pizza(pizza_name)\n  ON DELETE SET NULL;\n\nFOREIGN KEY (movie_id, copy_num) REFERENCES MovieCopy(movie_id, copy_num)\n  ON DELETE RESTRICT;',
      analysis: [
        'CASCADE is appropriate only when the child row loses meaning without the parent, such as a disposable preference row.',
        'SET NULL is appropriate when the child row can remain meaningful after the relationship is removed.',
        'RESTRICT protects historical or audit-like facts by refusing a parent delete that would make child evidence incoherent.',
        'The action is not a syntax preference; it is a lifecycle claim about what the child fact means.',
      ],
    },
  ],
  'Domain constraints': [
    {
      title: 'Static value vocabulary versus workflow rule',
      code: 'CREATE TABLE MovieCopy (\n  copy_id INT PRIMARY KEY,\n  status ENUM(\'WORKING\', \'DAMAGED\', \'MISSING\') NOT NULL DEFAULT \'WORKING\',\n  last_checked DATE NULL,\n  CHECK (status <> \'WORKING\' OR last_checked IS NOT NULL)\n);',
      analysis: [
        'The enum blocks spelling drift such as WORKNG or Damaged before queries ever see the data.',
        'The default creates a legal initial state, but it should not pretend to model the entire rental workflow.',
        'The CHECK expression is row-local; it can compare values inside this row but cannot count open rentals elsewhere.',
        'Inventory movement after a rental requires transaction logic, trigger logic, or application logic because it depends on events over time.',
      ],
    },
  ],
  'Logical processing order': [
    {
      title: 'Clause order as a row-set pipeline',
      code: 'SELECT movie_id, COUNT(*) AS open_items\nFROM RentalItem\nWHERE return_timestamp IS NULL\nGROUP BY movie_id\nHAVING COUNT(*) >= 3\nORDER BY open_items DESC;',
      analysis: [
        'FROM chooses the source rows before any displayed column alias exists.',
        'WHERE removes individual returned items before grouping, so COUNT sees only open rental items.',
        'GROUP BY changes the grain from one row per rental item to one row per movie.',
        'HAVING filters groups after COUNT exists; placing COUNT in WHERE would be a logical-order error.',
      ],
    },
  ],
  'Result grain': [
    {
      title: 'Pre-aggregate detail tables before joining summaries',
      code: 'WITH item_summary AS (\n  SELECT rental_id, COUNT(*) AS item_count\n  FROM RentalItem\n  GROUP BY rental_id\n), payment_summary AS (\n  SELECT rental_id, SUM(amount) AS paid_amount\n  FROM Payment\n  GROUP BY rental_id\n)\nSELECT r.rental_id, i.item_count, p.paid_amount\nFROM RentalOrder AS r\nJOIN item_summary AS i ON i.rental_id = r.rental_id\nJOIN payment_summary AS p ON p.rental_id = r.rental_id;',
      analysis: [
        'The target result grain is one output row per rental order, so each detail table is first reduced to rental_id.',
        'Joining raw RentalItem rows to raw Payment rows can multiply facts when both sides are one-to-many.',
        'The CTEs make the intended grain visible and prevent SUM(amount) from being repeated once per item.',
        'This pattern transfers to order lines, payments, ratings, inventory events, audit rows, and any report with multiple detail sources.',
      ],
    },
  ],
  'Null logic': [
    {
      title: 'NOT IN null trap repaired with NOT EXISTS',
      code: '-- Risky when the subquery can return NULL\nSELECT p.patron_id\nFROM Patron AS p\nWHERE p.patron_id NOT IN (\n  SELECT r.patron_id FROM RentalOrder AS r\n);\n\n-- Safer anti-join pattern\nSELECT p.patron_id\nFROM Patron AS p\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM RentalOrder AS r\n  WHERE r.patron_id = p.patron_id\n);',
      analysis: [
        'NOT IN becomes dangerous when the subquery result contains NULL because comparisons can become unknown instead of true.',
        'NOT EXISTS asks whether a matching row exists for the current outer row, so it avoids treating NULL as an ordinary listed value.',
        'The correlated predicate r.patron_id = p.patron_id is the anti-join condition and must be inspected carefully.',
        'This example tests three-valued logic rather than memorized syntax: true, false, and unknown behave differently.',
      ],
    },
  ],
  'Join reasoning': [
    {
      title: 'Join predicate controls tuple pairing',
      code: 'SELECT c.customer_id, c.city, r.rental_id\nFROM Customer AS c\nJOIN RentalOrder AS r\n  ON r.customer_id = c.customer_id\nWHERE r.rental_date >= DATE \'2024-01-01\';',
      analysis: [
        'The ON clause defines which customer tuple can pair with which rental tuple; without it, the query becomes a cartesian product.',
        'The WHERE clause filters already-formed joined rows, so it should contain conditions about the paired result.',
        'A many-side join can duplicate customer values because one customer may have many rental orders.',
        'Correct join reasoning predicts row multiplication before looking at the final output.',
      ],
    },
  ],
  'Anti-join and difference': [
    {
      title: 'Find restaurants a patron does not frequent',
      code: 'SELECT p.patron_name, z.pizzeria_name\nFROM Patron AS p\nCROSS JOIN Pizzeria AS z\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM Frequents AS f\n  WHERE f.patron_id = p.patron_id\n    AND f.pizzeria_name = z.pizzeria_name\n);',
      analysis: [
        'The CROSS JOIN creates the universe of possible patron-pizzeria pairs before removing observed frequents rows.',
        'NOT EXISTS implements relational difference by asking which candidate pairs have no matching evidence.',
        'Both correlated predicates are required; omitting one changes the question from pair absence to global absence.',
        'This is more robust than NOT IN when nulls or composite comparisons are involved.',
      ],
    },
  ],
  'Tie-aware extrema': [
    {
      title: 'Return all top rows instead of one arbitrary winner',
      code: 'SELECT maker, model, price\nFROM Laptop\nWHERE price >= ALL (\n  SELECT price\n  FROM Laptop\n  WHERE price IS NOT NULL\n);',
      analysis: [
        'The ALL comparison keeps every laptop whose price is greater than or equal to every comparable laptop price.',
        'This preserves ties, unlike LIMIT 1, which can hide equally maximal rows unless a tie policy is explicitly added.',
        'The subquery filters null prices because unknown comparisons do not define a meaningful maximum.',
        'The same idea supports highest-count movies, largest order totals, busiest checkout days, or any maximum where ties are part of the answer.',
      ],
    },
  ],
  'View contracts': [
    {
      title: 'View as stable interface over changing base tables',
      code: 'CREATE VIEW available_copy AS\nSELECT m.movie_id, m.title, c.copy_num, c.status\nFROM Movie AS m\nJOIN MovieCopy AS c ON c.movie_id = m.movie_id\nWHERE c.status = \'WORKING\'\n  AND NOT EXISTS (\n    SELECT 1\n    FROM RentalItem AS ri\n    WHERE ri.movie_id = c.movie_id\n      AND ri.copy_num = c.copy_num\n      AND ri.return_timestamp IS NULL\n  );',
      analysis: [
        'The view exposes a reusable availability concept instead of forcing every application query to rewrite the same logic.',
        'The NOT EXISTS condition removes currently rented copies while preserving working copies that are not checked out.',
        'Consumers see a stable interface even if the base tables contain more columns than they should access.',
        'The view is a contract: changing it can change application meaning even when no base table definition changes.',
      ],
    },
  ],
  Updatability: [
    {
      title: 'Simple view update versus ambiguous derived update',
      code: 'CREATE VIEW active_customer AS\nSELECT customer_id, email, city\nFROM Customer\nWHERE active = 1;\n\n-- Usually understandable: one view row maps to one base row\nUPDATE active_customer\nSET city = \'Atlanta\'\nWHERE customer_id = 42;\n\nCREATE VIEW city_counts AS\nSELECT city, COUNT(*) AS customer_count\nFROM Customer\nGROUP BY city;',
      analysis: [
        'active_customer is plausibly updatable because each view row maps back to one Customer row through a preserved key.',
        'city_counts is derived from groups, so updating customer_count has no single base row assignment.',
        'Updatability is not about whether SELECT runs; it is about whether a write can be translated without ambiguity.',
        'Aggregates, DISTINCT, grouping, and joins often break the one-view-row-to-one-base-row mapping.',
      ],
    },
  ],
  'Functional dependencies': [
    {
      title: 'Attribute closure as an executable key test',
      code: 'closure = {model}\nrepeat until closure stops changing:\n  if model -> maker then add maker\n  if model -> type then add type\n  if model -> speed then add speed\n\nif closure contains every attribute:\n  model is a superkey',
      analysis: [
        'Closure starts with the proposed determinant and repeatedly adds attributes implied by known functional dependencies.',
        'If the closure reaches every attribute, the determinant can identify a full tuple and is a superkey.',
        'Candidate key testing adds minimality: no proper subset of the determinant may also be a superkey.',
        'This algorithm explains why key discovery is logical reasoning, not guessing from sample rows.',
      ],
    },
  ],
  Decomposition: [
    {
      title: 'Lossless decomposition check',
      code: 'Original: Enrollment(student_id, course_id, instructor, room)\nFD: course_id -> instructor, room\n\nR1(course_id, instructor, room)\nR2(student_id, course_id)\n\nCommon attributes: {course_id}\nSince course_id -> instructor, room, the join is lossless for this FD.',
      analysis: [
        'The decomposition separates course facts from enrollment facts to remove repeated instructor and room values.',
        'course_id is the common attribute between R1 and R2, so it is the value used to join the split relations back.',
        'Because course_id determines the other attributes in R1, the join does not invent extra instructor-room combinations.',
        'A decomposition is not automatically good; it must be checked for losslessness and relevant dependency preservation.',
      ],
    },
  ],
  'Procedure boundaries': [
    {
      title: 'Procedure captures a multi-statement workflow',
      code: 'CREATE PROCEDURE rent_copy(\n  IN p_customer_id INT,\n  IN p_movie_id INT,\n  IN p_copy_num INT\n)\nBEGIN\n  INSERT INTO RentalOrder(customer_id, rental_date)\n  VALUES (p_customer_id, CURRENT_DATE);\n\n  INSERT INTO RentalItem(rental_id, movie_id, copy_num)\n  VALUES (LAST_INSERT_ID(), p_movie_id, p_copy_num);\nEND;',
      analysis: [
        'The procedure boundary groups two related writes that should be understood as one rental workflow.',
        'IN parameters describe values supplied by the caller, while LAST_INSERT_ID carries state from the first insert to the second.',
        'A production version would add transaction handling and availability checks so partial success cannot leave inconsistent data.',
        'This belongs in a routine only if centralizing the workflow in the DBMS is preferable to duplicating it in applications.',
      ],
    },
  ],
  'Triggers and ECA logic': [
    {
      title: 'Event-condition-action rule',
      code: 'CREATE TRIGGER mark_copy_rented\nAFTER INSERT ON RentalItem\nFOR EACH ROW\nBEGIN\n  UPDATE MovieCopy\n  SET status = \'RENTED\'\n  WHERE movie_id = NEW.movie_id\n    AND copy_num = NEW.copy_num;\nEND;',
      analysis: [
        'The event is an insert into RentalItem, so the trigger fires because a rental line was created.',
        'NEW.movie_id and NEW.copy_num refer to values from the row that caused the trigger.',
        'The action updates the related copy, turning an event into a maintained derived state.',
        'This design must be paired with return logic and concurrency thinking; otherwise the trigger solves only half of the lifecycle.',
      ],
    },
  ],
  'B+ tree behavior': [
    {
      title: 'Index supports equality lookup and range scan',
      code: 'CREATE INDEX idx_order_customer_date\nON Orders(customer_id, order_date);\n\nSELECT order_id, order_date, total_amount\nFROM Orders\nWHERE customer_id = 42\n  AND order_date BETWEEN \'2026-01-01\' AND \'2026-03-31\';',
      analysis: [
        'The composite index is ordered first by customer_id and then by order_date, so equality on customer_id narrows the search quickly.',
        'The range predicate on order_date can then scan adjacent leaf entries for that customer instead of reading the whole table.',
        'Reversing the index column order would optimize different questions, such as all customers in a date range.',
        'The index improves reads but adds maintenance cost on inserts, deletes, and updates to indexed columns.',
      ],
    },
  ],
  'Connections and resources': [
    {
      title: 'Try-with-resources prevents JDBC leaks',
      code: 'String sql = "SELECT title FROM Movie WHERE rating = ?";\n\ntry (Connection conn = DriverManager.getConnection(url, user, password);\n     PreparedStatement stmt = conn.prepareStatement(sql)) {\n  stmt.setString(1, "PG");\n  try (ResultSet rs = stmt.executeQuery()) {\n    while (rs.next()) {\n      System.out.println(rs.getString("title"));\n    }\n  }\n}',
      analysis: [
        'Connection, PreparedStatement, and ResultSet are external resources, so they must be closed even when an exception occurs.',
        'The nested try-with-resources blocks make ownership visible and deterministic.',
        'The SQL text uses a placeholder so values are bound separately from the command structure.',
        'The loop reads the cursor one row at a time; calling rs.getString before rs.next would be a state error.',
      ],
    },
  ],
  'Prepared statements': [
    {
      title: 'Parameter binding protects query structure',
      code: 'String sql = "SELECT customer_id, email FROM Customer WHERE email = ?";\nPreparedStatement stmt = conn.prepareStatement(sql);\nstmt.setString(1, requestedEmail);\nResultSet rs = stmt.executeQuery();',
      analysis: [
        'The question mark is a value placeholder, not a place to concatenate SQL fragments.',
        'setString sends requestedEmail as data, so a malicious quote inside the email does not become SQL syntax.',
        'The DBMS can parse the statement structure separately from the user-supplied value.',
        'Prepared statements also improve readability because the query shape is visible before runtime values are bound.',
      ],
    },
  ],
  'End-to-end domain modeling': [
    {
      title: 'Checkout schema grain declaration',
      code: 'CREATE TABLE Checkout (\n  checkout_id INT PRIMARY KEY,\n  item_id INT NOT NULL,\n  borrower_id INT NOT NULL,\n  checked_out_at DATETIME NOT NULL,\n  due_at DATETIME NOT NULL,\n  status VARCHAR(16) NOT NULL,\n  FOREIGN KEY (item_id) REFERENCES EquipmentItem(item_id)\n);',
      analysis: [
        'The table grain is one checkout event, not one item and not one borrower.',
        'The item and borrower foreign keys make the event accountable to durable entities.',
        'The status value should be interpreted as the event lifecycle state, not as a replacement for audit evidence.',
        'Return inspection and fee facts belong in separate rows because they occur after checkout and may have different survival rules.',
      ],
    },
  ],
  'Service query contracts': [
    {
      title: 'Active checkout view contract',
      code: 'CREATE VIEW ActiveCheckout AS\nSELECT checkout_id, item_id, borrower_id, due_at\nFROM Checkout\nWHERE status = \'OUT\';\n\nSELECT borrower_id, COUNT(*) AS overdue_count\nFROM ActiveCheckout\nWHERE due_at < CURRENT_DATE\nGROUP BY borrower_id;',
      analysis: [
        'The view exposes one row per active checkout, which gives callers a stable interface.',
        'The report query groups only after the active-checkout grain has been established.',
        'The overdue predicate is row-level, while the COUNT result is group-level.',
        'If a caller needs inspection history, that should be a separate contract or a controlled aggregate.',
      ],
    },
  ],
  'Operational readiness review': [
    {
      title: 'Index and prepared endpoint review',
      code: 'CREATE INDEX idx_checkout_status_due\nON Checkout(status, due_at);\n\nString sql = "SELECT checkout_id, item_id FROM Checkout WHERE status = ? AND due_at < ?";\nPreparedStatement ps = conn.prepareStatement(sql);\nps.setString(1, "OUT");\nps.setDate(2, cutoffDate);',
      analysis: [
        'The index leading column matches the equality predicate, and the second column supports the due-date range.',
        'The PreparedStatement keeps request values separate from SQL structure.',
        'The endpoint should still close statement and result resources even when the query fails.',
        'A connection failure should be debugged before changing SQL semantics.',
      ],
    },
  ],
}

function codeTeachingExample(topic: SubtopicExpansion, pageNumber: number): CodeTeachingExample | undefined {
  const examples = codeTeachingExamples[topic.focus]
  if (!examples || !codeAnalysisPageNumbers.has(pageNumber)) return undefined
  return examples[(pageNumber + examples.length - 1) % examples.length]
}

function conceptTermsFor(topic: SubtopicExpansion, pageNumber: number, codeTeaching: CodeTeachingExample | undefined): ConceptTerm[] {
  const pageTerm = pageConceptTerms[(pageNumber - 1) % pageConceptTerms.length]
  const implementationTerm: ConceptTerm = codeTeaching
    ? {
        term: 'code reading',
        definition: 'Code reading is the discipline of interpreting a statement, query, routine, trigger, or API snippet as a sequence of semantic commitments rather than as text to memorize.',
        logic: `Use code reading here by explaining why "${codeTeaching.title}" changes the allowed rows, result grain, runtime state, or visible output before trusting the snippet.`,
      }
    : {
        term: 'diagnostic question',
        definition: 'A diagnostic question is a targeted test that exposes whether the learner understands the rule, the grain, the legal state, and the failure mode behind the topic.',
        logic: `Use this slide's diagnostic check as a reasoning instrument: ${topic.checks[(pageNumber - 1) % topic.checks.length]}.`,
      }

  return [
    {
      term: topic.focus,
      definition: topic.concept,
      logic: `The governing logic is: ${topic.advancedLogic}`,
    },
    pageTerm,
    implementationTerm,
    {
      term: 'practical consequence',
      definition: 'A practical consequence is the concrete change this concept forces in schema design, SQL writing, relational algebra, module logic, physical access, or application code.',
      logic: topic.application,
    },
  ]
}

function enrichGeneratedBody(topic: SubtopicExpansion, pageNumber: number, body: string) {
  const activeCheck = topic.checks[(pageNumber - 1) % topic.checks.length]
  const activeLabCheck = topic.labChecks[(pageNumber - 1) % topic.labChecks.length]
  const activeStep = topic.labSteps[(pageNumber - 1) % topic.labSteps.length]

  return `${body} Study this page as a three-part argument: first identify the exact fact or state being protected, then name the operation that could change it, and finally test the result against "${activeCheck}". The additional mastery move is to connect the slide to the lab action "${activeStep}" and ask whether "${activeLabCheck}" would still be answered correctly after the schema, query, routine, access path, or client code runs. Back-and-forth reasoning loop: learner asks "what would make this tempting answer fail?", instructor answers by pointing to ${topic.focus}'s controlling object, learner reverses the case by changing one legal row, value, dependency, operation, page route, or runtime event, and instructor verifies whether the same rule still protects the intended meaning.`
}

function enrichGeneratedExample(
  topic: SubtopicExpansion,
  pageNumber: number,
  example: string,
  codeTeaching: CodeTeachingExample | undefined,
) {
  if (codeTeaching) return codeTeaching.code

  const activeStep = topic.labSteps[(pageNumber - 1) % topic.labSteps.length]
  const activeCheck = topic.checks[(pageNumber - 1) % topic.checks.length]
  const activeLabCheck = topic.labChecks[(pageNumber - 1) % topic.labChecks.length]
  const normalizedExample = example.trim()

  return `${normalizedExample}

Worked micro-case:
${topic.labTitle}. ${topic.labBody}

Reasoning pass:
1. Start from this concrete example: ${normalizedExample.replace(/\s+/g, ' ')}
2. Apply the current lab move: ${activeStep}
3. Inspect the decisive question: ${activeCheck}
4. Validate the result by asking: ${activeLabCheck}
5. Write the before state and after state explicitly, even if the original example only shows the final answer.
6. Explain which weaker shortcut would have looked correct on the sample but failed under a legal variation.

Concrete count checkpoint:
- Build a three-case probe for this page: one ordinary legal case, one legal edge case, and one case that should be rejected, repaired, or classified as a different output.
- Count the controlled object before and after the rule runs: rows, groups, attributes, determinant values, index pages, writes, bound parameters, open resources, or route hops.
- Expected learning outcome: the final answer should explain why the count changed, stayed stable, or became invalid; if the count cannot be explained, the rule for ${topic.focus} is still too vague.`
}

function enrichGeneratedBridge(topic: SubtopicExpansion, pageNumber: number, bridge: string) {
  const nextStep = topic.labSteps[pageNumber % topic.labSteps.length]
  const nextCheck = topic.checks[pageNumber % topic.checks.length]

  return `${bridge} Carry it forward by making the next page answer this concrete question: ${nextCheck} The transition should feel causal: once the current rule is understood, the next move "${nextStep}" explains what must be inspected, computed, enforced, or rejected. Before advancing, try the reverse explanation too: if someone defended the opposite design choice, name the hidden grain, constraint boundary, query phase, dependency, access path, or resource lifetime that would make that defense collapse.`
}

function enrichGeneratedChecks(topic: SubtopicExpansion, checks: string[]) {
  return Array.from(
    new Set([
      ...checks,
      `Which invariant would be broken if ${topic.focus} were implemented at the wrong grain?`,
      `Can you create one legal counterexample that makes a weaker interpretation of ${topic.focus} fail?`,
      `How would you answer a classmate who chose the opposite rule, clause, dependency, access path, or runtime boundary?`,
    ]),
  ).slice(0, 5)
}

const subtopicExpansionLibrary: Record<string, SubtopicExpansion[]> = {
  ddl: [
    {
      focus: 'Entity integrity',
      title: 'A table row must have one durable identity story.',
      concept: 'Entity integrity is the rule that a stored tuple must be identifiable without guessing. The deeper design issue is whether the identifier belongs to the real-world object, to the database record, or to a relationship instance that only exists inside a parent context.',
      advancedLogic: 'A candidate key is not just unique in the current sample; it is minimal, stable, and meaningful across all legal future states. Surrogate keys reduce update risk, but natural and composite keys still matter because they describe business uniqueness that the schema should often enforce separately.',
      application: 'When a copy number restarts for every movie, copy_num alone is only a local label. The legal identity of a physical copy is movie_id plus copy_num, while a generated copy_id would be a surrogate for the same real object.',
      example: 'PRIMARY KEY (movie_id, copy_num)\nUNIQUE (barcode)\n-- identity can be composite while an alternate key supports scanning',
      checks: ['Can two legal objects share this proposed key?', 'Could a user correction require changing the key?', 'Is the key identifying the row grain or only a display label?'],
      labTitle: 'Identity stress test lab',
      labBody: 'To master keys, deliberately invent future rows that make a convenient key fail. A strong schema survives duplicates, renames, local numbering, imports, and corrections because every uniqueness rule has been placed at the right grain.',
      labSteps: ['Write one row represents statement.', 'Propose the smallest key.', 'Invent a duplicate-looking legal case.', 'Add alternate UNIQUE constraints only for business rules.'],
      labExample: 'Customer(cust_id PK, email UNIQUE)\nMovieCopy(movie_id, copy_num PK)\nProduct(model PK)',
      labChecks: ['Which key is technical identity?', 'Which uniqueness rule is business identity?', 'Which value might change later?'],
    },
    {
      focus: 'Referential integrity',
      title: 'Foreign keys are value contracts, not diagram decoration.',
      concept: 'Referential integrity says that a child value is legal only when it matches a referenced candidate key, unless the relationship is explicitly optional. This turns a relationship line into executable value validation.',
      advancedLogic: 'A foreign key should be read in both directions: the child column stores the reference, and the parent key defines the allowed vocabulary. Nullability then decides whether the relationship may be absent, unknown, or temporarily unassigned.',
      application: 'A rental item cannot reference a missing rental order because the item has no independent transaction context. A patron favorite pizza can be null because the patron can exist before choosing a favorite.',
      example: 'FOREIGN KEY (rental_id) REFERENCES RentalOrder(rental_id)\nFOREIGN KEY (fav_pizza) REFERENCES Pizza(pizza_name) ON DELETE SET NULL',
      checks: ['Which parent key defines the allowed values?', 'Is the child relationship mandatory?', 'Should loading parent rows first be required?'],
      labTitle: 'Orphan-row prevention lab',
      labBody: 'The fastest way to understand a foreign key is to write the orphan row that should be rejected. If the schema accepts that row, the relationship exists only in your mental model, not in the database contract.',
      labSteps: ['Name the child table.', 'Name the referenced parent key.', 'Create one missing-parent child row.', 'Decide whether null should be legal.'],
      labExample: 'INSERT INTO RentalItem(rental_id, movie_id) VALUES (9999, 4);\n-- should fail if rental_id 9999 does not exist',
      labChecks: ['What exact row is illegal?', 'Does null mean optional or unknown?', 'Could a composite parent key be required?'],
    },
    {
      focus: 'Referential actions',
      title: 'Delete and update actions encode lifecycle semantics.',
      concept: 'A referential action is a policy for what happens to dependent facts when a referenced fact changes. The important question is whether the child fact is owned by the parent, merely associated with it, or historically independent.',
      advancedLogic: 'Cascade is safe only when the child row loses meaning without the parent. Set null is safe only when the child row can remain meaningful with the association removed. Restrict or no action is appropriate when the child row preserves history or blocks destructive maintenance.',
      application: 'Likes can disappear when a patron is deleted in a practice schema, but rental history should usually survive because it records a past business event. Favorite pizza can become null because the patron remains meaningful.',
      example: 'ON DELETE CASCADE   -- owned child\nON DELETE SET NULL  -- optional association\nON DELETE NO ACTION -- preserve dependent evidence',
      checks: ['Does the child fact survive without the parent?', 'Would cascade delete history?', 'Would set null create an unexplained row?'],
      labTitle: 'Lifecycle matrix lab',
      labBody: 'Build a small matrix for every foreign key: parent deleted, parent key updated, child inserted first, child made null. The right action is the one whose result still tells a coherent business story.',
      labSteps: ['Classify child ownership.', 'Choose delete behavior.', 'Choose update behavior.', 'Write the resulting row state in English.'],
      labExample: 'Patron -> Likes: cascade can be acceptable.\nPizza -> Patron.fav_pizza: set null preserves patron.\nMovie -> RentalItem: restrict protects history.',
      labChecks: ['Which action protects audit history?', 'Which action cleans dependent facts?', 'Which action leaves optional information blank?'],
    },
    {
      focus: 'Domain constraints',
      title: 'Domains prevent impossible states before queries begin.',
      concept: 'A domain is the set of values a column is allowed to hold. Data type, nullability, default, enum, unique, and check constraints all narrow the possible database states.',
      advancedLogic: 'Good domain design distinguishes structural facts from workflow facts. A status vocabulary can be constrained by an enum or lookup table, while a rule like inventory movement after rental needs procedural or transactional logic.',
      application: 'A movie copy status can be limited to working, damaged, or missing, but the schema still needs later logic to move copies between inventory and rental events.',
      example: "status ENUM('WORKING','DAMAGED','MISSING') DEFAULT 'WORKING'\nemail VARCHAR(255) NOT NULL UNIQUE",
      checks: ['Is the value vocabulary stable?', 'Does NULL have one clear meaning?', 'Is this a static fact or a time-dependent process?'],
      labTitle: 'Impossible-state audit lab',
      labBody: 'List the bad values that should never enter the database. Then decide whether each bad state is blocked by a column domain, a row-level constraint, a relationship constraint, or a workflow mechanism.',
      labSteps: ['Write one impossible value.', 'Choose type or enum if vocabulary is local.', 'Choose lookup table if vocabulary has metadata.', 'Choose procedure or trigger if time/order matters.'],
      labExample: "rating ENUM('G','PG','PG-13','R','NC-17')\nreturn_timestamp NULL means not yet returned",
      labChecks: ['Could a typo be stored?', 'Could a missing value be confused with not applicable?', 'Does the rule require a previous state?'],
    },
  ],
  dml: [
    {
      focus: 'Logical processing order',
      title: 'SQL correctness starts with the invisible pipeline.',
      concept: 'SELECT appears first, but the logical row set is formed before displayed expressions exist. The mental pipeline is FROM, WHERE, GROUP BY, HAVING, SELECT, and ORDER BY.',
      advancedLogic: 'Each clause changes either row existence, grouping grain, or presentation. Debugging means locating the first clause where the intended row set diverges from the actual row set.',
      application: 'If you filter on COUNT(*), the predicate cannot live in WHERE because groups and counts do not exist yet. If you format a duration alias, that alias belongs to display logic after row filtering.',
      example: 'FROM RentalItem\nWHERE return_timestamp IS NULL\nGROUP BY movie_id\nHAVING COUNT(*) > 2\nSELECT movie_id, COUNT(*) AS open_rentals',
      checks: ['Which clause first creates the needed rows?', 'Which clause changes row grain?', 'Which expressions are display-only?'],
      labTitle: 'Clause-by-clause trace lab',
      labBody: 'For any query, draw a six-row trace table with one line per logical clause. Fill in what rows or groups exist at each stage before looking at the output.',
      labSteps: ['Name the starting relation.', 'Filter individual rows.', 'Define groups.', 'Filter groups.', 'Compute displayed expressions.'],
      labExample: 'Raw item rows -> open item rows -> one group per movie -> popular open movies -> formatted result.',
      labChecks: ['Does WHERE mention an aggregate?', 'Does SELECT include non-grouped columns?', 'Does ORDER BY change only presentation?'],
    },
    {
      focus: 'Result grain',
      title: 'Every aggregate query is a grain decision.',
      concept: 'Result grain means what one output row represents. Aggregation is correct only when the GROUP BY columns exactly describe that unit.',
      advancedLogic: 'Fanout before grouping can inflate measures. When multiple detail tables are joined, pre-aggregate each detail source to the target grain before combining them.',
      application: 'A rental order summary should group by rental_id. A city report may group by city and state. A manufacturer report groups by maker or manufacturer, not by model.',
      example: 'SELECT rental_id, COUNT(*) AS item_count\nFROM RentalItem\nGROUP BY rental_id',
      checks: ['One output row per what?', 'Are all non-aggregate columns part of that grain?', 'Did any join multiply facts before SUM?'],
      labTitle: 'Fanout detection lab',
      labBody: 'Before writing SELECT, predict whether each join edge is one-to-one, many-to-one, or one-to-many. The moment two one-to-many edges meet, aggregation needs special care.',
      labSteps: ['Write target grain.', 'Mark join cardinalities.', 'Pre-aggregate detail tables.', 'Join summaries instead of raw detail when needed.'],
      labExample: 'Order -> Items is one-to-many.\nOrder -> Payments is one-to-many.\nJoin item_summary to payment_summary, not raw items to raw payments.',
      labChecks: ['Could one real fact appear twice?', 'Should COUNT(*) count rows or distinct objects?', 'Is the GROUP BY too wide?'],
    },
    {
      focus: 'Expressions and aliases',
      title: 'Computed columns should reveal, not hide, meaning.',
      concept: 'Expressions can calculate, format, concatenate, round, or rename values. They should be used after the logical data shape is already correct.',
      advancedLogic: 'Separate semantic computation from cosmetic formatting. Early rounding, string conversion, or concatenation can break comparisons, sorting, and later aggregation.',
      application: 'Converting movie length to hours and minutes is presentation. Computing total rental cost is semantic. Mixing the two too early makes verification harder.',
      example: "SUM(rental_rate) AS daily_cost\nCONCAT(FLOOR(length / 60), 'h ', MOD(length, 60), 'm') AS runtime_label",
      checks: ['Is the expression used for logic or display?', 'Should rounding happen before or after comparison?', 'Does the alias name the final meaning clearly?'],
      labTitle: 'Expression classification lab',
      labBody: 'Classify every SELECT expression as stored value, derived measure, formatted label, or renamed output. This makes it clear which expressions can safely be reused in later logic.',
      labSteps: ['Underline stored columns.', 'Mark arithmetic measures.', 'Mark strings and labels.', 'Move cosmetic formatting to the final projection.'],
      labExample: 'AVG(price) is a measure.\nROUND(AVG(price), 2) is display.\nCONCAT(first, last) is a label.',
      labChecks: ['Could formatting change numeric ordering?', 'Does the alias match the business term?', 'Would a view preserve this expression usefully?'],
    },
    {
      focus: 'Null logic',
      title: 'NULL introduces unknown, not a secret ordinary value.',
      concept: 'NULL means the value is missing, inapplicable, or unknown depending on the column meaning. SQL comparisons with NULL produce unknown rather than ordinary true or false.',
      advancedLogic: 'Three-valued logic affects WHERE, NOT IN, joins, aggregates, and counts. Correct SQL often requires explicit IS NULL, IS NOT NULL, COALESCE, or NOT EXISTS.',
      application: 'An outstanding rental is better represented by return_timestamp IS NULL than by a fake date. Aggregate COUNT(column) skips nulls, while COUNT(*) counts rows.',
      example: 'WHERE return_timestamp IS NULL\nSELECT COUNT(*), COUNT(return_timestamp)\nFROM RentalItem',
      checks: ['What does NULL mean for this column?', 'Should missing rows be kept or removed?', 'Does the aggregate count rows or known values?'],
      labTitle: 'Three-valued predicate lab',
      labBody: 'Test each predicate against three cases: matching value, different value, and NULL. If you cannot predict all three outcomes, the query is not ready.',
      labSteps: ['Create a value row.', 'Create a different value row.', 'Create a NULL row.', 'Evaluate the predicate against all three.'],
      labExample: 'film_rating = "PG" -> true, false, unknown.\nfilm_rating IS NULL -> false, false, true.',
      labChecks: ['Did NOT change unknown into true?', 'Would NOT IN see a null from the subquery?', 'Should COALESCE be used only for display?'],
    },
  ],
  'joins-subqueries': [
    {
      focus: 'Join reasoning',
      title: 'A join changes context and row count at the same time.',
      concept: 'A join combines rows that satisfy a relationship predicate. Its purpose may be to add descriptors, filter by related facts, or create a wider event context.',
      advancedLogic: 'The key risk is unintended fanout. A many-to-one join normally adds labels safely; a one-to-many join duplicates the left row and changes aggregate behavior.',
      application: 'Joining RentalItem to Movie adds title and year to each item. Joining Movie to many RentalItem rows expands one movie into many rental events.',
      example: 'FROM Movie M, RentalItem I\nWHERE M.movie_id = I.movie_id',
      checks: ['Should the row count stay the same?', 'Is this join adding labels or detail?', 'Is every table connected by a predicate?'],
      labTitle: 'Join cardinality lab',
      labBody: 'Mark every join as one-to-one, many-to-one, or one-to-many from the perspective of the current row set. Then decide whether aggregation must happen before or after the join.',
      labSteps: ['Pick the driving row grain.', 'Classify each join edge.', 'Predict row count movement.', 'Verify with COUNT before selecting display columns.'],
      labExample: 'Movie -> Product detail is one-to-one in subtype checks.\nMovie -> RentalItem is one-to-many.',
      labChecks: ['Could this join duplicate money or counts?', 'Is a DISTINCT hiding a fanout bug?', 'Would EXISTS express the intent better?'],
    },
    {
      focus: 'Subquery shape',
      title: 'The inner query must fit the outer question.',
      concept: 'A subquery can produce one value, a set of values, or a relation. The outer operator determines which shape is legal and meaningful.',
      advancedLogic: 'Scalar comparisons require one value. IN expects a set. EXISTS expects a correlated truth test. FROM subqueries should create a meaningful intermediate grain.',
      application: 'A movie shorter than average uses a scalar AVG subquery. A movie whose id appears in open rentals uses IN or EXISTS. A precomputed rental count can be a FROM subquery.',
      example: 'WHERE length < (SELECT AVG(length) FROM Movie)\nWHERE EXISTS (SELECT 1 FROM RentalItem I WHERE I.movie_id = M.movie_id)',
      checks: ['Does the subquery return one value or many?', 'Is it correlated to the outer row?', 'Would a join be clearer?'],
      labTitle: 'Nested-shape lab',
      labBody: 'Write the expected subquery shape in the margin before writing SQL. This prevents the common error of using a multi-row result where one scalar value was required.',
      labSteps: ['State the outer comparison.', 'State the inner result columns.', 'State expected row count.', 'Choose scalar, IN, EXISTS, or derived table.'],
      labExample: 'AVG(length) -> one value.\nSELECT movie_id FROM RentalItem -> set.\nSELECT movie_id, COUNT(*) GROUP BY movie_id -> derived relation.',
      labChecks: ['Can the inner query return duplicates?', 'Do duplicates matter?', 'Can the inner query return NULL?'],
    },
    {
      focus: 'Anti-join and difference',
      title: 'Absence queries need null-safe logic.',
      concept: 'Anti-joins keep rows that have no corresponding match. SQL can express this with NOT EXISTS, LEFT JOIN filters, or NOT IN, but nulls make the choices unequal.',
      advancedLogic: 'NOT EXISTS evaluates absence per outer row and avoids global null poisoning. NOT IN can become unknown for every candidate if the subquery result contains NULL.',
      application: 'Finding patrons who never rented should usually correlate on patron id with NOT EXISTS rather than depend on a nullable list from a subquery.',
      example: 'WHERE NOT EXISTS (\n  SELECT 1\n  FROM RentalOrder R\n  WHERE R.cust_id = C.cust_id\n)',
      checks: ['Can the subquery column be NULL?', 'Is absence tested per candidate row?', 'Does the logic distinguish no match from unknown?'],
      labTitle: 'Null-poison test lab',
      labBody: 'Insert a NULL into the mental subquery result and re-evaluate the predicate. If the intended candidates disappear, switch to NOT EXISTS or filter the nulls deliberately.',
      labSteps: ['Build candidate set.', 'Build matched set with one NULL.', 'Evaluate NOT IN.', 'Rewrite with NOT EXISTS.'],
      labExample: 'candidate 7 NOT IN (1, 2, NULL) is unknown, not true.\nNOT EXISTS checks whether candidate 7 has a matching row.',
      labChecks: ['Did the query return zero rows unexpectedly?', 'Is the comparison column declared NOT NULL?', 'Would an anti-join communicate intent better?'],
    },
    {
      focus: 'Tie-aware extrema',
      title: 'Leader queries compare a group against peer groups.',
      concept: 'A maximum or minimum over groups is a peer comparison. The output may contain several rows if several groups share the same best value.',
      advancedLogic: 'Use ALL, a maximum derived table, NOT EXISTS, or ranking functions depending on available SQL. Avoid LIMIT 1 unless the prompt explicitly asks for one arbitrary row.',
      application: 'Most-rented movies require counting rentals per movie and returning every movie whose count is equal to the maximum count among all movies.',
      example: 'HAVING COUNT(*) >= ALL (\n  SELECT COUNT(*)\n  FROM RentalItem\n  GROUP BY movie_id\n)',
      checks: ['Are ties possible?', 'Is the comparison made after grouping?', 'Does ORDER BY LIMIT 1 answer a weaker question?'],
      labTitle: 'Tie injection lab',
      labBody: 'Add a tied maximum to a sample dataset and rerun your reasoning. A robust leader query should return every tied leader without changing the SQL text.',
      labSteps: ['Compute group values.', 'Add a second group with same max.', 'Compare each group to all peers.', 'Return all groups that pass.'],
      labExample: 'Movie A count 5, Movie B count 5, Movie C count 3.\nA and B are both most rented.',
      labChecks: ['Does the query preserve both A and B?', 'Did SELECT include the group identity?', 'Does sorting only change display order?'],
    },
  ],
  'relational-algebra': [
    {
      focus: 'Operator shape',
      title: 'Every algebra operator has a shape effect.',
      concept: 'Selection changes which tuples survive, projection changes which attributes survive, join changes context, and set operators combine compatible relations.',
      advancedLogic: 'Thinking in shape prevents syntax-first mistakes. You should know the schema and intended tuple meaning of every intermediate relation.',
      application: 'A query for laptop makers should select qualifying Laptop rows, join to Product while model survives, then project maker after the join.',
      example: '\u03c0_maker(Product \u22c8 \u03c3_hd>=80(Laptop))',
      checks: ['Which operator changes rows?', 'Which operator changes columns?', 'Which attributes must survive for later operators?'],
      labTitle: 'Intermediate schema lab',
      labBody: 'After each operator, write the output relation schema. This turns algebra from symbols into a step-by-step proof that the final answer has the requested columns.',
      labSteps: ['Write base schemas.', 'Apply selection and keep schema.', 'Apply projection and shrink schema.', 'Apply join and combine schemas.'],
      labExample: 'Laptop(model, speed, hd)\n\u03c3_hd>=80 keeps all three attributes.\n\u03c0_model leaves one attribute.',
      labChecks: ['Was a join key projected away?', 'Did duplicate elimination matter?', 'Can the final projection be delayed?'],
    },
    {
      focus: 'Rename and self-joins',
      title: 'Rename creates separate roles for the same relation.',
      concept: 'When a relation appears more than once, each occurrence needs a role name. Rename lets algebra compare two tuples from the same base relation.',
      advancedLogic: 'Self-comparison is common for peer problems: same maker, same city, same team, higher price, different model. Rename prevents the two roles from collapsing into one ambiguous tuple.',
      application: 'To find pairs of products by the same maker, Product must appear as P1 and P2 with a maker equality and a model inequality.',
      example: '\u03c1_P1(Product) \u22c8_{P1.maker = P2.maker and P1.model <> P2.model} \u03c1_P2(Product)',
      checks: ['What are the two roles?', 'Which attributes compare equality?', 'Which condition prevents matching a row to itself?'],
      labTitle: 'Role naming lab',
      labBody: 'Before writing a self-join, give each copy of the relation a human role. The algebra becomes much easier when the roles have names such as cheaper product and expensive product.',
      labSteps: ['Name role one.', 'Name role two.', 'State relationship between roles.', 'Project the result columns from the right role.'],
      labExample: 'Pcheap and Pexpensive from Product.\nPcheap.maker = Pexpensive.maker.\nPcheap.price < Pexpensive.price.',
      labChecks: ['Can a tuple match itself?', 'Are symmetric duplicate pairs possible?', 'Should the output show one role or both?'],
    },
    {
      focus: 'Set compatibility',
      title: 'Set operators require aligned relation schemas.',
      concept: 'Union, intersection, and difference operate on relations with compatible attribute counts and domains. The branches must be shaped before they can be combined.',
      advancedLogic: 'Projection and rename often prepare branches for set operations. SQL bag behavior adds another layer because UNION removes duplicates while UNION ALL keeps them.',
      application: 'Combining PC models and laptop models requires projecting each subtype to one model column before applying union.',
      example: '\u03c0_model(PC) \u222a \u03c0_model(Laptop)\n-- both branches have one compatible attribute',
      checks: ['Do both branches have the same number of columns?', 'Are domains compatible?', 'Do duplicates matter in SQL translation?'],
      labTitle: 'Branch alignment lab',
      labBody: 'Write the left branch schema and right branch schema side by side. If they do not align, add projection or rename before the set operator.',
      labSteps: ['Write left schema.', 'Write right schema.', 'Project to common attributes.', 'Apply union, intersection, or difference.'],
      labExample: 'PC(model, speed, price) cannot union Laptop(model, hd, screen).\nProject both to model first.',
      labChecks: ['Is one branch carrying extra columns?', 'Would INTERSECT require exact tuple equality?', 'Does SQL need DISTINCT?'],
    },
    {
      focus: 'Algebraic rewrites',
      title: 'Equivalent expressions explain query optimization.',
      concept: 'Two algebra expressions can produce the same relation even if their trees look different. This is the basis for safe query rewrites.',
      advancedLogic: 'Selections can often be pushed closer to base relations, projections can reduce width when they preserve needed attributes, and joins can sometimes be reordered under inner-join semantics.',
      application: 'Filtering laptops before joining to Product is equivalent to joining first and then filtering on laptop attributes, but usually cheaper.',
      example: 'Product \u22c8 \u03c3_hd>=80(Laptop)\ncan be cheaper than\n\u03c3_hd>=80(Product \u22c8 Laptop)',
      checks: ['Does the rewrite preserve null and duplicate behavior?', 'Are all needed attributes kept?', 'Is this still an inner join?'],
      labTitle: 'Rewrite proof lab',
      labBody: 'For each proposed optimization, write the original and rewritten expression, then identify the rule that makes them equivalent.',
      labSteps: ['Mark predicate attributes.', 'Move selection only below relations that contain those attributes.', 'Keep join keys through projection.', 'Compare final schemas.'],
      labExample: '\u03c3_price>100(PC \u22c8 Product)\ncan push \u03c3_price>100 to PC if price belongs to PC.',
      labChecks: ['Did an outer join change meaning?', 'Did projection remove a predicate attribute?', 'Would SQL bag semantics change duplicates?'],
    },
  ],
  views: [
    {
      focus: 'View contracts',
      title: 'A view should publish a useful relation, not just hide text.',
      concept: 'A view names a query result so users can reason from a stable relation-like interface. The view is valuable when the name, grain, and exposed columns form a reusable contract.',
      advancedLogic: 'Design views around consumers and row grain. A view that repeats a business concept is stronger than a view that merely wraps an arbitrary long SELECT.',
      application: 'ActiveMovie is useful if many later queries need the same definition of active inventory and outstanding rental activity.',
      example: 'CREATE VIEW ActiveMovie AS\nSELECT movie_id, title, year\nFROM Movie\nWHERE ...',
      checks: ['Who consumes this view?', 'What does one view row represent?', 'Which base details should remain hidden?'],
      labTitle: 'View contract lab',
      labBody: 'Write a view specification before SQL: consumer, row grain, exposed columns, hidden complexity, and whether the interface is read-only.',
      labSteps: ['Name the consumer.', 'Name the row grain.', 'Choose public columns.', 'Decide read-only or writable intent.'],
      labExample: 'Consumer: report queries.\nGrain: one active movie.\nColumns: movie_id, title, year.\nHidden: inventory and open-rental logic.',
      labChecks: ['Is SELECT star avoided?', 'Would app code survive base table changes?', 'Does the name describe the result?'],
    },
    {
      focus: 'Security and exposure',
      title: 'Views can narrow what users are allowed to see.',
      concept: 'A view can omit sensitive columns, pre-filter rows, and stabilize a public shape even when base tables are more detailed.',
      advancedLogic: 'A view is an interface boundary, but permissions still matter. It should expose only what the user needs and avoid accidental future leakage.',
      application: 'A customer activity view might expose city and rental count while hiding email, phone, or internal account fields.',
      example: 'CREATE VIEW CustomerRentalSummary AS\nSELECT city, state, COUNT(*) AS rentals\nFROM ...\nGROUP BY city, state',
      checks: ['Which columns are sensitive?', 'Which rows should be excluded?', 'Should the base table remain inaccessible?'],
      labTitle: 'Exposure boundary lab',
      labBody: 'Treat view design like API design. Once users depend on it, changing names, types, grain, or visibility becomes a compatibility decision.',
      labSteps: ['Remove private columns.', 'Rename output columns deliberately.', 'Filter unsafe rows.', 'Grant access to view rather than base table when appropriate.'],
      labExample: 'Public view: movie title and rating.\nPrivate base table: acquisition cost and supplier notes.',
      labChecks: ['Could a future column leak through SELECT star?', 'Does the view reveal row-level private information?', 'Are permissions aligned with intent?'],
    },
    {
      focus: 'Derived tables',
      title: 'A FROM subquery should earn its place by changing grain.',
      concept: 'A derived table is a temporary relation inside one query. It is useful when the inner result has meaning that the outer query can build on.',
      advancedLogic: 'Derived tables are especially useful after grouping because they let the outer query join, filter, or compare against a summary relation.',
      application: 'Compute rental counts per movie in a derived table, then join Movie to add titles and filter by title attributes.',
      example: 'FROM (\n  SELECT movie_id, COUNT(*) AS rentals\n  FROM RentalItem\n  GROUP BY movie_id\n) R',
      checks: ['Does the inner query produce a new grain?', 'Is the alias meaningful?', 'Could a direct join be simpler?'],
      labTitle: 'Intermediate relation lab',
      labBody: 'Name the derived table as if it were a real relation. If you cannot name it clearly, the nesting may not represent a useful concept.',
      labSteps: ['Write inner output grain.', 'Name the derived relation.', 'Join or filter in the outer query.', 'Remove decorative nesting.'],
      labExample: 'MovieRentalCount(movie_id, rentals) is a meaningful intermediate relation.',
      labChecks: ['Does the outer query need the summary?', 'Is every derived column used?', 'Would a CTE improve readability?'],
    },
    {
      focus: 'Updatability',
      title: 'Writable views require unambiguous base-row mapping.',
      concept: 'A view can be queried like a relation, but that does not mean every view can be updated. Writes need a clear path back to base rows.',
      advancedLogic: 'Aggregates, DISTINCT, UNION, grouping, and many joins usually make updates ambiguous. Procedures can provide explicit write workflows when view updates are not appropriate.',
      application: 'Changing a simple movie title view may map to one Movie row, but changing a rental-count view cannot identify one base RentalItem row to edit.',
      example: 'AverageRentalByCity(city, avg_count)\n-- updating avg_count has no single base row target',
      checks: ['Does one view row map to one base row?', 'Is any output column computed?', 'Would a procedure express the write better?'],
      labTitle: 'Update mapping lab',
      labBody: 'For each view column, draw an arrow back to the base table column it came from. If the arrow points to an expression or many rows, the view should probably be read-only.',
      labSteps: ['Pick a view row.', 'Map each column to base data.', 'Mark computed columns.', 'Decide whether UPDATE should be allowed.'],
      labExample: 'MovieTitle(movie_id, title) can map simply.\nMovieCount(movie_id, rentals) has computed rentals.',
      labChecks: ['Would INSERT have all required base values?', 'Would DELETE remove multiple base rows?', 'Is INSTEAD OF logic needed in another DBMS?'],
    },
  ],
  normalization: [
    {
      focus: 'Functional dependencies',
      title: 'Dependencies are semantic rules over all legal instances.',
      concept: 'X determines Y when any two legal rows with the same X must also have the same Y. The rule comes from the domain, not from a lucky sample.',
      advancedLogic: 'A dependency is rejected if you can imagine a legal future instance that violates it. It is accepted when the determinant truly controls the dependent fact.',
      application: 'A serial number can determine a drive model, but a city name may not determine state unless the domain explicitly forbids duplicate city names across states.',
      example: 'serialno -> model\nmodel -> capacity\ncity -> state is risky unless city names are globally unique',
      checks: ['Does this rule hold for every legal future row?', 'Is the determinant too weak?', 'Is the dependency only an accidental sample pattern?'],
      labTitle: 'Counterexample lab',
      labBody: 'For every proposed dependency, try to create two legal rows with the same determinant and different dependent values. If the rows are legal, the dependency is false.',
      labSteps: ['Write X -> Y.', 'Create row one.', 'Create row two with same X.', 'Change Y and decide if legal.'],
      labExample: '(city=Springfield, state=IL)\n(city=Springfield, state=MO)\nproves city does not determine state in a broad domain.',
      labChecks: ['Is the determinant a key?', 'Could business rules change?', 'Are nulls part of the dependency interpretation?'],
    },
    {
      focus: 'Candidate keys',
      title: 'A candidate key is a minimal closure success.',
      concept: 'A key determines every attribute in the relation. A candidate key is a key with no unnecessary attribute.',
      advancedLogic: 'Closure computes what a set of attributes implies under the functional dependencies. Minimality is proven by removing attributes and watching closure fail.',
      application: 'If AB+ contains all attributes but A+ also contains all attributes, then AB is a superkey, not a candidate key.',
      example: 'Given A -> B and B -> C:\nA+ = {A, B, C}\nA is a key for R(A,B,C)',
      checks: ['Does closure reach every attribute?', 'Can any attribute be removed?', 'Are there multiple candidate keys?'],
      labTitle: 'Closure table lab',
      labBody: 'Build a closure table by starting with the proposed determinant and repeatedly adding attributes implied by matching dependencies until nothing changes.',
      labSteps: ['Start with X.', 'Apply every FD whose left side is inside closure.', 'Repeat to a fixed point.', 'Test minimality by removing attributes.'],
      labExample: 'Start A.\nA -> B adds B.\nB -> C adds C.\nA+ = ABC.',
      labChecks: ['Did you apply transitive dependencies?', 'Did you test subsets?', 'Did you confuse superkey with candidate key?'],
    },
    {
      focus: 'Anomalies and normal forms',
      title: 'Normal forms locate facts stored under the wrong determinant.',
      concept: 'Update, insert, and delete anomalies arise when a fact is repeated because it depends on something other than the intended key of the relation.',
      advancedLogic: '2NF addresses partial dependency on part of a composite key, 3NF addresses transitive dependency through non-key attributes, and BCNF makes every determinant a key.',
      application: 'If model determines capacity, storing capacity on every drive serial number repeats a model-level fact at serial-number grain.',
      example: 'Drive(serialno, model, capacity)\nmodel -> capacity\nSplit into Drive(serialno, model) and Model(model, capacity)',
      checks: ['Which determinant owns the repeated fact?', 'Is the determinant a full key?', 'Would deleting one row lose the only copy of a fact?'],
      labTitle: 'Anomaly simulation lab',
      labBody: 'Simulate one update, one insert, and one delete. If any operation creates inconsistency or prevents a legal fact from being stored, the relation is signaling bad fact placement.',
      labSteps: ['Find repeated values.', 'Update one copy only.', 'Try inserting a fact without another fact.', 'Try deleting the last row holding a fact.'],
      labExample: 'Cannot insert a new model capacity until a serial number exists: insert anomaly.',
      labChecks: ['Does the anomaly involve a non-key fact?', 'Could decomposition remove repetition?', 'Would dependency preservation remain acceptable?'],
    },
    {
      focus: 'Decomposition',
      title: 'A good split is lossless and still enforceable.',
      concept: 'Decomposition separates facts by determinant. It is safe only when joining the pieces reconstructs the original legal relation without invented rows.',
      advancedLogic: 'Lossless join depends on the shared attributes controlling one side of the split. Dependency preservation asks whether important rules can still be checked without recombining tables.',
      application: 'Splitting drive facts into Drive and Model is lossless when model identifies one model description and serialno points to one model.',
      example: 'R(serialno, model, capacity)\nR1(serialno, model)\nR2(model, capacity)\nJoin on model reconstructs legal rows',
      checks: ['What attributes are shared?', 'Does the shared attribute determine one side?', 'Can original dependencies still be enforced locally?'],
      labTitle: 'Spurious tuple lab',
      labBody: 'After splitting a relation, join the pieces back on sample rows. If new combinations appear that were not in the original relation, the decomposition is lossy.',
      labSteps: ['Split rows into projections.', 'Natural join the projections.', 'Compare with original rows.', 'Look for invented combinations.'],
      labExample: 'If two rows share a non-key attribute, a bad split can combine left and right sides incorrectly.',
      labChecks: ['Did the join create more rows?', 'Did the split lose a dependency?', 'Is redundancy actually reduced?'],
    },
  ],
  'modules-triggers': [
    {
      focus: 'Procedure boundaries',
      title: 'A stored procedure should represent one database operation.',
      concept: 'A stored procedure packages SQL statements behind a CALL. The boundary should match a meaningful unit of work with clear inputs, outputs, and invariants.',
      advancedLogic: 'Procedures are strongest when they coordinate reads and writes that must be kept consistent. Transaction behavior and error handling should be part of the design, not an afterthought.',
      application: 'Creating copies for a movie reads the current maximum copy number, inserts many rows, and returns the final copy number as one workflow.',
      example: 'CALL create_copies(4, 1000, @last_copy_num);\nSELECT @last_copy_num;',
      checks: ['What invariant is true before and after the call?', 'Which values are caller intent?', 'What result must be returned?'],
      labTitle: 'Procedure contract lab',
      labBody: 'Write a contract for each procedure before coding: purpose, inputs, outputs, side effects, error behavior, and whether partial work is acceptable.',
      labSteps: ['Name the operation.', 'List IN parameters.', 'List OUT results.', 'List tables changed.'],
      labExample: 'Operation: create copies.\nIN: movie id, count.\nOUT: last copy number.\nChanges: MovieCopy rows.',
      labChecks: ['Can callers predict side effects?', 'Should the operation be atomic?', 'Does the procedure duplicate a simple constraint?'],
    },
    {
      focus: 'Parameters and variables',
      title: 'Parameter modes define the caller-procedure boundary.',
      concept: 'IN parameters carry values into a procedure, OUT parameters carry computed values back, and local variables hold internal state.',
      advancedLogic: 'Good procedure design avoids hidden global assumptions. OUT values should be intentionally assigned, and local variables should make loop state visible and testable.',
      application: 'A create_copies procedure uses IN movie_id and num_copies, local counters for the loop, and an OUT parameter for the final inserted copy number.',
      example: 'CREATE PROCEDURE create_copies(\n  IN given_movie_id INT,\n  IN num_copies INT,\n  OUT last_copy_num INT\n)',
      checks: ['Is each parameter one-directional?', 'Could a local variable replace an unnecessary INOUT?', 'Is the OUT value assigned on every path?'],
      labTitle: 'Parameter role lab',
      labBody: 'Rewrite the procedure signature as a sentence. If a parameter cannot be described as supplied by caller or returned to caller, reconsider its mode.',
      labSteps: ['Mark caller-supplied values.', 'Mark returned values.', 'Move temporary state to local variables.', 'Check every exit path.'],
      labExample: 'Caller supplies movie id and count; procedure returns last copy number.',
      labChecks: ['Is a session variable being used accidentally?', 'Does OUT have a default on failure?', 'Are names distinct from column names?'],
    },
    {
      focus: 'Triggers and ECA logic',
      title: 'Triggers are implicit event-condition-action rules.',
      concept: 'A trigger runs because INSERT, UPDATE, or DELETE happened on a table. Its logic is implicit from the caller perspective, so it must be narrow and documented.',
      advancedLogic: 'Triggers can enforce cross-row reactions, audit changes, or maintain derived state, but broad hidden side effects can make systems difficult to debug.',
      application: 'A trigger might log changes to rental status, but a checkout workflow that changes inventory and rental rows may be clearer as an explicit procedure.',
      example: 'AFTER INSERT ON RentalItem\nFOR EACH ROW\n-- event happened, now run controlled side effect',
      checks: ['What is the event?', 'What condition narrows the trigger?', 'Which rows can the action change?'],
      labTitle: 'ECA inspection lab',
      labBody: 'Document every trigger as event, condition, and action. Then test each operation path that can fire it, including edge cases with OLD and NEW values.',
      labSteps: ['Name event table.', 'Name timing before or after.', 'Write condition.', 'List side-effect tables.'],
      labExample: 'Event: UPDATE MovieCopy.status.\nCondition: status changed.\nAction: insert audit row.',
      labChecks: ['Could recursion occur?', 'Would a caller be surprised?', 'Does a constraint express the rule more clearly?'],
    },
    {
      focus: 'Rule placement',
      title: 'Use the narrowest mechanism that enforces the rule clearly.',
      concept: 'Database systems offer constraints, views, procedures, triggers, and application code. The best location depends on whether the rule is static truth, read shape, explicit workflow, automatic reaction, or interface behavior.',
      advancedLogic: 'Declarative constraints are easiest to reason about for static rules. Procedures are clearer for explicit workflows. Triggers should be reserved for automatic reactions that must fire regardless of caller.',
      application: 'A foreign key belongs in DDL. An active-movie read model can be a view. A batch copy creation workflow can be a procedure. An audit entry can be a trigger.',
      example: 'Static truth -> constraint\nReusable read shape -> view\nExplicit operation -> procedure\nAutomatic reaction -> trigger',
      checks: ['Does the rule need time order?', 'Should the caller explicitly request it?', 'Can DDL enforce it directly?'],
      labTitle: 'Mechanism choice lab',
      labBody: 'Given a rule, classify it before writing SQL. Many overcomplicated triggers disappear when a foreign key, unique constraint, or procedure boundary is chosen first.',
      labSteps: ['State the rule.', 'Classify rule type.', 'Choose mechanism.', 'Describe how failure appears to the user.'],
      labExample: 'No duplicate email: UNIQUE.\nCreate 1000 copies: procedure.\nLog deletes: trigger.',
      labChecks: ['Is enforcement visible?', 'Is the rule testable?', 'Could two mechanisms conflict?'],
    },
  ],
  'storage-indexes': [
    {
      focus: 'Physical I/O',
      title: 'The cost model starts with pages, not individual rows.',
      concept: 'Database storage moves fixed-size pages or blocks. Even when a query needs one row, the DBMS often reads an entire page containing many rows.',
      advancedLogic: 'Physical locality, clustering, and selectivity determine whether an index reduces I/O or creates many random page visits. Counting rows alone is too optimistic.',
      application: 'A dense secondary index can find matching record pointers, but if the data file is unclustered those records may live on many separate pages.',
      example: 'Total cost = index pages visited + data pages fetched\nRows matched is not the same as pages touched',
      checks: ['How many data pages may be touched?', 'Is the access clustered?', 'Is the predicate selective enough?'],
      labTitle: 'Page-count lab',
      labBody: 'Convert row counts into page counts before comparing access paths. This makes the physical cost of a query visible.',
      labSteps: ['Compute records per page.', 'Compute data pages.', 'Compute index entries.', 'Add leaf and data-page visits.'],
      labExample: '120 records, 4 per block -> 30 data blocks.\nDense index entry capacity 10 -> 12 leaf entries blocks if one level.',
      labChecks: ['Did you round up with ceiling?', 'Did you count data pages after index lookup?', 'Could a table scan be cheaper?'],
    },
    {
      focus: 'Buffer management',
      title: 'Pinned and dirty pages constrain replacement.',
      concept: 'A buffer frame can hold a page in memory. A pinned page is actively in use, and a dirty page has changes that must be written before eviction.',
      advancedLogic: 'Replacement policy is limited by correctness. LRU can suggest a victim, but pinned pages are ineligible and dirty pages add write cost.',
      application: 'During a scan, pages are pinned while read. During updates, dirty pages remain valid in memory but require writeback before they can be discarded.',
      example: 'Legal victim = unpinned page\nDirty victim = write page, then evict',
      checks: ['Which frames are pinned?', 'Which pages are dirty?', 'What write cost happens on eviction?'],
      labTitle: 'Frame-state lab',
      labBody: 'Build a table of buffer frames with page id, pin count, dirty bit, and last-used time. Choose the legal victim, not just the oldest victim.',
      labSteps: ['Mark pinned frames.', 'Remove pinned frames from candidate set.', 'Apply replacement policy.', 'Add writeback cost for dirty victim.'],
      labExample: 'Frame A pinned cannot evict.\nFrame B dirty and unpinned can evict only after write.\nFrame C clean and old is cheapest.',
      labChecks: ['Did LRU choose a pinned page?', 'Did dirty write cost get counted?', 'Does scan behavior pollute the buffer?'],
    },
    {
      focus: 'Index density',
      title: 'Dense and sparse indexes answer different physical promises.',
      concept: 'A dense index has an entry for every search-key value or record. A sparse index has selected anchors and depends on ordered data for local scanning.',
      advancedLogic: 'Primary ordered files can support sparse indexes. Secondary indexes usually need dense entries because the data is not physically sorted by the secondary key.',
      application: 'A file ordered by customer id can use sparse anchors on customer id. A name index on that same file needs dense entries because names are scattered.',
      example: 'Sparse primary index: one anchor per data block.\nDense secondary index: one entry per record or key occurrence.',
      checks: ['What is the data file ordered by?', 'Does each index entry point to a block or record?', 'Can local scan find all matching values?'],
      labTitle: 'Density choice lab',
      labBody: 'Choose sparse only when physical order makes anchors safe. Otherwise use dense entries so every matching record can be found.',
      labSteps: ['Name search key.', 'Name file order.', 'Choose dense or sparse.', 'Compute entry count.'],
      labExample: 'Data ordered by id.\nSparse id index works.\nSparse cust_name index fails unless data is ordered by cust_name.',
      labChecks: ['Would two equal names be adjacent?', 'How many entries are needed?', 'Does insertion maintenance change?'],
    },
    {
      focus: 'B+ tree behavior',
      title: 'B+ trees trade extra structure for stable search depth.',
      concept: 'A B+ tree stores separator keys in internal nodes and data pointers in leaves. All leaves stay at the same depth, and leaves are linked for range scans.',
      advancedLogic: 'Fanout keeps trees shallow. Equality lookup is root-to-leaf; range lookup adds a leaf-chain scan. Splits maintain balance while changing separator keys.',
      application: 'An index on movie title can support equality lookup for one title and range lookup for titles beginning inside a lexical interval.',
      example: 'Root -> internal -> leaf\nThen follow leaf links for BETWEEN low AND high',
      checks: ['How many levels are visited?', 'Does the query need a range scan?', 'Are records clustered with leaf order?'],
      labTitle: 'Traversal lab',
      labBody: 'Trace one lookup by writing each node visited. Then trace a range query by continuing across linked leaves after the first matching leaf.',
      labSteps: ['Start at root.', 'Choose child pointer by separator.', 'Reach leaf.', 'Follow leaf chain until range ends.'],
      labExample: 'Search 42: root [30,60] -> middle child -> leaf containing 42.\nRange 42-75 continues through next leaves.',
      labChecks: ['Did you confuse internal keys with records?', 'Are all leaves same depth?', 'Did the range stop at the right key?'],
    },
  ],
  jdbc: [
    {
      focus: 'JDBC layers',
      title: 'Debug JDBC from infrastructure inward.',
      concept: 'A JDBC program depends on Java code, JDBC interfaces, a vendor driver, a connection URL, credentials, network reachability, and SQL correctness.',
      advancedLogic: 'Errors reveal layers. Class loading failures are not SQL problems, access denied is not a classpath problem, and connection refused is not a query syntax problem.',
      application: 'Before debugging SELECT logic, verify Connector/J is on the classpath, the tunnel is open if needed, and credentials reach the intended MySQL server.',
      example: 'Java app -> JDBC API -> Connector/J -> SSH tunnel -> MySQL',
      checks: ['Did the driver load?', 'Did the network path open?', 'Did authentication succeed?'],
      labTitle: 'Layered failure lab',
      labBody: 'Classify each failure message by layer before changing code. This prevents random edits and makes setup problems teachable.',
      labSteps: ['Read exact exception.', 'Map to layer.', 'Test that layer independently.', 'Only then inspect SQL.'],
      labExample: 'ClassNotFoundException: driver/classpath.\nCommunications link failure: network/tunnel.\nSQLSyntaxErrorException: query text.',
      labChecks: ['Is the URL pointing to local tunnel or remote host?', 'Is the jar visible to runtime?', 'Can a simple test query run?'],
    },
    {
      focus: 'Connections and resources',
      title: 'Database resources need explicit lifetimes.',
      concept: 'Connection, Statement, PreparedStatement, CallableStatement, and ResultSet represent resources outside ordinary Java memory.',
      advancedLogic: 'Resource leaks can exhaust server connections or leave cursors open. Try-with-resources encodes cleanup even when exceptions occur.',
      application: 'Open a connection for a controlled unit of work, create statements inside it, read results, and let resources close in reverse order.',
      example: 'try (Connection c = DriverManager.getConnection(url, user, pass);\n     PreparedStatement ps = c.prepareStatement(sql);\n     ResultSet rs = ps.executeQuery()) { ... }',
      checks: ['Who closes the ResultSet?', 'Who closes the Statement?', 'How are exceptions handled?'],
      labTitle: 'Resource lifetime lab',
      labBody: 'Draw a timeline for every object that touches the database. The code should make opening and closing visible.',
      labSteps: ['Open connection.', 'Prepare statement.', 'Execute and read result.', 'Close resources automatically.'],
      labExample: 'Connection surrounds statement.\nStatement surrounds result set.\nResult set closes before statement.',
      labChecks: ['Can repeated runs exhaust connections?', 'Does update code close statements too?', 'Is transaction scope clear?'],
    },
    {
      focus: 'Prepared statements',
      title: 'Placeholders bind values, not SQL structure.',
      concept: 'PreparedStatement separates the SQL template from runtime values. The driver handles quoting and type conversion for placeholders.',
      advancedLogic: 'A placeholder can replace a literal value, not a table name, column name, operator, or keyword. Dynamic SQL structure requires whitelisting, not parameter binding.',
      application: 'Filtering by rating should bind the rating value with setString. Choosing which column to sort by should use a validated list of allowed column names.',
      example: 'WHERE film_rating = ?\nps.setString(1, rating)\n-- not: ORDER BY ? for arbitrary column names',
      checks: ['Is this part a value or SQL structure?', 'Is the setter type correct?', 'Is user text ever concatenated into SQL?'],
      labTitle: 'Placeholder boundary lab',
      labBody: 'Mark every variable in a SQL-building method. Values become placeholders; identifiers must be validated against a safe internal list.',
      labSteps: ['Identify user values.', 'Replace values with question marks.', 'Bind with set methods.', 'Whitelist structural choices.'],
      labExample: 'Good: WHERE year = ?\nRisky: ORDER BY userText',
      labChecks: ['Did quotes disappear around the question mark?', 'Are parameter positions correct?', 'Can malicious text change SQL structure?'],
    },
    {
      focus: 'Tunneling and deployment',
      title: 'localhost can be the near end of a remote path.',
      concept: 'With SSH tunneling, the Java app connects to a local port, but SSH forwards traffic to a database service reachable from the remote host.',
      advancedLogic: 'Connection debugging should draw the whole route: Java process, local port, SSH connection, remote host, MySQL port, and credentials accepted by MySQL.',
      application: 'The app may use localhost:3306 while the actual MySQL server runs behind webdev. If the tunnel is closed, the same Java code fails before SQL begins.',
      example: 'ssh -L 3306:localhost:3306 user@webdev...\nJDBC URL uses jdbc:mysql://localhost:3306/database',
      checks: ['Is the tunnel process running?', 'Is the local port free?', 'Do credentials belong to the remote MySQL server?'],
      labTitle: 'Route tracing lab',
      labBody: 'Write the connection as a sequence of hops. Then test each hop separately so network problems do not masquerade as Java or SQL bugs.',
      labSteps: ['Start tunnel.', 'Test local port.', 'Open JDBC connection.', 'Run SELECT 1.'],
      labExample: 'Java -> localhost:3306 -> SSH tunnel -> webdev -> MySQL service',
      labChecks: ['Could another MySQL server be using local 3306?', 'Does the URL database name exist?', 'Does the firewall path require the tunnel?'],
    },
  ],
  'capstone-studio': [
    {
      focus: 'End-to-end domain modeling',
      title: 'A capstone schema begins with stable facts and legal state transitions.',
      concept: 'End-to-end modeling names the durable entities, event tables, audit rows, and derived states that make a complete database-backed workflow trustworthy.',
      advancedLogic: 'The model should separate physical item identity from reservation requests, checkout events, return inspections, fee assessments, and payments so each row has one reason to exist.',
      application: 'In an equipment checkout service, EquipmentItem is durable identity, Checkout is a time-bounded event, ReturnInspection records evidence, and FeeAssessment preserves a chargeable decision.',
      example: 'EquipmentItem(item_id, barcode, item_type, status)\nCheckout(checkout_id, item_id, borrower_id, checked_out_at, due_at)\nReturnInspection(checkout_id, staff_id, condition_code)',
      checks: ['What does one row represent?', 'Which states are legal or forbidden?', 'Which facts must survive corrections?'],
      labTitle: 'Domain contract lab',
      labBody: 'Turn one workflow paragraph into table grains and invariants. The goal is not to draw every table first; it is to prevent future rows from contradicting the story.',
      labSteps: ['Name durable entities.', 'Name event rows.', 'Name audit rows.', 'Write one invariant for each.'],
      labExample: 'A camera can be checked out many times.\nOne checkout belongs to one item and one borrower.\nDamage evidence survives even if the fee is later waived.',
      labChecks: ['Did a status value replace an event table?', 'Can an audit row disappear accidentally?', 'Does every foreign key explain a real dependency?'],
    },
    {
      focus: 'Service query contracts',
      title: 'A query contract states the result grain before it exposes rows to screens or code.',
      concept: 'A service query contract is the declared meaning of each result row, column, filter, grouping, and ordering choice used by a report, view, API endpoint, or JDBC method.',
      advancedLogic: 'Contracts should isolate fanout risk, null behavior, grouping rules, and tie or threshold semantics before the query becomes a dependency for users or application code.',
      application: 'An availability endpoint may expose one row per item type, while an overdue-detail endpoint exposes one row per active checkout; mixing those grains creates misleading counts.',
      example: 'CREATE VIEW ActiveCheckout AS\nSELECT checkout_id, item_id, borrower_id, due_at\nFROM Checkout\nWHERE status = \'OUT\';\n\n-- one row = one active checkout',
      checks: ['What is one output row?', 'Which caller depends on this shape?', 'Which joins can multiply rows?'],
      labTitle: 'Query contract lab',
      labBody: 'Write the contract before the SQL. Then test whether every selected column, join, WHERE predicate, GROUP BY column, and HAVING predicate supports that contract.',
      labSteps: ['State output grain.', 'List source tables.', 'Mark row filters.', 'Mark group filters.'],
      labExample: 'Overdue count by borrower:\nFROM ActiveCheckout\nWHERE due_at < CURRENT_DATE\nGROUP BY borrower_id',
      labChecks: ['Does SELECT expose columns outside the group grain?', 'Did a descriptor join multiply events?', 'Should a view protect this interface?'],
    },
    {
      focus: 'Transactional audit workflow',
      title: 'Multi-row operations need explicit success, failure, and evidence boundaries.',
      concept: 'A transactional audit workflow defines which rows change together, which evidence rows must remain, and which state transitions are rejected when preconditions are not met.',
      advancedLogic: 'Checkout, return, damage assessment, payment, and waiver actions should be modeled as operations with preconditions and postconditions rather than scattered single-row updates.',
      application: 'Checking out an item should verify availability, insert the checkout event, change current item state, and leave enough evidence to explain who performed the operation.',
      example: 'START TRANSACTION;\nINSERT INTO Checkout(...);\nUPDATE EquipmentItem SET status = \'OUT\' WHERE item_id = ? AND status = \'AVAILABLE\';\nCOMMIT;',
      checks: ['Which rows change together?', 'What evidence must remain?', 'What happens if the second write fails?'],
      labTitle: 'Workflow trace lab',
      labBody: 'Trace each operation as before state, precondition, writes, postcondition, and rollback behavior. If the trace cannot explain a failure, the workflow boundary is too vague.',
      labSteps: ['Name precondition.', 'List writes.', 'Name audit evidence.', 'Define rollback result.'],
      labExample: 'Return damaged item:\nclose checkout, insert inspection, insert fee, keep item unavailable until repaired.',
      labChecks: ['Can two users check out the same item?', 'Does a waived fee keep evidence?', 'Can a trigger hide a side effect?'],
    },
    {
      focus: 'Operational readiness review',
      title: 'A capstone design is finished only after cost, security, and deployment checks.',
      concept: 'Operational readiness connects logical correctness to index choice, buffer behavior, prepared-statement safety, resource lifetime, migration discipline, and failure diagnosis.',
      advancedLogic: 'The review should map each important workload to an access path, each user value to a placeholder, each connection resource to a close boundary, and each failure message to a layer.',
      application: 'The overdue-checkout query may need an index on status and due_at, the search endpoint must bind user input, and the JDBC method must close ResultSet and PreparedStatement resources.',
      example: 'CREATE INDEX idx_checkout_state_due ON Checkout(status, due_at);\nPreparedStatement ps = conn.prepareStatement(sql);\nps.setString(1, "OUT");',
      checks: ['Which query needs an index?', 'Which values are user supplied?', 'Which layer owns a failure?'],
      labTitle: 'Production review lab',
      labBody: 'Review the system like an operator: explain the access path, the safe input boundary, the resource lifetime, and the first debugging question for each critical workflow.',
      labSteps: ['Map workload to index.', 'Bind user values.', 'Close resources.', 'Classify failures by layer.'],
      labExample: 'Overdue endpoint:\nstatus + due_at index\nPreparedStatement values\ntry-with-resources\nconnection error before SQL debugging',
      labChecks: ['Can the query avoid a full scan?', 'Can user input alter SQL structure?', 'Can repeated requests leak resources?'],
    },
  ],
}

const subtopicPagePlans: Array<{
  title: (topic: SubtopicExpansion) => string
  body: (topic: SubtopicExpansion) => string
  bullets: (topic: SubtopicExpansion) => string[]
  example: (topic: SubtopicExpansion) => string
  bridge: (topic: SubtopicExpansion) => string
  checks: (topic: SubtopicExpansion) => string[]
}> = [
  {
    title: (topic) => `${topic.focus}: orientation and mastery target`,
    body: (topic) => `${topic.concept} This first page sets the vocabulary and the precise mental object you should track while reading the rest of the sequence. Treat the subtopic as a controllable design problem: name the grain, name the legal states, and name the operation that could break the intended meaning.`,
    bullets: (topic) => [
      `Core claim: ${topic.title}`,
      `Learning target: explain ${topic.focus} without relying on a memorized definition.`,
      `First diagnostic: ${topic.checks[0]}`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `Before the technical details, anchor ${topic.focus} in one question: what fact is the database being trusted to protect or compute?`,
    checks: (topic) => topic.checks,
  },
  {
    title: (topic) => `${topic.focus}: row grain before syntax`,
    body: (topic) => `Most database mistakes happen before a keyword is typed, because the designer has not fixed the row grain or the unit of reasoning. For ${topic.focus}, the row grain tells you whether a value belongs to an entity, a relationship, a derived result, a transaction boundary, or an application session. Once that grain is explicit, the later SQL or design choice becomes much less arbitrary.`,
    bullets: (topic) => [
      `State the smallest fact represented by one row, tuple, object, or result record.`,
      `Ask whether ${topic.application}`,
      `Reject any solution that mixes two grains and then tries to repair the ambiguity downstream.`,
    ],
    example: (topic) => topic.example,
    bridge: () => `A correct-looking expression can still be wrong if it describes the wrong unit of reality.`,
    checks: (topic) => [topic.checks[0], 'What is one row allowed to mean?', 'Which columns or values only make sense after the grain is fixed?'],
  },
  {
    title: (topic) => `${topic.focus}: legal states and forbidden states`,
    body: (topic) => `A database system is useful because it separates states that are merely absent from states that are illegal. In ${topic.focus}, do not only ask what value should appear when everything goes well. Ask what the system must reject, preserve, derive, defer, or leave to a higher layer when the input is incomplete, duplicated, late, or adversarial.`,
    bullets: (topic) => [
      `Legal state: the data can exist without contradicting the intended model.`,
      `Forbidden state: the data may be syntactically possible but would make later reasoning unreliable.`,
      `Boundary rule: ${topic.checks[1] ?? topic.checks[0]}`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `This slide turns ${topic.focus} from a topic label into an enforcement question.`,
    checks: (topic) => [topic.checks[0], topic.checks[1] ?? topic.checks[0], 'Which illegal state is most tempting because it looks convenient?'],
  },
  {
    title: (topic) => `${topic.focus}: advanced rule hidden in the material`,
    body: (topic) => `${topic.advancedLogic} This is the part that is often implied rather than taught directly. The advanced move is to test the rule against future data, concurrent actions, nulls, duplicates, renames, ties, and alternate workflows instead of only checking the current sample rows.`,
    bullets: (topic) => [
      `Advanced rule: ${topic.advancedLogic}`,
      `Stress input: create a future case where the naive answer still runs but becomes misleading.`,
      `Mastery signal: you can explain why the stronger rule prevents a specific false conclusion.`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `The deeper logic of ${topic.focus} is not syntax recall; it is choosing the rule that survives future legal data.`,
    checks: (topic) => topic.checks,
  },
  {
    title: (topic) => `${topic.focus}: applied pattern in a real schema`,
    body: (topic) => `In practice, ${topic.application} Read the pattern as a reusable schema or query move rather than as one isolated course example. The same reasoning transfers to products, rentals, pizza preferences, inventory workflows, views, indexes, stored modules, and JDBC workflows whenever values have identity, dependencies, or execution order.`,
    bullets: (topic) => [
      topic.application,
      `Reusable shape: identify input facts, legal transformations, and the final observable result.`,
      `Portability test: describe the same pattern without naming the original example table.`,
    ],
    example: (topic) => topic.example,
    bridge: () => `Application pages connect the abstract rule to the kind of database work a designer or analyst actually performs.`,
    checks: (topic) => [topic.checks[2] ?? topic.checks[0], 'Where would this pattern appear in a different schema?', 'Which part is domain-specific and which part is relational logic?'],
  },
  {
    title: (topic) => `${topic.focus}: syntax shape and readable notation`,
    body: () => `The syntax for this topic should be read as a compact proof of the intended rule. Keywords, column lists, predicates, aliases, clauses, and call order are not decoration; each one narrows the set of legal rows or controls how a result is interpreted. When you read the code aloud, every clause should answer a design question from the previous pages.`,
    bullets: () => [
      `Map each keyword or clause to the exact rule it enforces, computes, or exposes.`,
      `Separate naming convenience from semantic necessity.`,
      `Use formatting to reveal dependency order instead of hiding it in one dense line.`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `If a clause cannot be explained in terms of ${topic.focus}, it is probably accidental or misplaced.`,
    checks: (topic) => ['Which token carries the main rule?', topic.checks[0], 'Which token only improves readability?'],
  },
  {
    title: (topic) => `${topic.focus}: decision tree for choosing the right move`,
    body: (topic) => `A strong database answer is chosen through elimination. Start with the desired invariant or result, decide whether the DBMS can enforce it directly, then decide whether the remaining logic belongs in a query, view, trigger, stored procedure, application transaction, or index strategy. For ${topic.focus}, the wrong layer often creates a system that works during demos and fails under realistic updates.`,
    bullets: (topic) => [
      `Can this be enforced by a declared constraint or operator without procedural code?`,
      `If not, does the rule depend on multiple rows, time, user workflow, or external services?`,
      `Decision checkpoint: ${topic.checks[1] ?? topic.checks[0]}`,
    ],
    example: (topic) => topic.example,
    bridge: () => `Choosing the layer is as important as writing the correct-looking expression.`,
    checks: (topic) => [topic.checks[0], 'What can the DBMS prove automatically?', 'What must be maintained by procedural or application logic?'],
  },
  {
    title: (topic) => `${topic.focus}: common failure mode`,
    body: (topic) => `The most common failure is a solution that answers the visible example while ignoring a hidden degree of freedom. For ${topic.focus}, that hidden freedom may be duplicate legal values, null interpretation, tuple grain, join multiplication, transaction order, stale derived data, path cost, or driver state. The fix is to make the hidden case visible before accepting the solution.`,
    bullets: (topic) => [
      `Failure pattern: a rule is true for the sample instance but not for the schema or workload.`,
      `Countermeasure: invent the smallest legal row, update, or query result that breaks it.`,
      `Repair clue: ${topic.checks[2] ?? topic.checks[0]}`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `Learning ${topic.focus} means learning how it fails, not only how it succeeds.`,
    checks: (topic) => topic.labChecks,
  },
  {
    title: (topic) => `${topic.focus}: counterexample construction`,
    body: (topic) => `Counterexamples are the fastest way to move from beginner memorization to expert reasoning. Build a tiny database instance or operation trace where the naive answer appears plausible, then add one row, null, update, tie, duplicate, or concurrent action that exposes the flaw. This method makes ${topic.focus} testable even without a large dataset.`,
    bullets: () => [
      `Start with the smallest legal case where the naive answer works.`,
      `Add one legal variation that changes the meaning without violating the visible syntax.`,
      `Explain precisely which assumption was false.`,
    ],
    example: (topic) => topic.labExample,
    bridge: () => `A counterexample is not an edge-case distraction; it is evidence about the real rule.`,
    checks: (topic) => [topic.labChecks[0], 'What single row or action breaks the naive answer?', 'Does the counterexample violate the schema, or only your assumption?'],
  },
  {
    title: (topic) => `${topic.focus}: repair strategy`,
    body: () => `After finding a counterexample, repair the model by moving the rule to the narrowest reliable place. That may mean changing a key, adding a foreign key, rewriting a predicate, introducing aggregation, decomposing a relation, materializing a view carefully, adding an index, using a trigger, or shifting responsibility into transaction logic. The repair should remove the cause of the error rather than masking the symptom.`,
    bullets: () => [
      `Repair the invariant, not just the output that happened to look wrong.`,
      `Prefer declarative enforcement when the rule is static and row-local enough.`,
      `Use procedural or application logic only when the rule depends on workflow, time, or multi-step effects.`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `The repaired answer for ${topic.focus} should explain why the earlier counterexample can no longer mislead you.`,
    checks: (topic) => [topic.checks[0], topic.labChecks[0], 'Did the repair introduce a new ambiguity elsewhere?'],
  },
  {
    title: (topic) => `${topic.focus}: visual trace setup`,
    body: (topic) => `Imagine the slide visual as a trace board: inputs enter on the left, relational or procedural operations transform them in the middle, and validated or computed outputs leave on the right. For ${topic.focus}, every arrow should have a reason. The trace becomes a way to see whether values are being filtered, joined, grouped, constrained, locked, indexed, cached, or passed through an API correctly.`,
    bullets: () => [
      `Label each node with a relation, result, constraint, object state, or operation stage.`,
      `Label each arrow with the rule that permits movement to the next state.`,
      `Watch for arrows that silently duplicate, discard, defer, or reinterpret rows.`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `Visual tracing makes the invisible logic of ${topic.focus} inspectable one transition at a time.`,
    checks: () => ['What enters the trace?', 'What rule changes it?', 'What leaves the trace?'],
  },
  {
    title: (topic) => `${topic.focus}: lab step 1`,
    body: (topic) => `${topic.labBody} Begin with the first lab move: ${topic.labSteps[0]}. This step matters because it fixes the object of reasoning before the later steps add syntax or computation. If this first move is vague, every later answer can become an accidental fit to the example instead of a defensible database decision.`,
    bullets: (topic) => [
      topic.labSteps[0],
      `Write the input facts in plain language before using notation.`,
      `State what would count as a contradiction or wrong answer.`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `Do not advance until the first lab move for ${topic.focus} is concrete enough to test.`,
    checks: (topic) => [topic.labChecks[0], topic.checks[0], 'Can someone else reproduce your starting assumption?'],
  },
  {
    title: (topic) => `${topic.focus}: lab step 2`,
    body: (topic) => `The second lab move is: ${topic.labSteps[1] ?? topic.labSteps[0]}. At this point, connect the conceptual rule to a relational structure, query clause, program state, or storage behavior. The important habit is to keep the earlier grain visible while you decide which values should be compared, grouped, referenced, updated, returned, or protected.`,
    bullets: (topic) => [
      topic.labSteps[1] ?? topic.labSteps[0],
      `Translate the plain-language rule into a concrete database operation.`,
      `Check whether the operation changes row count, value legality, visibility, or performance.`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `The second move is where ${topic.focus} becomes operational rather than descriptive.`,
    checks: (topic) => [topic.labChecks[1] ?? topic.labChecks[0], 'What exactly changes after this step?', 'Which earlier assumption is now being used?'],
  },
  {
    title: (topic) => `${topic.focus}: lab step 3`,
    body: (topic) => `The third lab move is: ${topic.labSteps[2] ?? topic.labSteps[0]}. This is usually where hidden multiplicity, dependency, or timing appears. Slow down and ask whether the intermediate state still has the grain, legality, and meaning expected by the prompt or design requirement.`,
    bullets: (topic) => [
      topic.labSteps[2] ?? topic.labSteps[0],
      `Inspect the intermediate result instead of jumping to the final answer.`,
      `Look for silent duplication, silent filtering, stale values, or unconstrained updates.`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `Intermediate states are where many ${topic.focus} errors become visible before they damage the final result.`,
    checks: (topic) => [topic.labChecks[2] ?? topic.labChecks[0], topic.checks[1] ?? topic.checks[0], 'Is the intermediate state still at the intended grain?'],
  },
  {
    title: (topic) => `${topic.focus}: lab step 4`,
    body: (topic) => `The fourth lab move is: ${topic.labSteps[3] ?? topic.labSteps[topic.labSteps.length - 1]}. Use it as a final validation pass rather than a mechanical last step. A mature answer checks whether the final schema, query result, trigger effect, index path, or JDBC operation still matches the requirement after all transformations have happened.`,
    bullets: (topic) => [
      topic.labSteps[3] ?? topic.labSteps[topic.labSteps.length - 1],
      `Compare final output against the original requirement, not only against the expected row count.`,
      `Explain why the chosen rule handles the counterexample from earlier pages.`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `The last lab move proves that ${topic.focus} was understood as a system behavior, not a one-line answer.`,
    checks: (topic) => topic.labChecks,
  },
  {
    title: (topic) => `${topic.focus}: verification checklist`,
    body: (topic) => `Verification is the discipline of making a database answer auditable. For ${topic.focus}, a checklist should inspect the rule, the data state, the execution path, and the user-visible consequence. This protects you from answers that are syntactically valid, visually plausible, and still wrong under a slightly different legal case.`,
    bullets: (topic) => [
      `Verification question 1: ${topic.checks[0]}`,
      `Verification question 2: ${topic.checks[1] ?? topic.labChecks[0]}`,
      `Verification question 3: ${topic.checks[2] ?? topic.labChecks[1] ?? topic.checks[0]}`,
    ],
    example: (topic) => topic.example,
    bridge: (topic) => `A checklist is not busywork; it is how ${topic.focus} becomes repeatable under pressure.`,
    checks: (topic) => [...topic.checks, ...topic.labChecks].slice(0, 4),
  },
  {
    title: (topic) => `${topic.focus}: edge case discipline`,
    body: (topic) => `Edge cases are not rare trivia. They are legal states that reveal whether the model has real coverage. For ${topic.focus}, test nulls, duplicates, empty sets, ties, renamed values, deleted parents, repeated execution, concurrent updates, disconnected sessions, zero denominators, and unusually selective predicates whenever they fit the topic.`,
    bullets: () => [
      `Edge case type: missing, duplicate, zero, tie, stale, optional, or concurrently changed value.`,
      `Use the edge case to decide whether the rule belongs in schema, query, module, trigger, index, or application code.`,
      `Keep the case legal so the failure exposes reasoning, not impossible data.`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `The edge case page hardens ${topic.focus} against the situations that make classroom answers fail in systems.`,
    checks: (topic) => [topic.labChecks[0], topic.labChecks[1] ?? topic.checks[0], 'Which edge case would be most damaging in production?'],
  },
  {
    title: (topic) => `${topic.focus}: transfer to a new domain`,
    body: (topic) => `Transfer proves mastery. Replace the original tables or examples with a different domain, but keep the same relational pressure: identity, reference, set membership, join meaning, normalization dependency, view exposure, procedural side effect, index access path, API state, or statistical denominator. If the solution still works, you understood ${topic.focus} as a general database idea.`,
    bullets: () => [
      `Rename the entities and attributes while preserving the same logical difficulty.`,
      `Retell the rule using the new domain without copying the old wording.`,
      `Confirm that the repair strategy still blocks the same class of mistake.`,
    ],
    example: (topic) => `Transfer exercise:\n${topic.labExample}`,
    bridge: () => `A transferable explanation is stronger than an answer tied to one file or lecture example.`,
    checks: (topic) => ['What changed in the domain?', 'What stayed logically identical?', topic.checks[0]],
  },
  {
    title: (topic) => `${topic.focus}: exam-style reasoning prompt`,
    body: (topic) => `A difficult exam question rarely asks you to recite ${topic.focus}; it gives a small scenario where several answers seem locally reasonable. The winning move is to infer the hidden requirement, test the grain, construct the counterexample, and choose the rule that preserves meaning across all legal cases. Read prompts for what they imply, not only for what they explicitly name.`,
    bullets: () => [
      `Underline the operation or invariant that must remain true.`,
      `Reject any option that only works for the displayed sample data.`,
      `Write one sentence explaining why the distractor is tempting but incomplete.`,
    ],
    example: (topic) => topic.example,
    bridge: () => `The exam prompt page trains the exact reasoning needed for subtle, multi-layered database questions.`,
    checks: (topic) => [topic.checks[0], topic.labChecks[0], 'What would the best distractor misunderstand?'],
  },
  {
    title: (topic) => `${topic.focus}: teach-back checkpoint`,
    body: (topic) => `Finish by teaching ${topic.focus} in a precise sequence: define the grain, state the invariant, show the naive failure, repair the rule, and verify it with a legal edge case. If any of those moves feels vague, return to the page where that move was isolated. The goal is not to finish slides quickly; it is to own the reasoning deeply enough to rebuild it in a new database setting.`,
    bullets: (topic) => [
      `One-sentence concept: ${topic.concept}`,
      `One-sentence advanced rule: ${topic.advancedLogic}`,
      `One-sentence application: ${topic.application}`,
    ],
    example: (topic) => topic.labExample,
    bridge: (topic) => `This checkpoint closes the 20-page ${topic.focus} sequence by making you reconstruct the whole logic from memory and evidence.`,
    checks: (topic) => [...topic.checks, ...topic.labChecks].slice(0, 5),
  },
]

function expansionSlides(topic: SubtopicExpansion): Slide[] {
  return subtopicPagePlans.map((plan, index) => {
    const pageNumber = index + 1
    const codeTeaching = codeTeachingExample(topic, pageNumber)
    const body = plan.body(topic)
    const example = plan.example(topic)
    const bridge = plan.bridge(topic)
    const checks = plan.checks(topic)

    return {
      eyebrow: `${topic.focus} ${pageNumber}/20`,
      title: plan.title(topic),
      body: enrichGeneratedBody(topic, pageNumber, body),
      bullets: plan.bullets(topic),
      example: enrichGeneratedExample(topic, pageNumber, example, codeTeaching),
      codeTitle: codeTeaching?.title,
      codeAnalysis: codeTeaching?.analysis,
      terms: conceptTermsFor(topic, pageNumber, codeTeaching),
      bridge: enrichGeneratedBridge(topic, pageNumber, bridge),
      checks: enrichGeneratedChecks(topic, checks),
    }
  })
}

function expandDeckWithSubtopicPages(deck: Deck): Deck {
  const topics = subtopicExpansionLibrary[deck.id] ?? []
  if (!topics.length) return deck
  const expandedSlides = topics.flatMap(expansionSlides)
  const insertionIndex = Math.min(2, deck.slides.length)

  return {
    ...deck,
    minutes: deck.minutes + Math.ceil(expandedSlides.length * 1.35),
    slides: [
      ...deck.slides.slice(0, insertionIndex),
      ...expandedSlides,
      ...deck.slides.slice(insertionIndex),
    ],
  }
}

export const decks: Deck[] = baseDecks.map(expandDeckWithSubtopicPages)

export const slideCount = decks.reduce((total, deck) => total + deck.slides.length, 0)
export const quizCount = decks.reduce((total, deck) => total + deck.quiz.length, 0)
