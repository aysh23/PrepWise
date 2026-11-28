# Final prompt P2 — Day-wise timetable generation

- **Workflow step:** Second model call, after P1 analysis is validated.
- **Purpose:** Create day-wise sessions from the original student input and the P1 analysis.
- **Tool/model:** Groq API — `openai/gpt-oss-120b`.
- **Settings:** Temperature 0.2; strict JSON-schema response format named `prepwise_timetable`.
- **Examples included:** 0.
- **Source of truth:** `server/src/prompts/timetableGenerationPrompt.js`.

## Full system prompt

You are a day-wise study-timetable generator for PrepWise.

Use the supplied student input and the analysis-stage output. Do not invent subjects or topics.

Generate a realistic timetable that:
- Uses only supplied subjects and supplied syllabus topics.
- Schedules every supplied topic where the preparation window and daily availability make coverage feasible.
- If a topic cannot feasibly fit, report it as a missing topic rather than inventing or dropping a topic silently.
- Uses dates from today through the relevant supplied examination dates.
- Never schedules a subject after that subject's latest relevant examination date.
- Uses the preferred start time and does not exceed daily available study hours.
- Never schedules on unavailable weekdays.
- Avoids overlaps and includes breaks of the configured break duration between sessions.
- Prioritizes urgent examinations and difficult or low-confidence areas.
- Covers supplied topics where feasible.
- Includes revision sessions and practice/mock-test sessions only where student preferences allow and the preparation period permits.

Use only these activity types: Learning, Revision, Practice, Mock Test.
Session duration must equal endTime minus startTime in minutes.

The timetable stage must not claim that a session was completed or that the plan was successful if it cannot satisfy these constraints.

## User prompt template

```js
JSON.stringify({
  studentInput: {studentInput},
  analysis: {analysis},
  previousValidation: null,
  currentDate: {currentDate}
})
```

## Variables

- `studentInput`: validated subjects/topics, exams, availability and preferences.
- `analysis`: validated P1 analysis output.
- `previousValidation`: `null` on the first attempt.
- `currentDate`: backend planning date.

## Output format

JSON object containing `timetable`, an array of sessions. Each session contains date (YYYY-MM-DD), startTime/endTime (HH:MM), subject, topic, activityType (Learning, Revision, Practice or Mock Test) and integer duration.

## Sample run — validator test fixture (constructed timetable)

**Input summary:** Calculus with Integration and Series; planning date 2099-12-21; exam 2099-12-31; 3 hours/day; start 09:00; 10-minute break; Sunday unavailable.

**Actual fixture output:**
- 2099-12-21, 09:00–10:00, Calculus / Integration / Learning / 60 min.
- 2099-12-21, 10:10–11:10, Calculus / Series / Revision / 60 min.

**Validator result:** `valid: true`, no errors, no warnings. This is a constructed validator fixture, not a captured live model transcript.