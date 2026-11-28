import test from 'node:test'
import assert from 'node:assert/strict'
import { generateStudyPlan } from '../src/services/studyPlanService.js'
import { AppError } from '../src/utils/errors.js'

const studentInput = {
  subjects: [{
    id: 'sub-1',
    name: 'Calculus',
    topics: ['Integration', 'Series'],
  }],
  exams: [{
    subjectId: 'sub-1',
    date: '2099-12-31',
    priority: 'High',
  }],
  availability: {
    hours: 3,
    startTime: '09:00',
    sessionDuration: 50,
    breakDuration: 10,
    unavailableDays: ['Sunday'],
  },
  preferences: {
    revisionFrequency: 'Every 3 days',
    difficultFirst: true,
    practiceQuestions: true,
    mockTests: false,
  },
}

const analysis = {
  subjects: [{
    subject: 'Calculus',
    subjectPriority: 'High',
    urgency: 'High',
    recommendedMinutesPerDay: 120,
    topics: [
      { topic: 'Integration', priority: 'High', recommendedMinutes: 60, reason: 'Supplied as a required topic.' },
      { topic: 'Series', priority: 'Medium', recommendedMinutes: 60, reason: 'Supplied as a required topic.' },
    ],
  }],
  revisionRequirements: [{
    subject: 'Calculus',
    frequency: 'Every 3 days',
    recommendedActivities: ['Revision'],
  }],
  reasoning: 'Prioritization uses the supplied exam and subject details.',
}

test('refines a mock timetable and returns only after validation succeeds', async () => {
  let responseIndex = 0
  const mockedResponse = async ({ schemaName }) => {
    responseIndex += 1
    if (schemaName === 'prepwise_study_analysis') return analysis
    if (responseIndex === 2) return { timetable: [] }
    return {
      timetable: [
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
      ],
    }
  }

  const result = await generateStudyPlan(studentInput, {
    planningDate: '2099-12-21',
    refinementLimit: 1,
    getGroqStatus: () => ({ configured: true, model: 'test-model' }),
    generateStructuredResponse: mockedResponse,
  })

  assert.equal(result.validation.valid, true)
  assert.equal(result.generation.refinementAttempts, 1)
  assert.equal(result.timetable.length, 2)
  assert.equal(result.generation.model, 'test-model')
})

test('does not return success if refinement remains invalid', async () => {
  let callIndex = 0
  await assert.rejects(
    generateStudyPlan(studentInput, {
      planningDate: '2099-12-21',
      refinementLimit: 1,
      getGroqStatus: () => ({ configured: true, model: 'test-model' }),
      generateStructuredResponse: async ({ schemaName }) => {
        if (schemaName === 'prepwise_study_analysis') return analysis
        callIndex += 1
        return { timetable: [] }
      },
    }),
    (error) => {
      assert.ok(error instanceof AppError)
      assert.equal(error.code, 'TIMETABLE_VALIDATION_FAILED')
      assert.equal(error.statusCode, 422)
      assert.equal(error.details.validation.valid, false)
      assert.equal(error.details.refinementAttempts, 1)
      assert.ok(callIndex >= 2)
      return true
    },
  )
})

test('rejects analysis that omits a supplied subject', async () => {
  await assert.rejects(
    generateStudyPlan(studentInput, {
      planningDate: '2099-12-21',
      refinementLimit: 0,
      getGroqStatus: () => ({ configured: true, model: 'test-model' }),
      generateStructuredResponse: async ({ schemaName }) => {
        if (schemaName === 'prepwise_study_analysis') {
          return {
            ...analysis,
            subjects: [],
          }
        }
        return { timetable: [] }
      },
    }),
    (error) => {
      assert.ok(error instanceof AppError)
      assert.equal(error.code, 'AI_INVALID_ANALYSIS')
      return true
    },
  )
})


test('retries a Groq strict-JSON rejection once through the bounded P3 recovery path', async () => {
  const calls = []
  const validTimetable = {
    timetable: [
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
    ],
  }

  const result = await generateStudyPlan(studentInput, {
    planningDate: '2099-12-21',
    refinementLimit: 1,
    getGroqStatus: () => ({ configured: true, model: 'test-model' }),
    generateStructuredResponse: async (request) => {
      calls.push(request)
      if (request.schemaName === 'prepwise_study_analysis') return analysis
      if (request.stage === 'P2-timetable') {
        throw new AppError(502, 'Groq rejected structured output', 'AI_REQUEST_REJECTED', {
          providerCode: 'json_validate_failed',
        })
      }
      return validTimetable
    },
  })

  assert.equal(result.validation.valid, true)
  assert.equal(result.generation.refinementAttempts, 1)
  assert.equal(calls.at(-1).stage, 'P3-refinement')
  assert.match(calls.at(-1).prompt, /strict JSON validator/)
})

test('does not retry Groq JSON validation rejection beyond the configured refinement limit', async () => {
  let timetableCalls = 0
  await assert.rejects(
    generateStudyPlan(studentInput, {
      planningDate: '2099-12-21',
      refinementLimit: 1,
      getGroqStatus: () => ({ configured: true, model: 'test-model' }),
      generateStructuredResponse: async ({ schemaName }) => {
        if (schemaName === 'prepwise_study_analysis') return analysis
        timetableCalls += 1
        throw new AppError(502, 'Groq rejected structured output', 'AI_REQUEST_REJECTED', {
          providerCode: 'json_validate_failed',
        })
      },
    }),
    (error) => {
      assert.ok(error instanceof AppError)
      assert.equal(error.code, 'AI_REQUEST_REJECTED')
      assert.equal(error.details.providerCode, 'json_validate_failed')
      assert.equal(timetableCalls, 2)
      return true
    },
  )
})
