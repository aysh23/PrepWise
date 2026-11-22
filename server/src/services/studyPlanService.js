import { AppError } from '../utils/errors.js'
import { getOpenAIStatus } from './openaiService.js'

export function generateStudyPlan() {
  const openAI = getOpenAIStatus()
  if (!openAI.configured) {
    throw new AppError(
      501,
      'AI timetable generation is not configured. No study timetable was generated.',
      'AI_GENERATION_NOT_CONFIGURED',
      { configured: false, model: openAI.model },
    )
  }

  throw new AppError(
    501,
    'AI timetable generation is not implemented yet. No study timetable was generated.',
    'AI_GENERATION_NOT_IMPLEMENTED',
    { configured: true, model: openAI.model },
  )
}
