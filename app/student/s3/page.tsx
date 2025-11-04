"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { getTopics, generateQuiz, gradeQuiz } from "@/lib/hybrid-service"
import { MathRenderer } from "@/components/math-renderer"

interface QuizQuestion {
  id: string
  question: string
  options: Array<{ id: string; text: string }>
  correctAnswer: string
  explanation: string
  skillTag: string
}

interface QuizData {
  id: string
  title: string
  questions: QuizQuestion[]
  meta: {
    topic: string
    grade: number
    difficulty: string
  }
}

interface QuizResults {
  score: number
  total: number
  percentage: number
  results: Array<{
    id: string
    is_correct: boolean
    selected: string
    correct: string
    explanation_md: string
  }>
}

export default function S3Page() {
  const [grade, setGrade] = useState(8)
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [availableTopics, setAvailableTopics] = useState<string[]>([])
  
  const [view, setView] = useState<"config" | "quiz" | "results">("config")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleGenerateQuiz = async () => {
    if (!topic) {
      setError("Please select a topic")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const quiz = await generateQuiz({
        grade,
        topic,
        count: questionCount,
        difficulty
      })
      
      setQuizData(quiz)
      setSelectedAnswers({})
      setCurrentQuestion(0)
      setView("quiz")
    } catch (err) {
      console.error("Failed to generate quiz:", err)
      setError("Failed to generate quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!quizData) return

    setIsLoading(true)
    
    try {
      // Convert selected answers to the format expected by the API
      const answers = Object.entries(selectedAnswers).map(([qIndex, answer]) => ({
        id: quizData.questions[Number(qIndex)].id,
        selected: answer
      }))

      // Convert quiz data to API format
      const items = quizData.questions.map(q => ({
        id: q.id,
        question_md: q.question,
        choices: {
          A: q.options[0].text,
          B: q.options[1].text,
          C: q.options[2].text,
          D: q.options[3].text,
        },
        correct: q.correctAnswer,
        explanation_md: q.explanation,
        skill_tag: q.skillTag
      }))

      const results = await gradeQuiz({ items, answers })
      setQuizResults(results)
      setView("results")
    } catch (err) {
      console.error("Failed to grade quiz:", err)
      setError("Failed to grade quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }))
  }

  // Update selectedAnswer when currentQuestion changes
  useEffect(() => {
    setSelectedAnswer(selectedAnswers[currentQuestion] || "")
  }, [currentQuestion, selectedAnswers])

  if (view === "results" && quizResults && quizData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />

        <main className="max-w-[1440px] mx-auto px-6 py-8">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                <span className="text-4xl font-bold text-primary">{quizResults.percentage}%</span>
              </div>
              <h1 className="text-3xl font-bold text-navy mb-2">Quiz Complete!</h1>
              <p className="text-text/60">
                You got {quizResults.score} out of {quizResults.total} questions correct
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {quizData.questions.map((q, i) => {
                const result = quizResults.results.find(r => r.id === q.id)
                const isCorrect = result?.is_correct || false
                const userAnswer = result?.selected || ""
                const correctAnswer = result?.correct || ""
                
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? "border-leaf bg-leaf/5" : "border-yellow bg-yellow/5"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-leaf flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-navy mb-2">Question {i + 1}</div>
                        <div className="text-sm mb-2">
                          <MathRenderer>{q.question}</MathRenderer>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Your answer: </span>
                          <span className={isCorrect ? "text-leaf" : "text-yellow"}>{userAnswer}</span>
                          {!isCorrect && (
                            <span className="ml-2">
                              <span className="font-medium">Correct: </span>
                              <span className="text-leaf">{correctAnswer}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text/60 mt-2 bg-white p-2 rounded">
                          <MathRenderer>{result?.explanation_md || q.explanation}</MathRenderer>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => setView("config")}>Create New Quiz</Button>
              <Button variant="outline" onClick={() => setView("quiz")}>
                Review Questions
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  if (view === "quiz" && quizData) {
    const currentQ = quizData.questions[currentQuestion]
    const selectedAnswer = selectedAnswers[currentQuestion] || ""

    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />

        <main className="max-w-[1440px] mx-auto px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-navy mb-2">Mathematical Quiz Generation</h1>
            <p className="text-text/60">Practice with adaptive quizzes tailored to your level</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <Card className="p-6 lg:sticky lg:top-24 h-fit">
              <h2 className="text-lg font-bold text-navy mb-4">Progress</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-text/60 mb-2 block">Questions</Label>
                  <div className="flex gap-1 flex-wrap">
                    {quizData.questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                          i === currentQuestion
                            ? "bg-primary text-white"
                            : selectedAnswers[i] 
                              ? "bg-leaf text-white"
                              : "bg-gray-line text-text/60 hover:bg-gray-line/80"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setView("config")} variant="outline" className="w-full">
                  New Quiz
                </Button>
              </div>
            </Card>

            {/* Quiz Content */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-text/60">
                      Question {currentQuestion + 1} of {quizData.questions.length}
                    </span>
                  </div>

                  <div className="h-1 bg-gray-line rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-lg font-medium text-navy mb-4">
                    <MathRenderer>{currentQ.question}</MathRenderer>
                  </div>

                  <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                    <div className="space-y-3">
                      {currentQ.options.map((option) => {
                        const isSelected = selectedAnswer === option.id

                        return (
                          <div
                            key={option.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : "border-gray-line hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                              <span className="font-semibold mr-2">{option.id}.</span>
                              <MathRenderer>{option.text}</MathRenderer>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {currentQuestion < quizData.questions.length - 1 ? (
                    <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitQuiz} 
                      className="bg-leaf hover:bg-leaf/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Grading...
                        </>
                      ) : (
                        "Submit Quiz"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy mb-2">Mathematical Quiz Generation</h1>
          <p className="text-text/60">Practice with adaptive quizzes tailored to your level</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-navy mb-6 text-center">Configure Your Quiz</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
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
                <Label htmlFor="count">Question Count</Label>
                <Input 
                  id="count" 
                  type="number" 
                  min={3} 
                  max={15} 
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="mt-1" 
                />
              </div>

              <div>
                <Label>Difficulty</Label>
                <div className="flex gap-2 mt-2">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <Button 
                      key={d} 
                      variant={d === difficulty ? "default" : "outline"} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setDifficulty(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerateQuiz} 
                className="w-full" 
                size="lg"
                disabled={isLoading || !topic}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}