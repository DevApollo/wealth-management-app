"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { createBankAccountAction } from "../actions"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function CreateBankAccountPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("householdId", params.id)
      formData.set("currency", currency)

      const result = await createBankAccountAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.bankAccount) {
        router.push(`/households/${params.id}/bank-accounts/${result.bankAccount.id}`)
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
          { label: "Bank Accounts", href: `/households/${params.id}/bank-accounts` },
          { label: "Add Bank Account", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Bank Account</CardTitle>
          <CardDescription>Add a new bank account to your household</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput label="Account Name" id="name" placeholder="Savings Account" required />
            <FormInput label="Bank Name" id="bankName" placeholder="Chase Bank" required />

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Amount" id="amount" type="number" placeholder="10000" required min="0" step="0.01" />

              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>
            </div>

            <FormInput
              label="Annual Interest Rate (%)"
              id="interestRate"
              type="number"
              placeholder="2.5"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Enter the annual interest rate as a percentage (e.g., 2.5 for 2.5%)
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/bank-accounts`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Add Bank Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

