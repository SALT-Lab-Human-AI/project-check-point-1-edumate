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
