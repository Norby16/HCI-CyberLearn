"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ForumPost {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  profiles?: { email: string }
}

interface ForumReply {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: { email: string }
}

export default function ForumPostPage() {
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [user, setUser] = useState(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const postId = params.postId as string
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch post
        const { data: postData } = await supabase
          .from("forum_posts")
          .select("*, profiles(email)")
          .eq("id", postId)
          .single()

        if (postData) {
          setPost(postData)
        }

        // Fetch replies
        const { data: repliesData } = await supabase
          .from("forum_replies")
          .select("*, profiles(email)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })

        if (repliesData) {
          setReplies(repliesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [postId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push("/auth/login")
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent,
        })
        .select("*, profiles(email)")

      if (error) throw error

      setReplies([...replies, data[0]])
      setReplyContent("")
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setIsSubmitting(false)
    }
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

  if (!post) {
    return (
      <main className="min-h-screen bg-background">
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Post not found</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header user={user} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/forum" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Kembali ke Forum
        </Link>

        {/* Original Post */}
        <Card className="p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
            <span>{post.profiles?.email}</span>
            <span>{new Date(post.created_at).toLocaleDateString("id-ID")}</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </Card>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Balasan ({replies.length})</h2>
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id} className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <span>{reply.profiles?.email}</span>
                  <span>{new Date(reply.created_at).toLocaleDateString("id-ID")}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        {user ? (
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Tulis Balasan</h3>
            <form onSubmit={handleReply}>
              <textarea
                required
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                placeholder="Tulis balasan Anda..."
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-600 mb-4">Silakan login untuk membalas pertanyaan ini</p>
            <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Login
            </Button>
          </Card>
        )}
      </div>
    </main>
  )
}
