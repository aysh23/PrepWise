import test from 'node:test'
import assert from 'node:assert/strict'
import { mapTimetableSessions, requestStudyPlan } from './planGenerationService.js'

test('maps backend activityType and preserves session fields', () => {
  const sessions = mapTimetableSessions([{
    date: '2099-12-21',
    startTime: '09:00',
    endTime: '10:00',
    subject: 'Calculus',
    topic: 'Integration',
    activityType: 'Learning',
    duration: 60,
  }])

  assert.equal(sessions.length, 1)
  assert.equal(sessions[0].type, 'Learning')
  assert.equal(sessions[0].duration, 60)
  assert.equal(sessions[0].completed, false)
  assert.equal(sessions[0].subject, 'Calculus')
  assert.ok(sessions[0].id)
})

test('returns no mapped sessions for an invalid timetable shape', () => {
  assert.deepEqual(mapTimetableSessions(null), [])
  assert.deepEqual(mapTimetableSessions([]), [])
})

test('accepts only a successful validated nonempty API response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        analysis: { subjects: [] },
        timetable: [{
          date: '2099-12-21',
          startTime: '09:00',
          endTime: '10:00',
          subject: 'Calculus',
          topic: 'Integration',
          activityType: 'Learning',
          duration: 60,
        }],
        validation: { valid: true, errors: [], warnings: [] },
        generation: { model: 'test-model', refinementAttempts: 0 },
      },
    }),
  })

  try {
    const result = await requestStudyPlan({
      subjects: [],
      exams: [],
      availability: {},
      preferences: {},
    })
    assert.equal(result.ok, true)
    assert.equal(result.sessions.length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('preserves a meaningful API error response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    json: async () => ({
      success: false,
      code: 'AI_GENERATION_NOT_CONFIGURED',
      message: 'AI timetable generation is not configured.',
    }),
  })

  try {
    const result = await requestStudyPlan({
      subjects: [],
      exams: [],
      availability: {},
      preferences: {},
    })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'AI_GENERATION_NOT_CONFIGURED')
    assert.match(result.message, /not configured/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('rejects an invalid or empty successful payload', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        timetable: [],
        validation: { valid: true, errors: [], warnings: [] },
      },
    }),
  })

  try {
    const result = await requestStudyPlan({
      subjects: [],
      exams: [],
      availability: {},
      preferences: {},
    })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'INVALID_TIMETABLE_RESPONSE')
  } finally {
    globalThis.fetch = originalFetch
  }
})
