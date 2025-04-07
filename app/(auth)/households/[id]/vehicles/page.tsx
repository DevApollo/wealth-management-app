import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getHouseholdById, getHouseholdMembers, getVehiclesByHouseholdId } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatDate, formatCurrency } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Plus, Car } from "lucide-react"
import { Breadcrumbs } from "@/components/breadcrumbs"

export default async function VehiclesPage({
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

  // Get vehicles
  const vehicles = await getVehiclesByHouseholdId(householdId)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Households", href: "/households" },
          { label: household.name, href: `/households/${householdId}` },
          { label: "Vehicles", isCurrentPage: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicles for {household.name}</p>
        </div>
        <Link href={`/households/${householdId}/vehicles/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No vehicles yet</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">Add your first vehicle to get started</p>
            <Link href={`/households/${householdId}/vehicles/create`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle: any) => (
            <Link key={vehicle.id} href={`/households/${householdId}/vehicles/${vehicle.id}`}>
              <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle>
                    {vehicle.model} ({vehicle.year})
                  </CardTitle>
                  <CardDescription>
                    Added by {vehicle.created_by_name} on {formatDate(vehicle.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sale Price:</span>
                      <span className="font-medium">{formatCurrency(vehicle.sale_price, vehicle.currency)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Maintenance Costs:</span>
                      <span className="font-medium">{formatCurrency(vehicle.maintenance_costs, vehicle.currency)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Cost:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          Number(vehicle.sale_price || 0) + Number(vehicle.maintenance_costs || 0),
                          vehicle.currency,
                        )}
                      </span>
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

