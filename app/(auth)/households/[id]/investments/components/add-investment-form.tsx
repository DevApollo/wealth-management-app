"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addInvestment } from "../actions"
import { InvestmentTypeSelector } from "@/components/investment-type-selector"
import { CurrencySelector } from "@/components/currency-selector"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import type { CurrencyCode } from "@/lib/utils"

interface AddInvestmentFormProps {
  householdId: number
  defaultCurrency: CurrencyCode
}

export function AddInvestmentForm({ householdId, defaultCurrency }: AddInvestmentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [investmentType, setInvestmentType] = useState("cryptocurrency")
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("type", investmentType)
      formData.set("currency", currency)

      await addInvestment(householdId, formData)
    } catch (err) {
      console.error("Error adding investment:", err)
      setError("Failed to add investment. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <Alert type="error" message={error} />}

      <div className="space-y-4">
        <Label>Investment Type</Label>
        <InvestmentTypeSelector value={investmentType} onChange={setInvestmentType} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput label="Investment Name" id="name" placeholder="Enter a name for this investment" required />

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <CurrencySelector id="currency" value={currency} onChange={(value) => setCurrency(value as CurrencyCode)} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput label="Purchase Amount" id="amount" type="number" step="0.01" placeholder="0.00" required />

        <FormInput label="Current Value (optional)" id="currentValue" type="number" step="0.01" placeholder="0.00" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormInput label="Purchase Date (optional)" id="purchaseDate" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" placeholder="Add details about this investment" rows={3} />
      </div>

      {/* Dynamic fields based on investment type */}
      {investmentType === "cryptocurrency" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Cryptocurrency Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput label="Ticker Symbol" id="ticker" placeholder="BTC" required />
            <FormInput label="Quantity" id="quantity" type="number" step="any" placeholder="0.00" required />
            <FormInput label="Platform/Exchange" id="platform" placeholder="Coinbase, Binance, etc." />
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
            />
            <FormInput label="Industry" id="industry" placeholder="Technology, Retail, etc." />
            <FormInput
              label="Annual Revenue (optional)"
              id="annualRevenue"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {investmentType === "domain" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Domain Name Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput label="Domain Name" id="domainName" placeholder="example.com" required />
            <FormInput label="Registrar" id="registrar" placeholder="GoDaddy, Namecheap, etc." />
            <FormInput label="Expiry Date" id="expiryDate" type="date" />
          </div>
        </div>
      )}

      {investmentType === "collectible" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Collectible Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput label="Category" id="category" placeholder="Art, Cards, Antiques, etc." required />
            <FormInput label="Condition" id="condition" placeholder="Mint, Good, Fair, etc." />
            <FormInput label="Authenticity" id="authenticity" placeholder="Certified, Uncertified, etc." />
          </div>
        </div>
      )}

      {investmentType === "intellectual_property" && (
        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
          <h3 className="font-medium">Intellectual Property Details</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <FormInput label="IP Type" id="ipType" placeholder="Patent, Trademark, Copyright, etc." required />
            <FormInput
              label="Registration Number"
              id="registrationNumber"
              placeholder="Registration or filing number"
            />
            <FormInput label="Expiry Date" id="expiryDate" type="date" />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Investment"}
        </Button>
      </div>
    </form>
  )
}

