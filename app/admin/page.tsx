"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  order_index: number
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
  order_index: number
  quiz_options?: QuizOption[]
}

interface QuizOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  order_index: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [activeTab, setActiveTab] = useState("modules")
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order_index: 1 })
  const [videoForm, setVideoForm] = useState({ title: "", video_url: "", duration_minutes: 0, order_index: 1 })
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
    const checkAdminAndFetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        console.log("[v0] User:", user)

        if (!user) {
          console.log("[v0] No user found, redirecting to login")
          router.push("/auth/login")
          return
        }

        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        console.log("[v0] Profile data:", profileData)
        console.log("[v0] Profile error:", profileError)
        console.log("[v0] Is admin value:", profileData?.is_admin)

        if (!profileData?.is_admin) {
          console.log("[v0] User is not admin, redirecting to home")
          router.push("/")
          return
        }

        setIsAdmin(true)
        await fetchModules()
      } catch (error) {
        console.error("[v0] Error in checkAdminAndFetchData:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [])

  const fetchModules = async () => {
    const { data: modulesData } = await supabase.from("modules").select("*").order("order_index", { ascending: true })

    setModules(modulesData || [])
    if (modulesData && modulesData.length > 0 && !selectedModule) {
      setSelectedModule(modulesData[0].id)
      await fetchModuleContent(modulesData[0].id)
    }
  }

  const fetchModuleContent = async (moduleId: string) => {
    const { data: videosData } = await supabase
      .from("videos")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true })

    const { data: quizzesData } = await supabase.from("quizzes").select("*").eq("module_id", moduleId)

    setVideos(videosData || [])
    setQuizzes(quizzesData || [])
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { data, error } = await supabase.from("modules").insert([moduleForm]).select()

      if (error) throw error

      setModules([...modules, data[0]])
      setModuleForm({ title: "", description: "", order_index: modules.length + 1 })
      setShowModuleForm(false)
    } catch (error) {
      console.error("Error adding module:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from("videos")
        .insert([{ ...videoForm, module_id: selectedModule }])
        .select()

      if (error) throw error

      setVideos([...videos, data[0]])
      setVideoForm({ title: "", video_url: "", duration_minutes: 0, order_index: videos.length + 1 })
      setShowVideoForm(false)
    } catch (error) {
      console.error("Error adding video:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModule) return

    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from("quizzes")
        .insert([{ ...quizForm, module_id: selectedModule, total_questions: 0 }])
        .select()

      if (error) throw error

      setQuizzes([...quizzes, data[0]])
      setQuizForm({ title: "", description: "", passing_score: 70 })
      setShowQuizForm(false)
    } catch (error) {
      console.error("Error adding quiz:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuiz) return

    setIsSaving(true)

    try {
      const { data: questionData, error: questionError } = await supabase
        .from("quiz_questions")
        .insert([
          {
            quiz_id: selectedQuiz,
            question_text: questionForm.question_text,
            question_type: questionForm.question_type,
            points: questionForm.points,
          },
        ])
        .select()

      if (questionError) throw questionError

      const questionId = questionData[0].id

      if (questionForm.question_type === "multiple_choice") {
        const options = questionForm.options.map((opt, idx) => ({
          question_id: questionId,
          option_text: opt.text,
          is_correct: opt.is_correct,
          order_index: idx + 1,
        }))

        const { error: optionsError } = await supabase.from("quiz_options").insert(options)

        if (optionsError) throw optionsError
      }

      await fetchQuizQuestions(selectedQuiz)
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

      const { data: updatedQuiz } = await supabase
        .from("quizzes")
        .select("total_questions")
        .eq("id", selectedQuiz)
        .single()

      if (updatedQuiz) {
        setQuizzes(
          quizzes.map((q) => (q.id === selectedQuiz ? { ...q, total_questions: updatedQuiz.total_questions + 1 } : q)),
        )
      }
    } catch (error) {
      console.error("Error adding question:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const fetchQuizQuestions = async (quizId: string) => {
    const { data: questionsData } = await supabase
      .from("quiz_questions")
      .select("*, quiz_options(*)")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true })

    setQuizQuestions(questionsData || [])
  }

  const handleSelectModule = async (moduleId: string) => {
    setSelectedModule(moduleId)
    setSelectedQuiz(null)
    setQuizQuestions([])
    await fetchModuleContent(moduleId)
  }

  const handleSelectQuiz = async (quizId: string) => {
    setSelectedQuiz(quizId)
    await fetchQuizQuestions(quizId)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <Header user={user} />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Kelola modul, video, dan kuis pembelajaran</p>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{video.title}</h3>
                      <p className="text-gray-600 text-sm">{video.duration_minutes} menit</p>
                    </div>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">Video</span>
                  </div>
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
                          size={20}
                          required
                          value={quizForm.title}
                          onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiz-passing" className="text-sm">
                          Skor Lulus (%)
                        </Label>
                        <Input
                          id="quiz-passing"
                          type="number"
                          size={20}
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

              {/* Questions List and Form */}
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

                    {/* Questions List */}
                    <div className="space-y-4">
                      {quizQuestions.map((question, idx) => (
                        <Card key={question.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {idx + 1}. {question.question_text}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Tipe: {question.question_type} • {question.points} poin
                              </p>

                              {question.quiz_options && question.quiz_options.length > 0 && (
                                <div className="mt-3 space-y-1">
                                  {(question.quiz_options as QuizOption[]).map((option) => (
                                    <div key={option.id} className="text-sm">
                                      <span
                                        className={option.is_correct ? "text-green-600 font-bold" : "text-gray-600"}
                                      >
                                        {option.is_correct ? "✓" : "○"} {option.option_text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-gray-600">Pilih kuis untuk melihat soal</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
