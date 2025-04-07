"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Home, LogOut, Menu, User, Users, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// Form components
export function FormInput({
  label,
  id,
  type = "text",
  placeholder,
  required = false,
  error,
  ...props
}: {
  label: string
  id: string
  type?: string
  placeholder?: string
  required?: boolean
  error?: string
  [key: string]: any
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className={cn(error && "border-red-500")}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// Mobile navigation
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

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
    { href: "/households", label: "Households", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <nav className="fixed inset-0 flex flex-col items-center justify-center space-y-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
                  )}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            <Button
              variant="ghost"
              className="flex items-center text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={() => {
                handleLogout()
                setIsOpen(false)
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}

// Desktop navigation
export function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()

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
    { href: "/households", label: "Households", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        )
      })}

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </nav>
  )
}

// Alert component
export function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={cn(
        "p-4 rounded-md flex items-start space-x-3",
        type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      )}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <div className="flex-1">{message}</div>
    </div>
  )
}

// Invitation card component
export function InvitationCard({
  invitation,
  onAccept,
  onReject,
  isLoading,
}: {
  invitation: any
  onAccept: () => void
  onReject: () => void
  isLoading: boolean
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Invitation to join {invitation.household_name}</CardTitle>
        <CardDescription>
          You were invited by {invitation.invited_by_name} on {new Date(invitation.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onReject} disabled={isLoading}>
          Decline
        </Button>
        <Button onClick={onAccept} disabled={isLoading}>
          {isLoading ? "Processing..." : "Accept"}
        </Button>
      </CardFooter>
    </Card>
  )
}

