import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdById, getHouseholdMembers, getCreditsByHouseholdId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, CreditCard } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function CreditsPage({
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

  // Get credits
  const credits = await getCreditsByHouseholdId(householdId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Credits & Liabilities", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credits & Liabilities</h1>
          <p className="text-muted-foreground">Manage credits and liabilities for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/credits/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Credit
          </Button>
        </Link>
      </div>

      {credits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No credits or liabilities yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first credit or liability to get started</p>
            <Link href={`/households/${householdId}/credits/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Credit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credits.map((credit: any) => {
            // Calculate progress percentage
            const paidAmount = credit.total_amount - credit.remaining_amount
            const progressPercentage = (paidAmount / credit.total_amount) * 100

            return (
              <Link key={credit.id} href={`/households/${householdId}/credits/${credit.id}`}>
                <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <CardTitle>{credit.name}</CardTitle>
                    <CardDescription className="truncate">{credit.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total:</span>
                        <span className="font-medium">{formatCurrency(credit.total_amount, credit.currency)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining:</span>
                        <span className="font-medium">{formatCurrency(credit.remaining_amount, credit.currency)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Payment:</span>
                        <span className="font-medium">{formatCurrency(credit.monthly_payment, credit.currency)}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
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

