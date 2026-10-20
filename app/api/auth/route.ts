import { type NextRequest, NextResponse } from "next/server"
import { createUser, verifyPassword, userExists } from "@/lib/auth-utils"
import { initializeDatabase } from "@/lib/db"

// Initialize database on first request
let dbInitialized = false

async function ensureDbInitialized() {
  if (!dbInitialized) {
    await initializeDatabase()
    dbInitialized = true
  }
}

export async function POST(request: NextRequest) {
  await ensureDbInitialized()

  const { action, email, password } = await request.json()

  try {
    if (action === "signup") {
      const exists = await userExists(email)
      if (exists) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }

      const user = await createUser(email, password, false)
      return NextResponse.json({ user, success: true })
    }

    if (action === "login") {
      const user = await verifyPassword(email, password)
      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      return NextResponse.json({ user, success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
