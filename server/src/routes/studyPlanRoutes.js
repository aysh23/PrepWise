import { Router } from 'express'
import { generateStudyPlanController } from '../controllers/studyPlanController.js'

export const studyPlanRouter = Router()

studyPlanRouter.post('/generate', generateStudyPlanController)
