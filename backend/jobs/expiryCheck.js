const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// Expiry Check - Daily 8:00 AM EAT (5:00 AM UTC)
const scheduleExpiryCheck = () => {
  cron.schedule('0 5 * * *', async () => {
    console.log('🕐 Running Expiry Check Job...');
    
    try {
      const now = new Date();
      const thirtyDays = new Date(now);
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      
      const fourteenDays = new Date(now);
      fourteenDays.setDate(fourteenDays.getDate() + 14);
      
      const sevenDays = new Date(now);
      sevenDays.setDate(sevenDays.getDate() + 7);

      // Find products expiring in 30, 14, and 7 days
      const expiringProducts = await Product.find({
        expiryDate: {
          $lte: thirtyDays,
          $gte: now
        },
        isActive: true
      }).populate('shop');

      for (const product of expiringProducts) {
        const daysUntilExpiry = Math.ceil((product.expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Determine alert level
        let alertType = 'expiry';
        let urgency = '';
        
        if (daysUntilExpiry <= 7) {
          urgency = 'URGENT: ';
        } else if (daysUntilExpiry <= 14) {
          urgency = 'WARNING: ';
        }

        // Create notification
        await Notification.create({
          shop: product.shop._id,
          user: product.shop.owner,
          type: 'expiry',
          title: `${urgency}Product Expiring Soon`,
          message: `${product.name} expires in ${daysUntilExpiry} days (${product.expiryDate.toLocaleDateString()})`,
          link: `/dashboard/inventory?product=${product._id}`,
          metadata: { 
            productId: product._id.toString(),
            daysUntilExpiry 
          }
        });

        console.log(`  🕐 Expiry alert created for: ${product.name} (${daysUntilExpiry} days)`);
      }

      console.log('✅ Expiry Check Job completed');
    } catch (error) {
      console.error(`❌ Error in Expiry Check Job: ${error.message}`);
    }
  });
};

module.exports = scheduleExpiryCheck;
