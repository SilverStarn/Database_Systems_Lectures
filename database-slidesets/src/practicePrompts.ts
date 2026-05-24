import type { Deck } from './courseData'

const practicePrompts: Record<string, string> = {
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

export function getPracticePrompt(deck: Deck, slideIndex: number) {
  const prompt = practicePrompts[deck.id] ?? 'Before moving on, connect this slide to the exact concept being practiced.'
  return `${prompt} This is checkpoint ${slideIndex + 1} in the deck's reasoning path.`
}
