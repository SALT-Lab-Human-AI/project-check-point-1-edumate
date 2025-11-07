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

// Helper function to count steps in student's solution
function countStepsInSolution(solution: string): number {
  // Normalize the solution: replace tabs with spaces, handle various whitespace
  const normalized = solution.replace(/\t/g, ' ').replace(/\s+/g, ' ')
  
  // Count steps by looking for numbered steps at the start of lines (1., 2., 3., etc.)
  // This pattern matches: number followed by period or parenthesis, then space or tab
  // Handle both "1. " and "1.\t" patterns
  const numberedListAtStart = normalized.match(/^\s*\d+[\.\)][\s\t]/gm) || []
  
  // Also look for numbered steps anywhere (1., 2., 3., etc.)
  // Match number followed by period/parenthesis and whitespace
  const numberedSteps = normalized.match(/\b\d+[\.\)][\s\t]/g) || []
  
  // Look for patterns like "Step 1:", "Step 2:", etc.
  const stepKeywords = normalized.match(/Step\s+\d+/gi) || []
  
  // More aggressive: look for any line starting with a number followed by period/parenthesis
  const strictNumbered = normalized.split('\n').filter(line => {
    const trimmed = line.trim()
    return /^\d+[\.\)][\s\t]/.test(trimmed)
  })
  
  // Get the maximum count from different patterns
  const counts = [
    numberedListAtStart.length,
    strictNumbered.length,
    numberedSteps.length,
    stepKeywords.length
  ]
  
  // If we found numbered steps, use the maximum
  const maxCount = Math.max(...counts)
  if (maxCount > 0) {
    return maxCount
  }
  
  // If no clear step markers, try to count by line breaks and content
  // Split by common separators and count meaningful sections
  const lines = solution.split(/\n+/).filter(line => {
    const trimmed = line.trim()
    return trimmed.length > 10 && !trimmed.match(/^(###|##|#|\*|-)/) // Exclude markdown headers
  })
  
  return Math.max(1, lines.length)
}

// Helper function to count steps in AI feedback
function countStepsInFeedback(feedback: string): number {
  // Look for table rows in the Problem Analysis section
  const problemAnalysisMatch = feedback.match(/###\s*Problem\s*Analysis\s*([\s\S]*?)(?=###|$)/i)
  if (problemAnalysisMatch) {
    const analysisSection = problemAnalysisMatch[1]
    
    // Count table rows that start with | and have a number in the first column
    // Match pattern: | number | (with optional whitespace)
    // Exclude header rows (which contain "Step" or "------")
    const tableRows = analysisSection.split('\n').filter(line => {
      const trimmed = line.trim()
      // Match lines that start with | followed by a number
      const match = trimmed.match(/^\|\s*(\d+)\s*\|/)
      if (match) {
        const num = parseInt(match[1], 10)
        // Valid step number (1-99)
        return num > 0 && num < 100
      }
      return false
    })
    
    if (tableRows.length > 0) {
      // Get all step numbers and return the maximum (to handle any gaps)
      const stepNumbers = tableRows.map(line => {
        const match = line.trim().match(/^\|\s*(\d+)\s*\|/)
        return match ? parseInt(match[1], 10) : 0
      }).filter(n => n > 0)
      
      if (stepNumbers.length > 0) {
        return Math.max(...stepNumbers)
      }
      return tableRows.length
    }
  }
  
  // Fallback: look for any table rows with step numbers in the entire feedback
  const allTableRows = feedback.split('\n').filter(line => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) return false
    const match = trimmed.match(/^\|\s*(\d+)\s*\|/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > 0 && num < 100
    }
    return false
  })
  
  if (allTableRows.length > 0) {
    const stepNumbers = allTableRows.map(line => {
      const match = line.trim().match(/^\|\s*(\d+)\s*\|/)
      return match ? parseInt(match[1], 10) : 0
    }).filter(n => n > 0)
    
    if (stepNumbers.length > 0) {
      return Math.max(...stepNumbers)
    }
    return allTableRows.length
  }
  
  // Last fallback: count numbered steps in the feedback text
  const numberedSteps = feedback.match(/\b\d+[\.\)]\s/g) || []
  return Math.max(1, numberedSteps.length)
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

  // Count steps in student's solution
  const studentStepCount = countStepsInSolution(payload.solution)
  
  // Parse the solution to extract individual steps for better prompting
  const solutionLines = payload.solution.split('\n').filter(line => line.trim().length > 0)
  const extractedSteps: string[] = []
  
  solutionLines.forEach(line => {
    const trimmed = line.trim()
    // Check if line starts with a number followed by period/parenthesis
    const stepMatch = trimmed.match(/^(\d+)[\.\)][\s\t]*(.+)$/)
    if (stepMatch) {
      extractedSteps.push(stepMatch[2].trim())
    }
  })
  
  // If we extracted steps, use them; otherwise use the full solution
  const hasExtractedSteps = extractedSteps.length > 0
  const actualStepCount = hasExtractedSteps ? extractedSteps.length : studentStepCount
  
  // Create a structured prompt for better feedback
  const modeInstruction = payload.mode === "direct" 
    ? "MODE: DIRECT - You MUST provide the correct final answer in the Final Answer section."
    : "MODE: HINTS - Do NOT reveal the final answer. Only provide hints."
  
  // Build the table rows explicitly for all steps
  // In hint mode, don't include "Correct Work" column
  const tableHeader = payload.mode === "hints"
    ? "| Step | Student Work | Status | Explanation |"
    : "| Step | Student Work | Correct Work | Status | Explanation |"
  
  const tableSeparator = payload.mode === "hints"
    ? "|------|--------------|--------|-------------|"
    : "|------|--------------|--------------|--------|-------------|"
  
  const tableRows = Array.from({ length: actualStepCount }, (_, i) => {
    const stepNum = i + 1
    const stepContent = hasExtractedSteps && extractedSteps[i] 
      ? extractedSteps[i].substring(0, 100) // Limit length for prompt
      : `[student's step ${stepNum}]`
    
    if (payload.mode === "hints") {
      // In hint mode, don't include correct work - just provide hints
      return `| ${stepNum} | ${stepContent} | Correct/Incorrect | [brief explanation WITHOUT revealing the correct answer] |`
    } else {
      // In direct mode, include correct work
      return `| ${stepNum} | ${stepContent} | [what it should be] | Correct/Incorrect | [brief explanation] |`
    }
  }).join('\n')
  
  let prompt = `You are a math tutor providing feedback on a student's solution. 

QUESTION: ${payload.question}

STUDENT'S SOLUTION:
${payload.solution}

${modeInstruction}

CRITICAL REQUIREMENT: The student's solution has EXACTLY ${actualStepCount} step(s). 
You MUST provide feedback for ALL ${actualStepCount} step(s). 
DO NOT skip any steps. DO NOT combine steps. 
Each step must have its own row in the Problem Analysis table.

MATHEMATICAL ACCURACY CHECKING - CRITICAL:
- You MUST verify ALL numerical calculations in each step
- Check if arithmetic operations are performed correctly (addition, subtraction, multiplication, division)
- A step is INCORRECT if:
  * The mathematical calculation is wrong (e.g., 700 - 600 = 200 is WRONG, should be 100)
  * The approach/method is correct but the arithmetic is incorrect
  * The result doesn't match the correct numerical answer
- If a step has a calculation error, mark it as INCORRECT even if the method/approach is correct
- Check for cascading errors: if an earlier step has a wrong value, later steps using that value will also be wrong
- Example: If step 5 calculates 2A = 200 (but should be 100), then step 6 using A = 100 (from 200÷2) is also wrong because it's based on the incorrect value from step 5
- You must identify BOTH the calculation error AND any subsequent steps affected by that error

${payload.mode === "hints" 
  ? "CRITICAL: In HINTS mode, you MUST NOT reveal the correct answer. Do NOT include a 'Correct Work' column. Only provide hints and explanations that guide the student without giving away the answer. However, you MUST still mark steps as INCORRECT if the math is wrong."
  : "In DIRECT mode, you should include the correct work for each step."}

Please provide feedback in this EXACT format (no emojis):

### Problem Analysis

${tableHeader}
${tableSeparator}
${tableRows}

### Hints for Improvement
1. [Specific hint without revealing answer]
2. [Another specific hint]
3. [General improvement tip]

### Final Answer
${payload.mode === "direct" 
  ? "[Provide the correct final answer here. Be clear and specific.]" 
  : "Answer will be provided after you try again"}

IMPORTANT: 
- Do NOT include emojis or special characters
${payload.mode === "hints" 
  ? "- Do NOT reveal the final answer in hints mode\n- Do NOT include a 'Correct Work' column in the table\n- Do NOT show the correct answer for any step\n- Only provide hints and guidance without revealing solutions\n- If a step is incorrect, explain what's wrong but DO NOT show what the correct answer should be" 
  : "- You MUST provide the correct final answer in direct mode\n- Include the 'Correct Work' column showing what each step should be"}
- You MUST analyze ALL ${actualStepCount} step(s) - this is REQUIRED, not optional
- The Problem Analysis table MUST have exactly ${actualStepCount} rows (one for each step)
- DO NOT combine multiple steps into one row
- DO NOT skip any steps
- CRITICAL: Check mathematical accuracy - verify all calculations are numerically correct
- Mark steps as INCORRECT if the arithmetic is wrong, even if the method is correct
- Identify cascading errors: if step N has a wrong value, mark step N+1 as incorrect if it uses that wrong value
- Focus on which specific steps are wrong and WHY (calculation error, wrong value used, etc.)
${payload.mode === "hints" 
  ? "- Provide actionable hints, not solutions - guide the student without revealing answers\n- If a calculation is wrong, hint at checking the arithmetic (e.g., 'Check your subtraction here' or 'Verify this calculation')" 
  : "- Provide clear explanations and show correct work"}
- Use clear, simple language`

  let response = await apiService.askQuestion(prompt, 5)
  
  // Feedback loop for hint mode: ensure AI analyzes all steps
  if (payload.mode === "hints") {
    let feedbackStepCount = countStepsInFeedback(response.answer)
    let retryCount = 0
    const maxRetries = 5 // Increased retries
    
    while (feedbackStepCount < actualStepCount && retryCount < maxRetries) {
      retryCount++
      
      // Build explicit table with all steps (no Correct Work in hint mode)
      const retryTableHeader = "| Step | Student Work | Status | Explanation |"
      const retryTableSeparator = "|------|--------------|--------|-------------|"
      const retryTableRows = Array.from({ length: actualStepCount }, (_, i) => {
        const stepNum = i + 1
        const stepContent = hasExtractedSteps && extractedSteps[i] 
          ? extractedSteps[i].substring(0, 100)
          : `[student's step ${stepNum}]`
        // In hint mode, don't include correct work
        return `| ${stepNum} | ${stepContent} | Correct/Incorrect | [brief explanation WITHOUT revealing the correct answer] |`
      }).join('\n')
      
      // Create a more explicit prompt asking for all steps
      const retryPrompt = `You are a math tutor providing feedback on a student's solution. 

QUESTION: ${payload.question}

STUDENT'S SOLUTION:
${payload.solution}

MODE: HINTS - Do NOT reveal the final answer. Only provide hints.

CRITICAL ERROR: The student's solution has EXACTLY ${actualStepCount} step(s), but your previous feedback only analyzed ${feedbackStepCount} step(s). 
This is INCORRECT. You MUST analyze ALL ${actualStepCount} step(s). Missing steps is NOT acceptable.

CRITICAL: In HINTS mode, you MUST NOT reveal correct answers. Do NOT include a 'Correct Work' column. Do NOT show what the correct answer should be.

MATHEMATICAL ACCURACY CHECKING - CRITICAL:
- You MUST verify ALL numerical calculations in each step
- Check if arithmetic operations are performed correctly
- A step is INCORRECT if the mathematical calculation is wrong, even if the method is correct
- Example: If a student writes "700 - 600 = 200", this is WRONG (should be 100) and must be marked as INCORRECT
- Check for cascading errors: if step N has a wrong value, step N+1 using that value is also wrong
- Mark ALL steps with calculation errors as INCORRECT, not just the approach

The student's solution has these ${actualStepCount} steps:
${hasExtractedSteps ? extractedSteps.map((step, idx) => `${idx + 1}. ${step.substring(0, 150)}`).join('\n') : 'See the full solution above.'}

You MUST provide feedback for EACH of these ${actualStepCount} steps in the Problem Analysis table.

Please provide feedback in this EXACT format (no emojis):

### Problem Analysis

${retryTableHeader}
${retryTableSeparator}
${retryTableRows}

### Hints for Improvement
1. [Specific hint without revealing answer]
2. [Another specific hint]
3. [General improvement tip]

### Final Answer
Answer will be provided after you try again

CRITICAL REQUIREMENTS: 
- Do NOT include emojis or special characters
- Do NOT reveal the final answer in hints mode
- Do NOT include a 'Correct Work' column in the table
- Do NOT show the correct answer for any step - only provide hints
- If a step is incorrect, explain what's wrong but DO NOT show what the correct answer should be
- The Problem Analysis table MUST have exactly ${actualStepCount} rows
- You analyzed ${feedbackStepCount} steps before - this was WRONG
- You MUST analyze ALL ${actualStepCount} steps now - no exceptions
- DO NOT combine steps
- DO NOT skip steps
- Each numbered step from the student's solution MUST have its own row
- CRITICAL: Check mathematical accuracy - verify all calculations are numerically correct
- Mark steps as INCORRECT if the arithmetic is wrong (e.g., 700-600=200 is WRONG, should be 100)
- Identify cascading errors: if step N has wrong value, mark step N+1 as incorrect if it uses that value
- Focus on which specific steps are wrong and WHY (calculation error, wrong value, etc.)
- Provide actionable hints, not solutions - guide without revealing answers
- If a calculation is wrong, hint at checking the arithmetic (e.g., "Check your subtraction" or "Verify this calculation")
- Use clear, simple language`

      response = await apiService.askQuestion(retryPrompt, 5)
      feedbackStepCount = countStepsInFeedback(response.answer)
      
      // Log for debugging (can be removed in production)
      console.log(`[S2 Feedback Loop] Attempt ${retryCount}: Expected ${actualStepCount} steps, got ${feedbackStepCount} steps`)
    }
    
    // Final check: if still not matching, log a warning
    if (feedbackStepCount < actualStepCount) {
      console.warn(`[S2 Feedback Loop] WARNING: After ${retryCount} retries, still only got ${feedbackStepCount} steps instead of ${actualStepCount}`)
    }
  }
  
  // Extract final answer from response if in direct mode
  let finalAnswer: string | undefined = undefined
  if (payload.mode === "direct") {
    // Look for "### Final Answer" section in the response
    const finalAnswerMatch = response.answer.match(/###\s*Final\s*Answer\s*\n([\s\S]*?)(?=\n###|$)/i)
    if (finalAnswerMatch && finalAnswerMatch[1]) {
      finalAnswer = finalAnswerMatch[1].trim()
      // If the answer contains placeholder text, ask AI specifically for the answer
      if (finalAnswer.includes("Answer will be provided after you try again") || 
          finalAnswer.includes("[Provide the correct final answer") ||
          finalAnswer.length < 3) {
        const answerPrompt = `Given this math problem: ${payload.question}\n\nWhat is the correct final answer? Provide ONLY the answer, no explanation, no additional text.`
        const answerResponse = await apiService.askQuestion(answerPrompt, 5)
        finalAnswer = answerResponse.answer.trim()
      }
    } else {
      // If Final Answer section not found, ask AI specifically for the answer
      const answerPrompt = `Given this math problem: ${payload.question}\n\nWhat is the correct final answer? Provide ONLY the answer, no explanation, no additional text.`
      const answerResponse = await apiService.askQuestion(answerPrompt, 5)
      finalAnswer = answerResponse.answer.trim()
    }
  }
  
  return {
    feedback: response.answer,
    score: 85, // This could be calculated by the AI
    suggestions: [],
    isCorrect: false, // This could be determined by the AI
    encouragement: "Keep practicing!",
    finalAnswer: finalAnswer,
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
