import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getPassiveIncomeById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar } from "lucide-react"
import Link from "next/link"
import { DeletePassiveIncomeButton } from "@/components/delete-passive-income-button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Badge } from "@/components/ui/badge"

export default async function PassiveIncomeDetailPage({
  params,
}: {
  params: { id: string; incomeId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const incomeId = Number.parseInt(params.incomeId)

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

  // Get passive income details
  const passiveIncome = await getPassiveIncomeById(incomeId)
  if (!passiveIncome || passiveIncome.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = passiveIncome.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

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

  // Calculate monthly and annual amounts
  let monthlyAmount = 0
  let annualAmount = 0

  if (passiveIncome.frequency === "monthly") {
    monthlyAmount = Number(passiveIncome.amount)
    annualAmount = monthlyAmount * 12
  } else if (passiveIncome.frequency === "annually") {
    annualAmount = Number(passiveIncome.amount)
    monthlyAmount = annualAmount / 12
  } else if (passiveIncome.frequency === "quarterly") {
    annualAmount = Number(passiveIncome.amount) * 4
    monthlyAmount = annualAmount / 12
  } else if (passiveIncome.frequency === "weekly") {
    monthlyAmount = Number(passiveIncome.amount) * 4.33
    annualAmount = Number(passiveIncome.amount) * 52
  } else if (passiveIncome.frequency === "bi-weekly") {
    monthlyAmount = Number(passiveIncome.amount) * 2.17
    annualAmount = Number(passiveIncome.amount) * 26
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
          { label: "Passive Income", href: `/households/${householdId}/passive-income` },
          { label: passiveIncome.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{passiveIncome.name}</h1>
          <p className="text-muted-foreground">Passive income in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/passive-income/${incomeId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeletePassiveIncomeButton
            passiveIncomeId={incomeId}
            passiveIncomeName={passiveIncome.name}
            householdId={householdId}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income Details</CardTitle>
            <CardDescription>Information about this passive income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passiveIncome.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-line">{passiveIncome.description}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Amount per {getFrequencyText(passiveIncome.frequency).toLowerCase()}
                </h3>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(passiveIncome.amount, currencyCode as any)}
                  <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Frequency</h3>
                <p className="text-lg font-semibold">{getFrequencyText(passiveIncome.frequency)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monthly Income</h3>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(monthlyAmount, currencyCode as any)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Annual Income</h3>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(annualAmount, currencyCode as any)}
                </p>
              </div>

              {passiveIncome.category && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <Badge className={getCategoryBadgeClass(passiveIncome.category)} variant="outline">
                    {passiveIncome.category}
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tax Status</h3>
                <p className="text-lg">
                  {passiveIncome.is_taxable ? (
                    <span className="text-amber-600">Taxable income</span>
                  ) : (
                    <span className="text-green-600">Tax-free income</span>
                  )}
                </p>
              </div>

              {passiveIncome.start_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                  <p className="text-lg">{formatDate(passiveIncome.start_date)}</p>
                </div>
              )}

              {passiveIncome.end_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                  <p className="text-lg">{formatDate(passiveIncome.end_date)}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {passiveIncome.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(passiveIncome.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

