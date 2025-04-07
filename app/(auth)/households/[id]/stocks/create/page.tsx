"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createStockAction } from "../actions"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateStockPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [symbol, setSymbol] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [dividendFrequency, setDividendFrequency] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)

      // Add company name if available
      if (companyName) {
        formData.append("companyName", companyName)
      }

      // Add dividend frequency if selected
      if (dividendFrequency) {
        formData.append("dividendFrequency", dividendFrequency)
      }

      const result = await createStockAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.stock) {
        router.push(`/households/${params.id}/stocks/${result.stock.id}`)
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
          { label: "Stocks", href: `/households/${params.id}/stocks` },
          { label: "Add Stock", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Stock</CardTitle>
          <CardDescription>Add a new stock to your portfolio</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <div className="space-y-2">
              <label htmlFor="symbol" className="text-sm font-medium">
                Stock Symbol
                <span className="text-red-500 ml-1">*</span>
              </label>
              <FormInput
                id="symbol"
                placeholder="AAPL"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">Enter the stock ticker symbol (e.g., AAPL for Apple)</p>
            </div>

            <FormInput
              label="Company Name"
              id="companyName"
              placeholder="Apple Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <FormInput
              label="Number of Shares"
              id="shares"
              type="number"
              placeholder="10"
              required
              min="0.000001"
              step="any"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Current Price (per share)"
                id="currentPrice"
                type="number"
                placeholder="150.00"
                min="0"
                step="0.01"
              />

              <FormInput
                label="Purchase Price (per share)"
                id="purchasePrice"
                type="number"
                placeholder="150.00"
                min="0"
                step="0.01"
              />
            </div>

            <FormInput label="Purchase Date" id="purchaseDate" type="date" />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Dividend Yield (%)"
                id="dividendYield"
                type="number"
                placeholder="2.5"
                min="0"
                step="0.01"
              />

              <div className="space-y-2">
                <label htmlFor="dividendFrequency" className="text-sm font-medium">
                  Dividend Frequency
                </label>
                <Select value={dividendFrequency || ""} onValueChange={setDividendFrequency}>
                  <SelectTrigger id="dividendFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any notes about this stock investment"
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push(`/households/${params.id}/stocks`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Stock"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

