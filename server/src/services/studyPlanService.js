import { z, ZodError } from 'zod'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'
import { studyPlanSchema } from '../validators/studyPlanSchema.js'
import { generateStructuredResponse, getGroqStatus } from './groqService.js'
import { validateTimetable } from './timetableValidator.js'
import { studyAnalysisPrompt, studyAnalysisJsonSchema } from '../prompts/studyAnalysisPrompt.js'
import { timetableGenerationPrompt, timetableJsonSchema } from '../prompts/timetableGenerationPrompt.js'

const topicAnalysisSchema = z.object({
  topic: z.string().min(1),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  recommendedMinutes: z.number().int().nonnegative(),
  reason: z.string().min(1),
})

const subjectAnalysisSchema = z.object({
  subject: z.string().min(1),
  subjectPriority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  urgency: z.enum(['Low', 'Medium', 'High', 'Critical']),
  recommendedMinutesPerDay: z.number().int().min(0).max(960),
  topics: z.array(topicAnalysisSchema),
})

const analysisOutputSchema = z.object({
  subjects: z.array(subjectAnalysisSchema),
  revisionRequirements: z.array(z.object({
    subject: z.string().min(1),
    frequency: z.string().min(1),
    recommendedActivities: z.array(z.string().min(1)),
  })),
  reasoning: z.string().min(1),
}).strict()

const timetableOutputSchema = z.object({
  timetable: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    subject: z.string().min(1),
    topic: z.string().min(1),
    activityType: z.enum(['Learning', 'Revision', 'Practice', 'Mock Test']),
    duration: z.number().int().positive(),
  })),
}).strict()

function validateAnalysisOutput(analysis, studentInput) {
  const parsed = analysisOutputSchema.parse(analysis)
  const suppliedSubjects = new Map(
    studentInput.subjects.map((subject) => [subject.name.trim().toLowerCase(), new Set(subject.topics.map((topic) => topic.trim().toLowerCase()))]),
  )

  if (parsed.subjects.length !== suppliedSubjects.size) {
    throw new AppError(
      502,
      'AI analysis omitted or duplicated supplied subjects.',
      'AI_INVALID_ANALYSIS',
    )
  }

  const analyzedSubjects = new Set()
  parsed.subjects.forEach((subject) => {
    const subjectName = subject.subject.trim().toLowerCase()
    if (!suppliedSubjects.has(subjectName)) {
      throw new AppError(502, 'AI analysis introduced an unknown subject.', 'AI_INVALID_ANALYSIS')
    }
    if (analyzedSubjects.has(subjectName)) {
      throw new AppError(502, 'AI analysis duplicated a supplied subject.', 'AI_INVALID_ANALYSIS')
    }
    analyzedSubjects.add(subjectName)
    const topics = suppliedSubjects.get(subjectName)
    if (subject.topics.length !== topics.size) {
      throw new AppError(502, 'AI analysis omitted or duplicated supplied topics.', 'AI_INVALID_ANALYSIS')
    }
    const analyzedTopics = new Set()
    subject.topics.forEach((topic) => {
      const topicName = topic.topic.trim().toLowerCase()
      if (!topics.has(topicName)) {
        throw new AppError(502, 'AI analysis introduced an unknown topic.', 'AI_INVALID_ANALYSIS')
      }
      if (analyzedTopics.has(topicName)) {
        throw new AppError(502, 'AI analysis duplicated a supplied topic.', 'AI_INVALID_ANALYSIS')
      }
      analyzedTopics.add(topicName)
    })
  })

  for (const subjectName of suppliedSubjects.keys()) {
    if (!analyzedSubjects.has(subjectName)) {
      throw new AppError(502, 'AI analysis omitted a supplied subject.', 'AI_INVALID_ANALYSIS')
    }
  }

  const analyzedRevisionSubjects = new Set()
  parsed.revisionRequirements.forEach((requirement) => {
    const subjectName = requirement.subject.trim().toLowerCase()
    if (!suppliedSubjects.has(subjectName)) {
      throw new AppError(502, 'AI analysis added an unknown revision subject.', 'AI_INVALID_ANALYSIS')
    }
    if (analyzedRevisionSubjects.has(subjectName)) {
      throw new AppError(502, 'AI analysis duplicated a revision subject.', 'AI_INVALID_ANALYSIS')
    }
    analyzedRevisionSubjects.add(subjectName)
  })

  return parsed
}

