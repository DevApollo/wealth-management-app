import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth"
import { acceptInvitation, rejectInvitation, getInvitationByToken } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token

  try {
    const invitation = await getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve invitation" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token
  const user = await apiRequireAuth(request)

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    const { action } = await request.json()

    if (action === "accept") {
      await acceptInvitation(token, user.id)
      return NextResponse.json({ success: true, action: "accepted" })
    } else if (action === "reject") {
      await rejectInvitation(token)
      return NextResponse.json({ success: true, action: "rejected" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process invitation" }, { status: 500 })
  }
}

