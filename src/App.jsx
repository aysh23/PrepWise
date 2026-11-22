import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, LayoutDashboard, Menu, MoreHorizontal,
  Plus, RefreshCw, Search, Settings, Sparkles, Target, Trash2, User,
  BookOpen, X, Edit3
} from 'lucide-react'
import { studyRepository } from './services/studyRepository'
import { requestStudyPlan } from './services/planGenerationService'
import './App.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Create Study Plan', icon: Sparkles },
  { id: 'plan', label: 'Study Plan', icon: CalendarDays },
  { id: 'subjects', label: 'My Subjects', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const DEFAULT_SUBJECTS = []
const DEFAULT_EXAMS = []

const DEFAULT_AVAILABILITY = {
  hours: 5, startTime: '09:00', sessionDuration: 50, breakDuration: 10,
  unavailableDays: ['Sunday'],
}

const defaultPreferences = {
  revisionFrequency: 'Every 3 days',
  difficultFirst: true,
  practiceQuestions: true,
  mockTests: true,
}

const DEFAULT_SESSIONS = []

function loadState(key, fallback) {
  return studyRepository.load(key, fallback)
}

function timeToMinutes(time) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time || '')) return null
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidExamDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime()) || formatLocalDate(date) !== value) return false
  return value >= formatLocalDate(new Date())
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [subjects, setSubjects] = useState(() => loadState('prepwise_subjects', DEFAULT_SUBJECTS))
  const [exams, setExams] = useState(() => loadState('prepwise_exams', DEFAULT_EXAMS))
  const [availability, setAvailability] = useState(() => loadState('prepwise_availability', DEFAULT_AVAILABILITY))
  const [preferences, setPreferences] = useState(() => loadState('prepwise_preferences', defaultPreferences))
  const [sessions, setSessions] = useState(() => loadState('prepwise_sessions', DEFAULT_SESSIONS))
  const [planStatus, setPlanStatus] = useState(() => loadState('prepwise_plan_status', 'Draft plan'))

  useEffect(() => studyRepository.save('subjects', subjects), [subjects])
  useEffect(() => studyRepository.save('exams', exams), [exams])
  useEffect(() => studyRepository.save('availability', availability), [availability])
  useEffect(() => studyRepository.save('preferences', preferences), [preferences])
  useEffect(() => studyRepository.save('sessions', sessions), [sessions])
  useEffect(() => studyRepository.save('plan_status', planStatus), [planStatus])

  const navigate = (page) => {
    setActivePage(page)
    setMobileNavOpen(false)
  }

  const generatePlan = (input) => {
    const nextSubjects = input?.subjects?.length ? input.subjects : subjects
    const nextExams = input?.exams?.length ? input.exams : exams
    const nextAvailability = input?.availability || availability
    const nextPreferences = input?.preferences || preferences

    setSubjects(nextSubjects)
    setExams(nextExams)
    setAvailability(nextAvailability)
    setPreferences(nextPreferences)
    setPlanStatus('AI generation unavailable')
    return requestStudyPlan()
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={20} /></div>
          <span>PrepWise</span>
          <button className="close-mobile" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="support-link"><CircleHelp size={18} /> Help & support</button>
          <div className="profile-mini">
            <div className="avatar"><User size={16} /></div>
            <div><strong>Student</strong><span>Personal workspace</span></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      {mobileNavOpen && <button className="nav-backdrop" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="search-box"><Search size={18} /><input placeholder="Search subjects, topics..." /></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
            <div className="avatar small"><User size={15} /></div>
          </div>
        </header>

        {activePage === 'dashboard' && (
          <Dashboard
            subjects={subjects}
            exams={exams}
            sessions={sessions}
            availability={availability}
            onNavigate={navigate}
          />
        )}
        {activePage === 'create' && (
          <CreatePlan subjects={subjects} exams={exams} availability={availability} preferences={preferences} onGenerate={generatePlan} onCancel={() => navigate('dashboard')} />
        )}
        {activePage === 'plan' && (
          <StudyPlan
            sessions={sessions}
            subjects={subjects}
            availability={availability}
            planStatus={planStatus}
            onSessionsChange={setSessions}
            onRegenerate={() => navigate('create')}
          />
        )}
        {activePage === 'subjects' && <Subjects subjects={subjects} onUpdate={setSubjects} />}
        {activePage === 'settings' && (
          <SettingsPage availability={availability} preferences={preferences} onAvailabilityChange={setAvailability} onPreferencesChange={setPreferences} />
        )}
      </main>
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  )
}

