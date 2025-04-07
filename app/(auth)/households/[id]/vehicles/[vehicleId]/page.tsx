import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getHouseholdById, getHouseholdMembers, getVehicleById } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency, CURRENCIES } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Pencil, User, Calendar } from "lucide-react"
import Link from "next/link"
import { DeleteVehicleButton } from "@/components/delete-vehicle-button"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string; vehicleId: string }
}) {
  const user = await requireAuth()
  const householdId = Number.parseInt(params.id)
  const vehicleId = Number.parseInt(params.vehicleId)

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

  // Get vehicle details
  const vehicle = await getVehicleById(vehicleId)
  if (!vehicle || vehicle.household_id !== householdId) {
    notFound()
  }

  // Get currency info
  const currencyCode = vehicle.currency || "USD"
  const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES] || CURRENCIES.USD

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Vehicles", href: `/households/${householdId}/vehicles` },
          { label: `${vehicle.model} (${vehicle.year})`, isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {vehicle.model} ({vehicle.year})
          </h1>
          <p className="text-muted-foreground">Vehicle in {household.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/households/${householdId}/vehicles/${vehicleId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteVehicleButton vehicleId={vehicleId} vehicleModel={vehicle.model} householdId={householdId} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>Information about this vehicle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Model</h3>
                <p className="text-xl font-semibold">{vehicle.model}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Year</h3>
                <p className="text-xl font-semibold">{vehicle.year}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sale Price</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(vehicle.sale_price, currencyCode as any)}
                  <span className="text-sm text-muted-foreground ml-2">({currencyInfo.name})</span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Maintenance Costs</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(vehicle.maintenance_costs, currencyCode as any)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
                <p className="text-xl font-semibold">
                  {formatCurrency(
                    Number(vehicle.sale_price || 0) + Number(vehicle.maintenance_costs || 0),
                    currencyCode as any,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Added by {vehicle.created_by_name}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Added on {formatDate(vehicle.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

