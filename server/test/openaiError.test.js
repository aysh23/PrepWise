import test from 'node:test'
import assert from 'node:assert/strict'
import { mapOpenAIError } from '../src/services/openaiService.js'

test('maps exhausted credits distinctly from a rate limit', () => {
  const error = mapOpenAIError({
    status: 429,
    code: 'credit_balance_exhausted',
    type: 'insufficient_quota',
  })

  assert.equal(error.code, 'AI_INSUFFICIENT_QUOTA')
  assert.equal(error.statusCode, 402)
  assert.match(error.message, /no available API credits/)
})

test('maps a normal 429 as a rate limit', () => {
  const error = mapOpenAIError({ status: 429, code: 'rate_limit_exceeded' })
  assert.equal(error.code, 'AI_RATE_LIMIT')
  assert.equal(error.statusCode, 429)
})

test('maps authentication failures distinctly', () => {
  const error = mapOpenAIError({ status: 401, code: 'invalid_api_key' })
  assert.equal(error.code, 'AI_AUTHENTICATION_ERROR')
  assert.equal(error.statusCode, 502)
})
