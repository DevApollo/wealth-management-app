import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getCreditById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar } from "lucide-react"
import Link from "next/link"
import { DeleteCreditButton } from "@/components/delete-credit-button"
import { Progress } from "@/components/ui/progress"

export default async function CreditDetailPage({
  params,
}: {
  params: { id: string; creditId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const creditId = Number.parseInt(params.creditId)

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

  // Get credit details
  const credit = await getCreditById(creditId)
  if (!credit || credit.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = credit.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

  // Calculate progress percentage
  const paidAmount = credit.total_amount - credit.remaining_amount
  const progressPercentage = (paidAmount / credit.total_amount) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{credit.name}</h1>
          <p className="text-muted-foreground">Credit in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/credits/${creditId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteCreditButton creditId={creditId} creditName={credit.name} householdId={householdId} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Details</CardTitle>
            <CardDescription>Information about this credit or liability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {credit.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-line">{credit.description}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(credit.total_amount, currencyCode as any)}
                  <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Remaining Amount</h3>
                <p className="text-xl font-semibold">{formatCurrency(credit.remaining_amount, currencyCode as any)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monthly Payment</h3>
                <p className="text-xl font-semibold">{formatCurrency(credit.monthly_payment, currencyCode as any)}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Paid: {formatCurrency(paidAmount, currencyCode as any)}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {credit.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(credit.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

