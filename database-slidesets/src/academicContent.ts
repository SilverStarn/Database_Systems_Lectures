import type { Deck, Slide } from './courseData'

export type AcademicTerm = {
  term: string
  definition: string
  analogy: string
  diagnostic: string
}

export type AcademicStep = {
  label: string
  detail: string
  artifact: string
}

export type AcademicAdvancedSubtopic = {
  title: string
  whyItMatters: string
  advancedMove: string
  appliedPattern: string
  commonFailure: string
  masteryDrill: string
}

export type AcademicRequiredSubtopic = {
  title: string
  thesis: string
  learnerQuestion: string
  instructorAnswer: string
  miniExample: string
  numericCheck: string
  stressTest: string
  practiceMove: string
}

export type AcademicExampleDrill = {
  title: string
  scenario: string
  code: string
  walkthrough: string[]
  numericCheck: string
  takeaway: string
}

export type AcademicPack = {
  subtopics: string[]
  terms: AcademicTerm[]
  misconception: string
  workedTitle: string
  workedExample: string
  workedExplanation: string
  questionStem: string
  steps: AcademicStep[]
}

export type AcademicSlideContent = {
  subtopics: AcademicRequiredSubtopic[]
  advancedSubtopics: AcademicAdvancedSubtopic[]
  terms: AcademicTerm[]
  misconception: string
  workedTitle: string
  workedExample: string
  workedExplanation: string
  question: string
  steps: AcademicStep[]
  exampleDrills: AcademicExampleDrill[]
}

