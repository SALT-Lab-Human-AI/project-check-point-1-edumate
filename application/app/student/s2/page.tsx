"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, XCircle, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { submitS2, getTopics, generateQuestion } from "@/lib/hybrid-service"
import { MathRenderer } from "@/components/math-renderer"
import { FeedbackDisplay } from "@/components/feedback-display"
import { useTimeTracking } from "@/lib/use-time-tracking"

interface FeedbackData {
  feedback: string
  score: number
  suggestions: string[]
  isCorrect?: boolean
  encouragement?: string
  finalAnswer?: string
  errors?: Array<{
    snippet: string
    issue: string
    hint: string
    severity: "success" | "error" | "warning"
  }>
}

export default function S2Page() {
  const [showFeedback, setShowFeedback] = useState(false)
  const [mode, setMode] = useState<"hints" | "direct">("hints")
  const [grade, setGrade] = useState(8)
  const [topic, setTopic] = useState("")
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  const [question, setQuestion] = useState("Solve for x: 3x + 7 = 22")
  const [solution, setSolution] = useState("Step 1: 3x + 7 = 22\nStep 2: 3x = 22 - 7\nStep 3: 3x = 16\nStep 4: x = 16/3")
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track time spent on this page
  useTimeTracking('s2')

  // Load topics based on grade level
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topics = await getTopics(grade)
        setAvailableTopics(topics)
        if (topics.length > 0 && (!topic || !topics.includes(topic))) {
          setTopic(topics[0])
        }
      } catch (err) {
        console.error("Failed to load topics:", err)
      }
    }
    
    loadTopics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade])

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
      setSolution("") // Clear solution when generating new question
      setFeedbackData(null)
      setShowFeedback(false)
    } catch (err) {
      console.error("Failed to generate question:", err)
      setError("Failed to generate question. Please try again.")
    } finally {
      setIsGeneratingQuestion(false)
    }
  }

  const handleSubmitSolution = async () => {
    if (!question.trim() || !solution.trim()) {
      setError("Please enter both a question and solution")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const feedback = await submitS2({
        question: question.trim(),
        solution: solution.trim(),
        mode,
        allowDirect: true // You can make this configurable
      })
      
      setFeedbackData(feedback)
      setShowFeedback(true)
    } catch (err) {
      console.error("Failed to get feedback:", err)
      setError("Failed to get feedback. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setShowFeedback(false)
    setFeedbackData(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">AI-Powered Solution Feedback</h1>
          <p className="text-text/60">Get instant feedback on your work with detailed error analysis</p>
        </div>

        {!showFeedback ? (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Input Section */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-bold text-navy">Question</Label>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                
                {/* Grade and Topic Selection - Merged into Question card */}
                <div className="space-y-4 mb-4">
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
                      <SelectTrigger id="topic" className="mt-2">
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
                </div>
                
                <Textarea 
                  placeholder="Type or upload your math problem..." 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={8} 
                />
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-bold text-navy">Your Solution</Label>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                <Textarea 
                  placeholder="Type or upload your solution..." 
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={8} 
                />
              </Card>
            </div>

            {/* Mode Selection */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-bold text-navy mb-4">Feedback Mode</h2>
              <RadioGroup value={mode} onValueChange={(value: "hints" | "direct") => setMode(value)}>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hints" id="hints" />
                    <Label htmlFor="hints" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Hints Mode</div>
                        <div className="text-sm text-text/60">Get helpful hints without revealing the answer</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="direct" />
                    <Label htmlFor="direct" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Direct Mode</div>
                        <div className="text-sm text-text/60">Get complete feedback with correct answers</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button 
                onClick={handleSubmitSolution}
                disabled={isLoading || !question.trim() || !solution.trim()}
                size="lg"
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Solution...
                  </>
                ) : (
                  "Get Feedback"
                )}
              </Button>
            </div>
          </>
        ) : (
          /* Feedback Display */
          <Card className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-navy">Feedback Results</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>
                  New Analysis
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {feedbackData && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                    <span className="text-2xl font-bold text-primary">{feedbackData.score}%</span>
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">
                    {feedbackData.isCorrect ? "Excellent Work!" : "Good Effort!"}
                  </h3>
                  <p className="text-text/60">{feedbackData.encouragement || feedbackData.feedback}</p>
                </div>

                {/* Detailed Feedback */}
                <FeedbackDisplay feedback={feedbackData.feedback} mode={mode} />

                {/* Error Analysis */}
                {feedbackData.errors && feedbackData.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-4">Error Analysis</h3>
                    <div className="space-y-3">
                      {feedbackData.errors.map((error, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            error.severity === "success"
                              ? "border-leaf bg-leaf/5"
                              : error.severity === "warning"
                              ? "border-yellow bg-yellow/5"
                              : "border-red bg-red/5"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {error.severity === "success" ? (
                              <CheckCircle2 className="w-5 h-5 text-leaf flex-shrink-0 mt-1" />
                            ) : error.severity === "warning" ? (
                              <AlertTriangle className="w-5 h-5 text-yellow flex-shrink-0 mt-1" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red flex-shrink-0 mt-1" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-navy mb-1">{error.issue}</div>
                              <div className="text-sm text-text/60 mb-2">
                                <span className="font-medium">Code:</span> {error.snippet}
                              </div>
                              <div className="text-sm text-text/80">{error.hint}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {feedbackData.suggestions && feedbackData.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-4">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {feedbackData.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span className="text-text/80">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}