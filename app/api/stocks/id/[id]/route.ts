import { NextResponse } from "next/server"
import { getStockById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stockId = Number.parseInt(params.id)
  if (isNaN(stockId)) {
    return NextResponse.json({ error: "Invalid stock ID" }, { status: 400 })
  }

  try {
    const stock = await getStockById(stockId)

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
    }

    return NextResponse.json({ stock })
  } catch (error) {
    console.error("Error fetching stock:", error)
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 })
  }
}

