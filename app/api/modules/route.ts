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

export async function GET() {
  await ensureDb()
  try {
    const modules = await runQuery("SELECT * FROM modules ORDER BY order_index ASC")
    return NextResponse.json(modules)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await ensureDb()
  const { title, description } = await request.json()

  try {
    const id = randomUUID()
    const maxOrder = await runQueryOne<any>("SELECT MAX(order_index) as max_order FROM modules")
    const orderIndex = (maxOrder?.max_order || 0) + 1

    await runExecute("INSERT INTO modules (id, title, description, order_index) VALUES (?, ?, ?, ?)", [
      id,
      title,
      description,
      orderIndex,
    ])

    return NextResponse.json({ id, title, description, order_index: orderIndex })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
