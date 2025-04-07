import { requireAuth } from "@/lib/auth"
import { getUserByEmail, getHouseholdsByUserId, getCurrencyRates } from "@/lib/db"
import ClientSettingsPage from "./client-page"

export default async function SettingsPage() {
  const user = await requireAuth()

  // Get full user details
  const userDetails = await getUserByEmail(user.email)

  // Get user's households
  const households = await getHouseholdsByUserId(user.id)

  // Get currency rates
  const currencyRates = await getCurrencyRates()

  return <ClientSettingsPage user={userDetails} households={households} currencyRates={currencyRates} />
}

