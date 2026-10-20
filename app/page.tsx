"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { ModuleCard } from "@/components/module-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Module {
  id: string
  title: string
  description: string
  order_index: number
  image_url: string
}

interface UserProgress {
  module_id: string
  is_completed: boolean
}

export default function Home() {
  const [modules, setModules] = useState<Module[]>([])
  const [user, setUser] = useState(null)
  const [userProgress, setUserProgress] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch modules
        const { data: modulesData } = await supabase
          .from("modules")
          .select("*")
          .order("order_index", { ascending: true })

        if (modulesData) {
          setModules(modulesData)
        }

        // Fetch user progress if logged in
        if (user) {
          const { data: progressData } = await supabase
            .from("user_progress")
            .select("module_id, is_completed")
            .eq("user_id", user.id)

          if (progressData) {
            const progressMap = progressData.reduce((acc, p) => {
              acc[p.module_id] = p.is_completed
              return acc
            }, {})
            setUserProgress(progressMap)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const completedCount = Object.values(userProgress).filter(Boolean).length
  const progressPercentage = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header user={user} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-balance">Selamat Datang di Cyberlearn</h1>
          <p className="text-xl text-blue-100 mb-8 text-balance">
            Pelajari dasar-dasar cybersecurity dengan materi interaktif, kuis, dan komunitas diskusi yang aktif.
          </p>
          {user ? (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
            >
              Mulai Belajar
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push("/auth/sign-up")}
            >
              Daftar Sekarang
            </Button>
          )}
        </div>
      </section>

      {/* Progress Section */}
      {user && (
        <section className="bg-blue-50 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Progres Belajar Anda</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
              </div>
              <p className="text-gray-600 mt-2">
                {completedCount} dari {modules.length} modul selesai
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* Modules Section */}
      <section id="modules" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Modul Pembelajaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} isCompleted={userProgress[module.id] || false} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Siap Belajar Cybersecurity?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Bergabunglah dengan ribuan pelajar yang telah meningkatkan kesadaran keamanan siber mereka.
          </p>
          {!user && (
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/auth/sign-up")}
            >
              Daftar Gratis
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
