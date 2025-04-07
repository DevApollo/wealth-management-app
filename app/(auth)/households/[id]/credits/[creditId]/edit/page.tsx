"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updateCreditAction } from "../../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"

export default function EditCreditPage({
  params,
}: {
  params: { id: string; creditId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credit, setCredit] = useState<any>(null)
  const [isLoadingCredit, setIsLoadingCredit] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  useEffect(() => {
    async function fetchCredit() {
      try {
        const response = await fetch(`/api/credits/${params.creditId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch credit")
        }
        const data = await response.json()
        setCredit(data.credit)
        setCurrency(data.credit.currency || "USD")
      } catch (error) {
        setError("Failed to load credit details")
      } finally {
        setIsLoadingCredit(false)
      }
    }

    fetchCredit()
  }, [params.creditId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("creditId", params.creditId)
      formData.set("currency", currency)

      const result = await updateCreditAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/credits/${params.creditId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingCredit) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading credit details...</p>
      </div>
    )
  }

  if (!credit && !isLoadingCredit) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Credit not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/credits`)}>Back to Credits</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Credit</CardTitle>
          <CardDescription>Update credit details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Name" id="name" placeholder="Mortgage" required defaultValue={credit?.name} />

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Home mortgage from Bank XYZ"
                className="min-h-[80px]"
                defaultValue={credit?.description || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Total Amount"
                id="totalAmount"
                type="number"
                placeholder="250000"
                required
                min="0"
                step="0.01"
                defaultValue={credit?.total_amount}
              />

              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Remaining Amount"
                id="remainingAmount"
                type="number"
                placeholder="200000"
                required
                min="0"
                step="0.01"
                defaultValue={credit?.remaining_amount}
              />

              <FormInput
                label="Monthly Payment"
                id="monthlyPayment"
                type="number"
                placeholder="1500"
                required
                min="0"
                step="0.01"
                defaultValue={credit?.monthly_payment}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/credits/${params.creditId}`)}
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

