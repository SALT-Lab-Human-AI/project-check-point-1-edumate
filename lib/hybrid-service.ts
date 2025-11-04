// Hybrid service that uses real API for all operations
import * as apiService from './api-service'

// Topics by grade (keeping this as static data since it's curriculum-based)
const topicsByGrade: Record<string, string[]> = {
  "1": ["Addition", "Subtraction", "Shapes", "Counting"],
  "2": ["Addition", "Subtraction", "Multiplication Basics", "Time"],
  "3": ["Multiplication", "Division", "Fractions Intro", "Measurement"],
  "4": ["Multiplication", "Division", "Fractions", "Decimals"],
  "5": ["Fractions", "Decimals", "Geometry", "Data Analysis"],
  "6": ["Ratios", "Percentages", "Integers", "Basic Algebra"],
  "7": ["Algebra", "Geometry", "Probability", "Statistics"],
  "8": ["Algebra", "Linear Equations", "Geometry", "Functions"],
  "9": ["Algebra II", "Quadratic Equations", "Trigonometry Intro", "Statistics"],
  "10": ["Algebra II", "Trigonometry", "Geometry", "Probability"],
  "11": ["Pre-Calculus", "Trigonometry", "Functions", "Sequences"],
  "12": ["Calculus", "Advanced Algebra", "Statistics", "Discrete Math"]
}

export async function getTopics(grade: number): Promise<string[]> {
  // Topics are static data, no need for API call
  return topicsByGrade[grade.toString() as keyof typeof topicsByGrade] || []
}

export async function generateQuestion(grade: number, topic: string): Promise<string> {
  // Use the real API to generate a question - explicitly request ONLY the question, no answers or hints
  const prompt = `Generate a detailed ${topic} problem/question suitable for grade ${grade} students.

IMPORTANT INSTRUCTIONS:
- Generate ONLY the question/problem statement
- Do NOT include the answer, solution, or any hints
- Do NOT include any explanation or solution steps
- The output should be ONLY the question text that the student needs to solve
- Make the question detailed, clear, and appropriate for grade ${grade}

FORMATTING REQUIREMENTS:
- Use clear, well-structured sentences with proper punctuation
- Break long sentences into shorter, easier-to-read sentences
- Use line breaks to separate different parts of the question for better readability
- For currency amounts, use plain dollar signs (e.g., $7, $12, $1,260) NOT LaTeX formatting
- For currency, write it as "$7" not "\\$7" or in any math notation
- Only use LaTeX/math notation ($...$) for actual mathematical expressions, NOT for currency
- Use proper spacing between numbers and units
- Make the question easy to read and understand at a glance
- Structure the question with clear sections if it has multiple parts
- DO NOT use ANY markdown formatting (no **bold**, *italic*, __underline__, # headings, etc.)
- Write in plain text only - no special formatting characters
- DO NOT use asterisks (*) or underscores (_) for emphasis
- Use plain text with proper capitalization and punctuation for emphasis

EXAMPLE OF GOOD FORMATTING:
"At the annual science fair, students can purchase two types of science kits:
- Basic Kit: $7
- Advanced Kit: $12

In one day, the fair sold a total of 150 kits and collected $1,260.

How many Basic Kits and how many Advanced Kits were sold?"

Return ONLY the question with proper formatting, nothing else.`

  const response = await apiService.askQuestion(prompt, grade)
  
  // Clean up the response to remove markdown and formatting issues
  let cleanedAnswer = response.answer
    // Remove markdown bold (**text** or __text__) - must be processed first before single *
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    // Remove escaped dollar signs with plain dollar signs (for currency)
    .replace(/\\\$/g, '$')
    // Remove markdown headers (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown italic (*text* or _text_) - but preserve bullet points
    // Match *text* but not * item (bullet) - bullets have space after *
    .replace(/\*([^*\s][^*]*?[^*\s])\*/g, '$1')
    .replace(/_([^_\s][^_]*?[^_\s])_/g, '$1')
    // Remove any remaining markdown link syntax [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Clean up extra whitespace that might result from removals
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return cleanedAnswer
}

