// API service for connecting to the Python FastAPI backend
import { trackMemoryFeature } from './memory-tracker'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Add timeout for quiz generation (90 seconds) and other long operations
  const timeout = (endpoint === '/quiz/generate' || endpoint === '/ask') ? 90000 : 30000
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check for error in response body (backend returns 200 with error field)
    if (data.error && (!data.items || data.items.length === 0)) {
      throw new Error(data.error)
    }
    
    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    // Handle timeout
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the server is taking too long to respond. Please try again.')
    }
    
    // Handle TypeError: Failed to fetch (network errors, CORS, 502, etc.)
    // This is the most common error when backend crashes or is unavailable
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message?.includes('Failed to fetch'))) {
      throw new Error('Server error (502 Bad Gateway): The backend server may be restarting, crashed, or unavailable. The CORS error you see is because the server crashed before sending a response. Please check Render logs and try again in a moment.')
    }
    
    // Handle network errors (CORS, connection refused, 502 Bad Gateway, etc.)
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the server. This could be due to CORS issues, server being down, or network problems. Please check if the backend is running and try again.')
    }
    
    // Handle CORS errors specifically
    if (error.message && error.message.includes('CORS')) {
      throw new Error('CORS error: The server is not allowing requests from this origin. Please check backend CORS configuration.')
    }
    
    // Handle 502 Bad Gateway
    if (error.message && (error.message.includes('502') || error.message.includes('Bad Gateway'))) {
      throw new Error('Server error (502 Bad Gateway): The backend server may be restarting or unavailable. Please try again in a moment.')
    }
    
    // If error already has a message, use it
    if (error instanceof Error && error.message) {
      throw error
    }
    
    // Fallback - ensure we always throw an Error object
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred'
    throw new Error(errorMessage)
  }
}

// Ask a question to the AI tutor
export async function askQuestion(question: string, grade: number): Promise<{ answer: string }> {
  return trackMemoryFeature('api/ask', async () => {
    await delay(300) // Simulate network delay
    return apiCall<{ answer: string }>('/ask', {
      method: 'POST',
      body: JSON.stringify({ question, grade }),
    })
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
  return trackMemoryFeature('api/quiz-generate', async () => {
    console.log('[FRONTEND] Starting quiz generation:', payload)
    
    try {
      const difficultyMap = {
        easy: "easy",
        medium: "medium", 
        hard: "hard"
      }

      const result = await apiCall('/quiz/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: payload.topic,
          grade: payload.grade,
          num_questions: payload.count,
          difficulty: difficultyMap[payload.difficulty],
        }),
      })
      
      console.log('[FRONTEND] Quiz generation result:', result)
      
      // Check if we got items
      if (!result.items || result.items.length === 0) {
        const errorMsg = result.error || 'No quiz items were generated. Please try again.'
        console.error('[FRONTEND] No quiz items generated:', errorMsg)
        throw new Error(errorMsg)
      }
      
      return result
    } catch (error: any) {
      console.error('[FRONTEND] Quiz generation error:', error)
      console.error('[FRONTEND] Error type:', typeof error)
      console.error('[FRONTEND] Error name:', error?.name)
      console.error('[FRONTEND] Error message:', error?.message)
      console.error('[FRONTEND] Error toString:', error?.toString())
      
      // Ensure we always throw an Error object with a message
      if (error instanceof Error) {
        throw error
      } else if (error?.message) {
        throw new Error(error.message)
      } else {
        throw new Error(error?.toString() || 'Failed to generate quiz. Please try again.')
      }
    }
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
  return trackMemoryFeature('api/quiz-grade', async () => {
    await delay(400) // Simulate network delay
    
    return apiCall('/quiz/grade', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
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
