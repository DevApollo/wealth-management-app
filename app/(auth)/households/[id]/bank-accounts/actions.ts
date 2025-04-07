"use server"

import { getSession } from "@/lib/auth"
import {
  createBankAccount,
  getHouseholdById,
  getHouseholdMembers,
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Update the createBankAccountAction function to include interest_rate
export async function createBankAccountAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const name = formData.get("name") as string
  const bankName = formData.get("bankName") as string
  const amount = Number(formData.get("amount"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const interestRateStr = formData.get("interestRate") as string
  const interestRate = interestRateStr ? Number(interestRateStr) : 0

  // Validate inputs
  if (!householdId || !name || !bankName || isNaN(amount)) {
    return { error: "All required fields must be filled" }
  }

  if (isNaN(interestRate) || interestRate < 0) {
    return { error: "Interest rate must be a positive number or zero" }
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
    return { error: "You do not have permission to add bank accounts to this household" }
  }

  try {
    const bankAccount = await createBankAccount(householdId, name, bankName, amount, currency, user.id, interestRate)
    return { success: true, bankAccount }
  } catch (error: any) {
    return { error: error.message || "Failed to create bank account" }
  }
}

// Update the updateBankAccountAction function to include interest_rate
export async function updateBankAccountAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const bankAccountId = Number(formData.get("bankAccountId"))
  const name = formData.get("name") as string
  const bankName = formData.get("bankName") as string
  const amount = Number(formData.get("amount"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const interestRateStr = formData.get("interestRate") as string
  const interestRate = interestRateStr ? Number(interestRateStr) : 0

  // Validate inputs
  if (!bankAccountId || !name || !bankName || isNaN(amount)) {
    return { error: "All required fields must be filled" }
  }

  if (isNaN(interestRate) || interestRate < 0) {
    return { error: "Interest rate must be a positive number or zero" }
  }

  // Get the bank account
  const bankAccount = await getBankAccountById(bankAccountId)
  if (!bankAccount) {
    return { error: "Bank account not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(bankAccount.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this bank account" }
  }

  try {
    const updatedBankAccount = await updateBankAccount(bankAccountId, name, bankName, amount, currency, interestRate)
    return { success: true, bankAccount: updatedBankAccount }
  } catch (error: any) {
    return { error: error.message || "Failed to update bank account" }
  }
}

// Delete a bank account
export async function deleteBankAccountAction(bankAccountId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the bank account
  const bankAccount = await getBankAccountById(bankAccountId)
  if (!bankAccount) {
    return { error: "Bank account not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(bankAccount.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this bank account" }
  }

  try {
    await deleteBankAccount(bankAccountId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete bank account" }
  }
}

