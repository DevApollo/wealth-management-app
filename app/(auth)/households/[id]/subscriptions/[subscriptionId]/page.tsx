import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getSubscriptionById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { DeleteSubscriptionButton } from "@/components/delete-subscription-button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Badge } from "@/components/ui/badge"

export default async function SubscriptionDetailPage({
  params,
}: {
  params: { id: string; subscriptionId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const subscriptionId = Number.parseInt(params.subscriptionId)

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

  // Get subscription details
  const subscription = await getSubscriptionById(subscriptionId)
  if (!subscription || subscription.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = subscription.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

  // Helper function to get badge color based on priority
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Helper function to get billing cycle display text
  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case "monthly":
        return "Monthly"
      case "yearly":
        return "Yearly"
      case "weekly":
        return "Weekly"
      default:
        return cycle.charAt(0).toUpperCase() + cycle.slice(1)
    }
  }

  // Calculate annual cost
  const getAnnualCost = () => {
    const price = Number(subscription.price)
    switch (subscription.billing_cycle) {
      case "monthly":
        return price * 12
      case "yearly":
        return price
      case "weekly":
        return price * 52
      default:
        return price
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Subscriptions", href: `/households/${householdId}/subscriptions` },
          { label: subscription.name, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{subscription.name}</h1>
          <p className="text-muted-foreground">Subscription in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/subscriptions/${subscriptionId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteSubscriptionButton
            subscriptionId={subscriptionId}
            subscriptionName={subscription.name}
            householdId={householdId}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Information about this subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-line">{subscription.description}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(subscription.price, currencyCode as any)}
                  <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Billing Cycle</h3>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{getBillingCycleText(subscription.billing_cycle)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Annual Cost</h3>
                <p className="text-xl font-semibold">{formatCurrency(getAnnualCost(), currencyCode as any)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                <Badge className={getPriorityBadgeClass(subscription.priority)} variant="outline">
                  {subscription.priority.charAt(0).toUpperCase() + subscription.priority.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {subscription.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(subscription.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

