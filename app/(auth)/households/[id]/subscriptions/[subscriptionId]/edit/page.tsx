"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updateSubscriptionAction } from "../../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditSubscriptionPage({
  params,
}: {
  params: { id: string; subscriptionId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [priority, setPriority] = useState("medium")

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch(`/api/subscriptions/${params.subscriptionId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch subscription")
        }
        const data = await response.json()
        setSubscription(data.subscription)
        setCurrency(data.subscription.currency || "USD")
        setBillingCycle(data.subscription.billing_cycle || "monthly")
        setPriority(data.subscription.priority || "medium")
      } catch (error) {
        setError("Failed to load subscription details")
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    fetchSubscription()
  }, [params.subscriptionId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("subscriptionId", params.subscriptionId)
      formData.set("currency", currency)
      formData.set("billingCycle", billingCycle)
      formData.set("priority", priority)

      const result = await updateSubscriptionAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/subscriptions/${params.subscriptionId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSubscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading subscription details...</p>
      </div>
    )
  }

  if (!subscription && !isLoadingSubscription) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Subscription not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/subscriptions`)}>
                Back to Subscriptions
              </Button>
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
          { label: "Subscriptions", href: `/households/${params.id}/subscriptions` },
          { label: subscription.name, href: `/households/${params.id}/subscriptions/${params.subscriptionId}` },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Subscription</CardTitle>
          <CardDescription>Update subscription details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput
              label="Subscription Name"
              id="name"
              placeholder="Netflix"
              required
              defaultValue={subscription?.name}
            />

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Family streaming plan"
                className="min-h-[80px]"
                defaultValue={subscription?.description || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Price"
                id="price"
                type="number"
                placeholder="9.99"
                required
                min="0.01"
                step="0.01"
                defaultValue={subscription?.price}
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
              onClick={() => router.push(`/households/${params.id}/subscriptions/${params.subscriptionId}`)}
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