const packs: Record<string, AcademicPack> = {
  ddl: {
    subtopics: [
      'Entity integrity: every stored fact needs a stable identifier.',
      'Referential integrity: a reference is valid only when the parent fact exists.',
      'Action semantics: cascade, set null, and no action encode different business meanings.',
      'Domain design: data type, nullability, default, and enum choices limit impossible states.',
    ],
    terms: [
      {
        term: 'Primary key',
        definition: 'A minimal attribute set whose values identify exactly one tuple in a relation.',
        analogy: 'Like a library call number: the title helps humans, but the call number locates one item.',
        diagnostic: 'Ask whether two real-world objects could ever share the proposed value.',
      },
      {
        term: 'Foreign key',
        definition: 'A constraint requiring child values to match a candidate key in a parent relation, unless the child value is allowed to be null.',
        analogy: 'Like citing a source: the citation is meaningful only if the referenced work exists.',
        diagnostic: 'Look for a relationship verb: rents, owns, serves, likes, belongs to, appears for.',
      },
      {
        term: 'Cascade',
        definition: 'An action that propagates a parent change to dependent child rows.',
        analogy: 'Removing a folder can remove files that have no independent meaning outside it.',
        diagnostic: 'Use it only when the child fact should not survive without the parent.',
      },
      {
        term: 'Composite key',
        definition: 'A key made of multiple attributes because no single attribute is enough for identity.',
        analogy: 'A seat is identified by flight number plus seat number, not seat number alone.',
        diagnostic: 'If numbering restarts inside each parent, expect a composite key.',
      },
    ],
    misconception: 'A diagram line is not automatically a constraint. The DDL must say which columns reference which key and what happens on update or delete.',
    workedTitle: 'Constraint decision pattern',
    workedExample: [
      'CREATE TABLE MovieCopy (',
      '  movie_id MEDIUMINT,',
      '  copy_num SMALLINT,',
      "  status ENUM('WORKING','DAMAGED','MISSING') DEFAULT 'WORKING',",
      '  PRIMARY KEY (movie_id, copy_num),',
      '  FOREIGN KEY (movie_id) REFERENCES Movie(movie_id)',
      ');',
    ].join('\n'),
    workedExplanation: 'The key says that copy numbers restart per movie. The enum restricts impossible status text. The default records the normal case without forcing repeated inserts to specify it.',
    questionStem: 'If deleting a parent row removes a child row, what fact did the child row really represent?',
    steps: [
      { label: 'Read requirement', detail: 'Convert each sentence into required, optional, unique, or referenced facts.', artifact: 'no two customers share email -> UNIQUE(email)' },
      { label: 'Find identity', detail: 'Choose the smallest stable attributes that identify one tuple.', artifact: 'MovieCopy identity = movie_id + copy_num' },
      { label: 'Choose action', detail: 'Decide whether child facts should disappear, become unknown, or block parent deletion.', artifact: 'fav_pizza can be SET NULL, rental history should not cascade away' },
      { label: 'Test invalid row', detail: 'Imagine the row you want the DBMS to reject before applications see it.', artifact: 'RentalItem cannot reference a nonexistent RentalOrder' },
    ],
  },
  dml: {
    subtopics: [
      'Logical query processing order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.',
      'Row grain versus group grain: one output row must represent a precise unit.',
      'Expression columns: arithmetic, string functions, aliases, and date functions shape presentation.',
      'Null logic: IS NULL and IS NOT NULL are not interchangeable with equality.',
    ],
    terms: [
      {
        term: 'Predicate',
        definition: 'A condition that evaluates each candidate row or group as true, false, or unknown.',
        analogy: 'A checkpoint that only lets rows satisfying the question continue.',
        diagnostic: 'If it removes rows before grouping, it belongs in WHERE; if it removes groups, it belongs in HAVING.',
      },
      {
        term: 'Aggregate',
        definition: 'A function that collapses many rows into one value, such as COUNT, SUM, AVG, MIN, or MAX.',
        analogy: 'A class average: many grades become one number for the class.',
        diagnostic: 'Every non-aggregate selected column should match the GROUP BY grain.',
      },
      {
        term: 'Alias',
        definition: 'A temporary output or table name that makes a result column or relation easier to reference.',
        analogy: 'A label on a lab sample: it does not change the sample, but it makes it usable.',
        diagnostic: 'Use aliases when output needs a readable name or when the same table appears twice.',
      },
      {
        term: 'Result grain',
        definition: 'The real-world unit represented by one row of the final answer.',
        analogy: 'A spreadsheet row can mean one movie, one order, one city, or one customer; the query must know which.',
        diagnostic: 'Say "one row per ..." before writing SELECT.',
      },
    ],
    misconception: 'A query that runs is not automatically correct. It can silently answer at the wrong grain or multiply rows through an accidental cartesian product.',
    workedTitle: 'From prompt to query grain',
    workedExample: [
      'SELECT RO.rental_id,',
      '       COUNT(*) AS num_movies,',
      '       MAX(RI.rental_rate) AS greatest_rate,',
      '       SUM(RI.rental_rate) AS daily_cost',
      'FROM RentalOrder RO, RentalItem RI',
      'WHERE RO.rental_id = RI.rental_id',
      'GROUP BY RO.rental_id;',
    ].join('\n'),
    workedExplanation: 'The output grain is one rental order. RentalItem provides movie-level rows, so grouping by rental_id collapses item rows into order-level facts.',
    questionStem: 'If a GROUP BY query returns too many rows, which grain did the query accidentally preserve?',
    steps: [
      { label: 'Name row source', detail: 'Identify the relation or joined relations that contain the raw facts.', artifact: 'RentalItem contains one row per movie in an order' },
      { label: 'Filter rows', detail: 'Apply conditions before aggregation when they remove individual facts.', artifact: 'WHERE city = Oshkosh AND status = AVAILABLE' },
      { label: 'Set grain', detail: 'Group by exactly the attributes that define one answer row.', artifact: 'GROUP BY state, city' },
      { label: 'Format answer', detail: 'Compute aliases, string labels, and ordering after the row set is logically shaped.', artifact: "CONCAT(FLOOR(length / 60), 'h', MOD(length, 60), 'm')" },
    ],
  },
  'joins-subqueries': {
    subtopics: [
      'Join predicates prevent cartesian-product explosions.',
      'Subqueries answer a nested question whose result becomes a scalar, set, or comparison target.',
      'Anti-joins and NOT IN express difference, but nulls can change the result.',
      'Tie-aware extrema require comparing every group against peer groups.',
    ],
    terms: [
      {
        term: 'Join predicate',
        definition: 'A condition that states which rows from different relations describe the same real-world object or event.',
        analogy: 'A zipper: matching teeth line up two separate sides into one combined structure.',
        diagnostic: 'Look for foreign-key to primary-key equality first.',
      },
      {
        term: 'Scalar subquery',
        definition: 'A subquery expected to return exactly one value.',
        analogy: 'Asking one side question, then using its one answer in the main comparison.',
        diagnostic: 'AVG, MIN, and MAX without GROUP BY often form scalar subqueries.',
      },
      {
        term: 'Anti-join',
        definition: 'A pattern that keeps rows with no matching row in another set.',
        analogy: 'A guest list check for people not already checked in.',
        diagnostic: 'Prompts with "not", "never", or "has not" often need anti-join logic.',
      },
      {
        term: 'Tie preservation',
        definition: 'Returning every row that shares the best value instead of one arbitrary top row.',
        analogy: 'If two students tie for highest score, both are highest.',
        diagnostic: 'Avoid LIMIT 1 when the prompt says account for ties.',
      },
    ],
    misconception: 'A subquery is not inherently more advanced than a join. It is better only when the nested result matches the logical question.',
    workedTitle: 'Tie-aware most-rented pattern',
    workedExample: [
      'SELECT title, year',
      'FROM Movie M, RentalItem I',
      'WHERE M.movie_id = I.movie_id',
      'GROUP BY M.movie_id',
      'HAVING COUNT(*) >= ALL (',
      '  SELECT COUNT(*)',
      '  FROM RentalItem',
      '  GROUP BY movie_id',
      ');',
    ].join('\n'),
    workedExplanation: 'The outer groups count rentals per movie. The ALL comparison keeps every movie whose count is at least every peer count, which means every tied maximum remains.',
    questionStem: 'What happens when a NOT IN subquery contains a null value?',
    steps: [
      { label: 'Classify need', detail: 'Decide if the answer needs columns from another table or only membership in another set.', artifact: 'display title + rate -> join; shorter than average -> scalar subquery' },
      { label: 'Match rows', detail: 'For joins, state the equality that connects facts.', artifact: 'Movie.movie_id = RentalItem.movie_id' },
      { label: 'Nest safely', detail: 'For subqueries, ensure the inner result shape matches the outer comparison.', artifact: 'one value for <, many values for IN' },
      { label: 'Preserve ties', detail: 'For highest or lowest with ties, compare aggregate values to all peer aggregate values.', artifact: 'HAVING COUNT(*) >= ALL (...)' },
    ],
  },
  'relational-algebra': {
    subtopics: [
      'Selection changes rows, projection changes columns, and join changes row context.',
      'Rename is required when two relation instances need separate identities.',
      'Set operators require union-compatible schemas.',
      'Algebra explains why SQL queries can be rewritten without changing meaning.',
    ],
    terms: [
      {
        term: 'Selection',
        definition: 'An operator that returns tuples satisfying a condition while preserving the same attributes.',
        analogy: 'Filtering a spreadsheet by row.',
        diagnostic: 'If the condition says which rows survive, think selection.',
      },
      {
        term: 'Projection',
        definition: 'An operator that returns selected attributes and removes duplicate tuples in pure relational algebra.',
        analogy: 'Keeping only the columns needed for the answer.',
        diagnostic: 'If the prompt says "find names" or "find model numbers", projection is probably last.',
      },
      {
        term: 'Rename',
        definition: 'An operator that assigns temporary relation or attribute names.',
        analogy: 'Calling the same actor by two role names in a comparison scene.',
        diagnostic: 'Self-joins and ambiguous attribute names need rename.',
      },
      {
        term: 'Union-compatible',
        definition: 'Relations with the same number of attributes and compatible domains.',
        analogy: 'Stacking two forms only works if their columns line up.',
        diagnostic: 'Project before union when branches carry extra columns.',
      },
    ],
    misconception: 'Relational algebra is not just notation. It is a precise way to describe the shape of the result before SQL syntax gets involved.',
    workedTitle: 'Algebra to SQL shape',
    workedExample: [
      'Algebra: \u03c0_model(\u03c3_speed >= 3.00(PC))',
      '',
      'SQL:',
      'SELECT model',
      'FROM PC',
      'WHERE speed >= 3.00;',
    ].join('\n'),
    workedExplanation: 'Selection keeps only fast PC rows. Projection then keeps only model values. The SQL WHERE and SELECT clauses express the same two operators.',
    questionStem: 'If projection happens too early, which attribute might disappear before a later join needs it?',
    steps: [
      { label: 'Mark relations', detail: 'List every base relation needed by the prompt.', artifact: 'Product and Laptop for laptop manufacturers' },
      { label: 'Reduce rows', detail: 'Apply selection where conditions are known.', artifact: '\u03c3_hd >= 80(Laptop)' },
      { label: 'Compose', detail: 'Join or use set operators once compatible intermediate relations exist.', artifact: 'Product \u22c8_model Laptop' },
      { label: 'Project final schema', detail: 'End with exactly the attributes requested.', artifact: '\u03c0_manufacturer(...)' },
    ],
  },
  views: {
    subtopics: [
      'A view names a query and exposes it as a relation-like interface.',
      'Views simplify repeated joins and can hide sensitive attributes.',
      'Derived tables are useful only when they create a meaningful intermediate grain.',
      'Updatability depends on whether one view row maps clearly to one base row.',
    ],
    terms: [
      {
        term: 'View',
        definition: 'A named query definition that users can query as if it were a relation.',
        analogy: 'A saved lens over the database, not necessarily a copied photograph.',
        diagnostic: 'Use one when many queries repeat the same join or filtered interface.',
      },
      {
        term: 'Derived table',
        definition: 'A subquery in FROM that creates a temporary relation for the outer query.',
        analogy: 'A scratch table created only for the current question.',
        diagnostic: 'Keep it when it changes grain; remove it when it only hides a normal join.',
      },
      {
        term: 'Updatable view',
        definition: 'A view whose rows can be mapped back to base rows for INSERT, UPDATE, or DELETE.',
        analogy: 'Editing through a mirror works only when the mirror shows one real object unambiguously.',
        diagnostic: 'Aggregates, unions, and many joins usually break simple updatability.',
      },
      {
        term: 'Interface boundary',
        definition: 'A stable exposed relation that shields users from internal schema complexity.',
        analogy: 'An API endpoint for relational data.',
        diagnostic: 'If applications should not know all base tables, consider a view.',
      },
    ],
    misconception: 'A view does not automatically improve performance. It improves naming, reuse, and controlled exposure unless the DBMS materializes or optimizes it specially.',
    workedTitle: 'Useful view boundary',
    workedExample: [
      'CREATE VIEW ActiveMovie AS',
      'SELECT movie_id, title, year',
      'FROM Movie',
      'WHERE movie_id IN (SELECT movie_id FROM RedboxInventory)',
      '   OR movie_id IN (SELECT movie_id FROM RentalItem WHERE return_timestamp IS NULL);',
    ].join('\n'),
    workedExplanation: 'The view names a recurring concept: active movies. Later queries can start from ActiveMovie without restating inventory and outstanding-rental logic.',
    questionStem: 'If a view row is produced by grouping many base rows, which row would an update modify?',
    steps: [
      { label: 'Find repetition', detail: 'Look for query logic that appears in many application tasks.', artifact: 'active movie, customer rental history, available inventory' },
      { label: 'Name relation', detail: 'Choose a view name that describes the result grain.', artifact: 'ActiveMovie means one row per movie' },
      { label: 'Hide details', detail: 'Expose only attributes useful to the consumer.', artifact: 'omit internal workflow columns when not needed' },
      { label: 'Check update path', detail: 'Decide whether users should update through the view or only read it.', artifact: 'aggregate views are usually read-only' },
    ],
  },
  normalization: {
    subtopics: [
      'Functional dependencies describe facts that must hold in every legal instance.',
      'Candidate keys are minimal determinants of all attributes.',
      'Anomalies reveal facts stored at the wrong grain.',
      'Lossless decomposition preserves recoverability after splitting a relation.',
    ],
    terms: [
      {
        term: 'Functional dependency',
        definition: 'A rule X -> Y meaning rows with the same X values must have the same Y values.',
        analogy: 'A serial number determines the product it identifies.',
        diagnostic: 'Ask whether the rule holds because of real-world meaning, not because of the current sample rows.',
      },
      {
        term: 'Determinant',
        definition: 'The attribute set on the left side of a functional dependency.',
        analogy: 'The input to a lookup table.',
        diagnostic: 'If changing this value changes what other values must be, it is a determinant.',
      },
      {
        term: 'Update anomaly',
        definition: 'A risk created when one fact is stored redundantly and must be changed in many rows.',
        analogy: 'Changing a phone number in five contact lists and missing one.',
        diagnostic: 'Look for repeated non-key facts across many tuples.',
      },
      {
        term: 'Lossless join',
        definition: 'A decomposition property ensuring the split relations join back to exactly the original relation.',
        analogy: 'Cutting a document along a guide that lets the pieces fit back without invented text.',
        diagnostic: 'The shared attributes must control one side of the decomposition.',
      },
    ],
    misconception: 'Normalization is not a command to create more tables blindly. It is a disciplined way to place each fact at the key that determines it.',
    workedTitle: 'Dependency check',
    workedExample: [
      'Given Q(A, B, C) with A -> B and B -> C:',
      'Existing tuple: (0, 0, 0)',
      'Candidate insert: (0, 0, 2)',
      'Reject because B = 0 already determines C = 0.',
    ].join('\n'),
    workedExplanation: 'The inserted tuple agrees with A -> B but violates B -> C. A dependency must hold against the entire relation, not only inside one tuple.',
    questionStem: 'If a fact depends on only part of a composite key, why is it being repeated?',
    steps: [
      { label: 'List FDs', detail: 'Write the dependencies implied by the domain.', artifact: 'serialno -> model, batch, capacity' },
      { label: 'Find keys', detail: 'Use closure to see which attributes determine all others.', artifact: 'X+ contains every attribute -> X is a superkey' },
      { label: 'Locate anomaly', detail: 'Find dependencies where the determinant is not the right key for the relation.', artifact: 'retailer stored with drive model can repeat' },
      { label: 'Decompose', detail: 'Split relations so each determinant owns the facts it determines.', artifact: 'Drive(serialno, model), Model(model, capacity)' },
    ],
  },
  'modules-triggers': {
    subtopics: [
      'Stored procedures package multi-statement database work.',
      'Parameters define the boundary between caller and stored logic.',
      'Triggers run automatically from table events and encode ECA behavior.',
      'Procedural logic should complement, not replace, declarative constraints.',
    ],
    terms: [
      {
        term: 'Stored procedure',
        definition: 'Named SQL code stored in the database and executed with CALL.',
        analogy: 'A database-side function for a repeated operation.',
        diagnostic: 'Use it when callers intentionally request a multi-step operation.',
      },
      {
        term: 'OUT parameter',
        definition: 'A parameter assigned inside the procedure and read by the caller after execution.',
        analogy: 'A return slot passed into a lab instrument.',
        diagnostic: 'Use it when the operation must report a computed value such as last copy number.',
      },
      {
        term: 'Trigger',
        definition: 'Database logic that runs automatically on INSERT, UPDATE, or DELETE events.',
        analogy: 'A sensor that reacts when a door opens.',
        diagnostic: 'Use it when the rule must fire regardless of which application caused the event.',
      },
      {
        term: 'Delimiter',
        definition: 'A client parsing setting that allows semicolons inside procedure bodies.',
        analogy: 'Changing the end-of-message marker so the full procedure is sent as one unit.',
        diagnostic: 'It is required by the client, not by the logical algorithm.',
      },
    ],
    misconception: 'Putting logic in a trigger can hide side effects. Prefer constraints for static truth and procedures for explicit workflows when automatic reaction is not required.',
    workedTitle: 'Procedure loop skeleton',
    workedExample: [
      'CALL create_copies(4, 1000, @last);',
      'SELECT @last;',
      '',
      'Algorithm:',
      '1. current_max = MAX(copy_num) for movie 4',
      '2. insert DVD copies current_max + 1 through current_max + 1000',
      '3. store final copy number in @last',
    ].join('\n'),
    workedExplanation: 'The stored procedure is useful because the operation must read current state, insert many rows, and return a value as one database-side workflow.',
    questionStem: 'If a trigger updates inventory after a rental, how will a developer know that side effect occurred?',
    steps: [
      { label: 'Define boundary', detail: 'Decide which values the caller supplies and which values the procedure computes.', artifact: 'given_movie_id and num_copies are IN; last_copy_num is OUT' },
      { label: 'Read state', detail: 'Query the current maximum copy number before inserting.', artifact: 'COALESCE(MAX(copy_num), 0)' },
      { label: 'Repeat safely', detail: 'Loop with a clear counter and insert one copy per iteration.', artifact: 'WHILE copy_counter <= num_copies DO INSERT ... END WHILE' },
      { label: 'Return result', detail: 'Assign the final computed value to the OUT parameter.', artifact: 'SET last_copy_num = new_copy_num' },
    ],
  },
  'storage-indexes': {
    subtopics: [
      'Disk blocks and pages dominate cost because moving data is expensive.',
      'Buffer managers decide which pages stay in memory and which pages are evicted.',
      'Dense and sparse indexes differ by entry coverage.',
      'B+-trees keep ordered search efficient as files grow and change.',
    ],
    terms: [
      {
        term: 'Disk block',
        definition: 'A fixed-size unit transferred between disk and memory.',
        analogy: 'A crate of records moved together even if you need one item.',
        diagnostic: 'Cost questions usually count blocks rather than rows.',
      },
      {
        term: 'Pinned page',
        definition: 'A buffered page currently in use and therefore not eligible for eviction.',
        analogy: 'A book checked out on your desk cannot be reshelved yet.',
        diagnostic: 'A replacement policy must ignore pinned pages.',
      },
      {
        term: 'Sparse index',
        definition: 'An ordered index with entries for only some search-key values or block anchors.',
        analogy: 'Chapter headings in a textbook: they guide you near the target, then you scan locally.',
        diagnostic: 'It only works when the data file is ordered on the search key.',
      },
      {
        term: 'B+-tree',
        definition: 'A balanced ordered index whose internal nodes guide search and leaves point to data records.',
        analogy: 'A multilevel table of contents where every path to a page has the same length.',
        diagnostic: 'Use it for equality and range queries that must remain efficient under updates.',
      },
    ],
    misconception: 'An index is not free. It speeds selected access paths but costs space and update maintenance.',
    workedTitle: 'Index block calculation',
    workedExample: [
      'Records: Customer rows stored 3 per data block',
      'Index entry capacity: 6 entries per index block',
      'Dense index on cust_name for 12 records:',
      'entries = 12',
      'index blocks = CEILING(12 / 6) = 2',
    ].join('\n'),
    workedExplanation: 'Dense means one entry per record. Sparse would use fewer entries, but it requires the data file to be ordered on the search key.',
    questionStem: 'If the data file is not ordered by cust_name, why can a sparse cust_name index miss records?',
    steps: [
      { label: 'Locate data order', detail: 'Determine whether the file is ordered by the proposed search key.', artifact: 'ordered by id does not imply ordered by cust_name' },
      { label: 'Choose density', detail: 'Dense entries cover records; sparse entries cover selected anchors.', artifact: 'secondary indexes are usually dense' },
      { label: 'Count blocks', detail: 'Divide required index entries by entries per block and round up.', artifact: 'CEILING(entries / capacity)' },
      { label: 'Predict access', detail: 'Estimate whether lookup lands directly on records or scans a short ordered range.', artifact: 'B+-tree leaf points to records and supports range scans' },
    ],
  },
  jdbc: {
    subtopics: [
      'JDBC is an interface; Connector/J is the MySQL-specific implementation.',
      'Classpath errors differ from authentication and network errors.',
      'Prepared statements separate SQL structure from user-provided values.',
      'SSH tunneling makes a remote DBMS reachable through a local port.',
    ],
    terms: [
      {
        term: 'JDBC driver',
        definition: 'A library that implements JDBC interfaces for a specific DBMS.',
        analogy: 'A translator between standard Java calls and MySQL protocol details.',
        diagnostic: 'A class not found exception usually points to a missing driver on the classpath.',
      },
      {
        term: 'Connection URL',
        definition: 'A string describing protocol, host, port, and database target.',
        analogy: 'A mailing address for the DBMS session.',
        diagnostic: 'localhost can mean the local tunnel endpoint, not the physical database host.',
      },
      {
        term: 'PreparedStatement',
        definition: 'A precompiled SQL template with placeholders for values.',
        analogy: 'A form with blanks filled in safely later.',
        diagnostic: 'Use it when values come from variables or users.',
      },
      {
        term: 'ResultSet',
        definition: 'A cursor-like object used to read rows returned by a query.',
        analogy: 'A pointer moving row by row through a table-shaped answer.',
        diagnostic: 'Use while(rs.next()) when reading query output.',
      },
    ],
    misconception: 'If a JDBC program fails, do not debug SQL first. Classpath, tunnel, credentials, and database permissions each fail differently.',
    workedTitle: 'Prepared query shape',
    workedExample: [
      'String sql = "SELECT title, year FROM Movie WHERE film_rating = ?";',
      'PreparedStatement ps = conn.prepareStatement(sql);',
      'ps.setString(1, "PG-13");',
      'ResultSet rs = ps.executeQuery();',
      'while (rs.next()) {',
      '  System.out.println(rs.getString("title"));',
      '}',
    ].join('\n'),
    workedExplanation: 'The SQL structure is fixed before values are bound. The driver handles quoting and type conversion for the placeholder value.',
    questionStem: 'If localhost:3306 is forwarded through SSH, where is the MySQL server actually running?',
    steps: [
      { label: 'Load driver', detail: 'Make Connector/J visible to the Java project.', artifact: 'mysql-connector-j-8.0.32.jar on classpath' },
      { label: 'Open tunnel', detail: 'Forward local requests to MySQL through webdev.', artifact: 'ssh -L 3306:localhost:3306 -p 1022 user@webdev...' },
      { label: 'Connect', detail: 'Use URL, user, and password to create a session.', artifact: 'DriverManager.getConnection(url, user, pass)' },
      { label: 'Execute safely', detail: 'Use Statement for fixed SQL and PreparedStatement for values.', artifact: 'setString, setInt, executeQuery, executeUpdate' },
    ],
  },
  'capstone-studio': {
    subtopics: [
      'Capstone modeling: separate durable entities, workflow events, audit evidence, and derived states.',
      'Query contracts: every report, view, and endpoint must declare its result grain and caller responsibility.',
      'Transactional workflow: multi-row operations need preconditions, postconditions, rollback behavior, and auditability.',
      'Operational readiness: indexes, prepared statements, resource lifetimes, and layered debugging complete the design.',
    ],
    terms: [
      {
        term: 'System invariant',
        definition: 'A rule that must remain true after every legal insert, update, delete, routine call, trigger firing, and application request.',
        analogy: 'Like a building code requirement: many workers can touch the system, but the safety property must survive every step.',
        diagnostic: 'State the invariant as "after this operation, it is still true that..." and test it against a counterexample.',
      },
      {
        term: 'Query contract',
        definition: 'The promised shape and meaning of a query result, including row grain, columns, filters, grouping, ordering, and null behavior.',
        analogy: 'Like an API response contract: callers rely on more than the fact that rows came back.',
        diagnostic: 'Before optimizing or styling output, say exactly what one row means and which caller depends on that meaning.',
      },
      {
        term: 'Audit trail',
        definition: 'A preserved chain of evidence explaining who did what, when, why, and which database rows or workflow states were affected.',
        analogy: 'Like a signed maintenance log: fixing the item does not erase the evidence that it was damaged.',
        diagnostic: 'Ask which facts must survive cancellation, correction, waiver, or payment.',
      },
      {
        term: 'Operational boundary',
        definition: 'The layer responsible for a guarantee or failure: constraint, query, view, transaction, trigger, index, JDBC resource, network path, or application rule.',
        analogy: 'Like diagnosing a power outage by checking breaker, outlet, cable, and device separately instead of replacing everything.',
        diagnostic: 'Map each bug or guarantee to the first layer that can prove, reject, or repair it.',
      },
    ],
    misconception: 'A capstone database is not correct merely because each individual SQL statement runs. The statements must preserve one coherent system of row meanings, legal states, workflow evidence, and operational boundaries.',
    workedTitle: 'Capstone operation skeleton',
    workedExample: [
      'START TRANSACTION;',
      'INSERT INTO Checkout(item_id, borrower_id, staff_id, due_at, status)',
      "VALUES (?, ?, ?, ?, 'OUT');",
      'UPDATE EquipmentItem',
      "SET status = 'OUT'",
      "WHERE item_id = ? AND status = 'AVAILABLE';",
      'COMMIT;',
    ].join('\n'),
    workedExplanation: 'The operation treats checkout as a transaction: the event row and the current item state must agree. The WHERE predicate on the update is a guard against checking out an unavailable item.',
    questionStem: 'If an operation changes several tables, what invariant proves that the system is still in a legal state afterward?',
    steps: [
      { label: 'Name invariant', detail: 'Write the fact that must remain true across the workflow.', artifact: 'An OUT checkout implies the item is not AVAILABLE' },
      { label: 'Place rule', detail: 'Choose constraint, transaction, view, trigger, procedure, index, or application boundary.', artifact: 'FK for borrower, transaction for checkout, index for due-date lookup' },
      { label: 'Trace state', detail: 'Follow before state, writes, after state, and rollback behavior.', artifact: 'AVAILABLE -> OUT only if checkout insert succeeds' },
      { label: 'Review operations', detail: 'Check safety, performance, prepared statement binding, and resource cleanup.', artifact: 'idx_checkout_state_due + PreparedStatement + try-with-resources' },
    ],
  },
}

