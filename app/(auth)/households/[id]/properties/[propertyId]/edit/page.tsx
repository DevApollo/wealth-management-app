"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updatePropertyAction } from "../../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function EditPropertyPage({
  params,
}: {
  params: { id: string; propertyId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [property, setProperty] = useState<any>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/properties/${params.propertyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch property")
        }
        const data = await response.json()
        setProperty(data.property)
        setCurrency(data.property.currency || "USD")
      } catch (error) {
        setError("Failed to load property details")
      } finally {
        setIsLoadingProperty(false)
      }
    }

    fetchProperty()
  }, [params.propertyId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("propertyId", params.propertyId)
      formData.set("currency", currency)

      const result = await updatePropertyAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/properties/${params.propertyId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProperty) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading property details...</p>
      </div>
    )
  }

  if (!property && !isLoadingProperty) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Property not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/properties`)}>Back to Properties</Button>
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
          { label: "Properties", href: `/households/${params.id}/properties` },
          { label: property.name, href: `/households/${params.id}/properties/${params.propertyId}` },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Property</CardTitle>
          <CardDescription>Update property details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput
              label="Property Name"
              id="name"
              placeholder="Beach House"
              required
              defaultValue={property?.name}
            />

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
                defaultValue={property?.address}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <FormInput
                  id="price"
                  type="number"
                  placeholder="250000"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={property?.price}
                />
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
                  defaultValue={property?.maintenance_amount || 0}
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
                  defaultValue={property?.yearly_tax || 0}
                />
                <p className="text-xs text-muted-foreground">Annual property tax</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/properties/${params.propertyId}`)}
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

