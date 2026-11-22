import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTimetable } from '../src/services/timetableValidator.js'

const studentInput = {
  subjects: [{
    id: 'sub-1',
    name: 'Calculus',
    topics: ['Integration', 'Series'],
  }],
  exams: [{
    subjectId: 'sub-1',
    date: '2099-12-31',
  }],
  availability: {
    hours: 3,
    startTime: '09:00',
    sessionDuration: 50,
    breakDuration: 10,
    unavailableDays: ['Sunday'],
  },
}

test('accepts a valid timetable', () => {
  const result = validateTimetable([{
    date: '2099-12-30',
    startTime: '09:00',
    endTime: '10:00',
    subject: 'Calculus',
    topic: 'Integration',
    activityType: 'Learning',
    duration: 60,
  }], studentInput)

  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
})

test('rejects overlap, invalid duration, unavailable day, and unknown topic', () => {
  const result = validateTimetable([
    {
      date: '2099-12-30',
      startTime: '09:00',
      endTime: '10:00',
      subject: 'Calculus',
      topic: 'Integration',
      activityType: 'Learning',
      duration: 60,
    },
    {
      date: '2099-12-30',
      startTime: '09:30',
      endTime: '10:30',
      subject: 'Calculus',
      topic: 'Unknown Topic',
      activityType: 'Revision',
      duration: 30,
    },
  ], studentInput)

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('overlap')))
  assert.ok(result.errors.some((error) => error.includes('topic')))
  assert.ok(result.errors.some((error) => error.includes('duration')))
})

test('rejects a session scheduled on an unavailable weekday', () => {
  const result = validateTimetable([{
    date: '2099-12-27',
    startTime: '09:00',
    endTime: '10:00',
    subject: 'Calculus',
    topic: 'Integration',
    activityType: 'Practice',
    duration: 60,
  }], studentInput)

  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('unavailable')))
})
