const DEFAULT_API_URL = 'http://localhost:3001'

function getApiUrl() {
  const configuredUrl = import.meta.env?.VITE_PREPWISE_API_URL
  return (configuredUrl || DEFAULT_API_URL).replace(/\/$/, '')
}

export function mapTimetableSessions(timetable) {
  if (!Array.isArray(timetable)) return []
  const timestamp = Date.now()
  return timetable.map((session, index) => ({
    id: `session-${timestamp}-${index}`,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    subject: session.subject,
    topic: session.topic,
    type: session.activityType,
    duration: session.duration,
    completed: false,
  }))
}

export async function requestStudyPlan(input) {
  let response

  try {
    response = await fetch(`${getApiUrl()}/api/study-plans/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        subjects: input.subjects,
        exams: input.exams,
        availability: input.availability,
        preferences: input.preferences,
      }),
    })
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the PrepWise backend. Check that the server is running and try again.',
    }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    return {
      ok: false,
      code: 'INVALID_API_RESPONSE',
      message: 'The PrepWise backend returned an unreadable response.',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      code: payload.code || 'API_ERROR',
      message: payload.message || 'The study plan could not be generated.',
      details: payload.details,
    }
  }

  if (
    payload.success !== true ||
    !payload.data ||
    payload.data.validation?.valid !== true ||
    !Array.isArray(payload.data.timetable) ||
    payload.data.timetable.length === 0
  ) {
    return {
      ok: false,
      code: 'INVALID_TIMETABLE_RESPONSE',
      message: payload.data?.validation?.errors?.join(' ') ||
        'The backend did not return a valid, nonempty study timetable.',
      details: payload.data?.validation,
    }
  }

  const sessions = mapTimetableSessions(payload.data.timetable)

  return {
    ok: true,
    code: 'STUDY_PLAN_GENERATED',
    message: 'Study timetable generated successfully.',
    sessions,
    analysis: payload.data.analysis,
    validation: payload.data.validation,
    generation: payload.data.generation,
  }
}
