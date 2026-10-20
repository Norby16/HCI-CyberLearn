"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Video {
  id: string
  title: string
  video_url: string
  duration_minutes: number
}

interface Module {
  id: string
  title: string
  description: string
  order_index: number
}

export default function ModulePage() {
  const [module, setModule] = useState<Module | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarking, setIsMarking] = useState(false)
  const router = useRouter()
  const params = useParams()
  const moduleId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from localStorage
        const stored = localStorage.getItem("auth_user")
        if (stored) {
          const user = JSON.parse(stored)
          setUserId(user.id)
        }

        // Fetch module
        const modulesRes = await fetch("/api/modules")
        const modules = await modulesRes.json()
        const currentModule = modules.find((m: any) => m.id === moduleId)
        if (currentModule) {
          setModule(currentModule)
        }

        // Fetch videos for module
        const videosRes = await fetch(`/api/videos?moduleId=${moduleId}`)
        const videosData = await videosRes.json()
        if (videosData) {
          setVideos(videosData)
        }

        // Check if completed
        if (stored) {
          const user = JSON.parse(stored)
          const progressRes = await fetch(`/api/progress?userId=${user.id}`)
          const progress = await progressRes.json()
          const moduleProgress = progress.find((p: any) => p.module_id === moduleId)
          if (moduleProgress) {
            setIsCompleted(moduleProgress.is_completed)
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

  const handleMarkComplete = async () => {
    if (!userId || !module) return

    setIsMarking(true)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          moduleId: module.id,
          isCompleted: true,
        }),
      })

      setIsCompleted(true)
    } catch (error) {
      console.error("Error marking complete:", error)
    } finally {
      setIsMarking(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading module...</p>
        </div>
      </main>
    )
  }

  if (!module) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={userId ? { id: userId } : null} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Module not found</p>
        </div>
      </main>
    )
  }

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const videoId = urlObj.searchParams.get("v") || url.split("youtu.be/")[1]
      return `https://www.youtube.com/embed/${videoId}`
    } catch {
      return url
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header user={userId ? { id: userId } : null} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Kembali ke Modul
        </Link>

        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Modul {module.order_index}
              </span>
              <h1 className="text-4xl font-bold mt-4 mb-2">{module.title}</h1>
              <p className="text-gray-600 text-lg">{module.description}</p>
            </div>
            {isCompleted && (
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">✓ Selesai</span>
            )}
          </div>
        </Card>

        {videos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Video Pembelajaran</h2>
            <div className="space-y-8">
              {videos.map((video) => (
                <Card key={video.id} className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{video.title}</h3>
                  <div className="aspect-video mb-4 bg-gray-900 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getYoutubeEmbedUrl(video.video_url)}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-sm text-gray-600">Durasi: {video.duration_minutes} menit</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-4 mb-8">
          {userId ? (
            <>
              <Link href={`/modules/${module.id}/quiz`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Ikuti Kuis</Button>
              </Link>
              {!isCompleted && (
                <Button
                  onClick={handleMarkComplete}
                  disabled={isMarking}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isMarking ? "Menyimpan..." : "Tandai Selesai"}
                </Button>
              )}
            </>
          ) : (
            <div className="flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 text-sm mb-3">
                  Masuk untuk mengikuti kuis dan melacak progres pembelajaran Anda.
                </p>
                <Link href="/auth/login" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Masuk untuk Melanjutkan</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Diskusi</h2>
          <p className="text-gray-600 mb-4">Punya pertanyaan? Bergabunglah dengan diskusi komunitas kami.</p>
          <Link href="/forum">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Buka Forum</Button>
          </Link>
        </Card>
      </div>
    </main>
  )
}
