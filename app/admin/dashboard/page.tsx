"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  email: string
  is_admin: boolean
}

interface Module {
  id: string
  title: string
  description: string
  order_index: number
}

interface Video {
  id: string
  module_id: string
  title: string
  video_url: string
  duration_minutes: number
}

interface Quiz {
  id: string
  module_id: string
  title: string
  description: string
  total_questions: number
  passing_score: number
}

interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: string
  points: number
  quiz_options?: any[]
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [activeTab, setActiveTab] = useState("modules")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const [moduleForm, setModuleForm] = useState({ title: "", description: "" })
  const [videoForm, setVideoForm] = useState({ title: "", video_url: "", duration_minutes: 10 })
  const [quizForm, setQuizForm] = useState({ title: "", description: "", passing_score: 70 })
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    options: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  })
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const stored = localStorage.getItem("auth_user")
        if (!stored) {
          router.push("/admin/login")
          return
        }

        const authUser = JSON.parse(stored) as User
        if (!authUser.is_admin) {
          router.push("/admin/login")
          return
        }

        setUser(authUser)
        await fetchModules()
      } catch (error) {
        console.error("Error checking admin:", error)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [])

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/modules")
      const data = await response.json()
      setModules(data)
      if (data.length > 0 && !selectedModule) {
        setSelectedModule(data[0].id)
        await fetchModuleContent(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching modules:", error)
    }
  }

  const fetchModuleContent = async (moduleId: string) => {
    try {
      const videosRes = await fetch(`/api/videos?moduleId=${moduleId}`)
      const videosData = await videosRes.json()
      setVideos(videosData)

      const quizzesRes = await fetch(`/api/quizzes?moduleId=${moduleId}`)
      const quizzesData = await quizzesRes.json()
      setQuizzes(quizzesData)
    } catch (error) {
      console.error("Error fetching module content:", error)
    }
  }

  const handleSelectModule = async (moduleId: string) => {
    setSelectedModule(moduleId)
    await fetchModuleContent(moduleId)
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleForm),
      })

      if (!response.ok) throw new Error("Failed to create module")

      setModuleForm({ title: "", description: "" })
      setShowModuleForm(false)
      await fetchModules()
    } catch (error) {
      console.error("Error adding module:", error)
      alert("Failed to add module")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModule,
          ...videoForm,
        }),
      })

      if (!response.ok) throw new Error("Failed to create video")

      setVideoForm({ title: "", video_url: "", duration_minutes: 10 })
      setShowVideoForm(false)
      await fetchModuleContent(selectedModule)
    } catch (error) {
      console.error("Error adding video:", error)
      alert("Failed to add video")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModule,
          ...quizForm,
        }),
      })

      if (!response.ok) throw new Error("Failed to create quiz")

      setQuizForm({ title: "", description: "", passing_score: 70 })
      setShowQuizForm(false)
      await fetchModuleContent(selectedModule)
    } catch (error) {
      console.error("Error adding quiz:", error)
      alert("Failed to add quiz")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectQuiz = async (quizId: string) => {
    setSelectedQuiz(quizId)

    try {
      const response = await fetch(`/api/questions?quizId=${quizId}`)
      const data = await response.json()
      setQuizQuestions(data)
    } catch (error) {
      console.error("Error fetching quiz questions:", error)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuiz) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: selectedQuiz,
          questionText: questionForm.question_text,
          questionType: questionForm.question_type,
          points: questionForm.points,
          options: questionForm.options,
        }),
      })

      if (!response.ok) throw new Error("Failed to create question")

      setQuestionForm({
        question_text: "",
        question_type: "multiple_choice",
        points: 1,
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      })
      setShowQuestionForm(false)
      await handleSelectQuiz(selectedQuiz)
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Failed to add question")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_user")
    window.location.href = "/"
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user?.is_admin) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Kelola modul, video, dan kuis pembelajaran</p>
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
            Admin Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">Modul</TabsTrigger>
            <TabsTrigger value="videos">Video</TabsTrigger>
            <TabsTrigger value="quizzes">Kuis</TabsTrigger>
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Semua Modul</h2>
              <Button
                onClick={() => setShowModuleForm(!showModuleForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showModuleForm ? "Batal" : "Tambah Modul"}
              </Button>
            </div>

            {showModuleForm && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Tambah Modul Baru</h3>
                <form onSubmit={handleAddModule} className="space-y-4">
                  <div>
                    <Label htmlFor="module-title">Judul Modul</Label>
                    <Input
                      id="module-title"
                      required
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="e.g., Network Security Basics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-desc">Deskripsi</Label>
                    <textarea
                      id="module-desc"
                      required
                      rows={3}
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Deskripsi modul..."
                    />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                    {isSaving ? "Menyimpan..." : "Simpan Modul"}
                  </Button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`p-6 cursor-pointer transition ${
                    selectedModule === module.id ? "border-2 border-blue-600 bg-blue-50" : "hover:shadow-lg"
                  }`}
                  onClick={() => handleSelectModule(module.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{module.title}</h3>
                      <p className="text-gray-600">{module.description}</p>
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {module.order_index}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                Video - {selectedModule ? modules.find((m) => m.id === selectedModule)?.title : "Pilih Modul"}
              </h2>
              <Button
                onClick={() => setShowVideoForm(!showVideoForm)}
                disabled={!selectedModule}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {showVideoForm ? "Batal" : "Tambah Video"}
              </Button>
            </div>

            {showVideoForm && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Tambah Video Baru</h3>
                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div>
                    <Label htmlFor="video-title">Judul Video</Label>
                    <Input
                      id="video-title"
                      required
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="e.g., Introduction to Network Security"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-url">URL Video (YouTube)</Label>
                    <Input
                      id="video-url"
                      required
                      type="url"
                      value={videoForm.video_url}
                      onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-duration">Durasi (menit)</Label>
                    <Input
                      id="video-duration"
                      type="number"
                      value={videoForm.duration_minutes}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, duration_minutes: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                    {isSaving ? "Menyimpan..." : "Simpan Video"}
                  </Button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
              {videos.map((video) => (
                <Card key={video.id} className="p-6">
                  <h3 className="text-lg font-bold">{video.title}</h3>
                  <p className="text-gray-600 text-sm">{video.duration_minutes} menit</p>
                  <p className="text-gray-600 text-sm mt-2 break-all">{video.video_url}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quiz List */}
              <div className="lg:col-span-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Kuis</h3>
                  <Button
                    onClick={() => setShowQuizForm(!showQuizForm)}
                    disabled={!selectedModule}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                  >
                    +
                  </Button>
                </div>

                {showQuizForm && (
                  <Card className="p-4 mb-4">
                    <form onSubmit={handleAddQuiz} className="space-y-3">
                      <div>
                        <Label htmlFor="quiz-title" className="text-sm">
                          Judul Kuis
                        </Label>
                        <Input
                          id="quiz-title"
                          required
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                          className="text-sm"
                          placeholder="e.g., Network Security Quiz"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiz-desc" className="text-sm">
                          Deskripsi
                        </Label>
                        <textarea
                          id="quiz-desc"
                          rows={2}
                          value={quizForm.description}
                          onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Deskripsi kuis"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiz-passing" className="text-sm">
                          Skor Lulus (%)
                        </Label>
                        <Input
                          id="quiz-passing"
                          type="number"
                          value={quizForm.passing_score}
                          onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number.parseInt(e.target.value) })}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? "..." : "Simpan"}
                      </Button>
                    </form>
                  </Card>
                )}

                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className={`p-3 cursor-pointer transition ${
                        selectedQuiz === quiz.id ? "border-2 border-blue-600 bg-blue-50" : "hover:shadow-md"
                      }`}
                      onClick={() => handleSelectQuiz(quiz.id)}
                    >
                      <h4 className="font-semibold text-sm">{quiz.title}</h4>
                      <p className="text-xs text-gray-600">{quiz.total_questions} soal</p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="lg:col-span-2">
                {selectedQuiz ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">Soal - {quizzes.find((q) => q.id === selectedQuiz)?.title}</h3>
                      <Button
                        onClick={() => setShowQuestionForm(!showQuestionForm)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {showQuestionForm ? "Batal" : "Tambah Soal"}
                      </Button>
                    </div>

                    {showQuestionForm && (
                      <Card className="p-6 bg-blue-50">
                        <h4 className="text-lg font-bold mb-4">Tambah Soal Baru</h4>
                        <form onSubmit={handleAddQuestion} className="space-y-4">
                          <div>
                            <Label htmlFor="question-type">Tipe Pertanyaan</Label>
                            <select
                              id="question-type"
                              value={questionForm.question_type}
                              onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="multiple_choice">Pilihan Ganda</option>
                              <option value="true_false">Benar/Salah</option>
                              <option value="short_answer">Jawaban Singkat</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="question-text">Pertanyaan</Label>
                            <textarea
                              id="question-text"
                              required
                              rows={3}
                              value={questionForm.question_text}
                              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <Label htmlFor="question-points">Poin</Label>
                            <Input
                              id="question-points"
                              type="number"
                              value={questionForm.points}
                              onChange={(e) =>
                                setQuestionForm({ ...questionForm, points: Number.parseInt(e.target.value) })
                              }
                            />
                          </div>

                          {questionForm.question_type === "multiple_choice" && (
                            <div>
                              <Label>Opsi Jawaban</Label>
                              <div className="space-y-3 mt-2">
                                {questionForm.options.map((option, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={option.is_correct}
                                      onChange={(e) => {
                                        const newOptions = [...questionForm.options]
                                        newOptions[idx].is_correct = e.target.checked
                                        setQuestionForm({ ...questionForm, options: newOptions })
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <Input
                                      value={option.text}
                                      onChange={(e) => {
                                        const newOptions = [...questionForm.options]
                                        newOptions[idx].text = e.target.value
                                        setQuestionForm({ ...questionForm, options: newOptions })
                                      }}
                                      placeholder={`Opsi ${idx + 1}`}
                                      className="flex-1"
                                    />
                                  </div>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="mt-2 w-full bg-transparent"
                                onClick={() =>
                                  setQuestionForm({
                                    ...questionForm,
                                    options: [...questionForm.options, { text: "", is_correct: false }],
                                  })
                                }
                              >
                                Tambah Opsi
                              </Button>
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSaving}
                          >
                            {isSaving ? "Menyimpan..." : "Simpan Soal"}
                          </Button>
                        </form>
                      </Card>
                    )}

                    <div className="space-y-4">
                      {quizQuestions.length === 0 ? (
                        <p className="text-gray-500 italic">Belum ada soal di kuis ini</p>
                      ) : (
                        quizQuestions.map((question, idx) => (
                          <Card key={question.id} className="p-4">
                            <div className="flex gap-3">
                              <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{question.question_text}</p>
                                <p className="text-sm text-gray-600">
                                  Tipe: {question.question_type} | Poin: {question.points}
                                </p>
                                {question.quiz_options && question.quiz_options.length > 0 && (
                                  <div className="mt-2 ml-4 space-y-1">
                                    {question.quiz_options.map((option: any) => (
                                      <p key={option.id} className="text-sm">
                                        {option.is_correct ? "✓" : "○"} {option.option_text}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Pilih kuis untuk menambah soal</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
