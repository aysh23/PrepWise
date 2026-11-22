const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function availableCapacityMinutes(studentInput, subjectName, planningDate) {
  const exams = studentInput.exams.filter((exam) => {
    const examSubject = exam.subjectId
      ? studentInput.subjects.find((subject) => subject.id === exam.subjectId)?.name
      : exam.subject
    return typeof examSubject === 'string' && examSubject.trim().toLowerCase() === subjectName
  })
  if (!exams.length) return 0

  const deadline = exams
    .map((exam) => exam.date)
    .filter(isRealDate)
    .sort()
    .at(-1)
  if (!deadline) return 0

  const unavailable = new Set(studentInput.availability.unavailableDays)
  const cursor = new Date(`${planningDate}T00:00:00`)
  const end = new Date(`${deadline}T00:00:00`)
  let capacity = 0

  while (cursor <= end) {
    const weekday = WEEKDAY_NAMES[cursor.getDay()]
    if (!unavailable.has(weekday)) capacity += studentInput.availability.hours * 60
    cursor.setDate(cursor.getDate() + 1)
  }
  return capacity
}

export function validateTimetable(timetable, studentInput, options = {}) {
  const errors = []
  const warnings = []
  const planningDate = options.planningDate || formatDate(new Date())
  const requiredTopicCoverage = options.requiredTopicCoverage ?? true

  if (!Array.isArray(timetable) || timetable.length === 0) {
    return {
      valid: false,
      errors: ['Timetable must contain at least one study session'],
      warnings,
    }
  }

  if (!studentInput?.subjects?.length || !studentInput?.exams?.length || !studentInput?.availability) {
    return { valid: false, errors: ['Student input is incomplete'], warnings }
  }

  const subjectsByName = new Map(
    studentInput.subjects.map((subject) => [
      subject.name.trim().toLowerCase(),
      new Set(subject.topics.map((topic) => topic.trim().toLowerCase())),
    ]),
  )
  const subjectIds = new Map(
    studentInput.subjects
      .filter((subject) => subject.id)
      .map((subject) => [subject.id, subject.name.trim().toLowerCase()]),
  )

  const availabilityStart = timeToMinutes(studentInput.availability.startTime)
  const dailyLimitMinutes = studentInput.availability.hours * 60
  const usableWindowEnd = availabilityStart === null ? null : availabilityStart + dailyLimitMinutes
  const breakMinutes = studentInput.availability.breakDuration
  const unavailableDays = new Set(studentInput.availability.unavailableDays)
  const sessionsByDate = new Map()
  const scheduledTopics = new Set()

  timetable.forEach((session, index) => {
    const label = `Session ${index + 1}`
    if (!session || typeof session !== 'object') {
      errors.push(`${label} must be an object`)
      return
    }

    if (!isRealDate(session.date)) {
      errors.push(`${label}: invalid date`)
    } else if (session.date < planningDate) {
      errors.push(`${label}: scheduled before the current planning date ${planningDate}`)
    }

    const start = timeToMinutes(session.startTime)
    const end = timeToMinutes(session.endTime)
    if (start === null) errors.push(`${label}: invalid start time`)
    if (end === null) errors.push(`${label}: invalid end time`)
    if (start !== null && end !== null && end <= start) {
      errors.push(`${label}: end time must be later than start time`)
    }
    if (start !== null && end !== null) {
      if (!Number.isInteger(session.duration) || session.duration !== end - start) {
        errors.push(`${label}: duration must match the start and end time difference`)
      }
    }

    if (availabilityStart !== null && usableWindowEnd !== null && start !== null && end !== null) {
      if (start < availabilityStart || end > usableWindowEnd || end > 1440) {
        errors.push(`${label}: session times are outside the usable daily time window`)
      }
    }

    if (isRealDate(session.date)) {
      const weekday = WEEKDAY_NAMES[new Date(`${session.date}T00:00:00`).getDay()]
      if (unavailableDays.has(weekday)) {
        errors.push(`${label}: scheduled on unavailable day ${weekday}`)
      }
      if (!sessionsByDate.has(session.date)) sessionsByDate.set(session.date, [])
      sessionsByDate.get(session.date).push({ ...session, start, end, index })
    }

    const subjectName = typeof session.subject === 'string' ? session.subject.trim().toLowerCase() : ''
    if (!subjectName || !subjectsByName.has(subjectName)) {
      errors.push(`${label}: subject does not exist in student input`)
    } else {
      const subjectTopics = subjectsByName.get(subjectName)
      const topicName = typeof session.topic === 'string' ? session.topic.trim().toLowerCase() : ''
      if (!topicName || !subjectTopics.has(topicName)) {
        errors.push(`${label}: topic does not exist for ${session.subject}`)
      } else {
        scheduledTopics.add(`${subjectName}:${topicName}`)
      }
    }

    if (!ACTIVITY_TYPES.includes(session.activityType)) {
      errors.push(`${label}: invalid activity type`)
    }

    if (isRealDate(session.date)) {
      const relevantExams = studentInput.exams.filter((exam) => {
        const examSubject = exam.subjectId
          ? subjectIds.get(exam.subjectId)
          : typeof exam.subject === 'string'
            ? exam.subject.trim().toLowerCase()
            : ''
        return examSubject === subjectName
      })
      if (relevantExams.length) {
        const deadline = relevantExams
          .map((exam) => exam.date)
          .filter(isRealDate)
          .sort()
          .at(-1)
        if (deadline && session.date > deadline) {
          errors.push(`${label}: scheduled after the latest examination for ${session.subject}`)
        }
      }
    }
  })

  for (const [date, sessions] of sessionsByDate) {
    const validSessions = sessions
      .filter((session) => session.start !== null && session.end !== null)
      .sort((a, b) => a.start - b.start)

    const dailyMinutes = validSessions.reduce((total, session) => total + (session.end - session.start), 0)
    if (dailyMinutes > dailyLimitMinutes) {
      errors.push(`${date}: daily study hours exceed availability (${dailyMinutes} minutes scheduled; ${dailyLimitMinutes} minutes available)`)
    }

    for (let index = 1; index < validSessions.length; index += 1) {
      const previous = validSessions[index - 1]
      const current = validSessions[index]
      if (current.start < previous.end) {
        errors.push(`${date}: overlapping sessions`)
      } else {
        const gap = current.start - previous.end
        if (gap < breakMinutes) {
          errors.push(`${date}: insufficient break between consecutive sessions (${gap} minutes; ${breakMinutes} required)`)
        }
      }
    }
  }

  studentInput.subjects.forEach((subject) => {
    const missingTopics = subject.topics.filter((topic) =>
      !scheduledTopics.has(`${subject.name.trim().toLowerCase()}:${topic.trim().toLowerCase()}`),
    )
    const subjectCapacity = availableCapacityMinutes(
      studentInput,
      subject.name.trim().toLowerCase(),
      planningDate,
    )
    const minimumCoverageMinutes = missingTopics.length * studentInput.availability.sessionDuration

    missingTopics.forEach((topic) => {
      const missingTopicLabel = `Missing topic coverage: ${subject.name} - ${topic}`
      if (subjectCapacity < minimumCoverageMinutes) {
        errors.push(`${missingTopicLabel}; cannot be scheduled within the available preparation time`)
      } else if (requiredTopicCoverage) {
        errors.push(missingTopicLabel)
      } else {
        warnings.push(`${missingTopicLabel}; optional coverage was not met`)
      }
    })
  })

  if (timetable.length > 0) {
    const unscheduledSessions = timetable.filter((session) =>
      typeof session?.subject === 'string' && typeof session?.topic === 'string',
    )
    if (unscheduledSessions.length === 0) {
      errors.push('Timetable contains no valid subject/topic sessions')
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}
