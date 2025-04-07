"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updateVehicleAction } from "../../actions"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function EditVehiclePage({
  params,
}: {
  params: { id: string; vehicleId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    async function fetchVehicle() {
      try {
        const response = await fetch(`/api/vehicles/${params.vehicleId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch vehicle")
        }
        const data = await response.json()
        setVehicle(data.vehicle)
        setCurrency(data.vehicle.currency || "USD")
      } catch (error) {
        setError("Failed to load vehicle details")
      } finally {
        setIsLoadingVehicle(false)
      }
    }

    fetchVehicle()
  }, [params.vehicleId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("vehicleId", params.vehicleId)
      formData.set("currency", currency)

      const result = await updateVehicleAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/vehicles/${params.vehicleId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingVehicle) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading vehicle details...</p>
      </div>
    )
  }

  if (!vehicle && !isLoadingVehicle) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Vehicle not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/vehicles`)}>Back to Vehicles</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: "Household", href: `/households/${params.id}` },
          { label: "Vehicles", href: `/households/${params.id}/vehicles` },
          {
            label: `${vehicle.model} (${vehicle.year})`,
            href: `/households/${params.id}/vehicles/${params.vehicleId}`,
          },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Vehicle</CardTitle>
          <CardDescription>Update vehicle details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Model" id="model" placeholder="Toyota Camry" required defaultValue={vehicle?.model} />

            <FormInput
              label="Year"
              id="year"
              type="number"
              placeholder={currentYear.toString()}
              required
              min="1900"
              max={currentYear + 1}
              defaultValue={vehicle?.year}
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
                defaultValue={vehicle?.sale_price}
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
              defaultValue={vehicle?.maintenance_costs}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/vehicles/${params.vehicleId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

