import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { deleteInvestment, getInvestmentById } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const investmentId = Number.parseInt(params.id)

    // Check if investment exists
    const investment = await getInvestmentById(investmentId)
    if (!investment) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 })
    }

    // Delete the investment
    await deleteInvestment(investmentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting investment:", error)
    return NextResponse.json({ error: "Failed to delete investment" }, { status: 500 })
  }
}

