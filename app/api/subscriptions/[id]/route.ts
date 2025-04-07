import { NextResponse } from "next/server"
import { getSubscriptionById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscriptionId = Number.parseInt(params.id)
  if (isNaN(subscriptionId)) {
    return NextResponse.json({ error: "Invalid subscription ID" }, { status: 400 })
  }

  try {
    const subscription = await getSubscriptionById(subscriptionId)

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}

