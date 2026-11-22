# PrepWise - Milestone 2 Microsoft Forms Answer Sheet

Use this alongside the Microsoft Form titled **Milestone 2 - Submission Form for Prompt Engg SCSE4041 (12 Marks: Deadline: 22 Nov 2026)**. Confirm all four member details and the contribution allocation before the team leader submits.

| Q | Field | Suggested answer |
|---|---|---|
| 1 | Team ID | `C20` |
| 2 | Team Name | `Team Apex` |
| 3 | Project Title/Name | `PrepWise` |
| 4 | Team Leader Name | `Ayush Singh` |
| 5 | Team Leader Enrollment No. | `S24CSEU2283` |
| 6 | Group/Batch | `B81-93` |
| 7 | All team enrollment numbers (one per line) | `S24CSEU2283` / `S24CSEU2306` / `S24CSEU2294` / `S24CSEU2290` |
| 8 | Project Type | **Change the current saved selection:** it is incorrectly set to No-code app. Clear that option and select **App with code**. The current product is a coded React/Vite + Express application. |
| 9 | Main AI tool and model used | `Groq API - openai/gpt-oss-120b (Groq-hosted model accessed via Groq's OpenAI-compatible Chat Completions API). During earlier prompt exploration ChatGPT GPT-6 was also used; the current integrated application uses Groq.` |
| 10 | Number of prompts in final solution | `3` logical prompt forms: study-priority analysis, initial timetable generation, validation-guided refinement. There are 2 standalone prompt template files; the refinement prompt is constructed dynamically. |
| 11 | Prototype link | **Pending public deployment.** A `localhost` URL is not acceptable. Deploy the frontend and backend publicly, then paste the public frontend URL here. |
| 12 | Git repository / Drive link | `https://github.com/aysh23/PrepWise` |
| 13 | Short reel URL | **Pending recording and upload.** Paste a viewable Google Drive or unlisted YouTube URL after recording. |
| 14 | Reel duration in seconds | Enter the actual final duration; target `120` seconds (form allows 90-150). |
| 15 | Supporting document type | Select **Technical Report**. |
| 16 | Upload supporting PDF | Upload `PrepWise_Milestone_2_Technical_Report.pdf` (under 10 MB). |
| 17 | Number of test inputs in test table | `12` (use the twelve validator scenarios in `test-evidence.md`). |
| 18 | Number of prompt versions in iteration log | `3` documented prompt versions (V1 baseline design draft, V2 chained analysis/scheduling prompts, V3 structured output with validation-guided refinement). Exact saved versions are in `docs/milestone2/prompt-versions/`. V1 is a saved design draft, not a live model trial; no measured A/B improvements are claimed. |
| 19 | Current prototype status | Select **Some modules working** (conservative status; core generation and validation modules have been demonstrated, but no public deployment/reel evidence is ready yet). |
| 20 | Names of working modules (one per line) | Subject/topic input wizard; examination date and priority setup; availability and study preference setup; AI study-priority analysis through Groq; AI day-wise timetable generation through Groq; JSON parsing, Zod validation and timetable constraint checking; validation-guided refinement and bounded retry; study-plan display, session mapping and browser localStorage persistence. |
| 21 | Upload Milestone 2 PDF | Upload the same technical report PDF from Q16 if the form's separate upload is required. |
| 22 | Main task of each member (one per line) | See the proposed allocation below; the team must verify and edit it to match actual contributions. |
| 23 | Anything evaluator should know (optional) | `PrepWise is a React/Vite frontend with an Express backend. Groq is called only from the backend; the API key is kept in a private server environment variable and is not included in the repository. The backend performs independent timetable validation and bounded refinement. The Groq free tier can impose usage limits. A public demo link will be supplied after deployment.` |
| 24 | Team agreement | Do not confirm until every listed member has reviewed and agreed to the details and contribution table. |

## Q22 - Proposed contribution wording (team must verify)

- `S24CSEU2283 - Ayush Singh - Team coordination, problem definition, prompt workflow design, Groq integration and end-to-end verification.`
- `S24CSEU2306 - Aarushi Chaudhary - User-scenario review, input-flow feedback and test-case review.`
- `S24CSEU2294 - Akshar Singh - React/Vite frontend screens, study-plan input workflow and UI integration.`
- `S24CSEU2290 - Deepanshi - Express backend workflow, timetable validation/refinement and automated test coordination.`

**Important:** These Q22 task allocations are a suggested division aligned to the system modules, not a verified activity log. The members should correct them before submission.
