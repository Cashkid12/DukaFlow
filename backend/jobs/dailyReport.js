const cron = require('node-cron');
const Shop = require('../models/Shop');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { sendEmail } = require('../config/mail');

// Daily Report - 9:00 PM EAT (6:00 PM UTC)
const scheduleDailyReport = () => {
  cron.schedule('0 18 * * *', async () => {
    console.log('📊 Running Daily Report Job...');
    
    try {
      const shops = await Shop.find({ 'subscription.status': 'active' }).populate('owner');
      
      for (const shop of shops) {
        // Get today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sales = await Sale.find({
          shop: shop._id,
          createdAt: { $gte: today, $lt: tomorrow }
        });

        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        const transactionCount = sales.length;

        // Get low stock items
        const lowStockProducts = await Product.find({
          shop: shop._id,
          stock: { $lte: '$lowStockThreshold' }
        }).countDocuments();

        // Send email
        const html = `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #312E81;">DukaFlow Daily Report</h1>
            <h2 style="color: #1E293B;">${shop.name} - ${today.toLocaleDateString()}</h2>
            
            <div style="background: #FDE8E0; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h3 style="color: #C2410C; margin: 0;">Today's Summary</h3>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Total Sales:</strong> KSh ${totalSales.toLocaleString()}</p>
              <p style="font-size: 18px; margin: 10px 0;"><strong>Net Profit:</strong> KSh ${totalProfit.toLocaleString()}</p>
              <p style="font-size: 16px; margin: 10px 0;"><strong>Transactions:</strong> ${transactionCount}</p>
              <p style="font-size: 16px; margin: 10px 0;"><strong>Low Stock Items:</strong> ${lowStockProducts}</p>
            </div>
            
            <p style="color: #64748B; font-size: 14px;">View detailed analytics on your <a href="${process.env.CLIENT_URL}/dashboard">DukaFlow Dashboard</a></p>
          </div>
        `;

        await sendEmail({
          to: shop.owner.email,
          subject: `📊 Your Daily Report - ${shop.name}`,
          html,
        });
      }

      console.log('✅ Daily Report Job completed');
    } catch (error) {
      console.error(`❌ Error in Daily Report Job: ${error.message}`);
    }
  });
};

module.exports = scheduleDailyReport;
