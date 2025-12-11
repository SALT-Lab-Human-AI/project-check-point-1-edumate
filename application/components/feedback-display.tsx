"use client"

import { CheckCircle2, XCircle, Lightbulb, AlertTriangle } from "lucide-react"
import { MathRenderer } from "@/components/math-renderer"
import { Card } from "@/components/ui/card"

interface ParsedFeedback {
  title: string
  status: "correct" | "incorrect" | "partial"
  statusMessage: string
  finalAnswer?: string
  problems: Array<{
    title: string
    steps: Array<{
      step: string
      studentWork: string
      correctWork: string
      explanation: string
      status: "correct" | "incorrect" | "warning"
    }>
    hints: string[]
  }>
  generalTips: string[]
}

function parseFeedbackMarkdown(feedback: string, mode: "hints" | "direct" = "hints"): ParsedFeedback {
  const lines = feedback.split('\n')
  
  const result: ParsedFeedback = {
    title: "AI-Powered Solution Feedback",
    status: "incorrect",
    statusMessage: "Let's review your work step by step",
    problems: [],
    generalTips: []
  }

  let currentProblem: any = null
  let inTable = false
  let tableRows: string[][] = []
  let currentSection = ""
  let finalAnswer = ""
  let hasCorrectWorkColumn = true // Default to true, will be detected from table header
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (!line) continue
    
    // Check for problem analysis section
    if (line.includes('### Problem Analysis') || line.includes('Problem Analysis')) {
      currentSection = "analysis"
      if (!currentProblem) {
        currentProblem = {
          title: "Solution Review",
          steps: [],
          hints: []
        }
      }
      continue
    }
    
    // Check for hints section
    if (line.includes('### Hints for Improvement') || line.includes('Hints for Improvement')) {
      currentSection = "hints"
      continue
    }
    
    // Check for final answer section
    if (line.includes('### Final Answer') || line.includes('Final Answer')) {
      currentSection = "final"
      continue
    }
    
    // Process final answer
    if (currentSection === "final" && line && !line.startsWith('#')) {
      finalAnswer = line
      continue
    }
    
    // Check for step headers (| Step | Student Work | ...)
    if (line.startsWith('| Step |')) {
      inTable = true
      tableRows = []
      // Detect if table has "Correct Work" column
      hasCorrectWorkColumn = line.includes('Correct Work')
      continue
    }
    
    // Process table rows
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c)
      // Skip separator rows (rows with only dashes)
      if (cells.every(cell => cell.match(/^-+$/))) {
        continue
      }
      
      // In hint mode, table should have 4 columns (Step, Student Work, Status, Explanation)
      // In direct mode, table should have 5 columns (Step, Student Work, Correct Work, Status, Explanation)
      const minCells = mode === "hints" ? 4 : 5
      if (cells.length >= minCells) {
        tableRows.push(cells)
      }
      continue
    }
    
    // End of table
    if (inTable && !line.startsWith('|')) {
      inTable = false
      
      // Process the table data
      if (currentProblem && tableRows.length > 0) {
        tableRows.forEach((row, index) => {
          // In hint mode: Step, Student Work, Status, Explanation (4 columns)
          // In direct mode: Step, Student Work, Correct Work, Status, Explanation (5 columns)
          let step, studentWork, correctWork, status, explanation
          
          if (mode === "hints" || !hasCorrectWorkColumn) {
            // Table without Correct Work column
            step = row[0] || `Step ${index + 1}`
            studentWork = row[1] || ""
            status = row[2] || "Correct"
            explanation = row[3] || ""
            correctWork = "" // No correct work in hint mode
          } else {
            // Table with Correct Work column
            step = row[0] || `Step ${index + 1}`
            studentWork = row[1] || ""
            correctWork = row[2] || ""
            status = row[3] || "Correct"
            explanation = row[4] || ""
          }
          
          // Skip steps with empty or dash-only content
          if (!studentWork || studentWork.match(/^-+$/) || studentWork.trim() === "") {
            return
          }
          
          let stepStatus: "correct" | "incorrect" | "warning" = "correct"
          if (status.toLowerCase().includes('incorrect') || status.toLowerCase().includes('wrong')) {
            stepStatus = "incorrect"
          } else if (status.toLowerCase().includes('warning') || status.toLowerCase().includes('check')) {
            stepStatus = "warning"
          }
          
          currentProblem.steps.push({
            step,
            studentWork,
            correctWork: mode === "hints" ? "" : correctWork, // Don't store correct work in hint mode
            explanation,
            status: stepStatus
          })
        })
      }
      continue
    }
    
    // Process hints
    if (currentSection === "hints" && currentProblem) {
      if (line.match(/^\d+\./) || line.startsWith('*') || line.startsWith('-')) {
        const hintText = line.replace(/^\d+\.\s*/, '').replace(/^[\*\-\s]+/, '').trim()
        if (hintText) {
          currentProblem.hints.push(hintText)
        }
      }
    }
  }
  
  // Add the problem if we have one
  if (currentProblem) {
    result.problems.push(currentProblem)
  }
  
  // If no problems were parsed, create a simple problem from the feedback
  if (result.problems.length === 0) {
    result.problems.push({
      title: "Solution Review",
      steps: [{
        step: "Your Solution",
        studentWork: "See detailed feedback below",
        correctWork: "See detailed feedback below",
        explanation: feedback,
        status: "warning" as const
      }],
      hints: []
    })
  }
  
  // Determine overall status
  const hasErrors = result.problems.some(p => p.steps.some(s => s.status === "incorrect"))
  const hasWarnings = result.problems.some(p => p.steps.some(s => s.status === "warning"))
  
  if (!hasErrors && !hasWarnings) {
    result.status = "correct"
    result.statusMessage = "Excellent work! Your solution is correct."
  } else if (hasErrors) {
    result.status = "incorrect"
    result.statusMessage = "You're on the right track, but there are some errors to fix."
  } else {
    result.status = "partial"
    result.statusMessage = "Good work! Just a few minor issues to address."
  }
  
  return result
}

