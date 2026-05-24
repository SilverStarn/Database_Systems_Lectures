# Database Slidesets App

This folder contains the React and Vite application used by the Database Systems Lectures project. The app presents database systems as an interactive course: learners can move through lecture decks, inspect visual models, study code examples, answer quiz questions, retry missed problems, and review detailed explanations.

The content is organized around practical database reasoning. It covers schema design, SQL DML, joins, subqueries, relational algebra, views, normalization, stored modules, triggers, indexes, storage behavior, JDBC, and integrated application architecture. Each lecture page is designed to pair a concept with examples, diagrams, code, and small reasoning tasks instead of presenting definitions in isolation.

## Run Locally

From the repository root, run:

```powershell
npm run slides
```

That command starts the Vite development server and opens the app automatically.

From inside this `database-slidesets` folder, run:

```powershell
npm start
```

## Build

From the repository root:

```powershell
npm run slides:build
```

From inside this folder:

```powershell
npm run build
```

## Development Notes

- `src/courseData.ts` stores the lecture deck structure.
- `src/quizContent.ts` stores quiz content and explanations.
- `src/quizRuntime.ts` handles quiz state, scoring, retry behavior, and feedback.
- `src/academicContent.ts` expands topics with deeper examples and technical definitions.
- `src/App.css` contains the responsive layout and visual interaction system.

Created and maintained by SilverStarn.
