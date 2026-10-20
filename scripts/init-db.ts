import sqlite3 from "sqlite3"
import path from "path"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"

const dbPath = path.join(process.cwd(), "cyberlearn.db")
const db = new sqlite3.Database(dbPath)

db.run("PRAGMA foreign_keys = ON")

function runQuery(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

function runQueryOne(query: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err)
      else resolve(row || null)
    })
  })
}

function runExecute(query: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(query, params, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function initializeDatabase() {
  console.log("Initializing database...")

  // Create tables
  await runExecute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      duration_minutes INTEGER,
      order_index INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      total_questions INTEGER DEFAULT 0,
      passing_score INTEGER DEFAULT 70,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS quiz_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      option_text TEXT NOT NULL,
      is_correct BOOLEAN DEFAULT 0,
      order_index INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      percentage_score REAL DEFAULT 0,
      passed BOOLEAN DEFAULT 0,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `)

  await runExecute(`
    CREATE TABLE IF NOT EXISTS user_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_text TEXT,
      option_id TEXT,
      is_correct BOOLEAN DEFAULT 0,
      points_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES quiz_options(id) ON DELETE CASCADE
    )
  `)

  console.log("Tables created successfully")
}

async function seedDatabase() {
  console.log("Seeding database...")

  try {
    // Check if already seeded
    const moduleCount = await runQueryOne("SELECT COUNT(*) as count FROM modules")
    if (moduleCount && moduleCount.count > 0) {
      console.log("Database already seeded, skipping...")
      return
    }

    // Create admin user
    const adminId = randomUUID()
    const hashedPassword = await bcrypt.hash("admin123", 10)

    try {
      await runExecute("INSERT INTO users (id, email, password_hash, is_admin) VALUES (?, ?, ?, ?)", [
        adminId,
        "admin@cyberlearn.com",
        hashedPassword,
        1,
      ])
      console.log("Admin user created: admin@cyberlearn.com / admin123")
    } catch (e) {
      console.log("Admin user already exists")
    }

    // Create modules
    const modules = [
      {
        id: randomUUID(),
        title: "Pengenalan Keamanan Siber",
        description: "Pelajari dasar-dasar keamanan siber dan konsep fundamental",
        order_index: 1,
      },
      {
        id: randomUUID(),
        title: "Keamanan Jaringan",
        description: "Pahami arsitektur jaringan dan protokol keamanan",
        order_index: 2,
      },
      {
        id: randomUUID(),
        title: "Enkripsi dan Kriptografi",
        description: "Kuasai teknik enkripsi modern dan aplikasinya",
        order_index: 3,
      },
      {
        id: randomUUID(),
        title: "Penetration Testing",
        description: "Belajar teknik testing keamanan sistem",
        order_index: 4,
      },
      {
        id: randomUUID(),
        title: "Malware dan Ancaman Digital",
        description: "Identifikasi dan analisis berbagai jenis malware",
        order_index: 5,
      },
      {
        id: randomUUID(),
        title: "Incident Response",
        description: "Respons dan recovery dari serangan keamanan",
        order_index: 6,
      },
    ]

    for (const module of modules) {
      await runExecute("INSERT INTO modules (id, title, description, order_index) VALUES (?, ?, ?, ?)", [
        module.id,
        module.title,
        module.description,
        module.order_index,
      ])
    }
    console.log(`Created ${modules.length} modules`)

    // Create quizzes
    const quizzes = [
      {
        id: randomUUID(),
        module_id: modules[0].id,
        title: "Kuis Dasar Keamanan Siber",
        description: "Uji pemahaman Anda tentang konsep keamanan siber",
        passing_score: 70,
      },
      {
        id: randomUUID(),
        module_id: modules[1].id,
        title: "Kuis Keamanan Jaringan",
        description: "Evaluasi pengetahuan keamanan jaringan",
        passing_score: 75,
      },
      {
        id: randomUUID(),
        module_id: modules[2].id,
        title: "Kuis Enkripsi",
        description: "Uji pemahaman tentang enkripsi dan kriptografi",
        passing_score: 70,
      },
    ]

    for (const quiz of quizzes) {
      await runExecute(
        "INSERT INTO quizzes (id, module_id, title, description, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, 0)",
        [quiz.id, quiz.module_id, quiz.title, quiz.description, quiz.passing_score],
      )
    }
    console.log(`Created ${quizzes.length} quizzes`)

    // Create questions
    const questions = [
      {
        id: randomUUID(),
        quiz_id: quizzes[0].id,
        question_text: "Apa yang dimaksud dengan Confidentiality dalam CIA Triad?",
        question_type: "multiple_choice",
        points: 1,
        order_index: 1,
      },
      {
        id: randomUUID(),
        quiz_id: quizzes[0].id,
        question_text: "Apakah firewall adalah perlindungan pertama terhadap ancaman jaringan?",
        question_type: "true_false",
        points: 1,
        order_index: 2,
      },
      {
        id: randomUUID(),
        quiz_id: quizzes[1].id,
        question_text: "Protokol apa yang menggunakan enkripsi untuk komunikasi aman?",
        question_type: "multiple_choice",
        points: 1,
        order_index: 1,
      },
      {
        id: randomUUID(),
        quiz_id: quizzes[2].id,
        question_text: "RSA adalah algoritma enkripsi asimetris. Apakah pernyataan ini benar?",
        question_type: "true_false",
        points: 1,
        order_index: 1,
      },
    ]

    for (const question of questions) {
      await runExecute(
        "INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index) VALUES (?, ?, ?, ?, ?, ?)",
        [
          question.id,
          question.quiz_id,
          question.question_text,
          question.question_type,
          question.points,
          question.order_index,
        ],
      )
    }
    console.log(`Created ${questions.length} questions`)

    // Add options to questions
    const options = [
      {
        question_id: questions[0].id,
        option_text: "Menjaga kerahasiaan data dari akses tidak sah",
        is_correct: 1,
      },
      {
        question_id: questions[0].id,
        option_text: "Memastikan data tidak rusak atau berubah",
        is_correct: 0,
      },
      {
        question_id: questions[0].id,
        option_text: "Memastikan sistem selalu tersedia",
        is_correct: 0,
      },
      {
        question_id: questions[0].id,
        option_text: "Mengidentifikasi siapa yang mengakses data",
        is_correct: 0,
      },
      {
        question_id: questions[1].id,
        option_text: "Benar (True)",
        is_correct: 1,
      },
      {
        question_id: questions[1].id,
        option_text: "Salah (False)",
        is_correct: 0,
      },
      {
        question_id: questions[2].id,
        option_text: "HTTP",
        is_correct: 0,
      },
      {
        question_id: questions[2].id,
        option_text: "HTTPS",
        is_correct: 1,
      },
      {
        question_id: questions[2].id,
        option_text: "FTP",
        is_correct: 0,
      },
      {
        question_id: questions[2].id,
        option_text: "Telnet",
        is_correct: 0,
      },
      {
        question_id: questions[3].id,
        option_text: "Benar (True)",
        is_correct: 1,
      },
      {
        question_id: questions[3].id,
        option_text: "Salah (False)",
        is_correct: 0,
      },
    ]

    for (let i = 0; i < options.length; i++) {
      const option = options[i]
      await runExecute(
        "INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)",
        [randomUUID(), option.question_id, option.option_text, option.is_correct ? 1 : 0, i + 1],
      )
    }
    console.log(`Created ${options.length} options`)

    console.log("Database seeded successfully!")
  } catch (error) {
    console.error("Seeding error:", error)
    throw error
  }
}

async function main() {
  try {
    await initializeDatabase()
    await seedDatabase()
    console.log("Database initialization complete!")
    db.close()
  } catch (error) {
    console.error("Error:", error)
    db.close()
    process.exit(1)
  }
}

main()
