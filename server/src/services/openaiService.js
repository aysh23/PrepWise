import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

let client

export function mapOpenAIError(error) {
  const status = error?.status ?? error?.statusCode
  const providerCode = error?.code ?? error?.error?.code
  const providerType = error?.type ?? error?.error?.type

  if (providerCode === 'credit_balance_exhausted' || providerType === 'insufficient_quota') {
    return new AppError(
      402,
      'The OpenAI account has no available API credits. Add credits or use a valid billing-enabled API key.',
      'AI_INSUFFICIENT_QUOTA',
      { providerCode: 'credit_balance_exhausted' },
    )
  }
  if (status === 429) {
    return new AppError(
      429,
      'The AI provider rate limit was reached. Please retry later.',
      'AI_RATE_LIMIT',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 401 || status === 403) {
    return new AppError(
      502,
      'The AI provider rejected the configured credentials.',
      'AI_AUTHENTICATION_ERROR',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 404) {
    return new AppError(
      502,
      'The configured OpenAI model is unavailable.',
      'AI_MODEL_UNAVAILABLE',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 400) {
    return new AppError(
      400,
      'The AI provider rejected the generation request.',
      'AI_REQUEST_REJECTED',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status >= 500) {
    return new AppError(
      502,
      'The AI provider is temporarily unavailable.',
      'AI_PROVIDER_UNAVAILABLE',
      providerCode ? { providerCode } : undefined,
    )
  }

  return new AppError(
    502,
    'The AI provider request failed.',
    'AI_REQUEST_FAILED',
    providerCode ? { providerCode } : undefined,
  )
}

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
    throw mapOpenAIError(error)
  }
}
