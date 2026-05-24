export type TechnicalTermItem = {
  term: string
  definition: string
  example: string
}

export const deckTechnicalTermBank: Record<string, TechnicalTermItem[]> = {
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
    { term: 'Selection sigma', definition: 'The relational algebra operator that keeps tuples satisfying a predicate while preserving attributes.', example: '?_{drive >= 1000}(Laptop) keeps only laptops with large drives.' },
    { term: 'Projection pi', definition: 'The operator that keeps chosen attributes and removes duplicate tuples in pure relational algebra.', example: '?_maker(Product) returns the set of makers, not one row per product.' },
    { term: 'Rename rho', definition: 'The operator that gives a relation or attribute a new name so self-reference becomes unambiguous.', example: '?_L1(Laptop) and ?_L2(Laptop) let one laptop row be compared to another.' },
    { term: 'Union compatibility', definition: 'The requirement that set operands have matching arity and compatible domains.', example: 'PC(model) ??Laptop(model) is valid; PC(model, speed) ??Printer(model) is not.' },
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