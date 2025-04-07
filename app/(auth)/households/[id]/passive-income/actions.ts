"use server"

import { getSession } from "@/lib/auth"
import {
  createPassiveIncome,
  getHouseholdById,
  getHouseholdMembers,
  getPassiveIncomeById,
  updatePassiveIncome,
  deletePassiveIncome,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Create a new passive income
export async function createPassiveIncomeAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const amount = Number(formData.get("amount"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const frequency = (formData.get("frequency") as string) || "monthly"
  const category = (formData.get("category") as string) || null
  const isTaxable = formData.get("isTaxable") === "true"

  // Parse dates if provided
  const startDateStr = formData.get("startDate") as string
  const startDate = startDateStr ? new Date(startDateStr) : null

  const endDateStr = formData.get("endDate") as string
  const endDate = endDateStr ? new Date(endDateStr) : null

  // Validate inputs
  if (!householdId || !name || isNaN(amount) || amount <= 0) {
    return { error: "Name and amount are required" }
  }

  // Check if the household exists
  const household = await getHouseholdById(householdId)
  if (!household) {
    return { error: "Household not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(householdId)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to add passive income to this household" }
  }

  try {
    const passiveIncome = await createPassiveIncome(
      householdId,
      name,
      amount,
      frequency,
      currency,
      user.id,
      description,
      category,
      isTaxable,
      startDate,
      endDate,
    )
    return { success: true, passiveIncome }
  } catch (error: any) {
    return { error: error.message || "Failed to create passive income" }
  }
}

// Update an existing passive income
export async function updatePassiveIncomeAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const passiveIncomeId = Number(formData.get("passiveIncomeId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const amount = Number(formData.get("amount"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const frequency = (formData.get("frequency") as string) || "monthly"
  const category = (formData.get("category") as string) || null
  const isTaxable = formData.get("isTaxable") === "true"

  // Parse dates if provided
  const startDateStr = formData.get("startDate") as string
  const startDate = startDateStr ? new Date(startDateStr) : null

  const endDateStr = formData.get("endDate") as string
  const endDate = endDateStr ? new Date(endDateStr) : null

  // Validate inputs
  if (!passiveIncomeId || !name || isNaN(amount) || amount <= 0) {
    return { error: "Name and amount are required" }
  }

  // Get the passive income
  const passiveIncome = await getPassiveIncomeById(passiveIncomeId)
  if (!passiveIncome) {
    return { error: "Passive income not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(passiveIncome.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this passive income" }
  }

  try {
    const updatedPassiveIncome = await updatePassiveIncome(
      passiveIncomeId,
      name,
      amount,
      frequency,
      currency,
      description,
      category,
      isTaxable,
      startDate,
      endDate,
    )
    return { success: true, passiveIncome: updatedPassiveIncome }
  } catch (error: any) {
    return { error: error.message || "Failed to update passive income" }
  }
}

// Delete a passive income
export async function deletePassiveIncomeAction(passiveIncomeId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the passive income
  const passiveIncome = await getPassiveIncomeById(passiveIncomeId)
  if (!passiveIncome) {
    return { error: "Passive income not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(passiveIncome.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this passive income" }
  }

  try {
    await deletePassiveIncome(passiveIncomeId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete passive income" }
  }
}

