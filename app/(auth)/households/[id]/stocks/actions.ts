"use server"

import { getSession } from "@/lib/auth"
import { createStock, getHouseholdById, getHouseholdMembers, getStockById, updateStock, deleteStock } from "@/lib/db"

// Create a new stock
export async function createStockAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const symbol = formData.get("symbol") as string
  const companyName = formData.get("companyName") as string
  const shares = Number(formData.get("shares"))

  // Optional fields
  const currentPriceStr = formData.get("currentPrice") as string
  const currentPrice = currentPriceStr ? Number(currentPriceStr) : null

  const purchasePriceStr = formData.get("purchasePrice") as string
  const purchasePrice = purchasePriceStr ? Number(purchasePriceStr) : null

  const purchaseDateStr = formData.get("purchaseDate") as string
  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null

  const dividendYieldStr = formData.get("dividendYield") as string
  const dividendYield = dividendYieldStr ? Number(dividendYieldStr) : null

  const dividendFrequency = (formData.get("dividendFrequency") as string) || null
  const notes = (formData.get("notes") as string) || null

  // Validate inputs
  if (!householdId || !symbol || isNaN(shares) || shares <= 0) {
    return { error: "Stock symbol and number of shares are required" }
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
    return { error: "You do not have permission to add stocks to this household" }
  }

  try {
    const stock = await createStock(
      householdId,
      symbol,
      companyName,
      shares,
      currentPrice,
      purchasePrice,
      purchaseDate,
      dividendYield,
      dividendFrequency,
      notes,
      user.id,
    )
    return { success: true, stock }
  } catch (error: any) {
    return { error: error.message || "Failed to create stock" }
  }
}

// Update an existing stock
export async function updateStockAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const stockId = Number(formData.get("stockId"))
  const symbol = formData.get("symbol") as string
  const companyName = formData.get("companyName") as string
  const shares = Number(formData.get("shares"))

  // Optional fields
  const currentPriceStr = formData.get("currentPrice") as string
  const currentPrice = currentPriceStr ? Number(currentPriceStr) : null

  const purchasePriceStr = formData.get("purchasePrice") as string
  const purchasePrice = purchasePriceStr ? Number(purchasePriceStr) : null

  const purchaseDateStr = formData.get("purchaseDate") as string
  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null

  const dividendYieldStr = formData.get("dividendYield") as string
  const dividendYield = dividendYieldStr ? Number(dividendYieldStr) : null

  const dividendFrequency = (formData.get("dividendFrequency") as string) || null
  const notes = (formData.get("notes") as string) || null

  // Validate inputs
  if (!stockId || !symbol || isNaN(shares) || shares <= 0) {
    return { error: "Stock symbol and number of shares are required" }
  }

  // Get the stock
  const stock = await getStockById(stockId)
  if (!stock) {
    return { error: "Stock not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(stock.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this stock" }
  }

  try {
    const updatedStock = await updateStock(
      stockId,
      symbol,
      companyName,
      shares,
      currentPrice,
      purchasePrice,
      purchaseDate,
      dividendYield,
      dividendFrequency,
      notes,
    )
    return { success: true, stock: updatedStock }
  } catch (error: any) {
    return { error: error.message || "Failed to update stock" }
  }
}

// Delete a stock
export async function deleteStockAction(stockId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the stock
  const stock = await getStockById(stockId)
  if (!stock) {
    return { error: "Stock not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(stock.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this stock" }
  }

  try {
    await deleteStock(stockId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete stock" }
  }
}

