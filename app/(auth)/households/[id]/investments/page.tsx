import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getHouseholdById, getInvestmentsByHouseholdId, getUserDefaultCurrency, getCurrencyRate } from "@/lib/db"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, convertCurrency, formatDate, type CurrencyCode } from "@/lib/utils"
import { Plus, Bitcoin, Briefcase, Globe, Palette, FileText } from "lucide-react"
import { DeleteInvestmentButton } from "@/components/delete-investment-button"
import { deleteInvestmentAction } from "./actions"

export default async function InvestmentsPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)

  // Get household details
  const household = await getHouseholdById(householdId)
  if (!household) {
    notFound()
  }

  // Get user's default currency
  const defaultCurrency = (await getUserDefaultCurrency(user.id)) as CurrencyCode

  // Get investments
  const investments = await getInvestmentsByHouseholdId(householdId)

  // Calculate total investment value in default currency
  let totalInvestmentValue = 0
  let totalCurrentValue = 0

  for (const investment of investments) {
    const currency = investment.currency || "USD"
    const amount = Number(investment.amount)
    const currentValue = investment.current_value ? Number(investment.current_value) : amount

    if (currency === defaultCurrency) {
      totalInvestmentValue += amount
      totalCurrentValue += currentValue
    } else {
      const rate = await getCurrencyRate(currency, defaultCurrency)
      if (rate) {
        totalInvestmentValue += convertCurrency(amount, rate.rate)
        totalCurrentValue += convertCurrency(currentValue, rate.rate)
      } else {
        totalInvestmentValue += amount
        totalCurrentValue += currentValue
      }
    }
  }

  // Calculate total gain/loss
  const totalGainLoss = totalCurrentValue - totalInvestmentValue
  const gainLossPercentage =
    totalInvestmentValue > 0 ? ((totalCurrentValue - totalInvestmentValue) / totalInvestmentValue) * 100 : 0

  // Group investments by type
  const investmentsByType: Record<string, any[]> = {}

  investments.forEach((investment) => {
    const type = investment.type
    if (!investmentsByType[type]) {
      investmentsByType[type] = []
    }
    investmentsByType[type].push(investment)
  })

  // Helper function to get icon for investment type
  const getInvestmentIcon = (type: string) => {
    switch (type) {
      case "cryptocurrency":
        return <Bitcoin className="h-5 w-5" />
      case "business":
        return <Briefcase className="h-5 w-5" />
      case "domain":
        return <Globe className="h-5 w-5" />
      case "collectible":
        return <Palette className="h-5 w-5" />
      case "intellectual_property":
        return <FileText className="h-5 w-5" />
      default:
        return <Briefcase className="h-5 w-5" />
    }
  }

  // Helper function to format investment type name
  const formatTypeName = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Investments", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
        <Link href={`/households/${householdId}/investments/create`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
          <CardDescription>Overview of your investment portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">{formatCurrency(totalInvestmentValue, defaultCurrency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCurrentValue, defaultCurrency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gain/Loss</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totalGainLoss, defaultCurrency)}
                <span className="text-sm ml-1">({gainLossPercentage.toFixed(2)}%)</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments by Type */}
      {Object.keys(investmentsByType).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">You don't have any investments yet</p>
            <Link href={`/households/${householdId}/investments/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Investment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        Object.entries(investmentsByType).map(([type, investments]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-primary/10 p-2">{getInvestmentIcon(type)}</div>
                <div>
                  <CardTitle>{formatTypeName(type)}</CardTitle>
                  <CardDescription>{investments.length} investments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments.map((investment) => {
                  const currentValue = investment.current_value
                    ? Number(investment.current_value)
                    : Number(investment.amount)
                  const purchaseAmount = Number(investment.amount)
                  const gainLoss = currentValue - purchaseAmount
                  const gainLossPercentage =
                    purchaseAmount > 0 ? ((currentValue - purchaseAmount) / purchaseAmount) * 100 : 0

                  return (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/households/${householdId}/investments/${investment.id}`}
                          className="font-medium hover:underline"
                        >
                          {investment.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">Added {formatDate(investment.created_at)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(currentValue, investment.currency)}</p>
                          <p className={`text-sm ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {gainLoss >= 0 ? "+" : ""}
                            {formatCurrency(gainLoss, investment.currency)} ({gainLossPercentage.toFixed(2)}%)
                          </p>
                        </div>
                        <DeleteInvestmentButton
                          investmentId={investment.id}
                          investmentName={investment.name}
                          householdId={householdId}
                          onDelete={async (id) => {
                            return await deleteInvestmentAction(id, householdId)
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link href={`/households/${householdId}/investments/create`}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add {formatTypeName(type)}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}

