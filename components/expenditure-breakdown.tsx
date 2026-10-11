"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatINR, formatINRFromUSD } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

const categories = [
  { name: "Food & Dining", spent: 450, budget: 500, percentage: 90 },
  { name: "Shopping", spent: 320, budget: 400, percentage: 80 },
  { name: "Groceries", spent: 280, budget: 300, percentage: 93 },
  { name: "Transport", spent: 150, budget: 200, percentage: 75 },
  { name: "Entertainment", spent: 200, budget: 250, percentage: 80 },
  { name: "Utilities", spent: 180, budget: 200, percentage: 90 },
  { name: "Healthcare", spent: 120, budget: 150, percentage: 80 },
  { name: "Other", spent: 170, budget: 200, percentage: 85 },
]

interface ExpenditureBreakdownProps {
  transactions?: Transaction[]
}

export function ExpenditureBreakdown({ transactions = [] }: ExpenditureBreakdownProps) {
  const data = useMemo(() => {
    if (transactions.length === 0) {
      return categories.map((c) => ({
        ...c,
        spentDisplay: formatINRFromUSD(c.spent),
        budgetDisplay: formatINRFromUSD(c.budget),
      }))
    }

    const categoryMap = new Map<string, number>()
    transactions.forEach((t) => {
      if (t.amount > 0) {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount)
      }
    })

    return Array.from(categoryMap.entries()).map(([name, spent]) => {
      const budget = spent * 1.15
      return {
        name,
        spent,
        budget,
        percentage: Math.round((spent / budget) * 100),
        spentDisplay: formatINR(spent),
        budgetDisplay: formatINR(budget),
      }
    })
  }, [transactions])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Detailed breakdown of your monthly expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-sm text-muted-foreground">
                {category.spentDisplay} / {category.budgetDisplay}
              </span>
            </div>
            <Progress value={category.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
