"use client"

import { IconTrendingDown, IconTrendingUp, IconWallet, IconPigMoney } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR, formatINRFromUSD } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

interface FinanceCardsProps {
  transactions?: Transaction[]
  totalIncome?: number
  totalExpense?: number
}

export function FinanceCards({ transactions = [], totalIncome = 0, totalExpense = 0 }: FinanceCardsProps) {
  const hasData = transactions.length > 0

  const bankBalance = hasData ? formatINR(totalIncome) : formatINRFromUSD(1435)
  const totalSpent = hasData ? formatINR(totalExpense) : formatINRFromUSD(963.86)
  const potentialSavings = hasData ? formatINR(totalIncome - totalExpense) : formatINRFromUSD(-361.4504)
  const budgetRemaining = formatINRFromUSD(1280)
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Bank Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{bankBalance}</CardTitle>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Badge variant="outline">
              <IconWallet className="size-4" />
              Available
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current account balance <IconWallet className="size-4" />
          </div>
          <div className="text-muted-foreground">Updated today</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Spent This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{totalSpent}</CardTitle>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Badge variant="outline">
              <IconTrendingDown />
              -5.2%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down from last month <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Good spending control</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Potential Savings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{potentialSavings}</CardTitle>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Badge variant="outline">
              <IconPigMoney className="size-4" />
              +18.4%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            AI-identified savings  <IconTrendingDown className="size-4" />

          </div>
          <div className="text-muted-foreground">Based on your patterns</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Budget Remaining</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{budgetRemaining}</CardTitle>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Badge variant="outline">
              <IconTrendingUp />
              65%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Of monthly budget <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">On track for the month</div>
        </CardFooter>
      </Card>
    </div>
  )
}
