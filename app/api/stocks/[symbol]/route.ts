import { NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

// This is a simple API to fetch stock data
// In a production environment, you would use a proper financial API
export async function GET(request: NextRequest, { params }: { params: { symbol: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const symbol = params.symbol.toUpperCase()

  try {
    // For demo purposes, we'll use Alpha Vantage API
    // In a real app, you would store the API key in environment variables
    const apiKey = "demo" // Using Alpha Vantage demo key
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch stock data")
    }

    const data = await response.json()

    // Check if we got valid data
    if (data["Error Message"] || !data["Global Quote"] || Object.keys(data["Global Quote"]).length === 0) {
      return NextResponse.json({ error: "Stock not found or API limit reached" }, { status: 404 })
    }

    const quote = data["Global Quote"]

    // Format the response
    const stockData = {
      symbol: quote["01. symbol"],
      price: Number.parseFloat(quote["05. price"]),
      change: Number.parseFloat(quote["09. change"]),
      changePercent: quote["10. change percent"].replace("%", ""),
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({ stock: stockData })
  } catch (error) {
    console.error("Error fetching stock data:", error)
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 })
  }
}

