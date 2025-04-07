"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateInvestmentAction } from "../actions"
import { InvestmentTypeSelector } from "@/components/investment-type-selector"
import { CurrencySelector } from "@/components/currency-selector"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import type { CurrencyCode } from "@/lib/utils"

interface EditInvestmentFormProps {
  householdId: number
  investment: any
  defaultCurrency: CurrencyCode
}

export function EditInvestmentForm({ householdId, investment, defaultCurrency }: EditInvestmentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [investmentType, setInvestmentType] = useState(investment.type)
  const [currency, setCurrency] = useState<CurrencyCode>(investment.currency || defaultCurrency)

  // Parse metadata
  const metadata = typeof investment.metadata === "string" ? JSON.parse(investment.metadata) : investment.metadata || {}

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("type", investmentType)
      formData.set("currency", currency)

      await updateInvestmentAction(investment.id, householdId, formData)
    } catch (err) {
      console.error("Error updating investment:", err)
      setError("Failed to update investment. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Format date for input
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <Alert type="error" message={error} />}

      <div className="space-y-4">
        <Label>Investment Type</Label>
        <InvestmentTypeSelector value={investmentType} onChange={setInvestmentType} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Investment Name"
          id="name"
          placeholder="Enter a name for this investment"
          required
          defaultValue={investment.name}
        />

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <CurrencySelector id="currency" value={currency} onChange={(value) => setCurrency(value as CurrencyCode)} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Purchase Amount"
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          required
          defaultValue={investment.amount}
        />

        <FormInput
          label="Current Value (optional)"
          id="currentValue"
          type="number"
          step="0.01"
          placeholder="0.00"
          defaultValue={investment.current_value || ""}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Purchase Date (optional)"
          id="purchaseDate"
          type="date"
          defaultValue={formatDateForInput(investment.purchase_date)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Add details about this investment"
          rows={3}
          defaultValue={investment.description || ""}
        />
      </div>

      {/* Dynamic fields based on investment type */}
      {investmentType === "cryptocurrency" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Cryptocurrency Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="Ticker Symbol"
              id="ticker"
              placeholder="BTC"
              required
              defaultValue={metadata.ticker || ""}
            />
            <FormInput
              label="Quantity"
              id="quantity"
              type="number"
              step="any"
              placeholder="0.00"
              required
              defaultValue={metadata.quantity || ""}
            />
            <FormInput
              label="Platform/Exchange"
              id="platform"
              placeholder="Coinbase, Binance, etc."
              defaultValue={metadata.platform || ""}
            />
          </div>
        </div>
      )}

      {investmentType === "business" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Business Venture Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="Ownership Percentage"
              id="ownership"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              defaultValue={metadata.ownership || ""}
            />
            <FormInput
              label="Industry"
              id="industry"
              placeholder="Technology, Retail, etc."
              defaultValue={metadata.industry || ""}
            />
            <FormInput
              label="Annual Revenue (optional)"
              id="annualRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={metadata.annualRevenue || ""}
            />
          </div>
        </div>
      )}

      {investmentType === "domain" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Domain Name Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="Domain Name"
              id="domainName"
              placeholder="example.com"
              required
              defaultValue={metadata.domainName || ""}
            />
            <FormInput
              label="Registrar"
              id="registrar"
              placeholder="GoDaddy, Namecheap, etc."
              defaultValue={metadata.registrar || ""}
            />
            <FormInput label="Expiry Date" id="expiryDate" type="date" defaultValue={metadata.expiryDate || ""} />
          </div>
        </div>
      )}

      {investmentType === "collectible" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Collectible Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="Category"
              id="category"
              placeholder="Art, Cards, Antiques, etc."
              required
              defaultValue={metadata.category || ""}
            />
            <FormInput
              label="Condition"
              id="condition"
              placeholder="Mint, Good, Fair, etc."
              defaultValue={metadata.condition || ""}
            />
            <FormInput
              label="Authenticity"
              id="authenticity"
              placeholder="Certified, Uncertified, etc."
              defaultValue={metadata.authenticity || ""}
            />
          </div>
        </div>
      )}

      {investmentType === "intellectual_property" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Intellectual Property Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="IP Type"
              id="ipType"
              placeholder="Patent, Trademark, Copyright, etc."
              required
              defaultValue={metadata.ipType || ""}
            />
            <FormInput
              label="Registration Number"
              id="registrationNumber"
              placeholder="Registration or filing number"
              defaultValue={metadata.registrationNumber || ""}
            />
            <FormInput label="Expiry Date" id="expiryDate" type="date" defaultValue={metadata.expiryDate || ""} />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

