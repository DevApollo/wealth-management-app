"use server"

import { getSession } from "@/lib/auth"
import {
  createSubscription,
  getHouseholdById,
  getHouseholdMembers,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from "@/lib/db"
import type { CurrencyCode } from "@/lib/utils"

// Create a new subscription
export async function createSubscriptionAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const householdId = Number(formData.get("householdId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const price = Number(formData.get("price"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const billingCycle = (formData.get("billingCycle") as string) || "monthly"
  const priority = (formData.get("priority") as string) || "medium"

  // Validate inputs
  if (!householdId || !name || isNaN(price)) {
    return { error: "All required fields must be filled" }
  }

  if (price <= 0) {
    return { error: "Price must be a positive number" }
  }

  // Check if the household exists
  const household = await getHouseholdById(householdId)
  if (!household) {
    return { error: "Household not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(householdId)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to add subscriptions to this household" }
  }

  try {
    const subscription = await createSubscription(
      householdId,
      name,
      description,
      price,
      currency,
      billingCycle,
      priority,
      user.id,
    )
    return { success: true, subscription }
  } catch (error: any) {
    return { error: error.message || "Failed to create subscription" }
  }
}

// Update an existing subscription
export async function updateSubscriptionAction(formData: FormData) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  const subscriptionId = Number(formData.get("subscriptionId"))
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const price = Number(formData.get("price"))
  const currency = (formData.get("currency") as CurrencyCode) || "USD"
  const billingCycle = (formData.get("billingCycle") as string) || "monthly"
  const priority = (formData.get("priority") as string) || "medium"

  // Validate inputs
  if (!subscriptionId || !name || isNaN(price)) {
    return { error: "All required fields must be filled" }
  }

  if (price <= 0) {
    return { error: "Price must be a positive number" }
  }

  // Get the subscription
  const subscription = await getSubscriptionById(subscriptionId)
  if (!subscription) {
    return { error: "Subscription not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(subscription.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to update this subscription" }
  }

  try {
    const updatedSubscription = await updateSubscription(
      subscriptionId,
      name,
      description,
      price,
      currency,
      billingCycle,
      priority,
    )
    return { success: true, subscription: updatedSubscription }
  } catch (error: any) {
    return { error: error.message || "Failed to update subscription" }
  }
}

// Delete a subscription
export async function deleteSubscriptionAction(subscriptionId: number) {
  const user = await getSession()
  if (!user) {
    return { error: "Authentication required" }
  }

  // Get the subscription
  const subscription = await getSubscriptionById(subscriptionId)
  if (!subscription) {
    return { error: "Subscription not found" }
  }

  // Check if the user is a member of this household
  const members = await getHouseholdMembers(subscription.household_id)
  const isMember = members.some((member: any) => member.id === user.id)
  if (!isMember) {
    return { error: "You do not have permission to delete this subscription" }
  }

  try {
    await deleteSubscription(subscriptionId)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete subscription" }
  }
}

