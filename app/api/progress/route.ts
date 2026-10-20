import { type NextRequest, NextResponse } from "next/server"
import { runQuery, runExecute, initializeDatabase, runQueryOne } from "@/lib/db"
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

  try {
    const progress = await runQuery("SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC", [userId])
    return NextResponse.json(progress)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { userId, moduleId, isCompleted, lastAccessed } = await request.json()

  try {
    // Check if record exists
    const existing = await runQueryOne("SELECT id FROM user_progress WHERE user_id = ? AND module_id = ?", [
      userId,
      moduleId,
    ])

    if (existing) {
      await runExecute(
        "UPDATE user_progress SET is_completed = ?, last_accessed = datetime('now'), updated_at = datetime('now') WHERE user_id = ? AND module_id = ?",
        [isCompleted ? 1 : 0, userId, moduleId],
      )
    } else {
      await runExecute(
        "INSERT INTO user_progress (id, user_id, module_id, is_completed, last_accessed, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))",
        [randomUUID(), userId, moduleId, isCompleted ? 1 : 0],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
