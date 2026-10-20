import { type NextRequest, NextResponse } from "next/server"
import { runQuery, runQueryOne, runExecute, initializeDatabase } from "@/lib/db"
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
  const quizId = request.nextUrl.searchParams.get("quizId")

  try {
    const questions = await runQuery("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index ASC", [
      quizId,
    ])

    // Get options for each question
    const questionsWithOptions = await Promise.all(
      questions.map(async (q: any) => {
        const options = await runQuery("SELECT * FROM quiz_options WHERE question_id = ? ORDER BY order_index ASC", [
          q.id,
        ])
        return { ...q, quiz_options: options }
      }),
    )

    return NextResponse.json(questionsWithOptions)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { quizId, questionText, questionType, points, options } = await request.json()

  try {
    const questionId = randomUUID()
    const maxOrder = await runQueryOne<any>(
      "SELECT MAX(order_index) as max_order FROM quiz_questions WHERE quiz_id = ?",
      [quizId],
    )
    const orderIndex = (maxOrder?.max_order || 0) + 1

    await runExecute(
      "INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index) VALUES (?, ?, ?, ?, ?, ?)",
      [questionId, quizId, questionText, questionType, points, orderIndex],
    )

    // Add options if provided
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const optionId = randomUUID()
        await runExecute(
          "INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)",
          [optionId, questionId, options[i].text, options[i].is_correct ? 1 : 0, i + 1],
        )
      }
    }

    // Update quiz total_questions count
    const totalQuestions = await runQueryOne<any>("SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?", [
      quizId,
    ])
    await runExecute("UPDATE quizzes SET total_questions = ? WHERE id = ?", [totalQuestions?.count || 0, quizId])

    return NextResponse.json({
      id: questionId,
      quiz_id: quizId,
      question_text: questionText,
      question_type: questionType,
      points,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
