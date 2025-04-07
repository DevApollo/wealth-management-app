"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FormInput } from "@/components/ui-components"
import { Alert } from "@/components/ui-components"
import { updateBankAccountAction } from "../../actions"
import { CurrencySelector } from "@/components/currency-selector"
import type { CurrencyCode } from "@/lib/utils"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default function EditBankAccountPage({
  params,
}: {
  params: { id: string; accountId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankAccount, setBankAccount] = useState<any>(null)
  const [isLoadingBankAccount, setIsLoadingBankAccount] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")

  useEffect(() => {
    async function fetchBankAccount() {
      try {
        const response = await fetch(`/api/bank-accounts/${params.accountId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch bank account")
        }
        const data = await response.json()
        setBankAccount(data.bankAccount)
        setCurrency(data.bankAccount.currency || "USD")
      } catch (error) {
        setError("Failed to load bank account details")
      } finally {
        setIsLoadingBankAccount(false)
      }
    }

    fetchBankAccount()
  }, [params.accountId])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.append("bankAccountId", params.accountId)
      formData.set("currency", currency)

      const result = await updateBankAccountAction(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push(`/households/${params.id}/bank-accounts/${params.accountId}`)
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingBankAccount) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading bank account details...</p>
      </div>
    )
  }

  if (!bankAccount && !isLoadingBankAccount) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <Alert type="error" message="Bank account not found or you don't have permission to edit it." />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push(`/households/${params.id}/bank-accounts`)}>
                Back to Bank Accounts
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
          { label: "Bank Accounts", href: `/households/${params.id}/bank-accounts` },
          { label: bankAccount.name, href: `/households/${params.id}/bank-accounts/${params.accountId}` },
          { label: "Edit", isCurrentPage: true },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Bank Account</CardTitle>
          <CardDescription>Update bank account details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert type="error" message={error} />}

            <FormInput
              label="Account Name"
              id="name"
              placeholder="Savings Account"
              required
              defaultValue={bankAccount?.name}
            />
            <FormInput
              label="Bank Name"
              id="bankName"
              placeholder="Chase Bank"
              required
              defaultValue={bankAccount?.bank_name}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Amount"
                id="amount"
                type="number"
                placeholder="10000"
                required
                min="0"
                step="0.01"
                defaultValue={bankAccount?.amount}
              />

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
              defaultValue={bankAccount?.interest_rate || 0}
            />
            <p className="text-xs text-muted-foreground">
              Enter the annual interest rate as a percentage (e.g., 2.5 for 2.5%)
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/households/${params.id}/bank-accounts/${params.accountId}`)}
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

