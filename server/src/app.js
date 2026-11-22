import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { studyPlanRouter } from './routes/studyPlanRoutes.js'
import { errorHandler, notFoundHandler } from './utils/errors.js'

export function createApp() {
  const app = express()

  app.use(cors({
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
  }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'PrepWise API is running',
    })
  })

  app.use('/api/study-plans', studyPlanRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
