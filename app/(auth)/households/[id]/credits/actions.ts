"use server"

import { getSession } from "@/lib/auth"
import {
  createCredit,
  getHouseholdById,
  getHouseholdMembers,
  getCreditById,
  updateCredit,
  deleteCredit,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Create a new credit
export async function createCreditAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const totalAmount = Number(formData.get("totalAmount"))
  const remainingAmount = Number(formData.get("remainingAmount"))
  const monthlyPayment = Number(formData.get("monthlyPayment"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"

  // Validate inputs
  if (!householdId || !name || isNaN(totalAmount) || isNaN(remainingAmount) || isNaN(monthlyPayment)) {
    return { error: "All required fields must be filled" }
  }

  if (totalAmount <= 0 || remainingAmount < 0 || monthlyPayment <= 0) {
    return { error: "Amount values must be positive numbers" }
  }

  if (remainingAmount > totalAmount) {
    return { error: "Remaining amount cannot be greater than total amount" }
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
    return { error: "You do not have permission to add credits to this household" }
  }

  try {
    const credit = await createCredit(
      householdId,
      name,
      description,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      currency,
      user.id,
    )
    return { success: true, credit }
  } catch (error: any) {
    return { error: error.message || "Failed to create credit" }
  }
}

// Update an existing credit
export async function updateCreditAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const creditId = Number(formData.get("creditId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const totalAmount = Number(formData.get("totalAmount"))
  const remainingAmount = Number(formData.get("remainingAmount"))
  const monthlyPayment = Number(formData.get("monthlyPayment"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"

  // Validate inputs
  if (!creditId || !name || isNaN(totalAmount) || isNaN(remainingAmount) || isNaN(monthlyPayment)) {
    return { error: "All required fields must be filled" }
  }

  if (totalAmount <= 0 || remainingAmount < 0 || monthlyPayment <= 0) {
    return { error: "Amount values must be positive numbers" }
  }

  if (remainingAmount > totalAmount) {
    return { error: "Remaining amount cannot be greater than total amount" }
  }

  // Get the credit
  const credit = await getCreditById(creditId)
  if (!credit) {
    return { error: "Credit not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(credit.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this credit" }
  }

  try {
    const updatedCredit = await updateCredit(
      creditId,
      name,
      description,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      currency,
    )
    return { success: true, credit: updatedCredit }
  } catch (error: any) {
    return { error: error.message || "Failed to update credit" }
  }
}

// Delete a credit
export async function deleteCreditAction(creditId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the credit
  const credit = await getCreditById(creditId)
  if (!credit) {
    return { error: "Credit not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(credit.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this credit" }
  }

  try {
    await deleteCredit(creditId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete credit" }
  }
}

