import type React from "react"
import { FinanceHeader } from "@/components/finance-header"
import { FinanceCards } from "@/components/finance-cards"
import { ExpenditureChart } from "@/components/expenditure-chart"
import { SavingsSuggestions } from "@/components/savings-suggestions"
import { ExpenditureBreakdown } from "@/components/expenditure-breakdown"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <FinanceHeader />
              <FinanceCards />
              <div className="px-4 lg:px-6">
                <ExpenditureChart />
              </div>
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @2xl/main:grid-cols-2">
                <ExpenditureBreakdown />
                <SavingsSuggestions />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
