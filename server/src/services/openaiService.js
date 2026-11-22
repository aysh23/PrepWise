import OpenAI from 'openai'
import { env } from '../config/env.js'

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
