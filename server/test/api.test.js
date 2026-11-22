import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

async function withServer(run) {
  const app = createApp()
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    const address = server.address()
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  }
}

test('GET /api/health returns the PrepWise API status', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      success: true,
      message: 'PrepWise API is running',
    })
  })
})

test('POST /api/study-plans/generate returns 501 without API key', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/study-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjects: [{
          id: 'sub-1',
          name: 'Calculus',
          topics: ['Integration'],
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
      }),
    })

    assert.equal(response.status, 501)
    const body = await response.json()
    assert.equal(body.success, false)
    assert.equal(body.code, 'AI_GENERATION_NOT_CONFIGURED')
  })
})