function buildRefinementPrompt(validation) {
  return `${timetableGenerationPrompt}

Refinement required: the previous timetable failed programmatic validation.
Correct every listed error and coverage gap and preserve all hard constraints.
Validation errors and coverage gaps:
${JSON.stringify(validation.errors)}
Validation warnings:
${JSON.stringify(validation.warnings)}

Do not return an explanation instead of the JSON timetable.`
}

export async function generateStudyPlan(input, dependencies = {}) {
  let studentInput
  try {
    studentInput = studyPlanSchema.parse(input)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(400, 'Invalid study plan input', 'VALIDATION_ERROR', error.issues)
    }
    throw error
  }

  const groqStatus = dependencies.getGroqStatus || getGroqStatus
  const structuredResponse = dependencies.generateStructuredResponse || generateStructuredResponse
  const planningDate = dependencies.planningDate || new Date().toISOString().slice(0, 10)
  const groq = groqStatus()
  if (!groq.configured) {
    throw new AppError(
      501,
      'AI timetable generation is not configured. No study timetable was generated.',
      'AI_GENERATION_NOT_CONFIGURED',
      { configured: false, model: groq.model },
    )
  }

  // Stage 1: analyze priorities without creating sessions.
  const rawAnalysis = await structuredResponse({
    prompt: studyAnalysisPrompt,
    input: {
      subjects: studentInput.subjects,
      exams: studentInput.exams,
      availability: studentInput.availability,
      preferences: studentInput.preferences || {},
      currentDate: planningDate,
    },
    schemaName: 'prepwise_study_analysis',
    stage: 'P1-analysis',
    schema: studyAnalysisJsonSchema,
  })

  let analysis
  try {
    analysis = validateAnalysisOutput(rawAnalysis, studentInput)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(502, 'The AI analysis output failed schema validation.', 'AI_INVALID_ANALYSIS')
    }
    throw error
  }

  const maxAttempts = dependencies.refinementLimit ?? env.STUDY_PLAN_REFINEMENT_LIMIT
  let timetable
  let validation
  let refinementAttempts = 0

  // Stage 2: generate a timetable, then independently validate every hard constraint.
  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    const rawTimetable = await structuredResponse({
      prompt: attempt === 0
        ? timetableGenerationPrompt
        : buildRefinementPrompt(validation),
      input: {
        studentInput,
        analysis,
        previousValidation: attempt === 0 ? null : validation,
        currentDate: planningDate,
      },
      schemaName: 'prepwise_timetable',
      stage: attempt === 0 ? 'P2-timetable' : 'P3-refinement',
      schema: timetableJsonSchema,
    })

    let parsedTimetable
    try {
      parsedTimetable = timetableOutputSchema.parse(rawTimetable)
    } catch (error) {
      if (error instanceof ZodError) {
        validation = {
          valid: false,
          errors: ['AI timetable output failed schema validation'],
          warnings: [],
        }
        refinementAttempts = attempt
        continue
      }
      throw error
    }

    timetable = parsedTimetable.timetable
    validation = validateTimetable(timetable, studentInput, {
      planningDate,
      requiredTopicCoverage: env.TOPIC_COVERAGE_REQUIRED,
    })
    refinementAttempts = attempt
    if (validation.valid) break
  }

  if (!validation?.valid) {
    throw new AppError(
      422,
      'The study timetable could not be validated successfully. No timetable was returned.',
      'TIMETABLE_VALIDATION_FAILED',
      {
        validation,
        refinementAttempts,
      },
    )
  }

  return {
    analysis,
    timetable,
    validation,
    generation: {
      model: groq.model,
      refinementAttempts,
    },
  }
}
