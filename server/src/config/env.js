import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  GROQ_API_KEY: z.string().trim().optional(),
  GROQ_MODEL: z.string().trim().min(1).default('openai/gpt-oss-120b'),
  STUDY_PLAN_REFINEMENT_LIMIT: z.coerce.number().int().min(0).max(2).default(2),
  TOPIC_COVERAGE_REQUIRED: z.enum(['true', 'false']).transform((value) => value === 'true').default('true'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid environment configuration: ${issues}`)
}

export const env = parsed.data
