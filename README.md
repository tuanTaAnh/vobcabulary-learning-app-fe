# WortWander Frontend

WortWander is an animated German vocabulary learning web app built with React, TypeScript, and Vite.

It helps learners save vocabulary, review flashcards, answer quizzes, filter important words, and track learning progress through a clean and playful interface.

Backend repository: https://github.com/tuanTaAnh/vobcabulary-learning-app-be

---

## Overview

WortWander turns German vocabulary learning into a more visual and interactive experience.

Users can add German words, store meanings, generate example sentences, organize vocabulary into collections, mark important words with stars, practice with flashcards, take quizzes, and review learning statistics.

The app is especially useful for beginner to intermediate German learners who want a personal vocabulary system that feels simple, visual, and enjoyable to use.

---

## Key Features

Word Book

Add, edit, delete, search, and manage German vocabulary.

Collections

Organize vocabulary into collections such as German Vocab, Travel, Work, Food, or custom learning groups.

Search and Filters

Search words by German word, meaning, or topic. Filter vocabulary by topic, date, and starred status.

Starred Words

Mark important vocabulary and review only starred words later.

Flashcards

Practice German-to-meaning and meaning-to-German flashcards.

Quiz / MCQ Practice

Answer multiple-choice questions and track correct/wrong answers.

AI Scenes

Practice vocabulary through interactive scenario-based learning.

Progress Dashboard

Track total words, daily activity, correct answers, and wrong answers.

Responsive UI

Designed to work on desktop and smaller screens.

Docker-ready Setup

Can be run locally or inside Docker.

---

## Tech Stack

React

TypeScript

Vite

CSS

REST API integration

Docker / Docker Compose

---

## Project Structure

```text
.
├── public/
├── src/
│   ├── api/
│   │   └── client.ts
│   ├── pages/
│   │   ├── AddWordsPage.tsx
│   │   ├── CollectionsPage.tsx
│   │   ├── FlashcardsPage.tsx
│   │   ├── McqPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── ...
│   ├── types.ts
│   ├── styles.css
│   └── main.tsx
├── docker/
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

---

## Environment Setup

This project uses `.env.example` as the environment template.

The real environment files are not committed to Git.

Create your local environment files:

```bash
cp .env.example .env
cp .env.example .env.docker
```

Then edit the values based on your local or Docker setup.

Example environment variable:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use `.env` for local development.

Use `.env.docker` for Docker-based execution.

---

## Backend Requirement

The frontend requires the backend API to be running.

Backend repository:

```text
https://github.com/tuanTaAnh/vobcabulary-learning-app-be
```

Default local backend URL:

```text
http://localhost:8000
```

Make sure your frontend environment points to the backend correctly:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

---

## Build for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Docker Usage

Build and run the frontend with Docker Compose:

```bash
docker compose up -d --build frontend
```

Stop the service:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f frontend
```

---

## Main Pages

Word Book

Manage saved German vocabulary, search words, filter by topic/date/starred status, and open word details.

Flashcards

Practice saved words in both German-to-meaning and meaning-to-German directions.

Quiz

Answer MCQ questions and improve vocabulary recall.

AI Scenes

Practice vocabulary through context-based learning scenarios.

Progress

View learning statistics and daily activity.

Collections

Manage vocabulary groups and learning categories.

---

## Recommended Development Workflow

Start the backend first:

```bash
cd ../vobcabulary-learning-app-be
uvicorn app.main:app --reload
```

Then start the frontend:

```bash
cd ../vobcabulary-learning-app-fe
npm run dev
```

Open the app:

```text
http://localhost:5173
```

---

## GitHub Environment Notes

Do not commit real environment files.

The following files should normally stay local:

```text
.env
.env.docker
node_modules/
dist/
```

Only commit:

```text
.env.example
```

Other developers can copy `.env.example` to create their own `.env` and `.env.docker`.

---

## Deployment Notes

For frontend deployment, make sure the production environment variable points to the deployed backend API.

Example:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

For Vercel or similar platforms, add the environment variable in the platform dashboard instead of committing it to Git.

---

## Related Repository

Backend repository:

```text
https://github.com/tuanTaAnh/vobcabulary-learning-app-be
```

---

## Author

Developed by Tuan Ta Anh

GitHub: https://github.com/tuanTaAnh