const advancedSubtopicLibrary: Record<string, AcademicAdvancedSubtopic[]> = {
  ddl: [
    {
      title: 'Entity integrity beyond syntax',
      whyItMatters: 'A primary key is a long-term identity contract, so the hard question is not whether the DBMS accepts it but whether the business can keep it stable for years.',
      advancedMove: 'Compare natural, surrogate, and composite keys by update risk, import reliability, and whether the identifier leaks a business meaning that may later change.',
      appliedPattern: 'Use a surrogate key for customers when emails can change, but still add UNIQUE(email) if the current business rule forbids duplicate active emails.',
      commonFailure: 'Choosing a convenient display attribute as the primary key makes future corrections look like identity changes and can force cascading updates across unrelated facts.',
      masteryDrill: 'For every table, write one sentence beginning with "one row represents..." and then test whether the proposed key identifies exactly that sentence.',
    },
    {
      title: 'Referential integrity as value-level logic',
      whyItMatters: 'A foreign key constrains actual stored values, which means optionality, parent candidate keys, and loading order all become part of the design.',
      advancedMove: 'Separate mandatory relationships from optional relationships before writing DDL; a nullable child foreign key means the relationship can be unknown or absent.',
      appliedPattern: 'In a rental schema, a rental item must reference an existing order, while a patron favorite pizza may be nullable because a patron can exist without a favorite.',
      commonFailure: 'Drawing a relationship line but leaving the child column unconstrained permits orphan rows that no join or application screen can reliably explain.',
      masteryDrill: 'Invent one invalid child row for each foreign key and state exactly which constraint should reject it.',
    },
    {
      title: 'Referential actions as lifecycle design',
      whyItMatters: 'CASCADE, SET NULL, and RESTRICT express whether a child fact is owned by the parent, merely associated with it, or historically independent.',
      advancedMove: 'Create a lifecycle matrix: if the parent is deleted, should the child lose meaning, keep meaning, or become temporarily unassigned?',
      appliedPattern: 'Line items usually cascade with an order in a test schema, but rental history should often restrict deletion because the child event remains meaningful after the movie record changes.',
      commonFailure: 'Using cascade as cleanup can accidentally delete evidence, audit trails, or historical facts that should have survived parent maintenance.',
      masteryDrill: 'For each foreign key, classify the child fact as owned, optional association, or historical record, then choose the action that matches that classification.',
    },
    {
      title: 'Domain design and impossible states',
      whyItMatters: 'Types, nullability, defaults, enums, and checks decide which bad states are impossible before application code or reports ever see them.',
      advancedMove: 'Prefer narrow domains for stable vocabularies, but recognize when a lookup table is better than an enum because the vocabulary needs metadata or frequent change.',
      appliedPattern: 'A copy status enum is reasonable when values are operational states, while film genres may deserve a separate table if users search, merge, or describe them.',
      commonFailure: 'Using NULL to mean many different ideas, such as unknown, not applicable, not yet assigned, and intentionally blank, makes predicates and aggregates ambiguous.',
      masteryDrill: 'For every nullable column, write the exact real-world meaning of NULL and one query that would need to treat it carefully.',
    },
  ],
  dml: [
    {
      title: 'Logical processing and optimizer thinking',
      whyItMatters: 'SQL is written in SELECT-first syntax, but correctness depends on reasoning through FROM, WHERE, GROUP BY, HAVING, SELECT, and ORDER BY.',
      advancedMove: 'Predict the intermediate relation after each logical phase before checking the final rows; this exposes misplaced filters and aliases used too early.',
      appliedPattern: 'A predicate on individual rentals belongs in WHERE, while a predicate on COUNT(*) belongs in HAVING because the count does not exist before grouping.',
      commonFailure: 'Treating SELECT aliases as if they are available during WHERE hides the fact that row filtering happens before display expressions are computed.',
      masteryDrill: 'For a query with grouping, annotate every selected expression as base column, aggregate, group key, or display-only expression.',
    },
    {
      title: 'Result grain and fanout control',
      whyItMatters: 'Most wrong SQL answers come from preserving the wrong grain or multiplying rows through joins before aggregation.',
      advancedMove: 'Before joining, estimate expected cardinality: one-to-one, many-to-one, one-to-many, or many-to-many; then decide whether to pre-aggregate.',
      appliedPattern: 'If orders join to items and payments, aggregate items per order before joining to payments when the final result is one row per order.',
      commonFailure: 'Joining two detail tables directly can multiply facts and inflate SUM or COUNT results while still returning plausible-looking rows.',
      masteryDrill: 'Write "one row per..." for the raw table, each joined intermediate, and the final answer; mismatched sentences show where to group.',
    },
    {
      title: 'Expression columns as derived meaning',
      whyItMatters: 'Expressions should clarify output without hiding whether a value is stored, computed, rounded, formatted, or filtered.',
      advancedMove: 'Separate deterministic business computation from cosmetic formatting; computations often belong in reusable SQL, while final display formatting may belong near the UI.',
      appliedPattern: 'Compute daily rental cost with SUM(rate), but format hours and minutes only after the numeric duration has been correctly derived.',
      commonFailure: 'Rounding inside a subquery too early can change comparisons, rankings, and averages because later logic sees the rounded value instead of the original measure.',
      masteryDrill: 'For every expression in SELECT, ask whether it changes semantics, changes only presentation, or names an already-shaped value.',
    },
    {
      title: 'Three-valued null logic',
      whyItMatters: 'NULL makes predicates evaluate to unknown, and unknown behaves differently from false in WHERE, NOT IN, joins, and aggregates.',
      advancedMove: 'Handle nulls explicitly with IS NULL, IS NOT NULL, COALESCE, or NOT EXISTS depending on whether null means missing fact, optional relationship, or unknown value.',
      appliedPattern: 'To find currently open rentals, test return_timestamp IS NULL instead of comparing the timestamp to a placeholder date.',
      commonFailure: 'Writing column = NULL or column <> NULL never expresses the intended test because NULL is not equal or unequal to ordinary values.',
      masteryDrill: 'Build a three-row mental table with value, different value, and NULL, then evaluate the predicate against all three rows.',
    },
  ],
  'joins-subqueries': [
    {
      title: 'Join cardinality and row multiplication',
      whyItMatters: 'A join is not just a way to fetch columns; it changes how many rows exist and can duplicate measures before aggregation.',
      advancedMove: 'Classify each join edge by cardinality and decide whether it is adding descriptors, adding detail rows, or filtering by existence.',
      appliedPattern: 'Joining movies to copies adds physical inventory detail, while joining rental items to movies usually adds descriptors such as title and year.',
      commonFailure: 'A missing predicate creates a cartesian product, but a logically incomplete predicate can create a subtler fanout that looks almost correct.',
      masteryDrill: 'For every join, predict whether the row count should stay the same, shrink, or expand before running the query.',
    },
    {
      title: 'Subquery shape and correlation',
      whyItMatters: 'A subquery is correct only when its result shape matches the outer operator: one scalar, a set, or a per-row correlated existence test.',
      advancedMove: 'Choose scalar subqueries for one comparison value, IN for membership, EXISTS for correlated existence, and derived tables when the inner query creates a new grain.',
      appliedPattern: 'A shorter-than-average movie can use a scalar AVG subquery, while customers with no rentals are often clearer with NOT EXISTS.',
      commonFailure: 'Using a scalar subquery that returns multiple rows creates runtime errors or forces arbitrary choices that do not match the logical question.',
      masteryDrill: 'Label every subquery as scalar, set, derived relation, or correlated predicate before writing the outer comparison.',
    },
    {
      title: 'Anti-joins under nulls',
      whyItMatters: 'Difference queries are high-risk because NOT IN can be poisoned by a NULL in the subquery result.',
      advancedMove: 'Prefer NOT EXISTS for row-by-row absence tests when the subquery column can be nullable, or explicitly filter out nulls inside NOT IN.',
      appliedPattern: 'To find patrons who never rented a movie, correlate NOT EXISTS on the patron key rather than relying on a global NOT IN list.',
      commonFailure: 'If a NOT IN subquery contains NULL, comparisons become unknown and the outer query can return no rows even when unmatched rows exist.',
      masteryDrill: 'Create a candidate key value that is absent and a subquery list containing NULL; mentally evaluate candidate NOT IN list.',
    },
    {
      title: 'Tie-aware extrema and peer comparison',
      whyItMatters: 'Leader questions often ask for all best rows, not one row that happens to sort first.',
      advancedMove: 'Use aggregate peer comparison, ALL, NOT EXISTS, or window ranking depending on the SQL features available and the required tie behavior.',
      appliedPattern: 'A most-rented movie query should group by movie, count rentals, and keep every group whose count equals the maximum peer count.',
      commonFailure: 'ORDER BY count DESC LIMIT 1 answers a different question when two or more groups share the maximum value.',
      masteryDrill: 'Add a tied maximum to a sample dataset and verify whether your query still returns both leaders.',
    },
  ],
  'relational-algebra': [
    {
      title: 'Operator shape discipline',
      whyItMatters: 'Relational algebra forces every intermediate result to have a known relation schema, which prevents vague query reasoning.',
      advancedMove: 'Track both tuple count intent and attribute set after every operator; projection can remove attributes needed later.',
      appliedPattern: 'Filter laptops by speed first, join to Product while model still exists, then project manufacturer only after the join.',
      commonFailure: 'Projecting only human-facing columns too early destroys keys required by later joins or set operations.',
      masteryDrill: 'After each algebra operator, write the output attributes in parentheses before adding the next operator.',
    },
    {
      title: 'Rename and self-comparison',
      whyItMatters: 'When one relation participates twice, rename creates two logical roles so comparisons are unambiguous.',
      advancedMove: 'Use rename to express peer comparisons such as products from the same maker or employees in the same department without confusing attribute names.',
      appliedPattern: 'To compare two PCs from the same manufacturer, rename Product as P1 and P2 and require P1.maker = P2.maker with P1.model <> P2.model.',
      commonFailure: 'Skipping rename makes the expression ambiguous and can collapse a two-object comparison into a single-row condition.',
      masteryDrill: 'For every self-join, name the two roles in English before writing the algebra.',
    },
    {
      title: 'Set compatibility and bag contrast',
      whyItMatters: 'Pure relational algebra uses set semantics, while SQL often uses bag semantics unless DISTINCT or set operators impose duplicate handling.',
      advancedMove: 'Project and rename branches to compatible schemas before union, intersection, or difference; then decide whether duplicate behavior matters in SQL.',
      appliedPattern: 'To combine PC models and laptop models, project each branch to the same one-column schema before applying union.',
      commonFailure: 'Unioning relations with extra descriptive columns can split values that should have been comparable at a narrower schema.',
      masteryDrill: 'For each set operation, write the left schema and right schema side by side and prove they align.',
    },
    {
      title: 'Equivalence and rewrite safety',
      whyItMatters: 'Algebraic equivalence explains why optimizers can reorder operations, but only when the transformation preserves semantics.',
      advancedMove: 'Push selections below joins when predicates reference one relation, but keep projections late enough to preserve join keys and requested attributes.',
      appliedPattern: 'Filtering Laptop.hd >= 80 before joining to Product is safe and often cheaper because it reduces rows before the join.',
      commonFailure: 'Assuming every SQL rewrite is harmless ignores duplicate rows, null behavior, outer joins, and aggregate timing.',
      masteryDrill: 'Take one query and write two equivalent algebra trees; mark exactly why each moved operator is still legal.',
    },
  ],
  views: [
    {
      title: 'Views as stable relational contracts',
      whyItMatters: 'A view can protect downstream queries from base-table complexity by publishing a named, stable result shape.',
      advancedMove: 'Define the view around result grain and consumer contract, not around the current query text that happened to be inconvenient.',
      appliedPattern: 'ActiveMovie is useful because it gives one row per active movie even if the definition combines inventory and unreturned rental logic.',
      commonFailure: 'Creating a view for every long query can bury logic without improving clarity, reuse, or interface stability.',
      masteryDrill: 'For a proposed view, write the consumer, row grain, exposed columns, and hidden base-table complexity.',
    },
    {
      title: 'Views for controlled exposure',
      whyItMatters: 'Views can publish useful data while omitting sensitive, unstable, or overly detailed columns.',
      advancedMove: 'Use views as read interfaces when applications or analysts need a safe subset, but do not mistake them for complete security without permissions.',
      appliedPattern: 'Expose customer city and rental count while hiding email, password hashes, or internal workflow columns.',
      commonFailure: 'Selecting star inside a view leaks future columns when the base table changes and makes the interface less deliberate.',
      masteryDrill: 'Remove one column from a base table mentally and decide whether the view contract should survive unchanged.',
    },
    {
      title: 'Derived relations and intermediate grain',
      whyItMatters: 'A derived table is valuable when it creates a meaningful intermediate relation, especially after aggregation or ranking.',
      advancedMove: 'Use a FROM subquery when the outer query needs to join or filter against a grouped result that does not exist at base-table grain.',
      appliedPattern: 'Compute rentals per movie in a derived table, then join that result to Movie for titles and filtering.',
      commonFailure: 'Wrapping a simple join in a subquery adds indentation but no conceptual boundary, making the query harder to inspect.',
      masteryDrill: 'For each FROM subquery, state whether its output has a different grain from its inputs; if not, consider removing it.',
    },
    {
      title: 'Updatability and ambiguity',
      whyItMatters: 'A view is writable only when a changed view row maps back to base rows in a clear and legal way.',
      advancedMove: 'Treat grouped, unioned, distinct, and many-join views as read models unless you intentionally route writes through procedures or triggers.',
      appliedPattern: 'Updating a simple MovieTitle view may be possible, but updating an average rental count view has no single base row to modify.',
      commonFailure: 'Assuming a relation-like interface is automatically writable ignores that the view output may be computed from many base rows.',
      masteryDrill: 'For each column in a view, ask which base column would change if a user updated it.',
    },
  ],
  normalization: [
    {
      title: 'Functional dependencies as semantic laws',
      whyItMatters: 'FDs are not mined from the current sample alone; they come from business meaning that must hold for every legal database instance.',
      advancedMove: 'Distinguish accidental correlations from guaranteed dependencies by asking whether two rows may legally share the determinant and differ in the dependent.',
      appliedPattern: 'A product model may determine speed in a controlled catalog, but a customer city does not determine state unless the domain says city names are unique.',
      commonFailure: 'Inferring A -> B because the sample has no counterexample creates designs that fail as soon as new legal data arrives.',
      masteryDrill: 'For each claimed FD, invent a plausible future row pair that would violate it; if the pair is legal, reject the FD.',
    },
    {
      title: 'Closure and candidate-key minimality',
      whyItMatters: 'A candidate key is not merely a unique-looking column; it is a minimal attribute set whose closure determines every attribute.',
      advancedMove: 'Compute closures systematically and then remove attributes one at a time to prove minimality.',
      appliedPattern: 'If AB+ determines all attributes but A+ also determines all attributes, AB is a superkey but not a candidate key.',
      commonFailure: 'Stopping at the first superkey misses smaller keys and can hide partial dependencies in later normalization steps.',
      masteryDrill: 'For every proposed key with two or more attributes, test the closure of each proper subset.',
    },
    {
      title: 'Normal forms as anomaly filters',
      whyItMatters: '2NF, 3NF, and BCNF are not names to memorize; they describe where facts are attached to the wrong determinant.',
      advancedMove: 'Use BCNF as the clean target when every nontrivial determinant should be a key, then evaluate dependency preservation if decomposition becomes awkward.',
      appliedPattern: 'If model determines capacity and serialno determines model, storing capacity beside every serialno repeats a model-level fact.',
      commonFailure: 'Decomposing only because a table is wide ignores whether repeated facts actually depend on a non-key determinant.',
      masteryDrill: 'Circle every repeated non-key value and ask what determinant really owns it.',
    },
    {
      title: 'Lossless and dependency-preserving decomposition',
      whyItMatters: 'A split is useful only if it reconstructs the original facts without spurious tuples and still lets important rules be enforced.',
      advancedMove: 'Check losslessness through the shared attributes and decide whether dependencies can be checked within individual decomposed relations.',
      appliedPattern: 'Splitting R(A,B,C) into R1(A,B) and R2(B,C) is lossless when B determines one side strongly enough for the legal instances.',
      commonFailure: 'A decomposition can remove redundancy but force important constraints to require joins, making enforcement harder.',
      masteryDrill: 'After each split, join the pieces on sample rows and look for invented combinations.',
    },
  ],
  'modules-triggers': [
    {
      title: 'Procedure boundaries and transactions',
      whyItMatters: 'A stored procedure often represents a business operation, so its boundary should match a unit of work rather than a random code fragment.',
      advancedMove: 'Decide which procedures must run atomically and where transaction control, error handling, and caller responsibility should live.',
      appliedPattern: 'Creating many movie copies should either insert the intended batch consistently or report failure clearly rather than leaving an unexplained partial state.',
      commonFailure: 'Moving application code into a procedure without defining error behavior can make failures harder to recover from.',
      masteryDrill: 'For each procedure, state the invariant that should be true before and after the call.',
    },
    {
      title: 'Parameter modes and state transfer',
      whyItMatters: 'IN, OUT, and INOUT parameters define exactly how information crosses the caller-database boundary.',
      advancedMove: 'Use IN values for caller intent, OUT values for computed results, and avoid INOUT unless the parameter truly represents mutable state.',
      appliedPattern: 'create_copies takes movie id and count as IN parameters and returns the last generated copy number as an OUT parameter.',
      commonFailure: 'Using session variables without a clear naming and reading pattern makes procedure results look like hidden global state.',
      masteryDrill: 'Rewrite a procedure signature in English as "caller supplies..., procedure returns..." and check that every parameter has one role.',
    },
    {
      title: 'Trigger event-condition-action discipline',
      whyItMatters: 'Triggers run implicitly, so their scope must be narrow, documented, and tested across INSERT, UPDATE, and DELETE paths.',
      advancedMove: 'Use OLD and NEW row values deliberately, and avoid broad trigger logic that performs unrelated workflow steps.',
      appliedPattern: 'A trigger can reject or log a state transition, but a large rental workflow may be clearer as an explicit procedure.',
      commonFailure: 'Hidden side effects surprise developers because a normal INSERT appears to change unrelated tables.',
      masteryDrill: 'For each trigger, write the event, condition, action, and the table rows that can change.',
    },
    {
      title: 'Rule placement strategy',
      whyItMatters: 'The same business rule may be expressible in constraints, views, procedures, triggers, or application code, but each location has different visibility and enforcement strength.',
      advancedMove: 'Put static truth in constraints, reusable read shape in views, explicit workflows in procedures, automatic reactions in triggers, and interface-only guidance in the application.',
      appliedPattern: 'A foreign key belongs in DDL, a rental checkout workflow may be a procedure, and a derived report can be a view.',
      commonFailure: 'Using triggers to compensate for missing keys or checks creates indirect enforcement that is harder to reason about than declarative constraints.',
      masteryDrill: 'Classify five rules from the schema and justify the narrowest mechanism that enforces each one.',
    },
  ],
  'storage-indexes': [
    {
      title: 'I/O cost and physical locality',
      whyItMatters: 'The DBMS pays heavily for page movement, so physical order and clustering can dominate the cost of a query.',
      advancedMove: 'Estimate pages touched before rows touched; an unclustered index can find many row ids but still force many random page reads.',
      appliedPattern: 'A range query on a clustered B+ tree can scan adjacent leaves and nearby data pages, while an unclustered secondary index may jump across the file.',
      commonFailure: 'Counting index probes without counting data-page fetches underestimates real access cost.',
      masteryDrill: 'For a query, list index pages, leaf pages, and data pages separately before computing total I/O.',
    },
    {
      title: 'Buffer replacement under constraints',
      whyItMatters: 'Buffer policies are not just cache tricks; pinned and dirty pages restrict what can be evicted and when writes must occur.',
      advancedMove: 'Track pin count, dirty bit, and replacement eligibility separately; a good victim page must be unpinned and cheap or necessary to evict.',
      appliedPattern: 'A dirty unpinned page may be evictable, but eviction requires writing it first, while a pinned page cannot be chosen at all.',
      commonFailure: 'Applying LRU mechanically to pinned pages violates correctness because active operations still depend on those pages.',
      masteryDrill: 'Given four frames, mark pinned, dirty, and last-used time, then choose the legal victim and explain the write cost.',
    },
    {
      title: 'Dense, sparse, primary, and secondary indexes',
      whyItMatters: 'Index density and file order determine whether an entry can safely stand for one record, one block, or one range.',
      advancedMove: 'A sparse index is valid only when data order lets an anchor guide a local scan; secondary indexes usually need dense entries.',
      appliedPattern: 'A file ordered by customer id can use a sparse primary index on id, but a name index on the same file is normally dense.',
      commonFailure: 'Using sparse entries on an unordered secondary attribute loses records because equal or nearby values are not physically grouped.',
      masteryDrill: 'For a proposed index, answer: what is the file ordered by, how many entries exist, and what local scan remains?',
    },
    {
      title: 'B+ tree balance and range behavior',
      whyItMatters: 'B+ trees remain shallow and balanced under inserts, while linked leaves make range queries efficient.',
      advancedMove: 'Reason about lookup as root-to-leaf navigation plus optional leaf-chain scan; splits preserve balance but change parent separators.',
      appliedPattern: 'Searching for keys between 40 and 70 descends once to the first relevant leaf and then follows leaf links until the range ends.',
      commonFailure: 'Thinking of a B+ tree as a binary tree hides fanout, uniform leaf depth, and the difference between internal separators and actual records.',
      masteryDrill: 'Trace one equality lookup and one range lookup, counting node visits in each level.',
    },
  ],
  jdbc: [
    {
      title: 'JDBC abstraction and driver responsibility',
      whyItMatters: 'JDBC is the interface your code sees; Connector/J is the implementation that knows MySQL protocol, types, and connection behavior.',
      advancedMove: 'Debug by layer: classpath and driver loading first, URL and network path second, authentication third, SQL logic last.',
      appliedPattern: 'A ClassNotFoundException points to project setup, while an access denied error means the driver loaded and reached the server.',
      commonFailure: 'Changing SQL syntax while the program cannot even load the driver wastes time and hides the real failure layer.',
      masteryDrill: 'For each exception message, classify it as classpath, tunnel, credentials, permissions, SQL syntax, or result-reading logic.',
    },
    {
      title: 'Connection lifecycle and resource safety',
      whyItMatters: 'Connections, statements, and result sets are external resources, not ordinary short-lived Java objects.',
      advancedMove: 'Use try-with-resources or explicit close order so network sockets and server-side resources are released even when errors happen.',
      appliedPattern: 'Open Connection, create PreparedStatement, read ResultSet, and close in reverse order through try-with-resources.',
      commonFailure: 'Leaving ResultSet or Statement objects open can exhaust connections or make repeated demos fail unpredictably.',
      masteryDrill: 'Annotate a JDBC method with the lifetime of every resource it opens.',
    },
    {
      title: 'Prepared statements and type boundaries',
      whyItMatters: 'Prepared statements keep SQL structure separate from values, reducing injection risk and giving the driver type information.',
      advancedMove: 'Bind values with the correct setter, avoid quoting placeholders yourself, and remember that placeholders replace values, not identifiers or SQL keywords.',
      appliedPattern: 'Use WHERE film_rating = ? with ps.setString(1, rating), but do not try to bind a column name with a placeholder.',
      commonFailure: 'Concatenating user text into SQL defeats the point of PreparedStatement even if the final string is passed to prepareStatement.',
      masteryDrill: 'Mark every user-provided value in a query and replace only those values with placeholders.',
    },
    {
      title: 'Tunnels, localhost, and deployment path',
      whyItMatters: 'With SSH tunneling, localhost in the JDBC URL can mean the local end of a tunnel, not the machine where MySQL physically runs.',
      advancedMove: 'Draw the path from Java process to local port, through SSH, to the remote MySQL port before debugging credentials or SQL.',
      appliedPattern: 'A program connects to localhost:3306, SSH forwards that traffic to webdev, and webdev reaches the MySQL service.',
      commonFailure: 'Running the same URL without the tunnel open produces connection errors even though the Java code and SQL are correct.',
      masteryDrill: 'Write the connection route as four hops and test each hop independently.',
    },
  ],
  'capstone-studio': [
    {
      title: 'Domain model as an invariant system',
      whyItMatters: 'A capstone schema must support real operations, not only list nouns. Durable entities, event rows, and audit rows need different keys and survival rules.',
      advancedMove: 'Write one invariant per important workflow and then choose the narrowest database mechanism that can preserve it.',
      appliedPattern: 'EquipmentItem tracks durable identity, Checkout tracks an event, ReturnInspection records evidence, and FeeAssessment preserves a charge decision.',
      commonFailure: 'Storing every workflow state as one mutable status column erases the history needed to explain corrections and fees.',
      masteryDrill: 'For each table, write "one row represents..." and "this row must survive when..." before choosing keys.',
    },
    {
      title: 'Query contracts for screens and services',
      whyItMatters: 'Application screens depend on stable result shape; a query that accidentally changes grain can break totals, pagination, or user decisions without throwing an error.',
      advancedMove: 'Define result grain, null policy, tie behavior, and sorting as part of the contract before optimizing or wrapping the query in a view.',
      appliedPattern: 'An overdue endpoint exposes one row per active checkout, while an inventory summary exposes one row per item type and availability bucket.',
      commonFailure: 'Adding a descriptor join to "get one more label" can multiply rows when the descriptor is not actually one-to-one at the query grain.',
      masteryDrill: 'For each SELECT, annotate FROM, WHERE, GROUP BY, HAVING, and SELECT with the contract clause each part supports.',
    },
    {
      title: 'Transactional workflow and audit behavior',
      whyItMatters: 'Important workflows usually touch several rows, and correctness depends on the group of changes, not on each individual statement in isolation.',
      advancedMove: 'Model before state, precondition, writes, postcondition, rollback result, and audit evidence for every workflow operation.',
      appliedPattern: 'Checkout must insert an event and change item state together; return inspection may close the checkout, create a fee, and preserve staff evidence.',
      commonFailure: 'A partial update can make an item look available while an open checkout still claims it is out.',
      masteryDrill: 'Trace one successful operation and one failed operation, then state which rows should exist after rollback.',
    },
    {
      title: 'Operational readiness beyond logical correctness',
      whyItMatters: 'A design that is logically correct can still fail under load, unsafe input, connection leaks, missing indexes, or unclear deployment paths.',
      advancedMove: 'Review each critical use case for access path, prepared statement boundary, transaction boundary, resource lifetime, and first-failure diagnostic layer.',
      appliedPattern: 'The overdue checkout query needs an index matching status and due date, while the Java endpoint binds status and date values through PreparedStatement.',
      commonFailure: 'Debugging SQL text before checking driver, tunnel, credentials, or resource cleanup wastes time and hides the real failure layer.',
      masteryDrill: 'For each workflow, list the query, index, bound values, open resources, and expected first error if the environment is broken.',
    },
  ],
}

