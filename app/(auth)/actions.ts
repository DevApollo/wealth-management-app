"use server"

import { getHouseholdById } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { hash } from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function addMemberDirectly(formData: FormData) {
  const user = await getSession()

  if (!user) {
    throw new Error("Authentication required")
  }

  const householdId = Number.parseInt(formData.get("householdId") as string)
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validate inputs
  if (!householdId || !name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" }
  }

  // Check if the household exists and the current user is the owner
  const household = await getHouseholdById(householdId)
  if (!household) {
    return { error: "Household not found" }
  }

  // Check if the current user is the owner of the household
  const members = await sql`
    SELECT * FROM household_members 
    WHERE household_id = ${householdId} AND user_id = ${user.id} AND role = 'owner'
  `

  if (members.length === 0) {
    return { error: "You do not have permission to add members to this household" }
  }

  try {
    // Check if user already exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`

    let newUserId

    if (existingUser.length > 0) {
      // User already exists, use their ID
      newUserId = existingUser[0].id

      // Check if they're already a member of this household
      const existingMember = await sql`
        SELECT * FROM household_members 
        WHERE household_id = ${householdId} AND user_id = ${newUserId}
      `

      if (existingMember.length > 0) {
        return { error: "This user is already a member of this household" }
      }
    } else {
      // Create a new user with the provided password
      const passwordHash = await hash(password, 10)

      const newUser = await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${email}, ${passwordHash})
        RETURNING *
      `

      newUserId = newUser[0].id
    }

    // Add the user to the household
    await sql`
      INSERT INTO household_members (household_id, user_id, role)
      VALUES (${householdId}, ${newUserId}, 'member')
    `

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to add member" }
  }
}

export async function deleteMember(householdId: number, memberId: number) {
  const user = await getSession()

  if (!user) {
    return { error: "Authentication required" }
  }

  // Check if the current user is the owner of the household
  const members = await sql`
    SELECT * FROM household_members 
    WHERE household_id = ${householdId} AND user_id = ${user.id} AND role = 'owner'
  `

  if (members.length === 0) {
    return { error: "You do not have permission to remove members from this household" }
  }

  // Check if the member to delete is the owner
  const memberToDelete = await sql`
    SELECT * FROM household_members 
    WHERE household_id = ${householdId} AND user_id = ${memberId}
  `

  if (memberToDelete.length === 0) {
    return { error: "Member not found" }
  }

  if (memberToDelete[0].role === "owner") {
    return { error: "Cannot remove the owner of the household" }
  }

  try {
    // Delete the member from the household
    await sql`
      DELETE FROM household_members 
      WHERE household_id = ${householdId} AND user_id = ${memberId}
    `

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to remove member" }
  }
}

