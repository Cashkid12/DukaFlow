const scheduleDailyReport = require('../jobs/dailyReport');
const scheduleWeeklyReport = require('../jobs/weeklyReport');
const scheduleMonthlyReport = require('../jobs/monthlyReport');
const scheduleLowStockCheck = require('../jobs/lowStockCheck');
const scheduleExpiryCheck = require('../jobs/expiryCheck');
const scheduleTrialExpiry = require('../jobs/trialExpiry');

// Initialize all cron jobs
const initializeCronJobs = () => {
  console.log('🕐 Initializing Cron Jobs...');
  
  scheduleDailyReport();
  console.log('  ✅ Daily Report scheduled (9:00 PM EAT)');
  
  scheduleWeeklyReport();
  console.log('  ✅ Weekly Report scheduled (Monday 8:00 AM EAT)');
  
  scheduleMonthlyReport();
  console.log('  ✅ Monthly P&L Report scheduled (1st of month 8:00 AM EAT)');
  
  scheduleLowStockCheck();
  console.log('  ✅ Low Stock Check scheduled (Every 2 hours)');
  
  scheduleExpiryCheck();
  console.log('  ✅ Expiry Check scheduled (Daily 8:00 AM EAT)');
  
  scheduleTrialExpiry();
  console.log('  ✅ Trial Expiry Check scheduled (Daily midnight)');
  
  console.log('🎉 All Cron Jobs Initialized Successfully');
};

module.exports = initializeCronJobs;
