export function requestStudyPlan() {
  return {
    ok: false,
    code: 'AI_NOT_CONFIGURED',
    message: 'AI timetable generation is not configured yet. Your inputs are saved, but no study sessions were generated.',
  }
}
