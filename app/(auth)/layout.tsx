import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { requireAuth } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  const user = await requireAuth()

  return (
    <SidebarProvider>
      <SidebarNavigation user={user} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Household Manager</h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

