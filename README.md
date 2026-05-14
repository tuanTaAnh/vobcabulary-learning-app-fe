# 🌍 WortWander Frontend

**WortWander Frontend** is an animated German vocabulary learning web app built with **React**, **TypeScript**, and **Vite**.

It helps learners save vocabulary, organize words into collections, review flashcards, answer quizzes, practice with AI scenes, and track learning progress through a clean and playful interface.

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-App-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://vobcabulary-learning-app-fe.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://github.com/tuanTaAnh/vobcabulary-learning-app-be)

---

## 🚀 Live Demo

Frontend live demo:

https://vobcabulary-learning-app-fe.vercel.app

Frontend repository:

https://github.com/tuanTaAnh/vobcabulary-learning-app-fe

Backend repository:

https://github.com/tuanTaAnh/vobcabulary-learning-app-be

---

## 📌 Overview

**WortWander** turns German vocabulary learning into a more visual, interactive, and enjoyable experience.

Users can add German words, store meanings, generate example sentences, organize vocabulary into collections, mark important words with stars, practice with flashcards, answer multiple-choice questions, and review learning statistics.

The app is especially useful for beginner to intermediate German learners who want a personal vocabulary system that feels simple, visual, and easy to use.

---

## ✨ Key Features

### 📚 Word Book

Add, edit, delete, search, and manage German vocabulary.

### 🗂️ Collections

Organize vocabulary into collections such as:

German Vocab

Travel

Work

Food

Custom learning groups

### 🔎 Search and Filters

Search words by German word, meaning, or topic.

Filter vocabulary by collection, date, and starred status.

### ⭐ Starred Words

Mark important vocabulary and review only starred words later.

### 🃏 Flashcards

Practice saved vocabulary in both directions:

German to meaning

Meaning to German

### ✅ Quiz / MCQ Practice

Answer multiple-choice questions and track correct or wrong answers.

### 🤖 AI Scenes

Practice vocabulary through interactive scenario-based learning.

### 📈 Progress Dashboard

Track learning progress, including:

Total words

Daily activity

Correct answers

Wrong answers

Study history

### 📱 Responsive UI

Designed to work on desktop and smaller screens.

### 🐳 Docker-ready Setup

Run the frontend locally or inside Docker.

---

## 🛠️ Tech Stack

React

TypeScript

Vite

CSS

REST API integration

Docker

Docker Compose

Vercel

---

## 📁 Project Structure

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

The exact structure may vary slightly depending on the current implementation, but the main frontend logic is organized under the `src` directory.

---

## ⚙️ Environment Setup

This project uses `.env.example` as the template for environment configuration.

Real environment files are not committed to Git.

Create your local environment files:

```bash
cp .env.example .env
cp .env.example .env.docker
```

Then edit the values based on your local or Docker setup.

Example environment variable:

```env
VITE_API_BASE=http://localhost:8000
```

Use `.env` for local development.

Use `.env.docker` for Docker-based execution.

---

## 🔌 Backend Requirement

The frontend requires the WortWander backend API to be running.

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
VITE_API_BASE=http://localhost:8000
```

---

## 💻 Local Development

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

## 📦 Build for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🐳 Docker Usage

Build and run the frontend with Docker Compose:

```bash
docker compose up -d --build frontend
```

Stop the service:

```bash
docker compose down
```

View frontend logs:

```bash
docker compose logs -f frontend
```

---

## 🧭 Main Pages

### Word Book

Manage saved German vocabulary, search words, filter by collection/date/starred status, and open word details.

### Collections

Create and manage vocabulary groups for different learning topics.

### Flashcards

Practice saved words in both German-to-meaning and meaning-to-German directions.

### Quiz

Answer MCQ questions and improve vocabulary recall.

### AI Scenes

Practice vocabulary through context-based learning scenarios.

### Progress

View learning statistics and daily activity.

---

## 🔄 Recommended Development Workflow

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

Open backend API documentation:

```text
http://localhost:8000/docs
```

---

## 🚀 Deployment Notes

The frontend can be deployed on Vercel or similar static hosting platforms.

For production deployment, make sure the environment variable points to the deployed backend API.

Example:

```env
VITE_API_BASE=https://your-backend-domain.com
```

For Vercel, add the environment variable in the Vercel dashboard instead of committing it to Git.

Typical Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

After deployment, the live frontend is available at:

```text
https://vobcabulary-learning-app-fe.vercel.app
```

---

## 🔐 GitHub Environment Notes

Do not commit real environment files.

The following files should normally stay local:

```text
.env
.env.docker
node_modules/
dist/
```

Only commit the environment template:

```text
.env.example
```

Other developers can copy `.env.example` to create their own `.env` and `.env.docker`.

---

## 📎 Related Repository

Backend repository:

https://github.com/tuanTaAnh/vobcabulary-learning-app-be

Frontend live demo:

https://vobcabulary-learning-app-fe.vercel.app

---

## 👨‍💻 Author

Developed by **Tuan Ta Anh**

GitHub:

https://github.com/tuanTaAnh
