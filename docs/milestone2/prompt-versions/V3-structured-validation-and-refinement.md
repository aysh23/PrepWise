# V3 - Structured output, independent validation and refinement

**Version purpose:** Make model responses parseable and enforce constraints outside the language model.  
**Status:** Implemented in the application source.

## Prompt change

The V2 prompts are retained, with structured JSON output requested from the model. The response schema is supplied with the API request. The backend parses the JSON, validates analysis and timetable structures with Zod, and then runs a separate timetable validator.

## Validation-guided refinement prompt

You are refining a PrepWise study timetable that failed independent programmatic validation.

Use the supplied student input, study analysis, previous timetable context, and the validator feedback.

Correct every listed validation error and coverage gap. Preserve all hard constraints:
- Only supplied subjects and syllabus topics
- Correct planning dates and relevant examination deadlines
- Available weekdays and preferred start time
- Daily study-hour limit
- No overlapping sessions
- Required break duration
- Correct session duration and allowed activity type
- Mandatory topic coverage where feasible

Return only the corrected JSON timetable matching the supplied schema. Do not include Markdown, explanation or claims of success outside the JSON.

The validation errors and warnings are supplied dynamically by the backend. Refinement is bounded by the environment variable STUDY_PLAN_REFINEMENT_LIMIT (default 2). If the timetable still fails validation after the configured attempts, the backend rejects it rather than returning an invalid plan.

## Why this version was changed

Structured output makes the response suitable for programmatic parsing, but JSON shape alone does not prove that a timetable follows the student's constraints. V3 added independent Zod and timetable checks. When validation fails, the concrete errors are passed back to the model in a bounded refinement prompt. The application returns a timetable only when validation succeeds.

## Implementation references

- server/src/services/groqService.js
- server/src/services/studyPlanService.js
- server/src/services/timetableValidator.js
- server/src/prompts/studyAnalysisPrompt.js
- server/src/prompts/timetableGenerationPrompt.js

**Evidence note:** V3 is supported by the current code and automated tests. The V1 baseline draft is retained for version-history transparency; no controlled comparative quality score between the versions is claimed.
