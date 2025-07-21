import { Card } from "../../components/ui/Card.tsx"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { StatsCardProps } from "../../types/dashboard.ts"

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  return (
    <Card className="card-hover">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-full">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${Number.parseFloat(change) >= 0 ? "text-success" : "text-error"} flex items-center`}>
            {Number.parseFloat(change) >= 0 ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {change}
          </p>
        )}
      </div>
    </Card>
  )
}