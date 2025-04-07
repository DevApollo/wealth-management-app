"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updateStockAction } from "../../actions"
import { Textarea } from "@/components/ui/textarea"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditStockPage({
  params,
}: {
  params: { id: string; stockId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stock, setStock] = useState<any>(null)
  const [isLoadingStock, setIsLoadingStock] = useState(true)
  const [dividendFrequency, setDividendFrequency] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStock() {
      try {
        const response = await fetch(`/api/stocks/id/${params.stockId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch stock")
        }
        const data = await response.json()
        setStock(data.stock)
        setDividendFrequency(data.stock.dividend_frequency || null)
      } catch (error) {
        setError("Failed to load stock details")
      } finally {
        setIsLoadingStock(false)
      }
    }

    fetchStock()
  }, [params.stockId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("stockId", params.stockId)

      // Add dividend frequency if selected
      if (dividendFrequency) {
        formData.append("dividendFrequency", dividendFrequency)
      }

      const result = await updateStockAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/stocks/${params.stockId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingStock) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading stock details...</p>
      </div>
    )
  }

  if (!stock && !isLoadingStock) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Stock not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/stocks`)}>Back to Stocks</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Format the purchase date for the date input
  const purchaseDate = stock.purchase_date ? new Date(stock.purchase_date).toISOString().split("T")[0] : ""

  return (
    <div className="max-w-md mx-auto">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: "Household", href: `/households/${params.id}` },
          { label: "Stocks", href: `/households/${params.id}/stocks` },
          { label: stock.symbol, href: `/households/${params.id}/stocks/${params.stockId}` },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Stock</CardTitle>
          <CardDescription>Update stock details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <div className="space-y-2">
              <label htmlFor="symbol" className="text-sm font-medium">
                Stock Symbol
                <span className="text-red-500 ml-1">*</span>
              </label>
              <FormInput id="symbol" placeholder="AAPL" required defaultValue={stock.symbol} className="uppercase" />
            </div>

            <FormInput
              label="Company Name"
              id="companyName"
              placeholder="Apple Inc."
              defaultValue={stock.company_name || ""}
            />

            <FormInput
              label="Number of Shares"
              id="shares"
              type="number"
              placeholder="10"
              required
              min="0.000001"
              step="any"
              defaultValue={stock.shares}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Current Price (per share)"
                id="currentPrice"
                type="number"
                placeholder="150.00"
                min="0"
                step="0.01"
                defaultValue={stock.current_price || ""}
              />

              <FormInput
                label="Purchase Price (per share)"
                id="purchasePrice"
                type="number"
                placeholder="150.00"
                min="0"
                step="0.01"
                defaultValue={stock.purchase_price || ""}
              />
            </div>

            <FormInput label="Purchase Date" id="purchaseDate" type="date" defaultValue={purchaseDate} />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Dividend Yield (%)"
                id="dividendYield"
                type="number"
                placeholder="2.5"
                min="0"
                step="0.01"
                defaultValue={stock.dividend_yield || ""}
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
                defaultValue={stock.notes || ""}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/stocks/${params.stockId}`)}
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

