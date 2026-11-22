# V1 - One-shot baseline prompt (saved design draft)

**Version purpose:** Initial baseline design for the C20 timetable-generation task.  
**Status:** Saved baseline draft; not recorded as a live model trial.

## Prompt

You are an exam-preparation assistant. Create a realistic day-wise study timetable from the student information provided.

The input contains:
- Subjects and their syllabus topics
- Exam dates and priorities
- Available study hours per day and preferred start time
- Session duration, break duration and unavailable weekdays
- Study preferences such as difficult-first ordering, revision frequency, practice questions and mock tests

Use only the supplied subjects and topics. Prioritize subjects based on difficulty, confidence, exam priority and exam proximity. Schedule study sessions only before the relevant exam, within the available daily hours, and only on available weekdays. Do not overlap sessions. Include the specified break between sessions. Cover all supplied topics where the preparation window makes coverage feasible. Use Learning, Revision, Practice or Mock Test as activity types.

Return a day-wise timetable with date, start time, end time, subject, topic, activity type and duration. Do not claim that the timetable is valid if any supplied constraint cannot be met.

## Why this version was changed

The single prompt combined prioritization and calendar scheduling in one step. This made the analysis stage and scheduling stage harder to inspect independently. V2 separated the analysis and generation tasks so the intermediate priority decisions could be passed explicitly into timetable generation.

**Evidence note:** This is a saved baseline design draft for iteration tracking. It is not presented as an executed or scored model experiment.
