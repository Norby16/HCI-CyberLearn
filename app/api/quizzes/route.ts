import { type NextRequest, NextResponse } from "next/server"
import { runQuery, runExecute, initializeDatabase } from "@/lib/db"
import { randomUUID } from "crypto"

let dbInitialized = false

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

export async function GET(request: NextRequest) {
  await ensureDb()
  const moduleId = request.nextUrl.searchParams.get("moduleId")

  try {
    const quizzes = await runQuery("SELECT * FROM quizzes WHERE module_id = ? ORDER BY created_at DESC", [moduleId])
    return NextResponse.json(quizzes)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { moduleId, title, description, passingScore } = await request.json()

  try {
    const id = randomUUID()
    await runExecute(
      "INSERT INTO quizzes (id, module_id, title, description, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, 0)",
      [id, moduleId, title, description, passingScore || 70],
    )

    return NextResponse.json({
      id,
      module_id: moduleId,
      title,
      description,
      passing_score: passingScore || 70,
      total_questions: 0,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
