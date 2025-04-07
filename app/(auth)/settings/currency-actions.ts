"use server"

import { getSession } from "@/lib/auth"
import { updateUserDefaultCurrency, getCurrencyRates, updateCurrencyRate, getUserDefaultCurrency } from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

export async function updateDefaultCurrency(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const currency = formData.get("defaultCurrency") as CurrencyCode

  if (!currency) {
    return { error: "Currency is required" }
  }

  try {
    await updateUserDefaultCurrency(user.id, currency)
    return { success: true, message: "Default currency updated successfully" }
  } catch (error: any) {
    return { error: error.message || "Failed to update default currency" }
  }
}

export async function updateExchangeRate(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const fromCurrency = formData.get("fromCurrency") as CurrencyCode
  const toCurrency = formData.get("toCurrency") as CurrencyCode
  const rate = Number.parseFloat(formData.get("rate") as string)

  if (!fromCurrency || !toCurrency || isNaN(rate)) {
    return { error: "All fields are required and rate must be a valid number" }
  }

  if (fromCurrency === toCurrency) {
    return { error: "From and To currencies cannot be the same" }
  }

  if (rate <= 0) {
    return { error: "Rate must be greater than zero" }
  }

  try {
    await updateCurrencyRate(fromCurrency, toCurrency, rate, user.id)

    // Also update the inverse rate for convenience
    const inverseRate = 1 / rate
    await updateCurrencyRate(toCurrency, fromCurrency, inverseRate, user.id)

    return { success: true, message: "Exchange rate updated successfully" }
  } catch (error: any) {
    return { error: error.message || "Failed to update exchange rate" }
  }
}

export async function getUserCurrencySettings() {
  const user = await getSession()
  if (!user) {
    throw new Error("Authentication required")
  }

  const defaultCurrency = await getUserDefaultCurrency(user.id)
  const currencyRates = await getCurrencyRates()

  return {
    defaultCurrency,
    currencyRates,
  }
}

