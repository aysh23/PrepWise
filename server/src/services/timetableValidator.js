export function validateTimetable(timetable) {
  if (!Array.isArray(timetable)) return false
  return timetable.every((session) =>
    typeof session?.date === 'string' &&
    typeof session?.startTime === 'string' &&
    typeof session?.endTime === 'string'
  )
}
