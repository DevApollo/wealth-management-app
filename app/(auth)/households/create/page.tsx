"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createHousehold } from "../actions"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function CreateHouseholdPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await createHousehold(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.household) {
        router.push(`/households/${result.household.id}`)
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
          { label: "Create Household", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Create a Household</CardTitle>
          <CardDescription>Create a new household and invite members to join</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <FormInput label="Household Name" id="name" placeholder="My Family" required />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Household"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

