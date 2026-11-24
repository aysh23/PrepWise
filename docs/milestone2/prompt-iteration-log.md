# PrepWise - Milestone 2 Prompt Iteration Log

**Course:** Prompt Engineering (SCSE4041)  
**Problem:** C20 - Timetable and Study Plan Generator  
**Project:** PrepWise | **Team:** Apex | **Team ID:** C20  
**Provider/model:** Groq API - `openai/gpt-oss-120b`

## Final prompt count

The implemented workflow contains **3 logical prompt forms**:

1. **P1 - Study-priority analysis:** reviews the submitted subjects, topics, examination dates, availability and preferences.
2. **P2 - Timetable generation:** uses the student input and P1 analysis to create day-wise sessions.
3. **P3 - Validation-guided refinement:** is assembled when the timetable validator returns errors or warnings; it asks for a corrected timetable.

P1 and P2 have standalone prompt templates in `server/src/prompts/`. P3 is assembled dynamically in `server/src/services/studyPlanService.js`.

## Version history

| Version | What changed | Why | Recorded implementation/evidence |
|---|---|---|---|
| V1 - One-shot prompt | Combined priority analysis and timetable creation in one prompt. | Established the initial single-pass task framing for the C20 timetable problem. | Preserved in `docs/milestone2/prompt-versions/V1-one-shot-baseline.md`. |
| V2 - Chained prompts | Split the task into P1 study analysis and P2 timetable generation. | Made priority decisions explicit before calendar scheduling and separated the responsibilities of each prompt. | Implemented in `studyAnalysisPrompt.js`, `timetableGenerationPrompt.js` and `studyPlanService.js`. |
| V3 - Structured and checked generation | Added strict JSON-schema response formatting, Zod parsing, independent timetable validation and a dynamic P3 correction prompt. | Ensured that structured output is checked against the student's dates, subjects, topics and scheduling constraints before a plan is returned. | Implemented in `groqService.js`, `studyPlanService.js` and `timetableValidator.js`; covered by backend service and validator tests. |

## Current prompt architecture

### P1 - Study-priority analysis

Role: preparation prioritization analyst. It analyzes the supplied JSON, assigns subject/topic priorities and urgency, recommends study minutes, defines revision requirements and preserves supplied subjects/topics. It does not create calendar sessions.

Source: `server/src/prompts/studyAnalysisPrompt.js`.

### P2 - Timetable generation

Role: day-wise study-timetable generator. It uses the student input and P1 analysis. It must use supplied subjects/topics, examination deadlines, daily availability, unavailable weekdays, breaks and preferences. Activity types are Learning, Revision, Practice and Mock Test.

Source: `server/src/prompts/timetableGenerationPrompt.js`.

### P3 - Validation-guided refinement

P3 is assembled dynamically when P2's result fails programmatic validation. It appends the validator's errors and warnings to the timetable-generation instructions, asks for correction while preserving all hard constraints, and uses the same JSON timetable schema. Refinement is bounded by `STUDY_PLAN_REFINEMENT_LIMIT` (default 2).

Source: `buildRefinementPrompt()` in `server/src/services/studyPlanService.js`.

## Recorded project run evidence

The service-level test in `server/test/refinementService.test.js` uses the Calculus plan with Integration and Series, exam date 2099-12-31, planning date 2099-12-21, 3 hours/day from 09:00, a 10-minute break and Sunday unavailable. Its recorded P1 analysis assigns Calculus High priority and urgency, recommends 120 minutes/day, and allocates 60 minutes to each topic.

The validator case T01 in `server/test/timetableValidator.test.js` accepts two sessions: Integration 09:00-10:00 (Learning) and Series 10:10-11:10 (Revision). The validator returns `valid: true` with empty errors and warnings.

The refinement service test also checks the retry path: an empty timetable is rejected with the validator message `Timetable must contain at least one study session`; the correction path then returns the two-session timetable and records one refinement attempt. The deployed application was separately confirmed to generate a timetable through the live Groq integration.

The version history records the actual prompt and implementation changes. It does not assign numerical prompt-quality improvement scores.