function Dashboard({ subjects, exams, sessions, availability, onNavigate }) {
  const [currentDate] = useState(() => new Date())
  const today = formatLocalDate(currentDate)
  const now = currentDate
  const dateLabel = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
  const todaySessions = sessions.filter((session) => session.date === today)
  const completed = sessions.filter((session) => session.completed).length
  const plannedHours = sessions.reduce((total, session) => total + session.duration, 0) / 60
  const todayDate = formatLocalDate(new Date())
  const sortedExams = exams
    .filter((exam) => isValidExamDate(exam.date) && exam.date >= todayDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const attention = subjects.filter((subject) => subject.difficulty === 'Hard' || subject.confidence === 'Low').slice(0, 3)

  return (
    <div className="page dashboard-page">
      <PageHeading
        eyebrow={dateLabel}
        title="Welcome, Student"
        subtitle="Here's how your study plan is shaping up."
        actions={<button className="primary-button" onClick={() => onNavigate('create')}><Plus size={18} /> Generate Study Plan</button>}
      />

      <div className="metric-grid">
        <MetricCard icon={<CalendarDays />} label="Upcoming exams" value={sortedExams.length} detail={`${sortedExams[0]?.subject || 'No exams'} next`} tone="violet" />
        <MetricCard icon={<Clock3 />} label="Study hours planned" value={`${plannedHours.toFixed(1)}h`} detail={`${availability.hours}h available daily`} tone="blue" />
        <MetricCard icon={<Target />} label="Subjects to focus" value={attention.length} detail="Needs extra attention" tone="amber" />
        <MetricCard icon={<CheckCircle2 />} label="Plan progress" value={`${sessions.length ? Math.round(completed / sessions.length * 100) : 0}%`} detail={`${completed} of ${sessions.length} sessions done`} tone="green" />
      </div>

      <div className="dashboard-grid">
        <section className="card schedule-card">
          <div className="card-heading"><div><span className="section-kicker">TODAY</span><h2>Today's schedule</h2></div><button className="text-button" onClick={() => onNavigate('plan')}>View plan <ArrowRight size={15} /></button></div>
          {todaySessions.length ? (
            <div className="schedule-list">
              {todaySessions.map((session) => (
                <div className={`schedule-row ${session.completed ? 'done' : ''}`} key={session.id}>
                  <div className="time-column"><strong>{session.startTime}</strong><span>{session.endTime}</span></div>
                  <div className="subject-dot" />
                  <div className="session-info"><strong>{session.subject}</strong><span>{session.topic}</span></div>
                  <span className={`activity-pill ${session.type.toLowerCase().replace(' ', '-')}`}>{session.type}</span>
                  {session.completed ? <CheckCircle2 className="completed-icon" size={20} /> : <button className="round-check" aria-label={`Complete ${session.subject}`} />}
                </div>
              ))}
            </div>
          ) : <EmptyState icon={<CalendarDays />} title="No sessions today" text="Generate a plan to schedule focused study time." action="Generate plan" onAction={() => onNavigate('create')} />}
        </section>

        <section className="card exams-card">
          <div className="card-heading"><div><span className="section-kicker">EXAMINATION</span><h2>Upcoming exams</h2></div></div>
          <div className="exam-list">
            {sortedExams.length ? sortedExams.slice(0, 4).map((exam) => (
              <div className="exam-row" key={exam.id}>
                <div className="date-tile"><strong>{new Date(exam.date + 'T00:00:00').getDate()}</strong><span>{new Date(exam.date + 'T00:00:00').toLocaleString('en', { month: 'short' })}</span></div>
                <div><strong>{exam.subject}</strong><span>{exam.priority} priority</span></div>
                <ChevronDown size={16} />
              </div>
            )) : <EmptyState compact icon={<CalendarDays />} title="No exams added" text="Add exams while creating a plan." />}
          </div>
        </section>

        <section className="card attention-card">
          <div className="card-heading"><div><span className="section-kicker">FOCUS AREA</span><h2>Subjects requiring attention</h2></div></div>
          {attention.length ? (
            <div className="attention-list">
              {attention.map((subject) => (
              <div className="attention-row" key={subject.id}>
                <div className={`subject-avatar ${subject.name.charAt(0) === 'C' ? 'green' : ''}`}>{subject.name.slice(0, 2).toUpperCase()}</div>
                <div className="attention-info"><div><strong>{subject.name}</strong><span>{subject.progress}%</span></div><div className="progress-track"><div style={{ width: `${subject.progress}%` }} /></div></div>
              </div>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Target />} title="No focus areas yet" text="Add subjects to identify where to focus." />
          )}
        </section>

        <section className="card progress-card">
          <div className="card-heading"><div><span className="section-kicker">OVERVIEW</span><h2>Study progress</h2></div><button className="icon-button bare" aria-label="More options"><MoreHorizontal size={19} /></button></div>
          <div className="progress-overview">
            <div className="progress-ring" style={{ '--progress': `${sessions.length ? completed / sessions.length * 360 : 0}deg` }}><div><strong>{sessions.length ? Math.round(completed / sessions.length * 100) : 0}%</strong><span>complete</span></div></div>
            <div className="progress-stats"><div><span className="legend-dot purple" /><span>Completed</span><strong>{completed}</strong></div><div><span className="legend-dot pale" /><span>Remaining</span><strong>{sessions.length - completed}</strong></div></div>
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, detail, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </div>
  )
}

function CreatePlan({ subjects, exams, availability, preferences, onGenerate, onCancel }) {
  const [step, setStep] = useState(1)
  const [draftSubjects, setDraftSubjects] = useState(subjects.length ? subjects.map((item) => ({ ...item })) : [{ id: `sub-${Date.now()}`, name: '', topics: [''], difficulty: 'Medium', confidence: 'Medium', progress: 0 }])
  const [draftExams, setDraftExams] = useState(exams.length ? exams.map((item) => ({ ...item })) : [{ id: `exam-${Date.now()}`, subjectId: '', subject: '', date: '', priority: 'Medium' }])
  const [draftAvailability, setDraftAvailability] = useState({ ...availability })
  const [draftPreferences, setDraftPreferences] = useState({ ...preferences })
  const [errors, setErrors] = useState({})
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')

  const validateStep = () => {
    const nextErrors = {}
    if (step === 1) {
      const names = draftSubjects.map((subject) => subject.name.trim().toLowerCase()).filter(Boolean)
      draftSubjects.forEach((subject, index) => {
        const name = subject.name.trim()
        if (!name) {
          nextErrors[`subject-${index}`] = 'Subject name is required'
        } else if (names.filter((item) => item === name.toLowerCase()).length > 1) {
          nextErrors[`subject-${index}`] = 'Subject names must be unique'
        }
        const topics = (subject.topics || []).map((topic) => topic.trim()).filter(Boolean)
        if (!topics.length) nextErrors[`topics-${index}`] = 'Add at least one topic'
      })
    }
    if (step === 2) {
      draftExams.forEach((exam, index) => {
        const subjectExists = draftSubjects.some((subject) => subject.id === exam.subjectId && subject.name.trim())
        if (!exam.subjectId || !subjectExists) nextErrors[`exam-subject-${index}`] = 'Select a subject from the subject list'
        if (!exam.date) {
          nextErrors[`exam-date-${index}`] = 'Select an exam date'
        } else if (!isValidExamDate(exam.date)) {
          nextErrors[`exam-date-${index}`] = 'Enter a valid today-or-future exam date'
        }
      })
    }
    if (step === 3) {
      const hours = Number(draftAvailability.hours)
      if (!Number.isFinite(hours) || hours < 1 || hours > 16) {
        nextErrors.hours = 'Enter between 1 and 16 available hours'
      }
      if (timeToMinutes(draftAvailability.startTime) === null) {
        nextErrors.startTime = 'Enter a valid preferred start time'
      }
      if (![25, 50, 90].includes(Number(draftAvailability.sessionDuration))) {
        nextErrors.sessionDuration = 'Select a valid session duration'
      }
      if (!draftAvailability.unavailableDays) {
        nextErrors.unavailableDays = 'Availability is incomplete'
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const next = () => {
    if (validateStep()) setStep((current) => Math.min(4, current + 1))
  }

  const updateSubject = (index, field, value) => setDraftSubjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  const addSubject = () => setDraftSubjects((current) => [...current, { id: `sub-${Date.now()}`, name: '', topics: [''], difficulty: 'Medium', confidence: 'Medium', progress: 0 }])
  const removeSubject = (index) => setDraftSubjects((current) => current.filter((_, itemIndex) => itemIndex !== index))
  const updateExam = (index, field, value) => setDraftExams((current) => current.map((item, itemIndex) => itemIndex === index ? {
    ...item,
    [field]: value,
    ...(field === 'subjectId' ? { subject: draftSubjects.find((subject) => subject.id === value)?.name || '' } : {}),
  } : item))

  const generate = () => {
    setGenerationError('')
    if (!validateStep()) return
    setGenerating(true)
    const normalizedSubjects = draftSubjects.map((subject) => ({
      ...subject,
      name: subject.name.trim(),
      topics: [...new Set(subject.topics.map((topic) => topic.trim()).filter(Boolean))],
    }))
    const result = onGenerate({
      subjects: normalizedSubjects,
      exams: draftExams,
      availability: draftAvailability,
      preferences: draftPreferences,
    })
    setGenerating(false)
    if (!result?.ok) setGenerationError(result?.message || 'Study plan generation could not be started.')
  }

  return (
    <div className="page wizard-page">
      <PageHeading eyebrow="STUDY PLANNER" title="Create a study plan" subtitle="Tell us what you need to prepare for and we'll organize your study time." />
      <div className="wizard-layout">
        <aside className="stepper">
          {[
            ['Subjects', 'Your courses and topics'],
            ['Examinations', 'Dates and priorities'],
            ['Availability', 'When you can study'],
            ['Preferences', 'How you learn'],
          ].map(([title, subtitle], index) => (
            <button key={title} className={`step-item ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'complete' : ''}`} onClick={() => setStep(index + 1)}>
              <span className="step-number">{step > index + 1 ? <Check size={15} /> : index + 1}</span>
              <div><strong>{title}</strong><small>{subtitle}</small></div>
            </button>
          ))}
        </aside>

        <section className="wizard-content card">
          {step === 1 && (
            <div className="form-step">
              <div className="form-heading"><div><span className="section-kicker">STEP 1 OF 4</span><h2>What are you studying?</h2></div><button className="secondary-button" onClick={addSubject}><Plus size={16} /> Add subject</button></div>
              {draftSubjects.map((subject, index) => (
                <div className="subject-form" key={subject.id}>
                  <div className="subject-form-header"><strong>Subject {index + 1}</strong>{draftSubjects.length > 1 && <button className="icon-button bare" onClick={() => removeSubject(index)} aria-label="Remove subject"><Trash2 size={16} /></button>}</div>
                  <div className="form-grid">
                    <label className="field">Subject name<input value={subject.name} onChange={(event) => updateSubject(index, 'name', event.target.value)} placeholder="e.g. Calculus II" />{errors[`subject-${index}`] && <span className="field-error">{errors[`subject-${index}`]}</span>}</label>
                    <label className="field">Difficulty<select value={subject.difficulty} onChange={(event) => updateSubject(index, 'difficulty', event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
                    <label className="field">Confidence level<select value={subject.confidence} onChange={(event) => updateSubject(index, 'confidence', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
                  </div>
                  <label className="field">Topics / syllabus<textarea value={subject.topics.join(', ')} onChange={(event) => updateSubject(index, 'topics', event.target.value.split(',').map((topic) => topic.trim()))} placeholder="Integration, Series, Differential equations" />{errors[`topics-${index}`] && <span className="field-error">{errors[`topics-${index}`]}</span>}<small>Separate topics with commas</small></label>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <div className="form-heading"><div><span className="section-kicker">STEP 2 OF 4</span><h2>Add your examinations</h2></div><button className="secondary-button" onClick={() => setDraftExams((current) => [...current, { id: `exam-${Date.now()}`, subjectId: '', subject: '', date: '', priority: 'Medium' }])}><Plus size={16} /> Add exam</button></div>
              {draftExams.map((exam, index) => (
                <div className="exam-form" key={exam.id}>
                  <label className="field">Subject<select value={exam.subjectId} onChange={(event) => updateExam(index, 'subjectId', event.target.value)}><option value="">Select subject</option>{draftSubjects.filter((subject) => subject.name).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>{errors[`exam-subject-${index}`] && <span className="field-error">{errors[`exam-subject-${index}`]}</span>}</label>
                  <label className="field">Exam date<input type="date" value={exam.date} onChange={(event) => updateExam(index, 'date', event.target.value)} />{errors[`exam-date-${index}`] && <span className="field-error">{errors[`exam-date-${index}`]}</span>}</label>
                  <label className="field">Priority<select value={exam.priority} onChange={(event) => updateExam(index, 'priority', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
                  {draftExams.length > 1 && <button className="icon-button bare exam-remove" onClick={() => setDraftExams((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove exam"><Trash2 size={16} /></button>}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <div className="form-heading"><div><span className="section-kicker">STEP 3 OF 4</span><h2>When can you study?</h2></div></div>
              <div className="form-grid">
                <label className="field">Daily available hours<input type="number" min="1" max="16" value={draftAvailability.hours} onChange={(event) => setDraftAvailability((current) => ({ ...current, hours: Number(event.target.value) }))} />{errors.hours && <span className="field-error">{errors.hours}</span>}</label>
                <label className="field">Preferred start time<input type="time" value={draftAvailability.startTime} onChange={(event) => setDraftAvailability((current) => ({ ...current, startTime: event.target.value }))} />{errors.startTime && <span className="field-error">{errors.startTime}</span>}</label>
                <label className="field">Session duration<select value={draftAvailability.sessionDuration} onChange={(event) => setDraftAvailability((current) => ({ ...current, sessionDuration: Number(event.target.value) }))}><option value="25">25 minutes</option><option value="50">50 minutes</option><option value="90">90 minutes</option></select>{errors.sessionDuration && <span className="field-error">{errors.sessionDuration}</span>}</label>
                <label className="field">Break duration<select value={draftAvailability.breakDuration} onChange={(event) => setDraftAvailability((current) => ({ ...current, breakDuration: Number(event.target.value) }))}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option></select></label>
              </div>
              <label className="field">Days unavailable</label>
              <div className="day-selector">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button type="button" key={day} className={draftAvailability.unavailableDays.includes(day) ? 'selected' : ''} onClick={() => setDraftAvailability((current) => ({ ...current, unavailableDays: current.unavailableDays.includes(day) ? current.unavailableDays.filter((item) => item !== day) : [...current.unavailableDays, day] }))}>{day.slice(0, 3)}</button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step">
              <div className="form-heading"><div><span className="section-kicker">STEP 4 OF 4</span><h2>Set your preferences</h2></div></div>
              <label className="field">Revision frequency<select value={draftPreferences.revisionFrequency} onChange={(event) => setDraftPreferences((current) => ({ ...current, revisionFrequency: event.target.value }))}><option>Every day</option><option>Every 3 days</option><option>Once a week</option></select></label>
              <div className="toggle-list">
                <ToggleRow label="Prioritize difficult topics" description="Give more study time to hard subjects" checked={draftPreferences.difficultFirst} onChange={(checked) => setDraftPreferences((current) => ({ ...current, difficultFirst: checked }))} />
                <ToggleRow label="Include practice questions" description="Add focused question-solving sessions" checked={draftPreferences.practiceQuestions} onChange={(checked) => setDraftPreferences((current) => ({ ...current, practiceQuestions: checked }))} />
                <ToggleRow label="Include mock tests" description="Reserve time for timed practice tests" checked={draftPreferences.mockTests} onChange={(checked) => setDraftPreferences((current) => ({ ...current, mockTests: checked }))} />
              </div>
              {generationError && (
                <div className="generation-error" role="alert"><AlertCircle size={17} /><span>{generationError}</span></div>
              )}
              <div className="plan-summary">
                <h3>Plan summary</h3>
                <div><span><strong>{draftSubjects.length}</strong> subjects</span><span><strong>{draftExams.length}</strong> examinations</span><span><strong>{draftAvailability.hours}h</strong> daily</span></div>
                <p>{draftSubjects.map((subject) => subject.name).filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          )}

          <div className="wizard-footer">
            {step > 1 ? <button className="secondary-button" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</button> : <button className="text-button" onClick={onCancel}>Cancel</button>}
            {step < 4 ? <button className="primary-button" onClick={next}>Continue <ArrowRight size={16} /></button> : <button className="primary-button" onClick={generate} disabled={generating}>{generating ? <><RefreshCw className="spin" size={16} /> Preparing plan...</> : <><Sparkles size={16} /> Generate Study Plan</>}</button>}
          </div>
        </section>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return <div className="toggle-row"><div><strong>{label}</strong><span>{description}</span></div><button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button></div>
}

function StudyPlan({ sessions, subjects, availability, planStatus, onSessionsChange, onRegenerate }) {
  const [view, setView] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(sessions[0]?.date || '')
  const [editingSession, setEditingSession] = useState(null)
  const [editError, setEditError] = useState('')
  const dates = useMemo(() => [...new Set(sessions.map((session) => session.date))].sort(), [sessions])
  const visibleSessions = view === 'daily'
    ? sessions.filter((session) => session.date === selectedDate)
    : sessions

  useEffect(() => {
    if (dates.length && !dates.includes(selectedDate)) setSelectedDate(dates[0])
  }, [dates, selectedDate])

  const toggleCompleted = (id) => onSessionsChange(sessions.map((session) => session.id === id ? { ...session, completed: !session.completed } : session))
  const saveEdit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const subjectName = String(form.get('subject')).trim()
    const topic = String(form.get('topic')).trim()
    const startTime = String(form.get('startTime'))
    const endTime = String(form.get('endTime'))
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const subjectExists = subjects.some((subject) => subject.name.toLowerCase() === subjectName.toLowerCase())
    const sessionDate = editingSession.date
    const weekday = new Date(`${sessionDate}T00:00:00`).toLocaleDateString('en', { weekday: 'long' })

    if (!subjectExists) {
      setEditError('Select an existing subject.')
      return
    }
    if (!topic) {
      setEditError('A session topic is required.')
      return
    }
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      setEditError('Enter valid start and end times, with end time after start time.')
      return
    }
    const availabilityStart = timeToMinutes(availability.startTime)
    const dailyMinutes = Number(availability.hours) * 60
    if (startMinutes < availabilityStart || endMinutes - startMinutes > dailyMinutes) {
      setEditError('The session must remain within your preferred start time and daily availability.')
      return
    }
    if (availability.unavailableDays?.includes(weekday)) {
      setEditError(`The session is scheduled on ${weekday}, which is unavailable.`)
      return
    }
    const existingMinutes = sessions
      .filter((session) => session.id !== editingSession.id && session.date === sessionDate)
      .reduce((total, session) => {
        const sessionStart = timeToMinutes(session.startTime)
        const sessionEnd = timeToMinutes(session.endTime)
        return sessionStart === null || sessionEnd === null ? total : total + (sessionEnd - sessionStart)
      }, 0)
    if (existingMinutes + (endMinutes - startMinutes) > dailyMinutes) {
      setEditError('This session would exceed the daily study-hour limit.')
      return
    }

    setEditError('')
    onSessionsChange(sessions.map((session) => session.id === editingSession.id ? {
      ...session,
      subject: subjectName,
      topic,
      startTime,
      endTime,
      type: String(form.get('type')),
      duration: endMinutes - startMinutes,
    } : session))
    setEditingSession(null)
  }

  return (
    <div className="page plan-page">
      <PageHeading
        title="Your study plan"
        subtitle="Review, adjust, and complete your scheduled study sessions."
        actions={
          <>
            <button className="secondary-button" onClick={onRegenerate}><RefreshCw size={16} /> Regenerate</button>
            <div className="status-chip"><span className={planStatus === 'Ready' ? 'ready' : ''} />{planStatus}</div>
          </>
        }
      />
      <div className="plan-toolbar card">
        <div className="segmented-control"><button className={view === 'daily' ? 'active' : ''} onClick={() => setView('daily')}>Daily</button><button className={view === 'weekly' ? 'active' : ''} onClick={() => setView('weekly')}>Weekly</button></div>
        {view === 'daily' && <div className="date-tabs">{dates.map((date) => <button key={date} className={selectedDate === date ? 'active' : ''} onClick={() => setSelectedDate(date)}><strong>{new Date(date + 'T00:00:00').toLocaleString('en', { weekday: 'short' })}</strong><span>{new Date(date + 'T00:00:00').getDate()}</span></button>)}</div>}
      </div>

      {visibleSessions.length ? (
        <section className="sessions-card card">
          <div className="sessions-header"><div><span className="section-kicker">{view === 'daily' ? 'DAILY TIMETABLE' : 'WEEKLY TIMETABLE'}</span><h2>{view === 'daily' ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Upcoming sessions'}</h2></div></div>
          <div className="session-table">
            {visibleSessions.map((session) => (
              <div className={`session-row ${session.completed ? 'completed' : ''}`} key={session.id}>
                <button className={`completion-check ${session.completed ? 'checked' : ''}`} onClick={() => toggleCompleted(session.id)} aria-label={session.completed ? 'Mark incomplete' : 'Mark complete'}>{session.completed && <Check size={14} />}</button>
                <div className="session-time"><strong>{session.startTime}</strong><span>{session.endTime}</span></div>
                <div className="session-main"><strong>{session.subject}</strong><span>{session.topic}</span></div>
                <span className={`activity-pill ${session.type.toLowerCase().replace(' ', '-')}`}>{session.type}</span>
                <span className="duration"><Clock3 size={15} /> {session.duration} min</span>
                <button className="icon-button bare" onClick={() => setEditingSession(session)} aria-label="Edit session"><Edit3 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="card"><EmptyState icon={<CalendarDays />} title="No sessions scheduled" text="Create a study plan to add sessions to your timetable." action="Create study plan" onAction={onRegenerate} /></div>
      )}

      {editingSession && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditingSession(null)}>
          <form className="modal card" onSubmit={saveEdit}>
            <div className="modal-heading"><div><span className="section-kicker">EDIT SESSION</span><h2>Update study session</h2></div><button type="button" className="icon-button bare" onClick={() => setEditingSession(null)}><X size={18} /></button></div>
            <div className="form-grid">
              <label className="field">Subject<select name="subject" defaultValue={editingSession.subject} required><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></label>
              <label className="field">Topic<input name="topic" defaultValue={editingSession.topic} required /></label>
              <label className="field">Start time<input name="startTime" type="time" defaultValue={editingSession.startTime} required /></label>
              <label className="field">End time<input name="endTime" type="time" defaultValue={editingSession.endTime} required /></label>
              <label className="field">Activity type<select name="type" defaultValue={editingSession.type}><option>Learning</option><option>Revision</option><option>Practice</option><option>Mock Test</option></select></label>
            </div>
            {editError && <div className="generation-error" role="alert"><AlertCircle size={17} /><span>{editError}</span></div>}
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setEditingSession(null)}>Cancel</button><button type="submit" className="primary-button">Save changes</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function Subjects({ subjects, onUpdate }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [subjectError, setSubjectError] = useState('')
  const filtered = subjects.filter((subject) => subject.name.toLowerCase().includes(search.toLowerCase()))

  const save = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const topics = [...new Set(String(form.get('topics')).split(',').map((topic) => topic.trim()).filter(Boolean))]
    if (!name) {
      setSubjectError('Subject name is required.')
      return
    }
    if (!topics.length) {
      setSubjectError('Add at least one topic.')
      return
    }
    if (subjects.some((subject) => subject.id !== editing.id && subject.name.toLowerCase() === name.toLowerCase())) {
      setSubjectError('A subject with this name already exists.')
      return
    }
    setSubjectError('')
    onUpdate(editing.id && subjects.some((subject) => subject.id === editing.id) ? subjects.map((subject) => subject.id === editing.id ? {
      ...subject,
      name,
      difficulty: String(form.get('difficulty')),
      confidence: String(form.get('confidence')),
      topics,
    } : subject) : [...subjects, {
      ...editing,
      name,
      difficulty: String(form.get('difficulty')),
      confidence: String(form.get('confidence')),
      topics,
    }])
    setEditing(null)
  }

  return (
    <div className="page subjects-page">
      <PageHeading title="My subjects" subtitle="Track the subjects and topics in your study plan." actions={<button className="primary-button" onClick={() => { setSubjectError(''); setEditing({ id: `sub-${Date.now()}`, name: '', topics: [], difficulty: 'Medium', confidence: 'Medium', progress: 0 }) }}><Plus size={17} /> Add subject</button>} />
      <div className="subject-toolbar card"><div className="search-box in-card"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects..." /></div><span>{filtered.length} subjects</span></div>
      {filtered.length ? (
        <div className="subjects-grid">
          {filtered.map((subject) => (
            <article className="subject-card card" key={subject.id}>
              <div className="subject-card-top"><div className="subject-avatar">{subject.name.slice(0, 2).toUpperCase()}</div><button className="icon-button bare" onClick={() => { setSubjectError(''); setEditing(subject) }} aria-label={`Edit ${subject.name}`}><Edit3 size={16} /></button></div>
              <h2>{subject.name}</h2>
              <div className="subject-meta"><span className={`difficulty ${subject.difficulty.toLowerCase()}`}>{subject.difficulty}</span><span>{subject.confidence} confidence</span></div>
              <div className="topic-list">{subject.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}{subject.topics.length > 3 && <span>+{subject.topics.length - 3}</span>}</div>
              <div className="subject-progress"><div><span>Progress</span><strong>{subject.progress}%</strong></div><div className="progress-track"><div style={{ width: `${subject.progress}%` }} /></div></div>
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={<BookOpen />} title="No subjects found" text="Try another search or add a subject." /></div>}

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <form className="modal card" onSubmit={save}>
            <div className="modal-heading"><div><span className="section-kicker">{editing.name ? 'EDIT SUBJECT' : 'NEW SUBJECT'}</span><h2>{editing.name || 'Add a subject'}</h2></div><button type="button" className="icon-button bare" onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="form-grid">
              <label className="field">Subject name<input name="name" defaultValue={editing.name} required /></label>
              <label className="field">Difficulty<select name="difficulty" defaultValue={editing.difficulty}><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
              <label className="field">Confidence<select name="confidence" defaultValue={editing.confidence}><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="field full">Topics<textarea name="topics" defaultValue={editing.topics.join(', ')} placeholder="Separate topics with commas" /></label>
            </div>
            {subjectError && <div className="generation-error" role="alert"><AlertCircle size={17} /><span>{subjectError}</span></div>}
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="primary-button">Save subject</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

function SettingsPage({ availability, preferences, onAvailabilityChange, onPreferencesChange }) {
  const [tab, setTab] = useState('study')
  const [saved, setSaved] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')

  const save = () => {
    if (tab === 'study' && (Number(availability.hours) < 1 || Number(availability.hours) > 16 || timeToMinutes(availability.startTime) === null)) {
      setAvailabilityError('Daily hours must be between 1 and 16, and the start time must be valid.')
      setSaved(false)
      return
    }
    setAvailabilityError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="page settings-page">
      <PageHeading title="Settings" subtitle="Manage your study preferences and account." />
      <div className="settings-layout">
        <aside className="settings-nav card">
          <button className={tab === 'study' ? 'active' : ''} onClick={() => setTab('study')}><Clock3 size={17} /> Study preferences</button>
          <button className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}><User size={17} /> Account</button>
        </aside>
        <section className="settings-content card">
          {tab === 'study' ? (
            <>
              <div className="settings-heading"><h2>Study availability</h2><p>Set the default time and duration for your study sessions.</p></div>
              <div className="form-grid">
                <label className="field">Daily available hours<input type="number" min="1" max="16" value={availability.hours} onChange={(event) => onAvailabilityChange({ ...availability, hours: Number(event.target.value) })} /></label>
                <label className="field">Preferred start time<input type="time" value={availability.startTime} onChange={(event) => onAvailabilityChange({ ...availability, startTime: event.target.value })} /></label>
                <label className="field">Session duration<select value={availability.sessionDuration} onChange={(event) => onAvailabilityChange({ ...availability, sessionDuration: Number(event.target.value) })}><option value="25">25 minutes</option><option value="50">50 minutes</option><option value="90">90 minutes</option></select></label>
                <label className="field">Break duration<select value={availability.breakDuration} onChange={(event) => onAvailabilityChange({ ...availability, breakDuration: Number(event.target.value) })}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option></select></label>
              </div>
              <div className="settings-divider" />
              <div className="settings-heading"><h2>Planning preferences</h2></div>
              <label className="field">Revision frequency<select value={preferences.revisionFrequency} onChange={(event) => onPreferencesChange({ ...preferences, revisionFrequency: event.target.value })}><option>Every day</option><option>Every 3 days</option><option>Once a week</option></select></label>
              <div className="toggle-list">
                <ToggleRow label="Prioritize difficult topics" description="Give more time to challenging subjects" checked={preferences.difficultFirst} onChange={(checked) => onPreferencesChange({ ...preferences, difficultFirst: checked })} />
                <ToggleRow label="Include practice questions" description="Add problem-solving sessions" checked={preferences.practiceQuestions} onChange={(checked) => onPreferencesChange({ ...preferences, practiceQuestions: checked })} />
              </div>
              {availabilityError && <div className="generation-error" role="alert"><AlertCircle size={17} /><span>{availabilityError}</span></div>}
            </>
          ) : (
            <>
              <div className="settings-heading"><h2>Account preferences</h2><p>Update the information shown in your workspace.</p></div>
              <div className="account-row"><div className="avatar profile"><User size={20} /></div><div><strong>Student</strong><span>Local prototype</span></div><button className="secondary-button" disabled>Profile photo</button></div>
              <div className="form-grid">
                <label className="field">Display name<input defaultValue="Student" /></label>
                <label className="field">Email address<input type="email" placeholder="Not configured" /></label>
                <label className="field">University<input placeholder="Not configured" /></label>
                <label className="field">Timezone<select defaultValue="IST"><option>IST</option><option>UTC</option><option>EST</option><option>PST</option></select></label>
              </div>
            </>
          )}
          <div className="settings-footer"><span className={saved ? 'saved visible' : 'saved'}><CheckCircle2 size={16} /> Changes saved</span><button className="primary-button" onClick={save}>Save changes</button></div>
        </section>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, text, action, onAction, compact }) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3><p>{text}</p>
      {action && <button className="secondary-button" onClick={onAction}>{action}</button>}
    </div>
  )
}

export default App
