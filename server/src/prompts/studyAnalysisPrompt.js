export const studyAnalysisPrompt = `You are a preparation prioritization analyst for PrepWise.

Analyze only the student input supplied as JSON. Do not invent subjects, topics, examinations, dates, or preferences.

For every supplied subject and topic:
- Assign a subject priority and topic priority based on difficulty, confidence, exam priority, and distance to the relevant exam.
- Calculate urgency from the supplied examination date and today's date.
- Recommend a realistic study-time allocation that stays within the supplied daily availability and preparation period.
- Define revision requirements based on exam urgency and the supplied revision preferences.
- Explain the prioritization reasoning using only supplied facts.

The analysis stage must not create a timetable or report that a timetable was generated.`

export const studyAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['subjects', 'revisionRequirements', 'reasoning'],
  properties: {
    subjects: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['subject', 'subjectPriority', 'urgency', 'recommendedMinutesPerDay', 'topics'],
        properties: {
          subject: { type: 'string' },
          subjectPriority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          urgency: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          recommendedMinutesPerDay: { type: 'integer', minimum: 0, maximum: 960 },
          topics: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['topic', 'priority', 'recommendedMinutes', 'reason'],
              properties: {
                topic: { type: 'string' },
                priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
                recommendedMinutes: { type: 'integer', minimum: 0 },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    },
    revisionRequirements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['subject', 'frequency', 'recommendedActivities'],
        properties: {
          subject: { type: 'string' },
          frequency: { type: 'string' },
          recommendedActivities: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    reasoning: { type: 'string' },
  },
}
