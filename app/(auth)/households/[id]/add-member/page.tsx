"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { addMemberDirectly } from "../../../../actions"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function AddMemberPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)

      const result = await addMemberDirectly(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(true)
        // Clear the form
        event.currentTarget.reset()
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: "Household", href: `/households/${params.id}` },
          { label: "Add Member", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
          <CardDescription>Add a new member directly to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}
            {success && (
              <Alert
                type="success"
                message="Member added successfully! They can now log in with their email address and password."
              />
            )}
            <FormInput label="Name" id="name" placeholder="John Doe" required />
            <FormInput label="Email" id="email" type="email" placeholder="john@example.com" required />
            <FormInput label="Password" id="password" type="password" required />
            <FormInput label="Confirm Password" id="confirmPassword" type="password" required />
            <p className="text-sm text-muted-foreground">
              A new account will be created for this person if they don't already have one. They will be able to log in
              with the email and password you provide.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/households/${params.id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Member"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

