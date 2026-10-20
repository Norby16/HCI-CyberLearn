"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Module {
  id: string
  title: string
  order_index: number
}

interface Progress {
  module_id: string
  is_completed: number
}

interface QuizAttempt {
  id: string
  quiz_id: string
  score: number
  total_questions: number
  created_at: string
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [completedModules, setCompletedModules] = useState<Progress[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is logged in
        const stored = localStorage.getItem("auth_user")
        if (!stored) {
          router.push("/auth/login")
          return
        }

        const user = JSON.parse(stored)
        setUserId(user.id)
        setUserName(user.email)

        // Fetch all modules
        const modulesRes = await fetch("/api/modules")
        const modulesData = await modulesRes.json()
        setModules(modulesData || [])

        // Fetch user's progress
        const progressRes = await fetch(`/api/progress?userId=${user.id}`)
        const progressData = await progressRes.json()
        setCompletedModules(progressData || [])

        // Fetch quiz attempts
        const attemptsRes = await fetch(`/api/quiz-attempts?userId=${user.id}`)
        const attemptsData = await attemptsRes.json()
        setQuizAttempts(attemptsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  const completedCount = completedModules.filter((p) => p.is_completed).length
  const completionPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0
  const averageQuizScore =
    quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / quizAttempts.length)
      : 0

  return (
    <main className="min-h-screen bg-background">
      <Header user={userId ? { id: userId } : null} />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Dashboard Saya</h1>
          <p className="text-gray-600">{userName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Modul Selesai</h3>
            <p className="text-4xl font-bold text-blue-600">
              {completedCount}/{modules.length}
            </p>
            <p className="text-gray-600 text-sm mt-2">{completionPercentage}% Selesai</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Kuis Dikerjakan</h3>
            <p className="text-4xl font-bold text-green-600">{quizAttempts.length}</p>
            <p className="text-gray-600 text-sm mt-2">Rata-rata: {averageQuizScore}%</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">Tingkat Keberhasilan</h3>
            <p className="text-4xl font-bold text-purple-600">{averageQuizScore}%</p>
            <p className="text-gray-600 text-sm mt-2">Dari semua kuis</p>
          </Card>
        </div>

        {/* Completed Modules */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Modul yang Selesai</h2>
          {completedCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedModules
                .filter((p) => p.is_completed)
                .map((progress) => {
                  const module = modules.find((m) => m.id === progress.module_id)
                  return module ? (
                    <Card key={module.id} className="p-4 border-2 border-green-200">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900">{module.title}</h3>
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Modul {module.order_index}</p>
                      <Link href={`/modules/${module.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">Lihat Ulang</Button>
                      </Link>
                    </Card>
                  ) : null
                })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">Anda belum menyelesaikan modul apapun.</p>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Mulai Belajar</Button>
              </Link>
            </Card>
          )}
        </section>

        {/* Recent Quiz Attempts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Hasil Kuis Terbaru</h2>
          {quizAttempts.length > 0 ? (
            <div className="space-y-4">
              {quizAttempts.slice(0, 5).map((attempt, idx) => {
                const score = Math.round((attempt.score / attempt.total_questions) * 100)
                return (
                  <Card key={attempt.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Kuis</p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${score >= 70 ? "text-green-600" : "text-red-600"}`}>
                          {score}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {attempt.score}/{attempt.total_questions} benar
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">Anda belum mengerjakan kuis apapun.</p>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Mulai Belajar</Button>
              </Link>
            </Card>
          )}
        </section>
      </div>
    </main>
  )
}
