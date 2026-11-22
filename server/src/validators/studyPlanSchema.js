import { z } from 'zod'

const weekdaySchema = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
])

const isRealTodayOrFutureDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (`${year}-${month}-${day}` !== value) return false

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  return value >= `${todayYear}-${todayMonth}-${todayDay}`
}

export const studyPlanSchema = z.object({
  subjects: z.array(z.object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1),
    topics: z.array(z.string().trim().min(1)).min(1),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    confidence: z.enum(['Low', 'Medium', 'High']).optional(),
    progress: z.number().min(0).max(100).optional(),
  })).min(1),
  exams: z.array(z.object({
    id: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    subject: z.string().trim().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.enum(['Low', 'Medium', 'High']).optional(),
  })).min(1),
  availability: z.object({
    hours: z.number().int().min(1).max(16),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    sessionDuration: z.union([z.literal(25), z.literal(50), z.literal(90)]),
    breakDuration: z.number().int().min(5).max(60),
    unavailableDays: z.array(weekdaySchema),
  }),
  preferences: z.object({
    revisionFrequency: z.string().optional(),
    difficultFirst: z.boolean().optional(),
    practiceQuestions: z.boolean().optional(),
    mockTests: z.boolean().optional(),
  }).optional(),
}).strict().superRefine((plan, ctx) => {
  const subjectNames = plan.subjects.map((subject) => subject.name.trim().toLowerCase())
  plan.subjects.forEach((subject, index) => {
    if (subjectNames.filter((name) => name === subject.name.trim().toLowerCase()).length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['subjects', index, 'name'],
        message: 'Subject names must be unique',
      })
    }
  })

  const subjectIds = new Set(plan.subjects.map((subject) => subject.id).filter(Boolean))
  const existingSubjectNames = new Set(
    plan.subjects.map((subject) => subject.name.trim().toLowerCase()),
  )

  const examinationKeys = new Set()
  plan.exams.forEach((exam, index) => {
    if (!isRealTodayOrFutureDate(exam.date)) {
      ctx.addIssue({
        code: 'custom',
        path: ['exams', index, 'date'],
        message: 'Exam date must be a real today-or-future date',
      })
    }

    if (exam.subjectId && !subjectIds.has(exam.subjectId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['exams', index, 'subjectId'],
        message: 'Exam subject must exist in the subject list',
      })
    }

    if (!exam.subjectId && (!exam.subject || !existingSubjectNames.has(exam.subject.trim().toLowerCase()))) {
      ctx.addIssue({
        code: 'custom',
        path: ['exams', index, 'subjectId'],
        message: 'Exam must reference an existing subject',
      })
    }

    const examinationKey = exam.subjectId
      ? `${exam.subjectId}:${exam.date}`
      : `${exam.subject?.trim().toLowerCase()}:${exam.date}`
    if (exam.date) {
      const key = examinationKey
      if (examinationKeys.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['exams', index],
          message: 'Duplicate examination entry',
        })
      }
      examinationKeys.add(key)
    }
  })
})
