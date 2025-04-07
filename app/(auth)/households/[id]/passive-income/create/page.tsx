"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createPassiveIncomeAction } from "../actions"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function CreatePassiveIncomePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [frequency, setFrequency] = useState("monthly")
  const [category, setCategory] = useState<string | null>(null)
  const [isTaxable, setIsTaxable] = useState(true)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)
      formData.set("currency", currency)
      formData.set("frequency", frequency)
      if (category) formData.set("category", category)
      formData.set("isTaxable", isTaxable.toString())

      const result = await createPassiveIncomeAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.passiveIncome) {
        router.push(`/households/${params.id}/passive-income/${result.passiveIncome.id}`)
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
          { label: "Passive Income", href: `/households/${params.id}/passive-income` },
          { label: "Add Passive Income", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Passive Income</CardTitle>
          <CardDescription>Add a new passive income source to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Income Name" id="name" placeholder="Disability Benefits" required />

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Monthly disability payment from Social Security"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Amount" id="amount" type="number" placeholder="1500" required min="0.01" step="0.01" />

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
                <label htmlFor="frequency" className="text-sm font-medium">
                  Payment Frequency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <Select value={category || ""} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    <SelectItem value="disability">Disability</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="pension">Pension</SelectItem>
                    <SelectItem value="royalty">Royalty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Start Date" id="startDate" type="date" placeholder="Start date (optional)" />

              <FormInput label="End Date" id="endDate" type="date" placeholder="End date (optional)" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTaxable"
                checked={isTaxable}
                onCheckedChange={(checked) => setIsTaxable(checked as boolean)}
              />
              <Label htmlFor="isTaxable">This income is taxable</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/passive-income`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Passive Income"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

