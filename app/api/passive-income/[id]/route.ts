import { NextResponse } from "next/server"
import { getPassiveIncomeById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const passiveIncomeId = Number.parseInt(params.id)
  if (isNaN(passiveIncomeId)) {
    return NextResponse.json({ error: "Invalid passive income ID" }, { status: 400 })
  }

  try {
    const passiveIncome = await getPassiveIncomeById(passiveIncomeId)

    if (!passiveIncome) {
      return NextResponse.json({ error: "Passive income not found" }, { status: 404 })
    }

    return NextResponse.json({ passiveIncome })
  } catch (error) {
    console.error("Error fetching passive income:", error)
    return NextResponse.json({ error: "Failed to fetch passive income" }, { status: 500 })
  }
}

