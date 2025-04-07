import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random token for invitations
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString("hex")
}

// Format date to a readable string
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Validate email format
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Currency configuration
export const CURRENCIES = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
  },
  BGN: {
    code: "BGN",
    symbol: "лв",
    name: "Bulgarian Lev",
  },
}

export type CurrencyCode = keyof typeof CURRENCIES

// Format currency values based on the currency code
export function formatCurrency(amount: number, currencyCode: CurrencyCode = "USD") {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Convert amount from one currency to another using the provided rate
export function convertCurrency(amount: number, rate: number): number {
  return amount * rate
}

