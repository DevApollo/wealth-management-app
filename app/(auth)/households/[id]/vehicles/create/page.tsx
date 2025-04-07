"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createVehicleAction } from "../actions"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function CreateVehiclePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const currentYear = new Date().getFullYear()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)
      formData.set("currency", currency)

      const result = await createVehicleAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.vehicle) {
        router.push(`/households/${params.id}/vehicles/${result.vehicle.id}`)
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
          { label: "Vehicles", href: `/households/${params.id}/vehicles` },
          { label: "Add Vehicle", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Vehicle</CardTitle>
          <CardDescription>Add a new vehicle to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Model" id="model" placeholder="Toyota Camry" required />

            <FormInput
              label="Year"
              id="year"
              type="number"
              placeholder={currentYear.toString()}
              required
              min="1900"
              max={currentYear + 1}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Sale Price"
                id="salePrice"
                type="number"
                placeholder="25000"
                required
                min="0"
                step="0.01"
              />

              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
            </div>

            <FormInput
              label="Maintenance Costs"
              id="maintenanceCosts"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              defaultValue="0"
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/households/${params.id}/vehicles`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Vehicle"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

