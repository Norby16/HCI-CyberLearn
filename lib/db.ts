import fs from "fs"
import path from "path"

const dbDir = path.join(process.cwd(), ".data")
const dbFile = path.join(dbDir, "database.json")

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

interface Database {
  users: any[]
  modules: any[]
  videos: any[]
  quizzes: any[]
  quiz_questions: any[]
  quiz_options: any[]
  quiz_attempts: any[]
  user_answers: any[]
}

let db: Database | null = null

function loadDatabase(): Database {
  if (db) return db

  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, "utf-8")
      db = JSON.parse(data)
    } else {
      db = {
        users: [],
        modules: [],
        videos: [],
        quizzes: [],
        quiz_questions: [],
        quiz_options: [],
        quiz_attempts: [],
        user_answers: [],
      }
      saveDatabase()
    }
  } catch (error) {
    db = {
      users: [],
      modules: [],
      videos: [],
      quizzes: [],
      quiz_questions: [],
      quiz_options: [],
      quiz_attempts: [],
      user_answers: [],
    }
  }

  return db
}

function saveDatabase() {
  if (!db) return
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error("Error saving database:", error)
  }
}

export function initializeDatabase() {
  loadDatabase()
  return Promise.resolve()
}

export function runQuery<T>(query: string, params: any[] = []): Promise<T[]> {
  const db = loadDatabase()
  const tableName = extractTableName(query)
  const table = (db as any)[tableName] || []
  return Promise.resolve(table as T[])
}

export function runQueryOne<T>(query: string, params: any[] = []): Promise<T | null> {
  const db = loadDatabase()
  const tableName = extractTableName(query)
  const table = (db as any)[tableName] || []
  return Promise.resolve((table[0] || null) as T | null)
}

export function runExecute(query: string, params: any[] = []): Promise<void> {
  const db = loadDatabase()
  const tableName = extractTableName(query)
  const table = (db as any)[tableName]
  const columns = extractColumns(query)

  if (!table) return Promise.resolve()

  if (query.includes("INSERT")) {
    const record: any = {}
    columns.forEach((col, i) => {
      record[col] = params[i]
    })
    table.push(record)
  } else if (query.includes("UPDATE")) {
    // Simple update logic
    const whereIdx = query.indexOf("WHERE")
    if (whereIdx > -1) {
      const firstItem = table[0]
      if (firstItem) {
        Object.assign(firstItem, { [columns[0]]: params[0] })
      }
    }
  }

  saveDatabase()
  return Promise.resolve()
}

function extractTableName(query: string): string {
  const fromMatch = query.match(/FROM\s+(\w+)/i)
  const intoMatch = query.match(/INTO\s+(\w+)/i)
  const updateMatch = query.match(/UPDATE\s+(\w+)/i)

  return (fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || "").toLowerCase()
}

function extractColumns(query: string): string[] {
  const match = query.match(/$$([^)]+)$$/)
  if (match) {
    return match[1]
      .split(",")
      .map((col) => col.trim())
      .filter((col) => col !== "?" && col !== "")
  }
  return []
}

export default loadDatabase()
