# PrepWise

PrepWise creates personalized study timetables from a student's subjects, syllabus topics, examination dates, difficulty, confidence, available study hours, and study preferences.

## Tech stack

- React + Vite frontend
- Express backend
- Groq API for AI-powered study analysis and timetable generation
- Zod validation and programmatic timetable constraint checking
- Browser local storage for saved plans

## Run locally

### 1. Configure the backend

Create `server/.env` using `server/.env.example` as a reference:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
STUDY_PLAN_REFINEMENT_LIMIT=2
TOPIC_COVERAGE_REQUIRED=true
```

Keep the API key in the backend environment only. Never put it in a frontend `VITE_*` variable or commit `server/.env`.

The default model supports Groq strict JSON-schema output. Free-tier usage is subject to Groq's current rate and token limits; it is not unlimited.

### 2. Configure the frontend

Create a root `.env` file:

```env
VITE_PREPWISE_API_URL=http://localhost:3001
```

### 3. Install dependencies and start the backend

```bash
cd server
npm install
npm run dev
```

### 4. Start the frontend in a second terminal

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Backend workflow

1. Validate the submitted study-plan input.
2. Ask the AI to analyze subject priorities and study-time allocation.
3. Ask the AI to generate a day-wise timetable using the analysis.
4. Validate the generated timetable independently against supplied topics, dates, availability, and scheduling constraints.
5. Make up to the configured number of refinement attempts when validation fails.
6. Return a timetable only after validation succeeds.

The browser never receives the Groq API key. The backend is the only component that calls the AI provider.

## Tests

Run backend checks from the `server` directory:

```bash
npm test
npm run build
```
