import { Database, GraduationCap, ShieldCheck } from 'lucide-react'
import { type Deck } from './courseData'
import { masteryPath, type MasteryPathNode } from './masteryPath'
import { renderMathAwareCode, renderRichText, plainText } from './richText'
import { deckTechnicalTermBank, type TechnicalTermItem } from './technicalTermBank'
import { compactText, identifierFrom } from './textUtils'
type TechnicalCase = {
  title: string
  scenario: string
  code: string
  explanation: string[]
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
      code: `LargeLaptop := ?_{drive >= 1000}(Laptop)
Joined := Product ?_{Product.model = LargeLaptop.model} LargeLaptop
Answer := ?_{maker}(Joined)

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

export function SlideTechnicalExpansion({
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

export function SlideTermStrip({ terms }: { terms: NonNullable<Deck['slides'][number]['terms']> }) {
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
      code: `L1 := ?_L1(Laptop)
L2 := ?_L2(Laptop)
Pairs := ?_{L1.maker = L2.maker AND L1.ram > L2.ram}(L1 ??L2)
Answer := ?_{L1.model, L2.model}(Pairs)`,
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

export function SlideMasteryContext({ deck, masteryNode }: { deck: Deck; masteryNode: MasteryPathNode }) {
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


