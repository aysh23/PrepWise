# Final prompt P3 — Validation-guided refinement

- **Workflow step:** Corrective model call only when P2 output fails independent validation.
- **Purpose:** Repair validator-reported errors and coverage gaps while preserving the original hard constraints.
- **Tool/model:** Groq API — `openai/gpt-oss-120b`.
- **Settings:** Temperature 0.2; same strict timetable JSON schema as P2; refinement limit defaults to 2.
- **Examples included:** 0.
- **Source of truth:** `buildRefinementPrompt()` in `server/src/services/studyPlanService.js`.

## Full system prompt construction

P3 is not a separate static prompt file in the application. At runtime the backend constructs it by appending this suffix to the complete P2 system prompt:

Refinement required: the previous timetable failed programmatic validation.
Correct every listed error and coverage gap and preserve all hard constraints.

Validation errors and coverage gaps:
{validation.errors as JSON}

Validation warnings:
{validation.warnings as JSON}

Do not return an explanation instead of the JSON timetable.

## User prompt template

```js
JSON.stringify({
  studentInput: {studentInput},
  analysis: {analysis},
  previousValidation: {validation},
  currentDate: {currentDate}
})
```

## Variables

- `studentInput`: same validated student input used by P2.
- `analysis`: same validated P1 analysis.
- `validation`: latest validator errors and warnings; injected into both the prompt suffix and request context.
- `currentDate`: backend planning date.

## Output format

Same strict JSON timetable schema as P2. If the plan remains invalid after the configured attempts, the service returns a validation error and no timetable.

## Sample run — automated refinement-service test (mocked model responses)

**Initial P2 output:** Empty timetable array.
**Validator feedback:** `Timetable must contain at least one study session`.
**P3 fixture output:** Integration 09:00–10:00 (Learning) and Series 10:10–11:10 (Revision) on 2099-12-21.
**Final validation:** `valid: true`; `refinementAttempts: 1`.

This is a mocked service-test sequence, not a live provider transcript.