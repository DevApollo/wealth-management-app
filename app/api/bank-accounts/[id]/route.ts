import { NextResponse } from "next/server"
import { getBankAccountById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bankAccountId = Number.parseInt(params.id)
  if (isNaN(bankAccountId)) {
    return NextResponse.json({ error: "Invalid bank account ID" }, { status: 400 })
  }

  try {
    const bankAccount = await getBankAccountById(bankAccountId)

    if (!bankAccount) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 })
    }

    return NextResponse.json({ bankAccount })
  } catch (error) {
    console.error("Error fetching bank account:", error)
    return NextResponse.json({ error: "Failed to fetch bank account" }, { status: 500 })
  }
}

