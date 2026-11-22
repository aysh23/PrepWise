import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

let client

export function mapGroqError(error) {
  const status = error?.status ?? error?.statusCode
  const providerCode = error?.code ?? error?.error?.code
  const providerMessage = error?.error?.message ?? error?.message

  if (status === 429) {
    return new AppError(
      429,
      'Groq free-tier usage limit reached. Please wait for the limit to reset or review your Groq usage limits.',
      'AI_RATE_LIMIT',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 401 || status === 403) {
    return new AppError(
      502,
      'Groq rejected the configured API key. Check GROQ_API_KEY in server/.env.',
      'AI_AUTHENTICATION_ERROR',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 404) {
    return new AppError(
      502,
      'The configured Groq model is unavailable. Check GROQ_MODEL.',
      'AI_MODEL_UNAVAILABLE',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 400) {
    return new AppError(
      502,
      'Groq rejected the generation request. The selected model may not support the requested JSON response format.',
      'AI_REQUEST_REJECTED',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status >= 500) {
    return new AppError(
      502,
      'Groq is temporarily unavailable. Please try again.',
      'AI_PROVIDER_UNAVAILABLE',
      providerCode ? { providerCode } : undefined,
    )
  }

  console.error('Groq API request failed:', {
    status,
    code: providerCode,
    message: providerMessage,
  })
  return new AppError(
    502,
    'The Groq API request failed. Check the backend terminal for provider details.',
    'AI_REQUEST_FAILED',
    providerCode ? { providerCode } : undefined,
  )
}

export function getOpenAIStatus() {
  return {
    configured: Boolean(env.GROQ_API_KEY),
    model: env.GROQ_MODEL,
  }
}

export function getOpenAIClient() {
  if (!env.GROQ_API_KEY) return null
  client ??= new OpenAI({
    apiKey: env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
  return client
}

export async function generateStructuredResponse({ prompt, input, schemaName, schema }) {
  const groqClient = getOpenAIClient()
  if (!groqClient) {
    throw new AppError(
      501,
      'AI timetable generation is not configured. Add GROQ_API_KEY to server/.env. No study timetable was generated.',
      'AI_GENERATION_NOT_CONFIGURED',
      { configured: false, model: env.GROQ_MODEL },
    )
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `${prompt}\n\nReturn only a JSON object matching this schema. Do not include Markdown fences or commentary:\n${JSON.stringify(schema)}`,
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const text = response.choices?.[0]?.message?.content
    if (!text) {
      throw new AppError(
        502,
        'Groq returned no structured output.',
        'AI_EMPTY_RESPONSE',
      )
    }

    try {
      return JSON.parse(text)
    } catch {
      throw new AppError(
        502,
        'Groq returned invalid JSON.',
        'AI_INVALID_JSON',
      )
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw mapGroqError(error)
  }
}
