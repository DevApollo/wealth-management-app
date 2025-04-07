import type React from "react"
import { redirect } from "next/navigation"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  redirect("/profile")
}

