"use server"

import { createHousehold as dbCreateHousehold } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function createHousehold(formData: FormData) {
  const user = await getSession()

  if (!user) {
    throw new Error("Authentication required")
  }

  const name = formData.get("name") as string

  // Validate input
  if (!name) {
    return { error: "Household name is required" }
  }

  try {
    const household = await dbCreateHousehold(name, user.id)
    return { success: true, household }
  } catch (error: any) {
    return { error: error.message || "Failed to create household" }
  }
}

