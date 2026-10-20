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
  const moduleId = request.nextUrl.searchParams.get("moduleId")

  try {
    const videos = await runQuery("SELECT * FROM videos WHERE module_id = ? ORDER BY order_index ASC", [moduleId])
    return NextResponse.json(videos)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { moduleId, title, videoUrl, durationMinutes } = await request.json()

  try {
    const id = randomUUID()
    const maxOrder = await runQueryOne<any>("SELECT MAX(order_index) as max_order FROM videos WHERE module_id = ?", [
      moduleId,
    ])
    const orderIndex = (maxOrder?.max_order || 0) + 1

    await runExecute(
      "INSERT INTO videos (id, module_id, title, video_url, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?)",
      [id, moduleId, title, videoUrl, durationMinutes, orderIndex],
    )

    return NextResponse.json({ id, module_id: moduleId, title, video_url: videoUrl, duration_minutes: durationMinutes })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
