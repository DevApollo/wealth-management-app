"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createPropertyAction } from "../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function CreatePropertyPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)
      formData.set("currency", currency)

      const result = await createPropertyAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.property) {
        router.push(`/households/${params.id}/properties/${result.property.id}`)
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
          { label: "Properties", href: `/households/${params.id}/properties` },
          { label: "Add Property", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Property</CardTitle>
          <CardDescription>Add a new property to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Property Name" id="name" placeholder="Beach House" required />

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                id="address"
                name="address"
                placeholder="123 Main St, City, State, ZIP"
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <FormInput id="price" type="number" placeholder="250000" required min="0" step="0.01" />
              </div>

              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="maintenanceAmount" className="text-sm font-medium">
                  Monthly Maintenance
                </label>
                <FormInput
                  id="maintenanceAmount"
                  name="maintenanceAmount"
                  type="number"
                  placeholder="200"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
                <p className="text-xs text-muted-foreground">Monthly maintenance cost</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="yearlyTax" className="text-sm font-medium">
                  Yearly Tax
                </label>
                <FormInput
                  id="yearlyTax"
                  name="yearlyTax"
                  type="number"
                  placeholder="1200"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
                <p className="text-xs text-muted-foreground">Annual property tax</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/households/${params.id}/properties`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Property"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

