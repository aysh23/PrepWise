const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const ACTIVITY_TYPES = ['Learning', 'Revision', 'Practice', 'Mock Test']

function timeToMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return (hours * 60) + minutes
}

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` === value
}

export function validateTimetable(timetable, studentInput) {
  const errors = []
  const warnings = []

  if (!Array.isArray(timetable)) {
    return { valid: false, errors: ['Timetable must be an array'], warnings }
  }

  if (!studentInput?.subjects || !studentInput?.exams || !studentInput?.availability) {
    return { valid: false, errors: ['Student input is incomplete'], warnings }
  }

  const subjectsByName = new Map(
    studentInput.subjects.map((subject) => [subject.name.trim().toLowerCase(), new Set(subject.topics.map((topic) => topic.trim().toLowerCase()))]),
  )
  const subjectIds = new Map(
    studentInput.subjects
      .filter((subject) => subject.id)
      .map((subject) => [subject.id, subject.name.trim().toLowerCase()]),
  )

  const availabilityStart = timeToMinutes(studentInput.availability.startTime)
  const dailyLimitMinutes = studentInput.availability.hours * 60
  const breakMinutes = studentInput.availability.breakDuration
  const unavailableDays = new Set(studentInput.availability.unavailableDays)

  const sessionsByDate = new Map()

  timetable.forEach((session, index) => {
    const label = `Session ${index + 1}`
    if (!session || typeof session !== 'object') {
      errors.push(`${label} must be an object`)
      return
    }

    if (!isRealDate(session.date)) errors.push(`${label}: invalid date`)
    const start = timeToMinutes(session.startTime)
    const end = timeToMinutes(session.endTime)
    if (start === null) errors.push(`${label}: invalid start time`)
    if (end === null) errors.push(`${label}: invalid end time`)
    if (start !== null && end !== null && end <= start) {
      errors.push(`${label}: end time must be later than start time`)
    }
    if (start !== null && end !== null && Number(session.duration) !== end - start) {
      errors.push(`${label}: duration must match the start and end time difference`)
    }

    if (isRealDate(session.date)) {
      const weekday = WEEKDAY_NAMES[new Date(`${session.date}T00:00:00`).getDay()]
      if (unavailableDays.has(weekday)) errors.push(`${label}: scheduled on unavailable day ${weekday}`)
      if (!sessionsByDate.has(session.date)) sessionsByDate.set(session.date, [])
      sessionsByDate.get(session.date).push({ ...session, start, end, index })
    }

    if (availabilityStart !== null && start !== null && end !== null) {
      if (start < availabilityStart || end > availabilityStart + dailyLimitMinutes || end > 1440) {
        errors.push(`${label}: scheduled outside configured daily availability`)
      }
    }

    const subjectName = typeof session.subject === 'string' ? session.subject.trim().toLowerCase() : ''
    if (!subjectName || !subjectsByName.has(subjectName)) {
      errors.push(`${label}: subject does not exist in student input`)
    } else {
      const subjectTopics = subjectsByName.get(subjectName)
      const topicName = typeof session.topic === 'string' ? session.topic.trim().toLowerCase() : ''
      if (!topicName || !subjectTopics.has(topicName)) {
        errors.push(`${label}: topic does not exist for ${session.subject}`)
      }
    }

    if (!ACTIVITY_TYPES.includes(session.activityType)) {
      errors.push(`${label}: invalid activity type`)
    }

    if (isRealDate(session.date)) {
      const relevantExams = studentInput.exams.filter((exam) => {
        if (exam.subjectId) return subjectIds.get(exam.subjectId) === subjectName
        return typeof exam.subject === 'string' && exam.subject.trim().toLowerCase() === subjectName
      })
      if (relevantExams.length) {
        const latestExamDate = relevantExams
          .map((exam) => exam.date)
          .filter(isRealDate)
          .sort()
          .at(-1)
        if (latestExamDate && session.date > latestExamDate) {
          errors.push(`${label}: scheduled after the latest examination for ${session.subject}`)
        }
      }
    }
  })

  for (const [date, sessions] of sessionsByDate) {
    const validSessions = sessions
      .filter((session) => session.start !== null && session.end !== null)
      .sort((a, b) => a.start - b.start)

    let dailyMinutes = 0
    validSessions.forEach((session) => {
      dailyMinutes += session.end - session.start
    })
    if (dailyMinutes > dailyLimitMinutes) {
      errors.push(`${date}: daily study hours exceed availability`)
    }

    for (let index = 1; index < validSessions.length; index += 1) {
      const previous = validSessions[index - 1]
      const current = validSessions[index]
      if (current.start < previous.end) {
        errors.push(`${date}: overlapping sessions`)
      } else if (current.start - previous.end < breakMinutes) {
        errors.push(`${date}: break between sessions is shorter than ${breakMinutes} minutes`)
      }
    }
  }

  const scheduledTopics = new Set(
    timetable
      .filter((session) => typeof session?.subject === 'string' && typeof session?.topic === 'string')
      .map((session) => `${session.subject.trim().toLowerCase()}:${session.topic.trim().toLowerCase()}`),
  )
  studentInput.subjects.forEach((subject) => {
    subject.topics.forEach((topic) => {
      const key = `${subject.name.trim().toLowerCase()}:${topic.trim().toLowerCase()}`
      if (!scheduledTopics.has(key)) warnings.push(`Topic not scheduled: ${subject.name} - ${topic}`)
    })
  })

  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}
