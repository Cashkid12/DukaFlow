const cron = require('node-cron');
const Shop = require('../models/Shop');
const Sale = require('../models/Sale');
const { sendEmail } = require('../config/mail');

// Weekly Report - Monday 8:00 AM EAT (5:00 AM UTC)
const scheduleWeeklyReport = () => {
  cron.schedule('0 5 * * 1', async () => {
    console.log('📈 Running Weekly Report Job...');
    
    try {
      const shops = await Shop.find({ 'subscription.status': 'active' }).populate('owner');
      
      for (const shop of shops) {
        // Get last week's sales
        const now = new Date();
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const sales = await Sale.find({
          shop: shop._id,
          createdAt: { $gte: lastWeek }
        }).sort({ createdAt: 1 });

        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        
        // Find best day
        const salesByDay = {};
        sales.forEach(sale => {
          const day = sale.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
          salesByDay[day] = (salesByDay[day] || 0) + sale.total;
        });

        const bestDay = Object.entries(salesByDay).sort((a, b) => b[1] - a[1])[0];
        const slowestDay = Object.entries(salesByDay).sort((a, b) => a[1] - b[1])[0];

        const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #312E81;">DukaFlow Weekly Report</h1>
            <h2 style="color: #1E293B;">${shop.name} - Last 7 Days</h2>
            
            <div style="background: #EEF2FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #312E81; margin: 0;">Week Summary</h3>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Total Sales:</strong> KSh ${totalSales.toLocaleString()}</p>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Net Profit:</strong> KSh ${totalProfit.toLocaleString()}</p>
              <p style="font-size: 16px; margin: 10px 0;"><strong>Best Day:</strong> ${bestDay ? bestDay[0] : 'N/A'} (KSh ${(bestDay ? bestDay[1] : 0).toLocaleString()})</p>
              <p style="font-size: 16px; margin: 10px 0;"><strong>Slowest Day:</strong> ${slowestDay ? slowestDay[0] : 'N/A'}</p>
            </div>
            
            <div style="background: #FDF2EC; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #C2410C; margin: 0;"><strong>💡 Tip:</strong> Consider running promotions on ${slowestDay ? slowestDay[0] : 'your slowest day'} to boost sales!</p>
            </div>
            
            <p style="color: #64748B; font-size: 14px;">View detailed analytics on your <a href="${process.env.CLIENT_URL}/dashboard">DukaFlow Dashboard</a></p>
          </div>
        `;

        await sendEmail({
          to: shop.owner.email,
          subject: `📈 Your Weekly Report - ${shop.name}`,
          html,
        });
      }

      console.log('✅ Weekly Report Job completed');
    } catch (error) {
      console.error(`❌ Error in Weekly Report Job: ${error.message}`);
    }
  });
};

module.exports = scheduleWeeklyReport;
