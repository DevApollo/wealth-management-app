import { requireAuth } from "@/lib/auth"
import { getHouseholdById, getUserDefaultCurrency } from "@/lib/db"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { AddInvestmentForm } from "../components/add-investment-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CreateInvestmentPage({
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
  const defaultCurrency = await getUserDefaultCurrency(user.id)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Investments", href: `/households/${householdId}/investments` },
          { label: "Add Investment", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Add Investment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Investment</CardTitle>
          <CardDescription>Add a new investment to your household portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <AddInvestmentForm householdId={householdId} defaultCurrency={defaultCurrency} />
        </CardContent>
      </Card>
    </div>
  )
}

