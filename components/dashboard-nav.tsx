"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Landmark,
  Coins,
  LucideIcon,
  ArrowRightLeft,
  Banknote,
  ChevronDown,
  Tag,
  Languages
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/language-provider"

interface Route {
  label: string
  icon: LucideIcon
  href: string
  color: string
  subRoutes?: Route[]
}

const routes: Route[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/applications",
    color: "text-violet-500",
  },
  {
    label: "Contacts",
    icon: Users,
    href: "/contacts",
    color: "text-pink-700",
  },
  {
    label: "Loans",
    icon: CreditCard,
    href: "/loans",
    color: "text-orange-700",
  },
  {
    label: "Repayments",
    icon: Banknote,
    href: "/repayments",
    color: "text-emerald-500",
  },
  {
    label: "Transactions",
    icon: ArrowRightLeft,
    href: "/transactions",
    color: "text-cyan-500",
  },
  {
    label: "Accounts",
    icon: Landmark,
    href: "/accounts",
    color: "text-emerald-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-gray-500",
    subRoutes: [
      {
        label: "Loan Type",
        icon: Coins,
        href: "/settings/loan/types",
        color: "text-yellow-500",
      },
      {
        label: "Categories",
        icon: Tag,
        href: "/settings/categories",
        color: "text-blue-500",
      },
      {
        label: "Bank Details",
        icon: Landmark,
        href: "/settings/bank-details",
        color: "text-emerald-500",
      }
    ]
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground border-b border-white/10 shadow-md z-50 relative">
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 mr-2 flex-shrink-0">
                    <img src="/icon_only.png" alt="TFM Logo" className="w-full h-full rounded-full object-contain bg-white" />
                </div>
                <h1 className="text-xl font-bold hidden lg:block">
                    Chap Chap
                </h1>
            </Link>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mx-4">
            {routes.map((route) => (
                <NavItem key={route.href} route={route} pathname={pathname} />
            ))}
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
             <button
                onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 transition-colors"
                title="Switch Language"
             >
                <Languages className="h-4 w-4" />
                <span className="uppercase">{language}</span>
             </button>
             <UserButton afterSignOutUrl="/signin" />
        </div>
    </nav>
  )
}

function NavItem({ route, pathname }: { route: Route, pathname: string }) {
    const hasSubRoutes = route.subRoutes && route.subRoutes.length > 0;
    const isSubRouteActive = hasSubRoutes && route.subRoutes?.some((r) => r.href === pathname);
    const isActive = pathname === route.href || isSubRouteActive;

    if (hasSubRoutes) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center gap-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10 hover:text-white outline-none focus:bg-white/10",
                            isActive ? "bg-white/10 text-white" : "text-primary-foreground/70"
                        )}
                    >
                        <route.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-white/70")} />
                        <span className="hidden md:inline">{route.label}</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-primary border-white/10 text-primary-foreground/70">
                    {route.subRoutes?.map((subRoute) => (
                        <DropdownMenuItem key={subRoute.href} asChild>
                            <Link
                                href={subRoute.href}
                                className={cn(
                                    "flex items-center gap-x-2 px-4 py-2 text-sm hover:bg-white/10 hover:text-white transition-colors cursor-pointer w-full focus:bg-white/10 focus:text-white",
                                    pathname === subRoute.href ? "text-white bg-white/5" : "text-primary-foreground/70"
                                )}
                            >
                                <subRoute.icon className={cn("h-4 w-4", pathname === subRoute.href ? "text-white" : "text-white/70")} />
                                {subRoute.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <Link
            href={route.href}
            className={cn(
                "flex items-center gap-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap",
                isActive ? "bg-white/10 text-white" : "text-primary-foreground/70"
            )}
        >
            <route.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-white/70")} />
            <span className="hidden md:inline">{route.label}</span>
        </Link>
    )
}
