import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTimetable } from '../src/services/timetableValidator.js'

const planningDate = '2099-12-21'
const studentInput = {
  subjects: [{
    id: 'sub-1',
    name: 'Calculus',
    topics: ['Integration', 'Series'],
  }],
  exams: [{ subjectId: 'sub-1', date: '2099-12-31' }],
  availability: {
    hours: 3,
    startTime: '09:00',
    sessionDuration: 50,
    breakDuration: 10,
    unavailableDays: ['Sunday'],
  },
}

const validTimetable = [
  {
    date: '2099-12-21',
    startTime: '09:00',
    endTime: '10:00',
    subject: 'Calculus',
    topic: 'Integration',
    activityType: 'Learning',
    duration: 60,
  },
  {
    date: '2099-12-21',
    startTime: '10:10',
    endTime: '11:10',
    subject: 'Calculus',
    topic: 'Series',
    activityType: 'Revision',
    duration: 60,
  },
]

const validate = (timetable) => validateTimetable(timetable, studentInput, {
  planningDate,
  requiredTopicCoverage: true,
})

test('accepts a valid timetable', () => {
  const result = validate(validTimetable)
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
})

test('rejects an empty timetable', () => {
  const result = validate([])
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('at least one')))
})

test('rejects overlapping sessions', () => {
  const timetable = structuredClone(validTimetable)
  timetable[1].startTime = '09:30'
  timetable[1].endTime = '10:30'
  timetable[1].duration = 60
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('overlap')))
})

test('rejects an insufficient break', () => {
  const timetable = structuredClone(validTimetable)
  timetable[1].startTime = '10:05'
  timetable[1].endTime = '11:05'
  timetable[1].duration = 60
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('insufficient break')))
})

test('rejects a daily hour limit exceeded', () => {
  const result = validate([
    ...validTimetable,
    {
      date: '2099-12-21',
      startTime: '11:20',
      endTime: '12:40',
      subject: 'Calculus',
      topic: 'Integration',
      activityType: 'Practice',
      duration: 80,
    },
  ])
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('daily study hours exceed availability')))
})

test('rejects a session before the preferred start time', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].startTime = '08:30'
  timetable[0].endTime = '09:30'
  timetable[0].duration = 60
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('usable daily time window')))
})

test('rejects a session after the subject examination', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].date = '2100-01-01'
  timetable[1].date = '2100-01-01'
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('after the latest examination')))
})

test('rejects an unknown subject', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].subject = 'Physics'
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('subject does not exist')))
})

test('rejects an unknown topic', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].topic = 'Differential Equations'
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('topic does not exist')))
})

test('rejects missing mandatory topic coverage', () => {
  const result = validate([validTimetable[0]])
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('Missing topic coverage') && error.includes('Series')))
})

test('rejects invalid duration', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].duration = 30
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('duration')))
})

test('rejects a session before the planning date', () => {
  const timetable = structuredClone(validTimetable)
  timetable[0].date = '2099-12-19'
  timetable[1].date = '2099-12-19'
  const result = validate(timetable)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('before the current planning date')))
})
