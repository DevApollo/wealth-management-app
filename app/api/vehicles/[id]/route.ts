import { NextResponse } from "next/server"
import { getVehicleById } from "@/lib/db"
import { apiRequireAuth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await apiRequireAuth(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const vehicleId = Number.parseInt(params.id)
  if (isNaN(vehicleId)) {
    return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
  }

  try {
    const vehicle = await getVehicleById(vehicleId)

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    return NextResponse.json({ vehicle })
  } catch (error) {
    console.error("Error fetching vehicle:", error)
    return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 })
  }
}

