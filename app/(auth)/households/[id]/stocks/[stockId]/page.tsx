import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getStockById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar, DollarSign, Percent } from "lucide-react"
import Link from "next/link"
import { DeleteStockButton } from "@/components/delete-stock-button"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function StockDetailPage({
  params,
}: {
  params: { id: string; stockId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const stockId = Number.parseInt(params.stockId)

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

  // Get stock details
  const stock = await getStockById(stockId)
  if (!stock || stock.household_id !== householdId) {
    notFound()
  }

  // Convert values to numbers to ensure they're numeric
  const numShares = Number(stock.shares)
  const numPurchasePrice = stock.purchase_price ? Number(stock.purchase_price) : null
  const numCurrentPrice = stock.current_price ? Number(stock.current_price) : null
  const numDividendYield = stock.dividend_yield ? Number(stock.dividend_yield) : null

  // Calculate annual dividend income if available
  let annualDividendIncome = null
  if (numDividendYield && numShares && numPurchasePrice) {
    // Calculate based on purchase price
    const totalValue = numShares * numPurchasePrice
    annualDividendIncome = (totalValue * numDividendYield) / 100
  }

  // Calculate total value and gain/loss
  const displayPrice = numCurrentPrice || numPurchasePrice
  const totalValue = displayPrice ? displayPrice * numShares : null

  // Only calculate gain/loss if both purchase price and current price are available
  const totalGainLoss = numPurchasePrice && numCurrentPrice ? (numCurrentPrice - numPurchasePrice) * numShares : null

  const percentGainLoss =
    numPurchasePrice && numCurrentPrice ? ((numCurrentPrice - numPurchasePrice) / numPurchasePrice) * 100 : null

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Stocks", href: `/households/${householdId}/stocks` },
          { label: stock.symbol, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{stock.symbol}</h1>
          <p className="text-muted-foreground">{stock.company_name || "Stock Investment"}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/stocks/${stockId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteStockButton stockId={stockId} stockSymbol={stock.symbol} householdId={householdId} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Details</CardTitle>
            <CardDescription>Information about this stock investment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Shares</h3>
                <p className="text-lg font-semibold">{numShares.toLocaleString()}</p>
              </div>

              {numCurrentPrice !== null && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
                  <p className="text-lg font-semibold">${numCurrentPrice.toFixed(2)}</p>
                </div>
              )}

              {numPurchasePrice !== null && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Purchase Price</h3>
                  <p className="text-lg font-semibold">${numPurchasePrice.toFixed(2)}</p>
                </div>
              )}

              {totalValue !== null && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                  <p className="text-lg font-semibold">${totalValue.toFixed(2)}</p>
                </div>
              )}

              {stock.purchase_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Purchase Date</h3>
                  <p className="text-lg font-semibold">{formatDate(stock.purchase_date)}</p>
                </div>
              )}

              {totalGainLoss !== null && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Gain/Loss</h3>
                  <p className={`text-lg font-semibold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {totalGainLoss >= 0 ? "+" : ""}${Math.abs(totalGainLoss).toFixed(2)}
                    {percentGainLoss !== null && ` (${percentGainLoss >= 0 ? "+" : ""}${percentGainLoss.toFixed(2)}%)`}
                  </p>
                </div>
              )}

              {numDividendYield && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Dividend Yield</h3>
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{numDividendYield.toFixed(2)}%</p>
                  </div>
                </div>
              )}

              {stock.dividend_frequency && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Dividend Frequency</h3>
                  <p className="text-lg font-semibold capitalize">{stock.dividend_frequency}</p>
                </div>
              )}

              {annualDividendIncome && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Annual Dividend Income</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    <p className="text-lg font-semibold text-green-600">${annualDividendIncome.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {stock.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="whitespace-pre-line">{stock.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {stock.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(stock.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

