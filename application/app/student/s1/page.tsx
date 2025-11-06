"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getTopics, generateQuestion, solveS1 } from "@/lib/hybrid-service"
import { StructuredSolutionDisplay } from "@/components/structured-solution-display"

interface SolutionPhase {
  title: string
  content: string
}

interface SolutionData {
  solution: string
  steps: SolutionPhase[]
  hints: string[]
}

export default function S1Page() {
  const [grade, setGrade] = useState(8)
  const [topic, setTopic] = useState("")
  const [question, setQuestion] = useState("")
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [solutionData, setSolutionData] = useState<SolutionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load topics based on grade level
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topics = await getTopics(grade)
        setAvailableTopics(topics)
        if (topics.length > 0 && !topic) {
          setTopic(topics[0])
        }
      } catch (err) {
        console.error("Failed to load topics:", err)
        setError("Failed to load topics. Please try again.")
      }
    }
    
    loadTopics()
  }, [grade, topic])

  const handleGenerateQuestion = async () => {
    if (!topic) {
      setError("Please select a topic")
      return
    }

    setIsGeneratingQuestion(true)
    setError(null)
    
    try {
      const generatedQuestion = await generateQuestion(grade, topic)
      setQuestion(generatedQuestion)
      setSolutionData(null)
    } catch (err) {
      console.error("Failed to generate question:", err)
      setError("Failed to generate question. Please try again.")
    } finally {
      setIsGeneratingQuestion(false)
    }
  }

  const handleSolveProblem = async () => {
    if (!question.trim()) {
      setError("Please enter a question")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const solution = await solveS1({
        grade,
        topic: topic || "General Math",
        question: question.trim()
      })
      
      // Parse the solution into phases if it's structured
      const phases: SolutionPhase[] = []
      const hints: string[] = solution.hints || []
      
      // If solution has steps, use them; otherwise create phases from the solution text
      if (solution.steps && solution.steps.length > 0) {
        phases.push(...solution.steps)
      } else {
        // Parse the solution text into logical phases
        const solutionText = solution.solution || ""
        const lines = solutionText.split('\n').filter(line => line.trim())
        
        let currentPhase = ""
        let currentContent = ""
        
        for (const line of lines) {
          if (line.match(/^(Step \d+|Phase \d+|Part \d+)/i) || line.match(/^(Understand|Strategy|Solution|Verify)/i)) {
            if (currentPhase && currentContent) {
              phases.push({
                title: currentPhase,
                content: currentContent.trim()
              })
            }
            currentPhase = line.replace(/^(Step \d+|Phase \d+|Part \d+)[:\s]*/i, '').trim()
            currentContent = ""
          } else {
            currentContent += line + '\n'
          }
        }
        
        if (currentPhase && currentContent) {
          phases.push({
            title: currentPhase,
            content: currentContent.trim()
          })
        }
        
        // If no phases were created, create a default one
        if (phases.length === 0) {
          phases.push({
            title: "Solution",
            content: solutionText
          })
        }
      }
      
      setSolutionData({
        solution: solution.solution || "",
        steps: phases,
        hints
      })
    } catch (err) {
      console.error("Failed to solve problem:", err)
      setError("Failed to solve problem. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Structured Problem-Solving Practice</h1>
          <p className="text-text/60">Master concepts with step-by-step guided solutions powered by AI</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-navy mb-4">Configuration</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Grade Level: {grade}</Label>
                <Slider
                  value={[grade]}
                  onValueChange={([v]) => setGrade(v)}
                  min={1}
                  max={12}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="topic">Topic</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTopics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  placeholder="Enter your math problem here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleGenerateQuestion}
                disabled={isGeneratingQuestion || !topic}
              >
                {isGeneratingQuestion ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Question"
                )}
              </Button>

              <Button 
                className="w-full"
                onClick={handleSolveProblem}
                disabled={isLoading || !question.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Solving...
                  </>
                ) : (
                  "Get Solution"
                )}
              </Button>
            </div>
          </Card>

          {/* Solution Display */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {solutionData ? (
                <StructuredSolutionDisplay solution={solutionData.solution} />
              ) : (
                <div className="text-center py-12 text-text/60">
                  <p>Enter a question and click "Get Solution" to see the step-by-step solution.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}