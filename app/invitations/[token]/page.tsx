"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui-components"
import { useRouter } from "next/navigation"

export default function InvitationPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/${params.token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to retrieve invitation")
        }

        setInvitation(data.invitation)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [params.token])

  async function handleAction(action: "accept" | "reject") {
    setProcessing(true)

    try {
      const response = await fetch(`/api/invitations/${params.token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`)
      }

      // Redirect to dashboard after successful action
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <p>Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert type="error" message={error || "This invitation is invalid or has expired"} />
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Household Invitation</CardTitle>
          <CardDescription>You have been invited to join a household</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="font-medium">Household:</p>
            <p>{invitation.household_name}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Invited by:</p>
            <p>{invitation.invited_by_name}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => handleAction("reject")} disabled={processing}>
            Decline
          </Button>
          <Button onClick={() => handleAction("accept")} disabled={processing}>
            {processing ? "Processing..." : "Accept Invitation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

