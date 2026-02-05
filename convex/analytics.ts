import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    // 1. Loans Aggregation
    const loans = await ctx.db.query("loans").collect();
    
    let totalPrincipalDisbursed = 0;
    let totalOutstanding = 0;
    let totalInterestExpected = 0;
    let activeLoansCount = 0;
    let defaultedLoansCount = 0;
    let completedLoansCount = 0;

    const loansByMonth: Record<string, number> = {};

    loans.forEach(loan => {
      // Status Counts
      if (loan.status === "active") activeLoansCount++;
      if (loan.status === "defaulted") defaultedLoansCount++;
      if (loan.status === "completed") completedLoansCount++;

      // Financials
      totalPrincipalDisbursed += loan.principalAmount;
      totalOutstanding += loan.outstandingBalance;
      totalInterestExpected += loan.interestAmount;

      // Time series: Loans created by month
      const date = new Date(loan.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      loansByMonth[monthKey] = (loansByMonth[monthKey] || 0) + 1;
    });

    // 2. Transactions Aggregation
    const transactions = await ctx.db.query("transactions").collect();
    
    let totalRepayments = 0;
    let totalExpenses = 0;
    let totalIncome = 0;

    const incomeExpenseByMonth: Record<string, { income: number, expense: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!incomeExpenseByMonth[monthKey]) {
        incomeExpenseByMonth[monthKey] = { income: 0, expense: 0 };
      }

      if (tx.type === "repayment") {
        totalRepayments += tx.amount;
        incomeExpenseByMonth[monthKey].income += tx.amount;
      } else if (tx.type === "income") {
        totalIncome += tx.amount;
        incomeExpenseByMonth[monthKey].income += tx.amount;
      } else if (tx.type === "expense") {
        totalExpenses += tx.amount;
        incomeExpenseByMonth[monthKey].expense += tx.amount;
      }
    });

    // 3. Accounts Aggregation
    const accounts = await ctx.db.query("accounts").filter(q => q.eq(q.field("active"), true)).collect();
    const totalLiquidity = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 4. Applications Aggregation
    const applications = await ctx.db.query("loanApplications").collect();
    const pendingApplications = applications.filter(a => 
      a.status === "submitted" || 
      a.status === "under_review" || 
      a.status === "awaiting_referee"
    ).length;

    // 5. Format Chart Data
    // Sort keys to ensure chronological order
    const sortedMonths = Array.from(new Set([...Object.keys(loansByMonth), ...Object.keys(incomeExpenseByMonth)])).sort();
    
    const revenueChartData = sortedMonths.map(month => ({
      name: month,
      income: incomeExpenseByMonth[month]?.income || 0,
      expense: incomeExpenseByMonth[month]?.expense || 0,
    }));

    const loanGrowthChartData = sortedMonths.map(month => ({
        name: month,
        loans: loansByMonth[month] || 0
    }));

    return {
      overview: {
        activeLoans: activeLoansCount,
        pendingApplications,
        totalOutstanding,
        totalLiquidity,
        totalRepayments,
        totalDisbursed: totalPrincipalDisbursed,
        defaultRate: loans.length > 0 ? (defaultedLoansCount / loans.length) * 100 : 0,
      },
      breakdown: {
        accounts: accounts.map(a => ({ name: a.name, balance: a.balance, type: a.type })),
        loanStatus: {
            active: activeLoansCount,
            defaulted: defaultedLoansCount,
            completed: completedLoansCount,
            total: loans.length
        }
      },
      portfolio: {
        totalPrincipal: totalPrincipalDisbursed,
        totalInterest: totalInterestExpected,
        totalPayable: totalPrincipalDisbursed + totalInterestExpected,
      },
      charts: {
        revenue: revenueChartData,
        loanGrowth: loanGrowthChartData,
      }
    };
  },
});
