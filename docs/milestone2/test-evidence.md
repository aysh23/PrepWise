# PrepWise - Milestone 2 Test Evidence

**Project:** PrepWise | **Team:** Apex | **Problem:** C20 - Timetable and Study Plan Generator

## Automated test summary

The backend test run recorded by the project team completed with **21 tests passed, 0 failed**. The suite comprises 2 API tests, 4 Groq error-mapping tests, 3 study-plan/refinement service tests covering analysis validation and retry behaviour, and 12 timetable-validator tests. The server syntax/build check also completed successfully. The team separately confirmed successful live timetable generation in the deployed application.

## Recorded P1 and refinement-service case

The service-level test in `server/test/refinementService.test.js` uses these plan details:

- Subject: Calculus
- Topics: Integration and Series
- Examination: 2099-12-31, priority High
- Planning date: 2099-12-21
- Availability: 3 hours/day, preferred start 09:00
- Session duration: 50 minutes; required break: 10 minutes
- Unavailable weekday: Sunday
- Preferences: revision every 3 days, difficult-first enabled, practice questions enabled, timed mock tests disabled

The P1 analysis object recorded in the test assigns Calculus High subject priority and High urgency, recommends 120 minutes/day, assigns 60 minutes to Integration and 60 minutes to Series, and recommends Revision every 3 days.

The refinement-service test checks this correction sequence:

1. The initial timetable is empty.
2. The validator reports `valid: false` with the error `Timetable must contain at least one study session`.
3. The service passes the validator feedback into the refinement prompt.
4. The corrected timetable contains Integration 09:00-10:00 (Learning) and Series 10:10-11:10 (Revision), both on 2099-12-21.
5. The service returns only after validation succeeds; the test asserts `valid: true` and `refinementAttempts: 1`.

## Timetable validator test table (12 cases)

The validator suite uses a fixed planning date of **2099-12-21** and examination date of **2099-12-31** for repeatable date and deadline checks. The base input is Calculus with topics Integration and Series, preferred start 09:00, 3 hours/day, 50-minute configured session duration, 10-minute break and Sunday unavailable.

| ID | Test input / change | Type | Expected output | Actual output | Status |
|---|---|---|---|---|---|
| T01 | Two valid sessions: Integration 09:00-10:00 and Series 10:10-11:10 on 2099-12-21. | Normal | Accept; `valid=true`. | Accepted; validator returned no errors or warnings. | PASS |
| T02 | Empty timetable array. | Invalid | Reject empty timetable. | Rejected: at least one study session is required. | PASS |
| T03 | Move the second session to 09:30-10:30 so it overlaps the first. | Edge | Reject overlapping sessions. | Rejected with overlap error. | PASS |
| T04 | Move the second session to 10:05-11:05, leaving a 5-minute break. | Edge | Reject; 10-minute break is required. | Rejected with insufficient-break error. | PASS |
| T05 | Add an 80-minute third session; total becomes 200 minutes against 180 available. | Invalid | Reject daily-limit breach. | Rejected because daily study hours exceed availability. | PASS |
| T06 | Move the first session to 08:30-09:30. | Edge | Reject before the preferred 09:00 start. | Rejected as outside the usable daily time window. | PASS |
| T07 | Move both sessions to 2100-01-01, after the 2099-12-31 exam. | Edge | Reject after-exam sessions. | Rejected with after-examination error. | PASS |
| T08 | Change a session subject to Physics. | Invalid | Reject unknown subject. | Rejected because the subject does not exist in student input. | PASS |
| T09 | Change a topic to Differential Equations. | Invalid | Reject unknown topic. | Rejected because the topic does not exist for Calculus. | PASS |
| T10 | Keep only Integration and omit Series. | Invalid | Reject missing mandatory topic coverage. | Rejected with missing Series coverage error. | PASS |
| T11 | Set duration to 30 minutes while the time range remains 09:00-10:00. | Invalid | Reject duration mismatch. | Rejected because duration does not match the time difference. | PASS |
| T12 | Move sessions to 2099-12-19, before the planning date 2099-12-21. | Edge | Reject past planning-date sessions. | Rejected with before-current-planning-date error. | PASS |

## Test execution commands

Run from the `server` directory:

```bash
npm ci
npm test
npm run build
npm run dev
```

The live generation flow was separately confirmed by the team using the private `GROQ_API_KEY`. The key is not included in this repository or report.
