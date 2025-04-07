import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import { login, requireGuest } from "@/lib/auth"
import { FormInput } from "@/components/ui-components"

export default async function LoginPage() {
  // Ensure user is not already logged in
  await requireGuest()

  async function handleLogin(formData: FormData) {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate inputs
    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    try {
      await login(email, password)
      redirect("/dashboard")
    } catch (error: any) {
      return { error: error.message || "Login failed" }
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Enter your email and password to sign in to your account</CardDescription>
        </CardHeader>
        <form action={handleLogin}>
          <CardContent className="space-y-4">
            <FormInput label="Email" id="email" type="email" placeholder="john@example.com" required />
            <FormInput label="Password" id="password" type="password" required />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

