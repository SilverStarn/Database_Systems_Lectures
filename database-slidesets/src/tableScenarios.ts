export type DbCell = string | number
export type DbTableSnapshot = {
  title: string
  columns: string[]
  rows: DbCell[][]
  highlightRows?: number[]
}
export type DbTableScenario = {
  title: string
  queryLabel: string
  sql: string
  before: DbTableSnapshot
  after: DbTableSnapshot
  analysis: string[]
  transitions?: DbTransitionEvent[]
}
export type DbTransitionEvent = {
  label: string
  before: string
  operation: string
  after: string
  why: string
}
export type AppliedCaseCard = {
  label: string
  title: string
  objective: string
  code: string
  evidence: string[]
  diagnostic: string
  transfer: string
}

export const tableScenarioLibrary: Record<string, DbTableScenario> = {
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