export async function solveS1(payload: { grade: number; topic: string; question: string }) {
  // Create a structured prompt for educational step-by-step solutions
  const prompt = `You are a math tutor providing a comprehensive, educational solution. 

PROBLEM: ${payload.question}

Please provide a solution in this EXACT structured format:

### Understand the Problem
[Explain what the problem is asking, what we know, and what we need to find]

### Strategy
[Explain the general approach and reasoning for solving this type of problem]

### Step-by-Step Solution
[Provide detailed steps with clear explanations for each step]

### Verify the Answer
[Show how to check that the answer is correct by substituting back]

### Alternate Methods
[Provide alternative approaches or ways to think about the problem]

IMPORTANT:
- Use clear, educational language appropriate for grade ${payload.grade}
- Focus on understanding, not just getting the answer
- Make each section comprehensive and helpful
- Use proper mathematical notation
- Do not skip any sections
- Do NOT use emojis or special characters
- Use clean, professional formatting
- Write in a clear, easy-to-understand style
- Add proper spacing between sentences and mathematical expressions
- Use line breaks to separate different steps or concepts
- Ensure mathematical expressions are properly formatted with spaces
- Use "Simplifying each side gives" not "Simplifyingeachsidegives"
- For sequences like 7→10→13→16→19→22, write them as "7 → 10 → 13 → 16 → 19 → 22" with proper spacing
- Only use LaTeX ($...$) for actual mathematical expressions, not for regular text
- Do NOT use markdown formatting like **bold** or *italic* - use plain text only
- Write titles and headings as plain text without any special formatting
- NEVER wrap regular English words like "Simplifying", "Thus", "Therefore", "So" in LaTeX delimiters ($...$)
- Only use $...$ for actual mathematical variables, equations, and formulas
- Use division symbols (÷) instead of fractions for mathematical expressions
- Write division as "a ÷ b" not "a/b" or "\\frac{a}{b}"
- Only use fractions when specifically needed for complex expressions
- NEVER generate text with spaces between individual letters (like "T h i s" or "G r a p h i c a l")
- Write all text as normal words with proper spacing
- Do NOT break up words character by character
- Ensure all text flows naturally and is readable`

  const response = await apiService.askQuestion(prompt, payload.grade)
  
  return {
    solution: response.answer,
    steps: [], // The API returns a complete structured solution
    hints: []
  }
}

export async function submitS2(payload: {
  question: string
  solution: string
  mode: "hints" | "direct"
  allowDirect: boolean
}) {
  if (payload.mode === "direct" && !payload.allowDirect) {
    throw new Error("Direct answer mode is disabled by parent controls")
  }

  // Create a structured prompt for better feedback
  const prompt = `You are a math tutor providing feedback on a student's solution. 

QUESTION: ${payload.question}

STUDENT'S SOLUTION: ${payload.solution}

Please provide feedback in this EXACT format (no emojis, no answers revealed):

### Problem Analysis

| Step | Student Work | Correct Work | Status | Explanation |
|------|--------------|--------------|--------|-------------|
| 1 | [student's step 1] | [what it should be] | Correct/Incorrect | [brief explanation] |
| 2 | [student's step 2] | [what it should be] | Correct/Incorrect | [brief explanation] |
| 3 | [student's step 3] | [what it should be] | Correct/Incorrect | [brief explanation] |

### Hints for Improvement
1. [Specific hint without revealing answer]
2. [Another specific hint]
3. [General improvement tip]

### Final Answer
[Only show if mode is "direct", otherwise show "Answer will be provided after you try again"]

IMPORTANT: 
- Do NOT include emojis or special characters
- Do NOT reveal the final answer in hints mode
- Focus on which specific steps are wrong
- Provide actionable hints, not solutions
- Use clear, simple language`

  const response = await apiService.askQuestion(prompt, 5)
  
  return {
    feedback: response.answer,
    score: 85, // This could be calculated by the AI
    suggestions: [],
    isCorrect: false, // This could be determined by the AI
    encouragement: "Keep practicing!",
    finalAnswer: payload.mode === "direct" ? "Answer will be provided by AI" : undefined,
    errors: []
  }
}

export async function generateQuiz(payload: {
  grade: number
  topic: string
  count: number
  difficulty: "easy" | "medium" | "hard"
}) {
  // Use the real API to generate quiz
  const response = await apiService.generateQuiz(payload)
  
  // Transform API response to match expected format
  return {
    id: `quiz-${Date.now()}`,
    title: `${payload.topic} Quiz`,
    questions: response.items.map((item, index) => ({
      id: item.id,
      question: item.question_md,
      options: [
        { id: 'A', text: item.choices.A },
        { id: 'B', text: item.choices.B },
        { id: 'C', text: item.choices.C },
        { id: 'D', text: item.choices.D },
      ],
      correctAnswer: item.correct,
      explanation: item.explanation_md,
      skillTag: item.skill_tag,
    })),
    meta: response.meta
  }
}

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
}) {
  return apiService.gradeQuiz(payload)
}

export async function submitQuizAttempt(attempt: {
  quizId: string
  answers: Record<number, string>
}) {
  // For real API, we need the original quiz items to grade
  // This is a simplified version - in a real app, you'd store the quiz items
  const answers = Object.entries(attempt.answers).map(([qIndex, answer]) => ({
    id: `q${qIndex}`,
    selected: answer
  }))
  
  // This is a placeholder - you'd need to store the original quiz items
  const mockItems = [
    {
      id: 'q0',
      question_md: 'Sample question',
      choices: { A: 'A', B: 'B', C: 'C', D: 'D' },
      correct: 'A',
      explanation_md: 'Sample explanation',
      skill_tag: 'sample'
    }
  ]
  
  const response = await apiService.gradeQuiz({
    items: mockItems,
    answers: answers
  })
  
  return {
    score: response.score,
    total: response.total,
    percentage: Math.round((response.score / response.total) * 100),
    results: response.results
  }
}

// Health check for the API
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiService.healthCheck()
    return response.status === 'API is running'
  } catch {
    return false
  }
}
