import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdById, getHouseholdMembers, getBankAccountsByHouseholdId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, Landmark } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"

// Add a helper function to calculate monthly interest income
function calculateMonthlyInterestIncome(amount: number, annualInterestRate: number): number {
  // Convert annual rate to monthly and calculate interest
  return (amount * (annualInterestRate / 100)) / 12
}

export default async function BankAccountsPage({
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

  // Get bank accounts
  const bankAccounts = await getBankAccountsByHouseholdId(householdId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Bank Accounts", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage bank accounts for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/bank-accounts/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </Link>
      </div>

      {bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No bank accounts yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first bank account to get started</p>
            <Link href={`/households/${householdId}/bank-accounts/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((account: any) => (
            <Link key={account.id} href={`/households/${householdId}/bank-accounts/${account.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle>{account.name}</CardTitle>
                  <CardDescription>{account.bank_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-lg font-semibold">
                      {formatCurrency(account.amount, account.currency || "USD")}
                    </div>

                    {account.interest_rate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest Rate:</span>
                        <span>
                          {typeof account.interest_rate === "number" ? account.interest_rate.toFixed(2) : "0.00"}%
                        </span>
                      </div>
                    )}

                    {account.interest_rate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Income:</span>
                        <span className="text-green-600">
                          {formatCurrency(
                            calculateMonthlyInterestIncome(
                              account.amount,
                              typeof account.interest_rate === "number" ? account.interest_rate : 0,
                            ),
                            account.currency || "USD",
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Landmark className="mr-1 h-4 w-4" />
                      <span>Added {formatDate(account.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

