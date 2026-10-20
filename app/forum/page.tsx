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
import Link from "next/link"

interface ForumPost {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  module_id: string
  profiles?: { email: string }
}

interface Module {
  id: string
  title: string
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [user, setUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedModule, setSelectedModule] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch modules
        const { data: modulesData } = await supabase
          .from("modules")
          .select("id, title")
          .order("order_index", { ascending: true })

        if (modulesData) {
          setModules(modulesData)
          if (modulesData.length > 0) {
            setSelectedModule(modulesData[0].id)
          }
        }

        // Fetch posts
        const { data: postsData } = await supabase
          .from("forum_posts")
          .select("*, profiles(email)")
          .order("created_at", { ascending: false })

        if (postsData) {
          setPosts(postsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push("/auth/login")
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .insert({
          user_id: user.id,
          module_id: selectedModule,
          title: formData.title,
          content: formData.content,
        })
        .select("*, profiles(email)")

      if (error) throw error

      setPosts([data[0], ...posts])
      setFormData({ title: "", content: "" })
      setShowForm(false)
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Loading forum...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header user={user} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Forum Diskusi</h1>
            <p className="text-gray-600">Tanya, bagikan, dan belajar bersama komunitas</p>
          </div>
          {user && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white">
              {showForm ? "Batal" : "Buat Pertanyaan"}
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {showForm && user && (
          <Card className="p-6 mb-12">
            <h2 className="text-2xl font-bold mb-6">Buat Pertanyaan Baru</h2>
            <form onSubmit={handleCreatePost}>
              <div className="mb-4">
                <Label htmlFor="module">Modul Terkait</Label>
                <select
                  id="module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <Label htmlFor="title">Judul Pertanyaan</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Apa yang ingin Anda tanyakan?"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="content">Deskripsi</Label>
                <textarea
                  id="content"
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Jelaskan pertanyaan Anda dengan detail..."
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                {isSaving ? "Mengirim..." : "Posting"}
              </Button>
            </form>
          </Card>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link key={post.id} href={`/forum/${post.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{post.profiles?.email}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">Belum ada pertanyaan. Jadilah yang pertama!</p>
              {user && (
                <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Buat Pertanyaan
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
