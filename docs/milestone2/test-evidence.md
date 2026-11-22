# PrepWise - Milestone 2 Test Evidence

**Project:** PrepWise | **Team:** Apex | **Problem:** C20 - Timetable and Study Plan Generator

## Automated test summary

The backend test run reported by the project team completed with **21 tests passed, 0 failed**. The suite comprises 2 API tests, 4 Groq error-mapping tests, 3 study-plan/refinement service tests using injected mock responses, and 12 timetable-validator tests. The server syntax/build check also completed successfully. The team additionally confirmed a successful local end-to-end timetable generation through the running app; no live-provider performance benchmark was recorded.

## Timetable validator test table (12 cases)

The validator cases use a synthetic fixture so boundary and invalid conditions are repeatable: subject **Calculus**, topics **Integration** and **Series**, exam date **2099-12-31**, planning date **2099-12-21**, preferred start **09:00**, daily availability **3 hours**, session duration **50 minutes**, required break **10 minutes**, and Sunday unavailable. These deliberately future dates are test fixture values, not actual student exam dates.

| ID | Test input / change from the fixture | Expected output | Actual output | Status |
|---|---|---|---|---|
| T01 | Two valid sessions: Integration 09:00-10:00 and Series 10:10-11:10 on 2099-12-21. | Accept; `valid=true`. | Accepted; validator returned no errors. | PASS |
| T02 | Empty timetable array. | Reject as empty. | Rejected with “Timetable must contain at least one study session”. | PASS |
| T03 | Move the second session to 09:30-10:30 so it overlaps the first. | Reject overlap. | Rejected with overlap error. | PASS |
| T04 | Move the second session to 10:05-11:05, leaving only a 5-minute break. | Reject because 10 minutes are required. | Rejected with insufficient-break error. | PASS |
| T05 | Add a third 80-minute session 11:20-12:40; total scheduled time becomes 200 minutes. | Reject because daily availability is 180 minutes. | Rejected with daily-study-hours-exceed-availability error. | PASS |
| T06 | Move the first session to 08:30-09:30. | Reject before the preferred 09:00 start. | Rejected as outside the usable daily time window. | PASS |
| T07 | Move both sessions to 2100-01-01, after the 2099-12-31 exam. | Reject after the latest relevant exam. | Rejected with after-examination error. | PASS |
| T08 | Change a session subject from Calculus to Physics. | Reject unknown subject. | Rejected because the subject does not exist in student input. | PASS |
| T09 | Change a topic to Differential Equations. | Reject unknown topic. | Rejected because the topic does not exist for Calculus. | PASS |
| T10 | Keep only the Integration session and omit Series. | Reject missing mandatory topic coverage. | Rejected with missing Series coverage error. | PASS |
| T11 | Set duration to 30 minutes while start/end remain 09:00-10:00. | Reject duration mismatch. | Rejected because duration does not match the time difference. | PASS |
| T12 | Move sessions to 2099-12-19, before planning date 2099-12-21. | Reject past planning date. | Rejected with before-current-planning-date error. | PASS |

## Test execution commands

Run from the `server` directory:

```bash
npm ci
npm test
npm run build
npm run dev
```

The automated unit tests do not consume Groq API credits for the mocked study-plan service cases. The successful live generation was checked separately by the team using its private `GROQ_API_KEY`; that secret is not included in this repository or report.
