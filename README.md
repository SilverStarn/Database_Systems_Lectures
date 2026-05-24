# Database Study Decks

This is a browser-based study app for database systems. It turns the course material into slide decks you can move through, pause on, test yourself with, and come back to when a topic needs another pass.

The app is built around the way database topics usually become clear: start with tables, keys, and constraints; then work through SQL, joins, subqueries, relational algebra, views, normalization, triggers, indexes, storage, JDBC, and larger application examples. The goal is not to memorize labels, but to see what each idea changes in an actual database design or query.

## What Is Inside

- Slide decks for the main database systems topics.
- SQL and DDL examples that show what the code is trying to enforce.
- Relational algebra notes with proper notation and side-by-side SQL connections.
- Normalization, dependency, indexing, trigger, procedure, and JDBC examples.
- Small diagrams and table views that show how rows, keys, joins, and query results change.
- Quizzes for each chapter with retries, scoring, and explanations after each answer.
- A simple start command so the app opens in the browser without hunting for the local address.

## How to Run It

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

## Commands

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
