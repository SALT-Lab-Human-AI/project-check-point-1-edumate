// API service for connecting to the Python FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Ask a question to the AI tutor
export async function askQuestion(question: string, grade: number): Promise<{ answer: string }> {
  await delay(300) // Simulate network delay
  return apiCall<{ answer: string }>('/ask', {
    method: 'POST',
    body: JSON.stringify({ question, grade }),
  })
}

// Generate quiz questions
export async function generateQuiz(payload: {
  grade: number
  topic: string
  count: number
  difficulty: "easy" | "medium" | "hard"
}): Promise<{
  items: Array<{
    id: string
    question_md: string
    choices: { A: string; B: string; C: string; D: string }
    correct: string
    explanation_md: string
    skill_tag: string
  }>
  meta: {
    topic: string
    grade: number
    difficulty: string
  }
}> {
  await delay(500) // Simulate network delay
  
  const difficultyMap = {
    easy: "easy",
    medium: "medium", 
    hard: "hard"
  }

  return apiCall('/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({
      topic: payload.topic,
      grade: payload.grade,
      num_questions: payload.count,
      difficulty: difficultyMap[payload.difficulty],
    }),
  })
}

// Grade quiz answers
export async function gradeQuiz(payload: {
  items: Array<{
    id: string
    question_md: string
    choices: { A: string; B: string; C: string; D: string }
    correct: string
    explanation_md: string
    skill_tag: string
  }>
  answers: Array<{
    id: string
    selected: string
  }>
}): Promise<{
  score: number
  total: number
  results: Array<{
    id: string
    is_correct: boolean
    selected: string
    correct: string
    explanation_md: string
  }>
}> {
  await delay(400) // Simulate network delay
  
  return apiCall('/quiz/grade', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Health check
export async function healthCheck(): Promise<{ status: string }> {
  return apiCall('/')
}

// Authentication
export async function signup(payload: {
  email: string
  password: string
  name: string
  role: "student" | "parent"
  grade?: number
  parent_email?: string
}): Promise<{ success: boolean; user?: any; error?: string }> {
  return apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(payload: {
  email: string
  password: string
  role: "student" | "parent"
}): Promise<{ success: boolean; user?: any; error?: string }> {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function linkAccount(payload: {
  parent_id: string
  student_email: string
}): Promise<{ success: boolean; message?: string; error?: string }> {
  return apiCall('/auth/link-account', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getLinkedStudents(parentId: string): Promise<{
  success: boolean
  students?: Array<{ id: string; email: string; name: string; grade: number }>
  error?: string
}> {
  return apiCall(`/auth/students/${parentId}`)
}

// Quiz tracking
export async function trackQuiz(payload: {
  student_id: string
  topic: string
  grade: number
  difficulty: string
  total_questions: number
  correct_answers: number
  score_percentage: number
  quiz_items: any[]
  answers: any[]
}): Promise<{ success: boolean; attempt_id?: string; error?: string }> {
  return apiCall('/quiz/track', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Statistics
export async function getStudentStats(studentId: string): Promise<{
  success: boolean
  stats?: {
    total_quizzes: number
    avg_score: number
    total_correct: number
    total_questions: number
    accuracy: number
    s1_sessions: number
    s2_sessions: number
    today_total_time_seconds: number
    today_quiz_count: number
    recent_quizzes: any[]
    recent_activities: any[]
  }
  error?: string
}> {
  return apiCall(`/stats/student/${studentId}`)
}

// Record time spent in a module
export async function recordTimeSpent(payload: {
  student_id: string
  module: 's1' | 's2' | 's3'
  time_spent_seconds: number
  update_total_only?: boolean
  is_session?: boolean
  session_started_at?: string
  session_ended_at?: string
}): Promise<{ success: boolean; error?: string }> {
  return apiCall('/time/track', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Daily goals
export async function getDailyGoals(studentId: string): Promise<{
  success: boolean
  goals?: {
    target_time_seconds: number
    target_quizzes: number
  }
  error?: string
}> {
  return apiCall(`/goals/student/${studentId}`)
}

export async function setDailyGoals(studentId: string, payload: {
  target_time_seconds: number
  target_quizzes: number
}): Promise<{
  success: boolean
  goals?: {
    target_time_seconds: number
    target_quizzes: number
  }
  error?: string
}> {
  return apiCall(`/goals/student/${studentId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Parent setting goals for linked student
export async function setStudentGoalsByParent(parentId: string, studentId: string, payload: {
  target_time_seconds: number
  target_quizzes: number
}): Promise<{
  success: boolean
  goals?: {
    target_time_seconds: number
    target_quizzes: number
  }
  error?: string
}> {
  return apiCall(`/goals/parent/${parentId}/student/${studentId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Update student grade by parent
export async function updateStudentGradeByParent(parentId: string, studentId: string, grade: number): Promise<{
  success: boolean
  student?: {
    id: string
    email: string
    name: string
    grade: number
  }
  error?: string
}> {
  return apiCall(`/students/parent/${parentId}/student/${studentId}/grade`, {
    method: 'POST',
    body: JSON.stringify({ grade }),
  })
}

// Get daily goal completion for a month
export async function getDailyGoalsCompletion(studentId: string, year: number, month: number): Promise<{
  success: boolean
  completion_data?: Record<string, {
    goal_met: boolean
    target_time_seconds: number
    target_quizzes: number
    actual_time_seconds: number
    actual_quizzes: number
  }>
  year?: number
  month?: number
  error?: string
}> {
  return apiCall(`/goals/student/${studentId}/month/${year}/${month}`)
}
