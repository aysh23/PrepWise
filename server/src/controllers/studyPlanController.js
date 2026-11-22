import { generateStudyPlan } from '../services/studyPlanService.js'

export async function generateStudyPlanController(req, res, next) {
  try {
    const result = await generateStudyPlan(req.body)
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}
