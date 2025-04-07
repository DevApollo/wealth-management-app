"use client"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import React from "react"

interface BreadcrumbItemProps {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItemProps[]
  homeHref?: string
}

export function Breadcrumbs({ items, homeHref = "/dashboard" }: BreadcrumbsProps) {
  const pathname = usePathname()

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={homeHref} className="flex items-center">
            <Home className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || "#"}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

