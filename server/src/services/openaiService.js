import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

let client

export function getOpenAIStatus() {
  return {
    configured: Boolean(env.OPENAI_API_KEY),
    model: env.OPENAI_MODEL,
  }
}

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) return null
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY })
  return client
}

export async function generateStructuredResponse({ prompt, input, schemaName, schema }) {
  const openAIClient = getOpenAIClient()
  if (!openAIClient) {
    throw new AppError(
      501,
      'AI timetable generation is not configured. No study timetable was generated.',
      'AI_GENERATION_NOT_CONFIGURED',
      { configured: false, model: env.OPENAI_MODEL },
    )
  }

  try {
    const response = await openAIClient.responses.create({
      model: env.OPENAI_MODEL,
      instructions: prompt,
      input: JSON.stringify(input),
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
      temperature: 0.2,
    })

    const text = response.output_text
    if (!text) {
      throw new AppError(
        502,
        'The AI provider returned no structured output.',
        'AI_EMPTY_RESPONSE',
      )
    }

    try {
      return JSON.parse(text)
    } catch {
      throw new AppError(
        502,
        'The AI provider returned invalid JSON.',
        'AI_INVALID_JSON',
      )
    }
  } catch (error) {
    if (error instanceof AppError) throw error

    const status = error?.status ?? error?.statusCode
    if (status === 429) {
      throw new AppError(
        429,
        'The AI provider rate limit was reached. Please retry later.',
        'AI_RATE_LIMIT',
      )
    }
    if (status === 401 || status === 403) {
      throw new AppError(
        502,
        'The AI provider rejected the configured credentials.',
        'AI_AUTHENTICATION_ERROR',
      )
    }
    if (status >= 500) {
      throw new AppError(
        502,
        'The AI provider is temporarily unavailable.',
        'AI_PROVIDER_UNAVAILABLE',
      )
    }

    throw new AppError(
      502,
      'The AI provider request failed.',
      'AI_REQUEST_FAILED',
    )
  }
}
