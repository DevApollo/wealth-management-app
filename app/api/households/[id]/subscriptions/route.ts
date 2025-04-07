import { NextResponse } from "next/server"
import { getSubscriptionsByHouseholdId } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const householdId = Number.parseInt(params.id)
  if (isNaN(householdId)) {
    return NextResponse.json({ error: "Invalid household ID" }, { status: 400 })
  }

  try {
    const subscriptions = await getSubscriptionsByHouseholdId(householdId)
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

