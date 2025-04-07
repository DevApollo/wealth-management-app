import { NextResponse } from "next/server"
import { getHouseholdById, getHouseholdMembers } from "@/lib/db"
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
    const household = await getHouseholdById(householdId)

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    // Check if user is a member of this household
    const members = await getHouseholdMembers(householdId)
    const isMember = members.some((member: any) => member.id === user.id)

    if (!isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(household)
  } catch (error) {
    console.error("Error fetching household:", error)
    return NextResponse.json({ error: "Failed to fetch household" }, { status: 500 })
  }
}