const exampleDrillLibrary: Record<string, AcademicExampleDrill[]> = {
  ddl: [
    {
      title: 'Composite key and legal duplicate-looking row',
      scenario: 'Movie 10 and movie 11 can each have copy number 1. The duplicate-looking value is legal because the full identity is composite.',
      code: 'MovieCopy(movie_id, copy_num, barcode)\nExisting: (10, 1, A-001), (10, 2, A-002)\nInsert:   (11, 1, B-001)\nKey test: UNIQUE(movie_id, copy_num)',
      walkthrough: [
        'copy_num = 1 repeats, but the pair (movie_id, copy_num) does not repeat.',
        'A key on copy_num alone would reject a legal physical copy.',
        'UNIQUE(barcode) can still protect scanner identity as a separate business rule.',
      ],
      numericCheck: 'Rows before = 2, inserted legal row = 1, rows after = 3, duplicate full keys = 0.',
      takeaway: 'A constraint can be too weak or too strong; correctness means matching the real row grain.',
    },
    {
      title: 'Referential action lifecycle table',
      scenario: 'Deleting a pizza should not delete a patron, but deleting an owned order line may delete its line items.',
      code: 'Patron(fav_pizza) REFERENCES Pizza(name) ON DELETE SET NULL\nOrderLine(order_id) REFERENCES Order(order_id) ON DELETE CASCADE\nRentalItem(copy_id) REFERENCES MovieCopy(copy_id) ON DELETE RESTRICT',
      walkthrough: [
        'SET NULL preserves an independently meaningful patron row.',
        'CASCADE is safe only when the child fact has no independent lifecycle.',
        'RESTRICT protects audit or history rows from disappearing through cleanup.',
      ],
      numericCheck: 'Parent delete cases = 3, child survival decisions = preserve / delete / block.',
      takeaway: 'Foreign keys encode lifecycle semantics, not just arrows between boxes.',
    },
  ],
  dml: [
    {
      title: 'WHERE versus HAVING with visible counts',
      scenario: 'A rental table has four item rows. Three are open, but only one movie has at least two open copies.',
      code: 'SELECT movie_id, COUNT(*) AS open_items\nFROM RentalItem\nWHERE returned_at IS NULL\nGROUP BY movie_id\nHAVING COUNT(*) >= 2;',
      walkthrough: [
        'WHERE removes returned rows before groups exist.',
        'GROUP BY changes the output grain to one row per movie.',
        'HAVING tests the aggregate count after grouping.',
      ],
      numericCheck: 'Input rows = 4, WHERE survivors = 3, groups = 2, HAVING survivors = 1.',
      takeaway: 'Clause order is a data-shaping sequence; every count should be explainable from the previous state.',
    },
    {
      title: 'Fanout-safe result grain',
      scenario: 'One order has two item rows and two payment rows. Joining both details before aggregation can create four rows.',
      code: 'WITH item_total AS (\n  SELECT order_id, SUM(price) AS item_total\n  FROM OrderItem GROUP BY order_id\n)\nSELECT order_id, item_total\nFROM item_total;',
      walkthrough: [
        'Pre-aggregate one many-side relation before joining another many-side relation.',
        'Keep the final answer at one row per order.',
        'Compare expected row count before trusting SUM or COUNT.',
      ],
      numericCheck: '2 item rows x 2 payment rows = 4 joined rows if you join too early.',
      takeaway: 'A query can run and still inflate measures if the intermediate grain is wrong.',
    },
  ],
  'joins-subqueries': [
    {
      title: 'Anti-join with a concrete absence test',
      scenario: 'Ari rented, Bo did not, and Cy rented. The answer should contain only Bo.',
      code: 'SELECT p.patron_id, p.name\nFROM Patron AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM RentalOrder AS r\n  WHERE r.patron_id = p.patron_id\n);',
      walkthrough: [
        'The outer row is tested one patron at a time.',
        'The subquery asks whether matching evidence exists.',
        'Only the patron with zero matching rows survives.',
      ],
      numericCheck: 'Outer rows = 3, matching counts = [1, 0, 1], result rows = 1.',
      takeaway: 'Absence queries are easiest when the candidate row and the missing evidence are both visible.',
    },
    {
      title: 'Tie-aware maximum',
      scenario: 'Two laptops share the highest price. A correct extrema query must return both.',
      code: 'SELECT model, price\nFROM Laptop\nWHERE price >= ALL (SELECT price FROM Laptop);',
      walkthrough: [
        'Each row compares its price to every peer price.',
        'Rows with 1800 survive because no peer is greater.',
        'LIMIT 1 would answer a different question when ties exist.',
      ],
      numericCheck: 'Prices = [1400, 1800, 1800, 1200], maximum rows = 2.',
      takeaway: 'Extrema questions need tie policy, not just sorting.',
    },
  ],
  'relational-algebra': [
    {
      title: 'Operator shape with attributes after every step',
      scenario: 'Find makers of laptops with drive at least 1000. Projecting maker before the join is impossible because maker lives in Product.',
      code: 'L1 := σ_drive>=1000(Laptop)          -- attrs: model, drive\nJ1 := Product ⋈ Product.model=L1.model L1\nAns := π_maker(J1)',
      walkthrough: [
        'Selection changes rows but keeps Laptop attributes.',
        'Join adds Product attributes while model still exists.',
        'Projection happens last because maker is available only after the join.',
      ],
      numericCheck: 'Attribute widths: Laptop = 2, joined result = 4+, final answer = 1.',
      takeaway: 'Relational algebra prevents vague SQL thinking by forcing intermediate schemas to be named.',
    },
    {
      title: 'Union compatibility check',
      scenario: 'PC and Laptop branches can be unioned only after both are projected to the same schema.',
      code: 'π_model(PC) ∪ π_model(Laptop)\n-- legal: both sides have one compatible attribute',
      walkthrough: [
        'Union compares whole tuples, not just visually similar columns.',
        'Projection removes branch-specific attributes such as speed or drive.',
        'Rename may be needed when attribute names differ but meanings align.',
      ],
      numericCheck: 'Left arity = 1, right arity = 1, compatible domains = model identifiers.',
      takeaway: 'Set operators require matching relation shapes before they can express set meaning.',
    },
  ],
  views: [
    {
      title: 'View contract as a reusable result',
      scenario: 'AvailableCopy hides damaged and currently rented copies behind one queryable interface.',
      code: 'CREATE VIEW AvailableCopy AS\nSELECT movie_id, copy_num\nFROM MovieCopy\nWHERE status = \'WORKING\'\n  AND NOT EXISTS (... open rental ...);',
      walkthrough: [
        'The view publishes one row per available physical copy.',
        'Consumers do not repeat the availability predicate.',
        'The base tables can remain more detailed than the interface.',
      ],
      numericCheck: 'Base copies = 3, working copies = 2, open rentals removed = 1, view rows = 1.',
      takeaway: 'A good view is a named contract, not a hiding place for arbitrary long SQL.',
    },
    {
      title: 'Updatability mapping',
      scenario: 'Updating city through a key-preserving customer view maps to one base row; updating an aggregate count does not.',
      code: 'UPDATE active_customer\nSET city = \'Atlanta\'\nWHERE customer_id = 42;',
      walkthrough: [
        'customer_id identifies one base customer row.',
        'The view column city maps directly to Customer.city.',
        'An aggregate such as COUNT(*) has no single source row to update.',
      ],
      numericCheck: 'View row maps to base rows = 1 for simple view, many for aggregate view.',
      takeaway: 'View writability is a mapping problem, not a cosmetic SELECT problem.',
    },
  ],
  normalization: [
    {
      title: 'Functional dependency counterexample',
      scenario: 'If B determines C, two rows with the same B cannot legally disagree on C.',
      code: 'R(A, B, C)\nRow 1: (0, 7, blue)\nRow 2: (1, 7, red)\nClaim: B -> C',
      walkthrough: [
        'Both rows share B = 7.',
        'The C values disagree.',
        'Therefore this instance violates B -> C if the dependency is intended.',
      ],
      numericCheck: 'Same determinant count = 2 rows, distinct dependent values = 2, FD violations = 1.',
      takeaway: 'Dependencies are semantic laws over all legal instances, not patterns noticed in one sample.',
    },
    {
      title: 'Lossless decomposition with repeated course facts',
      scenario: 'Course instructor and room repeat under every student enrollment. Split course facts from enrollment facts.',
      code: 'Original(student_id, course_id, instructor, room)\nFD: course_id -> instructor, room\nCourse(course_id, instructor, room)\nEnrollment(student_id, course_id)',
      walkthrough: [
        'course_id owns instructor and room.',
        'Enrollment owns the student-course relationship.',
        'Joining the split tables on course_id reconstructs legal rows without repeating course facts.',
      ],
      numericCheck: 'Original repeated course cells for 2 students = 4; after split course cells stored once = 2.',
      takeaway: 'Normalization reduces repeated facts only when the determinant tells you where the fact belongs.',
    },
  ],
  'modules-triggers': [
    {
      title: 'Procedure as a transaction boundary',
      scenario: 'Creating copies reads the current maximum copy number, inserts multiple rows, and returns the last generated value.',
      code: 'CALL create_copies(4, 3, @last);\n-- if max copy is 7, insert copy_num 8, 9, 10\nSELECT @last; -- 10',
      walkthrough: [
        'The input count controls a loop.',
        'The current maximum controls the next generated number.',
        'The OUT parameter reports the final state back to the caller.',
      ],
      numericCheck: 'Start max = 7, requested = 3, inserted = 3, last_copy_num = 10.',
      takeaway: 'Stored procedures are useful when the operation has stateful database-side steps.',
    },
    {
      title: 'Trigger side-effect trace',
      scenario: 'Inserting a rental item automatically changes the related copy status.',
      code: 'AFTER INSERT ON RentalItem\nFOR EACH ROW\nUPDATE MovieCopy\nSET status = \'RENTED\'\nWHERE movie_id = NEW.movie_id\n  AND copy_num = NEW.copy_num;',
      walkthrough: [
        'The event is the RentalItem insert.',
        'NEW values identify the affected copy.',
        'The side effect updates another table even though the original statement did not mention it.',
      ],
      numericCheck: 'Explicit statements typed = 1, tables changed = 2.',
      takeaway: 'Triggers must be taught as hidden execution paths, not just convenient automation.',
    },
  ],
  'storage-indexes': [
    {
      title: 'Page-count comparison',
      scenario: 'A table has 120 records, 4 records per data page, and a dense index holding 10 entries per leaf page.',
      code: 'Data pages = CEILING(120 / 4) = 30\nDense leaf pages = CEILING(120 / 10) = 12\nLookup cost ≈ root/internal + leaf + data fetches',
      walkthrough: [
        'Rows are not pages; convert row counts before estimating I/O.',
        'An index lookup still may need data-page fetches.',
        'Range scans benefit when leaf and data order cooperate.',
      ],
      numericCheck: '30 data pages versus 12 dense leaf pages before counting root and record fetches.',
      takeaway: 'Physical design becomes understandable when every cost is a page movement.',
    },
    {
      title: 'Buffer victim choice',
      scenario: 'Three frames differ by pin count, dirty bit, and age. LRU alone is not enough.',
      code: 'Frame A: page 8, pinned=1, dirty=0, oldest\nFrame B: page 3, pinned=0, dirty=1\nFrame C: page 5, pinned=0, dirty=0\nLegal cheapest victim: C',
      walkthrough: [
        'Pinned pages cannot be evicted even if they are old.',
        'Dirty pages require writeback before eviction.',
        'A clean unpinned page is usually cheaper to replace.',
      ],
      numericCheck: 'Eligible frames = 2 of 3; dirty write cost for B = 1 extra page write.',
      takeaway: 'Buffer replacement is constrained by correctness before policy preference.',
    },
  ],
  jdbc: [
    {
      title: 'PreparedStatement value boundary',
      scenario: 'The SQL template is fixed, and only the rating value is bound at runtime.',
      code: 'PreparedStatement ps = conn.prepareStatement(\n  "SELECT title FROM Movie WHERE film_rating = ?"\n);\nps.setString(1, rating);',
      walkthrough: [
        'The question mark stands for a value, not a column or keyword.',
        'The driver handles quoting and type conversion.',
        'User text cannot change the SQL structure when it is bound as data.',
      ],
      numericCheck: 'Placeholders = 1, bound values required = 1, structural user inputs allowed = 0.',
      takeaway: 'Prepared statements protect the boundary between SQL structure and user values.',
    },
    {
      title: 'Connection route diagnosis',
      scenario: 'A JDBC URL may point to localhost while traffic is actually forwarded through SSH to MySQL.',
      code: 'Java -> localhost:3306 -> SSH tunnel -> webdev -> MySQL:3306\njdbc:mysql://localhost:3306/dbname',
      walkthrough: [
        'Class loading is checked before network connectivity.',
        'The tunnel must exist before authentication can matter.',
        'SQL syntax is debugged only after connection succeeds.',
      ],
      numericCheck: 'Route hops = 5; failure at hop 2 is not a SELECT bug.',
      takeaway: 'JDBC debugging is layered; random SQL edits do not fix transport failures.',
    },
  ],
  'capstone-studio': [
    {
      title: 'Checkout workflow state trace',
      scenario: 'A checkout should insert an event and change current item state together.',
      code: 'START TRANSACTION;\nINSERT INTO Checkout(item_id, borrower_id, status)\nVALUES (42, 17, \'OUT\');\nUPDATE EquipmentItem\nSET status = \'OUT\'\nWHERE item_id = 42 AND status = \'AVAILABLE\';\nCOMMIT;',
      walkthrough: [
        'The insert creates durable event evidence.',
        'The guarded update proves the item was available.',
        'Both writes belong to one workflow boundary.',
      ],
      numericCheck: 'Required writes = 2; committed partial states allowed = 0.',
      takeaway: 'Capstone workflows need preconditions, writes, postconditions, and rollback behavior.',
    },
    {
      title: 'Operational readiness mini-review',
      scenario: 'An overdue endpoint must be correct, indexed, parameterized, and resource-safe.',
      code: 'CREATE INDEX idx_checkout_status_due\nON Checkout(status, due_at);\n\nSELECT checkout_id, item_id\nFROM Checkout\nWHERE status = ? AND due_at < ?;',
      walkthrough: [
        'The index starts with status because the query filters by status.',
        'The due date range narrows the active rows.',
        'The endpoint should bind both values and close JDBC resources.',
      ],
      numericCheck: 'Filter values = 2, placeholders = 2, required close boundaries = connection / statement / result set.',
      takeaway: 'A finished design connects schema, query, performance, safety, and deployment behavior.',
    },
  ],
}

