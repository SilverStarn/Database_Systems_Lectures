# Database Systems Lectures

Database Systems Lectures is an interactive study app for learning database systems through playable lecture decks, visual reasoning tools, worked examples, and chapter quizzes. It was built to make database topics easier to study than a stack of static slides: each chapter connects definitions, SQL, relational algebra, schema design choices, runtime behavior, and realistic debugging questions in one place.

The project focuses on gradual mastery. Learners move from concrete tables and constraints toward more advanced reasoning about query shape, joins, subqueries, normalization, views, stored modules, triggers, indexing, storage behavior, JDBC connectivity, and full database-backed application design.

## Highlights

- Interactive lecture decks with chapter-by-chapter navigation.
- Academic explanations that connect terms, rules, examples, and common failure modes.
- Worked SQL, DDL, relational algebra, normalization, indexing, trigger, procedure, and JDBC examples.
- Visual models for constraints, query pipelines, set logic, dependency repair, access paths, and runtime boundaries.
- Quiz sets with retry logic, first-attempt scoring, answer explanations, and interactive reasoning aids.
- One-command launch scripts so the app opens in the browser without manually copying a local URL.

## Quick Start

Run the app from the repository root:

```powershell
npm run slides
```

On Windows, you can also double-click:

```text
start-slidesets.cmd
```

## Build

```powershell
npm run slides:build
```

## Useful Scripts

```powershell
npm run slides        # Start the lecture app and open it in the browser
npm run slides:build  # Type-check and build the production bundle
npm run slides:lint   # Run ESLint inside the app project
```

## Project Layout

```text
database-slidesets/
  src/
    App.tsx             Main React application shell
    App.css             Responsive visual system and interaction styling
    courseData.ts       Lecture deck and chapter content
    quizContent.ts      Quiz questions, options, and explanations
    quizRuntime.ts      Quiz state, scoring, feedback, and retry logic
    academicContent.ts  Expanded academic examples and term explanations
    masteryPath.ts      Mastery-stage progression data
```

## Contributor

Created and maintained by SilverStarn.
