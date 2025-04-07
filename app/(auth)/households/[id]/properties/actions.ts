"use server"

import { getSession } from "@/lib/auth"
import {
  createProperty,
  getHouseholdById,
  getHouseholdMembers,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Create a new property
export async function createPropertyAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const price = Number(formData.get("price"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const maintenanceAmount = Number(formData.get("maintenanceAmount") || 0)
  const yearlyTax = Number(formData.get("yearlyTax") || 0)

  // Validate inputs
  if (!householdId || !name || !address || isNaN(price)) {
    return { error: "All fields are required" }
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
    return { error: "You do not have permission to add properties to this household" }
  }

  try {
    const property = await createProperty(
      householdId,
      name,
      address,
      price,
      currency,
      user.id,
      maintenanceAmount,
      yearlyTax,
    )
    return { success: true, property }
  } catch (error: any) {
    return { error: error.message || "Failed to create property" }
  }
}

// Update an existing property
export async function updatePropertyAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const propertyId = Number(formData.get("propertyId"))
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const price = Number(formData.get("price"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const maintenanceAmount = Number(formData.get("maintenanceAmount") || 0)
  const yearlyTax = Number(formData.get("yearlyTax") || 0)

  // Validate inputs
  if (!propertyId || !name || !address || isNaN(price)) {
    return { error: "All fields are required" }
  }

  // Get the property
  const property = await getPropertyById(propertyId)
  if (!property) {
    return { error: "Property not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(property.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this property" }
  }

  try {
    const updatedProperty = await updateProperty(
      propertyId,
      name,
      address,
      price,
      currency,
      maintenanceAmount,
      yearlyTax,
    )
    return { success: true, property: updatedProperty }
  } catch (error: any) {
    return { error: error.message || "Failed to update property" }
  }
}

// Delete a property
export async function deletePropertyAction(propertyId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the property
  const property = await getPropertyById(propertyId)
  if (!property) {
    return { error: "Property not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(property.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this property" }
  }

  try {
    await deleteProperty(propertyId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete property" }
  }
}

