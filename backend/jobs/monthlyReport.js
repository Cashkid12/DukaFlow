const cron = require('node-cron');
const Shop = require('../models/Shop');
const Sale = require('../models/Product');
const { sendEmail } = require('../config/mail');

// Monthly Report - 1st of month 8:00 AM EAT (5:00 AM UTC)
const scheduleMonthlyReport = () => {
  cron.schedule('0 5 1 * *', async () => {
    console.log('💰 Running Monthly P&L Report Job...');
    
    try {
      const shops = await Shop.find({ 'subscription.status': 'active' }).populate('owner');
      
      for (const shop of shops) {
        // Get last month's sales
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const sales = await Sale.find({
          shop: shop._id,
          createdAt: { $gte: firstDayLastMonth, $lt: firstDayThisMonth }
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCOGS = sales.reduce((sum, sale) => {
          return sum + sale.items.reduce((itemSum, item) => itemSum + ((item.costPrice || 0) * item.quantity), 0);
        }, 0);
        const grossProfit = totalRevenue - totalCOGS;
        const totalExpenses = 0; // Would sum from Expense model
        const netProfit = grossProfit - totalExpenses;

        const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #312E81;">DukaFlow Monthly P&L Report</h1>
            <h2 style="color: #1E293B;">${shop.name} - ${firstDayLastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            
            <div style="background: #FDE8E0; padding: 25px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #C2410C; margin: 0 0 15px 0;">Profit & Loss Statement</h3>
              <div style="border-bottom: 2px solid #C2410C; padding-bottom: 10px; margin-bottom: 10px;">
                <p style="font-size: 16px; margin: 5px 0;"><strong>Revenue:</strong> KSh ${totalRevenue.toLocaleString()}</p>
                <p style="font-size: 16px; margin: 5px 0;"><strong>Cost of Goods Sold:</strong> -KSh ${totalCOGS.toLocaleString()}</p>
              </div>
              <p style="font-size: 18px; margin: 10px 0; color: #312E81;"><strong>Gross Profit:</strong> KSh ${grossProfit.toLocaleString()}</p>
              <p style="font-size: 16px; margin: 5px 0;"><strong>Expenses:</strong> -KSh ${totalExpenses.toLocaleString()}</p>
              <div style="border-top: 2px solid #C2410C; padding-top: 10px; margin-top: 10px;">
                <p style="font-size: 22px; margin: 10px 0; color: #C2410C;"><strong>Net Profit:</strong> KSh ${netProfit.toLocaleString()}</p>
              </div>
            </div>
            
            <p style="color: #64748B; font-size: 14px;">View detailed analytics on your <a href="${process.env.CLIENT_URL}/dashboard/reports?tab=monthly">DukaFlow Dashboard</a></p>
          </div>
        `;

        await sendEmail({
          to: shop.owner.email,
          subject: `💰 Monthly P&L Report - ${shop.name}`,
          html,
        });
      }

      console.log('✅ Monthly P&L Report Job completed');
    } catch (error) {
      console.error(`❌ Error in Monthly P&L Report Job: ${error.message}`);
    }
  });
};

module.exports = scheduleMonthlyReport;
