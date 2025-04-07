import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import { register, requireGuest } from "@/lib/auth"
import { FormInput } from "@/components/ui-components"

export default async function RegisterPage() {
  // Ensure user is not already logged in
  await requireGuest()

  async function handleRegister(formData: FormData) {
    "use server"

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      return { error: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" }
    }

    try {
      await register(name, email, password)
      redirect("/dashboard")
    } catch (error: any) {
      return { error: error.message || "Registration failed" }
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <form action={handleRegister}>
          <CardContent className="space-y-4">
            <FormInput label="Name" id="name" placeholder="John Doe" required />
            <FormInput label="Email" id="email" type="email" placeholder="john@example.com" required />
            <FormInput label="Password" id="password" type="password" required />
            <FormInput label="Confirm Password" id="confirmPassword" type="password" required />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Create account
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

