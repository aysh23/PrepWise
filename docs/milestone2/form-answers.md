# PrepWise - Milestone 2 Microsoft Forms Answer Sheet

Use this alongside the Microsoft Form titled **Milestone 2 - Submission Form for Prompt Engg SCSE4041 (12 Marks: Deadline: 22 Nov 2026)**. The screenshot export shows Q1-Q7 already filled; keep those entries as shown unless the live form has since changed.

| Q | Exact form field | Answer / action |
|---|---|---|
| 1 | Team ID (assigned after Milestone 1) | Already filled: `C20`. |
| 2 | Team Name as Given in Milestone 1 | Already filled: `Team Apex`. |
| 3 | Project Title/Name | Already filled: `PrepWise`. |
| 4 | Team Leader Name | Already filled: `Ayush Singh`. |
| 5 | Team Leader Enrollment No. | Already filled: `S24CSEU2283`. |
| 6 | Select your Group (Batch) | Already selected: `B81-93`. |
| 7 | Enrollment numbers of all team members, one per line | Already filled: `S24CSEU2283`, `S24CSEU2306`, `S24CSEU2294`, `S24CSEU2290` (one on each line). |
| 8 | Select the Project Type (Deliverable) | **Change this.** The form export currently shows **No-code app (Opal, GPT, Gem)** checked. Uncheck it and select **App with code**. PrepWise is a React/Vite + Express application. |
| 9 | Main AI tool and model used | Replace the old entry `ChatGPT-6, OpenAI API` with: `Groq API - openai/gpt-oss-120b (Groq-hosted model accessed via Groq's OpenAI-compatible Chat Completions API)`. This describes the current integrated application. |
| 10 | Number of prompts in the final solution | Enter `3`: (1) study-priority analysis, (2) timetable generation, (3) validation-guided refinement prompt, built dynamically from validator feedback. The code has 2 standalone prompt templates plus the dynamic refinement prompt. |
| 11 | Prototype link (must open for anyone with the link) | **Pending public deployment.** Paste the public frontend URL after deployment. Do not paste localhost; the GitHub repository belongs in Q12. |
| 12 | Git repository or Google Drive folder link | `https://github.com/aysh23/PrepWise` |
| 13 | Reel link (Drive or unlisted YouTube; anyone with link can view) | **Pending recording and upload.** Use the video script in `docs/milestone2/video-script.md`, then paste the actual shareable link. |
| 14 | Short video/reel length in seconds (90-150) | Enter the actual final duration. Target `120` seconds. |
| 15 | Supporting document type | Select **Technical Report**. The form describes it as covering architecture, tools/models, prompt design, test results and limitations. |
| 16 | Upload supporting document (PDF only, max 10 MB) | Upload `PrepWise_Milestone_2_Technical_Report.pdf`. It is under 10 MB. |
| 17 | Number of test inputs in the test table (minimum 10) | Enter `12`. The report contains twelve nonblank validator test rows, each with input, expected result, observed result and PASS status. |
| 18 | Total number of prompt versions recorded in the iteration log (minimum 3) | Enter `3`. Three saved version files are in `docs/milestone2/prompt-versions/`: V1 baseline design draft, V2 chained analysis/scheduling, V3 structured output with validation-guided refinement. V1 is explicitly a saved design draft, not a live model trial; no measured A/B improvement is claimed. |
| 19 | Current prototype status | Select **Some modules working** (conservative: the local flow and several modules have been demonstrated; public deployment and reel are not yet ready). |
| 20 | Names of working modules, one per line | Use the eight-module list below. |
| 21 | Upload the Milestone 2 PDF (PDF only, max 10 MB) | Upload the same `PrepWise_Milestone_2_Technical_Report.pdf` again in this separate upload field. |
| 22 | Main task of each team member, one line per member: Enrollment - Name - Task | **Must be completed with real, team-approved contributions.** The form gives enrollment numbers but not all member names or task allocations. Do not submit the suggested tasks as facts unless each person confirms them. Use the exact format and confirm the name associated with S24CSEU2306. |
| 23 | Anything the evaluator should know? (optional) | Suggested: `PrepWise is a coded React/Vite frontend with an Express backend. The current integrated model is openai/gpt-oss-120b served through Groq's API. The API key is stored only in the backend environment and is not committed. The backend performs independent timetable validation and bounded refinement. Groq free-tier requests can be rate-limited. The public demo URL will be provided after deployment.` |
| 24 | Confirm all team members agree with the form and contribution table | Select **I confirm** only after every member has reviewed the final details and agreed to the contribution table. |

## Q20 - Working modules (paste one per line)

1. Subject and syllabus-topic input wizard
2. Examination date and priority setup
3. Study availability and preference setup
4. AI study-priority analysis through Groq
5. AI day-wise timetable generation through Groq
6. JSON response parsing and Zod output validation
7. Independent timetable constraint checking and bounded refinement
8. Study-plan display, session mapping and browser localStorage persistence

## Q22 - Required format (fill with the actual tasks)

Use one line for each of the four enrolled members:

- `S24CSEU2283 - Ayush Singh - [enter Ayush's actual contribution]`
- `S24CSEU2306 - [confirm member name] - [enter actual contribution]`
- `S24CSEU2294 - [confirm member name] - [enter actual contribution]`
- `S24CSEU2290 - [confirm member name] - [enter actual contribution]`

Possible contribution categories to help the team describe its real work: problem definition/backlog, prompt drafting/version log, frontend UI/input flow, backend/API integration, validator/test cases, documentation, deployment and video recording. Do not allocate these to members without their confirmation.

## Submission checks

- Public prototype URL in Q11 opens in a private/incognito browser window.
- Repository link in Q12 is accessible.
- Reel link in Q13 allows anyone with the link to view, and duration entered in Q14 is the actual duration between 90 and 150 seconds.
- Select Technical Report in Q15 and upload the PDF in both Q16 and Q21 as separate upload responses.
- Q17 equals the 12 rows in the report; Q18 equals the 3 saved prompt-version files.
- Confirm Q22 with all members and only then tick Q24.
