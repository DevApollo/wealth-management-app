"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Users,
  User,
  LogOut,
  Building,
  CreditCard,
  ChevronDown,
  Car,
  Landmark,
  Bookmark,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User as UserType } from "@/lib/auth"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SidebarNavigationProps {
  user: UserType
}

interface Household {
  id: number
  name: string
}

export function SidebarNavigation({ user }: SidebarNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [households, setHouseholds] = useState<Household[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)

  // Extract the current household ID from the URL if available
  const householdIdFromUrl = pathname.startsWith("/households/") ? pathname.split("/")[2] : null

  useEffect(() => {
    async function fetchHouseholds() {
      try {
        const response = await fetch("/api/households")
        if (response.ok) {
          const data = await response.json()
          setHouseholds(data.households || [])

          // If we have a household ID from the URL, find that household
          if (householdIdFromUrl) {
            const currentHousehold = data.households.find(
              (h: Household) => h.id === Number.parseInt(householdIdFromUrl),
            )
            if (currentHousehold) {
              setSelectedHousehold(currentHousehold)
            }
          } else if (data.households.length > 0) {
            // If no household in URL but we have households, select the first one
            setSelectedHousehold(data.households[0])
          }
        }
      } catch (error) {
        console.error("Failed to fetch households", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholds()
  }, [householdIdFromUrl])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/profile", label: "Profile", icon: User },
  ]

  // Get the active household ID (either from URL or selected)
  const activeHouseholdId = householdIdFromUrl || selectedHousehold?.id?.toString() || null

  // Always show household-specific links if we have a selected household
  const householdNavItems = activeHouseholdId
    ? [
        {
          href: `/households/${activeHouseholdId}/properties`,
          label: "Properties",
          icon: Building,
        },
        {
          href: `/households/${activeHouseholdId}/vehicles`,
          label: "Vehicles",
          icon: Car,
        },
        {
          href: `/households/${activeHouseholdId}/credits`,
          label: "Credits & Liabilities",
          icon: CreditCard,
        },
        {
          href: `/households/${activeHouseholdId}/bank-accounts`,
          label: "Bank Accounts",
          icon: Landmark,
        },
        {
          href: `/households/${activeHouseholdId}/stocks`,
          label: "Stocks",
          icon: TrendingUp,
        },
        {
          href: `/households/${activeHouseholdId}/passive-income`,
          label: "Passive Income",
          icon: DollarSign,
        },
        {
          href: `/households/${activeHouseholdId}/subscriptions`,
          label: "Subscriptions",
          icon: Bookmark,
        },
      ]
    : []

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Household</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">Loading households...</div>
            ) : households.length === 0 ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">No households yet</div>
            ) : (
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton>
                        <Users className="h-4 w-4" />
                        <span className="flex-1 truncate">{selectedHousehold?.name || "Select Household"}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[200px]">
                      {households.map((household) => (
                        <DropdownMenuItem
                          key={household.id}
                          onClick={() => {
                            setSelectedHousehold(household)
                            // If we're already in a household context, navigate to the same page in the new household
                            if (householdIdFromUrl && pathname.includes("/households/")) {
                              const newPath = pathname.replace(
                                `/households/${householdIdFromUrl}`,
                                `/households/${household.id}`,
                              )
                              router.push(newPath)
                            }
                          }}
                        >
                          {household.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                {householdNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.includes(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                  <Link href="/settings">
                    <User className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

