export const timetableGenerationPrompt = `You are a day-wise study-timetable generator for PrepWise.

Use the supplied student input and the analysis-stage output. Do not invent subjects or topics.

Generate a realistic timetable that:
- Uses only supplied subjects and supplied syllabus topics.
- Schedule every supplied topic where the preparation window and daily availability make coverage feasible.
- If a topic cannot feasibly fit, report it as a missing topic rather than inventing or dropping a topic silently.
- Uses dates from today through the relevant supplied examination dates.
- Never schedules a subject after that subject's latest relevant examination date.
- Uses the preferred start time and does not exceed daily available study hours.
- Never schedules on unavailable weekdays.
- Avoids overlaps and includes breaks of the configured break duration between sessions.
- Prioritizes urgent examinations and difficult or low-confidence areas.
- Covers supplied topics where feasible.
- Includes revision sessions and practice/mock-test sessions only where student preferences allow and the preparation period permits.

Use only these activity types: Learning, Revision, Practice, Mock Test.
Session duration must equal endTime minus startTime in minutes.

The timetable stage must not claim that a session was completed or that the plan was successful if it cannot satisfy these constraints.`

export const timetableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['timetable'],
  properties: {
    timetable: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'startTime', 'endTime', 'subject', 'topic', 'activityType', 'duration'],
        properties: {
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          subject: { type: 'string' },
          topic: { type: 'string' },
          activityType: { type: 'string', enum: ['Learning', 'Revision', 'Practice', 'Mock Test'] },
          duration: { type: 'integer', minimum: 1, maximum: 960 },
        },
      },
    },
  },
}
