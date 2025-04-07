import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"

export default async function ProfilePage() {
  await requireAuth()
  redirect("/settings")
}