interface FeedbackDisplayProps {
  feedback: string
  mode?: "hints" | "direct"
}

export function FeedbackDisplay({ feedback, mode = "hints" }: FeedbackDisplayProps) {
  const parsed = parseFeedbackMarkdown(feedback, mode)
  
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-6 rounded-lg border-2 ${
        parsed.status === "correct" 
          ? "bg-green-50 border-green-200" 
          : parsed.status === "partial"
          ? "bg-yellow-50 border-yellow-200"
          : "bg-yellow-50 border-yellow-200"
      }`}>
        <div className="flex items-center gap-4">
          {parsed.status === "correct" ? (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-yellow-600" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${
              parsed.status === "correct" ? "text-green-800" : "text-yellow-800"
            }`}>
              {parsed.status === "correct" ? "Perfect!" : 
               parsed.status === "partial" ? "Almost There!" : "Not Quite Right"}
            </h3>
            <p className="text-gray-700 text-lg">{parsed.statusMessage}</p>
          </div>
        </div>
      </div>

      {/* Problems */}
      {parsed.problems.map((problem, problemIndex) => (
        <Card key={problemIndex} className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Error Analysis</h3>
          
          {/* Steps */}
          <div className="space-y-4">
            {problem.steps.map((step, stepIndex) => (
              <div key={stepIndex} className={`p-4 rounded-lg ${
                step.status === "correct" 
                  ? "bg-green-50 border border-green-200" 
                  : step.status === "warning"
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    step.status === "correct" 
                      ? "bg-green-500" 
                      : step.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}>
                    {step.status === "correct" ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <XCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-3">{step.step}</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Your answer: </span>
                        <span className={`font-semibold ${
                          step.status === "correct" ? "text-green-700" : "text-red-700"
                        }`}>
                          <MathRenderer>{step.studentWork}</MathRenderer>
                        </span>
                      </div>
                      
                      {/* Only show correct work in direct mode, and only if it's different from student work */}
                      {mode === "direct" && step.studentWork !== step.correctWork && step.correctWork && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Correct: </span>
                          <span className="font-semibold text-green-700">
                            <MathRenderer>{step.correctWork}</MathRenderer>
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded border">
                        <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          <MathRenderer>{step.explanation}</MathRenderer>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Hints for this problem */}
          {problem.hints.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Hints for Improvement</h4>
              <ul className="space-y-2">
                {problem.hints.map((hint, hintIndex) => (
                  <li key={hintIndex} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <MathRenderer>{hint}</MathRenderer>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}

      {/* General Tips */}
      {parsed.generalTips.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">General Tips for Success</h3>
          <ul className="space-y-2">
            {parsed.generalTips.map((tip, tipIndex) => (
              <li key={tipIndex} className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <MathRenderer>{tip}</MathRenderer>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
