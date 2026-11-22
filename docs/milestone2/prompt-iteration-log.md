# PrepWise - Milestone 2 Prompt Iteration Log

**Course:** Prompt Engineering (SCSE4041)  
**Problem:** C20 - Timetable and Study Plan Generator  
**Project:** PrepWise | **Team:** Apex | **Team ID:** C20  
**Current provider/model:** Groq API - `openai/gpt-oss-120b`

## Prompt count used in the form

The final workflow contains **3 logical prompt forms**:

1. Study-priority analysis.
2. Initial timetable generation.
3. Validation-guided timetable refinement (constructed dynamically from the timetable prompt plus validator feedback).

There are two standalone prompt templates in `server/src/prompts/`. The third is a dynamic refinement prompt assembled in `server/src/services/studyPlanService.js`.

## Version history

| Version | Design change | Purpose | Evidence status |
|---|---|---|---|
| V1 - Saved baseline draft | One combined prompt asks the model to read subjects, exams and availability, prioritize topics and produce the timetable in one pass. | Establish a simple baseline design for the task. | Saved as a distinct baseline design draft for the version log. It was not executed as a live model trial and no output score is claimed. |
| V2 - Task decomposition | Separate the work into a study-analysis prompt and a timetable-generation prompt. The analysis stage identifies priorities and recommended study time; the second stage creates sessions using the analysis. | Reduce the amount of reasoning and scheduling work bundled into one instruction; make the workflow easier to inspect. | Implemented in `studyAnalysisPrompt.js`, `timetableGenerationPrompt.js` and `studyPlanService.js`. |
| V3 - Structured and checked generation | Request strict JSON-schema output through Groq, validate it with Zod and a separate timetable validator, then construct a refinement prompt from validation errors/warnings for up to the configured attempt limit. | Make output machine-readable and catch hard-constraint violations before a plan is shown as successful. | Implemented in `groqService.js`, `studyPlanService.js` and `timetableValidator.js`; exercised by automated backend tests. |

## Current prompt architecture

### P1 - Study-priority analysis

Role: preparation prioritization analyst. It analyzes only the supplied JSON and does not create a timetable. It assigns priorities and urgency, recommends study minutes, specifies revision requirements and preserves every supplied subject/topic exactly.

Source: `server/src/prompts/studyAnalysisPrompt.js`.

### P2 - Timetable generation

Role: day-wise study-timetable generator. It uses the student input and P1 analysis. It must use only supplied subjects/topics, the preparation window, exam deadlines, daily availability, unavailable weekdays, breaks and preferences. Activity types are Learning, Revision, Practice and Mock Test.

Source: `server/src/prompts/timetableGenerationPrompt.js`.

### P3 - Validation-guided refinement

P3 is assembled dynamically when P2's result fails programmatic validation. It appends the validator's errors and warnings to the timetable-generation instructions, asks for correction while preserving all hard constraints, and uses the same JSON timetable schema. Refinement is bounded by `STUDY_PLAN_REFINEMENT_LIMIT` (default 2).

Source: `buildRefinementPrompt()` in `server/src/services/studyPlanService.js`.

## Experimentation and honesty note

The repository now contains the saved V1, V2 and V3 prompt drafts in `docs/milestone2/prompt-versions/`, the current implementation prompts, and tests. It does not contain a controlled A/B experiment dataset with paired raw model outputs and quality scores for V1, V2 and V3. Therefore, this log records the design progression and implementation evidence; it does **not** claim measured percentage improvements or a controlled baseline win. The baseline row is a reconstructed design draft, not a historical live model run.
