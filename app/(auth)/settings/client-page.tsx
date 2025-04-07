"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormInput, Alert } from "@/components/ui-components"
import Link from "next/link"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { updateUserProfile } from "./actions"
import { updateDefaultCurrency, updateExchangeRate } from "./currency-actions"
import { CurrencySelector } from "@/components/currency-selector"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw } from "lucide-react"

interface ClientSettingsPageProps {
  user: {
    id: number
    name: string
    email: string
    created_at: string
    default_currency: CurrencyCode
  }
  households: any[]
  currencyRates: Array<{
    id: number
    from_currency: CurrencyCode
    to_currency: CurrencyCode
    rate: number
  }>
}

export default function ClientSettingsPage({ user, households, currencyRates }: ClientSettingsPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(user.default_currency || "USD")
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD")
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("EUR")
  const [exchangeRate, setExchangeRate] = useState<string>("1.0")
  const [currencyFeedback, setCurrencyFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isUpdatingRate, setIsUpdatingRate] = useState(false)

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setFeedback(null)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await updateUserProfile(formData)

      if (result.error) {
        setFeedback({ type: "error", message: result.error })
      } else if (result.success) {
        setFeedback({ type: "success", message: result.message || "Profile updated successfully" })
        // Clear password fields
        const form = event.currentTarget as HTMLFormElement
        form.reset()
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: error.message || "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDefaultCurrencySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setCurrencyFeedback(null)

    try {
      const formData = new FormData()
      formData.append("defaultCurrency", defaultCurrency)

      const result = await updateDefaultCurrency(formData)

      if (result.error) {
        setCurrencyFeedback({ type: "error", message: result.error })
      } else if (result.success) {
        setCurrencyFeedback({ type: "success", message: result.message || "Default currency updated successfully" })
      }
    } catch (error: any) {
      setCurrencyFeedback({ type: "error", message: error.message || "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExchangeRateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdatingRate(true)
    setCurrencyFeedback(null)

    try {
      const formData = new FormData()
      formData.append("fromCurrency", fromCurrency)
      formData.append("toCurrency", toCurrency)
      formData.append("rate", exchangeRate)

      const result = await updateExchangeRate(formData)

      if (result.error) {
        setCurrencyFeedback({ type: "error", message: result.error })
      } else if (result.success) {
        setCurrencyFeedback({ type: "success", message: result.message || "Exchange rate updated successfully" })
        // Refresh the page to get updated rates
        window.location.reload()
      }
    } catch (error: any) {
      setCurrencyFeedback({ type: "error", message: error.message || "An unexpected error occurred" })
    } finally {
      setIsUpdatingRate(false)
    }
  }

  // Find the current rate for the selected currency pair
  const findRate = () => {
    const rate = currencyRates.find((r) => r.from_currency === fromCurrency && r.to_currency === toCurrency)
    return rate ? rate.rate.toString() : "1.0"
  }

  // Update exchange rate input when currencies change
  const handleCurrencyChange = () => {
    setExchangeRate(findRate())
  }

  // Helper function to safely format rate values
  const formatRate = (rate: any): string => {
    // Check if rate is a valid number
    if (rate === null || rate === undefined || isNaN(Number(rate))) {
      return "N/A"
    }

    try {
      return Number(rate).toFixed(6)
    } catch (error) {
      console.error("Error formatting rate:", error)
      return "Error"
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Settings", isCurrentPage: true }]} />

      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                {feedback && <Alert type={feedback.type} message={feedback.message} />}

                <FormInput label="Name" id="name" defaultValue={user.name} disabled />
                <FormInput label="Email" id="email" type="email" defaultValue={user.email} disabled />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p>{formatDate(user.created_at)}</p>
                </div>
                <div className="border p-4 rounded-md bg-muted/50">
                  <p className="text-sm font-medium">Change Password</p>
                  <div className="mt-4 space-y-4">
                    <FormInput label="Current Password" id="currentPassword" type="password" />
                    <FormInput label="New Password" id="newPassword" type="password" />
                    <FormInput label="Confirm New Password" id="confirmPassword" type="password" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="pt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Currency</CardTitle>
                <CardDescription>Set your preferred currency for the dashboard</CardDescription>
              </CardHeader>
              <form onSubmit={handleDefaultCurrencySubmit}>
                <CardContent className="space-y-4">
                  {currencyFeedback && <Alert type={currencyFeedback.type} message={currencyFeedback.message} />}

                  <div className="space-y-2">
                    <label htmlFor="defaultCurrency" className="text-sm font-medium">
                      Default Currency
                    </label>
                    <div className="max-w-xs">
                      <CurrencySelector value={defaultCurrency} onChange={setDefaultCurrency} id="defaultCurrency" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This currency will be used as the default for all calculations on the dashboard.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Save Default Currency"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exchange Rates</CardTitle>
                <CardDescription>Manage currency exchange rates for accurate calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleExchangeRateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label htmlFor="fromCurrency" className="text-sm font-medium">
                        From Currency
                      </label>
                      <CurrencySelector
                        value={fromCurrency}
                        onChange={(value) => {
                          setFromCurrency(value)
                          if (value !== fromCurrency) {
                            setTimeout(handleCurrencyChange, 0)
                          }
                        }}
                        id="fromCurrency"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="toCurrency" className="text-sm font-medium">
                        To Currency
                      </label>
                      <CurrencySelector
                        value={toCurrency}
                        onChange={(value) => {
                          setToCurrency(value)
                          if (value !== toCurrency) {
                            setTimeout(handleCurrencyChange, 0)
                          }
                        }}
                        id="toCurrency"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="rate" className="text-sm font-medium">
                        Exchange Rate
                      </label>
                      <div className="flex items-center space-x-2">
                        <FormInput
                          id="rate"
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCurrencyChange}
                          title="Refresh rate"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isUpdatingRate}>
                    {isUpdatingRate ? "Updating..." : "Update Exchange Rate"}
                  </Button>
                </form>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-2">Current Exchange Rates</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currencyRates.map((rate) => (
                          <TableRow key={`${rate.from_currency}-${rate.to_currency}`}>
                            <TableCell>
                              {CURRENCIES[rate.from_currency]?.symbol} {rate.from_currency}
                            </TableCell>
                            <TableCell>
                              {CURRENCIES[rate.to_currency]?.symbol} {rate.to_currency}
                            </TableCell>
                            <TableCell>{formatRate(rate.rate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="household" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Household Management</CardTitle>
              <CardDescription>Manage your household settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {households.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">You don't have any households yet.</p>
                  <Link href="/households/create">
                    <Button>Create Household</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {households.map((household: any) => (
                    <div key={household.id} className="border p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{household.name}</h3>
                          <p className="text-sm text-muted-foreground">Created {formatDate(household.created_at)}</p>
                        </div>
                        <Link href={`/households/${household.id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                    <Link href="/households/create">
                      <Button>Create Another Household</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

