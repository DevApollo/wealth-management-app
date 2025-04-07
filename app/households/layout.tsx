import type React from "react"
import { redirect } from "next/navigation"

export default function HouseholdsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  redirect("/households")
}

