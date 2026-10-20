import { NextResponse } from "next/server"
import { initializeDatabase, runExecute, runQueryOne } from "@/lib/db"
import { createUser } from "@/lib/auth-utils"
import { randomUUID } from "crypto"

let initialized = false

async function seedDatabase() {
  try {
    // Check if already initialized
    const moduleCount = await runQueryOne<any>("SELECT COUNT(*) as count FROM modules")
    if (moduleCount && moduleCount.count > 0) {
      return { message: "Database already seeded" }
    }

    try {
      await createUser("admin@cyberlearn.com", "admin123", true)
    } catch (e) {
      // Admin already exists
    }

    const modules = [
      {
        id: randomUUID(),
        title: "Pengenalan Keamanan Siber",
        description:
          "Pelajari dasar-dasar keamanan siber dan konsep fundamental seperti CIA Triad, threat modeling, dan risk assessment.",
        order_index: 1,
      },
      {
        id: randomUUID(),
        title: "Keamanan Jaringan",
        description:
          "Pahami arsitektur jaringan, protokol keamanan, firewall, VPN, dan best practices dalam network security.",
        order_index: 2,
      },
      {
        id: randomUUID(),
        title: "Enkripsi dan Kriptografi",
        description:
          "Kuasai teknik enkripsi modern, algoritma cryptographic, dan implementasi dalam aplikasi keamanan.",
        order_index: 3,
      },
      {
        id: randomUUID(),
        title: "Penetration Testing",
        description:
          "Belajar teknik testing keamanan sistem, vulnerability assessment, dan ethical hacking methodologies.",
        order_index: 4,
      },
      {
        id: randomUUID(),
        title: "Malware dan Ancaman Digital",
        description:
          "Identifikasi, analisis, dan mitigasi berbagai jenis malware, ransomware, dan ancaman cyber modern.",
        order_index: 5,
      },
      {
        id: randomUUID(),
        title: "Incident Response",
        description:
          "Respons dan recovery dari serangan keamanan, digital forensics, dan business continuity planning.",
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

    const videos = [
      {
        module_id: modules[0].id,
        title: "Intro to Cybersecurity",
        url: "https://www.youtube.com/watch?v=PKB7fY0OkVQ",
        duration: 15,
      },
      {
        module_id: modules[0].id,
        title: "CIA Triad Explained",
        url: "https://www.youtube.com/watch?v=8H7TZ8vfkMI",
        duration: 12,
      },
      {
        module_id: modules[1].id,
        title: "Network Security Basics",
        url: "https://www.youtube.com/watch?v=jNgRgtY_7c4",
        duration: 20,
      },
      {
        module_id: modules[1].id,
        title: "Firewall Fundamentals",
        url: "https://www.youtube.com/watch?v=8NVWlnmQTbc",
        duration: 18,
      },
      {
        module_id: modules[2].id,
        title: "Encryption Explained",
        url: "https://www.youtube.com/watch?v=T4HU5K8Zv1w",
        duration: 25,
      },
      {
        module_id: modules[3].id,
        title: "Penetration Testing Intro",
        url: "https://www.youtube.com/watch?v=yHQ3cVH0VoE",
        duration: 22,
      },
    ]

    for (const video of videos) {
      await runExecute(
        "INSERT INTO videos (id, module_id, title, video_url, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, 1)",
        [randomUUID(), video.module_id, video.title, video.url, video.duration],
      )
    }

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
      {
        id: randomUUID(),
        module_id: modules[3].id,
        title: "Kuis Penetration Testing",
        description: "Evaluasi teknik penetration testing",
        passing_score: 75,
      },
    ]

    for (const quiz of quizzes) {
      await runExecute(
        "INSERT INTO quizzes (id, module_id, title, description, passing_score, total_questions) VALUES (?, ?, ?, ?, ?, 0)",
        [quiz.id, quiz.module_id, quiz.title, quiz.description, quiz.passing_score],
      )
    }

    const questions = [
      {
        quiz_id: quizzes[0].id,
        text: "Apa yang dimaksud dengan Confidentiality dalam CIA Triad?",
        type: "multiple_choice",
      },
      {
        quiz_id: quizzes[0].id,
        text: "Apakah firewall adalah perlindungan pertama terhadap ancaman jaringan?",
        type: "true_false",
      },
      { quiz_id: quizzes[0].id, text: "Apa singkatan dari DDoS?", type: "multiple_choice" },
      {
        quiz_id: quizzes[1].id,
        text: "Protokol jaringan apa yang paling rentan terhadap serangan?",
        type: "multiple_choice",
      },
      { quiz_id: quizzes[1].id, text: "VPN mengenkripsi semua traffic data Anda.", type: "true_false" },
      {
        quiz_id: quizzes[2].id,
        text: "Jenis enkripsi apa yang menggunakan dua kunci berbeda?",
        type: "multiple_choice",
      },
      { quiz_id: quizzes[3].id, text: "Ethical hacking harus mendapat izin sebelum dilakukan.", type: "true_false" },
    ]

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const questionId = randomUUID()
      await runExecute(
        "INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index) VALUES (?, ?, ?, ?, ?, ?)",
        [questionId, q.quiz_id, q.text, q.type, 1, i + 1],
      )

      // Add options based on question type
      if (q.type === "multiple_choice") {
        const mcOptions = [
          { text: "Menjaga kerahasiaan data dari akses tidak sah", correct: i === 0 ? 1 : 0 },
          { text: "Memastikan data tidak rusak atau berubah", correct: 0 },
          { text: "Memastikan sistem selalu tersedia", correct: 0 },
          { text: "Mengidentifikasi siapa yang mengakses data", correct: 0 },
        ]
        for (let j = 0; j < mcOptions.length; j++) {
          await runExecute(
            "INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)",
            [randomUUID(), questionId, mcOptions[j].text, mcOptions[j].correct, j + 1],
          )
        }
      } else {
        const tfOptions = [
          { text: "Benar (True)", correct: i % 2 === 0 ? 1 : 0 },
          { text: "Salah (False)", correct: i % 2 === 0 ? 0 : 1 },
        ]
        for (let j = 0; j < tfOptions.length; j++) {
          await runExecute(
            "INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)",
            [randomUUID(), questionId, tfOptions[j].text, tfOptions[j].correct, j + 1],
          )
        }
      }
    }

    // Update quiz total_questions
    for (const quiz of quizzes) {
      const totalQuestions = await runQueryOne<any>("SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = ?", [
        quiz.id,
      ])
      await runExecute("UPDATE quizzes SET total_questions = ? WHERE id = ?", [totalQuestions?.count || 0, quiz.id])
    }

    return { message: "Database seeded successfully with videos and comprehensive quizzes" }
  } catch (error) {
    console.error("Seeding error:", error)
    throw error
  }
}

export async function GET() {
  try {
    await initializeDatabase()

    if (!initialized) {
      const result = await seedDatabase()
      initialized = true
      return NextResponse.json(result)
    }

    return NextResponse.json({ message: "Already initialized" })
  } catch (error) {
    console.error("Initialization error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
