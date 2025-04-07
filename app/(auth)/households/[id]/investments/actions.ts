"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createInvestment, updateInvestment, deleteInvestment } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function addInvestment(householdId: number, formData: FormData) {
  const user = await requireAuth()

  const type = formData.get("type") as string
  const name = formData.get("name") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const currency = formData.get("currency") as string
  const description = (formData.get("description") as string) || null
  const purchaseDateStr = formData.get("purchaseDate") as string
  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null
  const currentValue = formData.get("currentValue") ? Number.parseFloat(formData.get("currentValue") as string) : null

  // Handle type-specific metadata
  const metadata: Record<string, any> = {}

  if (type === "cryptocurrency") {
    metadata.ticker = formData.get("ticker") as string
    metadata.quantity = Number.parseFloat(formData.get("quantity") as string)
    metadata.platform = formData.get("platform") as string
  } else if (type === "business") {
    metadata.ownership = Number.parseFloat(formData.get("ownership") as string)
    metadata.industry = formData.get("industry") as string
    metadata.annualRevenue = formData.get("annualRevenue")
      ? Number.parseFloat(formData.get("annualRevenue") as string)
      : null
  } else if (type === "domain") {
    metadata.domainName = formData.get("domainName") as string
    metadata.registrar = formData.get("registrar") as string
    metadata.expiryDate = formData.get("expiryDate") as string
  } else if (type === "collectible") {
    metadata.category = formData.get("category") as string
    metadata.condition = formData.get("condition") as string
    metadata.authenticity = formData.get("authenticity") as string
  } else if (type === "intellectual_property") {
    metadata.ipType = formData.get("ipType") as string
    metadata.registrationNumber = formData.get("registrationNumber") as string
    metadata.expiryDate = formData.get("expiryDate") as string
  }

  await createInvestment(
    householdId,
    type,
    name,
    amount,
    currency,
    user.id,
    description,
    purchaseDate,
    currentValue,
    metadata,
  )

  revalidatePath(`/households/${householdId}/investments`)
  redirect(`/households/${householdId}/investments`)
}

export async function updateInvestmentAction(id: number, householdId: number, formData: FormData) {
  await requireAuth()

  const type = formData.get("type") as string
  const name = formData.get("name") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const currency = formData.get("currency") as string
  const description = (formData.get("description") as string) || null
  const purchaseDateStr = formData.get("purchaseDate") as string
  const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null
  const currentValue = formData.get("currentValue") ? Number.parseFloat(formData.get("currentValue") as string) : null

  // Handle type-specific metadata
  const metadata: Record<string, any> = {}

  if (type === "cryptocurrency") {
    metadata.ticker = formData.get("ticker") as string
    metadata.quantity = Number.parseFloat(formData.get("quantity") as string)
    metadata.platform = formData.get("platform") as string
  } else if (type === "business") {
    metadata.ownership = Number.parseFloat(formData.get("ownership") as string)
    metadata.industry = formData.get("industry") as string
    metadata.annualRevenue = formData.get("annualRevenue")
      ? Number.parseFloat(formData.get("annualRevenue") as string)
      : null
  } else if (type === "domain") {
    metadata.domainName = formData.get("domainName") as string
    metadata.registrar = formData.get("registrar") as string
    metadata.expiryDate = formData.get("expiryDate") as string
  } else if (type === "collectible") {
    metadata.category = formData.get("category") as string
    metadata.condition = formData.get("condition") as string
    metadata.authenticity = formData.get("authenticity") as string
  } else if (type === "intellectual_property") {
    metadata.ipType = formData.get("ipType") as string
    metadata.registrationNumber = formData.get("registrationNumber") as string
    metadata.expiryDate = formData.get("expiryDate") as string
  }

  await updateInvestment(id, type, name, amount, currency, description, purchaseDate, currentValue, metadata)

  revalidatePath(`/households/${householdId}/investments`)
  redirect(`/households/${householdId}/investments/${id}`)
}

export async function deleteInvestmentAction(id: number, householdId: number) {
  await requireAuth()
  await deleteInvestment(id)
  revalidatePath(`/households/${householdId}/investments`)
  return { success: true }
}