function splitSubtopicLine(line: string) {
  const colonIndex = line.indexOf(':')
  if (colonIndex >= 0) {
    const rawTitle = line.slice(0, colonIndex)
    const rest = line.slice(colonIndex + 1)
    return {
      title: rawTitle.trim(),
      thesis: rest.trim() || line.trim(),
    }
  }

  const sentenceBreak = line.indexOf('.')
  const rawTitle = sentenceBreak >= 0 ? line.slice(0, sentenceBreak) : line
  const remainder = sentenceBreak >= 0 ? line.slice(sentenceBreak + 1).trim() : ''

  return {
    title: rawTitle.trim(),
    thesis: remainder || `Use this subtopic to connect the slide's concrete artifact to a general database rule, then test that rule against a legal variation instead of accepting the first familiar example.`,
  }
}

function requiredSubtopicCard(
  line: string,
  advanced: AcademicAdvancedSubtopic,
  pack: AcademicPack,
  slide: Slide,
  offset: number,
): AcademicRequiredSubtopic {
  const parsed = splitSubtopicLine(line)
  const step = pack.steps[offset % pack.steps.length]
  const nextStep = pack.steps[(offset + 1) % pack.steps.length]

  return {
    title: parsed.title,
    thesis: `${parsed.thesis} On this slide, connect that idea to "${slide.title}" by naming the row, group, dependency, access path, state transition, or runtime object being controlled.`,
    learnerQuestion: `If this subtopic is not just a definition, what would I have to inspect before trusting an answer about ${parsed.title}?`,
    instructorAnswer: `${advanced.whyItMatters} The practical answer is to use "${step.label}" as evidence: ${step.detail}`,
    miniExample: `Concrete example: ${step.artifact}. Read it as a small test case for ${parsed.title}, then identify the one value, row, group, dependency, page, or runtime resource that would change if the rule were moved to the wrong layer.`,
    numericCheck: `Number check: count the objects before trusting the explanation. Inputs = ${offset + 1}, active reasoning step = ${(offset % pack.steps.length) + 1}, next proof step = ${((offset + 1) % pack.steps.length) + 1}; now replace those placeholders with the actual row count, group count, page count, parameter count, or write count in the displayed example.`,
    stressTest: `${advanced.commonFailure} Stress-test it by asking whether the same explanation survives a null, duplicate, missing parent, fanout, tie, stale state, failed write, or resource leak when that case is legal for the topic.`,
    practiceMove: `${nextStep.label}: ${nextStep.artifact}. Then state why this move proves or falsifies the slide's claim instead of merely matching the displayed example.`,
  }
}

