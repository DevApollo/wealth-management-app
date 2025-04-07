import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getHouseholdById,
  getHouseholdMembers,
  getPassiveIncomeByHouseholdId,
  getUserDefaultCurrency,
  getCurrencyRate,
} from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatCurrency, convertCurrency, CURRENCIES, type CurrencyCode } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, DollarSign, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function PassiveIncomePage({
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

  // Get household members
  const members = await getHouseholdMembers(householdId)

  // Check if user is a member of this household
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    notFound()
  }

  // Get user's default currency
  const defaultCurrency = (await getUserDefaultCurrency(user.id)) as CurrencyCode

  // Get passive income
  const passiveIncomes = await getPassiveIncomeByHouseholdId(householdId)

  // Convert amounts to default currency
  const convertedIncomes = await Promise.all(
    passiveIncomes.map(async (income: any) => {
      const fromCurrency = income.currency as CurrencyCode
      const rate = await getCurrencyRate(fromCurrency, defaultCurrency)
      const conversionRate = rate ? rate.rate : 1

      return {
        ...income,
        convertedAmount: convertCurrency(Number(income.amount), conversionRate),
      }
    }),
  )

  // Calculate monthly and yearly totals in default currency
  const monthlyTotal = convertedIncomes.reduce((total: number, income: any) => {
    if (income.frequency === "monthly") {
      return total + Number(income.convertedAmount)
    } else if (income.frequency === "annually") {
      return total + Number(income.convertedAmount) / 12
    } else if (income.frequency === "quarterly") {
      return total + Number(income.convertedAmount) / 3
    } else if (income.frequency === "weekly") {
      return total + Number(income.convertedAmount) * 4.33 // Average weeks per month
    } else if (income.frequency === "bi-weekly") {
      return total + Number(income.convertedAmount) * 2.17 // Average bi-weeks per month
    } else {
      return total
    }
  }, 0)

  const yearlyTotal = convertedIncomes.reduce((total: number, income: any) => {
    if (income.frequency === "annually") {
      return total + Number(income.convertedAmount)
    } else if (income.frequency === "monthly") {
      return total + Number(income.convertedAmount) * 12
    } else if (income.frequency === "quarterly") {
      return total + Number(income.convertedAmount) * 4
    } else if (income.frequency === "weekly") {
      return total + Number(income.convertedAmount) * 52 // Weeks per year
    } else if (income.frequency === "bi-weekly") {
      return total + Number(income.convertedAmount) * 26 // Bi-weeks per year
    } else {
      return total
    }
  }, 0)

  // Group passive incomes by category
  const categorizedIncomes: Record<string, any[]> = {}

  passiveIncomes.forEach((income: any) => {
    const category = income.category || "Uncategorized"
    if (!categorizedIncomes[category]) {
      categorizedIncomes[category] = []
    }
    categorizedIncomes[category].push(income)
  })

  // Helper function to get frequency display text
  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly"
      case "annually":
        return "Annually"
      case "quarterly":
        return "Quarterly"
      case "weekly":
        return "Weekly"
      case "bi-weekly":
        return "Bi-Weekly"
      default:
        return frequency.charAt(0).toUpperCase() + frequency.slice(1)
    }
  }

  // Helper function to get category badge color
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case "disability":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      case "investment":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "rental":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pension":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "royalty":
        return "bg-pink-100 text-pink-800 hover:bg-pink-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Passive Income", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Passive Income</h1>
          <p className="text-muted-foreground">Manage passive income for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/passive-income/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Passive Income
          </Button>
        </Link>
      </div>

      {/* Passive Income Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>Total monthly passive income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(monthlyTotal, defaultCurrency)}
              <span className="text-sm ml-2 font-normal text-muted-foreground">
                ({CURRENCIES[defaultCurrency]?.name || defaultCurrency})
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Yearly Income</CardTitle>
            <CardDescription>Total yearly passive income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(yearlyTotal, defaultCurrency)}
              <span className="text-sm ml-2 font-normal text-muted-foreground">
                ({CURRENCIES[defaultCurrency]?.name || defaultCurrency})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {passiveIncomes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No passive income yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first passive income to get started</p>
            <Link href={`/households/${householdId}/passive-income/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Passive Income
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Display by category */}
          {Object.entries(categorizedIncomes).map(([category, incomes]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 capitalize">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {incomes.map((income: any) => (
                  <Link key={income.id} href={`/households/${householdId}/passive-income/${income.id}`}>
                    <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="mr-2">{income.name}</CardTitle>
                          {income.category && (
                            <Badge className={getCategoryBadgeClass(income.category)} variant="outline">
                              {income.category}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="truncate">{income.description || "No description"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(income.amount, income.currency)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>{getFrequencyText(income.frequency)}</span>
                          </div>
                          {income.is_taxable && <div className="text-xs text-amber-600">Taxable income</div>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

