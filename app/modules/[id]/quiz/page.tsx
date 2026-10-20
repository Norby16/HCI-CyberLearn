"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface QuizOption {
  id: string
  option_text: string
  is_correct: number
  order_index: number
}

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  points: number
  order_index: number
  quiz_options: QuizOption[]
}

interface Quiz {
  id: string
  title: string
  description: string
  passing_score: number
}

export default function QuizPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const moduleId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from localStorage
        const stored = localStorage.getItem("auth_user")
        if (!stored) {
          router.push("/auth/login")
          return
        }
        const user = JSON.parse(stored)
        setUserId(user.id)

        // Fetch quiz for module
        const quizRes = await fetch(`/api/quizzes?moduleId=${moduleId}`)
        const quizzes = await quizRes.json()

        if (quizzes && quizzes.length > 0) {
          const quiz = quizzes[0]
          setQuiz(quiz)

          // Fetch questions
          const questionsRes = await fetch(`/api/questions?quizId=${quiz.id}`)
          const questionsData = await questionsRes.json()
          if (questionsData) {
            setQuestions(questionsData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [moduleId])

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    })
  }

  const handleSubmit = async () => {
    if (!quiz || !userId) return

    setIsSubmitting(true)
    try {
      // Calculate score
      let correctCount = 0
      questions.forEach((q) => {
        const selectedOptionId = answers[q.id]
        const selectedOption = q.quiz_options.find((opt) => opt.id === selectedOptionId)
        if (selectedOption && selectedOption.is_correct) {
          correctCount++
        }
      })

      const finalScore = Math.round((correctCount / questions.length) * 100)
      setScore(finalScore)

      // Save attempt
      await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          quizId: quiz.id,
          score: finalScore,
          totalQuestions: questions.length,
          answers,
        }),
      })

      setShowResults(true)
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </main>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Quiz not found</p>
        </div>
      </main>
    )
  }

  if (showResults) {
    const isPassed = score >= quiz.passing_score
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Hasil Kuis</h1>
            <div className={`text-6xl font-bold mb-4 ${isPassed ? "text-green-600" : "text-red-600"}`}>{score}%</div>
            <p className="text-xl text-gray-600 mb-8">
              Anda menjawab dengan benar {Math.round((score / 100) * questions.length)} dari {questions.length}{" "}
              pertanyaan
            </p>
            <p className={`text-lg font-semibold mb-8 ${isPassed ? "text-green-600" : "text-red-600"}`}>
              {isPassed
                ? "✓ Selamat! Anda lulus kuis ini."
                : "✗ Nilai Anda belum mencapai skor minimum " + quiz.passing_score + "%"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href={`/modules/${moduleId}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Kembali ke Modul</Button>
              </Link>
              <Button
                onClick={() => {
                  setCurrentQuestion(0)
                  setAnswers({})
                  setShowResults(false)
                }}
                variant="outline"
              >
                Coba Lagi
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const question = questions[currentQuestion]
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100)

  return (
    <main className="min-h-screen bg-background">
      <Header user={userId ? { id: userId } : null} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                Pertanyaan {currentQuestion + 1} dari {questions.length}
              </h2>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-6">{question.question_text}</h3>

          <div className="space-y-3 mb-8">
            {question.quiz_options.map((option) => (
              <label
                key={option.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  answers[question.id] === option.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => handleAnswer(question.id, option.id)}
                  className="w-4 h-4"
                />
                <span className="ml-3">{option.option_text}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              Sebelumnya
            </Button>
            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Selanjutnya
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length < questions.length}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? "Mengirim..." : "Selesaikan Kuis"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
