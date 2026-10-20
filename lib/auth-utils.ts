import bcrypt from "bcryptjs"
import { runQueryOne, runExecute } from "./db"
import { randomUUID } from "crypto"

interface User {
  id: string
  email: string
  is_admin: boolean
}

export async function createUser(email: string, password: string, isAdmin = false): Promise<User> {
  const id = randomUUID()
  const hashedPassword = await bcrypt.hash(password, 10)

  await runExecute("INSERT INTO users (id, email, password_hash, is_admin) VALUES (?, ?, ?, ?)", [
    id,
    email.toLowerCase(),
    hashedPassword,
    isAdmin ? 1 : 0,
  ])

  return { id, email, is_admin: isAdmin }
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const user = await runQueryOne<any>("SELECT * FROM users WHERE email = ?", [email.toLowerCase()])

  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    is_admin: user.is_admin === 1,
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await runQueryOne<any>("SELECT id, email, is_admin FROM users WHERE id = ?", [id])

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    is_admin: user.is_admin === 1,
  }
}

export async function userExists(email: string): Promise<boolean> {
  const user = await runQueryOne<any>("SELECT id FROM users WHERE email = ?", [email.toLowerCase()])
  return !!user
}
