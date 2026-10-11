"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR, formatINRFromUSD } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

const expenditureData = [
  { category: "Food", amount: 450, budget: 500 },
  { category: "Shopping", amount: 320, budget: 400 },
  { category: "Groceries", amount: 280, budget: 300 },
  { category: "Transport", amount: 150, budget: 200 },
  { category: "Entertainment", amount: 200, budget: 250 },
  { category: "Utilities", amount: 180, budget: 200 },
  { category: "Healthcare", amount: 120, budget: 150 },
  { category: "Other", amount: 170, budget: 200 },
]

const maxValue = 550

interface ExpenditureChartProps {
  transactions?: Transaction[]
}

export function ExpenditureChart({ transactions = [] }: ExpenditureChartProps) {
  const { data, dynamicMax } = useMemo(() => {
    if (transactions.length === 0) {
      const data = expenditureData.map((item) => ({
        ...item,
        amountDisplay: formatINRFromUSD(item.amount),
        budgetDisplay: formatINRFromUSD(item.budget),
        remainingDisplay: formatINRFromUSD(item.budget - item.amount),
      }))
      return { data, dynamicMax: maxValue }
    }

    const categoryMap = new Map<string, number>()
    transactions.forEach((t) => {
      if (t.amount > 0) {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount)
      }
    })

    const aggregated = Array.from(categoryMap.entries()).map(([category, amount]) => {
      const budget = amount * 1.15
      return {
        category,
        amount,
        budget,
        amountDisplay: formatINR(amount),
        budgetDisplay: formatINR(budget),
        remainingDisplay: formatINR(budget - amount),
      }
    })

    const dynamicMax = aggregated.length > 0 ? Math.max(...aggregated.map((d) => d.budget)) : maxValue

    return { data: aggregated, dynamicMax }
  }, [transactions])

  const max = dynamicMax
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenditure Analysis</CardTitle>
        <CardDescription>Spending by category compared to your budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => {
            const spentPercent = (item.amount / max) * 100
            const budgetPercent = (item.budget / max) * 100
            return (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-muted-foreground">
                    {item.amountDisplay} / {item.budgetDisplay}
                  </span>
                </div>
                <div className="flex gap-1 h-6 bg-muted rounded-md overflow-hidden">
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: `${spentPercent}%` }}
                    title={`Spent: ${item.amountDisplay}`}
                  />
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${budgetPercent - spentPercent}%` }}
                    title={`Remaining: ${item.remainingDisplay}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
