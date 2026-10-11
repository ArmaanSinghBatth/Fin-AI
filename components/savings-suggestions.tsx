"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconBulb, IconTrendingDown, IconAlertCircle } from "@tabler/icons-react"
import { formatINR, formatINRFromUSD, usdToInr } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

const defaultSuggestions = [
  {
    id: 1,
    title: "Reduce Food Spending",
    description: `You're spending 90% of your food budget. Consider meal planning to save ${formatINRFromUSD(50)}/month.`,
    savingsUSD: 50,
    priority: "high",
    icon: IconTrendingDown,
  },
  {
    id: 2,
    title: "Optimize Shopping Habits",
    description: "Shopping expenses are at 80% of budget. Look for discounts and use cashback apps.",
    savingsUSD: 80,
    priority: "medium",
    icon: IconBulb,
  },
  {
    id: 3,
    title: "Review Subscriptions",
    description: "Check for unused subscriptions in your entertainment category.",
    savingsUSD: 30,
    priority: "medium",
    icon: IconAlertCircle,
  },
  {
    id: 4,
    title: "Carpool or Use Transit",
    description: `Transport costs are reasonable, but carpooling could save an additional ${formatINRFromUSD(25)}/month.`,
    savingsUSD: 25,
    priority: "low",
    icon: IconTrendingDown,
  },
]

interface SavingsSuggestionsProps {
  transactions?: Transaction[]
}

function getSuggestionForCategory(category: string, amount: number, rank: number) {
  const lower = category.toLowerCase()
  const savingsINR = Math.round(amount * 0.1)

  let title = `Reduce ${category} Spending`
  let description = `${category} expenses are significant at ${formatINR(amount)}. Review your spending to save ${formatINR(savingsINR)}/month.`
  let icon = IconBulb

  if (lower.includes("food") || lower.includes("dining") || lower.includes("restaurant")) {
    title = "Reduce Food & Dining Spending"
    description = `You're spending ${formatINR(amount)} on food. Consider meal planning and cooking at home to save ${formatINR(savingsINR)}/month.`
    icon = IconTrendingDown
  } else if (lower.includes("shop")) {
    title = "Optimize Shopping Habits"
    description = `Shopping expenses are ${formatINR(amount)}. Look for discounts, use cashback apps, and avoid impulse buys to save ${formatINR(savingsINR)}/month.`
    icon = IconBulb
  } else if (lower.includes("grocery")) {
    title = "Save on Groceries"
    description = `Groceries cost ${formatINR(amount)}. Buy in bulk, use shopping lists, and compare prices to save ${formatINR(savingsINR)}/month.`
    icon = IconTrendingDown
  } else if (lower.includes("transport") || lower.includes("travel") || lower.includes("fuel") || lower.includes("gas")) {
    title = "Reduce Transport Costs"
    description = `Transport spending is ${formatINR(amount)}. Consider carpooling or public transit to save ${formatINR(savingsINR)}/month.`
    icon = IconTrendingDown
  } else if (lower.includes("entertainment") || lower.includes("subscription")) {
    title = "Review Subscriptions"
    description = `Entertainment costs ${formatINR(amount)}. Cancel unused subscriptions to save ${formatINR(savingsINR)}/month.`
    icon = IconAlertCircle
  } else if (lower.includes("util") || lower.includes("electric") || lower.includes("water")) {
    title = "Lower Utility Bills"
    description = `Utilities cost ${formatINR(amount)}. Reduce energy and water usage to save ${formatINR(savingsINR)}/month.`
    icon = IconBulb
  } else if (lower.includes("health")) {
    title = "Healthcare Savings"
    description = `Healthcare costs ${formatINR(amount)}. Consider preventive care to save ${formatINR(savingsINR)}/month.`
    icon = IconAlertCircle
  }

  const priority = rank === 0 ? "high" : rank === 1 ? "medium" : "low"

  return { title, description, savingsINR, priority, icon }
}

export function SavingsSuggestions({ transactions = [] }: SavingsSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (transactions.length === 0) {
      return defaultSuggestions.map((s) => ({
        ...s,
        savingsINR: usdToInr(s.savingsUSD),
        savingsDisplay: formatINRFromUSD(s.savingsUSD),
      }))
    }

    const categoryMap = new Map<string, number>()
    transactions.forEach((t) => {
      if (t.amount > 0) {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount)
      }
    })

    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    return sorted.map(([category, amount], index) => {
      const { title, description, savingsINR, priority, icon } = getSuggestionForCategory(category, amount, index)
      return {
        id: index + 1,
        title,
        description,
        savingsINR,
        priority,
        icon,
        savingsDisplay: formatINR(savingsINR),
      }
    })
  }, [transactions])

  const totalSavingsINR = suggestions.reduce((sum, s) => sum + s.savingsINR, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Savings Recommendations</CardTitle>
        <CardDescription>Personalized suggestions to save {formatINR(totalSavingsINR)}/month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon
          return (
            <div key={suggestion.id} className="flex gap-3 rounded-lg border p-3">
              <div className="flex-shrink-0">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <Badge variant={suggestion.priority === "high" ? "default" : "secondary"}>{suggestion.savingsDisplay}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
