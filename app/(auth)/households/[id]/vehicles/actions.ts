"use server"

import { getSession } from "@/lib/auth"
import {
  createVehicle,
  getHouseholdById,
  getHouseholdMembers,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Create a new vehicle
export async function createVehicleAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const model = formData.get("model") as string
  const year = Number(formData.get("year"))
  const salePrice = Number(formData.get("salePrice"))
  const maintenanceCosts = Number(formData.get("maintenanceCosts") || 0)
  const currency = (formData.get("currency") as CurrencyCode) || "USD"

  // Validate inputs
  if (!householdId || !model || isNaN(year) || isNaN(salePrice)) {
    return { error: "All required fields must be filled" }
  }

  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return { error: "Please enter a valid year" }
  }

  if (salePrice < 0 || maintenanceCosts < 0) {
    return { error: "Price values must be positive numbers" }
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
    return { error: "You do not have permission to add vehicles to this household" }
  }

  try {
    const vehicle = await createVehicle(householdId, model, year, salePrice, maintenanceCosts, currency, user.id)
    return { success: true, vehicle }
  } catch (error: any) {
    return { error: error.message || "Failed to create vehicle" }
  }
}

// Update an existing vehicle
export async function updateVehicleAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const vehicleId = Number(formData.get("vehicleId"))
  const model = formData.get("model") as string
  const year = Number(formData.get("year"))
  const salePrice = Number(formData.get("salePrice"))
  const maintenanceCosts = Number(formData.get("maintenanceCosts") || 0)
  const currency = (formData.get("currency") as CurrencyCode) || "USD"

  // Validate inputs
  if (!vehicleId || !model || isNaN(year) || isNaN(salePrice)) {
    return { error: "All required fields must be filled" }
  }

  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return { error: "Please enter a valid year" }
  }

  if (salePrice < 0 || maintenanceCosts < 0) {
    return { error: "Price values must be positive numbers" }
  }

  // Get the vehicle
  const vehicle = await getVehicleById(vehicleId)
  if (!vehicle) {
    return { error: "Vehicle not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(vehicle.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this vehicle" }
  }

  try {
    const updatedVehicle = await updateVehicle(vehicleId, model, year, salePrice, maintenanceCosts, currency)
    return { success: true, vehicle: updatedVehicle }
  } catch (error: any) {
    return { error: error.message || "Failed to update vehicle" }
  }
}

// Delete a vehicle
export async function deleteVehicleAction(vehicleId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the vehicle
  const vehicle = await getVehicleById(vehicleId)
  if (!vehicle) {
    return { error: "Vehicle not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(vehicle.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this vehicle" }
  }

  try {
    await deleteVehicle(vehicleId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete vehicle" }
  }
}

