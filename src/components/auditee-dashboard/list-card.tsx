import React from "react"
import { Button } from "../ui/button.tsx" // Corrected import path

interface ListCardProps {
  title: string
  children: React.ReactNode
  viewAllLink?: string
  emptyMessage?: string
  emptyIcon?: React.ElementType
  className?: string // Added className prop
}

export function ListCard({
  title,
  children,
  viewAllLink,
  emptyMessage,
  emptyIcon: EmptyIcon,
  className,
}: ListCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm transition-all duration-300 hover:shadow-lg ${className}`}
    >
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1E293B]">{title}</h3>
        {viewAllLink && (
          <Button variant="link" className="text-[#003366] hover:text-[#004D99] text-sm font-medium p-0 h-auto">
            View All
          </Button>
        )}
      </div>
      <div className="p-6">
        {React.Children.count(children) === 0 ? (
          <div className="text-center py-8">
            {EmptyIcon && <EmptyIcon className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" />}
            <p className="text-[#64748B]">{emptyMessage || "No items found"}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
