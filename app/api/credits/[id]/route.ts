import { NextResponse } from "next/server"
import { getCreditById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creditId = Number.parseInt(params.id)
  if (isNaN(creditId)) {
    return NextResponse.json({ error: "Invalid credit ID" }, { status: 400 })
  }

  try {
    const credit = await getCreditById(creditId)

    if (!credit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 })
    }

    return NextResponse.json({ credit })
  } catch (error) {
    console.error("Error fetching credit:", error)
    return NextResponse.json({ error: "Failed to fetch credit" }, { status: 500 })
  }
}

