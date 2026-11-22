import test from 'node:test'
import assert from 'node:assert/strict'
import { mapGroqError } from '../src/services/groqService.js'

test('maps Groq free-tier limits as rate limits', () => {
  const error = mapGroqError({ status: 429, code: 'rate_limit_exceeded' })
  assert.equal(error.code, 'AI_RATE_LIMIT')
  assert.equal(error.statusCode, 429)
  assert.match(error.message, /free-tier usage limit/)
})

test('maps payment or exhausted allowance responses distinctly', () => {
  const error = mapGroqError({ status: 402, code: 'payment_required' })
  assert.equal(error.code, 'AI_INSUFFICIENT_QUOTA')
  assert.equal(error.statusCode, 402)
})

test('maps authentication failures distinctly', () => {
  const error = mapGroqError({ status: 401, code: 'invalid_api_key' })
  assert.equal(error.code, 'AI_AUTHENTICATION_ERROR')
  assert.equal(error.statusCode, 502)
})

test('maps missing models distinctly', () => {
  const error = mapGroqError({ status: 404, code: 'model_not_found' })
  assert.equal(error.code, 'AI_MODEL_UNAVAILABLE')
  assert.equal(error.statusCode, 502)
})
