import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdById, getHouseholdMembers, getStocksByHouseholdId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function StocksPage({
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

  // Get stocks
  const stocks = await getStocksByHouseholdId(householdId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Stocks", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
          <p className="text-muted-foreground">Manage stock investments for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/stocks/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        </Link>
      </div>

      {stocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No stocks yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first stock to get started</p>
            <Link href={`/households/${householdId}/stocks/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock: any) => {
            // Ensure we're working with numbers
            const numCurrentPrice = stock.current_price ? Number(stock.current_price) : null
            const numPurchasePrice = stock.purchase_price ? Number(stock.purchase_price) : null
            const numShares = Number(stock.shares)

            // Use current price if available, otherwise use purchase price
            const displayPrice = numCurrentPrice || numPurchasePrice

            // Calculate total value
            const totalValue = displayPrice ? displayPrice * numShares : null

            // Calculate gain/loss if both prices are available
            const gainLoss =
              numPurchasePrice && numCurrentPrice ? (numCurrentPrice - numPurchasePrice) * numShares : null

            // Calculate percentage gain/loss
            const percentChange =
              numPurchasePrice && numCurrentPrice
                ? ((numCurrentPrice - numPurchasePrice) / numPurchasePrice) * 100
                : null

            return (
              <Link key={stock.id} href={`/households/${householdId}/stocks/${stock.id}`} className="block">
                <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle>{stock.symbol}</CardTitle>
                    <CardDescription>{stock.company_name || "Stock Investment"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {displayPrice !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Price:</span>
                          <span className="font-medium">${displayPrice.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Shares:</span>
                        <span className="font-medium">{numShares.toLocaleString()}</span>
                      </div>

                      {totalValue !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Value:</span>
                          <span className="font-medium">${totalValue.toFixed(2)}</span>
                        </div>
                      )}

                      {gainLoss !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Gain/Loss:</span>
                          <span className={`font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {gainLoss >= 0 ? (
                              <TrendingUp className="inline mr-1 h-4 w-4" />
                            ) : (
                              <TrendingDown className="inline mr-1 h-4 w-4" />
                            )}
                            {gainLoss >= 0 ? "+" : ""}${Math.abs(gainLoss).toFixed(2)}
                            {percentChange !== null &&
                              ` (${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(2)}%)`}
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground mt-2">Added {formatDate(stock.created_at)}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