export function getAcademicContent(deck: Deck, slide: Slide, slideIndex: number): AcademicSlideContent {
  const pack = packs[deck.id]
  const termStart = slideIndex % pack.terms.length
  const terms = Array.from({ length: Math.min(3, pack.terms.length) }, (_, offset) => pack.terms[(termStart + offset) % pack.terms.length])
  const subtopicStart = slideIndex % pack.subtopics.length
  const advancedPack = advancedSubtopicLibrary[deck.id] ?? advancedSubtopicLibrary.ddl
  const advancedSubtopics = Array.from(
    { length: Math.min(3, advancedPack.length) },
    (_, offset) => advancedPack[(subtopicStart + offset) % advancedPack.length],
  )
  const subtopics = Array.from(
    { length: Math.min(3, pack.subtopics.length) },
    (_, offset) => requiredSubtopicCard(
      pack.subtopics[(subtopicStart + offset) % pack.subtopics.length],
      advancedPack[(subtopicStart + offset) % advancedPack.length],
      pack,
      slide,
      slideIndex + offset,
    ),
  )

  return {
    subtopics,
    advancedSubtopics,
    terms,
    misconception: pack.misconception,
    workedTitle: pack.workedTitle,
    workedExample: pack.workedExample,
    workedExplanation: `${pack.workedExplanation} Slide focus: ${slide.title}`,
    question: pack.questionStem,
    steps: pack.steps,
    exampleDrills: Array.from(
      { length: Math.min(2, (exampleDrillLibrary[deck.id] ?? exampleDrillLibrary.ddl).length) },
      (_, offset) => {
        const drills = exampleDrillLibrary[deck.id] ?? exampleDrillLibrary.ddl
        return drills[(slideIndex + offset) % drills.length]
      },
    ),
  }
}
