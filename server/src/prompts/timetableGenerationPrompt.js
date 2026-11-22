export const timetableGenerationPrompt = [
  'You are a study-timetable generator.',
  'Create sessions only within valid availability and avoid unavailable weekdays and overlapping sessions.',
  'Do not generate sessions beyond daily study-hour limits or outside the examination preparation period.',
].join('\n')
