import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardNav } from "@/components/dashboard-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <SidebarProvider>
    //  <AppSidebar />
    //  <SidebarInset>
    //    <main>{children}</main>
    //  </SidebarInset>
    // </SidebarProvider>
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <DashboardNav />
        <main className="flex-1">
            {children}
        </main>
    </div>
  )
}
