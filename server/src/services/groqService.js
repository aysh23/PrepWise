import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

// The OpenAI SDK is used only as an HTTP-compatible client for Groq's API.
let client

export function mapGroqError(error) {
  const status = error?.status ?? error?.statusCode
  const providerCode = error?.code ?? error?.error?.code
  const providerMessage = error?.error?.message ?? error?.message

  if (status === 402) {
    return new AppError(
      402,
      'Groq rejected the request because this account or project requires billing or has no available usage allowance.',
      'AI_INSUFFICIENT_QUOTA',
      providerCode ? { providerCode } : undefined,
    )
  }
  if (status === 429) {
    return new AppError(
      429,
      'Groq free-tier usage limit reached. Wait for the limit to reset or review your Groq usage limits.',
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
    console.error('Groq rejected the request:', { providerCode, message: providerMessage })
    return new AppError(
      502,
      'Groq rejected the generation request. Check the model and structured-output schema in the backend terminal.',
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

// Groq strict Structured Outputs supports a subset of JSON Schema.
// Keep shape constraints in the provider schema; Zod performs detailed validation.
function toGroqStrictSchema(schema) {
  const supportedKeys = new Set([
    'type',
    'properties',
    'required',
    'items',
    'enum',
    'additionalProperties',
  ])

  if (Array.isArray(schema)) return schema.map(toGroqStrictSchema)
  if (!schema || typeof schema !== 'object') return schema

  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => supportedKeys.has(key))
      .map(([key, value]) => [key, toGroqStrictSchema(value)]),
  )
}

export function getGroqStatus() {
  return {
    configured: Boolean(env.GROQ_API_KEY),
    model: env.GROQ_MODEL,
  }
}

function getGroqClient() {
  if (!env.GROQ_API_KEY) return null

  client ??= new OpenAI({
    apiKey: env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  return client
}

export async function generateStructuredResponse({ prompt, input, schemaName, schema }) {
  const groqClient = getGroqClient()
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
          content: `${prompt}\n\nReturn only a JSON object matching the supplied schema. Do not include Markdown fences or commentary.`,
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          strict: true,
          schema: toGroqStrictSchema(schema),
        },
      },
      temperature: 0.2,
    })

    const responseText = response.choices?.[0]?.message?.content
    if (!responseText) {
      throw new AppError(
        502,
        'Groq returned no structured output.',
        'AI_EMPTY_RESPONSE',
      )
    }

    try {
      return JSON.parse(responseText)
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
