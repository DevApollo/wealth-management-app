"use server"

import { getSession } from "@/lib/auth"
import { hash, compare } from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function updateUserProfile(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Check if we're updating the password
  if (currentPassword && newPassword) {
    // Validate password inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: "All password fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { error: "New passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long" }
    }

    // Verify current password
    const userRecord = await sql`SELECT * FROM users WHERE id = ${user.id} LIMIT 1`
    if (!userRecord[0]) {
      return { error: "User not found" }
    }

    const isPasswordValid = await compare(currentPassword, userRecord[0].password_hash)
    if (!isPasswordValid) {
      return { error: "Current password is incorrect" }
    }

    // Hash the new password
    const passwordHash = await hash(newPassword, 10)

    // Update the password
    try {
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
      `
      return { success: true, message: "Password updated successfully" }
    } catch (error: any) {
      return { error: error.message || "Failed to update password" }
    }
  }

  return { success: true, message: "No changes were made" }
}

