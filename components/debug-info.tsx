"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DebugInfoProps {
  data: any
  title?: string
}

export function DebugInfo({ data, title = "Debug Information" }: DebugInfoProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {isVisible && (
        <CardContent>
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      )}
    </Card>
  )
}

