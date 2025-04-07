"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createSubscriptionAction } from "../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateSubscriptionPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [priority, setPriority] = useState("medium")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)
      formData.set("currency", currency)
      formData.set("billingCycle", billingCycle)
      formData.set("priority", priority)

      const result = await createSubscriptionAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.subscription) {
        router.push(`/households/${params.id}/subscriptions/${result.subscription.id}`)
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
          { label: "Subscriptions", href: `/households/${params.id}/subscriptions` },
          { label: "Add Subscription", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Subscription</CardTitle>
          <CardDescription>Add a new subscription to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Subscription Name" id="name" placeholder="Netflix" required />

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Family streaming plan"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Price" id="price" type="number" placeholder="9.99" required min="0.01" step="0.01" />

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
                <label htmlFor="billingCycle" className="text-sm font-medium">
                  Billing Cycle
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger id="billingCycle">
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/subscriptions`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Subscription"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

