# PrepWise - Milestone 2 Reel

**Published reel:** https://youtu.be/9g-Gwbgfjuc  
**Target duration for the recorded script:** 120 seconds (the form accepts 90-150 seconds). Enter the actual YouTube runtime in Q14.

| Time | Screen recording | Voice-over |
|---|---|---|
| 0-10s | PrepWise title screen and project name. | “This is PrepWise, our Prompt Engineering mini-project for problem C20: a timetable and study-plan generator.” |
| 10-25s | Dashboard, then open Create Study Plan. | “Students enter their subjects, syllabus topics, examination dates, study hours and preferences. The goal is to create a realistic day-wise plan from those constraints.” |
| 25-42s | Show the four input steps: subjects, exams, availability and preferences. | “The application captures topic difficulty and confidence, exam priority, daily availability, session and break length, unavailable weekdays and revision preferences.” |
| 42-60s | Show the prompt workflow and source files. | “We decompose the task into a priority-analysis prompt and a timetable-generation prompt. The third logical prompt is assembled from validation feedback when correction is required.” |
| 60-82s | Show the real application run and generated study plan. | “The backend sends structured requests to the Groq-hosted GPT-OSS 120B model. The response is parsed as JSON and mapped into the study-plan interface.” |
| 82-101s | Scroll the generated timetable; show dates, topics, session times and activities. | “The timetable is checked independently against the student's subjects, topics, dates, exam deadlines, daily limits, start times, breaks and overlap rules.” |
| 101-113s | Show the recorded test-evidence file and backend test summary. | “Our backend test run passed 21 tests with zero failures, including twelve timetable-validator cases. The build syntax check also passed.” |
| 113-120s | GitHub repository and closing project slide. | “PrepWise combines prompt chaining, structured outputs and constraint checking to make study planning more reliable. Thank you.” |

## Recording and sharing checks

- The published reel link is the URL above.
- The demo section should show the deployed application running and a timetable generated from the inputs used during the recording.
- Keep browser notifications, personal information and credentials out of the recording.
- Never show `server/.env`, the Groq API key or environment dumps.
- The video must remain viewable to anyone with the link.
- Enter the actual runtime shown by YouTube in Form Q14.
