# PrepWise - 120-second Milestone 2 Reel Script

Target duration: **120 seconds** (the form accepts 90-150 seconds). Record the real application and replace any sample exam dates/data with the values used in the demo.

| Time | Screen recording | Voice-over |
|---|---|---|
| 0-10s | PrepWise title screen and project name. | “This is PrepWise, our Prompt Engineering mini-project for problem C20: a timetable and study-plan generator.” |
| 10-25s | Dashboard, then open Create Study Plan. | “Students enter their subjects, syllabus topics, examination dates, study hours and preferences. The goal is to create a realistic day-wise plan from those constraints.” |
| 25-42s | Show the four input steps briefly: subjects, exams, availability, preferences. | “The application captures topic difficulty and confidence, exam priority, daily availability, session and break length, unavailable weekdays and revision preferences.” |
| 42-60s | Show a simple workflow diagram or repository prompt files. | “We decompose the task into a priority-analysis prompt and a timetable-generation prompt. The third logical prompt is a refinement prompt assembled from validation feedback.” |
| 60-82s | Enter sample data and click Generate Study Plan; show loading and returned plan. | “The backend sends structured requests to the Groq-hosted GPT-OSS 120B model. The response is parsed as JSON and mapped into the study-plan interface.” |
| 82-101s | Scroll the generated timetable; show dates, topics, session times and activities. | “The timetable is not accepted blindly. A separate validator checks subjects and topics, dates, exam deadlines, daily limits, start times, breaks and overlaps.” |
| 101-113s | Show test run summary or test-evidence file with 21 passed. | “Our backend test run passed 21 tests with zero failures, including twelve timetable-validator cases. The build syntax check also passed.” |
| 113-120s | GitHub repository and closing project slide. | “PrepWise combines prompt chaining, structured outputs and constraint checking to make study planning more reliable. Thank you.” |

## Recording checklist

- Record the actual running application; do not use a localhost URL as the public prototype link in the form.
- Hide browser bookmarks, personal notifications and any secret values.
- Do not show `server/.env`, the Groq API key, terminal environment dumps or private account pages.
- If showing a test count, show the actual terminal output or committed test evidence.
- Upload the finished 90-150 second video to an unlisted YouTube video or Drive with “Anyone with the link can view”.
- Enter the actual final video duration and share URL in Form Q13-Q14.
