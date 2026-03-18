import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs daily at 05:00 UTC (~08:00 Africa/Dar es Salaam).
crons.cron("daily-loan-reminders", "0 5 * * *", internal.loanReminders.runDaily, {});

export default crons;

