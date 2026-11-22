import { ZodError } from 'zod'
import { AppError } from '../utils/errors.js'
import { studyPlanSchema } from '../validators/studyPlanSchema.js'
import { generateStudyPlan } from '../services/studyPlanService.js'

export function generateStudyPlanController(req, res, next) {
  try {
    const input = studyPlanSchema.parse(req.body)
    const result = generateStudyPlan(input)
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'Invalid study plan input', 'VALIDATION_ERROR', error.issues))
      return
    }
    next(error)
  }
}
