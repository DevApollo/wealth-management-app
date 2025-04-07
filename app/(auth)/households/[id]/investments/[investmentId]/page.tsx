import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getHouseholdById, getInvestmentById } from "@/lib/db"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Pencil, Bitcoin, Briefcase, Globe, Palette, FileText } from "lucide-react"
import { DeleteInvestmentButton } from "@/components/delete-investment-button"
import { deleteInvestmentAction } from "../actions"

export default async function InvestmentDetailPage({
  params,
}: {
  params: { id: string; investmentId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const investmentId = Number.parseInt(params.investmentId)

  // Get household details
  const household = await getHouseholdById(householdId)
  if (!household) {
    notFound()
  }

  // Get investment details
  const investment = await getInvestmentById(investmentId)
  if (!investment) {
    notFound()
  }

  // Calculate gain/loss
  const currentValue = investment.current_value ? Number(investment.current_value) : Number(investment.amount)
  const purchaseAmount = Number(investment.amount)
  const gainLoss = currentValue - purchaseAmount
  const gainLossPercentage = purchaseAmount > 0 ? ((currentValue - purchaseAmount) / purchaseAmount) * 100 : 0

  // Helper function to get icon for investment type
  const getInvestmentIcon = (type: string) => {
    switch (type) {
      case "cryptocurrency":
        return <Bitcoin className="h-6 w-6" />
      case "business":
        return <Briefcase className="h-6 w-6" />
      case "domain":
        return <Globe className="h-6 w-6" />
      case "collectible":
        return <Palette className="h-6 w-6" />
      case "intellectual_property":
        return <FileText className="h-6 w-6" />
      default:
        return <Briefcase className="h-6 w-6" />
    }
  }

  // Helper function to format investment type name
  const formatTypeName = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Parse metadata
  const metadata = typeof investment.metadata === "string" ? JSON.parse(investment.metadata) : investment.metadata || {}

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Investments", href: `/households/${householdId}/investments` },
          { label: investment.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-primary/10 p-2">{getInvestmentIcon(investment.type)}</div>
          <h1 className="text-2xl font-bold tracking-tight">{investment.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/investments/${investmentId}/edit`}>
            <Button size="sm" variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Investment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Summary</CardTitle>
            <CardDescription>{formatTypeName(investment.type)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Purchase Amount</p>
                <p className="font-medium">{formatCurrency(purchaseAmount, investment.currency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="font-medium">{formatCurrency(currentValue, investment.currency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gain/Loss</p>
                <p className={`font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {gainLoss >= 0 ? "+" : ""}
                  {formatCurrency(gainLoss, investment.currency)} ({gainLossPercentage.toFixed(2)}%)
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {investment.purchase_date ? formatDate(investment.purchase_date) : "Not specified"}
                </p>
              </div>
            </div>

            {investment.description && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p>{investment.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type-specific Details */}
        <Card>
          <CardHeader>
            <CardTitle>{formatTypeName(investment.type)} Details</CardTitle>
          </CardHeader>
          <CardContent>
            {investment.type === "cryptocurrency" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ticker Symbol</p>
                    <p className="font-medium">{metadata.ticker || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{metadata.quantity || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Platform/Exchange</p>
                    <p className="font-medium">{metadata.platform || "Not specified"}</p>
                  </div>
                </div>
              </div>
            )}

            {investment.type === "business" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ownership Percentage</p>
                    <p className="font-medium">{metadata.ownership ? `${metadata.ownership}%` : "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="font-medium">{metadata.industry || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Annual Revenue</p>
                    <p className="font-medium">
                      {metadata.annualRevenue
                        ? formatCurrency(metadata.annualRevenue, investment.currency)
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {investment.type === "domain" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Domain Name</p>
                    <p className="font-medium">{metadata.domainName || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registrar</p>
                    <p className="font-medium">{metadata.registrar || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{metadata.expiryDate || "Not specified"}</p>
                  </div>
                </div>
              </div>
            )}

            {investment.type === "collectible" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{metadata.category || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium">{metadata.condition || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Authenticity</p>
                    <p className="font-medium">{metadata.authenticity || "Not specified"}</p>
                  </div>
                </div>
              </div>
            )}

            {investment.type === "intellectual_property" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">IP Type</p>
                    <p className="font-medium">{metadata.ipType || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{metadata.registrationNumber || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{metadata.expiryDate || "Not specified"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Added By</p>
              <p className="font-medium">{investment.created_by_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Added On</p>
              <p className="font-medium">{formatDate(investment.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{investment.updated_at ? formatDate(investment.updated_at) : "Never"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

