import { compare, hash } from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { createUser, getUserByEmail } from "./db"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

// Secret key for JWT signing
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_change_in_production")

// JWT expiration time (24 hours)
const expTime = "24h"

// User type definition
export type User = {
  id: number
  name: string
  email: string
}

// Register a new user
export async function register(name: string, email: string, password: string) {
  // Check if user already exists
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists with this email")
  }

  // Hash the password
  const passwordHash = await hash(password, 10)

  // Create the user
  const user = await createUser(name, email, passwordHash)

  // Create and set the session cookie
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
  })

  return user
}

// Login a user
export async function login(email: string, password: string) {
  // Get the user
  const user = await getUserByEmail(email)
  if (!user) {
    throw new Error("Invalid email or password")
  }

  // Verify the password
  const passwordMatch = await compare(password, user.password_hash)
  if (!passwordMatch) {
    throw new Error("Invalid email or password")
  }

  // Create and set the session cookie
  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
  })

  return user
}

// Create a session for a user
export async function createSession(user: User) {
  // Create the JWT token
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expTime)
    .sign(secretKey);

    // Set the cookie
   (await
      // Set the cookie
      cookies()).set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      })

  return token
}

// Get the current session
export async function getSession() {
  const session = (await cookies()).get("session")?.value
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, secretKey)
    return payload.user as User
  } catch (error) {
    return null
  }
}

// Logout the current user
export async function logout() {
  (await cookies()).delete("session")
}

// Middleware to check if user is authenticated
export async function requireAuth() {
  const user = await getSession()
  if (!user) {
    redirect("/login")
  }
  return user
}

// Middleware to check if user is not authenticated
export async function requireGuest() {
  const user = await getSession()
  if (user) {
    redirect("/dashboard")
  }
}

// Middleware for API routes
export async function apiRequireAuth(req: NextRequest) {
  const session = req.cookies.get("session")?.value
  if (!session) {
    return null
  }

  try {
    const { payload } = await jwtVerify(session, secretKey)
    return payload.user as User
  } catch (error) {
    return null
  }
}

