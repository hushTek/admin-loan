"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import { Activity, CreditCard, Banknote, Users, AlertTriangle, TrendingUp, TrendingDown, Wallet, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page () { 
    const { t } = useLanguage()
    const metrics = useQuery(api.analytics.getDashboardMetrics)
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
    const [selectedChart, setSelectedChart] = useState<string | null>(null)

    if (!metrics) {
        return <div className="p-8 text-center">{t.dashboard?.common?.loading || "Loading..."}</div>
    }

    const { overview, charts, breakdown } = metrics

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleCardClick = (metric: string) => {
        setSelectedMetric(metric)
    }

    const handleChartClick = (chart: string) => {
        setSelectedChart(chart)
    }

    const renderChartDetails = () => {
        if (!selectedChart) return null;

        if (selectedChart === "revenue") {
            return (
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">Income</TableHead>
                                <TableHead className="text-right">Expense</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {charts.revenue.map((item: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(item.income)}</TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">{formatCurrency(item.expense)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )
        }

        if (selectedChart === "growth") {
            return (
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">New Loans</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {charts.loanGrowth.map((item: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right font-medium">{item.loans}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )
        }
    }

    const renderDrawerContent = () => {
        switch (selectedMetric) {
            case "liquidity":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.accounts || "Accounts Breakdown"}</h3>
                        <div className="grid gap-2">
                            {breakdown?.accounts.map((acc: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{acc.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{acc.type.replace("_", " ")}</span>
                                    </div>
                                    <span className="font-bold text-emerald-600">{formatCurrency(acc.balance)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            case "activeLoans":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.loanStatus || "Loan Status Distribution"}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                                <span className="block text-2xl font-bold text-blue-600">{breakdown?.loanStatus.active}</span>
                                <span className="text-sm text-muted-foreground">{t.dashboard?.loans?.status?.active || "Active"}</span>
                            </div>
                            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                                <span className="block text-2xl font-bold text-green-600">{breakdown?.loanStatus.completed}</span>
                                <span className="text-sm text-muted-foreground">{t.dashboard?.loans?.status?.completed || "Completed"}</span>
                            </div>
                            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                                <span className="block text-2xl font-bold text-red-600">{breakdown?.loanStatus.defaulted}</span>
                                <span className="text-sm text-muted-foreground">{t.dashboard?.loans?.status?.defaulted || "Defaulted"}</span>
                            </div>
                            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20 text-center">
                                <span className="block text-2xl font-bold text-gray-600">{breakdown?.loanStatus.total}</span>
                                <span className="text-sm text-muted-foreground">{t.dashboard?.overview?.totalLoans || "Total Loans"}</span>
                            </div>
                        </div>
                    </div>
                )
            case "risk":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg text-red-600">{t.dashboard?.overview?.risk || "Portfolio Risk Analysis"}</h3>
                        <p className="text-sm text-muted-foreground">
                            Current default rate is <span className="font-bold text-foreground">{overview.defaultRate.toFixed(1)}%</span>. 
                            This is calculated based on the ratio of defaulted loans to total loans.
                        </p>
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/10">
                            <div className="flex justify-between mb-2">
                                <span>Defaulted Loans</span>
                                <span className="font-bold">{breakdown?.loanStatus.defaulted}</span>
                            </div>
                            <div className="w-full bg-red-200 rounded-full h-2.5 dark:bg-red-900/50">
                                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${Math.min(overview.defaultRate, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                )
            case "portfolio":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.portfolio || "Portfolio Breakdown"}</h3>
                        <div className="grid gap-4">
                            <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                                <span className="block text-sm text-muted-foreground">Total Principal</span>
                                <span className="block text-xl font-bold">{formatCurrency(metrics.portfolio.totalPrincipal)}</span>
                            </div>
                            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <span className="block text-sm text-muted-foreground">Expected Interest</span>
                                <span className="block text-xl font-bold">{formatCurrency(metrics.portfolio.totalInterest)}</span>
                            </div>
                            <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <span className="block text-sm text-muted-foreground">Total Payable</span>
                                <span className="block text-xl font-bold">{formatCurrency(metrics.portfolio.totalPayable)}</span>
                            </div>
                        </div>
                    </div>
                )
            case "disbursed":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.totalDisbursed || "Disbursement Summary"}</h3>
                        <div className="p-4 border rounded-lg">
                            <span className="block text-sm text-muted-foreground">Total Principal Disbursed</span>
                            <span className="block text-2xl font-bold">{formatCurrency(overview.totalDisbursed)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            This represents the total amount of principal capital that has been released to borrowers.
                        </p>
                    </div>
                )
            case "repaid":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.totalRepaid || "Repayment Summary"}</h3>
                        <div className="p-4 border rounded-lg">
                            <span className="block text-sm text-muted-foreground">Total Repayments Collected</span>
                            <span className="block text-2xl font-bold text-green-600">{formatCurrency(overview.totalRepayments)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            This includes all principal and interest payments received from borrowers.
                        </p>
                    </div>
                )
            case "pending":
                return (
                    <div className="space-y-4 px-6">
                        <h3 className="font-semibold text-lg">{t.dashboard?.overview?.pendingApps || "Pending Applications"}</h3>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20 text-center">
                                <span className="block text-4xl font-bold text-orange-600">{overview.pendingApplications}</span>
                                <span className="text-sm text-muted-foreground">Applications Awaiting Action</span>
                            </div>
                            <Button asChild className="w-full">
                                <Link href="/applications">
                                    View Applications <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold mb-2">{t.dashboard?.nav?.dashboard || "Dashboard Overview"}</h1>
                <p className="text-muted-foreground">{t.dashboard?.overview?.subtitle || "Comprehensive financial reports and loan portfolio analytics."}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground w-full mb-1 uppercase tracking-wider">{t.dashboard?.overview?.quickActions || "Quick Actions"}</h3>
                <Button size="sm" className="gap-2" asChild>
                    <Link href="/applications">
                        <CheckCircle className="h-4 w-4" /> {t.dashboard?.overview?.approveApps || "Approve Applications"}
                    </Link>
                </Button>
                <Button size="sm" variant="secondary" className="gap-2" asChild>
                    <Link href="/loans">
                        <AlertTriangle className="h-4 w-4" /> {t.dashboard?.overview?.viewDetails || "Follow up Defaults"}
                    </Link>
                </Button>
                <Button size="sm" variant="outline" className="gap-2" asChild>
                    <Link href="/transactions">
                        <Banknote className="h-4 w-4" /> {t.dashboard?.overview?.recordExpense || "Record Expense"}
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("liquidity")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.dashboard?.overview?.liquidity || "Total Liquidity"}</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(overview.totalLiquidity)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t.dashboard?.overview?.liquidityDesc || "Available across all accounts"}</p>
                    </CardContent>
                </Card>

                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("activeLoans")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.dashboard?.overview?.activeLoans || "Active Loans"}</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.activeLoans}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {overview.pendingApplications} {t.dashboard?.overview?.pendingApps || "pending applications"}
                        </p>
                    </CardContent>
                </Card>

                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("portfolio")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.dashboard?.overview?.portfolio || "Outstanding Portfolio"}</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(overview.totalOutstanding)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t.dashboard?.overview?.portfolioDesc || "Principal + Interest Expected"}</p>
                    </CardContent>
                </Card>

                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("risk")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t.dashboard?.overview?.risk || "Portfolio Risk"}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.defaultRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">{t.dashboard?.overview?.riskDesc || "Default Rate (Loans)"}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card 
                    className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("disbursed")}
                 >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard?.overview?.totalDisbursed || "Total Disbursed"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xl font-bold">{formatCurrency(overview.totalDisbursed)}</span>
                         </div>
                    </CardContent>
                </Card>
                <Card 
                    className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("repaid")}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard?.overview?.totalRepaid || "Total Repaid"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xl font-bold text-green-600">{formatCurrency(overview.totalRepayments)}</span>
                         </div>
                    </CardContent>
                </Card>
                 <Card 
                    className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleCardClick("pending")}
                 >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard?.overview?.pendingApps || "Pending Approval"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            <span className="text-xl font-bold text-orange-600">{overview.pendingApplications}</span>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card 
                    className="col-span-1 cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleChartClick("revenue")}
                >
                    <CardHeader>
                        <CardTitle>{t.dashboard?.overview?.incomeExpense || "Income vs Expenses"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.revenue}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `${value / 1000}k`} 
                                    />
                                    <Tooltip 
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                        cursor={{ fill: 'var(--muted)' }}
                                    />
                                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    className="col-span-1 cursor-pointer hover:bg-muted/50 transition-colors active:scale-95 duration-200"
                    onClick={() => handleChartClick("growth")}
                >
                    <CardHeader>
                        <CardTitle>{t.dashboard?.overview?.growth || "Loan Portfolio Growth"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.loanGrowth}>
                                    <defs>
                                        <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ stroke: 'var(--foreground)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="loans" 
                                        name="New Loans" 
                                        stroke="#3b82f6" 
                                        fillOpacity={1} 
                                        fill="url(#colorLoans)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Sheet open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{t.dashboard?.overview?.viewDetails || "Metric Details"}</SheetTitle>
                        <SheetDescription>
                            {t.dashboard?.overview?.subtitle || "Detailed breakdown of the selected metric."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {renderDrawerContent()}
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline">{t.dashboard?.common?.cancel || "Close"}</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet open={!!selectedChart} onOpenChange={(open) => !open && setSelectedChart(null)}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedChart === "revenue" 
                                ? (t.dashboard?.overview?.incomeExpense || "Income vs Expenses")
                                : (t.dashboard?.overview?.growth || "Loan Portfolio Growth")
                            }
                        </SheetTitle>
                        <SheetDescription>
                            {t.dashboard?.overview?.subtitle || "Detailed data view."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {renderChartDetails()}
                    </div>
                    <SheetFooter>
                        <SheetClose asChild>
                            <Button variant="outline">{t.dashboard?.common?.cancel || "Close"}</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}