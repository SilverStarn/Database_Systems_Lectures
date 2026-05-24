# Database Study App

This folder contains the React and Vite app. It is the part of the project that runs in the browser.

The app is meant for studying database systems with more context than a normal slide deck gives. A topic usually appears with a short explanation, a table or diagram, a code example, and a question that checks whether the idea actually makes sense. The chapters cover schema design, SQL, joins, subqueries, relational algebra, views, normalization, triggers, stored procedures, indexes, storage, JDBC, and larger database-backed application patterns.

## Run Locally

From the repository root, run:

```powershell
npm run slides
```

That starts the Vite server and opens the app automatically.

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

## Main Files

- `src/courseData.ts` stores the lecture deck structure.
- `src/quizContent.ts` stores quiz content and explanations.
- `src/quizRuntime.ts` handles quiz state, scoring, retry behavior, and feedback.
- `src/academicContent.ts` expands topics with deeper examples and technical definitions.
- `src/App.css` contains the main layout and styling.

