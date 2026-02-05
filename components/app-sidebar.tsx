"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  Landmark,
  Coins,
  LucideIcon,
  ArrowRightLeft,
  Banknote
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/components/language-provider"

interface Route {
  label: string
  icon: LucideIcon
  href: string
  color: string
  subRoutes?: Route[]
}

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const routes: Route[] = [
    {
      label: t.dashboard?.nav?.dashboard || "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      color: "text-sky-500",
    },
    {
      label: t.dashboard?.nav?.applications || "Applications",
      icon: FileText,
      href: "/applications",
      color: "text-violet-500",
    },
    {
      label: t.dashboard?.nav?.contacts || "Contacts",
      icon: Users,
      href: "/contacts",
      color: "text-pink-700",
    },
    {
      label: t.dashboard?.nav?.loans || "Loans",
      icon: CreditCard,
      href: "/loans",
      color: "text-orange-700",
    },
    {
      label: t.dashboard?.nav?.repayments || "Repayments",
      icon: Banknote,
      href: "/repayments",
      color: "text-emerald-500",
    },
    {
      label: t.dashboard?.nav?.transactions || "Transactions",
      icon: ArrowRightLeft,
      href: "/transactions",
      color: "text-cyan-500",
    },
    {
      label: t.dashboard?.nav?.settings || "Settings",
      icon: Settings,
      href: "/settings",
      color: "text-gray-500",
      subRoutes: [
        {
          label: t.dashboard?.nav?.loanTypes || "Loan Type",
          icon: Coins,
          href: "/settings/loan/types",
          color: "text-yellow-500",
        },
        {
          label: t.dashboard?.nav?.bankDetails || "Bank Details",
          icon: Landmark,
          href: "/settings/bank-details",
          color: "text-emerald-500",
        }
      ]
    },
  ]
  
  return (
    <Sidebar
      className="border-r-0"
      variant="sidebar"
      collapsible="icon"
      style={{
        "--sidebar-background": "#0f172a",
        "--sidebar-foreground": "#ffffff",
        "--sidebar-accent": "rgba(255, 255, 255, 0.1)",
        "--sidebar-accent-foreground": "#ffffff",
        "--sidebar-border": "transparent",
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
      } as React.CSSProperties}
    >
      <SidebarHeader className="bg-sidebar text-sidebar-foreground pt-4 pb-2 px-4">
        <Link href="/" className="flex items-center gap-2 pl-2">
            <div className="relative w-8 h-8 mr-2">
                <img src="/icon_only.png" alt="TFM Logo" className="w-full h-full rounded-full object-contain bg-white" />
            </div>
            <h1 className="text-xl font-bold truncate">
                Chap Chap
            </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-slate-900 text-white px-2">
        <SidebarMenu>
          {routes.map((route) => (
            <SidebarItem key={route.href} route={route} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="bg-slate-900 text-white p-4">
         <div className="flex items-center gap-3 pl-2">
            <UserButton afterSignOutUrl="/signin" />
            <span className="text-sm font-medium text-zinc-400 truncate">
                {t.dashboard?.nav?.profile || "My Account"}
            </span>
         </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarItem({ route, pathname }: { route: Route, pathname: string }) {
  const hasSubRoutes = route.subRoutes && route.subRoutes.length > 0;
  const isSubRouteActive = hasSubRoutes && route.subRoutes?.some((r) => r.href === pathname);
  const [isExpanded, setIsExpanded] = React.useState(isSubRouteActive);
  const { state } = useSidebar();

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  if (hasSubRoutes) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isSubRouteActive}
          onClick={toggleExpand}
          className={cn(
            "w-full justify-between hover:bg-white/10 hover:text-white text-zinc-400 data-[active=true]:bg-white/10 data-[active=true]:text-white transition-colors",
            isSubRouteActive ? "text-white bg-white/10" : ""
          )}
        >
            <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
            <span className="flex-1 text-left">{route.label}</span>
            {isExpanded ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
        </SidebarMenuButton>
        {isExpanded && (
          <SidebarMenuSub className="border-l-zinc-700 ml-6 pl-2 space-y-1 my-1">
            {route.subRoutes?.map((subRoute) => (
              <SidebarMenuSubItem key={subRoute.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === subRoute.href}
                  className={cn(
                    "w-full justify-start hover:bg-white/10 hover:text-white text-zinc-400 data-[active=true]:bg-white/10 data-[active=true]:text-white transition-colors cursor-pointer",
                    pathname === subRoute.href ? "text-white bg-white/10" : ""
                  )}
                >
                  <Link href={subRoute.href} className="flex items-center">
                    <subRoute.icon className={cn("h-5 w-5 mr-3", subRoute.color)} />
                    <span>{subRoute.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname === route.href}
        className={cn(
            "w-full justify-start hover:bg-white/10 hover:text-white text-zinc-400 data-[active=true]:bg-white/10 data-[active=true]:text-white transition-colors",
             pathname === route.href ? "text-white bg-white/10" : ""
        )}
      >
        <Link href={route.href}>
            <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
            <span>{route.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
