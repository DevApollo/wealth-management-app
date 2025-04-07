import { NextResponse } from "next/server"
import { getHouseholdsByUserId } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const households = await getHouseholdsByUserId(user.id)
    return NextResponse.json({ households })
  } catch (error) {
    console.error("Error fetching households:", error)
    return NextResponse.json({ error: "Failed to fetch households" }, { status: 500 })
  }
}

