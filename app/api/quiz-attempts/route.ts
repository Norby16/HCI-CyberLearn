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
  const userId = request.nextUrl.searchParams.get("userId")
  const quizId = request.nextUrl.searchParams.get("quizId")

  try {
    let query = "SELECT * FROM quiz_attempts WHERE user_id = ?"
    const params: any[] = [userId]

    if (quizId) {
      query += " AND quiz_id = ?"
      params.push(quizId)
    }

    query += " ORDER BY created_at DESC"
    const attempts = await runQuery(query, params)
    return NextResponse.json(attempts)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { userId, quizId, score, totalQuestions, answers } = await request.json()

  try {
    const attemptId = randomUUID()
    await runExecute(
      "INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total_questions, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
      [attemptId, userId, quizId, score, totalQuestions],
    )

    // Store individual answers
    if (answers && Object.keys(answers).length > 0) {
      for (const [questionId, answerText] of Object.entries(answers)) {
        await runExecute(
          "INSERT INTO user_answers (id, attempt_id, question_id, answer_text, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
          [randomUUID(), attemptId, questionId, answerText as string],
        )
      }
    }

    return NextResponse.json({ id: attemptId, success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
